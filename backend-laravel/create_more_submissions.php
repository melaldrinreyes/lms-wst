<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Submission;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\User;

echo "=== CREATING MULTIPLE TEST SUBMISSIONS ===\n\n";

$student = User::where('role_id', 3)->first();
$course = Course::find(4);

if (!$student || !$course) {
    echo "ERROR: Student or Course not found!\n";
    exit(1);
}

echo "Student: {$student->name} (ID: {$student->id})\n";
echo "Course: {$course->course_name} (ID: {$course->id})\n\n";

// Create 2 more assignments for testing
$assignment2 = Assignment::create([
    'course_id' => $course->id,
    'title' => 'Database Design Project',
    'description' => 'Design a database schema for a library management system',
    'due_date' => now()->addDays(10),
    'max_points' => 100,
    'status' => 'published'
]);

$assignment3 = Assignment::create([
    'course_id' => $course->id,
    'title' => 'SQL Advanced Queries',
    'description' => 'Write complex SQL queries using subqueries and joins',
    'due_date' => now()->addDays(14),
    'max_points' => 100,
    'status' => 'published'
]);

echo "Created assignments:\n";
echo "  - {$assignment2->title} (ID: {$assignment2->id})\n";
echo "  - {$assignment3->title} (ID: {$assignment3->id})\n\n";

// Create submissions
$sub2 = Submission::create([
    'assignment_id' => $assignment2->id,
    'student_id' => $student->id,
    'submission_text' => 'Here is my database design for the library system:\n\nTables:\n1. Books (id, title, isbn, author_id)\n2. Authors (id, name, country)\n3. Members (id, name, email, join_date)\n4. Loans (id, book_id, member_id, loan_date, return_date)',
    'submitted_at' => now()->subHours(3),
]);

$sub3 = Submission::create([
    'assignment_id' => $assignment3->id,
    'student_id' => $student->id,
    'submission_text' => 'Advanced SQL query solutions:\n\nQuery 1: SELECT * FROM books WHERE author_id IN (SELECT id FROM authors WHERE country = "Philippines");\n\nQuery 2: SELECT b.title, COUNT(l.id) as loan_count FROM books b LEFT JOIN loans l ON b.id = l.book_id GROUP BY b.id ORDER BY loan_count DESC;',
    'submitted_at' => now()->subHours(1),
]);

echo "✅ Created submissions:\n";
echo "  - Submission {$sub2->id} for '{$assignment2->title}'\n";
echo "  - Submission {$sub3->id} for '{$assignment3->title}'\n\n";

// Count total
$total = Submission::whereHas('assignment', function($q) {
    $q->where('course_id', 4);
})->count();

echo "Total submissions for course 4: {$total}\n\n";

echo "Done!\n";
