<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\DownloadService;

class SubmissionController extends Controller
{
    /**
     * Submit an assignment (Student only)
     */
    public function store(Request $request)
    {
        // Log PHP upload/post limits to help debugging
        \Log::info('PHP Upload Limits:', [
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
        ]);

        try {
            $validated = $request->validate([
                'assignment_id' => 'required|exists:assignments,id',
                'submission_text' => 'nullable|string',
                // Allow any file type for submissions and set a 10GB limit (Laravel 'max' is in KB)
                'file' => 'nullable|file|max:10485760', // 10GB
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Submission validation failed:', [
                'errors' => $e->errors(),
                'file_size' => $request->hasFile('file') ? $request->file('file')->getSize() : 'No file',
                'file_mime' => $request->hasFile('file') ? $request->file('file')->getMimeType() : 'N/A',
            ]);

            // If a file exists, check against a 10GB byte threshold to provide clearer error message
            if ($request->hasFile('file')) {
                $fileSize = $request->file('file')->getSize();
                $maxAllowed = 10485760 * 1024; // 10GB in bytes

                if ($fileSize > $maxAllowed) {
                    return response()->json([
                        'success' => false,
                        'message' => 'File is too large. Maximum file size is 10GB. Your file is ' . round($fileSize / 1024 / 1024 / 1024, 2) . 'GB',
                        'errors' => ['file' => ['File exceeds maximum size of 10GB']],
                    ], 422);
                }
            }

            throw $e;
        }

        $assignment = Assignment::findOrFail($validated['assignment_id']);
        $user = $request->user();

        // Check if student already submitted
        $existingSubmission = Submission::where('assignment_id', $assignment->id)
            ->where('student_id', $user->id)
            ->first();

        // If there's an existing submission and resubmission is not allowed, block it
        if ($existingSubmission) {
            if (!$assignment->updated_by_faculty_at || $assignment->updated_by_faculty_at <= $existingSubmission->submitted_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already submitted this assignment',
                ], 422);
            }

