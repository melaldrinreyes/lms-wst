<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING COURSES ===\n\n";

$courses = DB::table('courses')->get();

echo "Total courses: " . count($courses) . "\n\n";

foreach ($courses as $course) {
    echo "Course ID: {$course->id}\n";
    echo "  Name: {$course->name}\n";
    echo "  Faculty ID: {$course->faculty_id}\n";
    echo "  Created: {$course->created_at}\n\n";
}