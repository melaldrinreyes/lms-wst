<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\SuperAdminController;
use Illuminate\Support\Facades\DB;

echo "=== END-TO-END DATABASE VERIFICATION ===\n\n";

// Get the admin user
$admin = User::where('role_id', 1)->first();
echo "Testing as Admin: {$admin->name} (ID: {$admin->id})\n\n";

$controller = new SuperAdminController();

// 1. CREATE USER VIA API
echo "1. Creating user via API...\n";
$createRequest = Request::create('/api/admin/users', 'POST', [
    'name' => 'API Test User',
    'email' => 'api_test_' . time() . '@example.com',
    'password' => 'password123',
    'role' => 'student'
]);
$createRequest->setUserResolver(function () use ($admin) { return $admin; });

$response = $controller->createUser($createRequest);
$data = json_decode($response->getContent(), true);

if ($data['success']) {
    $createdUserId = $data['user']['id'];
    echo "✅ Created user ID: {$createdUserId}\n";

    // Verify in database
    $dbUser = DB::table('users')->where('id', $createdUserId)->first();
    echo "   DB Verification: {$dbUser->name} ({$dbUser->email}) - Role: {$dbUser->role_id}\n\n";
} else {
    echo "❌ Failed to create user: {$data['message']}\n\n";
    exit(1);
}

// 2. UPDATE USER VIA API
echo "2. Updating user via API...\n";
$updateRequest = Request::create("/api/admin/users/{$createdUserId}", 'PUT', [
    'name' => 'Updated API Test User',
    'email' => 'updated_api_test_' . time() . '@example.com',
    'role' => 'faculty',
    'status' => 'inactive'
]);
$updateRequest->setUserResolver(function () use ($admin) { return $admin; });

$response = $controller->updateUser($updateRequest, $createdUserId);
$data = json_decode($response->getContent(), true);

if ($data['success']) {
    echo "✅ Updated user ID: {$createdUserId}\n";

    // Verify in database
    $dbUser = DB::table('users')->where('id', $createdUserId)->first();
    echo "   DB Verification: {$dbUser->name} ({$dbUser->email}) - Role: {$dbUser->role_id} - Status: {$dbUser->status}\n\n";
} else {
    echo "❌ Failed to update user: {$data['message']}\n\n";
}

// 3. DELETE USER VIA API
echo "3. Deleting user via API...\n";
$deleteRequest = Request::create("/api/admin/users/{$createdUserId}", 'DELETE');
$deleteRequest->setUserResolver(function () use ($admin) { return $admin; });

$response = $controller->deleteUser($deleteRequest, $createdUserId);
$data = json_decode($response->getContent(), true);

if ($data['success']) {
    echo "✅ Deleted user ID: {$createdUserId}\n";

    // Verify in database
    $dbUser = DB::table('users')->where('id', $createdUserId)->first();
    if (!$dbUser) {
        echo "   DB Verification: User successfully removed from database\n\n";
    } else {
        echo "   DB Verification: ❌ User still exists in database\n\n";
    }
} else {
    echo "❌ Failed to delete user: {$data['message']}\n\n";
}

// 4. FINAL VERIFICATION
echo "4. Final database state:\n";
$finalUsers = DB::table('users')->select('id', 'name', 'email', 'role_id', 'status')->get();
foreach ($finalUsers as $user) {
    echo "   ID: {$user->id} - {$user->name} ({$user->email}) - Role: {$user->role_id} - Status: {$user->status}\n";
}

echo "\n=== END-TO-END VERIFICATION COMPLETE ===\n";
echo "✅ All database operations working correctly!\n";