<?php
/**
 * Test script for hierarchical lectures
 * Run: php artisan tinker --execute="include('test_hierarchical_lectures.php');"
 */

use App\Models\Course;
use App\Models\CourseLecture;
use App\Models\User;

echo "\n=== Testing Hierarchical Lectures ===\n\n";

// Get first teacher
$teacher = User::where('role_id', 2)->first();
if (!$teacher) {
    echo "❌ No teacher found\n";
    exit;
}

// Get first course or create one
$course = Course::where('faculty_id', $teacher->id)->first();
if (!$course) {
    echo "❌ No course found for teacher\n";
    exit;
}

echo "✓ Teacher: {$teacher->name}\n";
echo "✓ Course: {$course->name}\n\n";

// Test 1: Create root lecture (module)
echo "Test 1: Creating root lecture (module)...\n";
$module = CourseLecture::create([
    'course_id' => $course->id,
    'title' => 'Module 1: Introduction',
    'content' => '<h2>Welcome to Introduction</h2><p>This is the module content.</p>',
    'level' => 0,
    'order' => 1,
    'created_by' => $teacher->id,
]);
echo "✓ Created module with ID: {$module->id}, level: {$module->level}, parent_id: {$module->parent_lecture_id}\n\n";

// Test 2: Create sub-lectures
echo "Test 2: Creating sub-lectures under module...\n";
$sub1 = CourseLecture::create([
    'course_id' => $course->id,
    'parent_lecture_id' => $module->id,
    'title' => 'Chapter 1: Getting Started',
    'content' => '<h3>Getting Started</h3><p>First chapter content.</p>',
    'level' => 1,
    'order' => 1,
    'created_by' => $teacher->id,
]);
echo "✓ Created sub-lecture 1 with ID: {$sub1->id}, parent: {$sub1->parent_lecture_id}, level: {$sub1->level}\n";

$sub2 = CourseLecture::create([
    'course_id' => $course->id,
    'parent_lecture_id' => $module->id,
    'title' => 'Chapter 2: Advanced Topics',
    'content' => '<h3>Advanced Topics</h3><p>Second chapter content.</p>',
    'level' => 1,
    'order' => 2,
    'created_by' => $teacher->id,
]);
echo "✓ Created sub-lecture 2 with ID: {$sub2->id}, parent: {$sub2->parent_lecture_id}, level: {$sub2->level}\n\n";

// Test 3: Verify hierarchy
echo "Test 3: Verifying hierarchy...\n";
$allLectures = CourseLecture::where('course_id', $course->id)
    ->orderBy('level')
    ->orderBy('parent_lecture_id')
    ->orderBy('order')
    ->get();

echo "Total lectures: " . $allLectures->count() . "\n";
foreach ($allLectures as $lecture) {
    $indent = str_repeat("  ", $lecture->level);
    $parent = $lecture->parent_lecture_id ? "(parent: {$lecture->parent_lecture_id})" : "(root)";
    echo "{$indent}├─ [{$lecture->id}] {$lecture->title} {$parent}\n";
}
echo "\n";

// Test 4: Test child relationships
echo "Test 4: Testing model relationships...\n";
$moduleWithChildren = CourseLecture::with('children')->find($module->id);
echo "Module '{$moduleWithChildren->title}' has " . $moduleWithChildren->children->count() . " children:\n";
foreach ($moduleWithChildren->children as $child) {
    echo "  ├─ {$child->title}\n";
}
echo "\n";

// Test 5: Test parent relationship
echo "Test 5: Testing parent relationships...\n";
$subWithParent = CourseLecture::with('parent')->find($sub1->id);
if ($subWithParent->parent) {
    echo "Sub-lecture '{$subWithParent->title}' parent: '{$subWithParent->parent->title}'\n";
} else {
    echo "Sub-lecture has no parent\n";
}
echo "\n";

// Test 6: Verify content persistence
echo "Test 6: Verifying content persistence...\n";
$updated = CourseLecture::find($module->id);
if ($updated->content === $module->content) {
    echo "✓ Content persisted correctly\n";
} else {
    echo "❌ Content mismatch\n";
}
echo "\n";

echo "=== All Tests Completed ===\n\n";
