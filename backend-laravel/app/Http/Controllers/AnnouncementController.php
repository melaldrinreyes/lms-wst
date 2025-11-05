<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Course;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * Get all announcements for a specific course (Students and Faculty)
     */
    public function index(Request $request)
    {
        $courseId = $request->query('course_id');
        $user = $request->user();
        
        $query = Announcement::with(['creator', 'course'])
            ->withCount('comments');
        
        // If course_id is provided, filter by course
        if ($courseId) {
            $query->where('course_id', $courseId);
        } else {
            // Students: Only show announcements from enrolled courses
            if ($user->role_id == 3) {
                $enrolledCourseIds = $user->enrollments()
                    ->where('status', 'enrolled')
                    ->pluck('course_id');
                $query->whereIn('course_id', $enrolledCourseIds);
            }
            // Faculty/Admin: Show announcements from their courses
            elseif ($user->role_id == 2) {
                $query->where('created_by', $user->id);
            }
        }
        
        // Students only see published announcements
        if ($user->role_id == 3) {
            $query->where('status', 'published');
        }
        
        $announcements = $query->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'announcements' => $announcements,
        ]);
    }

    /**
     * Get a single announcement with comments
     */
    public function show($id)
    {
        $user = request()->user();
        
        $announcement = Announcement::with([
            'creator',
            'course',
            'comments' => function ($query) {
                $query->with('user')
                    ->orderBy('created_at', 'desc');
            }
        ])->findOrFail($id);

        // Students can only view published announcements
        if ($user->role_id == 3 && $announcement->status !== 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'announcement' => $announcement,
        ]);
    }

    /**
     * Create a new announcement (Faculty and Admin only)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:200',
            'content' => 'required|string',
            'priority' => 'required|in:low,normal,high',
            'status' => 'required|in:published,draft',
        ]);

        $user = $request->user();

        // Verify the faculty owns the course
        if ($user->role_id == 2) {
            $course = Course::findOrFail($validated['course_id']);
            if ($course->faculty_id != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only create announcements for your own courses',
                ], 403);
            }
        }

        $announcement = Announcement::create([
            'course_id' => $validated['course_id'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'created_by' => $user->id,
            'priority' => $validated['priority'],
            'status' => $validated['status'],
        ]);

        $announcement->load('creator', 'course');

        return response()->json([
            'success' => true,
            'message' => 'Announcement created successfully',
            'announcement' => $announcement,
        ], 201);
    }

    /**
     * Update an announcement (Faculty and Admin only)
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:200',
            'content' => 'sometimes|string',
            'priority' => 'sometimes|in:low,normal,high',
            'status' => 'sometimes|in:published,draft',
        ]);

        $user = $request->user();
        $announcement = Announcement::findOrFail($id);

        // Verify the user owns the announcement
        if ($user->role_id == 2 && $announcement->created_by != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update your own announcements',
            ], 403);
        }

        $announcement->update($validated);
        $announcement->load('creator', 'course');

        return response()->json([
            'success' => true,
            'message' => 'Announcement updated successfully',
            'announcement' => $announcement,
        ]);
    }

    /**
     * Delete an announcement (Faculty and Admin only)
     */
    public function destroy($id)
    {
        $user = request()->user();
        $announcement = Announcement::findOrFail($id);

        // Verify the user owns the announcement
        if ($user->role_id == 2 && $announcement->created_by != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own announcements',
            ], 403);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully',
        ]);
    }

    /**
     * Get announcements for student's enrolled courses
     */
    public function studentAnnouncements(Request $request)
    {
        $user = $request->user();
        
        // Get enrolled course IDs
        $enrolledCourseIds = $user->enrollments()
            ->where('status', 'enrolled')
            ->pluck('course_id');

        $announcements = Announcement::with([
            'creator',
            'course'
        ])
            ->withCount('comments')
            ->whereIn('course_id', $enrolledCourseIds)
            ->where('status', 'published')
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'announcements' => $announcements,
        ]);
    }

    /**
     * Get all announcements created by the faculty member
     */
    public function facultyAnnouncements(Request $request)
    {
        $user = $request->user();
        
        $announcements = Announcement::with([
            'course',
            'comments' => function ($query) {
                $query->with('user');
            }
        ])
            ->withCount('comments')
            ->where('created_by', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Add statistics
        $stats = [
            'total' => $announcements->count(),
            'published' => $announcements->where('status', 'published')->count(),
            'draft' => $announcements->where('status', 'draft')->count(),
            'high_priority' => $announcements->where('priority', 'high')->count(),
            'total_comments' => $announcements->sum('comments_count'),
        ];

        return response()->json([
            'success' => true,
            'announcements' => $announcements,
            'stats' => $stats,
        ]);
    }

    /**
     * Get announcements for a specific course (Faculty view)
     */
    public function byCourse(Request $request, $courseId)
    {
        $user = $request->user();
        
        // Verify faculty owns the course
        if ($user->role_id == 2) {
            $course = Course::findOrFail($courseId);
            if ($course->faculty_id != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only view announcements for your own courses',
                ], 403);
            }
        }

        $announcements = Announcement::with([
            'creator',
            'course'
        ])
            ->withCount('comments')
            ->where('course_id', $courseId)
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'announcements' => $announcements,
        ]);
    }
}
