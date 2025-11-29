<?php

// Simulate faculty update to test resubmission
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Simulate faculty updating assignment 16 after student submission
$affected = DB::table('assignments')->where('id', 16)->update([
    'updated_by_faculty_at' => now()->addMinutes(5) // Faculty updates 5 minutes after submission
]);

echo "Simulated faculty update to assignment 16. Affected rows: $affected\n";
echo "Assignment 16 should now allow resubmission.\n";