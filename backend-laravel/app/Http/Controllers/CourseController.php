<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Assignment;
use App\Models\Enrollment;
use App\Models\EnrollmentRequest;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseController extends Controller
{
    /**
     * Get all courses for the authenticated faculty member
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // If faculty, get only their courses
            if ($user->role_id == 2) { // Faculty
                $courses = Course::where('faculty_id', $user->id)
                    ->withCount(['enrollments', 'assignments', 'announcements'])
                    ->orderBy('created_at', 'desc')
                    ->get();
            } else {
                // Admin can see all courses
                $courses = Course::withCount(['enrollments', 'assignments', 'announcements'])
                    ->orderBy('created_at', 'desc')
                    ->get();
            }

            return response()->json([
                'success' => true,
                'courses' => $courses->map(function ($course) {
                    return [
                        'id' => $course->id,
                        'code' => $course->course_code,
                        'name' => $course->course_name,
                        'description' => $course->description,
                        'credits' => $course->credits,
                        'semester' => $course->semester,
                        'year_level' => $course->year_level,
                        'section' => $course->section,
                        'academic_year' => $course->academic_year,
                        'thumbnail' => $course->thumbnail,
                        'status' => $course->status,
                        'students' => $course->enrollments_count,
                        'assignments' => $course->assignments_count,
                        'announcements' => $course->announcements_count,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching courses: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single course with details
     */
    public function show($id)
    {
        $user = request()->user();
        
        $course = Course::with(['enrollments.user', 'assignments.assignmentFiles', 'faculty'])
            ->findOrFail($id);

        // Get announcements for this course
        $announcementsQuery = Announcement::with('creator')
            ->where('course_id', $id)
            ->withCount('comments');
        
        // Students only see published announcements
        if ($user && $user->role_id == 3) {
            $announcementsQuery->where('status', 'published');
        }
        
        $announcements = $announcementsQuery
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'course' => [
                'id' => $course->id,
                'code' => $course->course_code,
                'name' => $course->course_name,
                'description' => $course->description,
                'credits' => $course->credits,
                'semester' => $course->semester,
                'year_level' => $course->year_level,
                'section' => $course->section,
                'academic_year' => $course->academic_year,
                'thumbnail' => $course->thumbnail,
                'status' => $course->status,
                'students' => $course->enrollments->count(),
                'assignments' => $course->assignments->map(function ($assignment) use ($course) {
                    // Get current user's submission for this assignment
                    $user = request()->user();
                    $studentSubmission = null;
                    if ($user && $user->role_id == 3) { // Student
                        $studentSubmission = $assignment->submissions()
                            ->where('student_id', $user->id)
                            ->latest()
                            ->first();
                    }

                    // Determine submission status
                    $hasSubmitted = $studentSubmission !== null;
                    $canResubmit = false;

                    if ($studentSubmission && $assignment->updated_by_faculty_at) {
                        $canResubmit = $assignment->updated_by_faculty_at > $studentSubmission->submitted_at;
                    }

                    return [
                        'id' => $assignment->id,
                        'title' => $assignment->title,
                        'description' => $assignment->description,
                        'due_date' => $assignment->due_date,
                        'max_points' => $assignment->max_points,
                        'status' => $assignment->status,
                        'file_path' => $assignment->file_path,
                        'files' => $assignment->assignmentFiles->map(function ($file) {
                            return [
                                'id' => $file->id,
                                'file_path' => $file->file_path,
                                'original_name' => $file->original_name,
                            ];
                        }),
                        'submissions' => $assignment->submissions->count(),
                        'total_students' => $course->enrollments->count(),
                        'graded_submissions' => $assignment->submissions->whereNotNull('grade')->count(),
                        'has_submitted' => $hasSubmitted,
                        'can_resubmit' => $canResubmit,
                        'submitted_at' => $studentSubmission ? $studentSubmission->submitted_at : null,
                        'grade' => $studentSubmission ? $studentSubmission->grade : null,
                        'feedback' => $studentSubmission ? $studentSubmission->feedback : null,
                        'submission' => $studentSubmission ? [
                            'id' => $studentSubmission->id,
                            'file_path' => $studentSubmission->file_path,
                            'submitted_at' => $studentSubmission->submitted_at,
                        ] : null,
                    ];
                }),
                'announcements' => $announcements->map(function ($announcement) {
                    return [
                        'id' => $announcement->id,
                        'title' => $announcement->title,
                        'content' => $announcement->content,
                        'priority' => $announcement->priority,
                        'status' => $announcement->status,
                        'created_at' => $announcement->created_at,
                        'updated_at' => $announcement->updated_at,
                        'comments_count' => $announcement->comments_count,
                        'creator' => $announcement->creator,
                    ];
                }),
                'faculty' => $course->faculty ? [
                    'id' => $course->faculty->id,
                    'name' => $course->faculty->name,
                    'email' => $course->faculty->email,
                    'profile_image' => $course->faculty->profile_image,
                ] : null,
                'enrolled_students' => $course->enrollments->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->user->id,
                        'name' => $enrollment->user->name,
                        'email' => $enrollment->user->email,
                        'student_id' => $enrollment->user->student_id,
                        'profile_image' => $enrollment->user->profile_image,
                        'enrolled_date' => $enrollment->enrolled_at,
                        'status' => $enrollment->status,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Create a new course
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:courses,course_code',
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'credits' => 'required|integer|min:1|max:10',
            'semester' => 'required|string|max:20',
            'year_level' => 'nullable|string|max:20',
            'section' => 'nullable|string|max:50',
            'academic_year' => 'required|string|max:9',
            'thumbnail' => 'nullable|string',
        ]);

        $course = Course::create([
            'course_code' => $validated['code'],
            'course_name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'faculty_id' => $request->user()->id,
            'credits' => $validated['credits'],
            'semester' => $validated['semester'],
            'year_level' => $validated['year_level'] ?? null,
            'section' => $validated['section'] ?? null,
            'academic_year' => $validated['academic_year'],
            'thumbnail' => $validated['thumbnail'] ?? 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Course created successfully',
            'course' => $course,
        ], 201);
    }

    /**
     * Update a course
     */
    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:courses,course_code,' . $id,
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'credits' => 'required|integer|min:1|max:10',
            'semester' => 'required|string|max:20',
            'year_level' => 'nullable|string|max:20',
            'section' => 'nullable|string|max:50',
            'academic_year' => 'required|string|max:9',
            'thumbnail' => 'nullable|string',
            'status' => 'required|in:active,inactive,archived',
        ]);

        $course->update([
            'course_code' => $validated['code'],
            'course_name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'credits' => $validated['credits'],
            'semester' => $validated['semester'],
            'year_level' => $validated['year_level'] ?? null,
            'section' => $validated['section'] ?? null,
            'academic_year' => $validated['academic_year'],
            'thumbnail' => $validated['thumbnail'],
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Course updated successfully',
            'course' => $course,
        ]);
    }

    /**
     * Delete a course
     */
    public function destroy($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json([
            'success' => true,
            'message' => 'Course deleted successfully',
        ]);
    }

    /**
     * Get course statistics
     */
    public function statistics(Request $request)
    {
        $user = $request->user();
        
        if ($user->role_id == 2) { // Faculty
            $totalCourses = Course::where('faculty_id', $user->id)->count();
            $totalStudents = Enrollment::whereHas('course', function ($query) use ($user) {
                $query->where('faculty_id', $user->id);
            })->distinct('student_id')->count('student_id');
        } else {
            $totalCourses = Course::count();
            $totalStudents = Enrollment::distinct('student_id')->count('student_id');
        }

        return response()->json([
            'success' => true,
            'statistics' => [
                'total_courses' => $totalCourses,
                'total_students' => $totalStudents,
                'total_assignments' => Assignment::count(),
            ],
        ]);
    }

    /**
     * Enroll a student in a course
     */
    public function enroll(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Log the enrollment attempt
            \Log::info('Enrollment attempt', [
                'user_id' => $user->id,
                'user_role_id' => $user->role_id,
                'course_id' => $id
            ]);
            
            $course = Course::findOrFail($id);

            // Check if user is a student (role_id = 3)
            if ($user->role_id !== 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only students can enroll in courses.',
                ], 400);
            }

            // Check if the course is active
            if ($course->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'This course is not currently available for enrollment.',
                ], 400);
            }

            // Check if currently enrolled (not dropped)
            $existingEnrollment = Enrollment::where('student_id', $user->id)
                ->where('course_id', $id)
                ->where('status', 'enrolled')
                ->first();

            if ($existingEnrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are already enrolled in this course.',
                ], 400);
            }

            // Check if there's any previous request
            $existingRequest = EnrollmentRequest::where('student_id', $user->id)
                ->where('course_id', $id)
                ->first();

            if ($existingRequest) {
                // If it's pending, inform user
                if ($existingRequest->status === 'pending') {
                    return response()->json([
                        'success' => false,
                        'message' => 'You already have a pending enrollment request for this course.',
                    ], 400);
                }
                
                // If approved or rejected, update it to pending instead of creating new
                \Log::info('Updating existing enrollment request', [
                    'request_id' => $existingRequest->id,
                    'old_status' => $existingRequest->status
                ]);
                
                $existingRequest->update([
                    'status' => 'pending',
                    'message' => $request->input('message', null),
                    'requested_at' => now(),
                    'responded_at' => null,
                    'responded_by' => null,
                ]);
                
                $enrollmentRequest = $existingRequest;
            } else {
                // Create new enrollment request
                \Log::info('Creating enrollment request', [
                    'student_id' => $user->id,
                    'course_id' => $id
                ]);
                
                $enrollmentRequest = EnrollmentRequest::create([
                    'student_id' => $user->id,
                    'course_id' => $id,
                    'status' => 'pending',
                    'message' => $request->input('message', null),
                ]);
                
                \Log::info('Enrollment request created', ['request_id' => $enrollmentRequest->id]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Enrollment request submitted successfully! Waiting for instructor approval.',
                'request' => $enrollmentRequest,
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Enrollment error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error submitting enrollment request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a student's enrollment status
     */
    public function updateStudentStatus(Request $request, $courseId, $studentId)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:enrolled,completed,dropped',
            ]);

            $enrollment = Enrollment::where('course_id', $courseId)
                ->where('student_id', $studentId)
                ->firstOrFail();

            $enrollment->update([
                'status' => $validated['status'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student status updated successfully',
                'enrollment' => $enrollment,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating student status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove a student from a course
     */
    public function removeStudent(Request $request, $courseId, $studentId)
    {
        try {
            $enrollment = Enrollment::where('course_id', $courseId)
                ->where('student_id', $studentId)
                ->firstOrFail();

            // Delete the enrollment to allow re-enrollment
            $enrollment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Student removed from course successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error removing student: ' . $e->getMessage(),
            ], 500);
        }
    }
}
