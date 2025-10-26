<?php

namespace App\Http\Controllers;

use App\Models\EnrollmentRequest;
use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;

class EnrollmentRequestController extends Controller
{
    /**
     * Get enrollment requests for faculty's courses
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            // Get all course IDs where the user is the faculty
            $courseIds = Course::where('faculty_id', $user->id)->pluck('id');

            // Get enrollment requests for these courses
            $requests = EnrollmentRequest::whereIn('course_id', $courseIds)
                ->with(['student', 'course'])
                ->orderBy('status', 'asc') // pending first
                ->orderBy('requested_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'requests' => $requests->map(function ($req) {
                    return [
                        'id' => $req->id,
                        'student' => [
                            'id' => $req->student->id,
                            'name' => $req->student->name,
                            'email' => $req->student->email,
                            'student_id' => $req->student->student_id,
                            'profile_image' => $req->student->profile_image,
                        ],
                        'course' => [
                            'id' => $req->course->id,
                            'code' => $req->course->course_code,
                            'name' => $req->course->course_name,
                        ],
                        'status' => $req->status,
                        'message' => $req->message,
                        'requested_at' => $req->requested_at,
                        'responded_at' => $req->responded_at,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching enrollment requests: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve an enrollment request
     */
    public function approve(Request $request, $id)
    {
        try {
            $user = $request->user();
            $enrollmentRequest = EnrollmentRequest::with(['course', 'student'])->findOrFail($id);

            // Verify the faculty owns this course
            if ($enrollmentRequest->course->faculty_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to approve this request.',
                ], 403);
            }

            // Check if request is still pending
            if ($enrollmentRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been processed.',
                ], 400);
            }

            // Check if student is already enrolled
            $existingEnrollment = Enrollment::where('student_id', $enrollmentRequest->student_id)
                ->where('course_id', $enrollmentRequest->course_id)
                ->where('status', 'enrolled')
                ->first();

            if ($existingEnrollment) {
                // Update request as approved but don't create duplicate enrollment
                $enrollmentRequest->update([
                    'status' => 'approved',
                    'responded_at' => now(),
                    'responded_by' => $user->id,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Student is already enrolled in this course.',
                ]);
            }

            // Check for previously dropped enrollment
            $droppedEnrollment = Enrollment::where('student_id', $enrollmentRequest->student_id)
                ->where('course_id', $enrollmentRequest->course_id)
                ->whereIn('status', ['dropped', 'completed'])
                ->first();

            if ($droppedEnrollment) {
                // Reactivate the enrollment
                $droppedEnrollment->update([
                    'status' => 'enrolled',
                    'enrolled_at' => now(),
                ]);
                $enrollment = $droppedEnrollment;
            } else {
                // Create new enrollment
                $enrollment = Enrollment::create([
                    'student_id' => $enrollmentRequest->student_id,
                    'course_id' => $enrollmentRequest->course_id,
                    'enrolled_at' => now(),
                    'status' => 'enrolled',
                ]);
            }

            // Update request status
            $enrollmentRequest->update([
                'status' => 'approved',
                'responded_at' => now(),
                'responded_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Enrollment request approved successfully!',
                'enrollment' => $enrollment,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error approving request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject an enrollment request
     */
    public function reject(Request $request, $id)
    {
        try {
            $user = $request->user();
            $enrollmentRequest = EnrollmentRequest::with('course')->findOrFail($id);

            // Verify the faculty owns this course
            if ($enrollmentRequest->course->faculty_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to reject this request.',
                ], 403);
            }

            // Check if request is still pending
            if ($enrollmentRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been processed.',
                ], 400);
            }

            // Update request status
            $enrollmentRequest->update([
                'status' => 'rejected',
                'responded_at' => now(),
                'responded_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Enrollment request rejected.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error rejecting request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an enrollment request
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $enrollmentRequest = EnrollmentRequest::with('course')->findOrFail($id);

            // Verify the faculty owns this course
            if ($enrollmentRequest->course->faculty_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this request.',
                ], 403);
            }

            // Delete the request
            $enrollmentRequest->delete();

            return response()->json([
                'success' => true,
                'message' => 'Enrollment request deleted successfully.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting request: ' . $e->getMessage(),
            ], 500);
        }
    }
}
