<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\SuperAdminController;

echo "=== TESTING INSTRUCTORS API ENDPOINT ===\n\n";

// Get the admin user
$admin = User::where('role_id', 1)->first();

if (!$admin) {
    echo "ERROR: Admin user not found!\n";
    exit(1);
}

echo "Testing as Admin: {$admin->name} (ID: {$admin->id}, Role: {$admin->role_id})\n\n";

// Create a mock request
$request = Request::create('/api/admin/instructors', 'GET');
$request->setUserResolver(function () use ($admin) {
    return $admin;
});

// Create controller instance
$controller = new SuperAdminController();

echo "Making request: GET /api/admin/instructors\n\n";

try {
    $response = $controller->getInstructors($request);
    $data = json_decode($response->getContent(), true);

    echo "Response Status: {$response->getStatusCode()}\n";
    echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";

    if ($data['success']) {
        echo "Instructors Count: " . count($data['instructors']) . "\n\n";

        if (count($data['instructors']) > 0) {
            echo "--- Instructors ---\n";
            foreach ($data['instructors'] as $instructor) {
                echo "ID: {$instructor['id']}\n";
                echo "  Name: {$instructor['name']}\n";
                echo "  Email: {$instructor['email']}\n";
                echo "  Status: {$instructor['status']}\n";
                echo "  Statistics:\n";
                echo "    Courses: {$instructor['statistics']['courses']}\n";
                echo "    Students: {$instructor['statistics']['students']}\n";
                echo "    Graded: {$instructor['statistics']['graded']}\n";
                echo "    Pending: {$instructor['statistics']['pending']}\n";
                echo "\n";
            }
        }
    } else {
        echo "Error: {$data['message']}\n";
    }

} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}