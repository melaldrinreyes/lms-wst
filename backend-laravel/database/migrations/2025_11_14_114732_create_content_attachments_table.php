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
        Schema::create('content_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_content_id')->constrained('course_content')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type'); // pdf, docx, xlsx, pptx, etc
            $table->bigInteger('file_size');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('restrict');
            $table->integer('download_count')->default(0);
            $table->timestamps();
            
            // Indexes
            $table->index('course_content_id');
            $table->index('uploaded_by');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_attachments');
    }
};
