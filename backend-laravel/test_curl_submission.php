<?php

// Test script to simulate frontend submission
echo "Testing submission endpoint simulation...\n\n";

// Check if we have assignments
$assignments = shell_exec('cd /d c:\laragon\www\lms-wst\backend-laravel && php artisan tinker --execute="echo App\\\Models\\\Assignment::all()->pluck(\'id\')->toArray();" 2>nul');
$assignmentIds = json_decode(trim($assignments), true);

if (!$assignmentIds || empty($assignmentIds)) {
    echo "No assignments found in database.\n";
    exit(1);
}

$assignmentId = $assignmentIds[0];
echo "Using assignment ID: $assignmentId\n\n";

// Create a simple text file for testing
$testFile = tempnam(sys_get_temp_dir(), 'test_submission');
file_put_contents($testFile, 'This is a test submission file content.');

echo "Test file created: $testFile\n";
echo "File size: " . filesize($testFile) . " bytes\n\n";

// Now let's try to make a curl request to simulate the frontend
$curlCommand = 'curl -X POST "http://127.0.0.1:8000/api/submissions" ' .
    '-H "Accept: application/json" ' .
    '-F "assignment_id=' . $assignmentId . '" ' .
    '-F "submission_text=Test submission from curl" ' .
    '-F "file=@' . $testFile . '" ' .
    '-v 2>&1';

echo "Running curl command:\n$curlCommand\n\n";
echo "Response:\n";
$output = shell_exec($curlCommand);
echo $output . "\n\n";

// Clean up
unlink($testFile);
echo "Test file cleaned up.\n";