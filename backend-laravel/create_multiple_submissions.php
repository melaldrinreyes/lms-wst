<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Submission;
use App\Models\Assignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== CREATING REALISTIC MULTIPLE SUBMISSIONS ===\n\n";

// First, let's see what we have
echo "📊 CURRENT DATABASE STATE:\n";
echo "---\n";

$students = User::where('role_id', 3)->get();
echo "Students: " . $students->count() . "\n";
foreach ($students as $s) {
    echo "  - {$s->name} ({$s->email}) - ID: {$s->id}\n";
}

$assignments = Assignment::where('course_id', 4)->get();
echo "\nAssignments in Course 4: " . $assignments->count() . "\n";
foreach ($assignments as $a) {
    echo "  - {$a->title} (ID: {$a->id}, Status: {$a->status})\n";
}

$currentSubmissions = Submission::whereHas('assignment', function($q) {
    $q->where('course_id', 4);
})->get();
echo "\nCurrent Submissions: " . $currentSubmissions->count() . "\n\n";

// Delete ALL existing submissions for Course 4 to start fresh
echo "🗑️ Clearing existing submissions for Course 4...\n";
Submission::whereHas('assignment', function($q) {
    $q->where('course_id', 4);
})->delete();
echo "✅ Cleared!\n\n";

// Get the one student we have
$student = User::where('email', 'student1@gmail.com')->first();

if (!$student) {
    echo "❌ No students found! Creating test student...\n";
    $student = User::create([
        'name' => 'Paul Quisto',
        'email' => 'student1@gmail.com',
        'password' => bcrypt('password123'),
        'role_id' => 3,
    ]);
    echo "✅ Student created: {$student->name}\n";
}

// Get published assignments
$publishedAssignments = Assignment::where('course_id', 4)
    ->where('status', 'published')
    ->get();

if ($publishedAssignments->isEmpty()) {
    echo "⚠️ No published assignments! Publishing some assignments...\n";
    
    // Publish multiple assignments
    $toPublish = Assignment::where('course_id', 4)->limit(3)->get();
    foreach ($toPublish as $assignment) {
        $assignment->status = 'published';
        $assignment->save();
        echo "  ✅ Published: {$assignment->title} (ID: {$assignment->id})\n";
    }
    
    $publishedAssignments = Assignment::where('course_id', 4)
        ->where('status', 'published')
        ->get();
}

echo "\n📝 CREATING SUBMISSIONS:\n";
echo "---\n\n";

$submissionsData = [];

// Scenario 1: Student submitted Assignment 1 - GRADED
if (isset($publishedAssignments[0])) {
    $submissionsData[] = [
        'assignment' => $publishedAssignments[0],
        'student' => $student,
        'text' => 'Complete answer to assignment 1. I have thoroughly researched the topic and provided detailed explanations with examples.',
        'grade' => 95.00,
        'feedback' => 'Excellent work! Very comprehensive answer.',
        'days_ago' => 5,
    ];
}

// Scenario 2: Student submitted Assignment 2 - GRADED
if (isset($publishedAssignments[1])) {
    $submissionsData[] = [
        'assignment' => $publishedAssignments[1],
        'student' => $student,
        'text' => 'My submission for assignment 2. I focused on the key concepts discussed in class.',
        'grade' => 88.50,
        'feedback' => 'Good effort, but needs more detail in section 3.',
        'days_ago' => 3,
    ];
}

// Scenario 3: Student submitted Assignment 3 - PENDING (not graded yet)
if (isset($publishedAssignments[2])) {
    $submissionsData[] = [
        'assignment' => $publishedAssignments[2],
        'student' => $student,
        'text' => 'Just submitted! This is my latest work on assignment 3. Please review when you have time.',
        'grade' => null,
        'feedback' => null,
        'days_ago' => 0,
    ];
}

// Create the submissions
foreach ($submissionsData as $index => $data) {
    $submittedAt = now()->subDays($data['days_ago']);
    
    $submission = Submission::create([
        'assignment_id' => $data['assignment']->id,
        'student_id' => $data['student']->id,
        'submission_text' => $data['text'],
        'submitted_at' => $submittedAt,
        'grade' => $data['grade'],
        'feedback' => $data['feedback'],
        'graded_at' => $data['grade'] ? $submittedAt->addHours(24) : null,
    ]);

    echo "✅ Submission #" . ($index + 1) . " Created!\n";
    echo "   Assignment: {$data['assignment']->title} (ID: {$data['assignment']->id})\n";
    echo "   Student: {$data['student']->name}\n";
    echo "   Status: " . ($data['grade'] ? "GRADED ({$data['grade']}/100)" : "PENDING") . "\n";
    echo "   Submitted: {$submittedAt->format('Y-m-d H:i:s')}\n";
    echo "\n";
}

// Verify
echo "---\n";
echo "📊 FINAL COUNT:\n";
$final = Submission::whereHas('assignment', function($q) {
    $q->where('course_id', 4);
})->get();

echo "Total Submissions for Course 4: " . $final->count() . "\n\n";

// Show breakdown
$pending = $final->whereNull('grade')->count();
$graded = $final->whereNotNull('grade')->count();

echo "  • Pending (not graded): {$pending}\n";
echo "  • Graded: {$graded}\n\n";

echo "🎯 SUMMARY:\n";
foreach ($final as $sub) {
    $assignment = Assignment::find($sub->assignment_id);
    $student = User::find($sub->student_id);
    $status = $sub->grade ? "✅ GRADED ({$sub->grade})" : "⏳ PENDING";
    echo "  {$status} - {$student->name} → {$assignment->title}\n";
}

echo "\n✅ Done! Refresh your browser to see all submissions!\n";
