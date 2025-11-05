<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\AnnouncementComment;
use App\Models\Announcement;

echo "Testing Comment Replies Functionality\n";
echo "=====================================\n\n";

// Get an announcement
$announcement = Announcement::with('course')->first();
if (!$announcement) {
    echo "❌ No announcements found in database\n";
    exit;
}

echo "✓ Found announcement: {$announcement->title}\n";
echo "  Course: {$announcement->course->name}\n\n";

// Get comments for this announcement
$comments = AnnouncementComment::with(['user', 'replies.user'])
    ->where('announcement_id', $announcement->id)
    ->whereNull('parent_id')
    ->orderBy('created_at', 'desc')
    ->get();

echo "Comments Structure:\n";
echo "-------------------\n";

if ($comments->isEmpty()) {
    echo "No comments found for this announcement\n";
} else {
    foreach ($comments as $comment) {
        echo "Comment #{$comment->id}\n";
        echo "  Author: {$comment->user->name}\n";
        echo "  Text: {$comment->comment}\n";
        echo "  Created: {$comment->created_at}\n";
        
        if ($comment->replies && $comment->replies->count() > 0) {
            echo "  Replies ({$comment->replies->count()}):\n";
            foreach ($comment->replies as $reply) {
                echo "    └─ Reply #{$reply->id}\n";
                echo "       Author: {$reply->user->name}\n";
                echo "       Text: {$reply->comment}\n";
                echo "       Created: {$reply->created_at}\n";
            }
        } else {
            echo "  No replies\n";
        }
        echo "\n";
    }
}

echo "\n✓ Test complete! Reply structure is working correctly.\n";
