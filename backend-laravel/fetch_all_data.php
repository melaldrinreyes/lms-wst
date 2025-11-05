<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Course;
use App\Models\Assignment;
use App\Models\Submission;
use App\Models\Module;

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║          COMPLETE DATABASE DUMP - LMS APPLICATION              ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// ====== USERS ======
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ USERS                                                           │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";
$users = User::with('role')->get();
echo "Total users: " . $users->count() . "\n\n";

foreach ($users as $user) {
    $roleName = $user->role->role_name ?? 'No role';
    echo "ID: {$user->id}\n";
    echo "  Name: {$user->name}\n";
    echo "  Email: {$user->email}\n";
    echo "  Role: {$roleName} (ID: {$user->role_id})\n";
    echo "  Student ID: " . ($user->student_id ?? 'N/A') . "\n";
    echo "  Created: {$user->created_at}\n";
    echo "  ────────────────────────────────────────────────────────────\n";
}

// ====== COURSES ======
echo "\n┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ COURSES                                                         │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";
$courses = Course::with('faculty')->get();
echo "Total courses: " . $courses->count() . "\n\n";

foreach ($courses as $course) {
    $facultyName = $course->faculty->name ?? 'No faculty assigned';
    echo "ID: {$course->id}\n";
    echo "  Name: {$course->course_name}\n";
    echo "  Code: {$course->course_code}\n";
    echo "  Faculty: {$facultyName} (ID: {$course->faculty_id})\n";
    echo "  Description: " . ($course->description ?? 'N/A') . "\n";
    echo "  Status: " . ($course->status ?? 'N/A') . "\n";
    echo "  Modules: " . $course->modules()->count() . "\n";
    echo "  Assignments: " . $course->assignments()->count() . "\n";
    echo "  Enrolled Students: " . $course->enrollments()->count() . "\n";
    echo "  Created: {$course->created_at}\n";
    echo "  ────────────────────────────────────────────────────────────\n";
}

// ====== MODULES ======
echo "\n┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ MODULES                                                         │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";
$modules = Module::with('course')->get();
echo "Total modules: " . $modules->count() . "\n\n";

foreach ($modules as $module) {
    $courseName = $module->course->course_name ?? 'Unknown course';
    echo "ID: {$module->id}\n";
    echo "  Title: {$module->title}\n";
    echo "  Course: {$courseName} (ID: {$module->course_id})\n";
    echo "  Description: " . ($module->description ?? 'N/A') . "\n";
    echo "  Order: " . ($module->order ?? 'N/A') . "\n";
    echo "  Status: " . ($module->status ?? 'N/A') . "\n";
    echo "  File Path: " . ($module->file_path ?? 'No file') . "\n";
    echo "  Created: {$module->created_at}\n";
    echo "  ────────────────────────────────────────────────────────────\n";
}

// ====== ASSIGNMENTS ======
echo "\n┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ ASSIGNMENTS                                                     │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";
$assignments = Assignment::with('course')->get();
echo "Total assignments: " . $assignments->count() . "\n\n";

foreach ($assignments as $assignment) {
    $courseName = $assignment->course->course_name ?? 'Unknown course';
    echo "ID: {$assignment->id}\n";
    echo "  Title: {$assignment->title}\n";
    echo "  Course: {$courseName} (ID: {$assignment->course_id})\n";
    echo "  Description: " . ($assignment->description ?? 'N/A') . "\n";
    echo "  Due Date: " . ($assignment->due_date ?? 'N/A') . "\n";
    echo "  Max Points: " . ($assignment->max_points ?? 'N/A') . "\n";
    echo "  Status: " . ($assignment->status ?? 'N/A') . "\n";
    echo "  File Path: " . ($assignment->file_path ?? 'No file') . "\n";
    echo "  Submissions: " . $assignment->submissions()->count() . "\n";
    echo "  Created: {$assignment->created_at}\n";
    echo "  ────────────────────────────────────────────────────────────\n";
}

// ====== SUBMISSIONS ======
echo "\n┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ SUBMISSIONS                                                     │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";
$submissions = Submission::with(['user', 'assignment.course'])->get();
echo "Total submissions: " . $submissions->count() . "\n\n";

