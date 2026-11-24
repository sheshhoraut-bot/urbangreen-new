<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    private function format(Alert $alert): array
    {
        return [
            'id' => $alert->id,
            'type' => $alert->type,
            'message' => $alert->message,
            'severity' => $alert->severity,
            'is_read' => $alert->is_read,
            'related_type' => $alert->related_type,
            'related_id' => $alert->related_id,
            'created_at' => $alert->created_at->toIso8601String(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $alerts = Alert::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Alerts retrieved successfully',
            'data' => $alerts->map(fn ($a) => $this->format($a)),
            'unread_count' => Alert::where('user_id', $userId)->where('is_read', false)->count(),
        ]);
    }

    public function markRead(Request $request, Alert $alert): JsonResponse
    {
        if ($alert->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Not your notification', 'data' => []], 403);
        }

        $alert->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Marked as read',
            'data' => $this->format($alert),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Alert::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['success' => true, 'message' => 'All marked as read', 'data' => []]);
    }
}