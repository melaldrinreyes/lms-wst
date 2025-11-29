<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Assignment;
use Illuminate\Support\Facades\DB;

echo "=== TESTING STUDENT ASSIGNMENTS API LOGIC ===\n\n";

// Get the student user (John Paul Quisto, ID: 6)
$student = User::find(6);

if (!$student) {
    echo "ERROR: Student user not found!\n";
    exit(1);
}

echo "Testing as Student: {$student->name} (ID: {$student->id}, Role: {$student->role_id})\n\n";

// Simulate the studentAssignments method logic
echo "Simulating studentAssignments() method logic:\n\n";

// Step 1: Get all courses the student is enrolled in
$enrolledCourseIds = DB::table('enrollments')
    ->where('student_id', $student->id)
    ->where('status', 'enrolled')
    ->pluck('course_id');

echo "Enrolled course IDs: " . $enrolledCourseIds->implode(', ') . "\n\n";

// Step 2: Get published assignments from enrolled courses
$assignments = Assignment::whereIn('course_id', $enrolledCourseIds)
    ->where('status', 'published')
    ->with(['submissions' => function($query) use ($student) {
        $query->where('student_id', $student->id);
    }, 'course', 'assignmentFiles'])
    ->orderBy('due_date', 'desc')
    ->get();

echo "Found {$assignments->count()} published assignments:\n\n";

if ($assignments->count() > 0) {
    foreach ($assignments as $assignment) {
        $studentSubmission = $assignment->submissions->first();

        echo "📝 Assignment: {$assignment->title} (ID: {$assignment->id})\n";
        echo "   Course: {$assignment->course->course_name}\n";
        echo "   Due Date: {$assignment->due_date}\n";
        echo "   Status: {$assignment->status}\n";
        echo "   Has Submitted: " . ($studentSubmission ? 'Yes' : 'No') . "\n";

        if ($studentSubmission) {
            echo "   Submission ID: {$studentSubmission->id}\n";
            echo "   Grade: " . ($studentSubmission->grade ?? 'Not graded') . "\n";
        }

        echo "\n";
    }
} else {
    echo "⚠️ No published assignments found!\n\n";
}

echo "✅ Test Complete!\n";
echo "\nThis simulates what the API should return to the frontend.\n";