<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\User;
use App\Models\Submission;

class TestAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        // Find the Database course
        $course = Course::where('course_name', 'LIKE', '%Database%')->first();
        
        if (!$course) {
            echo "Database course not found!\n";
            return;
        }

        echo "Found course: {$course->course_name} (ID: {$course->id})\n";

        // Create test assignments
        $assignment1 = Assignment::create([
            'course_id' => $course->id,
            'title' => 'Database Normalization Exercise',
            'description' => 'Complete the normalization exercises for the given database schema. Identify 1NF, 2NF, and 3NF violations.',
            'due_date' => now()->addDays(7),
            'max_points' => 100,
            'status' => 'published'
        ]);

        $assignment2 = Assignment::create([
            'course_id' => $course->id,
            'title' => 'SQL Query Practice',
            'description' => 'Write SQL queries to solve the given problems. Include SELECT, JOIN, and aggregate functions.',
            'due_date' => now()->addDays(14),
            'max_points' => 100,
            'status' => 'published'
        ]);

        echo "Created assignments:\n";
        echo "  - {$assignment1->title} (ID: {$assignment1->id})\n";
        echo "  - {$assignment2->title} (ID: {$assignment2->id})\n";

        // Find a student user
        $student = User::whereHas('role', function($query) {
            $query->where('role_name', 'student');
        })->first();

        if ($student) {
            echo "Found student: {$student->name} (ID: {$student->id})\n";

            // Create test submissions
            $submission1 = Submission::create([
                'assignment_id' => $assignment1->id,
                'student_id' => $student->id,
                'submission_text' => 'I have completed the normalization exercise. The database schema violations I found are:\n\n1NF: The "phone_numbers" column contains multiple values\n2NF: Partial dependencies exist in the Orders table\n3NF: Transitive dependencies in Customer table',
                'submitted_at' => now()->subHours(2)
            ]);

            $submission2 = Submission::create([
                'assignment_id' => $assignment2->id,
                'student_id' => $student->id,
                'submission_text' => 'Here are my SQL queries:\n\nQuery 1: SELECT * FROM users WHERE status = "active";\nQuery 2: SELECT u.name, COUNT(o.id) FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.id;',
                'submitted_at' => now()->subHours(1)
            ]);

            echo "Created submissions:\n";
            echo "  - Submission for '{$assignment1->title}' (ID: {$submission1->id})\n";
            echo "  - Submission for '{$assignment2->title}' (ID: {$submission2->id})\n";
        } else {
            echo "No student user found. Skipping submission creation.\n";
        }

        echo "\n✅ Test data created successfully!\n";
    }
}
