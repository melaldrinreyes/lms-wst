<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ModuleUploadController extends Controller
{
    /**
     * Generic module/media upload endpoint used by the rich text editor.
     * Accepts a multipart `file` field and optional `poster` field.
     * Returns JSON with `url` and optional `poster_url`.
     */
    public function upload(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|max:10485760', // up to 10GB (value in KB)
            'poster' => 'nullable|file|max:2048', // poster up to 2MB
        ]);

        $user = $request->user();

        try {
            $file = $request->file('file');
            $filename = time() . '_' . ($user->id ?? 'anon') . '_' . preg_replace('/[^A-Za-z0-9_\.\-]/', '_', $file->getClientOriginalName());
            $filePath = $file->storeAs('modules', $filename, 'public');
            $url = Storage::disk('public')->url($filePath);

            $response = [
                'success' => true,
                'url' => $url,
            ];

            if ($request->hasFile('poster')) {
                $poster = $request->file('poster');
                $pname = time() . '_poster_' . ($user->id ?? 'anon') . '_' . preg_replace('/[^A-Za-z0-9_\.\-]/', '_', $poster->getClientOriginalName());
                $ppath = $poster->storeAs('modules/posters', $pname, 'public');
                $response['poster_url'] = Storage::disk('public')->url($ppath);
            }

            return response()->json($response, 201);
        } catch (\Exception $e) {
            \Log::error('Module upload failed', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'File upload failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
