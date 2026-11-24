<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['water_pump', 'grow_lights', 'ventilation_fan', 'climate_control']);
            $table->foreignId('zone_id')->constrained('zones')->onDelete('restrict');
            $table->boolean('is_active')->default(false);
            $table->json('settings')->nullable();
            $table->string('api_key', 64)->unique()->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};