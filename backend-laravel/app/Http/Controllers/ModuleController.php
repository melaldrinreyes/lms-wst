<?php

namespace App\Http\Controllers;

use App\Models\Module;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    /**
     * Get all modules for a course
     */
    public function index($courseId)
    {
        $modules = Module::where('course_id', $courseId)
            ->orderBy('order')
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
        // Log incoming request data for debugging
        \Log::info('Module creation request:', [
            'all_data' => $request->all(),
            'has_file' => $request->hasFile('file'),
            'files' => $request->file(),
        ]);

        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'order' => 'required|integer',
            'status' => 'required|in:published,draft',
            'file' => 'required|file|max:10240', // 10MB max - REQUIRED
        ]);

        // Map the frontend field names to database column names
        $moduleData = [
            'course_id' => $validated['course_id'],
            'module_title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'content' => $validated['content'] ?? null,
            'module_order' => $validated['order'],
            'status' => $validated['status'],
        ];

        // Handle file upload (now required)
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('modules', $filename, 'public');
            $moduleData['file_path'] = $filePath;
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Module file is required',
            ], 422);
        }

        $module = Module::create($moduleData);

        // Notify enrolled students about new module
        NotificationController::notifyStudents(
            $validated['course_id'],
            'module_added',
            'New module added: ' . $validated['title'],
            $module->id,
            'module'
        );

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

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'order' => 'required|integer',
            'status' => 'required|in:published,draft',
            'file' => 'nullable|file|max:10240', // 10MB max
        ]);

        // Map the frontend field names to database column names
        $moduleData = [
            'module_title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'content' => $validated['content'] ?? null,
            'module_order' => $validated['order'],
            'status' => $validated['status'],
        ];

        // Handle file upload
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($module->file_path && \Storage::disk('public')->exists($module->file_path)) {
                \Storage::disk('public')->delete($module->file_path);
            }
            
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('modules', $filename, 'public');
            $moduleData['file_path'] = $filePath;
        }

        $module->update($moduleData);

        // Notify enrolled students about module update
        NotificationController::notifyStudents(
            $module->course_id,
            'module_updated',
            'Module updated: ' . $validated['title'],
            $module->id,
            'module'
        );

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
}
