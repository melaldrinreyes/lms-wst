<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Enrollment;
use App\Models\Submission;
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

            $students = $query->get();

            return response()->json([
                'success' => true,
                'students' => $students->map(function ($student) {
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
}
