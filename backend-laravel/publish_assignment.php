<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== UPDATING ASSIGNMENT STATUS ===\n";

// Update assignment ID 26 to published
$updated = DB::table('assignments')
    ->where('id', 26)
    ->update(['status' => 'published']);

if ($updated) {
    echo "Assignment ID 26 status updated to 'published'\n";

    // Verify the update
    $assignment = DB::table('assignments')->where('id', 26)->first();
    echo "Verification - Assignment ID: {$assignment->id}, Status: {$assignment->status}\n";
} else {
    echo "Failed to update assignment status\n";
}

echo "Done.\n";