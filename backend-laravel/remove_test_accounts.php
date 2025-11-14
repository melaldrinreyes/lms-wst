<?php

require 'vendor/autoload.php';

use App\Models\User;

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== REMOVING TEST ACCOUNTS ===\n\n";

// Test accounts to remove (all except the real admin)
$testAccounts = [
    'student@test.com',
    'faculty@test.com',
    'admin@test.com',
    'student123@gmail.com',
    'teacher1@gmail.com',
    'teacher2@gmail.com',
    'john.student@gmail.com',
    'jane.student@gmail.com',
    // Keep only: admin@minsu.edu.ph
];

$deletedCount = 0;
foreach ($testAccounts as $email) {
    $user = User::where('email', $email)->first();
    if ($user) {
        echo "  ✓ Removing: {$user->name} ({$email})\n";
        $user->delete();
        $deletedCount++;
    }
}

echo "\n=== RESULT ===\n";
echo "Deleted: {$deletedCount} test accounts\n";
echo "Remaining Users:\n";

$remainingUsers = User::all(['id', 'name', 'email', 'role_id']);
foreach ($remainingUsers as $user) {
    $roleNames = ['1' => 'Admin', '2' => 'Faculty', '3' => 'Student'];
    $role = $roleNames[$user->role_id] ?? 'Unknown';
    echo "  - {$user->name} ({$user->email}) - {$role}\n";
}

echo "\nDone!\n";
