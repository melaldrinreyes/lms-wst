<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DownloadService
{
    /**
     * Serve a file from the given storage disk and path with proper headers.
     * Returns a BinaryFileResponse or throws an exception if file missing.
     *
     * @param string $disk
     * @param string $filePath
     * @param string|null $originalName
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public static function serveFromStorage(string $disk, string $filePath, ?string $originalName = null): BinaryFileResponse
    {
        if (!$filePath) {
            abort(404, 'No file attached');
        }

        if (!Storage::disk($disk)->exists($filePath)) {
            abort(404, 'File not found');
        }

        $fullPath = storage_path('app/' . $disk . '/' . $filePath);

        // Ensure original name: if provided use it, otherwise extract from stored filename
        $basename = basename($filePath);
        if (!$originalName || trim($originalName) === '') {
            // stored names are often like: timestamp_originalname.ext
            $underscorePos = strpos($basename, '_');
            $originalName = $underscorePos !== false ? substr($basename, $underscorePos + 1) : $basename;
        }

        // Ensure extension is present (fallback)
        if (!str_contains($originalName, '.')) {
            $ext = pathinfo($basename, PATHINFO_EXTENSION);
            if ($ext) {
                $originalName .= '.' . $ext;
            }
        }

        $mime = Storage::disk($disk)->mimeType($filePath) ?: 'application/octet-stream';

        $response = response()->download($fullPath, $originalName, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'attachment; filename="' . addcslashes($originalName, '"') . '"'
        ]);

        // Return the BinaryFileResponse instance for further handling if needed
        if ($response instanceof Response && method_exists($response, 'getFile')) {
            // convert to BinaryFileResponse when underlying file is accessible
            return $response->getFile() instanceof \SplFileInfo ? new BinaryFileResponse($fullPath) : $response;
        }

        return $response;
    }
}
