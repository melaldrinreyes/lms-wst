<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop dependent views before altering the users table (SQLite limitation)
        DB::statement('DROP VIEW IF EXISTS view_student_performance');
        DB::statement('DROP VIEW IF EXISTS view_course_enrollments');

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('created_by')->nullable()->after('role_id');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });

        // Recreate views after altering the table
        DB::statement("
            CREATE VIEW view_course_enrollments AS
            SELECT 
                e.id AS enrollment_id,
                c.course_code,
                c.course_name,
                u.student_id,
                u.name AS student_name,
                u.email AS student_email,
                e.enrolled_at,
                e.status AS enrollment_status,
                e.final_grade,
                f.name AS faculty_name
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON e.student_id = u.id
            JOIN users f ON c.faculty_id = f.id
        ");

        DB::statement("
            CREATE VIEW view_student_performance AS
            SELECT 
                u.id AS student_id,
                u.student_id AS student_number,
                u.name AS student_name,
                c.id AS course_id,
                c.course_code,
                c.course_name,
                e.final_grade,
                COUNT(DISTINCT s.id) AS total_submissions,
                AVG(s.grade) AS avg_assignment_grade
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN assignments a ON c.id = a.course_id
            LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = u.id
            WHERE u.role_id = 3
            GROUP BY u.id, u.student_id, u.name, c.id, c.course_code, c.course_name, e.final_grade
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS view_student_performance');
        DB::statement('DROP VIEW IF EXISTS view_course_enrollments');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
        });

        // Recreate views after dropping the column
        DB::statement("
            CREATE VIEW view_course_enrollments AS
            SELECT 
                e.id AS enrollment_id,
                c.course_code,
                c.course_name,
                u.student_id,
                u.name AS student_name,
                u.email AS student_email,
                e.enrolled_at,
                e.status AS enrollment_status,
                e.final_grade,
                f.name AS faculty_name
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON e.student_id = u.id
            JOIN users f ON c.faculty_id = f.id
        ");

        DB::statement("
            CREATE VIEW view_student_performance AS
            SELECT 
                u.id AS student_id,
                u.student_id AS student_number,
                u.name AS student_name,
                c.id AS course_id,
                c.course_code,
                c.course_name,
                e.final_grade,
                COUNT(DISTINCT s.id) AS total_submissions,
                AVG(s.grade) AS avg_assignment_grade
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN assignments a ON c.id = a.course_id
            LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = u.id
            WHERE u.role_id = 3
            GROUP BY u.id, u.student_id, u.name, c.id, c.course_code, c.course_name, e.final_grade
        ");
    }
};
