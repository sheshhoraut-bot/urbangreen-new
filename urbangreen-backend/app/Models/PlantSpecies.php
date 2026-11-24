<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlantSpecies extends Model
{
    protected $table = 'plant_species';

    protected $fillable = [
        'name', 'scientific_name',
        'temp_min', 'temp_max',
        'humidity_min', 'humidity_max',
        'soil_moisture_min', 'soil_moisture_max',
        'ph_min', 'ph_max',
        'water_every_days', 'care_notes',
    ];

    protected $casts = [
        'temp_min' => 'float',
        'temp_max' => 'float',
        'ph_min' => 'float',
        'ph_max' => 'float',
    ];
}