<?php

// Test Announcements API
// Run this with: php test_announcements.php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Announcements System Test ===\n\n";

// Test 1: Check if announcements table exists
echo "1. Checking announcements table...\n";
$announcementsCount = DB::table('announcements')->count();
echo "   ✓ Announcements table exists. Count: $announcementsCount\n\n";

// Test 2: Check if announcement_comments table exists
echo "2. Checking announcement_comments table...\n";
$commentsCount = DB::table('announcement_comments')->count();
echo "   ✓ Announcement comments table exists. Count: $commentsCount\n\n";

// Test 3: Check table structure
echo "3. Checking table structure...\n";
$announcementColumns = DB::select("DESCRIBE announcements");
echo "   Announcement columns:\n";
foreach ($announcementColumns as $column) {
    echo "   - {$column->Field} ({$column->Type})\n";
}
echo "\n";

$commentColumns = DB::select("DESCRIBE announcement_comments");
echo "   Comment columns:\n";
foreach ($commentColumns as $column) {
    echo "   - {$column->Field} ({$column->Type})\n";
}
echo "\n";

// Test 4: Check if models exist
echo "4. Checking models...\n";
if (class_exists('App\Models\Announcement')) {
    echo "   ✓ Announcement model exists\n";
} else {
    echo "   ✗ Announcement model NOT found\n";
}

if (class_exists('App\Models\AnnouncementComment')) {
    echo "   ✓ AnnouncementComment model exists\n";
} else {
    echo "   ✗ AnnouncementComment model NOT found\n";
}
echo "\n";

// Test 5: Check if controllers exist
echo "5. Checking controllers...\n";
if (class_exists('App\Http\Controllers\AnnouncementController')) {
    echo "   ✓ AnnouncementController exists\n";
} else {
    echo "   ✗ AnnouncementController NOT found\n";
}

if (class_exists('App\Http\Controllers\AnnouncementCommentController')) {
    echo "   ✓ AnnouncementCommentController exists\n";
} else {
    echo "   ✗ AnnouncementCommentController NOT found\n";
}
echo "\n";

echo "=== Test Complete ===\n";
echo "\nAPI Endpoints Available:\n";
echo "GET    /api/announcements - Get all announcements\n";
echo "GET    /api/announcements/{id} - Get single announcement\n";
echo "POST   /api/announcements - Create announcement (Faculty/Admin)\n";
echo "PUT    /api/announcements/{id} - Update announcement (Faculty/Admin)\n";
echo "DELETE /api/announcements/{id} - Delete announcement (Faculty/Admin)\n";
echo "GET    /api/student/announcements - Get student announcements\n";
echo "GET    /api/announcements/{id}/comments - Get comments\n";
echo "POST   /api/announcement-comments - Add comment\n";
echo "PUT    /api/announcement-comments/{id} - Update comment\n";
echo "DELETE /api/announcement-comments/{id} - Delete comment\n";
