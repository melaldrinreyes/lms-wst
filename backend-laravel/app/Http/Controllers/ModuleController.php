<?php

namespace App\Http\Controllers;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ModuleController extends Controller
{
    /**
     * Get all modules for a course
     */
    public function index($courseId)
    {
        $modules = Module::where('course_id', $courseId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'modules' => $modules,
        ]);
    }

    /**
     * Create a new module
     */
    public function store(Request $request)
    {
        // Debug: Log incoming request
        \Log::info('Module Store Request:', [
            'all_data' => $request->all(),
            'has_file' => $request->hasFile('file'),
            'has_files' => $request->hasFile('files'),
        ]);

        try {
            $validated = $request->validate([
                'course_id' => 'required|exists:courses,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|string',
                'order' => 'nullable|integer',
                'status' => 'nullable|in:published,draft',
                'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,txt,jpg,jpeg,png,gif,mp4,mov,avi,mkv,zip,rar|max:512000', // 500MB max
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed:', [
                'errors' => $e->errors(),
                'file_present' => $request->hasFile('file'),
            ]);
            throw $e;
        }

        // Handle file upload
        $filePath = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            \Log::info('File detected:', [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
                'valid' => $file->isValid(),
            ]);
            
            if ($file->isValid()) {
                try {
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $filePath = $file->storeAs('modules', $filename, 'public');
                    \Log::info('File stored successfully:', ['path' => $filePath]);
                } catch (\Exception $e) {
                    \Log::error('File storage failed:', ['error' => $e->getMessage()]);
                    return response()->json([
                        'success' => false,
                        'message' => 'File upload failed: ' . $e->getMessage()
                    ], 500);
                }
            } else {
                \Log::warning('File is invalid');
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid file upload'
                ], 422);
            }
        } else {
            \Log::info('No file in request');
        }

        // Map frontend field names to database column names
        $moduleData = [
            'course_id' => $validated['course_id'],
            'module_title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'content' => $validated['content'] ?? null,
            'module_order' => $validated['order'] ?? 0,
            'status' => $validated['status'] ?? 'draft',
            'file_path' => $filePath,
        ];

        $module = Module::create($moduleData);

        return response()->json([
            'success' => true,
            'message' => 'Module created successfully',
            'module' => $module,
        ], 201);
    }

    /**
     * Update a module
     */
    public function update(Request $request, $id)
    {
        $module = Module::findOrFail($id);

        \Log::info('Module Update Request:', [
            'module_id' => $id,
            'all_data' => $request->all(),
            'has_file' => $request->hasFile('file'),
        ]);

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|string',
                'order' => 'nullable|integer',
                'status' => 'nullable|in:published,draft',
                'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,txt,jpg,jpeg,png,gif,mp4,mov,avi,mkv,zip,rar|max:512000',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Update validation failed:', ['errors' => $e->errors()]);
            throw $e;
        }

        // Handle file upload
        $filePath = $module->file_path; // Keep existing file by default
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            
            if ($file->isValid()) {
                try {
                    // Delete old file if exists
                    if ($module->file_path) {
                        $oldFilePath = storage_path('app/public/' . $module->file_path);
                        if (file_exists($oldFilePath)) {
                            unlink($oldFilePath);
                            \Log::info('Deleted old file:', ['path' => $oldFilePath]);
                        }
                    }
                    
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $filePath = $file->storeAs('modules', $filename, 'public');
                    \Log::info('New file stored:', ['path' => $filePath]);
                } catch (\Exception $e) {
                    \Log::error('File update failed:', ['error' => $e->getMessage()]);
                }
            }
        }

        // Map frontend field names to database column names
        $moduleData = [
            'module_title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'content' => $validated['content'] ?? null,
            'module_order' => $validated['order'] ?? $module->module_order,
            'status' => $validated['status'] ?? $module->status,
            'file_path' => $filePath,
        ];

        $module->update($moduleData);

        return response()->json([
            'success' => true,
            'message' => 'Module updated successfully',
            'module' => $module,
        ]);
    }

    /**
     * Delete a module
     */
    public function destroy($id)
    {
        $module = Module::findOrFail($id);
        $module->delete();

        return response()->json([
            'success' => true,
            'message' => 'Module deleted successfully',
        ]);
    }

    /**
     * Download module file
     */
    public function download($id)
    {
        try {
            $module = Module::findOrFail($id);
            
            if (!$module->file_path) {
                return response()->json(['error' => 'No file attached'], 404);
            }

            // Check if file exists in storage
            if (!Storage::disk('public')->exists($module->file_path)) {
                return response()->json([
                    'error' => 'File not found',
                    'path' => $module->file_path,
                    'full_path' => storage_path('app/public/' . $module->file_path)
                ], 404);
            }

            // Get the file path
            $path = storage_path('app/public/' . $module->file_path);
            
            // Return file download response
            return response()->download($path);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Download failed',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
