<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== SUBMISSION STATUS ===\n\n";

// Total submissions
$total = \App\Models\Submission::count();
echo "Total submissions in database: {$total}\n\n";

// Submissions by course
$submissions = \App\Models\Submission::with(['assignment.course', 'user'])->get();

if ($submissions->isEmpty()) {
    echo "❌ NO SUBMISSIONS FOUND!\n";
    echo "\nThis means students haven't submitted any assignments yet.\n";
    echo "You need to:\n";
    echo "1. Login as a STUDENT\n";
    echo "2. Go to a course (e.g., dbms)\n";
    echo "3. Click on Assignments tab\n";
    echo "4. Click Submit button on any assignment\n";
    echo "5. Upload a file or add text\n";
    echo "6. Click Submit\n";
} else {
    $grouped = $submissions->groupBy('assignment.course_id');
    
    foreach ($grouped as $courseId => $courseSubs) {
        $course = $courseSubs->first()->assignment->course;
        echo "COURSE: {$course->course_name} (ID: {$course->id})\n";
        echo "Submissions: {$courseSubs->count()}\n";
        
        foreach ($courseSubs as $sub) {
            $status = $sub->grade ? 'Graded' : 'Pending';
            echo "  - {$sub->user->first_name} {$sub->user->last_name} → {$sub->assignment->title} [{$status}]\n";
        }
        echo "\n";
    }
}

// Check DBMS course specifically
echo "\n=== DBMS COURSE (ID: 4) ===\n";
$dbmsSubmissions = \App\Models\Submission::whereHas('assignment', function($q) {
    $q->where('course_id', 4);
})->with(['assignment', 'user'])->get();

echo "DBMS submissions: {$dbmsSubmissions->count()}\n";
if ($dbmsSubmissions->count() > 0) {
    foreach ($dbmsSubmissions as $sub) {
        echo "  - {$sub->user->first_name} → {$sub->assignment->title}\n";
    }
}
