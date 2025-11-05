<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\SubmissionController;

echo "=== TESTING SUBMISSIONS API FOR COURSE 4 ===\n\n";

// Get faculty user (JM)
$faculty = User::where('email', 'teacher1@gmail.com')->first();
if (!$faculty) {
    echo "❌ Faculty user not found!\n";
    exit;
}

echo "Testing as: {$faculty->name} (ID: {$faculty->id}, Role: {$faculty->role_id})\n\n";

// Create mock request
$request = Request::create('/api/submissions', 'GET', ['course_id' => 4]);
$request->setUserResolver(function () use ($faculty) {
    return $faculty;
});

// Call the controller
$controller = new SubmissionController();
$response = $controller->index($request);

// Get response data
$data = json_decode($response->getContent(), true);

echo "Response Status: " . $response->getStatusCode() . "\n";
echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
echo "Submissions Count: " . count($data['submissions'] ?? []) . "\n\n";

if (!empty($data['submissions'])) {
    echo "Submissions:\n";
    foreach ($data['submissions'] as $sub) {
        echo "---\n";
        echo "ID: {$sub['id']}\n";
        echo "Student: {$sub['student']} ({$sub['student_email']})\n";
        echo "Assignment: {$sub['assignment']}\n";
        echo "Status: {$sub['status']}\n";
        echo "Grade: " . ($sub['grade'] ?? 'Not graded') . "\n";
        echo "Submitted: {$sub['submitted_at']}\n";
        echo "File: " . ($sub['file_path'] ?? 'No file') . "\n";
        echo "\n";
    }
} else {
    echo "⚠️ No submissions returned!\n";
}

// Also check database directly
echo "\n=== DIRECT DATABASE CHECK ===\n\n";
use Illuminate\Support\Facades\DB;

$dbSubmissions = DB::table('submissions')
    ->join('assignments', 'submissions.assignment_id', '=', 'assignments.id')
    ->where('assignments.course_id', 4)
    ->select('submissions.*', 'assignments.title as assignment_title')
    ->get();

echo "Database shows {$dbSubmissions->count()} submissions for Course 4\n\n";

foreach ($dbSubmissions as $sub) {
    echo "✅ Submission ID {$sub->id} - Assignment: {$sub->assignment_title}\n";
    echo "   Student ID: {$sub->student_id}\n";
    echo "   Grade: " . ($sub->grade ?? 'null') . "\n";
    echo "   Submitted: {$sub->submitted_at}\n";
    echo "\n";
}
