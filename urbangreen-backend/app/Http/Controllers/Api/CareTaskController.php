<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\CareTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CareTaskController extends Controller
{
    private const TYPES = ['watering', 'fertilizing', 'pruning', 'pest_check', 'harvesting', 'other'];

    private function format(CareTask $task): array
    {
        $task->loadMissing(['plant:id,name', 'zone:id,name', 'assignee:id,name']);

        return [
            'id' => $task->id,
            'title' => $task->title,
            'type' => $task->type,
            'notes' => $task->notes,
            'plant_id' => $task->plant_id,
            'plant' => $task->plant?->name,
            'zone_id' => $task->zone_id,
            'zone' => $task->zone?->name,
            'assigned_to' => $task->assigned_to,
            'assignee' => $task->assignee?->name,
            'due_date' => $task->due_date->toDateString(),
            'repeat_days' => $task->repeat_days,
            'status' => $task->status,
            'is_overdue' => $task->status === 'pending' && $task->due_date->lt(today()),
            'completed_at' => $task->completed_at?->toDateTimeString(),
        ];
    }

    private function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(self::TYPES)],
            'notes' => ['nullable', 'string'],
            'plant_id' => ['nullable', 'exists:plants,id'],
            'zone_id' => ['nullable', 'exists:zones,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'due_date' => ['required', 'date'],
            'repeat_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ];
    }

    private function notifyAssignee(CareTask $task): void
    {
        if (!$task->assigned_to) {
            return;
        }

        Alert::create([
            'user_id' => $task->assigned_to,
            'type' => 'task_assigned',
            'message' => "New task assigned: {$task->title} (due {$task->due_date->toDateString()})",
            'severity' => 'info',
            'related_type' => 'care_task',
            'related_id' => $task->id,
        ]);
    }

    private function adminOnly(Request $request): ?JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Only admins can do this', 'data' => []], 403);
        }
        return null;
    }

    /**
     * True when the same repeating task already has another pending copy,
     * so completing a task again can never stack duplicates.
     */
    private function pendingCopyExists(CareTask $task): bool
    {
        $query = CareTask::where('status', 'pending')
            ->where('id', '!=', $task->id)
            ->where('title', $task->title)
            ->where('type', $task->type)
            ->where('repeat_days', $task->repeat_days);

        foreach (['plant_id', 'zone_id', 'assigned_to'] as $column) {
            if ($task->{$column} === null) {
                $query->whereNull($column);
            } else {
                $query->where($column, $task->{$column});
            }
        }

        return $query->exists();
    }

    public function index(Request $request): JsonResponse
    {
        $query = CareTask::with(['plant:id,name', 'zone:id,name', 'assignee:id,name']);

        if ($request->user()->role !== 'admin') {
            $query->where('assigned_to', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $tasks = $query->orderBy('status')->orderBy('due_date')->get();

        return response()->json([
            'success' => true,
            'message' => 'Care tasks retrieved successfully',
            'data' => $tasks->map(fn ($t) => $this->format($t)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($denied = $this->adminOnly($request)) return $denied;

        $task = CareTask::create($request->validate($this->rules()));
        $this->notifyAssignee($task);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => $this->format($task),
        ], 201);
    }

    public function update(Request $request, CareTask $careTask): JsonResponse
    {
        if ($denied = $this->adminOnly($request)) return $denied;

        $previousAssignee = $careTask->assigned_to;
        $careTask->update($request->validate($this->rules()));

        if ($careTask->assigned_to && $careTask->assigned_to !== $previousAssignee) {
            $this->notifyAssignee($careTask);
        }

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => $this->format($careTask->fresh()),
        ]);
    }

    public function destroy(Request $request, CareTask $careTask): JsonResponse
    {
        if ($denied = $this->adminOnly($request)) return $denied;

        $careTask->delete();

        return response()->json(['success' => true, 'message' => 'Task deleted successfully', 'data' => []]);
    }

    public function complete(Request $request, CareTask $careTask): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $careTask->assigned_to !== $user->id) {
            return response()->json(['success' => false, 'message' => 'This task is not assigned to you', 'data' => []], 403);
        }

        if ($careTask->status === 'completed') {
            return response()->json(['success' => false, 'message' => 'Task is already completed', 'data' => []], 422);
        }

        $careTask->update([
            'status' => 'completed',
            'completed_at' => now(),
            'completed_by' => $user->id,
        ]);

        $message = 'Task completed';

        // Repeating task: schedule the next round, but never stack duplicates
        if ($careTask->repeat_days && !$this->pendingCopyExists($careTask)) {
            $nextDue = $careTask->due_date->copy()->addDays($careTask->repeat_days);

            // If the task was late, count the next round from today instead
            if ($nextDue->lte(today())) {
                $nextDue = today()->addDays($careTask->repeat_days);
            }

            $next = CareTask::create([
                'title' => $careTask->title,
                'type' => $careTask->type,
                'notes' => $careTask->notes,
                'plant_id' => $careTask->plant_id,
                'zone_id' => $careTask->zone_id,
                'assigned_to' => $careTask->assigned_to,
                'due_date' => $nextDue,
                'repeat_days' => $careTask->repeat_days,
            ]);
            $this->notifyAssignee($next);

            $message = 'Task completed. Next one is due ' . $nextDue->toDateString();
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $this->format($careTask->fresh()),
        ]);
    }
}