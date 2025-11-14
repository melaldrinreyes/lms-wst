<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseLecture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class CourseLectureController extends Controller
{
    /**
     * Get all lectures for a course
     */
    public function index(Request $request, $courseId): JsonResponse
    {
        try {
            $course = Course::findOrFail($courseId);
            
            // Check authorization
            $user = auth()->user();
            $isTeacher = $user && ($user->role_id == 2 || $user->role_id == 1); // 1=Admin, 2=Teacher
            $isCourseOwner = $user && $user->id === $course->faculty_id;
            
            // Only teachers can see lectures endpoint, or course owner can see their own
            if (!$isTeacher && !$isCourseOwner && $request->route()->getName() !== 'lectures.view') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $lectures = CourseLecture::where('course_id', $courseId)
                ->orderBy('order')
                ->get();

            return response()->json([
                'success' => true,
                'lectures' => $lectures,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get lectures for students (public view)
     */
    public function view(Request $request, $courseId): JsonResponse
    {
        try {
            $course = Course::findOrFail($courseId);
            
            $lectures = CourseLecture::where('course_id', $courseId)
                ->select('id', 'title', 'content', 'order', 'created_at')
                ->orderBy('order')
                ->get();

            return response()->json([
                'success' => true,
                'lectures' => $lectures,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Store lectures (batch save/update)
     */
    public function store(Request $request, $courseId): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // Check authorization - only teachers (role_id=2) and admin (role_id=1)
            if ($user->role_id != 2 && $user->role_id != 1) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $course = Course::findOrFail($courseId);
            
            // Check course ownership - teachers can only edit their own courses
            if ($user->role_id == 2 && $user->id !== $course->faculty_id) {
                return response()->json(['success' => false, 'message' => 'You cannot edit this course'], 403);
            }

            $lecturesData = $request->input('lectures', []);

            if (!is_array($lecturesData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lectures must be an array',
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Process each lecture
                $order = 1;
                $existingDbIds = [];

                foreach ($lecturesData as $lectureData) {
                    // Skip if no title
                    if (empty($lectureData['title'])) {
                        continue;
                    }

                    $id = $lectureData['id'] ?? null;
                    
                    // Check if it's a temporary ID (from frontend Date.now() or very large number)
                    $isTemporaryId = !is_numeric($id) || $id > 2147483647 || $id < 1;

                    if ($isTemporaryId) {
                        // Create new lecture
                        $lecture = CourseLecture::create([
                            'course_id' => $courseId,
                            'title' => $lectureData['title'],
                            'content' => $lectureData['content'] ?? '',
                            'order' => $order,
                            'created_by' => $user->id,
                        ]);
                        $existingDbIds[] = $lecture->id;
                    } else {
                        // Update existing lecture
                        $lecture = CourseLecture::where('course_id', $courseId)
                            ->where('id', $id)
                            ->first();

                        if ($lecture) {
                            $lecture->update([
                                'title' => $lectureData['title'],
                                'content' => $lectureData['content'] ?? '',
                                'order' => $order,
                            ]);
                            $existingDbIds[] = $lecture->id;
                        }
                    }

                    $order++;
                }

                // Delete lectures from this course that were not in the request
                CourseLecture::where('course_id', $courseId)
                    ->whereNotIn('id', $existingDbIds)
                    ->delete();

                DB::commit();

                // Reload and return all lectures
                $allLectures = CourseLecture::where('course_id', $courseId)
                    ->orderBy('order')
                    ->get();

                return response()->json([
                    'success' => true,
                    'message' => 'Lectures saved successfully',
                    'lectures' => $allLectures,
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete a lecture
     */
    public function destroy(Request $request, $courseId, $lectureId): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // Check authorization - only teachers (role_id=2) and admin (role_id=1)
            if ($user->role_id != 2 && $user->role_id != 1) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $course = Course::findOrFail($courseId);
            $lecture = CourseLecture::findOrFail($lectureId);

            // Check ownership
            if ($lecture->course_id != $courseId) {
                return response()->json(['success' => false, 'message' => 'Lecture not found'], 404);
            }

            // Teachers can only delete from their own courses
            if ($user->role_id == 2 && $user->id !== $course->faculty_id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $lecture->delete();

            return response()->json([
                'success' => true,
                'message' => 'Lecture deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
