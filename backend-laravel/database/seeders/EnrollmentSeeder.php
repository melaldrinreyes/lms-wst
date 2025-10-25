<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EnrollmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $enrollments = [
            [
                'student_id' => 3, // Juan Dela Cruz
                'course_id' => 1, // CS101
                'enrolled_at' => now(),
                'status' => 'enrolled',
                'final_grade' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'student_id' => 3, // Juan Dela Cruz
                'course_id' => 2, // MATH101
                'enrolled_at' => now(),
                'status' => 'enrolled',
                'final_grade' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'student_id' => 4, // Maria Clara Santos
                'course_id' => 1, // CS101
                'enrolled_at' => now(),
                'status' => 'enrolled',
                'final_grade' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'student_id' => 4, // Maria Clara Santos
                'course_id' => 3, // ENG101
                'enrolled_at' => now(),
                'status' => 'enrolled',
                'final_grade' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('enrollments')->insert($enrollments);
    }
}
