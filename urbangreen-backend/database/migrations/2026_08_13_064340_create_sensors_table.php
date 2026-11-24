<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['temperature', 'humidity', 'soil_moisture', 'light', 'ph']);
            $table->foreignId('zone_id')->constrained('zones')->onDelete('restrict');
            $table->enum('status', ['online', 'offline'])->default('offline');
            $table->unsignedTinyInteger('battery_level')->default(100);
            $table->string('current_value')->nullable();
            $table->string('unit')->nullable();
            $table->string('api_key', 64)->unique()->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensors');
    }
};