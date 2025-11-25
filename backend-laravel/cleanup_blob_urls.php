<?php
// Script to clean up blob: URLs in lecture content and remove them from the database

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\CourseLecture;

echo "=== Cleaning up blob: URLs in lecture content ===\n\n";

$lectures = CourseLecture::all();
$updated = 0;
foreach ($lectures as $lecture) {
    if (strpos($lecture->content, 'blob:') !== false) {
        $oldContent = $lecture->content;
        // Remove entire <video ...>...</video> blocks with blob: URLs
        $newContent = preg_replace('/<video[^>]*src=["\']blob:[^"\']*["\'][^>]*>[\s\S]*?<\/video>/i', '', $oldContent);
        // Remove <source ... src="blob:..." ...>
        $newContent = preg_replace('/<source[^>]*src=["\']blob:[^"\']*["\'][^>]*>/i', '', $newContent);
        if ($oldContent !== $newContent) {
            $lecture->content = $newContent;
            $lecture->save();
            $updated++;
            echo "Updated lecture ID: {$lecture->id}\n";
        }
    }
}
echo "\nDone. Updated $updated lectures.\n";
