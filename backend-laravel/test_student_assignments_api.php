<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\AssignmentController;

echo "=== TESTING STUDENT ASSIGNMENTS API ENDPOINT ===\n\n";

// Get the student user (John Paul Quisto, ID: 6)
$student = User::find(6);

if (!$student) {
    echo "ERROR: Student user not found!\n";
    exit(1);
}

echo "Testing as Student: {$student->name} (ID: {$student->id}, Role: {$student->role_id})\n\n";

// Create a mock request for student assignments
$request = Request::create("/api/student/assignments", 'GET');
$request->setUserResolver(function () use ($student) {
    return $student;
});

// Create controller instance
$controller = new AssignmentController();

echo "Making request: GET /api/student/assignments\n\n";

try {
    $response = $controller->studentAssignments($request);
    $data = json_decode($response->getContent(), true);

    echo "Response Status: {$response->getStatusCode()}\n";
    echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
    echo "Assignments Count: " . count($data['assignments']) . "\n\n";

    if (count($data['assignments']) > 0) {
        echo "--- Assignments ---\n";
        foreach ($data['assignments'] as $assignment) {
            echo "ID: {$assignment['id']}\n";
            echo "  Title: {$assignment['title']}\n";
            echo "  Course: {$assignment['course_name']}\n";
            echo "  Status: {$assignment['status']}\n";
            echo "  Due Date: {$assignment['due_date']}\n";
            echo "---\n";
        }
    } else {
        echo "⚠️ No assignments returned!\n";
    }

} catch (\Exception $e) {
    echo "ERROR: {$e->getMessage()}\n";
    echo $e->getTraceAsString();
}

echo "\nDone!\n";