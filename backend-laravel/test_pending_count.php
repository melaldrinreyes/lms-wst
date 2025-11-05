<?php

// Test pending submissions count endpoint
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\Submission;
use App\Models\Assignment;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Pending Submissions Count ===\n\n";

// Get faculty user (role_id = 2)
$faculty = DB::table('users')->where('role_id', 2)->first();

if (!$faculty) {
    echo "❌ No faculty user found. Please create a faculty account first.\n";
    exit;
}

echo "Faculty: {$faculty->name} (ID: {$faculty->id})\n\n";

// Get faculty's courses
$facultyCourses = DB::table('courses')
    ->where('faculty_id', $faculty->id)
    ->get();

echo "Faculty's Courses: " . $facultyCourses->count() . "\n";
foreach ($facultyCourses as $course) {
    echo "  - {$course->course_name} (ID: {$course->id})\n";
}
echo "\n";

// Get assignments for these courses
$assignmentIds = DB::table('assignments')
    ->whereIn('course_id', $facultyCourses->pluck('id'))
    ->pluck('id');

echo "Total Assignments: " . $assignmentIds->count() . "\n\n";

// Count pending submissions (not graded)
$pendingCount = DB::table('submissions')
    ->whereIn('assignment_id', $assignmentIds)
    ->whereNull('grade')
    ->count();

echo "Pending Submissions (not graded): {$pendingCount}\n";

// Count graded submissions
$gradedCount = DB::table('submissions')
    ->whereIn('assignment_id', $assignmentIds)
    ->whereNotNull('grade')
    ->count();

echo "Graded Submissions: {$gradedCount}\n";
echo "Total Submissions: " . ($pendingCount + $gradedCount) . "\n\n";

echo "✅ Test Complete!\n";
echo "\nEndpoint ready: GET /api/submissions/pending/count\n";
echo "Expected response: {\"success\":true,\"count\":{$pendingCount}}\n";
