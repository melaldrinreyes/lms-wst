<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING ENROLLMENTS ===\n\n";

$enrollments = DB::table('enrollments')->get();

echo "Total enrollments: " . count($enrollments) . "\n\n";

foreach ($enrollments as $enrollment) {
    echo "Enrollment ID: {$enrollment->id}\n";
    echo "  Student ID: {$enrollment->student_id}\n";
    echo "  Course ID: {$enrollment->course_id}\n";
    echo "  Status: {$enrollment->status}\n";
    echo "  Enrolled: {$enrollment->created_at}\n\n";
}