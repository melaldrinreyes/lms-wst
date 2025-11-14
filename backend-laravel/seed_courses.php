<?php
require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use Carbon\Carbon;

echo "=== SEEDING TEST DATA ===\n\n";

// Get faculty members
$faculty = User::where('role_id', 2)->get();

if ($faculty->isEmpty()) {
    echo "❌ No faculty members found. Please create faculty accounts first.\n";
    exit;
}

echo "Found " . $faculty->count() . " faculty members\n\n";

// Create courses if they don't exist
$coursesData = [
    [
        'course_code' => 'CS101',
        'course_name' => 'Introduction to Computer Science',
        'description' => 'Fundamentals of programming and computer science',
        'year_level' => '1st Year',
        'section' => 'A',
        'semester' => '1st Semester',
        'credits' => 3,
    ],
    [
        'course_code' => 'MATH101',
        'course_name' => 'Calculus I',
        'description' => 'Differential and integral calculus',
        'year_level' => '1st Year',
        'section' => 'B',
        'semester' => '1st Semester',
        'credits' => 4,
    ],
    [
        'course_code' => 'ENG101',
        'course_name' => 'English Composition',
        'description' => 'Academic writing and communication',
        'year_level' => '1st Year',
        'section' => 'C',
        'semester' => '1st Semester',
        'credits' => 3,
    ],
    [
        'course_code' => 'PHYS101',
        'course_name' => 'Physics I',
        'description' => 'Mechanics and thermodynamics',
        'year_level' => '1st Year',
        'section' => 'A',
        'semester' => '1st Semester',
        'credits' => 4,
    ],
    [
        'course_code' => 'CHEM101',
        'course_name' => 'Chemistry I',
        'description' => 'General chemistry and laboratory',
        'year_level' => '1st Year',
        'section' => 'B',
        'semester' => '1st Semester',
        'credits' => 4,
    ],
];

echo "Creating courses...\n";
$courses = [];
foreach ($coursesData as $courseData) {
    $existing = Course::where('course_code', $courseData['course_code'])->first();
    if ($existing) {
        $courses[] = $existing;
        echo "  ✓ {$courseData['course_code']} already exists\n";
    } else {
        $facultyMember = $faculty->random();
        $course = Course::create([
            'faculty_id' => $facultyMember->id,
            'course_code' => $courseData['course_code'],
            'course_name' => $courseData['course_name'],
            'description' => $courseData['description'],
            'year_level' => $courseData['year_level'],
            'section' => $courseData['section'],
            'semester' => $courseData['semester'],
            'credits' => $courseData['credits'],
            'academic_year' => date('Y') . '-' . (date('Y') + 1),
            'status' => 'active',
            'created_at' => now(),
        ]);
        $courses[] = $course;
        echo "  ✓ Created {$courseData['course_code']} (Faculty: {$facultyMember->email})\n";
    }
}

// Get students
$students = User::where('role_id', 3)->get();
echo "\n\nFound " . $students->count() . " students\n";

// Enroll students in courses
echo "\nEnrolling students in courses...\n";
foreach ($students as $student) {
    // Randomly enroll each student in 2-3 courses
    $numCourses = random_int(2, 3);
    $randomCourses = collect($courses)->random($numCourses);
    
    foreach ($randomCourses as $course) {
        $existing = Enrollment::where('student_id', $student->id)
            ->where('course_id', $course->id)
            ->first();
        
        if (!$existing) {
            Enrollment::create([
                'student_id' => $student->id,
                'course_id' => $course->id,
                'enrolled_at' => now(),
                'status' => 'enrolled',
            ]);
            echo "  ✓ {$student->email} enrolled in {$course->course_code}\n";
        }
    }
}

echo "\n=== SEEDING COMPLETE ===\n\n";

echo "Summary:\n";
echo "  Teachers: " . User::where('role_id', 2)->count() . "\n";
echo "  Courses: " . Course::count() . "\n";
echo "  Students: " . User::where('role_id', 3)->count() . "\n";
echo "  Enrollments: " . Enrollment::count() . "\n";
