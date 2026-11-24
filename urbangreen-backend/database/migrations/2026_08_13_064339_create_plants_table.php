<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('species')->nullable();
            $table->foreignId('zone_id')->constrained('zones')->onDelete('restrict');
            $table->enum('status', ['healthy', 'attention', 'critical'])->default('healthy');
            $table->decimal('moisture', 5, 2)->nullable();
            $table->date('planted_date')->nullable();
            $table->timestamp('last_watered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plants');
    }
};