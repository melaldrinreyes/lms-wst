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
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('faculty_id');
            $table->unsignedBigInteger('course_id');
            $table->string('year_level'); // 1st Year, 2nd Year, 3rd Year, 4th Year
            $table->string('section'); // Section A, B, C, etc.
            $table->string('school_year'); // 2024-2025
            $table->string('semester'); // 1st Semester, 2nd Semester
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamps();

            $table->foreign('faculty_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
        });

        // Pivot table for students in classes
        Schema::create('class_student', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('student_id');
            $table->date('enrolled_date')->default(now());
            $table->enum('status', ['active', 'dropped', 'completed'])->default('active');
            $table->timestamps();

            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            
            // Ensure a student can only be in a class once
            $table->unique(['class_id', 'student_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_student');
        Schema::dropIfExists('classes');
    }
};
