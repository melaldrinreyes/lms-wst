<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\EnrollmentRequestController;
use App\Http\Controllers\NotificationController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Test route
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()->toDateTimeString(),
    ]);
});

// Debug route to check submissions
Route::get('/debug/submissions', function () {
    $submissions = \App\Models\Submission::with(['assignment.course', 'user'])->get();
    
    $grouped = $submissions->groupBy('assignment.course.id')->map(function($subs, $courseId) {
        $course = $subs->first()->assignment->course;
        return [
            'course_id' => $courseId,
            'course_name' => $course->course_name,
            'submissions_count' => $subs->count(),
            'submissions' => $subs->map(function($sub) {
                return [
                    'id' => $sub->id,
                    'assignment' => $sub->assignment->title,
                    'student' => $sub->user->first_name . ' ' . $sub->user->last_name,
                    'submitted_at' => $sub->submitted_at,
                    'grade' => $sub->grade,
                ];
            }),
        ];
    });
    
    return response()->json([
        'total_submissions' => $submissions->count(),
        'by_course' => $grouped,
    ]);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Test protected route
    Route::get('/test-auth', function (Request $request) {
        return response()->json([
            'success' => true,
            'message' => 'Authentication is working!',
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role_id' => $request->user()->role_id,
            ],
        ]);
    });
    
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    
    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    
    // Course routes (All authenticated users can view courses)
    Route::get('/courses/statistics/all', [CourseController::class, 'statistics']);
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    
    // Course creation and modification (Faculty and Admin only)
    Route::middleware(['check.role:2,1'])->group(function () {
        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{id}', [CourseController::class, 'update']);
        Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
    });
    
    // Enrollment management (Faculty and Admin)
    Route::middleware(['check.role:2,1'])->group(function () {
        Route::put('/courses/{courseId}/students/{studentId}/status', [CourseController::class, 'updateStudentStatus']);
        Route::delete('/courses/{courseId}/students/{studentId}', [CourseController::class, 'removeStudent']);
    });
    
    // Student enrollment (Students only)
    Route::middleware(['check.role:3'])->group(function () {
        Route::post('/courses/{id}/enroll', [CourseController::class, 'enroll']);
    });
    
    // Module routes (Faculty and Admin can manage, all can view)
    Route::get('/courses/{courseId}/modules', [ModuleController::class, 'index']);
    
    Route::middleware(['check.role:2,1'])->group(function () {
        Route::post('/modules', [ModuleController::class, 'store']);
        Route::put('/modules/{id}', [ModuleController::class, 'update']);
        Route::delete('/modules/{id}', [ModuleController::class, 'destroy']);
    });
    
    // Assignment routes (Faculty and Admin can manage, all can view)
    Route::get('/courses/{courseId}/assignments', [AssignmentController::class, 'index']);
    Route::get('/assignments/{id}', [AssignmentController::class, 'show']);
    
    Route::middleware(['check.role:2,1'])->group(function () {
        Route::post('/assignments', [AssignmentController::class, 'store']);
        Route::put('/assignments/{id}', [AssignmentController::class, 'update']);
        Route::delete('/assignments/{id}', [AssignmentController::class, 'destroy']);
    });
    
    // Submission routes (Faculty and Admin can grade)
    Route::get('/submissions', [SubmissionController::class, 'index']);
    Route::get('/submissions/{id}', [SubmissionController::class, 'show']);
    
    // Student submission route (Students can submit)
    Route::middleware(['check.role:3'])->group(function () {
        Route::post('/submissions', [SubmissionController::class, 'store']);
    });
    
    Route::middleware(['check.role:2,1'])->group(function () {
        Route::get('/submissions/pending/count', [SubmissionController::class, 'pendingCount']);
        Route::post('/submissions/{id}/grade', [SubmissionController::class, 'grade']);
    });
    
    // Student routes (Faculty and Admin can view all students)
    Route::middleware(['check.role:2,1'])->group(function () {
        Route::get('/students', [StudentController::class, 'index']);
        Route::get('/students/{id}', [StudentController::class, 'show']);
        Route::get('/courses/{courseId}/students', [StudentController::class, 'byCourse']);
    });
    
    // Student-specific routes (role_id = 3)
    Route::middleware(['check.role:3'])->group(function () {
        Route::get('/student/classes', [StudentController::class, 'myClasses']);
        Route::get('/student/assignments', [StudentController::class, 'myAssignments']);
    });
    
    // Faculty routes (role_id = 2)
    Route::middleware(['check.role:2'])->group(function () {
        Route::post('/faculty/students', [StudentController::class, 'store']);
        Route::get('/faculty/students', [StudentController::class, 'index']);
        
        // Class management routes
        Route::get('/faculty/classes', [ClassController::class, 'index']);
        Route::post('/faculty/classes', [ClassController::class, 'store']);
        Route::get('/faculty/classes/{id}', [ClassController::class, 'show']);
        Route::put('/faculty/classes/{id}', [ClassController::class, 'update']);
        Route::delete('/faculty/classes/{id}', [ClassController::class, 'destroy']);
        
        // Student enrollment routes
        Route::get('/faculty/classes/{id}/available-students', [ClassController::class, 'availableStudents']);
        Route::post('/faculty/classes/{id}/students', [ClassController::class, 'addStudent']);
        Route::delete('/faculty/classes/{id}/students/{studentId}', [ClassController::class, 'removeStudent']);
        
        // Enrollment request routes
        Route::get('/faculty/enrollment-requests', [EnrollmentRequestController::class, 'index']);
        Route::post('/faculty/enrollment-requests/{id}/approve', [EnrollmentRequestController::class, 'approve']);
        Route::post('/faculty/enrollment-requests/{id}/reject', [EnrollmentRequestController::class, 'reject']);
        Route::delete('/faculty/enrollment-requests/{id}', [EnrollmentRequestController::class, 'destroy']);
    });
    
    // Super Admin routes (role_id = 1)
    Route::middleware(['check.role:1'])->group(function () {
        Route::get('/admin/dashboard', [SuperAdminController::class, 'dashboard']);
        Route::get('/admin/instructors', [SuperAdminController::class, 'getInstructors']);
        Route::get('/admin/instructors/{id}', [SuperAdminController::class, 'getInstructor']);
        Route::post('/admin/instructors', [SuperAdminController::class, 'createInstructor']);
        Route::put('/admin/instructors/{id}', [SuperAdminController::class, 'updateInstructor']);
        Route::delete('/admin/instructors/{id}', [SuperAdminController::class, 'deleteInstructor']);
        Route::get('/admin/instructors/{id}/activities', [SuperAdminController::class, 'getInstructorActivities']);
        Route::get('/admin/instructors-comparison', [SuperAdminController::class, 'getInstructorComparison']);
    });
});
