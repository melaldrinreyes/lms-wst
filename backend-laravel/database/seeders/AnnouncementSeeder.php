<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnnouncementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $announcements = [
            [
                'course_id' => null, // System-wide announcement
                'title' => 'Welcome to MINSU E-LEARN Platform',
                'content' => 'Welcome to the official Learning Management System of Mindoro State University. We are excited to have you here!',
                'created_by' => 1, // Admin
                'priority' => 'high',
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'course_id' => 1, // CS101
                'title' => 'First Week Assignment Posted',
                'content' => 'The first programming assignment has been posted. Please check the assignments section and submit before the due date.',
                'created_by' => 2, // Dr. John Smith
                'priority' => 'normal',
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'course_id' => 2, // MATH101
                'title' => 'Midterm Exam Schedule',
                'content' => 'Midterm examinations will be held next week. Please review all modules and practice problems.',
                'created_by' => 2, // Dr. John Smith
                'priority' => 'high',
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('announcements')->insert($announcements);
    }
}
