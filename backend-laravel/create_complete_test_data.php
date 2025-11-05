<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Assignment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== CREATING COMPLETE TEST DATA ===\n\n";

$student = User::where('email', 'student1@gmail.com')->first();

if (!$student) {
    echo "❌ Student not found!\n";
    exit;
}

// Clear existing data
echo "🗑️ Clearing old data...\n";
Assignment::where('course_id', 4)->delete();
echo "✅ Cleared!\n\n";

// Create 5 assignments
$assignmentsData = [
    [
        'title' => 'Database Normalization',
        'description' => 'Normalize the given database schema to 3NF',
        'due_date' => now()->addDays(7),
        'max_points' => 100,
        'status' => 'published',
    ],
    [
        'title' => 'SQL Queries Assignment',
        'description' => 'Write complex SQL queries for the given scenarios',
        'due_date' => now()->addDays(10),
        'max_points' => 100,
        'status' => 'published',
    ],
    [
        'title' => 'Database Design Project',
        'description' => 'Design a complete database for an e-commerce system',
        'due_date' => now()->addDays(14),
        'max_points' => 150,
        'status' => 'published',
    ],
    [
        'title' => 'Transaction Management',
        'description' => 'Implement ACID properties in database transactions',
        'due_date' => now()->addDays(5),
        'max_points' => 80,
        'status' => 'published',
    ],
    [
        'title' => 'NoSQL vs SQL Comparison',
        'description' => 'Research and compare SQL and NoSQL databases',
        'due_date' => now()->addDays(21),
        'max_points' => 100,
        'status' => 'draft',
    ],
];

$createdAssignments = [];

echo "📝 Creating Assignments:\n";
echo "---\n";
foreach ($assignmentsData as $data) {
    $data['course_id'] = 4;
    $assignment = Assignment::create($data);
    $createdAssignments[] = $assignment;
    echo "✅ {$assignment->title} (ID: {$assignment->id}, Status: {$assignment->status})\n";
}

echo "\n📤 Creating Submissions:\n";
echo "---\n";

// Create submissions for some assignments
$submissionsData = [
    [
        'assignment' => $createdAssignments[0], // Database Normalization
        'submitted_days_ago' => 2,
        'text' => 'I have completed the normalization task. The database is now in 3NF form with proper dependencies.',
        'grade' => 92.00,
        'feedback' => 'Excellent work! Your normalization is correct.',
    ],
    [
        'assignment' => $createdAssignments[1], // SQL Queries
        'submitted_days_ago' => 1,
        'text' => 'Here are my SQL queries for all scenarios. I tested them and they work correctly.',
        'grade' => 88.50,
        'feedback' => 'Good job! Query 3 could be optimized better.',
    ],
    [
        'assignment' => $createdAssignments[2], // Database Design
        'submitted_days_ago' => 0.5, // 12 hours ago
        'text' => 'My complete database design for the e-commerce system with ER diagram and schema.',
        'grade' => null, // Pending
        'feedback' => null,
    ],
    [
        'assignment' => $createdAssignments[3], // Transaction Management
        'submitted_days_ago' => 0.1, // ~2 hours ago  
        'text' => 'ACID implementation complete with code examples and explanations.',
        'grade' => null, // Pending
        'feedback' => null,
    ],
];

foreach ($submissionsData as $data) {
    $submittedAt = now()->subDays($data['submitted_days_ago']);
    
    $submission = Submission::create([
        'assignment_id' => $data['assignment']->id,
        'student_id' => $student->id,
        'submission_text' => $data['text'],
        'submitted_at' => $submittedAt,
        'grade' => $data['grade'],
        'feedback' => $data['feedback'],
        'graded_at' => $data['grade'] ? $submittedAt->addHours(24) : null,
    ]);

    $status = $data['grade'] ? "✅ GRADED ({$data['grade']}/150)" : "⏳ PENDING";
    echo "{$status} - {$data['assignment']->title}\n";
    echo "   Submitted: {$submittedAt->diffForHumans()}\n";
    echo "   ID: {$submission->id}\n\n";
}

// Summary
echo "---\n";
echo "📊 FINAL SUMMARY:\n\n";

$totalAssignments = Assignment::where('course_id', 4)->count();
$publishedAssignments = Assignment::where('course_id', 4)->where('status', 'published')->count();
$totalSubmissions = Submission::whereHas('assignment', function($q) {
    $q->where('course_id', 4);
})->count();
$gradedSubmissions = Submission::whereHas('assignment', function($q) {
    $q->where('course_id', 4);
})->whereNotNull('grade')->count();
$pendingSubmissions = Submission::whereHas('assignment', function($q) {
    $q->where('course_id', 4);
})->whereNull('grade')->count();

echo "Assignments Created: {$totalAssignments}\n";
echo "  • Published: {$publishedAssignments}\n";
echo "  • Draft: " . ($totalAssignments - $publishedAssignments) . "\n\n";

echo "Submissions Created: {$totalSubmissions}\n";
echo "  • Graded: {$gradedSubmissions}\n";
echo "  • Pending: {$pendingSubmissions}\n\n";

echo "✅ Test data created successfully!\n";
echo "🔄 Refresh your browser to see the data!\n";
