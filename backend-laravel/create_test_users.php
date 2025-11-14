<?php
require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$users = [
    ['name' => 'Teacher One', 'email' => 'teacher1@gmail.com', 'role_id' => 2],
    ['name' => 'Teacher Two', 'email' => 'teacher2@gmail.com', 'role_id' => 2],
    ['name' => 'John Student', 'email' => 'john.student@gmail.com', 'role_id' => 3, 'student_id' => '2024-00002'],
    ['name' => 'Jane Student', 'email' => 'jane.student@gmail.com', 'role_id' => 3, 'student_id' => '2024-00003'],
];

echo "Creating test users...\n";
foreach ($users as $data) {
    $existing = User::where('email', $data['email'])->exists();
    if (!$existing) {
        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make('password'),
            'role_id' => $data['role_id'],
            'student_id' => $data['student_id'] ?? null,
            'status' => 'active',
            'profile_image' => 'https://ui-avatars.com/api/?name=' . urlencode($data['name']) . '&background=random'
        ]);
        echo "✓ Created: {$data['email']}\n";
    } else {
        echo "- Already exists: {$data['email']}\n";
    }
}

echo "\n=== All Users ===\n";
User::all()->each(function($u) {
    $roles = [1 => 'Admin', 2 => 'Faculty', 3 => 'Student'];
    $role = $roles[$u->role_id] ?? 'Unknown';
    echo "{$u->email} ({$role})\n";
});
