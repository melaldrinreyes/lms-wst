<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Checking teacher1@gmail.com courses ===\n\n";

// Find the faculty user
$faculty = App\Models\User::where('email', 'teacher1@gmail.com')->first();

if (!$faculty) {
    echo "❌ Faculty user NOT FOUND!\n";
    exit(1);
}

echo "✅ Faculty User Found:\n";
echo "   ID: {$faculty->id}\n";
echo "   Name: {$faculty->name}\n";
echo "   Email: {$faculty->email}\n";
echo "   Role ID: {$faculty->role_id}\n\n";

// Get courses by this faculty
$courses = App\Models\Course::where('faculty_id', $faculty->id)->get();
echo "📚 Courses for this faculty: {$courses->count()}\n";

foreach ($courses as $course) {
    echo "  - [ID: {$course->id}] {$course->course_name}\n";
    echo "    Code: {$course->course_code}\n";
    echo "    Status: {$course->status}\n";
    echo "    Created: {$course->created_at}\n\n";
}

// Get ALL courses in database
echo "=== All Courses in Database ===\n";
$allCourses = App\Models\Course::all();
echo "Total: {$allCourses->count()}\n\n";

foreach ($allCourses as $course) {
    echo "  - [ID: {$course->id}] {$course->course_name}\n";
    echo "    Faculty ID: {$course->faculty_id}\n";
    echo "    Status: {$course->status}\n\n";
}

// Check if course was deleted (soft deletes)
$deletedCourses = App\Models\Course::onlyTrashed()->where('faculty_id', $faculty->id)->get();
if ($deletedCourses->count() > 0) {
    echo "🗑️  Soft Deleted Courses: {$deletedCourses->count()}\n";
    foreach ($deletedCourses as $course) {
        echo "  - [ID: {$course->id}] {$course->course_name}\n";
        echo "    Deleted at: {$course->deleted_at}\n\n";
    }
}
