<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Assignment;
use App\Models\Submission;
use App\Models\User;

echo "=== PUBLISHING ASSIGNMENT & CREATING TEST SUBMISSION ===\n\n";

// Publish the assignment
$assignment = Assignment::find(17);
if (!$assignment) {
    echo "ERROR: Assignment 17 not found!\n";
    exit(1);
}

echo "Found assignment: {$assignment->title} (ID: {$assignment->id})\n";
echo "Current status: {$assignment->status}\n";

$assignment->update(['status' => 'published']);
echo "✅ Assignment published!\n\n";

// Create a test submission
$student = User::find(6); // Paul Quisto

echo "Creating test submission from student: {$student->name}\n";

$submission = Submission::create([
    'assignment_id' => $assignment->id,
    'student_id' => $student->id,
    'submission_text' => 'This is my submission for the assignment. I have completed all the requirements.',
    'submitted_at' => now(),
]);

echo "✅ Submission created!\n";
echo "   ID: {$submission->id}\n";
echo "   Assignment: {$assignment->title}\n";
echo "   Student: {$student->name}\n";
echo "   Submitted: {$submission->submitted_at}\n\n";

// Verify
$totalSubmissions = Submission::whereHas('assignment', function($q) {
    $q->where('course_id', 4);
})->count();

echo "Total submissions for course 4: {$totalSubmissions}\n";
echo "\nDone!\n";
