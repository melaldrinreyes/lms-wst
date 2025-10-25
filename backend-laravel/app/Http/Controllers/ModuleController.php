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
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'order' => 'required|integer',
            'status' => 'required|in:published,draft',
        ]);

        $module = Module::create($validated);

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
        ]);

        $module->update($validated);

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