foreach ($submissions as $submission) {
    $studentName = $submission->user->name ?? 'Unknown student';
    $assignmentTitle = $submission->assignment->title ?? 'Unknown assignment';
    $courseName = $submission->assignment->course->course_name ?? 'Unknown course';
    
    echo "ID: {$submission->id}\n";
    echo "  Student: {$studentName} (ID: {$submission->student_id})\n";
    echo "  Assignment: {$assignmentTitle} (ID: {$submission->assignment_id})\n";
    echo "  Course: {$courseName}\n";
    echo "  Submission Text: " . (strlen($submission->submission_text ?? '') > 100 
        ? substr($submission->submission_text, 0, 100) . '...' 
        : ($submission->submission_text ?? 'N/A')) . "\n";
    echo "  File Path: " . ($submission->file_path ?? 'No file') . "\n";
    echo "  Submitted At: {$submission->submitted_at}\n";
    echo "  Grade: " . ($submission->grade ?? 'Not graded') . "\n";
    echo "  Feedback: " . ($submission->feedback ?? 'No feedback') . "\n";
    echo "  Graded At: " . ($submission->graded_at ?? 'Not graded') . "\n";
    echo "  Status: " . ($submission->grade !== null ? 'graded' : 'pending') . "\n";
    echo "  Created: {$submission->created_at}\n";
    echo "  ────────────────────────────────────────────────────────────\n";
}

// ====== ENROLLMENTS ======
echo "\n┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ COURSE ENROLLMENTS                                              │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

foreach ($courses as $course) {
    $enrollments = $course->enrollments()->with('student')->get();
    if ($enrollments->count() > 0) {
        echo "Course: {$course->course_name} (ID: {$course->id})\n";
        echo "  Enrolled Students ({$enrollments->count()}):\n";
        foreach ($enrollments as $enrollment) {
            $studentName = $enrollment->student->name ?? 'Unknown';
            echo "    - {$studentName} (Student ID: {$enrollment->student_id})\n";
            echo "      Status: " . ($enrollment->status ?? 'enrolled') . "\n";
            echo "      Enrolled: {$enrollment->created_at}\n";
        }
        echo "  ────────────────────────────────────────────────────────────\n";
    }
}

// ====== SUMMARY STATISTICS ======
echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║ SUMMARY STATISTICS                                             ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$adminCount = User::where('role_id', 1)->count();
$facultyCount = User::where('role_id', 2)->count();
$studentCount = User::where('role_id', 3)->count();
$totalCourses = Course::count();
$totalModules = Module::count();
$totalAssignments = Assignment::count();
$totalSubmissions = Submission::count();
$gradedSubmissions = Submission::whereNotNull('grade')->count();
$pendingSubmissions = Submission::whereNull('grade')->count();

echo "Users:\n";
echo "  - Admins: {$adminCount}\n";
echo "  - Faculty: {$facultyCount}\n";
echo "  - Students: {$studentCount}\n";
echo "  - Total: {$users->count()}\n\n";

echo "Content:\n";
echo "  - Courses: {$totalCourses}\n";
echo "  - Modules: {$totalModules}\n";
echo "  - Assignments: {$totalAssignments}\n\n";

echo "Submissions:\n";
echo "  - Total: {$totalSubmissions}\n";
echo "  - Graded: {$gradedSubmissions}\n";
echo "  - Pending: {$pendingSubmissions}\n\n";

// ====== COURSE 4 DETAILED INFO ======
echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║ COURSE 4 (Database) - DETAILED VIEW                           ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$course4 = Course::with(['faculty', 'assignments.submissions.user', 'modules', 'enrollments.student'])->find(4);
if ($course4) {
    echo "Course Name: {$course4->course_name}\n";
    echo "Course Code: {$course4->course_code}\n";
    echo "Faculty: " . ($course4->faculty->name ?? 'N/A') . " (ID: {$course4->faculty_id})\n";
    echo "Status: " . ($course4->status ?? 'active') . "\n\n";
    
    echo "Modules ({$course4->modules->count()}):\n";
    foreach ($course4->modules as $mod) {
        echo "  - {$mod->title} (ID: {$mod->id})\n";
    }
    
    echo "\nAssignments ({$course4->assignments->count()}):\n";
    foreach ($course4->assignments as $assign) {
        $subCount = $assign->submissions->count();
        echo "  - {$assign->title} (ID: {$assign->id})\n";
        echo "    Due: " . ($assign->due_date ?? 'N/A') . " | Points: {$assign->max_points}\n";
        echo "    Submissions: {$subCount}\n";
        
        if ($subCount > 0) {
            foreach ($assign->submissions as $sub) {
                echo "      • {$sub->user->name} - " . ($sub->grade ? "Graded: {$sub->grade}" : "Pending") . "\n";
            }
        }
    }
    
    echo "\nEnrolled Students ({$course4->enrollments->count()}):\n";
    foreach ($course4->enrollments as $enroll) {
        echo "  - {$enroll->student->name} (ID: {$enroll->student_id})\n";
    }
}

echo "\n" . str_repeat("═", 66) . "\n";
echo "Database dump completed at " . now()->toDateTimeString() . "\n";
echo str_repeat("═", 66) . "\n";
