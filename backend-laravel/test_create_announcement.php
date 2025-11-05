<?php

// Test Announcement Creation
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\Announcement;
use App\Models\User;
use App\Models\Course;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Announcement Creation ===\n\n";

// Get a faculty user
$faculty = User::where('role_id', 2)->first();

if (!$faculty) {
    echo "❌ No faculty found\n";
    exit;
}

echo "Faculty: {$faculty->name} (ID: {$faculty->id})\n";
echo "Email: {$faculty->email}\n\n";

// Get a course owned by this faculty
$course = Course::where('faculty_id', $faculty->id)->first();

if (!$course) {
    echo "❌ No courses found for this faculty\n";
    exit;
}

echo "Course: {$course->course_name} (ID: {$course->id})\n";
echo "Course Code: {$course->course_code}\n\n";

try {
    // Create a test announcement
    echo "Creating test announcement...\n";
    
    $announcement = Announcement::create([
        'course_id' => $course->id,
        'title' => 'Test Announcement - ' . date('Y-m-d H:i:s'),
        'content' => 'This is a test announcement created via PHP script.',
        'created_by' => $faculty->id,
        'priority' => 'normal',
        'status' => 'published',
    ]);
    
    echo "✅ Announcement created! (ID: {$announcement->id})\n\n";
    
    // Load relationships
    $announcement->load('creator', 'course');
    
    echo "Announcement Details:\n";
    echo "  Title: {$announcement->title}\n";
    echo "  Content: {$announcement->content}\n";
    echo "  Priority: {$announcement->priority}\n";
    echo "  Status: {$announcement->status}\n";
    echo "  Creator: " . ($announcement->creator ? $announcement->creator->name : 'N/A') . "\n";
    echo "  Course: " . ($announcement->course ? $announcement->course->course_name : 'N/A') . "\n";
    echo "  Created: {$announcement->created_at}\n\n";
    
    // Test fetching announcements for the course
    echo "Fetching all announcements for this course...\n";
    $allAnnouncements = Announcement::with(['creator', 'course'])
        ->where('course_id', $course->id)
        ->withCount('comments')
        ->orderBy('created_at', 'desc')
        ->get();
    
    echo "✅ Found {$allAnnouncements->count()} announcement(s)\n\n";
    
    foreach ($allAnnouncements as $ann) {
        $priority_emoji = [
            'high' => '🔴',
            'normal' => '🟡',
            'low' => '🟢'
        ][$ann->priority] ?? '⚪';
        
        echo "  {$priority_emoji} {$ann->title}\n";
        echo "     Status: {$ann->status}\n";
        echo "     Comments: {$ann->comments_count}\n\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error: {$e->getMessage()}\n";
    echo "File: {$e->getFile()}:{$e->getLine()}\n";
}

echo "✅ Test Complete!\n";
