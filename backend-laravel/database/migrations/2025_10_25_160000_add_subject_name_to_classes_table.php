<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            // Add subject_name column for manual entry
            $table->string('subject_name')->nullable()->after('course_id');
            
            // Make course_id nullable so it can be optional
            $table->unsignedBigInteger('course_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn('subject_name');
            $table->unsignedBigInteger('course_id')->nullable(false)->change();
        });
    }
};
