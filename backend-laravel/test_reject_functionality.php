<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Submission;
use App\Models\User;

echo "=== TESTING SUBMISSION REJECT FUNCTIONALITY ===\n\n";

try {
    // Find a faculty user
    $faculty = User::where('role_id', 2)->first();
    if (!$faculty) {
        echo "❌ No faculty user found!\n";
        exit;
    }

    echo "Testing as faculty: {$faculty->name} (ID: {$faculty->id})\n\n";

    // Find a submission
    $submission = Submission::find(10);
    if (!$submission) {
        echo "❌ Submission with ID 10 not found!\n";
        exit;
    }

    echo "Found submission ID: {$submission->id}, current status: {$submission->status}\n";

    // Test the reject method directly
    $controller = new App\Http\Controllers\SubmissionController();
    $response = $controller->reject(10);

    echo "Reject response status: " . $response->getStatusCode() . "\n";

    // Check response content
    $responseData = json_decode($response->getContent(), true);
    echo "Response: " . json_encode($responseData, JSON_PRETTY_PRINT) . "\n";

    // Check if status was updated
    $submission->refresh();
    echo "Updated status: {$submission->status}\n";

    if ($submission->status === 'rejected') {
        echo "✅ Reject functionality works correctly!\n";
    } else {
        echo "❌ Status was not updated to 'rejected'\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}