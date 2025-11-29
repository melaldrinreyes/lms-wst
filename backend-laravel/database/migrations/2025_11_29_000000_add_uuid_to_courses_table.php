<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('uuid', 36)->nullable()->unique()->after('id');
        });

        // Backfill existing rows with UUIDs
        $courses = DB::table('courses')->select('id')->get();
        foreach ($courses as $c) {
            DB::table('courses')->where('id', $c->id)->update(['uuid' => (string) Str::uuid()]);
        }

        // Make column non-nullable
        Schema::table('courses', function (Blueprint $table) {
            $table->string('uuid', 36)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }
};
