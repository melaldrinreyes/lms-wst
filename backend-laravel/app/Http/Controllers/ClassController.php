<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use App\Models\User;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClassController extends Controller
{
    /**
     * Display a listing of classes for the authenticated faculty.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $classes = ClassModel::where('faculty_id', $user->id)
            ->with(['course', 'faculty'])
            ->withCount('students')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'classes' => $classes
        ]);
    }

    /**
     * Store a newly created class.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'nullable|exists:courses,id',
            'subject_name' => 'required_without:course_id|string|max:200',
            'year_level' => 'required|string|in:1st Year,2nd Year,3rd Year,4th Year',
            'section' => 'required|string|max:50',
            'school_year' => 'required|string|max:20',
            'semester' => 'required|string|in:1st Semester,2nd Semester,Summer',
        ]);

        $class = ClassModel::create([
            'faculty_id' => $request->user()->id,
            'course_id' => $validated['course_id'] ?? null,
            'subject_name' => $validated['subject_name'] ?? null,
            'year_level' => $validated['year_level'],
            'section' => $validated['section'],
            'school_year' => $validated['school_year'],
            'semester' => $validated['semester'],
            'status' => 'active',
        ]);

        $class->load(['course', 'faculty']);

        return response()->json([
            'success' => true,
            'message' => 'Class created successfully',
            'class' => $class
        ], 201);
    }

    /**
     * Display the specified class with its students.
     */
    public function show(Request $request, $id)
    {
        $class = ClassModel::where('id', $id)
            ->where('faculty_id', $request->user()->id)
            ->with(['course', 'faculty', 'students'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'class' => $class
        ]);
    }

    /**
     * Update the specified class.
     */
    public function update(Request $request, $id)
    {
        $class = ClassModel::where('id', $id)
            ->where('faculty_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'course_id' => 'nullable|exists:courses,id',
            'subject_name' => 'required_without:course_id|string|max:200',
            'year_level' => 'sometimes|string|in:1st Year,2nd Year,3rd Year,4th Year',
            'section' => 'sometimes|string|max:50',
            'school_year' => 'sometimes|string|max:20',
            'semester' => 'sometimes|string|in:1st Semester,2nd Semester,Summer',
            'status' => 'sometimes|string|in:active,archived',
        ]);

        $class->update($validated);
        $class->load(['course', 'faculty']);

        return response()->json([
            'success' => true,
            'message' => 'Class updated successfully',
            'class' => $class
        ]);
    }

    /**
     * Remove the specified class.
     */
    public function destroy(Request $request, $id)
    {
        $class = ClassModel::where('id', $id)
            ->where('faculty_id', $request->user()->id)
            ->firstOrFail();

        $class->delete();

        return response()->json([
            'success' => true,
            'message' => 'Class deleted successfully'
        ]);
    }

    /**
     * Add a student to a class.
     */
    public function addStudent(Request $request, $id)
    {
        $class = ClassModel::where('id', $id)
            ->where('faculty_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'student_id' => 'required|exists:users,id',
        ]);

        // Verify the student exists and has role_id = 3
        $student = User::where('id', $validated['student_id'])
            ->where('role_id', 3)
            ->firstOrFail();

        // Check if student is already enrolled
        if ($class->students()->where('users.id', $student->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Student is already enrolled in this class'
            ], 400);
        }

        // Enroll the student
        $class->students()->attach($student->id, [
            'enrolled_date' => now(),
            'status' => 'active'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Student added to class successfully'
        ]);
    }

    /**
     * Remove a student from a class.
     */
    public function removeStudent(Request $request, $id, $studentId)
    {
        $class = ClassModel::where('id', $id)
            ->where('faculty_id', $request->user()->id)
            ->firstOrFail();

        // Verify the student is enrolled
        if (!$class->students()->where('users.id', $studentId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Student is not enrolled in this class'
            ], 400);
        }

        // Remove the student
        $class->students()->detach($studentId);

        return response()->json([
            'success' => true,
            'message' => 'Student removed from class successfully'
        ]);
    }

    /**
     * Get available students that can be added to a class.
     */
    public function availableStudents(Request $request, $id)
    {
        $class = ClassModel::where('id', $id)
            ->where('faculty_id', $request->user()->id)
            ->firstOrFail();

        // Get all students created by this faculty that are NOT in this class
        $enrolledStudentIds = $class->students()->pluck('student_id');

        $availableStudents = User::where('role_id', 3)
            ->where('created_by', $request->user()->id)
            ->whereNotIn('id', $enrolledStudentIds)
            ->select('id', 'first_name', 'last_name', 'email', 'student_id')
            ->get();

        return response()->json([
            'success' => true,
            'students' => $availableStudents
        ]);
    }
}
