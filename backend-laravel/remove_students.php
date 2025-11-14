<?php

require 'vendor/autoload.php';

use App\Models\User;

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== REMOVING STUDENT ACCOUNTS ===\n\n";

$students = User::where('role_id', 3)->get();

foreach ($students as $student) {
    echo "  ✓ Removing: {$student->name} ({$student->email})\n";
    $student->delete();
}

echo "\n=== RESULT ===\n";
echo "Students remaining: " . User::where('role_id', 3)->count() . "\n";
echo "Total users in database: " . User::count() . "\n";
echo "\nRemaining users:\n";
$remaining = User::all(['id', 'name', 'email', 'role_id']);
foreach ($remaining as $user) {
    $roles = ['1' => 'Admin', '2' => 'Faculty', '3' => 'Student'];
    $role = $roles[$user->role_id] ?? 'Unknown';
    echo "  - {$user->name} ({$user->email}) - {$role}\n";
}
echo "\n✓ Done!\n";
