<?php

// Test script for student courses API endpoints
// Run this with: php test_student_courses.php

require_once 'vendor/autoload.php';

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;
use App\Models\User;
use App\Models\Enrollment;
use App\Models\Course;

// Simulate authentication
$user = User::where('role_id', 3)->first(); // Get first student
if (!$user) {
    echo "No student user found. Please create test data first.\n";
    exit(1);
}

echo "Testing Student Courses API Endpoints\n";
echo "=====================================\n\n";

// Test 1: Get student's enrolled courses
echo "Test 1: GET /api/student/courses (myClasses)\n";
try {
    $request = new Request();
    $request->merge(['user' => $user]); // Simulate authenticated user

    $controller = new StudentController();
    $response = $controller->myClasses($request);
    $data = json_decode($response->getContent(), true);

    if ($data['success']) {
        echo "✅ SUCCESS: Retrieved " . count($data['classes']) . " enrolled courses\n";
        if (count($data['classes']) > 0) {
            $firstCourse = $data['classes'][0];
            echo "   First course: {$firstCourse['course_name']} ({$firstCourse['course_code']})\n";
            $courseId = $firstCourse['id'];
        }
    } else {
        echo "❌ FAILED: {$data['message']}\n";
    }
} catch (Exception $e) {
    echo "❌ ERROR: {$e->getMessage()}\n";
}

echo "\n";

// Test 2: Get specific course details (if we have a course)
if (isset($courseId)) {
    echo "Test 2: GET /api/student/courses/{$courseId} (showCourse)\n";
    try {
        $request = new Request();
        $request->merge(['user' => $user]); // Simulate authenticated user

        $controller = new StudentController();
        $response = $controller->showCourse($courseId, $request);
        $data = json_decode($response->getContent(), true);

        if ($data['success']) {
            echo "✅ SUCCESS: Retrieved course details for {$data['course']['course_name']}\n";
            echo "   Assignments: " . count($data['course']['assignments']) . "\n";
            echo "   Announcements: " . count($data['course']['announcements']) . "\n";
        } else {
            echo "❌ FAILED: {$data['message']}\n";
        }
    } catch (Exception $e) {
        echo "❌ ERROR: {$e->getMessage()}\n";
    }
} else {
    echo "Test 2: SKIPPED - No enrolled courses found\n";
}

echo "\n";

// Test 3: Try to access a course the student is not enrolled in
echo "Test 3: GET /api/student/courses/999999 (non-enrolled course)\n";
try {
    $request = new Request();
    $request->merge(['user' => $user]); // Simulate authenticated user

    $controller = new StudentController();
    $response = $controller->showCourse(999999, $request);
    $data = json_decode($response->getContent(), true);

    if (!$data['success'] && $response->getStatusCode() == 403) {
        echo "✅ SUCCESS: Correctly denied access to non-enrolled course\n";
    } else {
        echo "❌ UNEXPECTED: Should have been denied access\n";
    }
} catch (Exception $e) {
    echo "❌ ERROR: {$e->getMessage()}\n";
}

echo "\nTest completed!\n";