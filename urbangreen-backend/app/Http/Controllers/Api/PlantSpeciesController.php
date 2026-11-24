<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlantSpecies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlantSpeciesController extends Controller
{
    private function rules(?int $ignoreId = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('plant_species', 'name')->ignore($ignoreId)],
            'scientific_name' => ['nullable', 'string', 'max:255'],
            'temp_min' => ['nullable', 'numeric', 'between:-10,60'],
            'temp_max' => ['nullable', 'numeric', 'between:-10,60', 'gte:temp_min'],
            'humidity_min' => ['nullable', 'integer', 'between:0,100'],
            'humidity_max' => ['nullable', 'integer', 'between:0,100', 'gte:humidity_min'],
            'soil_moisture_min' => ['nullable', 'integer', 'between:0,100'],
            'soil_moisture_max' => ['nullable', 'integer', 'between:0,100', 'gte:soil_moisture_min'],
            'ph_min' => ['nullable', 'numeric', 'between:0,14'],
            'ph_max' => ['nullable', 'numeric', 'between:0,14', 'gte:ph_min'],
            'water_every_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'care_notes' => ['nullable', 'string'],
        ];
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Species retrieved successfully',
            'data' => PlantSpecies::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $species = PlantSpecies::create($request->validate($this->rules()));

        return response()->json([
            'success' => true,
            'message' => 'Species added successfully',
            'data' => $species,
        ], 201);
    }

    public function update(Request $request, PlantSpecies $species): JsonResponse
    {
        $species->update($request->validate($this->rules($species->id)));

        return response()->json([
            'success' => true,
            'message' => 'Species updated successfully',
            'data' => $species->fresh(),
        ]);
    }

    public function destroy(PlantSpecies $species): JsonResponse
    {
        $species->delete();

        return response()->json(['success' => true, 'message' => 'Species deleted successfully', 'data' => []]);
    }
}