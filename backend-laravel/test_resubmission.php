<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use App\Http\Controllers\SubmissionController;

echo "=== TESTING RESUBMISSION ===\n\n";

// Get the student user
$student = User::find(6); // Paul Quisto

if (!$student) {
    echo "ERROR: Student user not found!\n";
    exit(1);
}

echo "Testing as Student: {$student->name} (ID: {$student->id})\n\n";

// Simulate a resubmission request
$data = [
    'assignment_id' => 17,
    'submission_text' => 'This is my UPDATED submission. I have made improvements based on feedback.',
];

$request = Request::create('/api/submissions', 'POST', $data);
$request->setUserResolver(function () use ($student) {
    return $student;
});

// Create controller instance
$controller = new SubmissionController();

echo "Making request: POST /api/submissions\n";
echo "Assignment ID: 17\n";
echo "Action: Resubmit (update existing submission)\n\n";

try {
    $response = $controller->store($request);
    $responseData = json_decode($response->getContent(), true);
    
    echo "Response Status: {$response->getStatusCode()}\n";
    echo "Success: " . ($responseData['success'] ? 'true' : 'false') . "\n";
    echo "Message: {$responseData['message']}\n";
    
    if (isset($responseData['submission'])) {
        echo "\nSubmission Details:\n";
        echo "  ID: {$responseData['submission']['id']}\n";
        echo "  Assignment ID: {$responseData['submission']['assignment_id']}\n";
        echo "  Student ID: {$responseData['submission']['student_id']}\n";
        echo "  Text: " . substr($responseData['submission']['submission_text'], 0, 60) . "...\n";
        echo "  Submitted At: {$responseData['submission']['submitted_at']}\n";
    }
    
} catch (\Exception $e) {
    echo "ERROR: {$e->getMessage()}\n";
    echo $e->getTraceAsString();
}

echo "\nDone!\n";
