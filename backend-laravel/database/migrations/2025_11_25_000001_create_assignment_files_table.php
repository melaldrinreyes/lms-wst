<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAssignmentFilesTable extends Migration
{
    public function up()
    {
        Schema::create('assignment_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assignment_id');
            $table->string('file_path');
            $table->string('original_name');
            $table->timestamps();

            $table->foreign('assignment_id')->references('id')->on('assignments')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('assignment_files');
    }
}
