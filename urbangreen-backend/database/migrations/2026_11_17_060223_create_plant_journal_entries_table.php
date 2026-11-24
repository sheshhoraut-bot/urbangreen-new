<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plant_journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plant_id')->constrained('plants')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('entry_date');
            $table->enum('growth_stage', ['seed', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'])->nullable();
            $table->decimal('height_cm', 6, 1)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_harvest')->default(false);
            $table->decimal('harvest_amount', 8, 2)->nullable();
            $table->string('harvest_unit', 20)->nullable();
            $table->timestamps();

            $table->index(['plant_id', 'entry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plant_journal_entries');
    }
};