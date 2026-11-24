<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSensorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:temperature,humidity,soil_moisture,light,ph'],
            'zone_id' => ['required', 'integer', 'exists:zones,id'],
            'status' => ['nullable', 'in:online,offline'],
            'battery_level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'unit' => ['nullable', 'string', 'max:20'],
        ];
    }
}