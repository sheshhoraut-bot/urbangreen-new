<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sensors', function (Blueprint $table) {
            $table->dropUnique('sensors_api_key_unique');
            $table->dropColumn('api_key');
        });
        Schema::table('devices', function (Blueprint $table) {
            $table->dropUnique('devices_api_key_unique');
            $table->dropColumn('api_key');
        });
    }

    public function down(): void
    {
        Schema::table('sensors', function (Blueprint $table) {
            $table->string('api_key', 64)->unique()->nullable();
        });
        Schema::table('devices', function (Blueprint $table) {
            $table->string('api_key', 64)->unique()->nullable();
        });
    }
};