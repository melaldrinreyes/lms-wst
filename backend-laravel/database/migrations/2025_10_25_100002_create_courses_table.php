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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('course_code', 20)->unique();
            $table->string('course_name', 200);
            $table->text('description')->nullable();
            $table->foreignId('faculty_id')->constrained('users')->onDelete('cascade');
            $table->integer('credits')->default(3);
            $table->string('semester', 20);
            $table->string('academic_year', 9);
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->string('thumbnail')->nullable();
            $table->timestamps();
            
            $table->index(['faculty_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
