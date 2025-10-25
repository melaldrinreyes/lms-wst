<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modules = [
            // CS101 Modules
            [
                'course_id' => 1,
                'module_title' => 'Week 1: Introduction to Programming',
                'description' => 'Overview of programming concepts and languages',
                'module_order' => 1,
                'content' => 'Introduction to basic programming concepts, variables, and data types.',
                'file_path' => null,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'course_id' => 1,
                'module_title' => 'Week 2: Control Structures',
                'description' => 'Conditional statements and loops',
                'module_order' => 2,
                'content' => 'Learn about if-else statements, switch cases, for loops, and while loops.',
                'file_path' => null,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'course_id' => 1,
                'module_title' => 'Week 3: Functions and Methods',
                'description' => 'Creating reusable code blocks',
                'module_order' => 3,
                'content' => 'Understanding functions, parameters, return values, and scope.',
                'file_path' => null,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // MATH101 Modules
            [
                'course_id' => 2,
                'module_title' => 'Chapter 1: Linear Equations',
                'description' => 'Solving linear equations and inequalities',
                'module_order' => 1,
                'content' => 'Introduction to linear equations, graphing, and solving systems.',
                'file_path' => null,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'course_id' => 2,
                'module_title' => 'Chapter 2: Quadratic Equations',
                'description' => 'Factoring and solving quadratic equations',
                'module_order' => 2,
                'content' => 'Learn about quadratic formula, completing the square, and applications.',
                'file_path' => null,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('modules')->insert($modules);
    }
}
