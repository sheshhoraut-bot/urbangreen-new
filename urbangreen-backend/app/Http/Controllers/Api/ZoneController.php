<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreZoneRequest;
use App\Http\Requests\UpdateZoneRequest;
use App\Http\Resources\ZoneResource;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZoneController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Zone::withCount('plants');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $zones = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Zones retrieved successfully',
            'data' => ZoneResource::collection($zones),
            'meta' => [
                'current_page' => $zones->currentPage(),
                'last_page' => $zones->lastPage(),
                'total' => $zones->total(),
            ],
        ]);
    }

    public function store(StoreZoneRequest $request): JsonResponse
    {
        $zone = Zone::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Zone created successfully',
            'data' => new ZoneResource($zone),
        ], 201);
    }

    public function show(Zone $zone): JsonResponse
    {
        $zone->loadCount('plants');

        return response()->json([
            'success' => true,
            'message' => 'Zone retrieved successfully',
            'data' => new ZoneResource($zone),
        ]);
    }

    public function update(UpdateZoneRequest $request, Zone $zone): JsonResponse
    {
        $zone->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Zone updated successfully',
            'data' => new ZoneResource($zone),
        ]);
    }

    public function destroy(Zone $zone): JsonResponse
    {
        $zone->delete();

        return response()->json([
            'success' => true,
            'message' => 'Zone deleted successfully',
            'data' => [],
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        $zone = Zone::onlyTrashed()->findOrFail($id);
        $zone->restore();

        return response()->json([
            'success' => true,
            'message' => 'Zone restored successfully',
            'data' => new ZoneResource($zone),
        ]);
    }
}