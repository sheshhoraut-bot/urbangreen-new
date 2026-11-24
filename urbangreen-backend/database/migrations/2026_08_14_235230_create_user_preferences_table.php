<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            $table->boolean('email_notifications')->default(true);
            $table->boolean('push_notifications')->default(true);
            $table->boolean('low_battery_alerts')->default(true);
            $table->boolean('critical_sensor_warnings')->default(true);
            $table->boolean('daily_reports')->default(false);
            $table->string('timezone')->default('UTC+8 (Manila)');
            $table->string('temperature_unit')->default('Celsius (°C)');
            $table->string('refresh_rate')->default('Every 5 seconds');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};