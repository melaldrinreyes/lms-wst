<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== ALL SUBMISSIONS IN DATABASE ===\n\n";

$submissions = DB::table('submissions')
    ->join('assignments', 'submissions.assignment_id', '=', 'assignments.id')
    ->join('users as students', 'submissions.student_id', '=', 'students.id')
    ->select(
        'submissions.id',
        'submissions.assignment_id',
        'submissions.student_id',
        'submissions.status',
        'submissions.grade',
        'submissions.file_path',
        'submissions.created_at',
        'assignments.title as assignment_title',
        'assignments.course_id',
        'students.name as student_name',
        'students.email as student_email'
    )
    ->orderBy('submissions.created_at', 'desc')
    ->get();

echo "Total: " . $submissions->count() . " submissions\n\n";

foreach ($submissions as $sub) {
    echo "Submission #{$sub->id}\n";
    echo "  Student: {$sub->student_name} ({$sub->student_email})\n";
    echo "  Assignment: {$sub->assignment_title} (ID: {$sub->assignment_id})\n";
    echo "  Course ID: {$sub->course_id}\n";
    echo "  Status: {$sub->status}\n";
    echo "  Grade: " . ($sub->grade ?? 'Not graded') . "\n";
    echo "  File: " . ($sub->file_path ?? 'No file') . "\n";
    echo "  Submitted: {$sub->created_at}\n";
    echo "---\n\n";
}

echo "\n=== COURSE 4 ONLY ===\n\n";

$course4 = DB::table('submissions')
    ->join('assignments', 'submissions.assignment_id', '=', 'assignments.id')
    ->join('users as students', 'submissions.student_id', '=', 'students.id')
    ->where('assignments.course_id', 4)
    ->select(
        'submissions.id',
        'submissions.status',
        'submissions.grade',
        'submissions.created_at',
        'assignments.title as assignment_title',
        'students.name as student_name'
    )
    ->get();

echo "Course 4 submissions: " . $course4->count() . "\n\n";

foreach ($course4 as $sub) {
    echo "✅ {$sub->student_name} - {$sub->assignment_title} - {$sub->status}\n";
}
