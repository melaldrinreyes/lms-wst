<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Assignment;
use Illuminate\Http\Request;
use App\Http\Controllers\SubmissionController;

echo "=== TESTING NEW SUBMISSION RULES ===\n\n";

$student = User::where('email', 'student1@gmail.com')->first();
$assignment = Assignment::where('course_id', 4)->where('status', 'published')->first();

if (!$student || !$assignment) {
    echo "❌ Student or assignment not found!\n";
    exit;
}

echo "Student: {$student->name}\n";
echo "Assignment: {$assignment->title} (ID: {$assignment->id})\n";
echo "Assignment updated by faculty: " . ($assignment->updated_by_faculty_at ?? 'Never') . "\n\n";

// Test 1: First submission
echo "TEST 1: First Submission\n";
echo "---\n";

$request = Request::create('/api/submissions', 'POST', [
    'assignment_id' => $assignment->id,
    'submission_text' => 'My first submission',
]);
$request->setUserResolver(function () use ($student) {
    return $student;
});

$controller = new SubmissionController();
$response = $controller->store($request);
$data = json_decode($response->getContent(), true);

echo "Response: {$response->getStatusCode()}\n";
echo "Message: {$data['message']}\n\n";

// Test 2: Try to submit again (should fail)
echo "TEST 2: Try to Submit Again (Should FAIL)\n";
echo "---\n";

$request2 = Request::create('/api/submissions', 'POST', [
    'assignment_id' => $assignment->id,
    'submission_text' => 'Trying to submit again',
]);
$request2->setUserResolver(function () use ($student) {
    return $student;
});

$response2 = $controller->store($request2);
$data2 = json_decode($response2->getContent(), true);

echo "Response: {$response2->getStatusCode()}\n";
echo "Message: {$data2['message']}\n\n";

// Test 3: Faculty updates assignment
echo "TEST 3: Faculty Updates Assignment\n";
echo "---\n";

$assignment->update(['updated_by_faculty_at' => now()]);
echo "✅ Faculty updated assignment at: {$assignment->updated_by_faculty_at}\n\n";

// Test 4: Try to submit again (should succeed now)
echo "TEST 4: Try to Submit Again After Faculty Update (Should SUCCEED)\n";
echo "---\n";

$request3 = Request::create('/api/submissions', 'POST', [
    'assignment_id' => $assignment->id,
    'submission_text' => 'Resubmitting after faculty update',
]);
$request3->setUserResolver(function () use ($student) {
    return $student;
});

$response3 = $controller->store($request3);
$data3 = json_decode($response3->getContent(), true);

echo "Response: {$response3->getStatusCode()}\n";
echo "Message: {$data3['message']}\n\n";

echo "✅ All tests completed!\n";
