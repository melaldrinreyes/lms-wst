<?php

require_once 'vendor/autoload.php';

use Illuminate\Http\Request;
use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "Testing submission validation and endpoint...\n\n";

// Test 1: Check if assignments exist
try {
    $assignments = \App\Models\Assignment::all();
    echo "Found " . $assignments->count() . " assignments:\n";
    foreach ($assignments as $assignment) {
        echo "- ID: {$assignment->id}, Title: {$assignment->title}\n";
    }
    echo "\n";
} catch (Exception $e) {
    echo "Error fetching assignments: " . $e->getMessage() . "\n\n";
}

// Test 2: Test submission validation with valid assignment ID
if ($assignments->count() > 0) {
    $assignment = $assignments->first();

    echo "Testing submission with assignment ID: {$assignment->id}\n";

    // Create a mock request
    $request = new Request();
    $request->merge([
        'assignment_id' => $assignment->id,
        'submission_text' => 'Test submission text'
    ]);

    // Test the validation
    try {
        $validated = $request->validate([
            'assignment_id' => 'required|exists:assignments,id',
            'submission_text' => 'nullable|string',
            'file' => 'nullable|file|max:10485760',
        ]);

        echo "✓ Validation passed!\n";
        echo "Validated data: " . json_encode($validated) . "\n";
    } catch (\Illuminate\Validation\ValidationException $e) {
        echo "✗ Validation failed: " . json_encode($e->errors()) . "\n";
    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "No assignments found to test with.\n";
}

// Test 3: Test with invalid assignment ID
echo "\nTesting submission with invalid assignment ID: 99999\n";

$request = new Request();
$request->merge([
    'assignment_id' => 99999,
    'submission_text' => 'Test submission text'
]);

try {
    $validated = $request->validate([
        'assignment_id' => 'required|exists:assignments,id',
        'submission_text' => 'nullable|string',
        'file' => 'nullable|file|max:10485760',
    ]);

    echo "✓ Validation passed (unexpected)!\n";
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "✗ Validation failed as expected: " . json_encode($e->errors()) . "\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

// Test 4: Test the actual controller method
if ($assignments->count() > 0) {
    echo "\nTesting actual controller method with valid assignment ID...\n";

    $assignment = $assignments->first();

    // Create a mock request that simulates FormData
    $request = new Request();
    $request->merge([
        'assignment_id' => $assignment->id,
        'submission_text' => 'Test submission from controller test'
    ]);

    // Create a mock user (we need authentication)
    $user = \App\Models\User::where('role_id', 3)->first(); // Student role
    if ($user) {
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        try {
            $controller = new \App\Http\Controllers\SubmissionController();
            $response = $controller->store($request);

            echo "✓ Controller method succeeded!\n";
            echo "Response: " . $response->getContent() . "\n";
        } catch (\Illuminate\Validation\ValidationException $e) {
            echo "✗ Controller validation failed: " . json_encode($e->errors()) . "\n";
        } catch (Exception $e) {
            echo "✗ Controller error: " . $e->getMessage() . "\n";
        }
    } else {
        echo "No student user found for testing.\n";
    }
}

echo "\nTest completed.\n";