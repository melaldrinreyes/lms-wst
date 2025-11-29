<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing Faculty Courses ===\n\n";

// Get faculty user
$faculty = App\Models\User::where('role_id', 2)->first();
if (!$faculty) {
    echo "❌ No faculty user found!\n";
    exit(1);
}

echo "✅ Faculty User Found:\n";
echo "   ID: {$faculty->id}\n";
echo "   Name: {$faculty->name}\n";
echo "   Email: {$faculty->email}\n";
echo "   Role ID: {$faculty->role_id}\n\n";

// Get faculty courses
$courses = App\Models\Course::where('faculty_id', $faculty->id)
    ->withCount(['enrollments', 'assignments', 'announcements'])
    ->get();

echo "📚 Faculty Courses: {$courses->count()}\n\n";

foreach ($courses as $course) {
    echo "Course: {$course->course_name}\n";
    echo "  Code: {$course->course_code}\n";
    echo "  ID: {$course->id}\n";
    echo "  Faculty ID: {$course->faculty_id}\n";
    echo "  Students: {$course->enrollments_count}\n";
    echo "  Assignments: {$course->assignments_count}\n";
    echo "  Status: {$course->status}\n\n";
}

// Test creating a token for this faculty
$token = $faculty->createToken('test-token')->plainTextToken;
echo "🔑 Test Token: {$token}\n\n";

// Test making API call
echo "🌐 Testing API call with token...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/courses');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Response Code: {$httpCode}\n";
echo "Response:\n";
echo json_encode(json_decode($response, true), JSON_PRETTY_PRINT);
echo "\n";
