<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'plants_count' => $this->whenCounted('plants'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}