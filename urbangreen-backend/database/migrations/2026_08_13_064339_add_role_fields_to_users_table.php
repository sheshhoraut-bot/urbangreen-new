<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'operator'])->default('operator')->after('email');
            $table->string('phone')->nullable()->after('role');
            $table->string('profile_picture')->nullable()->after('phone');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('profile_picture');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'phone', 'profile_picture', 'status']);
            $table->dropSoftDeletes();
        });
    }
};