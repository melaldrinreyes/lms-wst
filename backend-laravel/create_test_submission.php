<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Submission;
use App\Models\Assignment;
use App\Models\User;

echo "=== CREATING TEST SUBMISSION ===\n\n";

// Get the student and assignment
$student = User::where('role_id', 3)->first();
$assignment = Assignment::find(14);

if (!$student) {
    echo "ERROR: No student found!\n";
    exit(1);
}

if (!$assignment) {
    echo "ERROR: Assignment 14 not found!\n";
    exit(1);
}

echo "Student: {$student->name} (ID: {$student->id})\n";
echo "Assignment: {$assignment->title} (ID: {$assignment->id})\n";
echo "Course ID: {$assignment->course_id}\n\n";

// Check if submission already exists
$existing = Submission::where('assignment_id', $assignment->id)
    ->where('student_id', $student->id)
    ->first();

if ($existing) {
    echo "Submission already exists (ID: {$existing->id})\n";
    echo "Deleting old submission...\n";
    $existing->delete();
}

// Create new submission
$submission = Submission::create([
    'assignment_id' => $assignment->id,
    'student_id' => $student->id,
    'submission_text' => 'This is my test submission for the assignment. I have completed all the required tasks.',
    'submitted_at' => now(),
]);

echo "✅ Submission created successfully!\n";
echo "   Submission ID: {$submission->id}\n";
echo "   Assignment ID: {$submission->assignment_id}\n";
echo "   Student ID: {$submission->student_id}\n";
echo "   Submitted at: {$submission->submitted_at}\n";

echo "\n=== VERIFYING SUBMISSION ===\n\n";

// Test the query that faculty would use
$courseId = 4;
$facultySubmissions = Submission::whereHas('assignment', function($q) use ($courseId) {
    $q->where('course_id', $courseId);
})->with(['user', 'assignment'])->get();

echo "Submissions found for course {$courseId}: {$facultySubmissions->count()}\n";

foreach ($facultySubmissions as $sub) {
    echo "  - Student: {$sub->user->name}\n";
    echo "    Assignment: {$sub->assignment->title}\n";
    echo "    Submitted: {$sub->submitted_at}\n";
}

echo "\nDone!\n";
