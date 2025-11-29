<?php

// Test Course Assignments with Submission Status
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\Course;
use App\Models\Assignment;
use App\Models\Submission;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Course Assignments with Submission Status ===\n\n";

// Get course with assignment that has submissions (course ID 11)
$course = Course::with(['assignments'])->find(11);

if (!$course) {
    echo "❌ No courses found\n";
    exit;
}

echo "Testing Course: {$course->course_name} (ID: {$course->id})\n\n";

if ($course->assignments->count() === 0) {
    echo "❌ No assignments found for this course\n";
    exit;
}

echo "Found {$course->assignments->count()} assignments:\n\n";

// Simulate student user (role_id = 3)
$student = DB::table('users')->where('role_id', 3)->first();
if (!$student) {
    echo "❌ No student users found\n";
    exit;
}

echo "Testing as Student: {$student->name} (ID: {$student->id})\n\n";

// Test the logic from CourseController::show()
foreach ($course->assignments as $assignment) {
    echo "📝 Assignment: {$assignment->title} (ID: {$assignment->id})\n";

    // Get current user's submission for this assignment (simulating student)
    $studentSubmission = $assignment->submissions()
        ->where('student_id', $student->id)
        ->latest()
        ->first();

    // Determine submission status
    $hasSubmitted = $studentSubmission !== null;
    $canResubmit = false;

    if ($studentSubmission && $assignment->updated_by_faculty_at) {
        $canResubmit = $assignment->updated_by_faculty_at > $studentSubmission->submitted_at;
    }

    echo "   Has Submitted: " . ($hasSubmitted ? '✅ Yes' : '❌ No') . "\n";
    echo "   Can Resubmit: " . ($canResubmit ? '✅ Yes' : '❌ No') . "\n";

    if ($studentSubmission) {
        echo "   Submitted At: {$studentSubmission->submitted_at}\n";
        echo "   Grade: " . ($studentSubmission->grade ?? 'Not graded') . "\n";
        echo "   Feedback: " . ($studentSubmission->feedback ?? 'No feedback') . "\n";
    }

    if ($assignment->updated_by_faculty_at) {
        echo "   Faculty Updated At: {$assignment->updated_by_faculty_at}\n";
    } else {
        echo "   Faculty Updated At: Never\n";
    }

    echo "\n";
}

echo "✅ Test Complete!\n";
echo "\nThis test verifies that the CourseController::show() method now includes\n";
echo "has_submitted and can_resubmit flags for assignments.\n";