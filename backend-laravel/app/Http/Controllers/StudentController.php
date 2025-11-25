<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Enrollment;
use App\Models\Submission;
use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    /**
     * Register a new student (Faculty only)
     */
    public function store(Request $request)
    {
        try {
            // Check if user is faculty
            if ($request->user()->role_id !== 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only faculty can register students.',
                ], 403);
            }

            // Validate input
            $validator = Validator::make($request->all(), [
                'student_id' => 'required|string|unique:users,student_id',
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'password' => 'required|string|min:8',
                'password_confirmation' => 'required|string|same:password',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Create student
            $student = User::create([
                'student_id' => $request->student_id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'date_of_birth' => $request->date_of_birth,
                'gender' => $request->gender,
                'password' => Hash::make($request->password),
                'role_id' => 3, // Student role
                'created_by' => $request->user()->id, // Track which faculty created this student
                'status' => 'active',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student registered successfully',
                'student' => [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'phone' => $student->phone,
                    'status' => $student->status,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error registering student: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all students enrolled in faculty's courses
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            $query = User::where('role_id', 3); // Students only

            // If faculty, filter by students they created
            if ($user->role_id == 2) {
                $query->where('created_by', $user->id);
            }

            $students = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'students' => $students->map(function ($student) {
                    // Get student's enrollments (active only)
                    $enrollments = Enrollment::where('student_id', $student->id)
                        ->where('status', 'enrolled')
                        ->with('course.instructor')
                        ->get();

                    // Get all instructors for this student (may be multiple if enrolled in multiple courses)
                    $instructors = $enrollments->map(function ($enrollment) {
                        $course = $enrollment->course;
                        if ($course && $course->instructor) {
                            return [
                                'id' => $course->instructor->id,
                                'name' => $course->instructor->name,
                                'email' => $course->instructor->email,
                                'course' => $course->course_name,
                            ];
                        }
                        return null;
                    })->filter()->values();

                    // Get student's classes via class_student pivot table
                    $enrolledClasses = \DB::table('class_student')
                        ->where('student_id', $student->id)
                        ->count();

                    return [
                        'id' => $student->id,
                        'student_id' => $student->student_id,
                        'name' => $student->name,
                        'email' => $student->email,
                        'phone' => $student->phone,
                        'profile_image' => $student->profile_image ?? 'https://ui-avatars.com/api/?name=' . urlencode($student->name) . '&background=f97316&color=fff',
                        'status' => $student->status ?? 'active',
                        'courses' => [], // Can be populated with actual enrolled classes if needed
                        'enrolled_date' => $student->created_at,
                        'submissions' => 0, // Placeholder - can calculate actual submissions
                        'total_assignments' => 0, // Placeholder
                        'average_grade' => 0, // Placeholder
                        'enrolled_classes' => $enrolledClasses,
                        'instructors' => $instructors,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching students: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get student details with performance
     */
    public function show($id)
    {
        try {
            $student = User::where('role_id', 3)
                ->with(['enrollments.course', 'submissions.assignment'])
                ->findOrFail($id);

            $submissions = $student->submissions;
            $gradedSubmissions = $submissions->whereNotNull('grade');

            return response()->json([
                'success' => true,
                'student' => [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'phone' => $student->phone,
                    'address' => $student->address,
                    'profile_image' => $student->profile_image,
                    'status' => $student->status,
                    'enrolled_courses' => $student->enrollments->map(function ($enrollment) {
                        return [
                            'course_id' => $enrollment->course->id,
                            'course_name' => $enrollment->course->course_name,
                            'course_code' => $enrollment->course->course_code,
                            'enrolled_date' => $enrollment->enrolled_at,
                            'status' => $enrollment->status,
                        ];
                    }),
                    'performance' => [
                        'total_submissions' => $submissions->count(),
                        'graded_submissions' => $gradedSubmissions->count(),
                        'average_grade' => round($gradedSubmissions->avg('grade') ?? 0, 2),
                        'highest_grade' => $gradedSubmissions->max('grade') ?? 0,
                        'lowest_grade' => $gradedSubmissions->min('grade') ?? 0,
                    ],
                    'recent_submissions' => $submissions->sortByDesc('submitted_at')->take(5)->map(function ($submission) {
                        $status = $submission->grade !== null ? 'graded' : 'submitted';
                        return [
                            'assignment_title' => $submission->assignment->title,
                            'submitted_at' => $submission->submitted_at,
                            'grade' => $submission->grade,
                            'status' => $status,
                        ];
                    }),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching student details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get students by course
     */
    public function byCourse($courseId)
    {
        try {
            $enrollments = Enrollment::where('course_id', $courseId)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'students' => $enrollments->map(function ($enrollment) use ($courseId) {
                    $student = $enrollment->user;
                    $submissions = Submission::where('student_id', $student->id)
                        ->whereHas('assignment', function ($q) use ($courseId) {
                            $q->where('course_id', $courseId);
                        })
                        ->get();
                    
                    $gradedSubmissions = $submissions->whereNotNull('grade');

                    return [
                        'id' => $student->id,
                        'student_id' => $student->student_id,
                        'name' => $student->name,
                        'email' => $student->email,
                        'profile_image' => $student->profile_image,
                        'enrolled_date' => $enrollment->enrolled_at,
                        'status' => $enrollment->status,
                        'submissions' => $submissions->count(),
                        'average_grade' => round($gradedSubmissions->avg('grade') ?? 0, 2),
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching students by course: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get the authenticated student's enrolled courses
     */
    public function myClasses(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get all enrollments for this student
            $enrollments = Enrollment::where('student_id', $user->id)
                ->where('status', 'enrolled') // Only show active enrollments
                ->with(['course.faculty', 'course.modules', 'course.assignments'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'classes' => $enrollments->map(function ($enrollment) {
                    $course = $enrollment->course;
                    
                    // Get modules and assignments
                    $modules = $course->modules ?? collect([]);
                    $assignments = $course->assignments ?? collect([]);
                    $publishedModules = $modules->where('status', 'published')->count();
                    
                    return [
                        'id' => $course->id,
                        'course_code' => $course->course_code,
                        'course_name' => $course->course_name,
                        'description' => $course->description,
                        'credits' => $course->credits,
                        'semester' => $course->semester,
                        'academic_year' => $course->academic_year,
                        'thumbnail' => $course->thumbnail,
                        'status' => $course->status, // Course status (active/inactive/archived)
                        'enrollment_status' => $enrollment->status, // Enrollment status (enrolled)
                        'enrolled_date' => $enrollment->enrolled_at,
                        'year_level' => $course->year_level ?? 'N/A',
                        'section' => $course->section ?? 'N/A',
                        'progress' => 0, // Placeholder - can calculate actual progress
                        // Add modules data
                        'modules' => $modules->map(function ($module) {
                            return [
                                'id' => $module->id,
                                'title' => $module->title,
                                'status' => $module->status,
                                'order' => $module->order,
                            ];
                        }),
                        'modules_count' => $modules->count(),
                        'published_modules_count' => $publishedModules,
                        // Add assignments data
                        'assignments' => $assignments->map(function ($assignment) {
                            return [
                                'id' => $assignment->id,
                                'title' => $assignment->title,
                                'due_date' => $assignment->due_date,
                            ];
                        }),
                        'assignments_count' => $assignments->count(),
                        // Add student count (total enrolled in this course)
                        'students_count' => Enrollment::where('course_id', $course->id)
                            ->where('status', 'enrolled')
                            ->count(),
                        'faculty' => $course->faculty ? [
                            'id' => $course->faculty->id,
                            'name' => $course->faculty->name,
                            'email' => $course->faculty->email,
                            'profile_image' => $course->faculty->profile_image,
                        ] : null,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching enrolled courses: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all assignments from student's enrolled courses
     */
    public function myAssignments(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get all course IDs the student is enrolled in
            $enrolledCourseIds = Enrollment::where('student_id', $user->id)
                ->where('status', 'enrolled')
                ->pluck('course_id');

            // Get all assignments from those courses with submission status
            $assignments = Assignment::whereIn('course_id', $enrolledCourseIds)
                ->with(['course'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'assignments' => $assignments->map(function ($assignment) use ($user) {
                    // Check if student has submitted this assignment
                    $submission = Submission::where('assignment_id', $assignment->id)
                        ->where('student_id', $user->id)
                        ->first();

                    $status = 'pending';
                    $grade = null;
                    $submittedDate = null;

                    if ($submission) {
                        if ($submission->grade !== null) {
                            $status = 'graded';
                            $grade = $submission->grade;
                        } else {
                            $status = 'submitted';
                        }
                        $submittedDate = $submission->submitted_at;
                    } else {
                        // Check if assignment is overdue
                        if (now()->gt($assignment->due_date)) {
                            $status = 'late';
                        }
                    }

                    return [
                        'id' => $assignment->id,
                        'title' => $assignment->title,
                        'description' => $assignment->description,
                        'due_date' => $assignment->due_date,
                        'max_points' => $assignment->max_points,
                        'status' => $status,
                        'course' => [
                            'id' => $assignment->course->id,
                            'name' => $assignment->course->course_name,
                            'code' => $assignment->course->course_code,
                        ],
                        'grade' => $grade,
                        'submitted_date' => $submittedDate,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching assignments: ' . $e->getMessage(),
            ], 500);
        }
    }
}
