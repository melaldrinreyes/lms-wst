<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\AssignmentController;

echo "=== TESTING ASSIGNMENT FETCH FOR FACULTY ===\n\n";

// Get the faculty user
$faculty = User::find(5); // JM

if (!$faculty) {
    echo "ERROR: Faculty user not found!\n";
    exit(1);
}

echo "Testing as Faculty: {$faculty->name} (ID: {$faculty->id}, Role: {$faculty->role_id})\n\n";

// Create a mock request for course 4
$courseId = 4;
$request = Request::create("/api/courses/{$courseId}/assignments", 'GET');
$request->setUserResolver(function () use ($faculty) {
    return $faculty;
});

// Create controller instance
$controller = new AssignmentController();

echo "Making request: GET /api/courses/{$courseId}/assignments\n\n";

try {
    $response = $controller->index($courseId);
    $data = json_decode($response->getContent(), true);
    
    echo "Response Status: {$response->getStatusCode()}\n";
    echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
    echo "Assignments Count: " . count($data['assignments']) . "\n\n";
    
    if (count($data['assignments']) > 0) {
        echo "--- Assignments ---\n";
        foreach ($data['assignments'] as $assignment) {
            echo "ID: {$assignment['id']}\n";
            echo "  Title: {$assignment['title']}\n";
            echo "  Status: {$assignment['status']}\n";
            echo "  Due Date: {$assignment['due_date']}\n";
            echo "  Max Points: {$assignment['max_points']}\n";
            echo "  Total Submissions: {$assignment['total_submissions']}\n";
            echo "  Graded Submissions: {$assignment['graded_submissions']}\n";
            echo "---\n";
        }
    } else {
        echo "⚠️ No assignments returned!\n";
    }
    
} catch (\Exception $e) {
    echo "ERROR: {$e->getMessage()}\n";
    echo $e->getTraceAsString();
}

echo "\n=== CHECKING DATABASE ===\n";

use App\Models\Assignment;

$dbAssignments = Assignment::where('course_id', 4)->get();
echo "Assignments in database for course 4: {$dbAssignments->count()}\n";

foreach ($dbAssignments as $assign) {
    echo "  - {$assign->title} (ID: {$assign->id}, Status: {$assign->status})\n";
}

echo "\nDone!\n";
