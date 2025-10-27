<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get all notifications for authenticated user
     */
    public function index(Request $request)
    {
        try {
            $notifications = Notification::where('user_id', $request->user()->id)
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();

            return response()->json([
                'success' => true,
                'notifications' => $notifications,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
            ], 500);
        }
    }

    /**
     * Get unread notification count
     */
    public function unreadCount(Request $request)
    {
        try {
            $count = Notification::where('user_id', $request->user()->id)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'success' => true,
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get notification count',
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id, Request $request)
    {
        try {
            $notification = Notification::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read',
            ], 404);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        try {
            Notification::where('user_id', $request->user()->id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notifications as read',
            ], 500);
        }
    }

    /**
     * Create notification for students in a course
     */
    public static function notifyStudents($courseId, $type, $message, $relatedId = null, $relatedType = null)
    {
        try {
            $enrollments = Enrollment::where('course_id', $courseId)
                ->where('status', 'approved')
                ->get();

            foreach ($enrollments as $enrollment) {
                Notification::create([
                    'user_id' => $enrollment->user_id,
                    'notification_type' => $type,
                    'message' => $message,
                    'related_id' => $relatedId,
                    'related_type' => $relatedType,
                    'is_read' => false,
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create notifications: ' . $e->getMessage());
        }
    }
}
