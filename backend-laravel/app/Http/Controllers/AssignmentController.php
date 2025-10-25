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
                    'points' => $assignment->points,
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
            'points' => 'required|integer|min:0',
            'status' => 'required|in:published,draft',
        ]);

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
            'points' => 'required|integer|min:0',
            'status' => 'required|in:published,draft',
        ]);

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
                'points' => $assignment->points,
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
