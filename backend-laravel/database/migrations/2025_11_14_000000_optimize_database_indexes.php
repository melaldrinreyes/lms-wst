<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Add missing indexes for optimal query performance
     */
    public function up(): void
    {
        // users table - Add status index for active/inactive filtering
        if (!$this->indexExists('users', 'users_role_id_status_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index(['role_id', 'status'], 'users_role_id_status_index');
            });
        }

        // users table - Add status index for queries filtering by status
        if (!$this->indexExists('users', 'users_status_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index('status', 'users_status_index');
            });
        }

        // courses table - Add created_at index for sorting
        if (!$this->indexExists('courses', 'courses_created_at_index')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->index('created_at', 'courses_created_at_index');
            });
        }

        // courses table - Add semester/academic_year index for filtering
        if (!$this->indexExists('courses', 'courses_semester_academic_year_index')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->index(['semester', 'academic_year'], 'courses_semester_academic_year_index');
            });
        }

        // enrollments table - Add status index for filtering enrolled students
        if (!$this->indexExists('enrollments', 'enrollments_status_index')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->index('status', 'enrollments_status_index');
            });
        }

        // enrollments table - Add course_id status index for quick course queries
        if (!$this->indexExists('enrollments', 'enrollments_course_id_status_index')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->index(['course_id', 'status'], 'enrollments_course_id_status_index');
            });
        }

        // assignments table - Add status index
        if (!$this->indexExists('assignments', 'assignments_status_index')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->index('status', 'assignments_status_index');
            });
        }

        // assignments table - Add course_id status index
        if (!$this->indexExists('assignments', 'assignments_course_id_status_index')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->index(['course_id', 'status'], 'assignments_course_id_status_index');
            });
        }

        // submissions table - Add grade index for graded queries
        if (!$this->indexExists('submissions', 'submissions_grade_index')) {
            Schema::table('submissions', function (Blueprint $table) {
                $table->index('grade', 'submissions_grade_index');
            });
        }

        // submissions table - Add status index
        if (!$this->indexExists('submissions', 'submissions_status_index')) {
            Schema::table('submissions', function (Blueprint $table) {
                $table->index('status', 'submissions_status_index');
            });
        }

        // submissions table - Add assignment_id status index
        if (!$this->indexExists('submissions', 'submissions_assignment_id_status_index')) {
            Schema::table('submissions', function (Blueprint $table) {
                $table->index(['assignment_id', 'status'], 'submissions_assignment_id_status_index');
            });
        }

        // announcements table - Add status index
        if (!$this->indexExists('announcements', 'announcements_status_index')) {
            Schema::table('announcements', function (Blueprint $table) {
                $table->index('status', 'announcements_status_index');
            });
        }

        // announcements table - Add created_by index
        if (!$this->indexExists('announcements', 'announcements_created_by_status_index')) {
            Schema::table('announcements', function (Blueprint $table) {
                $table->index(['created_by', 'status'], 'announcements_created_by_status_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['users', 'courses', 'enrollments', 'assignments', 'submissions', 'announcements'];
        
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                // Drop all indexes except primary and foreign keys
                $this->dropOptimizationIndexes($table->getTable());
            });
        }
    }

    /**
     * Helper function to check if index exists using raw SQL
     */
    private function indexExists($table, $indexName)
    {
        try {
            $result = Schema::getConnection()->selectOne(
                "SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
                 WHERE TABLE_SCHEMA = ? 
                 AND TABLE_NAME = ? 
                 AND INDEX_NAME = ?",
                [env('DB_DATABASE'), $table, $indexName]
            );
            return $result !== null;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Helper to drop optimization indexes
     */
    private function dropOptimizationIndexes($table)
    {
        $optimizationIndexes = [
            'users' => [
                'users_role_id_status_index',
                'users_status_index',
            ],
            'courses' => [
                'courses_created_at_index',
                'courses_semester_academic_year_index',
            ],
            'enrollments' => [
                'enrollments_status_index',
                'enrollments_course_id_status_index',
            ],
            'assignments' => [
                'assignments_status_index',
                'assignments_course_id_status_index',
            ],
            'submissions' => [
                'submissions_grade_index',
                'submissions_status_index',
                'submissions_assignment_id_status_index',
            ],
            'announcements' => [
                'announcements_status_index',
                'announcements_created_by_status_index',
            ],
        ];

        if (isset($optimizationIndexes[$table])) {
            foreach ($optimizationIndexes[$table] as $index) {
                if ($this->indexExists($table, $index)) {
                    try {
                        Schema::table($table, function (Blueprint $blueprint) use ($index) {
                            $blueprint->dropIndex($index);
                        });
                    } catch (\Exception $e) {
                        // Index doesn't exist, continue
                    }
                }
            }
        }
    }
};
