<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            [
                'course_code' => 'CS101',
                'course_name' => 'Introduction to Computer Science',
                'description' => 'Fundamentals of programming, algorithms, and computational thinking',
                'faculty_id' => 2, // Dr. John Smith
                'credits' => 3,
                'semester' => '1st Semester',
                'academic_year' => '2024-2025',
                'status' => 'active',
                'thumbnail' => 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'course_code' => 'MATH101',
                'course_name' => 'College Algebra',
                'description' => 'Introduction to algebraic concepts and problem solving',
                'faculty_id' => 2,
                'credits' => 3,
                'semester' => '1st Semester',
                'academic_year' => '2024-2025',
                'status' => 'active',
                'thumbnail' => 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'course_code' => 'ENG101',
                'course_name' => 'English Communication Skills',
                'description' => 'Development of effective written and oral communication',
                'faculty_id' => 2,
                'credits' => 3,
                'semester' => '1st Semester',
                'academic_year' => '2024-2025',
                'status' => 'active',
                'thumbnail' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('courses')->insert($courses);
    }
}
