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
        Schema::create('content_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_content_id')->constrained('course_content')->onDelete('cascade');
            $table->longText('content'); // Full HTML content at this version
            $table->string('change_description')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->integer('version_number');
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            
            // Indexes
            $table->index('course_content_id');
            $table->index('created_by');
            $table->index('version_number');
            $table->index('created_at');
            
            // Unique constraint
            $table->unique(['course_content_id', 'version_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_versions');
    }
};
