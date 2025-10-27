<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    /**
     * Get all assignments for a course
     */
    public function index($courseId)
    {
        $assignments = Assignment::where('course_id', $courseId)
            ->with('submissions')
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'assignments' => $assignments->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'description' => $assignment->description,
                    'due_date' => $assignment->due_date,
                    'max_points' => $assignment->max_points,
                    'file_path' => $assignment->file_path,
                    'status' => $assignment->status,
                    'total_submissions' => $assignment->submissions->count(),
                    'graded_submissions' => $assignment->submissions->whereNotNull('grade')->count(),
                ];
            }),
        ]);
    }

    /**
     * Create a new assignment
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
            'max_points' => 'required|integer|min:0',
            'status' => 'nullable|in:published,draft',
            'attachment' => 'nullable|file|max:10240', // 10MB max
        ]);

        // Default status to draft if not provided
        $validated['status'] = $validated['status'] ?? 'draft';

        // Handle file upload
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('assignments', $filename, 'public');
            $validated['file_path'] = $path;
        }

        $assignment = Assignment::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assignment created successfully',
            'assignment' => $assignment,
        ], 201);
    }

    /**
     * Update an assignment
     */
    public function update(Request $request, $id)
    {
        $assignment = Assignment::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
            'max_points' => 'required|integer|min:0',
            'status' => 'nullable|in:published,draft',
            'attachment' => 'nullable|file|max:10240', // 10MB max
        ]);

        // Handle file upload
        if ($request->hasFile('attachment')) {
            // Delete old file if exists
            if ($assignment->file_path) {
                \Storage::disk('public')->delete($assignment->file_path);
            }
            
            $file = $request->file('attachment');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('assignments', $filename, 'public');
            $validated['file_path'] = $path;
        }

        $assignment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assignment updated successfully',
            'assignment' => $assignment,
        ]);
    }

    /**
     * Delete an assignment
     */
    public function destroy($id)
    {
        $assignment = Assignment::findOrFail($id);
        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assignment deleted successfully',
        ]);
    }

    /**
     * Get assignment with submissions
     */
    public function show($id)
    {
        $assignment = Assignment::with(['submissions.user', 'course'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'assignment' => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'due_date' => $assignment->due_date,
                'max_points' => $assignment->max_points,
                'file_path' => $assignment->file_path,
                'status' => $assignment->status,
                'course' => [
                    'id' => $assignment->course->id,
                    'name' => $assignment->course->name,
                    'code' => $assignment->course->code,
                ],
                'submissions' => $assignment->submissions->map(function ($submission) {
                    return [
                        'id' => $submission->id,
                        'student_name' => $submission->user->name,
                        'student_id' => $submission->user->student_id,
                        'submitted_at' => $submission->submitted_at,
                        'grade' => $submission->grade,
                        'status' => $submission->status,
                    ];
                }),
            ],
        ]);
    }
}
