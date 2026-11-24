<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE report_logs MODIFY COLUMN format ENUM('pdf', 'excel', 'csv') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE report_logs MODIFY COLUMN format ENUM('pdf', 'excel') NOT NULL");
    }
};