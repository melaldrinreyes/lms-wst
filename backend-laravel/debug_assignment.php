<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Assignment;
use App\Models\User;

$student = User::find(6);
$assignment = Assignment::with('submissions')->find(30);

echo "Assignment: {$assignment->title}\n";
echo "Student: {$student->name} (ID: {$student->id})\n\n";

echo "Total submissions: " . $assignment->submissions->count() . "\n";
echo "Submissions:\n";
foreach ($assignment->submissions as $sub) {
    echo "  - Student ID: {$sub->student_id}, Grade: " . ($sub->grade ?? 'null') . "\n";
}

echo "\nFiltering for student_id = {$student->id}:\n";
$studentSub = $assignment->submissions->where('student_id', $student->id)->first();

if ($studentSub) {
    echo "✅ Found submission!\n";
    echo "   ID: {$studentSub->id}\n";
    echo "   Grade: " . ($studentSub->grade ?? 'null') . "\n";
    echo "   Submitted: {$studentSub->submitted_at}\n";
} else {
    echo "❌ No submission found\n";
}
