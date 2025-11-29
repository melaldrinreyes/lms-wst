<?php

require_once 'vendor/autoload.php';

use App\Models\Submission;
use Illuminate\Support\Facades\DB;

try {
    // Bootstrap Laravel
    $app = require_once 'bootstrap/app.php';
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

    // Get a test submission
    $submission = Submission::first();
    if ($submission) {
        echo 'Testing delete for submission ID: ' . $submission->id . PHP_EOL;
        echo 'Status before: ' . $submission->status . PHP_EOL;

        // Test the delete method
        $controller = new App\Http\Controllers\SubmissionController();
        $response = $controller->destroy($submission->id);

        echo 'Delete response: ' . json_encode($response->getData()) . PHP_EOL;

        // Check if submission still exists
        $exists = Submission::find($submission->id);
        echo 'Submission still exists: ' . ($exists ? 'Yes' : 'No') . PHP_EOL;
    } else {
        echo 'No submissions found to test with.' . PHP_EOL;
    }
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}