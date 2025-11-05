<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssignmentController extends Controller
{
    /**
     * Get all assignments for a student (all enrolled courses)
     */
    public function studentAssignments()
    {
        $user = request()->user();
        
        // Get all courses the student is enrolled in
        $enrolledCourseIds = \DB::table('enrollments')
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->pluck('course_id');
        
        $assignments = Assignment::whereIn('course_id', $enrolledCourseIds)
            ->where('status', 'published')
            ->with(['submissions' => function($query) use ($user) {
                $query->where('student_id', $user->id);
            }, 'course'])
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'assignments' => $assignments->map(function ($assignment) use ($user) {
                $studentSubmission = $assignment->submissions->first();
                $now = now();
                $dueDate = \Carbon\Carbon::parse($assignment->due_date);
                
                // Check if assignment was updated by faculty after student submission
                $assignmentUpdated = false;
                $canResubmit = false;
                
                if ($studentSubmission && $assignment->updated_by_faculty_at) {
                    $assignmentUpdated = $assignment->updated_by_faculty_at > $studentSubmission->submitted_at;
                    $canResubmit = $assignmentUpdated;
                }
                
                // Determine status
                $status = 'pending';
                if ($studentSubmission) {
                    if ($assignmentUpdated) {
                        $status = 'updated'; // Assignment was updated, needs resubmission
                    } elseif ($studentSubmission->grade !== null) {
                        $status = 'graded';
                    } else {
                        $status = 'submitted';
                    }
                } elseif ($dueDate < $now) {
                    $status = 'late';
                }
                
                $data = [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'description' => $assignment->description,
                    'due_date' => $assignment->due_date,
                    'max_points' => $assignment->max_points,
                    'status' => $status,
                    'file_path' => $assignment->file_path,
                    'course' => $assignment->course ? $assignment->course->course_name : null,
                    'course_id' => $assignment->course_id,
                    'has_submitted' => $studentSubmission !== null,
                    'submission_id' => $studentSubmission ? $studentSubmission->id : null,
                    'can_resubmit' => $canResubmit,
                    'assignment_updated' => $assignmentUpdated,
                    'updated_by_faculty_at' => $assignment->updated_by_faculty_at,
                    'created_at' => $assignment->created_at,
                    'updated_at' => $assignment->updated_at,
                ];
                
                // Add submission details if graded
                if ($studentSubmission && $studentSubmission->grade !== null) {
                    $data['grade'] = $studentSubmission->grade;
                    $data['feedback'] = $studentSubmission->feedback;
                    $data['graded_at'] = $studentSubmission->graded_at;
                    $data['submitted_at'] = $studentSubmission->submitted_at;
                    $data['submission_text'] = $studentSubmission->submission_text;
                }
                
                return $data;
            }),
        ]);
    }

    /**
     * Get all assignments for a course
     */
    public function index($courseId)
    {
        $user = request()->user();
        
        $assignments = Assignment::where('course_id', $courseId)
            ->with('submissions')
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'assignments' => $assignments->map(function ($assignment) use ($user) {
                $data = [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'description' => $assignment->description,
                    'due_date' => $assignment->due_date,
                    'max_points' => $assignment->max_points,
                    'status' => $assignment->status,
                    'file_path' => $assignment->file_path,
                    'updated_by_faculty_at' => $assignment->updated_by_faculty_at,
                    'total_submissions' => $assignment->submissions->count(),
                    'graded_submissions' => $assignment->submissions->where('grade', '!=', null)->count(),
                ];
                
                // If user is a student, add their submission status
                if ($user && $user->role_id === 3) {
                    $studentSubmission = $assignment->submissions->firstWhere('student_id', $user->id);
                    
                    $data['has_submitted'] = $studentSubmission !== null;
                    $data['submission_id'] = $studentSubmission ? $studentSubmission->id : null;
                    $data['can_resubmit'] = false;
                    
                    if ($studentSubmission && $assignment->updated_by_faculty_at) {
                        $data['can_resubmit'] = $assignment->updated_by_faculty_at > $studentSubmission->submitted_at;
                    }
                }
                
                return $data;
            }),
        ]);
    }

    /**
     * Create a new assignment (Faculty only)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
            'max_points' => 'required|integer|min:0',
            'status' => 'required|in:published,draft,closed',
            'file' => 'nullable|file|max:512000', // 500MB
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('assignments', $filename, 'public');
        }

        $validated['file_path'] = $filePath;
        $assignment = Assignment::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assignment created successfully',
            'assignment' => $assignment,
        ], 201);
    }

    /**
     * Get a single assignment
     */
    public function show($id)
    {
        $assignment = Assignment::with('course')->findOrFail($id);

        return response()->json([
            'success' => true,
            'assignment' => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'due_date' => $assignment->due_date,
                'max_points' => $assignment->max_points,
                'status' => $assignment->status,
                'file_path' => $assignment->file_path,
                'course_id' => $assignment->course_id,
                'course_name' => $assignment->course ? $assignment->course->course_name : null,
                'updated_by_faculty_at' => $assignment->updated_by_faculty_at,
                'created_at' => $assignment->created_at,
                'updated_at' => $assignment->updated_at,
            ],
        ]);
    }

    /**
     * Update an assignment (Faculty only)
     */
    public function update(Request $request, $id)
    {
        $assignment = Assignment::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
            'max_points' => 'required|integer|min:0',
            'status' => 'required|in:published,draft,closed',
            'file' => 'nullable|file|max:512000',
        ]);

        $filePath = $assignment->file_path;
        if ($request->hasFile('file')) {
            // Delete old file
            if ($assignment->file_path && Storage::disk('public')->exists($assignment->file_path)) {
                Storage::disk('public')->delete($assignment->file_path);
            }
            
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('assignments', $filename, 'public');
        }

        $validated['file_path'] = $filePath;
        $validated['updated_by_faculty_at'] = now();
        
        $assignment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assignment updated successfully',
            'assignment' => $assignment,
        ]);
    }

    /**
     * Delete an assignment (Faculty only)
     */
    public function destroy($id)
    {
        $assignment = Assignment::findOrFail($id);
        
        // Delete file if exists
        if ($assignment->file_path && Storage::disk('public')->exists($assignment->file_path)) {
            Storage::disk('public')->delete($assignment->file_path);
        }
        
        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assignment deleted successfully',
        ]);
    }

    /**
     * Download assignment file
     */
    public function download($id)
    {
        $assignment = Assignment::findOrFail($id);
        
        if (!$assignment->file_path) {
            return response()->json(['error' => 'No file attached'], 404);
        }

        if (!Storage::disk('public')->exists($assignment->file_path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        $path = storage_path('app/public/' . $assignment->file_path);
        return response()->download($path);
    }
}
