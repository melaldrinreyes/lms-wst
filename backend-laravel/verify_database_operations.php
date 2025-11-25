<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DATABASE VERIFICATION FOR USER MANAGEMENT ===\n\n";

echo "1. CURRENT USERS IN DATABASE:\n";
$users = DB::table('users')->select('id', 'name', 'email', 'role_id', 'status')->get();
foreach ($users as $user) {
    echo "ID: {$user->id} - {$user->name} ({$user->email}) - Role: {$user->role_id} - Status: {$user->status}\n";
}
echo "\n";

echo "2. CREATING A TEST USER...\n";
DB::table('users')->insert([
    'name' => 'Database Test User',
    'email' => 'dbtest' . time() . '@example.com',
    'password' => bcrypt('password123'),
    'role_id' => 3, // student
    'status' => 'active',
    'created_at' => now(),
    'updated_at' => now(),
]);

$testUser = DB::table('users')->where('name', 'Database Test User')->first();
echo "Created test user: ID {$testUser->id} - {$testUser->name}\n\n";

echo "3. UPDATING THE TEST USER...\n";
DB::table('users')->where('id', $testUser->id)->update([
    'name' => 'Updated Database Test User',
    'email' => 'updated' . time() . '@example.com',
    'role_id' => 2, // faculty
    'status' => 'inactive',
    'updated_at' => now(),
]);

$updatedUser = DB::table('users')->where('id', $testUser->id)->first();
echo "Updated user: ID {$updatedUser->id} - {$updatedUser->name} ({$updatedUser->email}) - Role: {$updatedUser->role_id} - Status: {$updatedUser->status}\n\n";

echo "4. DELETING THE TEST USER...\n";
DB::table('users')->where('id', $testUser->id)->delete();

$deletedUser = DB::table('users')->where('id', $testUser->id)->first();
if (!$deletedUser) {
    echo "✅ User successfully deleted from database\n\n";
} else {
    echo "❌ User still exists in database\n\n";
}

echo "5. FINAL DATABASE STATE:\n";
$finalUsers = DB::table('users')->select('id', 'name', 'email', 'role_id', 'status')->get();
foreach ($finalUsers as $user) {
    echo "ID: {$user->id} - {$user->name} ({$user->email}) - Role: {$user->role_id} - Status: {$user->status}\n";
}

echo "\n=== DATABASE VERIFICATION COMPLETE ===\n";