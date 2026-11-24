<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePlantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'species' => ['nullable', 'string', 'max:255'],
            'zone_id' => ['required', 'integer', 'exists:zones,id'],
            'status' => ['nullable', 'in:healthy,attention,critical'],
            'moisture' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'planted_date' => ['nullable', 'date'],
            'last_watered_at' => ['nullable', 'date'],
        ];
    }
}