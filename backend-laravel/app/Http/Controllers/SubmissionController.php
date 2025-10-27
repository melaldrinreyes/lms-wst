<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Models\Assignment;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    /**
     * Submit an assignment (Student)
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            // Ensure user is a student
            if ($user->role_id !== 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only students can submit assignments',
                ], 403);
            }

            $validated = $request->validate([
                'assignment_id' => 'required|exists:assignments,id',
                'submission_text' => 'nullable|string',
                'file' => 'nullable|file|max:10240', // 10MB max
            ]);

            // Check if assignment exists and is published
            $assignment = Assignment::findOrFail($validated['assignment_id']);
            if ($assignment->status !== 'published') {
                return response()->json([
                    'success' => false,
                    'message' => 'This assignment is not available for submission',
                ], 400);
            }

            // Check if student already submitted
            $existingSubmission = Submission::where('assignment_id', $validated['assignment_id'])
                ->where('student_id', $user->id)
                ->first();

            if ($existingSubmission) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already submitted this assignment',
                ], 400);
            }

            // Handle file upload
            $filePath = null;
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $filename = time() . '_' . $user->id . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('submissions', $filename, 'public');
            }

            // Create submission
            $submission = Submission::create([
                'assignment_id' => $validated['assignment_id'],
                'student_id' => $user->id,
                'submission_text' => $validated['submission_text'] ?? null,
                'file_path' => $filePath,
                'submitted_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Assignment submitted successfully',
                'submission' => $submission,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error submitting assignment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error submitting assignment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all submissions for faculty's assignments
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            $query = Submission::with(['user', 'assignment.course']);
            
            // If faculty, filter by their courses
            if ($user->role_id == 2) {
                $query->whereHas('assignment', function ($q) use ($user) {
                    $q->whereHas('course', function ($q2) use ($user) {
                        $q2->where('faculty_id', $user->id);
                    });
                });
            }

            // Filter by status if provided
            if ($request->has('status')) {
                if ($request->status === 'submitted') {
                    // Submitted but not graded
                    $query->whereNull('grade');
                } elseif ($request->status === 'graded') {
                    // Graded submissions
                    $query->whereNotNull('grade');
                }
                // For 'all' or other values, don't filter
            }

            // Filter by course if provided
            if ($request->has('course_id')) {
                $query->whereHas('assignment', function ($q) use ($request) {
                    $q->where('course_id', $request->course_id);
                });
            }

            $submissions = $query->orderBy('submitted_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'submissions' => $submissions->map(function ($submission) {
                    $status = $submission->grade !== null ? 'graded' : 'submitted';
                    return [
                        'id' => $submission->id,
                        'assignment_id' => $submission->assignment_id,
                        'assignment_title' => $submission->assignment->title,
                        'course_name' => $submission->assignment->course->course_name,
                        'student_id' => $submission->user->id,
                        'student_name' => $submission->user->name,
                        'student_email' => $submission->user->email,
                        'student_image' => $submission->user->profile_image,
                        'file_path' => $submission->file_path,
                        'submission_text' => $submission->submission_text,
                        'submitted_at' => $submission->submitted_at,
                        'grade' => $submission->grade,
                        'feedback' => $submission->feedback,
                        'status' => $status,
                        'graded_at' => $submission->graded_at,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in submissions index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching submissions: ' . $e->getMessage(),
                'submissions' => [],
            ], 500);
        }
    }

    /**
     * Get pending submissions count
     */
    public function pendingCount(Request $request)
    {
        try {
            $user = $request->user();
            
            // Pending means submitted but not graded (grade is null)
            $query = Submission::whereNull('grade');
            
            // If faculty, filter by their courses
            if ($user->role_id == 2) {
                $query->whereHas('assignment', function ($q) use ($user) {
                    $q->whereHas('course', function ($q2) use ($user) {
                        $q2->where('faculty_id', $user->id);
                    });
                });
            }
            
            $count = $query->count();

            return response()->json([
                'success' => true,
                'pending_count' => $count,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in pendingCount: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching pending submissions: ' . $e->getMessage(),
                'pending_count' => 0,
            ], 500);
        }
    }

    /**
     * Grade a submission
     */
    public function grade(Request $request, $id)
    {
        try {
            $submission = Submission::findOrFail($id);

            $validated = $request->validate([
                'grade' => 'required|numeric|min:0|max:100',
                'feedback' => 'nullable|string',
            ]);

            $submission->update([
                'grade' => $validated['grade'],
                'feedback' => $validated['feedback'] ?? null,
                'graded_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Submission graded successfully',
                'submission' => $submission,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error grading submission: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error grading submission: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get submission details
     */
    public function show($id)
    {
        try {
            $submission = Submission::with(['user', 'assignment.course'])->findOrFail($id);
            $status = $submission->grade !== null ? 'graded' : 'submitted';

            return response()->json([
                'success' => true,
                'submission' => [
                    'id' => $submission->id,
                    'assignment' => [
                        'id' => $submission->assignment->id,
                        'title' => $submission->assignment->title,
                        'description' => $submission->assignment->description,
                        'points' => $submission->assignment->points,
                        'due_date' => $submission->assignment->due_date,
                    ],
                    'course' => [
                        'id' => $submission->assignment->course->id,
                        'name' => $submission->assignment->course->course_name,
                        'code' => $submission->assignment->course->course_code,
                    ],
                    'student' => [
                        'id' => $submission->user->id,
                        'name' => $submission->user->name,
                        'email' => $submission->user->email,
                        'student_id' => $submission->user->student_id,
                        'profile_image' => $submission->user->profile_image,
                    ],
                    'file_path' => $submission->file_path,
                    'submission_text' => $submission->submission_text,
                    'submitted_at' => $submission->submitted_at,
                    'grade' => $submission->grade,
                    'feedback' => $submission->feedback,
                    'status' => $status,
                    'graded_at' => $submission->graded_at,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching submission: ' . $e->getMessage(),
            ], 500);
        }
    }
}
