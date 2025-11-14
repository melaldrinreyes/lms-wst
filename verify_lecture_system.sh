#!/usr/bin/bash

# Quick verification script for Lecture System

echo "======================================"
echo "  Lecture System - Verification"
echo "======================================"
echo ""

cd /opt/lampp/htdocs/lms-wst/backend-laravel

# Check if files exist
echo "✓ Checking files..."
test -f "app/Models/CourseLecture.php" && echo "  ✅ Model: CourseLecture.php" || echo "  ❌ Model: CourseLecture.php"
test -f "app/Http/Controllers/CourseLectureController.php" && echo "  ✅ Controller: CourseLectureController.php" || echo "  ❌ Controller: CourseLectureController.php"
test -f "database/migrations/2024_01_01_000000_create_course_lectures_table.php" && echo "  ✅ Migration: course_lectures table" || echo "  ❌ Migration: course_lectures table"

echo ""
echo "✓ Checking routes..."
grep -q "CourseLectureController" routes/api.php && echo "  ✅ Routes configured" || echo "  ❌ Routes not configured"

echo ""
echo "✓ Checking frontend component..."
test -f "../frontend-react/src/components/LectureContent.jsx" && echo "  ✅ Component: LectureContent.jsx" || echo "  ❌ Component: LectureContent.jsx"

echo ""
echo "✓ Checking database..."
php artisan tinker --execute '
$table = DB::table("information_schema.tables")
  ->where("table_schema", DB::connection()->getDatabaseName())
  ->where("table_name", "course_lectures")
  ->first();
if ($table) {
  echo "  ✅ Table exists: course_lectures\n";
  $columns = DB::select("SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \"course_lectures\" AND TABLE_SCHEMA = \"" . DB::connection()->getDatabaseName() . "\"");
  echo "  Columns: " . count($columns) . "\n";
  foreach ($columns as $col) {
    echo "    - " . $col->COLUMN_NAME . "\n";
  }
} else {
  echo "  ❌ Table not found\n";
}
'

echo ""
echo "======================================"
echo "  Verification Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Login with a teacher account"
echo "2. Go to a course -> Content tab"
echo "3. Try adding a lecture"
echo "4. Edit and save content"
echo "5. Student can view organized lectures"
echo ""
