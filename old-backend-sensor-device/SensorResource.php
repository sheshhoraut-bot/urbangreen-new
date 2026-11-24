<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SensorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'zone_id' => $this->zone_id,
            'zone' => new \App\Http\Resources\ZoneResource($this->whenLoaded('zone')),
            'status' => $this->status,
            'battery_level' => $this->battery_level,
            'current_value' => $this->current_value,
            'unit' => $this->unit,
            'last_seen_at' => $this->last_seen_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}