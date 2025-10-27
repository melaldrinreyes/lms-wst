<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== SUBMISSIONS REPORT ===\n\n";

$submissions = \App\Models\Submission::with(['assignment.course', 'user'])->get();

echo "Total submissions in database: " . $submissions->count() . "\n\n";

$byCourse = $submissions->groupBy('assignment.course.id');

foreach ($byCourse as $courseId => $courseSubmissions) {
    $course = $courseSubmissions->first()->assignment->course;
    echo "COURSE: {$course->course_name} (ID: {$course->id})\n";
    echo "Faculty: {$course->faculty->first_name} {$course->faculty->last_name}\n";
    echo "Submissions: {$courseSubmissions->count()}\n";
    
    foreach ($courseSubmissions as $sub) {
        $status = $sub->grade ? 'Graded' : 'Pending';
        echo "  - {$sub->user->first_name} {$sub->user->last_name} -> {$sub->assignment->title} [{$status}]\n";
    }
    echo "\n";
}
