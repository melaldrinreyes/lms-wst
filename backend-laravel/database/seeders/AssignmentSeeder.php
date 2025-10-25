<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AssignmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $assignments = [
            [
                'course_id' => 1, // CS101
                'title' => 'Programming Assignment 1: Variables and Data Types',
                'description' => 'Create a program that demonstrates the use of variables and different data types.',
                'due_date' => Carbon::now()->addDays(7),
                'max_points' => 100,
                'file_path' => null,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'course_id' => 1, // CS101
                'title' => 'Programming Assignment 2: Control Flow',
                'description' => 'Write a program using if-else statements and loops to solve a problem.',
                'due_date' => Carbon::now()->addDays(14),
                'max_points' => 100,
                'file_path' => null,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'course_id' => 2, // MATH101
                'title' => 'Problem Set 1: Linear Equations',
                'description' => 'Solve the given set of linear equations and show your work.',
                'due_date' => Carbon::now()->addDays(5),
                'max_points' => 50,
                'file_path' => null,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('assignments')->insert($assignments);
    }
}
