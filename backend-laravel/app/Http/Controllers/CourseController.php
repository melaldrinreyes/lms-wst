<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Module;
use App\Models\Assignment;
use App\Models\Enrollment;
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
                    ->with(['enrollments', 'modules', 'assignments'])
                    ->get();
            } else {
                // Admin can see all courses
                $courses = Course::with(['enrollments', 'modules', 'assignments'])->get();
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
                        'academic_year' => $course->academic_year,
                        'thumbnail' => $course->thumbnail,
                        'status' => $course->status,
                        'students' => $course->enrollments->count(),
                        'modules' => $course->modules->count(),
                        'assignments' => $course->assignments->count(),
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
        $course = Course::with(['enrollments.user', 'modules', 'assignments'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'course' => [
                'id' => $course->id,
                'code' => $course->course_code,
                'name' => $course->course_name,
                'description' => $course->description,
                'credits' => $course->credits,
                'semester' => $course->semester,
                'academic_year' => $course->academic_year,
                'thumbnail' => $course->thumbnail,
                'status' => $course->status,
                'students' => $course->enrollments->count(),
                'modules' => $course->modules,
                'assignments' => $course->assignments,
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
                'total_modules' => Module::count(),
                'total_assignments' => Assignment::count(),
            ],
        ]);
    }
}
