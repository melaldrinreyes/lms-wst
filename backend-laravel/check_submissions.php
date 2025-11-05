<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Submission;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\User;

echo "=== CHECKING SUBMISSIONS ===\n\n";

// Check submissions count
$submissionsCount = Submission::count();
echo "Total submissions in database: {$submissionsCount}\n\n";

if ($submissionsCount > 0) {
    echo "--- All Submissions ---\n";
    $submissions = Submission::with(['user', 'assignment.course'])->get();
    
    foreach ($submissions as $sub) {
        echo "ID: {$sub->id}\n";
        echo "  Student: {$sub->user->name} (ID: {$sub->student_id})\n";
        echo "  Assignment: {$sub->assignment->title} (ID: {$sub->assignment_id})\n";
        echo "  Course: {$sub->assignment->course->course_name} (ID: {$sub->assignment->course_id})\n";
        echo "  Course Faculty ID: {$sub->assignment->course->faculty_id}\n";
        echo "  Submitted: {$sub->submitted_at}\n";
        echo "  Grade: " . ($sub->grade ?? 'Not graded') . "\n";
        echo "---\n";
    }
}

echo "\n=== CHECKING COURSE 4 (Database) ===\n\n";
$course = Course::find(4);
if ($course) {
    echo "Course: {$course->course_name}\n";
    echo "Faculty ID: {$course->faculty_id}\n";
    echo "Assignments count: " . $course->assignments()->count() . "\n\n";
    
    if ($course->assignments()->count() > 0) {
        echo "--- Assignments ---\n";
        foreach ($course->assignments as $assignment) {
            echo "  - {$assignment->title} (ID: {$assignment->id})\n";
            echo "    Submissions: " . $assignment->submissions()->count() . "\n";
        }
    }
    
    echo "\n--- Submissions for Course 4 ---\n";
    $courseSubmissions = Submission::whereHas('assignment', function($q) {
        $q->where('course_id', 4);
    })->with(['user', 'assignment'])->get();
    
    echo "Found {$courseSubmissions->count()} submissions\n";
    foreach ($courseSubmissions as $sub) {
        echo "  - {$sub->user->name} submitted '{$sub->assignment->title}' at {$sub->submitted_at}\n";
    }
}

echo "\n=== CHECKING USERS ===\n\n";
$faculty = User::where('role_id', 2)->first();
if ($faculty) {
    echo "Faculty User: {$faculty->name} (ID: {$faculty->id})\n";
}

$student = User::where('role_id', 3)->first();
if ($student) {
    echo "Student User: {$student->name} (ID: {$student->id})\n";
}

echo "\nDone.\n";
