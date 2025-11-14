<?php

namespace App\Http\Controllers;

use App\Models\CourseContent;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseContentController extends Controller
{
    /**
     * Get course content
     */
    public function show($courseId)
    {
        try {
            $user = request()->user();
            $course = Course::findOrFail($courseId);

            // Check if user is the instructor or admin
            if ($user->role_id != 1 && $user->id != $course->faculty_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $content = CourseContent::where('course_id', $courseId)->first();

            if (!$content) {
                return response()->json([
                    'success' => true,
                    'content' => [
                        'id' => null,
                        'course_id' => $courseId,
                        'content' => '',
                        'created_by' => $user->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'content' => $content,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching course content: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store or update course content
     */
    public function store(Request $request, $courseId)
    {
        try {
            $user = request()->user();
            $course = Course::findOrFail($courseId);

            // Check if user is the instructor or admin
            if ($user->role_id != 1 && $user->id != $course->faculty_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $request->validate([
                'content' => 'nullable|string',
            ]);

            $content = CourseContent::firstOrCreate(
                ['course_id' => $courseId],
                [
                    'content' => $request->input('content', ''),
                    'created_by' => $user->id,
                ]
            );

            // Update the content if it already exists
            if ($content->wasRecentlyCreated === false) {
                $content->update([
                    'content' => $request->input('content', ''),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Course content saved successfully',
                'content' => $content,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error saving course content: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get course content for students (view only)
     */
    public function view($courseId)
    {
        try {
            $user = request()->user();
            
            // Check if user is enrolled in the course
            $course = Course::findOrFail($courseId);
            
            // Allow access if:
            // 1. User is the instructor
            // 2. User is admin
            // 3. User is enrolled in the course
            $isEnrolled = $course->enrollments()->where('student_id', $user->id)->exists();
            
            if ($user->role_id != 1 && $user->id != $course->faculty_id && !$isEnrolled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $content = CourseContent::where('course_id', $courseId)->first();

            if (!$content) {
                return response()->json([
                    'success' => true,
                    'content' => [
                        'id' => null,
                        'course_id' => $courseId,
                        'content' => '<p>No content available yet.</p>',
                        'created_by' => null,
                        'created_at' => null,
                        'updated_at' => null,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'content' => $content->only(['id', 'course_id', 'content', 'created_at', 'updated_at']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching course content: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete course content
     */
    public function destroy($courseId)
    {
        try {
            $user = request()->user();
            $course = Course::findOrFail($courseId);

            // Check if user is the instructor or admin
            if ($user->role_id != 1 && $user->id != $course->faculty_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            CourseContent::where('course_id', $courseId)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Course content deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting course content: ' . $e->getMessage(),
            ], 500);
        }
    }
}
