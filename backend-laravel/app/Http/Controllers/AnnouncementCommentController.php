<?php

namespace App\Http\Controllers;

use App\Models\AnnouncementComment;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementCommentController extends Controller
{
    /**
     * Get all comments for an announcement
     */
    public function index($announcementId)
    {
        $comments = AnnouncementComment::with(['user', 'replies.user'])
            ->where('announcement_id', $announcementId)
            ->whereNull('parent_id') // Only get top-level comments
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'comments' => $comments,
        ]);
    }

    /**
     * Create a new comment (Students can comment)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'announcement_id' => 'required|exists:announcements,id',
            'parent_id' => 'nullable|exists:announcement_comments,id',
            'comment' => 'required|string',
        ]);

        $user = $request->user();
        
        // Verify announcement exists and is published (for students)
        $announcement = Announcement::findOrFail($validated['announcement_id']);
        
        if ($user->role_id == 3 && $announcement->status !== 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot comment on unpublished announcements',
            ], 403);
        }

        // If parent_id is provided, verify it belongs to the same announcement
        if (isset($validated['parent_id'])) {
            $parentComment = AnnouncementComment::findOrFail($validated['parent_id']);
            if ($parentComment->announcement_id != $validated['announcement_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid parent comment',
                ], 400);
            }
        }

        $comment = AnnouncementComment::create([
            'announcement_id' => $validated['announcement_id'],
            'user_id' => $user->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'comment' => $validated['comment'],
        ]);

        $comment->load(['user', 'replies.user']);

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully',
            'comment' => $comment,
        ], 201);
    }

    /**
     * Update a comment (Only comment owner can update)
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        $user = $request->user();
        $comment = AnnouncementComment::findOrFail($id);

        // Verify the user owns the comment
        if ($comment->user_id != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update your own comments',
            ], 403);
        }

        $comment->update([
            'comment' => $validated['comment'],
        ]);

        $comment->load(['user', 'replies.user']);

        return response()->json([
            'success' => true,
            'message' => 'Comment updated successfully',
            'comment' => $comment,
        ]);
    }

    /**
     * Delete a comment
     * - Comment owner can delete their own comment
     * - Instructor (faculty) can delete any student comment in their course
     * - Students cannot delete instructor comments
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $comment = AnnouncementComment::findOrFail($id);
        $announcement = $comment->announcement;
        $course = $announcement->course;

        // Load comment owner's role
        $commentOwner = $comment->user;

        // Check if user is the comment owner
        $isOwner = $comment->user_id == $user->id;

        // Check if user is the course instructor/faculty (role_id = 2)
        $isInstructor = $user->role_id == 2 && $course->faculty_id == $user->id;

        // Students (role_id = 3) cannot delete instructor comments
        if ($user->role_id == 3 && $commentOwner->role_id == 2) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete instructor comments',
            ], 403);
        }

        // Allow deletion if:
        // 1. User owns the comment, OR
        // 2. User is the course instructor
        if (!$isOwner && !$isInstructor) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this comment',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully',
        ]);
    }
}
