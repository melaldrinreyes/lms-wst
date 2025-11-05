<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Assignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== TESTING STUDENT ASSIGNMENTS ===\n\n";

// Get a student user
$student = User::where('role_id', 3)->first();
if (!$student) {
    echo "❌ No student user found!\n";
    exit;
}

echo "Student: {$student->name} (ID: {$student->id})\n\n";

// Check enrollments
echo "--- ENROLLMENTS ---\n";
$enrollments = DB::table('enrollments')
    ->where('student_id', $student->id)
    ->get();

echo "Total enrollments: " . $enrollments->count() . "\n";
foreach ($enrollments as $enrollment) {
    echo "  - Course ID: {$enrollment->course_id}, Status: {$enrollment->status}\n";
}

// Get enrolled course IDs
$enrolledCourseIds = DB::table('enrollments')
    ->where('student_id', $student->id)
    ->where('status', 'enrolled')
    ->pluck('course_id');

echo "\nEnrolled course IDs: " . $enrolledCourseIds->implode(', ') . "\n";

// Check assignments in those courses
echo "\n--- ASSIGNMENTS IN ENROLLED COURSES ---\n";
$assignments = Assignment::whereIn('course_id', $enrolledCourseIds)
    ->with('course')
    ->get();

echo "Total assignments found: " . $assignments->count() . "\n\n";

foreach ($assignments as $assignment) {
    echo "Assignment ID: {$assignment->id}\n";
    echo "  Title: {$assignment->title}\n";
    echo "  Course: {$assignment->course->course_name} (ID: {$assignment->course_id})\n";
    echo "  Status: {$assignment->status}\n";
    echo "  Due Date: {$assignment->due_date}\n";
    echo "  File: " . ($assignment->file_path ?? 'None') . "\n";
    echo "---\n";
}

// Check published assignments only
echo "\n--- PUBLISHED ASSIGNMENTS ONLY ---\n";
$publishedAssignments = Assignment::whereIn('course_id', $enrolledCourseIds)
    ->where('status', 'published')
    ->with('course')
    ->get();

echo "Total published assignments: " . $publishedAssignments->count() . "\n\n";

foreach ($publishedAssignments as $assignment) {
    echo "Assignment ID: {$assignment->id}\n";
    echo "  Title: {$assignment->title}\n";
    echo "  Course: {$assignment->course->course_name}\n";
    echo "  Status: {$assignment->status}\n";
    echo "---\n";
}

echo "\nDone.\n";
