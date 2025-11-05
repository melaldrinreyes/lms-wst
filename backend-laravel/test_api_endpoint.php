<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\SubmissionController;

echo "=== TESTING SUBMISSION API ENDPOINT ===\n\n";

// Get the faculty user
$faculty = User::find(5); // JM, the faculty for course 4

if (!$faculty) {
    echo "ERROR: Faculty user not found!\n";
    exit(1);
}

echo "Testing as Faculty: {$faculty->name} (ID: {$faculty->id}, Role: {$faculty->role_id})\n\n";

// Create a mock request
$request = Request::create('/api/submissions', 'GET', ['course_id' => 4]);
$request->setUserResolver(function () use ($faculty) {
    return $faculty;
});

// Create controller instance
$controller = new SubmissionController();

echo "Making request: GET /api/submissions?course_id=4\n\n";

try {
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    echo "Response Status: {$response->getStatusCode()}\n";
    echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
    echo "Submissions Count: " . count($data['submissions']) . "\n\n";
    
    if (count($data['submissions']) > 0) {
        echo "--- Submissions ---\n";
        foreach ($data['submissions'] as $sub) {
            echo "ID: {$sub['id']}\n";
            echo "  Student: {$sub['student']} (ID: {$sub['student_id']})\n";
            echo "  Assignment: {$sub['assignment']}\n";
            echo "  Course: {$sub['course_name']}\n";
            echo "  Status: {$sub['status']}\n";
            echo "  Submitted: {$sub['submitted_at']}\n";
            echo "  Grade: " . ($sub['grade'] ?? 'Not graded') . "\n";
            echo "---\n";
        }
    } else {
        echo "⚠️ No submissions returned!\n";
        echo "\nFull response:\n";
        print_r($data);
    }
    
} catch (\Exception $e) {
    echo "ERROR: {$e->getMessage()}\n";
    echo $e->getTraceAsString();
}

echo "\nDone!\n";
