<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only create Super Admin account
        $admin = [
            'role_id' => 1, // admin
            'student_id' => null,
            'name' => 'System Administrator',
            'email' => 'admin@minsu.edu.ph',
            'password' => Hash::make('admin123'),
            'phone' => '+63-912-345-6789',
            'address' => 'MINSU Campus, Calapan City',
            'date_of_birth' => '1985-01-15',
            'gender' => 'male',
            'profile_image' => 'https://ui-avatars.com/api/?name=System+Administrator&size=200&background=f97316&color=fff',
            'status' => 'active',
            'last_login' => now(),
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Check if admin already exists
        $existingAdmin = DB::table('users')->where('email', 'admin@minsu.edu.ph')->first();
        
        if (!$existingAdmin) {
            DB::table('users')->insert($admin);
        }
    }
}
