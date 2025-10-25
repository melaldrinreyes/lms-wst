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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->after('id')->constrained('roles')->onDelete('restrict');
            $table->string('student_id', 20)->nullable()->unique()->after('role_id');
            $table->string('phone', 20)->nullable()->after('email');
            $table->text('address')->nullable()->after('phone');
            $table->date('date_of_birth')->nullable()->after('address');
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('date_of_birth');
            $table->string('profile_image')->nullable()->after('gender');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('profile_image');
            $table->timestamp('last_login')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn([
                'role_id',
                'student_id',
                'phone',
                'address',
                'date_of_birth',
                'gender',
                'profile_image',
                'status',
                'last_login'
            ]);
        });
    }
};