            // Delete old submission file if exists
            if ($existingSubmission->file_path && Storage::disk('public')->exists($existingSubmission->file_path)) {
                Storage::disk('public')->delete($existingSubmission->file_path);
            }
        }

        $filePath = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');

            \Log::info('Processing file upload:', [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
                'is_valid' => $file->isValid(),
                'error' => $file->getError(),
            ]);

            if (!$file->isValid()) {
                $errorMessages = [
                    UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize in php.ini',
                    UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE in HTML form',
                    UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                    UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                    UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                    UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                    UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
                ];

                $error = $file->getError();
                $message = $errorMessages[$error] ?? 'Unknown upload error';

                \Log::error('File upload error:', ['code' => $error, 'message' => $message]);

                return response()->json([
                    'success' => false,
                    'message' => 'File upload failed: ' . $message,
                    'error_code' => $error,
                ], 422);
            }

            try {
                $filename = time() . '_' . $user->id . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('submissions', $filename, 'public');

                \Log::info('File stored successfully:', ['path' => $filePath]);
            } catch (\Exception $e) {
                \Log::error('File storage failed:', ['error' => $e->getMessage()]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save file: ' . $e->getMessage(),
                ], 500);
            }
        }

        // Create or update submission (do not store file_url in DB; compute URL for response)
        $data = [
            'assignment_id' => $assignment->id,
            'student_id' => $user->id,
            'submission_text' => $validated['submission_text'] ?? null,
            'file_path' => $filePath,
            'submitted_at' => now(),
            'status' => 'submitted',
            'grade' => null,
            'feedback' => null,
            'graded_at' => null,
        ];

        if ($existingSubmission) {
            $existingSubmission->update($data);
            $submission = $existingSubmission;
        } else {
            $submission = Submission::create($data);
        }

        // Compute public URL for frontend preview (if a file is attached)
        $fileUrl = $submission->file_path ? Storage::disk('public')->url($submission->file_path) : null;

        return response()->json([
            'success' => true,
            'message' => 'Assignment submitted successfully',
            'submission' => $submission,
            'file_url' => $fileUrl,
        ], 201);
    }

    /**
     * Get all submissions for an assignment (Faculty only)
     */
    public function index(Request $request)
    {
        $assignmentId = $request->query('assignment_id');
        $courseId = $request->query('course_id');

        $query = Submission::with(['user', 'assignment']);

        if ($assignmentId) {
            $query->where('assignment_id', $assignmentId);
        }

        // Support filtering by course_id (frontend calls with course_id)
        if ($courseId) {
            $query->whereHas('assignment', function ($q) use ($courseId) {
                $q->where('course_id', $courseId);
            });
        }

        $submissions = $query->orderBy('submitted_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'submissions' => $submissions->map(function ($submission) {
                // Determine status based on grading
                $status = $submission->status ?? 'submitted';
                if ($submission->grade !== null && $submission->graded_at) {
                    $status = 'graded';
                }

                return [
                    'id' => $submission->id,
                    'assignment_id' => $submission->assignment_id,
                    'assignment_title' => $submission->assignment->title ?? null,
                    'student_id' => $submission->student_id,
                    'student_name' => $submission->user->name ?? null,
                    'submission_text' => $submission->submission_text,
                    'file_path' => $submission->file_path,
                    'file_url' => $submission->file_path ? Storage::disk('public')->url($submission->file_path) : null,
                    'submitted_at' => $submission->submitted_at,
                    'grade' => $submission->grade,
                    'feedback' => $submission->feedback,
                    'graded_at' => $submission->graded_at,
                    'status' => $status,
                ];
            }),
        ]);
    }

    /**
     * Get a specific submission
     */
    public function show($id)
    {
        $submission = Submission::with(['user', 'assignment'])->findOrFail($id);

        // Determine status
        $status = $submission->status ?? 'submitted';
        if ($submission->grade !== null && $submission->graded_at) {
            $status = 'graded';
        }

        return response()->json([
            'success' => true,
            'submission' => [
                'id' => $submission->id,
                'assignment_id' => $submission->assignment_id,
                'assignment_title' => $submission->assignment->title ?? null,
                'student_id' => $submission->student_id,
                'student_name' => $submission->user->name ?? null,
                'submission_text' => $submission->submission_text,
                'file_path' => $submission->file_path,
                'file_url' => $submission->file_path ? Storage::disk('public')->url($submission->file_path) : null,
                'submitted_at' => $submission->submitted_at,
                'grade' => $submission->grade,
                'feedback' => $submission->feedback,
                'graded_at' => $submission->graded_at,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Download submission file
     */
    public function download($id)
    {
        $submission = Submission::findOrFail($id);
        return \App\Services\DownloadService::serveFromStorage('public', $submission->file_path, null);
    }

    /**
     * Grade a submission (Faculty only)
     */
    public function grade(Request $request, $id)
    {
        $validated = $request->validate([
            'grade' => 'required|numeric|min:0',
            'feedback' => 'nullable|string',
        ]);

        $submission = Submission::findOrFail($id);
        
        $submission->update([
            'grade' => $validated['grade'],
            'feedback' => $validated['feedback'] ?? null,
            'graded_at' => now(),
            'status' => 'graded',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Submission graded successfully',
            'submission' => $submission,
        ]);
    }

    /**
     * Get count of pending submissions (Faculty only)
     * Submissions that haven't been graded yet
     */
    public function getPendingCount(Request $request)
    {
        $user = $request->user();
        
        // Get assignments created by this faculty member
        $facultyAssignmentIds = Assignment::whereHas('course', function ($query) use ($user) {
            $query->where('faculty_id', $user->id);
        })->pluck('id');
        
        // Count submissions that are not graded
        $pendingCount = Submission::whereIn('assignment_id', $facultyAssignmentIds)
            ->whereNull('grade')
            ->count();

        return response()->json([
            'success' => true,
            'count' => $pendingCount,
        ]);
    }
}
