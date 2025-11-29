<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MediaUploadController extends Controller
{
    /**
     * Upload media files (images/videos) for rich text editor
     */
    public function upload(Request $request)
    {
        // Log all request data for debugging
        \Log::info('Media upload request received', [
            'method' => $request->method(),
            'content_type' => $request->header('Content-Type'),
            'has_file' => $request->hasFile('file'),
            'all_files' => $request->allFiles(),
            'all_data' => $request->all(),
            'file_keys' => array_keys($request->allFiles()),
        ]);

        // More permissive validation for media files
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:204800', // 200MB max, no MIME type restriction for now
            'poster' => 'nullable|file|max:5120', // 5MB max for poster images
        ]);

        if ($validator->fails()) {
            \Log::info('Media upload validation failed', [
                'errors' => $validator->errors(),
                'file_info' => $request->file('file') ? [
                    'original_name' => $request->file('file')->getClientOriginalName(),
                    'mime_type' => $request->file('file')->getMimeType(),
                    'size' => $request->file('file')->getSize(),
                    'extension' => $request->file('file')->getClientOriginalExtension(),
                ] : null
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('file');
        $user = $request->user();
        $mimeType = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());

        // Manual MIME type validation for media files - TEMPORARILY DISABLED FOR DEBUGGING
        /*
        $allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        $allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/x-matroska', 'video/3gpp'];
        $allowedDocumentTypes = ['application/pdf'];

        $isAllowed = in_array($mimeType, array_merge($allowedImageTypes, $allowedVideoTypes, $allowedDocumentTypes));

        // Also check extension as fallback
        if (!$isAllowed) {
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv', '3gp', 'pdf'];
            $isAllowed = in_array($extension, $allowedExtensions);
        }

        if (!$isAllowed) {
            \Log::info('Media upload rejected - unsupported file type', [
                'mime_type' => $mimeType,
                'extension' => $extension,
                'file_name' => $file->getClientOriginalName(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Unsupported file type. Allowed: images (jpg, png, gif, webp, svg), videos (mp4, webm, ogg, avi, mov, wmv, flv, mkv, 3gp), and PDFs.',
            ], 422);
        }
        */

        $isAllowed = true; // Temporarily allow all files

        \Log::info('Media upload attempt', [
            'user_id' => $user->id,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $mimeType,
            'extension' => $extension,
            'is_valid' => $file->isValid(),
            'is_allowed' => $isAllowed,
        ]);

        if (!$file->isValid()) {
            \Log::error('Invalid file upload', [
                'error' => $file->getError(),
                'error_message' => $file->getErrorMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'File upload failed: ' . $file->getErrorMessage(),
            ], 422);
        }

        try {
            // Generate unique filename
            $filename = time() . '_' . $user->id . '_' . uniqid() . '.' . $file->getClientOriginalExtension();

            // Store in public disk under media folder
            $filePath = $file->storeAs('media', $filename, 'public');

            // Generate full URL
            $url = Storage::disk('public')->url($filePath);

            $posterUrl = null;
            if ($request->hasFile('poster')) {
                $posterFile = $request->file('poster');
                $posterFilename = time() . '_' . $user->id . '_poster_' . uniqid() . '.' . $posterFile->getClientOriginalExtension();
                $posterPath = $posterFile->storeAs('media/posters', $posterFilename, 'public');
                $posterUrl = Storage::disk('public')->url($posterPath);
            }

            return response()->json([
                'success' => true,
                'url' => $url,
                'file_path' => $filePath,
                'file_name' => $filename,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'poster_url' => $posterUrl,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File upload failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
