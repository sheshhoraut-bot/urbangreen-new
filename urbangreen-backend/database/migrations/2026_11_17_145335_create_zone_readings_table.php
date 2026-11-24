<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zone_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zone_id')->constrained('zones')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('recorded_at');
            $table->decimal('temperature', 4, 1)->nullable();
            $table->unsignedTinyInteger('humidity')->nullable();
            $table->unsignedTinyInteger('soil_moisture')->nullable();
            $table->decimal('ph', 3, 1)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['zone_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zone_readings');
    }
};