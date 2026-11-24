<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDeviceRequest;
use App\Http\Requests\UpdateDeviceRequest;
use App\Http\Resources\DeviceResource;
use App\Models\Device;
use App\Models\DeviceLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Device::with('zone');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $devices = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Devices retrieved successfully',
            'data' => DeviceResource::collection($devices),
            'meta' => [
                'current_page' => $devices->currentPage(),
                'last_page' => $devices->lastPage(),
                'total' => $devices->total(),
            ],
        ]);
    }

    public function store(StoreDeviceRequest $request): JsonResponse
    {
        $device = Device::create($request->validated());
        $device->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Device created successfully',
            'data' => new DeviceResource($device),
        ], 201);
    }

    public function show(Device $device): JsonResponse
    {
        $device->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Device retrieved successfully',
            'data' => new DeviceResource($device),
        ]);
    }

    public function update(UpdateDeviceRequest $request, Device $device): JsonResponse
    {
        $device->update($request->validated());
        $device->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Device updated successfully',
            'data' => new DeviceResource($device),
        ]);
    }

    public function toggle(Request $request, Device $device): JsonResponse
    {
        $previousState = $device->is_active ? 'on' : 'off';
        $device->update(['is_active' => !$device->is_active]);
        $newState = $device->is_active ? 'on' : 'off';

        DeviceLog::create([
            'device_id' => $device->id,
            'user_id' => $request->user()->id,
            'action' => 'toggle',
            'previous_state' => $previousState,
            'new_state' => $newState,
        ]);

        $device->load('zone');

        return response()->json([
            'success' => true,
            'message' => "Device turned {$newState}",
            'data' => new DeviceResource($device),
        ]);
    }

    public function destroy(Device $device): JsonResponse
    {
        $device->delete();

        return response()->json([
            'success' => true,
            'message' => 'Device deleted successfully',
            'data' => [],
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        $device = Device::onlyTrashed()->findOrFail($id);
        $device->restore();

        return response()->json([
            'success' => true,
            'message' => 'Device restored successfully',
            'data' => new DeviceResource($device),
        ]);
    }

    public function deviceActivity(Request $request): JsonResponse
    {
        $query = \App\Models\DeviceLog::where('action', 'toggle')
            ->where('new_state', 'on')
            ->where('created_at', '>=', now()->startOfWeek());

        if ($request->filled('device_id')) {
            $query->where('device_id', $request->get('device_id'));
        } elseif ($request->filled('type')) {
            $type = $request->get('type');
            $query->whereHas('device', fn ($q) => $q->where('type', $type));
        }

        $activity = $query->get(['created_at']);

        $byDay = $activity->groupBy(fn ($log) => $log->created_at->format('D'))
            ->map(fn ($group) => $group->count());

        return response()->json([
            'success' => true,
            'message' => 'Device activity retrieved',
            'data' => $byDay,
        ]);
    }
}   