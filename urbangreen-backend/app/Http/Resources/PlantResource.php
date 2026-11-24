<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\ZoneResource;

class PlantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'species' => $this->species,
            'zone_id' => $this->zone_id,
            'zone' => new ZoneResource($this->whenLoaded('zone')),
            'status' => $this->status,
            'moisture' => $this->moisture,
            'planted_date' => $this->planted_date,
            'last_watered_at' => $this->last_watered_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}