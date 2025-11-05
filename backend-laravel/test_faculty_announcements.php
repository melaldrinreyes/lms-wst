<?php

// Test Faculty Announcements Functions
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Faculty Announcements Functions ===\n\n";

// Get faculty user
$faculty = DB::table('users')->where('role_id', 2)->first();

if (!$faculty) {
    echo "❌ No faculty user found\n";
    exit;
}

echo "Faculty: {$faculty->name} (ID: {$faculty->id})\n";
echo "Email: {$faculty->email}\n\n";

// Get faculty's courses
$courses = DB::table('courses')
    ->where('faculty_id', $faculty->id)
    ->get();

echo "Faculty's Courses: " . $courses->count() . "\n";
foreach ($courses as $course) {
    echo "  - {$course->course_name} (ID: {$course->id})\n";
}
echo "\n";

// Get announcements created by this faculty
$announcements = DB::table('announcements')
    ->where('created_by', $faculty->id)
    ->get();

echo "Announcements created by faculty: " . $announcements->count() . "\n";
if ($announcements->count() > 0) {
    foreach ($announcements as $announcement) {
        $course = DB::table('courses')->find($announcement->course_id);
        $status_badge = $announcement->status === 'published' ? '✓' : '○';
        $priority_emoji = [
            'high' => '🔴',
            'normal' => '🟡',
            'low' => '🟢'
        ][$announcement->priority] ?? '⚪';
        
        echo "\n  {$priority_emoji} {$status_badge} {$announcement->title}\n";
        echo "     Course: {$course->course_name}\n";
        echo "     Status: {$announcement->status}\n";
        echo "     Priority: {$announcement->priority}\n";
        echo "     Created: {$announcement->created_at}\n";
    }
} else {
    echo "\n  No announcements yet. Create one to test!\n";
}

echo "\n";

// Statistics
$published = $announcements->where('status', 'published')->count();
$draft = $announcements->where('status', 'draft')->count();
$high = $announcements->where('priority', 'high')->count();

echo "Statistics:\n";
echo "  Total: {$announcements->count()}\n";
echo "  Published: {$published}\n";
echo "  Draft: {$draft}\n";
echo "  High Priority: {$high}\n";

echo "\n✅ Test Complete!\n\n";

echo "Available API Endpoints for Faculty:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "GET    /api/faculty/announcements\n";
echo "       - Get all announcements created by the faculty\n";
echo "       - Includes statistics and comment counts\n\n";

echo "GET    /api/faculty/courses/{courseId}/announcements\n";
echo "       - Get announcements for a specific course\n";
echo "       - Only for courses owned by the faculty\n\n";

echo "POST   /api/announcements\n";
echo "       - Create new announcement\n";
echo "       - Body: { course_id, title, content, priority, status }\n\n";

echo "PUT    /api/announcements/{id}\n";
echo "       - Update announcement\n";
echo "       - Can update: title, content, priority, status\n\n";

echo "DELETE /api/announcements/{id}\n";
echo "       - Delete announcement\n";
echo "       - Cascade deletes all comments\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
