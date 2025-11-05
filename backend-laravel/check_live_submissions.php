<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING LIVE SUBMISSIONS DATA ===\n\n";

// Get all submissions with full details
$submissions = DB::table('submissions')
    ->join('assignments', 'submissions.assignment_id', '=', 'assignments.id')
    ->join('users as students', 'submissions.student_id', '=', 'students.id')
    ->join('courses', 'assignments.course_id', '=', 'courses.id')
    ->select(
        'submissions.*',
        'assignments.title as assignment_title',
        'assignments.course_id',
        'students.name as student_name',
        'students.email as student_email',
        'courses.title as course_title'
    )
    ->orderBy('submissions.created_at', 'desc')
    ->get();

echo "Total Submissions: " . $submissions->count() . "\n\n";

foreach ($submissions as $sub) {
    echo "Submission ID: {$sub->id}\n";
    echo "Student: {$sub->student_name} ({$sub->student_email})\n";
    echo "Assignment: {$sub->assignment_title} (ID: {$sub->assignment_id})\n";
    echo "Course: {$sub->course_title} (ID: {$sub->course_id})\n";
    echo "Status: {$sub->status}\n";
    echo "Grade: " . ($sub->grade ?? 'Not graded') . "\n";
    echo "Submitted: {$sub->created_at}\n";
    echo "File: " . ($sub->file_path ?? 'No file') . "\n";
    echo "---\n\n";
}

// Check Course 4 specifically
echo "\n=== COURSE 4 (Database) SUBMISSIONS ===\n\n";
$course4Submissions = DB::table('submissions')
    ->join('assignments', 'submissions.assignment_id', '=', 'assignments.id')
    ->join('users as students', 'submissions.student_id', '=', 'students.id')
    ->where('assignments.course_id', 4)
    ->select(
        'submissions.*',
        'assignments.title as assignment_title',
        'students.name as student_name',
        'students.email as student_email'
    )
    ->orderBy('submissions.created_at', 'desc')
    ->get();

echo "Course 4 Submissions: " . $course4Submissions->count() . "\n\n";

foreach ($course4Submissions as $sub) {
    echo "✅ Submission ID: {$sub->id}\n";
    echo "   Student: {$sub->student_name} ({$sub->student_email})\n";
    echo "   Assignment: {$sub->assignment_title}\n";
    echo "   Status: {$sub->status}\n";
    echo "   Grade: " . ($sub->grade ?? 'pending') . "\n";
    echo "   Submitted: {$sub->created_at}\n";
    echo "\n";
}

// Test the actual API endpoint logic
echo "\n=== TESTING API ENDPOINT LOGIC ===\n\n";

$query = DB::table('submissions')
    ->join('assignments', 'submissions.assignment_id', '=', 'assignments.id')
    ->join('users as students', 'submissions.student_id', '=', 'students.id')
    ->select(
        'submissions.*',
        'students.name as student_name',
        'students.email as student_email',
        'assignments.title as assignment_title',
        'assignments.course_id'
    );

// Apply course_id filter
$query->whereHas('assignment', function ($q) {
    $q->where('course_id', 4);
});

echo "Query with course_id filter would return: ";
try {
    $results = DB::table('submissions')
        ->join('assignments', 'submissions.assignment_id', '=', 'assignments.id')
        ->where('assignments.course_id', 4)
        ->count();
    echo $results . " submissions\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n✅ Database check complete!\n";
