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
        $users = [
            [
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
            ],
            [
                'role_id' => 2, // faculty
                'student_id' => null,
                'name' => 'Dr. John Smith',
                'email' => 'john.smith@minsu.edu.ph',
                'password' => Hash::make('admin123'),
                'phone' => '+63-912-345-6790',
                'address' => 'Victoria, Oriental Mindoro',
                'date_of_birth' => '1980-05-20',
                'gender' => 'male',
                'profile_image' => 'https://ui-avatars.com/api/?name=John+Smith&size=200&background=3b82f6&color=fff',
                'status' => 'active',
                'last_login' => now(),
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 3, // student
                'student_id' => '2024-00001',
                'name' => 'Juan Dela Cruz',
                'email' => 'juan.delacruz@minsu.edu.ph',
                'password' => Hash::make('admin123'),
                'phone' => '+63-912-345-6791',
                'address' => 'Bongabong, Oriental Mindoro',
                'date_of_birth' => '2002-08-10',
                'gender' => 'male',
                'profile_image' => 'https://ui-avatars.com/api/?name=Juan+Dela+Cruz&size=200&background=10b981&color=fff',
                'status' => 'active',
                'last_login' => now(),
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 3, // student
                'student_id' => '2024-00002',
                'name' => 'Maria Clara Santos',
                'email' => 'maria.santos@minsu.edu.ph',
                'password' => Hash::make('admin123'),
                'phone' => '+63-912-345-6792',
                'address' => 'Calapan City, Oriental Mindoro',
                'date_of_birth' => '2003-03-15',
                'gender' => 'female',
                'profile_image' => 'https://ui-avatars.com/api/?name=Maria+Santos&size=200&background=ec4899&color=fff',
                'status' => 'active',
                'last_login' => now(),
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('users')->insert($users);
    }
}
