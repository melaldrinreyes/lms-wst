<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Update all assignments in course 4 (DBMS) to published
$updated = \App\Models\Assignment::where('course_id', 4)
    ->update(['status' => 'published']);

echo "✅ Updated {$updated} assignments to 'published' status in DBMS course\n";

// Show the updated assignments
$assignments = \App\Models\Assignment::where('course_id', 4)->get();
echo "\nAssignments in DBMS course:\n";
foreach ($assignments as $assignment) {
    echo "  - ID: {$assignment->id} | Title: {$assignment->title} | Status: {$assignment->status}\n";
}
