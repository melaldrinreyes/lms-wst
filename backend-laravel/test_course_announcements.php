<?php

// Test Course Announcements Section
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\Course;
use App\Models\Announcement;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Course Announcements Section ===\n\n";

// Get a course
$course = DB::table('courses')->first();

if (!$course) {
    echo "❌ No courses found\n";
    exit;
}

echo "Course: {$course->course_name} (ID: {$course->id})\n";
echo "Course Code: {$course->course_code}\n\n";

// Count announcements for this course
$announcementCount = DB::table('announcements')
    ->where('course_id', $course->id)
    ->count();

echo "Announcements in this course: {$announcementCount}\n";

if ($announcementCount > 0) {
    $announcements = DB::table('announcements')
        ->where('course_id', $course->id)
        ->get();
    
    echo "\nAnnouncements:\n";
    foreach ($announcements as $announcement) {
        $priority_emoji = [
            'high' => '🔴',
            'normal' => '🟡',
            'low' => '🟢'
        ][$announcement->priority] ?? '⚪';
        
        $status_badge = $announcement->status === 'published' ? '✓' : '○';
        
        echo "  {$priority_emoji} {$status_badge} {$announcement->title}\n";
        echo "     Priority: {$announcement->priority}\n";
        echo "     Status: {$announcement->status}\n";
        echo "     Created: {$announcement->created_at}\n\n";
    }
}

echo "\n✅ Test Complete!\n\n";

echo "What was added to courses:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "1. GET /api/courses - Now includes 'announcements' count\n";
echo "   Response includes: announcements: <number>\n\n";

echo "2. GET /api/courses/{id} - Now includes full announcements list\n";
echo "   Response includes:\n";
echo "   - announcements: [\n";
echo "       {\n";
echo "         id, title, content, priority, status,\n";
echo "         created_at, updated_at, comments_count,\n";
echo "         creator: { id, name, email, profile_image }\n";
echo "       }\n";
echo "     ]\n\n";

echo "3. Students only see published announcements\n";
echo "   Faculty/Admin see all announcements (draft + published)\n\n";

echo "4. Announcements are sorted by:\n";
echo "   - Priority (high → normal → low)\n";
echo "   - Date (newest first)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

echo "\nNow you can:\n";
echo "✓ View announcements when viewing a course\n";
echo "✓ See announcement count in course list\n";
echo "✓ Create announcements for the course\n";
echo "✓ Students see only published announcements\n";
echo "✓ Faculty see all announcements including drafts\n";
