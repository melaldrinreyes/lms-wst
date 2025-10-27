<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Assignment;
use App\Models\Submission;
use Carbon\Carbon;

class TestSubmissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all students
        $students = User::where('role_id', 3)->get();
        
        if ($students->isEmpty()) {
            $this->command->error('No students found in database!');
            return;
        }

        // Get all published assignments from ALL courses
        $assignments = Assignment::where('status', 'published')
            ->with('course')
            ->get();
        
        if ($assignments->isEmpty()) {
            $this->command->error('No published assignments found!');
            $this->command->info('Creating published assignment for dbms course...');
            
            // Find dbms course
            $dbmsCourse = \App\Models\Course::where('course_name', 'like', '%dbms%')
                ->orWhere('course_code', 'like', '%dbms%')
                ->first();
            
            if ($dbmsCourse) {
                // Create a published assignment for dbms
                $assignment = Assignment::create([
                    'course_id' => $dbmsCourse->id,
                    'title' => 'Database Design Assignment',
                    'description' => 'Design a normalized database schema for an e-commerce system',
                    'due_date' => now()->addDays(7),
                    'max_points' => 100,
                    'status' => 'published',
                ]);
                $this->command->info("Created assignment: {$assignment->title} for {$dbmsCourse->course_name}");
                $assignments = collect([$assignment]);
            } else {
                return;
            }
        }

        $this->command->info("Found {$students->count()} students and {$assignments->count()} published assignments");
        $this->command->info("Courses with assignments:");
        foreach ($assignments->groupBy('course_id') as $courseId => $courseAssignments) {
            $course = $courseAssignments->first()->course;
            $this->command->info("  - {$course->course_name} ({$course->course_code}): {$courseAssignments->count()} assignment(s)");
        }
        
        // Create submissions for each assignment from different students
        $submissionsCreated = 0;
        
        foreach ($assignments as $assignment) {
            // Get enrolled students for THIS specific course
            $courseStudents = \App\Models\Enrollment::where('course_id', $assignment->course_id)
                ->where('status', 'active')
                ->with('user')
                ->get()
                ->pluck('user');
            
            if ($courseStudents->isEmpty()) {
                $this->command->warn("No enrolled students in course: {$assignment->course->course_name}");
                continue;
            }
            
            // Get random 2-4 students (or all if less than 2)
            $numSubmissions = min(rand(2, 4), $courseStudents->count());
            $randomStudents = $courseStudents->random($numSubmissions);
            
            foreach ($randomStudents as $student) {
                // Check if submission already exists
                $exists = Submission::where('assignment_id', $assignment->id)
                    ->where('student_id', $student->id)
                    ->exists();
                
                if ($exists) {
                    $this->command->warn("Submission already exists for {$student->first_name} {$student->last_name} on assignment: {$assignment->title}");
                    continue;
                }

                // Create submission with random status
                $isGraded = rand(0, 1) == 1; // 50% chance of being graded
                
                $submission = Submission::create([
                    'assignment_id' => $assignment->id,
                    'student_id' => $student->id,
                    'submission_text' => "This is a test submission from {$student->first_name} {$student->last_name} for assignment: {$assignment->title}",
                    'file_path' => null, // No file for test data
                    'submitted_at' => Carbon::now()->subDays(rand(0, 7)),
                    'grade' => $isGraded ? rand(70, 100) : null,
                    'feedback' => $isGraded ? 'Good work! Keep it up.' : null,
                    'graded_at' => $isGraded ? Carbon::now()->subDays(rand(0, 3)) : null,
                ]);

                $this->command->info("✓ {$student->first_name} {$student->last_name} -> [{$assignment->course->course_code}] {$assignment->title}" . ($isGraded ? " (Graded: {$submission->grade})" : " (Pending)"));
                $submissionsCreated++;
            }
        }

        $this->command->info("\n✅ Successfully created {$submissionsCreated} test submissions!");
    }
}
