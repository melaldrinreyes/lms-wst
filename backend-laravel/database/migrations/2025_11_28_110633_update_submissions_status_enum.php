<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum to include 'rejected' status
        DB::statement("ALTER TABLE submissions MODIFY COLUMN status ENUM('pending', 'submitted', 'graded', 'returned', 'rejected') DEFAULT 'submitted'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to the original enum values
        DB::statement("ALTER TABLE submissions MODIFY COLUMN status ENUM('pending', 'submitted', 'graded', 'returned') DEFAULT 'submitted'");
    }
};
