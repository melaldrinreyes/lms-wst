<?php

namespace App\Http\Controllers;

use App\Models\ClassMaterial;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\DownloadService;

class ClassMaterialController extends Controller
{
    /**
     * Display a listing of class materials for a course.
     */
    public function index(Request $request, $courseId)
    {
        if (!$courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Course ID is required'
            ], 400);
        }

        $course = Course::findOrFail($courseId);

        $materials = ClassMaterial::where('course_id', $courseId)
            ->with('uploader')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($material) {
                return [
                    'id' => $material->id,
                    'title' => $material->title,
                    'description' => $material->description,
                    'file_name' => $material->file_name,
                    'original_name' => $material->original_name,
                    'file_size' => $material->file_size,
                    'mime_type' => $material->mime_type,
                    'file_url' => Storage::disk('public')->url($material->file_path),
                    'uploaded_by' => $material->uploader->name ?? 'Unknown',
                    'uploaded_at' => $material->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'materials' => $materials,
        ]);
    }

    /**
     * Store a newly uploaded class material.
     */
    public function store(Request $request, $courseId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|max:10485760', // 10GB limit
        ]);

        $course = Course::findOrFail($courseId);

        $course = Course::findOrFail($courseId);
        $user = $request->user();

        // Check if user is faculty for this course
        if ($course->faculty_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to upload materials for this course'
            ], 403);
        }

        $file = $request->file('file');

        // Check file size (10GB limit)
        $fileSize = $file->getSize();
        $maxAllowed = 10485760 * 1024; // 10GB in bytes

        if ($fileSize > $maxAllowed) {
            return response()->json([
                'success' => false,
                'message' => 'File is too large. Maximum file size is 10GB.',
                'errors' => ['file' => ['File exceeds maximum size of 10GB']],
            ], 422);
        }

        if (!$file->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'File upload failed',
            ], 422);
        }

        try {
            $filename = time() . '_' . $user->id . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('class_materials', $filename, 'public');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save file: ' . $e->getMessage(),
            ], 500);
        }

        $material = ClassMaterial::create([
            'course_id' => $courseId,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'file_path' => $filePath,
            'file_name' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'file_size' => $fileSize,
            'mime_type' => $file->getMimeType(),
            'uploaded_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Class material uploaded successfully',
            'material' => [
                'id' => $material->id,
                'title' => $material->title,
                'description' => $material->description,
                'file_name' => $material->file_name,
                'original_name' => $material->original_name,
                'file_size' => $material->file_size,
                'mime_type' => $material->mime_type,
                'file_url' => Storage::disk('public')->url($material->file_path),
                'uploaded_by' => $material->uploader->name ?? 'Unknown',
                'uploaded_at' => $material->created_at,
            ],
        ], 201);
    }

    /**
     * Download a class material file.
     */
    public function download($id)
    {
        $material = ClassMaterial::findOrFail($id);
        return DownloadService::serveFromStorage('public', $material->file_path, $material->original_name);
    }

    /**
     * Remove a class material.
     */
    public function destroy($id)
    {
        $material = ClassMaterial::findOrFail($id);
        $user = request()->user();

        // Check if user is faculty for this course
        if ($material->course->faculty_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this material'
            ], 403);
        }

        // Delete file from storage
        if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return response()->json([
            'success' => true,
            'message' => 'Class material deleted successfully'
        ]);
    }
}
