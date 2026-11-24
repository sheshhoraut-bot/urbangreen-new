<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plant;
use App\Models\PlantJournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlantJournalController extends Controller
{
    private const STAGES = ['seed', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'];

    private function format(PlantJournalEntry $entry): array
    {
        $entry->loadMissing('user:id,name');

        return [
            'id' => $entry->id,
            'plant_id' => $entry->plant_id,
            'user_id' => $entry->user_id,
            'author' => $entry->user?->name,
            'entry_date' => $entry->entry_date->toDateString(),
            'growth_stage' => $entry->growth_stage,
            'height_cm' => $entry->height_cm,
            'notes' => $entry->notes,
            'is_harvest' => $entry->is_harvest,
            'harvest_amount' => $entry->harvest_amount,
            'harvest_unit' => $entry->harvest_unit,
        ];
    }

    private function rules(): array
    {
        return [
            'entry_date' => ['required', 'date'],
            'growth_stage' => ['nullable', Rule::in(self::STAGES)],
            'height_cm' => ['nullable', 'numeric', 'min:0', 'max:9999'],
            'notes' => ['nullable', 'string'],
            'is_harvest' => ['boolean'],
            'harvest_amount' => ['nullable', 'numeric', 'min:0'],
            'harvest_unit' => ['nullable', 'string', 'max:20'],
        ];
    }

    private function canModify(Request $request, PlantJournalEntry $entry): bool
    {
        $user = $request->user();

        return $user->role === 'admin' || $entry->user_id === $user->id;
    }

    public function index(Plant $plant): JsonResponse
    {
        $entries = PlantJournalEntry::with('user:id,name')
            ->where('plant_id', $plant->id)
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Journal retrieved successfully',
            'data' => $entries->map(fn ($e) => $this->format($e)),
        ]);
    }

    public function store(Request $request, Plant $plant): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['plant_id'] = $plant->id;
        $data['user_id'] = $request->user()->id;

        $entry = PlantJournalEntry::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Journal entry added',
            'data' => $this->format($entry),
        ], 201);
    }

    public function update(Request $request, PlantJournalEntry $entry): JsonResponse
    {
        if (!$this->canModify($request, $entry)) {
            return response()->json(['success' => false, 'message' => 'You can only edit your own entries', 'data' => []], 403);
        }

        $entry->update($request->validate($this->rules()));

        return response()->json([
            'success' => true,
            'message' => 'Journal entry updated',
            'data' => $this->format($entry->fresh()),
        ]);
    }

    public function destroy(Request $request, PlantJournalEntry $entry): JsonResponse
    {
        if (!$this->canModify($request, $entry)) {
            return response()->json(['success' => false, 'message' => 'You can only delete your own entries', 'data' => []], 403);
        }

        $entry->delete();

        return response()->json(['success' => true, 'message' => 'Journal entry deleted', 'data' => []]);
    }
}