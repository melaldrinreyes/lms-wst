<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING SUBMISSIONS TABLE STRUCTURE ===\n\n";

// Check the submissions table structure
$columns = DB::select('DESCRIBE submissions');
echo "Submissions table structure:\n";
foreach ($columns as $column) {
    echo "  {$column->Field}: {$column->Type}\n";
}

echo "\n=== CHECKING STATUS ENUM VALUES ===\n\n";

// Check what values are allowed in the status enum
$statusColumn = DB::select("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'submissions' AND COLUMN_NAME = 'status' AND TABLE_SCHEMA = DATABASE()")[0];
echo "Status column type: {$statusColumn->COLUMN_TYPE}\n";

echo "\n=== CHECKING SUBMISSION STATUS ===\n\n";

// Check current submission status
$submission = DB::table('submissions')->where('id', 10)->first();
if ($submission) {
    echo "Submission ID 10 status: {$submission->status}\n";
} else {
    echo "Submission ID 10 not found\n";
}