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
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->string('module_title', 200);
            $table->text('description')->nullable();
            $table->integer('module_order')->default(0);
            $table->text('content')->nullable();
            $table->string('file_path')->nullable();
            $table->enum('status', ['published', 'draft'])->default('draft');
            $table->timestamps();
            
            $table->index(['course_id', 'module_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
