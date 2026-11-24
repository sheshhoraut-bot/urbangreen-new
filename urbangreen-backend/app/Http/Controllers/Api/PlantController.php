<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlantRequest;
use App\Http\Requests\UpdatePlantRequest;
use App\Http\Resources\PlantResource;
use App\Models\Plant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Plant::with('zone');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $plants = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Plants retrieved successfully',
            'data' => PlantResource::collection($plants),
            'meta' => [
                'current_page' => $plants->currentPage(),
                'last_page' => $plants->lastPage(),
                'total' => $plants->total(),
            ],
        ]);
    }

    public function water(Plant $plant): JsonResponse
    {
        $plant->update([
            'moisture' => 85,
            'status' => 'healthy',
            'last_watered_at' => now(),
        ]);
        $plant->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Plant watered successfully',
            'data' => new PlantResource($plant),
        ]);
    }
    public function store(StorePlantRequest $request): JsonResponse
    {
        $plant = Plant::create($request->validated());
        $plant->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Plant created successfully',
            'data' => new PlantResource($plant),
        ], 201);
    }

    public function show(Plant $plant): JsonResponse
    {
        $plant->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Plant retrieved successfully',
            'data' => new PlantResource($plant),
        ]);
    }

    public function update(UpdatePlantRequest $request, Plant $plant): JsonResponse
    {
        $plant->update($request->validated());
        $plant->load('zone');

        return response()->json([
            'success' => true,
            'message' => 'Plant updated successfully',
            'data' => new PlantResource($plant),
        ]);
    }

    public function destroy(Plant $plant): JsonResponse
    {
        $plant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Plant deleted successfully',
            'data' => [],
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        $plant = Plant::onlyTrashed()->findOrFail($id);
        $plant->restore();

        return response()->json([
            'success' => true,
            'message' => 'Plant restored successfully',
            'data' => new PlantResource($plant),
        ]);
    }
}