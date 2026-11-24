<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plant_species', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('scientific_name')->nullable();
            $table->decimal('temp_min', 4, 1)->nullable();
            $table->decimal('temp_max', 4, 1)->nullable();
            $table->unsignedTinyInteger('humidity_min')->nullable();
            $table->unsignedTinyInteger('humidity_max')->nullable();
            $table->unsignedTinyInteger('soil_moisture_min')->nullable();
            $table->unsignedTinyInteger('soil_moisture_max')->nullable();
            $table->decimal('ph_min', 3, 1)->nullable();
            $table->decimal('ph_max', 3, 1)->nullable();
            $table->unsignedSmallInteger('water_every_days')->nullable();
            $table->text('care_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plant_species');
    }
};