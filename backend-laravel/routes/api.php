<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseContentController;
use App\Http\Controllers\CourseLectureController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\EnrollmentRequestController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AnnouncementCommentController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// (Debug route removed) Temporary local-only debug route removed after verification.

// Test route
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()->toDateTimeString(),
    ]);
});

// PHP Configuration check route
Route::get('/php-config', function () {
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'max_input_time' => ini_get('max_input_time'),
        'file_uploads' => ini_get('file_uploads'),
        'max_file_uploads' => ini_get('max_file_uploads'),
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
    Route::match(['PUT', 'POST'], '/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    
    // Course routes (All authenticated users can view courses)
    Route::get('/courses/statistics/all', [CourseController::class, 'statistics']);
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    
    // Course creation and modification (Faculty only)
    Route::middleware(['check.role:2'])->group(function () {
        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{id}', [CourseController::class, 'update']);
        Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
    });
    
    // Course content routes (Faculty and Admin can manage, all can view)
    // Important: Specific routes must come before parameterized routes
    Route::get('/courses/{courseId}/content/view', [CourseContentController::class, 'view']);
    Route::get('/courses/{courseId}/content', [CourseContentController::class, 'show']);
    
    Route::middleware(['check.role:2'])->group(function () {
        Route::post('/courses/{courseId}/content', [CourseContentController::class, 'store']);
        Route::delete('/courses/{courseId}/content', [CourseContentController::class, 'destroy']);
    });
    
    // Course lectures routes (Faculty and Admin can manage, all can view)
    // Important: Specific routes must come before parameterized routes
    Route::get('/courses/{courseId}/lectures/view', [CourseLectureController::class, 'view']);
    Route::get('/courses/{courseId}/lectures', [CourseLectureController::class, 'index']);
    
    Route::middleware(['check.role:2'])->group(function () {
        Route::post('/courses/{courseId}/lectures', [CourseLectureController::class, 'store']);
        Route::delete('/courses/{courseId}/lectures/{lectureId}', [CourseLectureController::class, 'destroy']);
    });
    
    // Enrollment management (Faculty and Admin)
    Route::middleware(['check.role:2'])->group(function () {
        Route::put('/courses/{courseId}/students/{studentId}/status', [CourseController::class, 'updateStudentStatus']);
        Route::delete('/courses/{courseId}/students/{studentId}', [CourseController::class, 'removeStudent']);
    });
    
    // Student enrollment (Students only)
    Route::middleware(['check.role:3'])->group(function () {
        Route::post('/courses/{id}/enroll', [CourseController::class, 'enroll']);
    });
    
    // Module routes (Faculty and Admin can manage, all can view)
    Route::get('/courses/{courseId}/modules', [ModuleController::class, 'index']);
    Route::get('/modules/{id}/download', [ModuleController::class, 'download']);
    // File upload endpoint for modules (for WYSIWYG uploads)
    Route::post('/modules/upload', [ModuleController::class, 'upload']);

    Route::middleware(['check.role:2'])->group(function () {
        Route::post('/modules', [ModuleController::class, 'store']);
        Route::put('/modules/{id}', [ModuleController::class, 'update']);
        Route::post('/modules/{id}', [ModuleController::class, 'update']); // For FormData with _method=PUT
        Route::delete('/modules/{id}', [ModuleController::class, 'destroy']);
    });
    
    // Assignment routes
    Route::get('/courses/{courseId}/assignments', [AssignmentController::class, 'index']);
    Route::get('/assignments/{id}', [AssignmentController::class, 'show']);
    Route::get('/assignments/{id}/download', [AssignmentController::class, 'download']);
    // Download a specific assignment file by file id (assignment may have multiple files)
    Route::get('/assignments/files/{fileId}/download', [AssignmentController::class, 'downloadFile']);
    
    // Assignment management (Faculty and Admin only)
    Route::middleware(['check.role:2'])->group(function () {
        Route::post('/assignments', [AssignmentController::class, 'store']);
        Route::put('/assignments/{id}', [AssignmentController::class, 'update']);
        Route::post('/assignments/{id}', [AssignmentController::class, 'update']); // For FormData with _method=PUT
        Route::delete('/assignments/{id}', [AssignmentController::class, 'destroy']);
    });
    
    // Submission routes
    // Note: Specific routes must come before parameterized routes
    Route::get('/submissions', [SubmissionController::class, 'index']); // Faculty view all submissions
    
    // Grade submissions and stats (Faculty and Admin only)
    Route::middleware(['check.role:2,1'])->group(function () {
        Route::get('/submissions/pending/count', [SubmissionController::class, 'getPendingCount']);
        Route::post('/submissions/{id}/grade', [SubmissionController::class, 'grade']);
    });
    
    Route::get('/submissions/{id}', [SubmissionController::class, 'show']);
    Route::get('/submissions/{id}/download', [SubmissionController::class, 'download']);
    
    // Student submissions (Students only)
    Route::middleware(['check.role:3'])->group(function () {
        Route::post('/submissions', [SubmissionController::class, 'store']);
    });
    
    // Student routes (Faculty and Admin can view all students)
    Route::middleware(['check.role:1,2'])->group(function () {
        Route::get('/students', [StudentController::class, 'index']);
        Route::get('/students/{id}', [StudentController::class, 'show']);
        Route::get('/courses/{courseId}/students', [StudentController::class, 'byCourse']);
    });
    
    // Student-specific routes (role_id = 3)
    Route::middleware(['check.role:3'])->group(function () {
        Route::get('/student/classes', [StudentController::class, 'myClasses']);
        Route::get('/student/assignments', [AssignmentController::class, 'studentAssignments']);
        Route::get('/student/announcements', [AnnouncementController::class, 'studentAnnouncements']);
    });
    
    // Announcement routes (All authenticated users can view)
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/{id}', [AnnouncementController::class, 'show']);
    
    // Announcement management (Faculty and Admin only)
    Route::middleware(['check.role:2'])->group(function () {
        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
        Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);
    });
    
    // Announcement comments (All authenticated users)
    Route::get('/announcements/{announcementId}/comments', [AnnouncementCommentController::class, 'index']);
    Route::post('/announcement-comments', [AnnouncementCommentController::class, 'store']);
    Route::put('/announcement-comments/{id}', [AnnouncementCommentController::class, 'update']);
    Route::delete('/announcement-comments/{id}', [AnnouncementCommentController::class, 'destroy']);
    
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
        
        // Announcement management routes
        Route::get('/faculty/announcements', [AnnouncementController::class, 'facultyAnnouncements']);
        Route::get('/faculty/courses/{courseId}/announcements', [AnnouncementController::class, 'byCourse']);
    });
    
    // Super Admin routes (role_id = 1)
    Route::middleware(['check.role:1'])->group(function () {
        Route::get('/admin/dashboard', [SuperAdminController::class, 'dashboard']);
        Route::get('/admin/users', [SuperAdminController::class, 'getUsers']);
        Route::post('/admin/users', [SuperAdminController::class, 'createUser']);
        Route::put('/admin/users/{id}', [SuperAdminController::class, 'updateUser']);
        Route::delete('/admin/users/{id}', [SuperAdminController::class, 'deleteUser']);
        Route::get('/admin/instructors', [SuperAdminController::class, 'getInstructors']);
        Route::get('/admin/instructors/{id}', [SuperAdminController::class, 'getInstructor']);
        Route::post('/admin/instructors', [SuperAdminController::class, 'createInstructor']);
        Route::put('/admin/instructors/{id}', [SuperAdminController::class, 'updateInstructor']);
        Route::delete('/admin/instructors/{id}', [SuperAdminController::class, 'deleteInstructor']);
        Route::get('/admin/instructors/{id}/activities', [SuperAdminController::class, 'getInstructorActivities']);
        Route::get('/admin/instructors-comparison', [SuperAdminController::class, 'getInstructorComparison']);
    });
});
