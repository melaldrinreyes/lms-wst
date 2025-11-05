<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$assignment = App\Models\Assignment::first();
$student = App\Models\User::where('role_id', 3)->first();

if ($assignment && $student) {
    $submission = App\Models\Submission::create([
        'assignment_id' => $assignment->id,
        'student_id' => $student->id,
        'submission_text' => 'This is a test submission to verify the system works.',
        'file_path' => null,
        'submitted_at' => now(),
    ]);
    
    echo "✅ Test submission created successfully!\n";
    echo "Assignment: " . $assignment->title . "\n";
    echo "Student: " . $student->name . "\n";
    echo "Submission ID: " . $submission->id . "\n";
} else {
    echo "❌ Error: Could not find assignment or student\n";
    if (!$assignment) echo "  - No assignment found\n";
    if (!$student) echo "  - No student found\n";
}
