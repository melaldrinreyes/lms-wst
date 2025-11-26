<?php

namespace App\Http\Controllers;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\DownloadService;

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
        // Check PHP upload errors
        $phpFileError = $_FILES['file']['error'] ?? 'no file in $_FILES';
        
        // Debug: Log incoming request
        \Log::info('Module Store Request:', [
            'all_data' => $request->all(),
            'has_file' => $request->hasFile('file'),
            'has_files' => $request->hasFile('files'),
            'file_input' => $request->input('file'),
            'file_object' => $request->file('file'),
            'request_files' => $request->allFiles(),
            'php_files_array' => $_FILES,
            'php_file_error' => $phpFileError,
            'php_upload_max_filesize' => ini_get('upload_max_filesize'),
            'php_post_max_size' => ini_get('post_max_size'),
        ]);

        try {
            $validated = $request->validate([
                'course_id' => 'required|exists:courses,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|string',
                'order' => 'nullable|integer',
                'status' => 'nullable|in:published,draft',
                'file' => [
                    'nullable',
                    'file',
                    'max:10240000', // 10GB max
                    function ($attribute, $value, $fail) {
                        if (!$value) return;
                        
                        $allowedMimes = [
                            // Documents
                            'application/pdf', 'application/msword', 
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'application/vnd.ms-powerpoint',
                            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                            'text/plain',
                            // Images
                            'image/jpeg', 'image/png', 'image/gif',
                            // Videos
                            'video/mp4', 'video/quicktime', 'video/x-msvideo', 
                            'video/x-matroska', 'video/webm', 'video/x-flv', 'video/x-ms-wmv',
                            'application/octet-stream', // For some video files
                            // Archives
                            'application/zip', 'application/x-rar-compressed', 'application/x-rar',
                            // Cisco Packet Tracer and similar
                            'application/octet-stream', 'application/x-pk', 'application/x-pkt',
                        ];
                        
                        $allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 
                                             'jpg', 'jpeg', 'png', 'gif', 
                                             'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 
                                             'zip', 'rar', 'pk', 'pkt'];
                        
                        $extension = strtolower($value->getClientOriginalExtension());
                        $mimeType = $value->getMimeType();
                        
                        \Log::info('File validation check:', [
                            'extension' => $extension,
                            'mime_type' => $mimeType,
                            'size' => $value->getSize(),
                        ]);
                        
                        if (!in_array($extension, $allowedExtensions) && !in_array($mimeType, $allowedMimes)) {
                            $fail('The file must be a valid document, image, video, or archive file.');
                        }
                    }
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Module validation failed:', [
                'errors' => $e->errors(),
                'file_present' => $request->hasFile('file'),
                'file_info' => $request->hasFile('file') ? [
                    'name' => $request->file('file')->getClientOriginalName(),
                    'mime' => $request->file('file')->getMimeType(),
                    'size' => $request->file('file')->getSize(),
                ] : null,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'The file failed to upload.',
                'errors' => $e->errors(),
            ], 422);
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
                'error' => $file->getError(),
                'error_message' => $file->getErrorMessage(),
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
                'file' => [
                    'nullable',
                    'file',
                    'max:512000',
                    function ($attribute, $value, $fail) {
                        if (!$value) return;
                        
                        $allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 
                                             'jpg', 'jpeg', 'png', 'gif', 
                                             'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 
                                             'zip', 'rar', 'pk', 'pkt'];
                        
                        $extension = strtolower($value->getClientOriginalExtension());
                        
                        if (!in_array($extension, $allowedExtensions)) {
                            $fail('The file must be a valid document, image, video, or archive file.');
                        }
                    }
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Update validation failed:', [
                'errors' => $e->errors(),
                'file_info' => $request->hasFile('file') ? [
                    'name' => $request->file('file')->getClientOriginalName(),
                    'mime' => $request->file('file')->getMimeType(),
                    'size' => $request->file('file')->getSize(),
                ] : null,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'The file failed to upload.',
                'errors' => $e->errors(),
            ], 422);
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
            // Extract original filename from file_path (after first underscore)
            $originalName = null;
            if ($module->file_path) {
                $basename = basename($module->file_path);
                $underscorePos = strpos($basename, '_');
                if ($underscorePos !== false) {
                    $originalName = substr($basename, $underscorePos + 1);
                } else {
                    $originalName = $basename;
                }
                // Ensure extension is present
                if (!str_contains($originalName, '.')) {
                    $ext = pathinfo($basename, PATHINFO_EXTENSION);
                    if ($ext) {
                        $originalName .= '.' . $ext;
                    }
                }
            }
            \Log::info('Module download:', [
                'file_path' => $module->file_path,
                'original_name' => $originalName,
            ]);
            return DownloadService::serveFromStorage('public', $module->file_path, $originalName);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Download failed',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Handle WYSIWYG file uploads (images/videos) for modules
     */
    public function upload(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file uploaded'], 400);
        }

        $file = $request->file('file');

        // Validate file type
        $allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/pdf'
        ];

        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            return response()->json(['error' => 'Unsupported file type'], 400);
        }

        // Validate file size (500MB)
        if ($file->getSize() > 524288000) {
            return response()->json(['error' => 'File size exceeds 500MB limit'], 400);
        }

        $path = $file->store('uploads', 'public');
        $url = asset('storage/' . $path);

        return response()->json([
            'url' => $url,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'original_name' => $file->getClientOriginalName()
        ]);
    }
}
