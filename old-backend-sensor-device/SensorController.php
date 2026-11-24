<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSensorRequest;
use App\Http\Requests\UpdateSensorRequest;
use App\Http\Resources\SensorResource;
use App\Models\Sensor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SensorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Sensor::with('zone');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sensors = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Sensors retrieved successfully',
            'data' => SensorResource::collection($sensors),
            'meta' => [
                'current_page' => $sensors->currentPage(),
                'last_page' => $sensors->lastPage(),
                'total' => $sensors->total(),
            ],
        ]);
    }

    public function store(StoreSensorRequest $request): JsonResponse
    {
        $sensor = Sensor::create($request->validated());
        $sensor->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Sensor created successfully',
            'data' => new SensorResource($sensor),
        ], 201);
    }

    public function show(Sensor $sensor): JsonResponse
    {
        $sensor->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Sensor retrieved successfully',
            'data' => new SensorResource($sensor),
        ]);
    }

    public function update(UpdateSensorRequest $request, Sensor $sensor): JsonResponse
    {
        $sensor->update($request->validated());
        $sensor->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Sensor updated successfully',
            'data' => new SensorResource($sensor),
        ]);
    }

    public function destroy(Sensor $sensor): JsonResponse
    {
        $sensor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sensor deleted successfully',
            'data' => [],
        ]);
    }

    public function recordReading(Request $request, Sensor $sensor): JsonResponse
    {
        $validated = $request->validate([
            'value' => ['required', 'numeric'],
        ]);

        $sensor->readings()->create([
            'value' => $validated['value'],
            'recorded_at' => now(),
        ]);

        $sensor->update([
            'current_value' => $validated['value'],
            'status' => 'online',
            'last_seen_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reading recorded successfully',
            'data' => [],
        ], 201);
    }

    public function readingsHistory(Request $request): JsonResponse
    {
        $hours = $request->get('hours', 24);

        $query = \App\Models\SensorReading::where('recorded_at', '>=', now()->subHours($hours));

        if ($request->filled('sensor_id')) {
            $query->where('sensor_id', $request->get('sensor_id'));
        } elseif ($request->filled('type')) {
            $type = $request->get('type');
            $query->whereHas('sensor', fn ($q) => $q->where('type', $type));
        }

        $readings = $query->orderBy('recorded_at')->get(['sensor_id', 'value', 'recorded_at']);

        return response()->json([
            'success' => true,
            'message' => 'Readings retrieved successfully',
            'data' => $readings,
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        $sensor = Sensor::onlyTrashed()->findOrFail($id);
        $sensor->restore();

        return response()->json([
            'success' => true,
            'message' => 'Sensor restored successfully',
            'data' => new SensorResource($sensor),
        ]);
    }

    public function toggleStatus(Sensor $sensor): JsonResponse
    {
        $newStatus = $sensor->status === 'online' ? 'offline' : 'online';
        $sensor->update(['status' => $newStatus]);
        $sensor->load('zone');

        return response()->json([
            'success' => true,
            'message' => "Sensor marked {$newStatus}",
            'data' => new SensorResource($sensor),
        ]);
    }
}