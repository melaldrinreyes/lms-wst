<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Submission;
use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    /**
     * Get super admin dashboard statistics
     */
    public function dashboard(Request $request)
    {
        try {
            $user = $request->user();
            
            // Verify super admin role (role_id = 1)
            if ($user->role_id != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            // Get all instructors (faculty)
            $totalInstructors = User::where('role_id', 2)->count();
            $activeInstructors = User::where('role_id', 2)->where('status', 'active')->count();
            
            // Get all students
            $totalStudents = User::where('role_id', 3)->count();
            
            // Get all courses
            $totalCourses = Course::count();
            
            // Get total enrollments
            $totalEnrollments = Enrollment::count();
            
            // Get total submissions
            $totalSubmissions = Submission::count();
            $gradedSubmissions = Submission::whereNotNull('grade')->count();
            $pendingSubmissions = Submission::whereNull('grade')->count();

            return response()->json([
                'success' => true,
                'statistics' => [
                    'instructors' => [
                        'total' => $totalInstructors,
                        'active' => $activeInstructors,
                        'inactive' => $totalInstructors - $activeInstructors,
                    ],
                    'students' => [
                        'total' => $totalStudents,
                    ],
                    'courses' => [
                        'total' => $totalCourses,
                    ],
                    'enrollments' => [
                        'total' => $totalEnrollments,
                    ],
                    'submissions' => [
                        'total' => $totalSubmissions,
                        'graded' => $gradedSubmissions,
                        'pending' => $pendingSubmissions,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching dashboard statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all instructors with their statistics
     */
    public function getInstructors(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user->role_id != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            $instructors = User::where('role_id', 2)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($instructor) {
                    // Get courses taught
                    $coursesCount = \DB::table('courses')
                        ->where('faculty_id', $instructor->id)
                        ->count();
                    
                    // Get total students enrolled in instructor's courses
                    $studentsCount = \DB::table('enrollments')
                        ->join('courses', 'enrollments.course_id', '=', 'courses.id')
                        ->where('courses.faculty_id', $instructor->id)
                        ->distinct('enrollments.student_id')
                        ->count('enrollments.student_id');
                    
                    // Get submissions for instructor's courses
                    $submissionsCount = Submission::whereHas('assignment', function ($q) use ($instructor) {
                        $q->whereHas('course', function ($q2) use ($instructor) {
                            $q2->where('faculty_id', $instructor->id);
                        });
                    })->count();
                    
                    $pendingSubmissions = Submission::whereNull('grade')
                        ->whereHas('assignment', function ($q) use ($instructor) {
                            $q->whereHas('course', function ($q2) use ($instructor) {
                                $q2->where('faculty_id', $instructor->id);
                            });
                        })->count();
                    
                    // Get graded submissions count
                    $gradedSubmissions = Submission::whereNotNull('grade')
                        ->whereHas('assignment', function ($q) use ($instructor) {
                            $q->whereHas('course', function ($q2) use ($instructor) {
                                $q2->where('faculty_id', $instructor->id);
                            });
                        })->count();

                    return [
                        'id' => $instructor->id,
                        'name' => $instructor->name,
                        'email' => $instructor->email,
                        'phone' => $instructor->phone,
                        'profile_image' => $instructor->profile_image ?? 'https://ui-avatars.com/api/?name=' . urlencode($instructor->name) . '&background=0ea5e9&color=fff',
                        'status' => $instructor->status ?? 'active',
                        'last_login' => $instructor->last_login,
                        'created_at' => $instructor->created_at,
                        'statistics' => [
                            'courses' => $coursesCount,
                            'students' => $studentsCount,
                            'graded' => $gradedSubmissions,
                            'pending' => $pendingSubmissions,
                        ],
                    ];
                });

            return response()->json([
                'success' => true,
                'instructors' => $instructors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching instructors: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all users (students, faculty, admin)
     */
    public function getUsers(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user->role_id != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            $users = User::whereIn('role_id', [2, 3, 1]) // faculty, student, admin
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'role' => $user->role_id == 1 ? 'admin' : ($user->role_id == 2 ? 'faculty' : 'student'),
                        'status' => $user->status ?? 'active',
                        'joined' => $user->created_at,
                        'profile_image' => $user->profile_image ?? 'https://ui-avatars.com/api/?name=' . urlencode($user->name) . '&background=0ea5e9&color=fff',
                    ];
                });

            return response()->json([
                'success' => true,
                'users' => $users,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching users: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new user
     */
    public function createUser(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user->role_id != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8',
                'role' => 'required|in:student,faculty,admin',
            ]);

            $roleId = $request->role === 'admin' ? 1 : ($request->role === 'faculty' ? 2 : 3);

            $newUser = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $roleId,
                'status' => 'active',
            ]);

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $newUser->id,
                    'name' => $newUser->name,
                    'email' => $newUser->email,
                    'role' => $request->role,
                    'status' => $newUser->status,
                    'joined' => $newUser->created_at,
                ],
                'message' => 'User created successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a user
     */
    public function updateUser(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if ($user->role_id != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $id,
                'role' => 'required|in:student,faculty,admin',
                'status' => 'required|in:active,inactive',
            ]);

            $updateUser = User::findOrFail($id);
            $roleId = $request->role === 'admin' ? 1 : ($request->role === 'faculty' ? 2 : 3);

            $updateUser->update([
                'name' => $request->name,
                'email' => $request->email,
                'role_id' => $roleId,
                'status' => $request->status,
            ]);

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $updateUser->id,
                    'name' => $updateUser->name,
                    'email' => $updateUser->email,
                    'role' => $request->role,
                    'status' => $updateUser->status,
                    'joined' => $updateUser->created_at,
                ],
                'message' => 'User updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a user
     */
    public function deleteUser(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if ($user->role_id != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            $deleteUser = User::findOrFail($id);
            
            // Prevent deleting the current admin user
            if ($deleteUser->id === $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete your own account',
                ], 400);
            }

            $deleteUser->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single instructor details with activities
     */
    public function getInstructor($id)
    {
        try {
            $instructor = User::where('role_id', 2)
                ->with([
                    'coursesTaught', 
                    'coursesTaught.enrollments' => function ($query) {
                        $query->where('status', 'active');
                    },
                    'coursesTaught.enrollments.student',
                    'coursesTaught.assignments'
                ])
                ->findOrFail($id);

            // Get recent activities
            $recentCourses = $instructor->coursesTaught()
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            // Get grading activity
            $recentGradings = Submission::whereNotNull('grade')
                ->whereHas('assignment', function ($q) use ($instructor) {
                    $q->whereHas('course', function ($q2) use ($instructor) {
                        $q2->where('faculty_id', $instructor->id);
                    });
                })
                ->with(['user', 'assignment'])
                ->orderBy('graded_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($submission) {
                    return [
                        'student_name' => $submission->user->name,
                        'assignment_title' => $submission->assignment->title,
                        'grade' => $submission->grade,
                        'graded_at' => $submission->graded_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'instructor' => [
                    'id' => $instructor->id,
                    'name' => $instructor->name,
                    'email' => $instructor->email,
                    'phone' => $instructor->phone,
                    'address' => $instructor->address,
                    'profile_image' => $instructor->profile_image,
                    'status' => $instructor->status,
                    'last_login' => $instructor->last_login,
                    'created_at' => $instructor->created_at,
                    'statistics' => [
                        'courses' => $instructor->coursesTaught->count(),
                        'students' => $instructor->coursesTaught->sum(function ($course) {
                            return $course->enrollments->count();
                        }),
                    ],
                    'courses' => $instructor->coursesTaught->map(function ($course) {
                        return [
                            'id' => $course->id,
                            'code' => $course->course_code,
                            'name' => $course->course_name,
                            'description' => $course->description,
                            'students' => $course->enrollments->count(),
                            'student_list' => $course->enrollments->map(function ($enrollment) {
                                return [
                                    'id' => $enrollment->student_id,
                                    'name' => $enrollment->student ? $enrollment->student->name : null,
                                    'email' => $enrollment->student ? $enrollment->student->email : null,
                                    'status' => $enrollment->status,
                                ];
                            })->values(),
                            'assignments' => $course->assignments->count(),
                            'status' => $course->status,
                        ];
                    }),
                    'recent_gradings' => $recentGradings,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching instructor details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create new instructor
     */
    public function createInstructor(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user->role_id != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'profile_image' => 'nullable|string',
            ]);

            $instructor = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role_id' => 2, // Faculty role
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'profile_image' => $validated['profile_image'] ?? 'https://ui-avatars.com/api/?name=' . urlencode($validated['name']),
                'status' => 'active',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Instructor created successfully',
                'instructor' => [
                    'id' => $instructor->id,
                    'name' => $instructor->name,
                    'email' => $instructor->email,
                    'phone' => $instructor->phone,
                    'profile_image' => $instructor->profile_image,
                    'status' => $instructor->status,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating instructor: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update instructor
     */
    public function updateInstructor(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if ($user->role_id != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            $instructor = User::where('role_id', 2)->findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $id,
                'password' => 'sometimes|nullable|string|min:8',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'profile_image' => 'nullable|string',
                'status' => 'sometimes|required|in:active,inactive',
            ]);

            $updateData = [
                'name' => $validated['name'] ?? $instructor->name,
                'email' => $validated['email'] ?? $instructor->email,
                'phone' => $validated['phone'] ?? $instructor->phone,
                'address' => $validated['address'] ?? $instructor->address,
                'profile_image' => $validated['profile_image'] ?? $instructor->profile_image,
                'status' => $validated['status'] ?? $instructor->status,
            ];

            if (isset($validated['password']) && !empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $instructor->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Instructor updated successfully',
                'instructor' => $instructor,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating instructor: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete instructor
     */
    public function deleteInstructor($id)
    {
        try {
            $instructor = User::where('role_id', 2)->findOrFail($id);

            // Check if instructor has courses
            $coursesCount = Course::where('faculty_id', $id)->count();
            
            if ($coursesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete instructor with active courses. Please reassign or delete their courses first.',
                ], 400);
            }

            $instructor->delete();

            return response()->json([
                'success' => true,
                'message' => 'Instructor deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting instructor: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get instructor activity logs
     */
    public function getInstructorActivities($id)
    {
        try {
            $instructor = User::where('role_id', 2)->findOrFail($id);

            $activities = [];

            // Recent courses created
            $recentCourses = Course::where('faculty_id', $id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($course) {
                    return [
                        'type' => 'course_created',
                        'description' => "Created course: {$course->course_name}",
                        'timestamp' => $course->created_at,
                        'data' => [
                            'course_id' => $course->id,
                            'course_name' => $course->course_name,
                        ],
                    ];
                });

            // Recent grading activities
            $recentGradings = Submission::whereNotNull('grade')
                ->whereHas('assignment', function ($q) use ($id) {
                    $q->whereHas('course', function ($q2) use ($id) {
                        $q2->where('faculty_id', $id);
                    });
                })
                ->with(['user', 'assignment'])
                ->orderBy('graded_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($submission) {
                    return [
                        'type' => 'submission_graded',
                        'description' => "Graded {$submission->user->name}'s submission for {$submission->assignment->title}",
                        'timestamp' => $submission->graded_at,
                        'data' => [
                            'student_name' => $submission->user->name,
                            'assignment_title' => $submission->assignment->title,
                            'grade' => $submission->grade,
                        ],
                    ];
                });

            // Merge and sort activities
            $activities = collect($recentCourses)
                ->concat($recentGradings)
                ->sortByDesc('timestamp')
                ->values();

            return response()->json([
                'success' => true,
                'activities' => $activities,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching activities: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get instructor statistics comparison
     */
    public function getInstructorComparison()
    {
        try {
            $instructors = User::where('role_id', 2)
                ->where('status', 'active')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($instructor) {
                    $coursesCount = Course::where('faculty_id', $instructor->id)->count();
                    
                    $studentsCount = Enrollment::whereHas('course', function ($q) use ($instructor) {
                        $q->where('faculty_id', $instructor->id);
                    })->distinct('student_id')->count('student_id');
                    
                    $avgGrade = Submission::whereNotNull('grade')
                        ->whereHas('assignment', function ($q) use ($instructor) {
                            $q->whereHas('course', function ($q2) use ($instructor) {
                                $q2->where('faculty_id', $instructor->id);
                            });
                        })->avg('grade');

                    return [
                        'instructor_name' => $instructor->name,
                        'courses' => $coursesCount,
                        'students' => $studentsCount,
                        'avg_grade' => round($avgGrade ?? 0, 2),
                    ];
                });

            return response()->json([
                'success' => true,
                'comparison' => $instructors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching comparison data: ' . $e->getMessage(),
            ], 500);
        }
    }
}
