<?php

// Test Course Show Endpoint
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Course Show Endpoint ===\n\n";

// Get first course
$course = DB::table('courses')->first();

if (!$course) {
    echo "❌ No courses found\n";
    exit;
}

echo "Testing Course: {$course->course_name} (ID: {$course->id})\n\n";

try {
    // Test the query that's causing the issue
    $announcements = DB::table('announcements')
        ->select('announcements.*')
        ->where('course_id', $course->id)
        ->get();
    
    echo "✅ Announcements query successful!\n";
    echo "Found {$announcements->count()} announcements\n\n";
    
    // Test with creator relationship
    $app = app();
    $announcementsWithCreator = \App\Models\Announcement::with('creator')
        ->where('course_id', $course->id)
        ->withCount('comments')
        ->get();
    
    echo "✅ Announcements with creator query successful!\n";
    echo "Found {$announcementsWithCreator->count()} announcements\n\n";
    
    foreach ($announcementsWithCreator as $announcement) {
        echo "  📢 {$announcement->title}\n";
        echo "     Priority: {$announcement->priority}\n";
        echo "     Status: {$announcement->status}\n";
        echo "     Creator: " . ($announcement->creator ? $announcement->creator->name : 'N/A') . "\n";
        echo "     Comments: {$announcement->comments_count}\n\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error: {$e->getMessage()}\n";
    echo "File: {$e->getFile()}:{$e->getLine()}\n";
}

echo "✅ Test Complete!\n";
