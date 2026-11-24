<?php

namespace Database\Seeders;

use App\Models\PlantSpecies;
use Illuminate\Database\Seeder;

class PlantSpeciesSeeder extends Seeder
{
    public function run(): void
    {
        $species = [
            [
                'name' => 'Tomato',
                'scientific_name' => 'Solanum lycopersicum',
                'temp_min' => 18, 'temp_max' => 27,
                'humidity_min' => 50, 'humidity_max' => 70,
                'soil_moisture_min' => 60, 'soil_moisture_max' => 80,
                'ph_min' => 6.0, 'ph_max' => 6.8,
                'water_every_days' => 2,
                'care_notes' => 'Needs full sun and staking. Water at the base to keep leaves dry.',
            ],
            [
                'name' => 'Lettuce',
                'scientific_name' => 'Lactuca sativa',
                'temp_min' => 15, 'temp_max' => 22,
                'humidity_min' => 50, 'humidity_max' => 70,
                'soil_moisture_min' => 60, 'soil_moisture_max' => 80,
                'ph_min' => 6.0, 'ph_max' => 7.0,
                'water_every_days' => 2,
                'care_notes' => 'Prefers cool conditions and some afternoon shade. Harvest outer leaves first.',
            ],
            [
                'name' => 'Basil',
                'scientific_name' => 'Ocimum basilicum',
                'temp_min' => 20, 'temp_max' => 30,
                'humidity_min' => 40, 'humidity_max' => 60,
                'soil_moisture_min' => 50, 'soil_moisture_max' => 70,
                'ph_min' => 6.0, 'ph_max' => 7.5,
                'water_every_days' => 2,
                'care_notes' => 'Pinch off flower buds to keep leaves growing. Avoid soggy soil.',
            ],
            [
                'name' => 'Pechay',
                'scientific_name' => 'Brassica rapa subsp. chinensis',
                'temp_min' => 15, 'temp_max' => 25,
                'humidity_min' => 60, 'humidity_max' => 80,
                'soil_moisture_min' => 60, 'soil_moisture_max' => 80,
                'ph_min' => 6.0, 'ph_max' => 7.0,
                'water_every_days' => 2,
                'care_notes' => 'Fast growing, ready to harvest in about 30 days. Keep soil evenly moist.',
            ],
            [
                'name' => 'Chili Pepper',
                'scientific_name' => 'Capsicum annuum',
                'temp_min' => 20, 'temp_max' => 30,
                'humidity_min' => 50, 'humidity_max' => 70,
                'soil_moisture_min' => 50, 'soil_moisture_max' => 70,
                'ph_min' => 6.0, 'ph_max' => 6.8,
                'water_every_days' => 3,
                'care_notes' => 'Needs warmth and full sun. Let the top of the soil dry slightly between waterings.',
            ],
            [
                'name' => 'Eggplant',
                'scientific_name' => 'Solanum melongena',
                'temp_min' => 22, 'temp_max' => 30,
                'humidity_min' => 50, 'humidity_max' => 70,
                'soil_moisture_min' => 60, 'soil_moisture_max' => 80,
                'ph_min' => 5.5, 'ph_max' => 6.8,
                'water_every_days' => 3,
                'care_notes' => 'Heavy feeder. Support the stems once fruit starts to form.',
            ],
        ];

        foreach ($species as $item) {
            PlantSpecies::updateOrCreate(['name' => $item['name']], $item);
        }
    }
}