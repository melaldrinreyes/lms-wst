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
        Schema::table('course_lectures', function (Blueprint $table) {
            // Add hierarchical support
            $table->unsignedBigInteger('parent_lecture_id')->nullable()->after('course_id');
            $table->foreign('parent_lecture_id')
                ->references('id')
                ->on('course_lectures')
                ->onDelete('cascade');
            
            // Add level indicator (0 = root, 1 = child, 2 = grandchild, etc.)
            $table->integer('level')->default(0)->after('order');
            
            // Create index for hierarchical queries
            $table->index(['course_id', 'parent_lecture_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_lectures', function (Blueprint $table) {
            $table->dropForeign(['parent_lecture_id']);
            $table->dropColumn(['parent_lecture_id', 'level']);
        });
    }
};
