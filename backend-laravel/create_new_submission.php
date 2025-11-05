<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Submission;
use App\Models\Assignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== CREATING NEW TEST SUBMISSION ===\n\n";

// Get student
$student = User::where('email', 'student1@gmail.com')->first();
if (!$student) {
    echo "❌ Student not found!\n";
    exit;
}

// Get a published assignment from Course 4
$assignment = Assignment::where('course_id', 4)
    ->where('status', 'published')
    ->first();

if (!$assignment) {
    echo "❌ No published assignment found in Course 4!\n";
    echo "Available assignments:\n";
    $all = Assignment::where('course_id', 4)->get();
    foreach ($all as $a) {
        echo "  - ID: {$a->id}, Title: {$a->title}, Status: {$a->status}\n";
    }
    exit;
}

echo "Student: {$student->name} (ID: {$student->id})\n";
echo "Assignment: {$assignment->title} (ID: {$assignment->id})\n\n";

// Check if already submitted
$existing = Submission::where('assignment_id', $assignment->id)
    ->where('student_id', $student->id)
    ->first();

if ($existing) {
    echo "⚠️ Submission already exists (ID: {$existing->id})\n";
    echo "Deleting old submission...\n";
    $existing->delete();
}

// Create new submission
$submission = Submission::create([
    'assignment_id' => $assignment->id,
    'student_id' => $student->id,
    'submission_text' => 'This is a TEST submission created on ' . now(),
    'submitted_at' => now(),
]);

echo "✅ New submission created!\n";
echo "   ID: {$submission->id}\n";
echo "   Assignment: {$assignment->title}\n";
echo "   Student: {$student->name}\n";
echo "   Submitted: {$submission->submitted_at}\n\n";

// Verify in database
$count = DB::table('submissions')
    ->join('assignments', 'submissions.assignment_id', '=', 'assignments.id')
    ->where('assignments.course_id', 4)
    ->count();

echo "Total submissions for Course 4: {$count}\n";
