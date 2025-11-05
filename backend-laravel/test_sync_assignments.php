<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\AssignmentController;

echo "=== TESTING SYNCHRONIZED ASSIGNMENT LOGIC ===\n\n";

// Test as STUDENT
$student = User::where('email', 'student1@gmail.com')->first();

if (!$student) {
    echo "❌ Student not found!\n";
    exit;
}

echo "🎓 TESTING AS STUDENT: {$student->name}\n";
echo "---\n\n";

$request = Request::create('/api/courses/4/assignments', 'GET');
$request->setUserResolver(function () use ($student) {
    return $student;
});

$controller = new AssignmentController();
$response = $controller->index(4);
$data = json_decode($response->getContent(), true);

echo "Response Status: {$response->getStatusCode()}\n";
echo "Assignments Count: " . count($data['assignments']) . "\n\n";

foreach ($data['assignments'] as $assignment) {
    echo "📝 {$assignment['title']}\n";
    echo "   Status: {$assignment['status']}\n";
    echo "   Due: {$assignment['due_date']}\n";
    echo "   Points: {$assignment['max_points']}\n";
    
    if (isset($assignment['has_submitted'])) {
        echo "   Student Submitted: " . ($assignment['has_submitted'] ? 'YES' : 'NO') . "\n";
        
        if ($assignment['has_submitted']) {
            echo "   Can Resubmit: " . ($assignment['can_resubmit'] ? 'YES (Faculty updated assignment)' : 'NO') . "\n";
            echo "   Submission Status: {$assignment['submission_status']}\n";
            if ($assignment['submission_grade']) {
                echo "   Grade: {$assignment['submission_grade']}/{$assignment['max_points']}\n";
            }
        }
    }
    
    echo "\n";
}

echo "---\n";
echo "🧑‍🏫 TESTING AS FACULTY\n\n";

$faculty = User::where('email', 'teacher1@gmail.com')->first();

if (!$faculty) {
    echo "❌ Faculty not found!\n";
    exit;
}

$request2 = Request::create('/api/courses/4/assignments', 'GET');
$request2->setUserResolver(function () use ($faculty) {
    return $faculty;
});

$response2 = $controller->index(4);
$data2 = json_decode($response2->getContent(), true);

echo "Response Status: {$response2->getStatusCode()}\n";
echo "Assignments Count: " . count($data2['assignments']) . "\n\n";

foreach ($data2['assignments'] as $assignment) {
    echo "📝 {$assignment['title']}\n";
    echo "   Status: {$assignment['status']}\n";
    echo "   Total Submissions: {$assignment['total_submissions']}\n";
    echo "   Graded: {$assignment['graded_submissions']}\n";
    echo "   Updated by Faculty: " . ($assignment['updated_by_faculty_at'] ?? 'Never') . "\n";
    echo "\n";
}

echo "✅ Synchronized logic test complete!\n";
