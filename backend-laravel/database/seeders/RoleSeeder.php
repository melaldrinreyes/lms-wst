<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'role_name' => 'admin',
                'description' => 'System administrator with full access',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'faculty',
                'description' => 'Faculty member who can create and manage courses',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'student',
                'description' => 'Student enrolled in courses',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('roles')->insert($roles);
    }
}
