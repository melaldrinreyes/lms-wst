<?php

require 'vendor/autoload.php';

use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Support\Facades\Hash;

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== POPULATING REAL USER DATA ===\n\n";

// Real instructors data
$instructorsData = [
    [
        'name' => 'Dr. Maria Santos',
        'email' => 'maria.santos@minsu.edu.ph',
        'phone' => '09171234567',
        'address' => 'Mindanao State University, Marawi City',
        'password' => 'SecurePass123!',
    ],
    [
        'name' => 'Prof. Juan Dela Cruz',
        'email' => 'juan.delacruz@minsu.edu.ph',
        'phone' => '09175678901',
        'address' => 'Mindanao State University, Marawi City',
        'password' => 'SecurePass456!',
    ],
    [
        'name' => 'Dr. Rosa Aquino',
        'email' => 'rosa.aquino@minsu.edu.ph',
        'phone' => '09179876543',
        'address' => 'Mindanao State University, Marawi City',
        'password' => 'SecurePass789!',
    ],
];

// Real students data
$studentsData = [
    [
        'name' => 'Ramon Reyes',
        'email' => 'ramon.reyes@student.minsu.edu.ph',
        'phone' => '09191234567',
        'address' => 'Marawi City',
        'password' => 'StudentPass123!',
    ],
    [
        'name' => 'Angela Cruz',
        'email' => 'angela.cruz@student.minsu.edu.ph',
        'phone' => '09195678901',
        'address' => 'Iligan City',
        'password' => 'StudentPass456!',
    ],
    [
        'name' => 'Miguel Torres',
        'email' => 'miguel.torres@student.minsu.edu.ph',
        'phone' => '09199876543',
        'address' => 'Cagayan de Oro City',
        'password' => 'StudentPass789!',
    ],
    [
        'name' => 'Diana Lopez',
        'email' => 'diana.lopez@student.minsu.edu.ph',
        'phone' => '09194567890',
        'address' => 'Butuan City',
        'password' => 'StudentPass012!',
    ],
];

// Create instructors
echo "Creating instructors...\n";
$instructors = [];
foreach ($instructorsData as $instructorData) {
    $existing = User::where('email', $instructorData['email'])->first();
    if ($existing) {
        echo "  ✓ {$instructorData['name']} already exists\n";
        $instructors[] = $existing;
    } else {
        $instructor = User::create([
            'name' => $instructorData['name'],
            'email' => $instructorData['email'],
            'phone' => $instructorData['phone'],
            'address' => $instructorData['address'],
            'password' => Hash::make($instructorData['password']),
            'role_id' => 2, // Faculty
            'status' => 'active',
            'profile_image' => 'https://ui-avatars.com/api/?name=' . urlencode($instructorData['name']) . '&background=3b82f6&color=fff',
        ]);
        echo "  ✓ Created: {$instructor->name}\n";
        $instructors[] = $instructor;
    }
}

// Create students
echo "\nCreating students...\n";
$students = [];
foreach ($studentsData as $studentData) {
    $existing = User::where('email', $studentData['email'])->first();
    if ($existing) {
        echo "  ✓ {$studentData['name']} already exists\n";
        $students[] = $existing;
    } else {
        $student = User::create([
            'name' => $studentData['name'],
            'email' => $studentData['email'],
            'phone' => $studentData['phone'],
            'address' => $studentData['address'],
            'password' => Hash::make($studentData['password']),
            'role_id' => 3, // Student
            'status' => 'active',
            'profile_image' => 'https://ui-avatars.com/api/?name=' . urlencode($studentData['name']) . '&background=10b981&color=fff',
        ]);
        echo "  ✓ Created: {$student->name}\n";
        $students[] = $student;
    }
}

// Create courses with real instructors
echo "\nCreating courses...\n";
$coursesData = [
    [
        'course_code' => 'CS101',
        'course_name' => 'Introduction to Computer Science',
        'description' => 'Fundamentals of computer science and programming',
        'credits' => 3,
        'year_level' => '1st Year',
        'semester' => '1st Semester',
        'section' => 'A',
        'instructor_index' => 0,
    ],
    [
        'course_code' => 'MATH101',
        'course_name' => 'Calculus I',
        'description' => 'Differential and integral calculus',
        'credits' => 4,
        'year_level' => '1st Year',
        'semester' => '1st Semester',
        'section' => 'A',
        'instructor_index' => 1,
    ],
    [
        'course_code' => 'ENG101',
        'course_name' => 'English Composition',
        'description' => 'Academic writing and communication skills',
        'credits' => 3,
        'year_level' => '1st Year',
        'semester' => '1st Semester',
        'section' => 'A',
        'instructor_index' => 2,
    ],
    [
        'course_code' => 'PHYS101',
        'course_name' => 'Physics I',
        'description' => 'Mechanics and thermodynamics',
        'credits' => 4,
        'year_level' => '1st Year',
        'semester' => '1st Semester',
        'section' => 'B',
        'instructor_index' => 0,
    ],
    [
        'course_code' => 'CHEM101',
        'course_name' => 'General Chemistry',
        'description' => 'Introduction to chemistry principles',
        'credits' => 3,
        'year_level' => '1st Year',
        'semester' => '1st Semester',
        'section' => 'B',
        'instructor_index' => 1,
    ],
];

$courses = [];
foreach ($coursesData as $courseData) {
    $existing = Course::where('course_code', $courseData['course_code'])->first();
    if ($existing) {
        echo "  ✓ {$courseData['course_code']} already exists\n";
        $courses[] = $existing;
    } else {
        $course = Course::create([
            'faculty_id' => $instructors[$courseData['instructor_index']]->id,
            'course_code' => $courseData['course_code'],
            'course_name' => $courseData['course_name'],
            'description' => $courseData['description'],
            'credits' => $courseData['credits'],
            'year_level' => $courseData['year_level'],
            'semester' => $courseData['semester'],
            'section' => $courseData['section'],
            'academic_year' => date('Y') . '-' . (date('Y') + 1),
            'status' => 'active',
        ]);
        echo "  ✓ Created: {$course->course_code} ({$instructors[$courseData['instructor_index']]->name})\n";
        $courses[] = $course;
    }
}

// Enroll students in courses
echo "\nEnrolling students in courses...\n";
foreach ($students as $student) {
    $randomCourses = collect($courses)->random(rand(2, 3));
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
        }
    }
    echo "  ✓ {$student->name} enrolled in " . $student->enrollments()->count() . " courses\n";
}

echo "\n=== SUMMARY ===\n";
echo "Total Admins: " . User::where('role_id', 1)->count() . "\n";
echo "Total Instructors: " . User::where('role_id', 2)->count() . "\n";
echo "Total Students: " . User::where('role_id', 3)->count() . "\n";
echo "Total Courses: " . Course::count() . "\n";
echo "Total Enrollments: " . Enrollment::count() . "\n";
echo "\n✓ Database populated with real data!\n";
