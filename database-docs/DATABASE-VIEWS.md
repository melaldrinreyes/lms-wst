# Database Views Documentation

**Date:** October 25, 2025  
**Status:** ✅ Operational

---

## 📊 Available Views

### 1. view_course_enrollments

**Purpose:** Provides a comprehensive view of all course enrollments with student and faculty details.

**Columns:**
- `enrollment_id` - Unique enrollment ID
- `course_code` - Course code (e.g., CS101)
- `course_name` - Full course name
- `student_id` - Student ID number (e.g., 2024-00001)
- `student_name` - Student full name
- `student_email` - Student email address
- `enrolled_at` - Enrollment timestamp
- `enrollment_status` - Status (enrolled, completed, dropped)
- `final_grade` - Final course grade (nullable)
- `faculty_name` - Faculty member name

**SQL Definition:**
```sql
CREATE VIEW view_course_enrollments AS
SELECT 
    e.id AS enrollment_id,
    c.course_code,
    c.course_name,
    u.student_id,
    u.name AS student_name,
    u.email AS student_email,
    e.enrolled_at,
    e.status AS enrollment_status,
    e.final_grade,
    f.name AS faculty_name
FROM enrollments e
JOIN courses c ON e.course_id = c.id
JOIN users u ON e.student_id = u.id
JOIN users f ON c.faculty_id = f.id
```

**Sample Query (Laravel):**
```php
// Get all enrollments
$enrollments = DB::table('view_course_enrollments')->get();

// Get enrollments for specific student
$studentEnrollments = DB::table('view_course_enrollments')
    ->where('student_id', '2024-00001')
    ->get();

// Get enrollments for specific course
$courseEnrollments = DB::table('view_course_enrollments')
    ->where('course_code', 'CS101')
    ->get();
```

---

### 2. view_student_performance

**Purpose:** Tracks student performance metrics including submissions and grades per course.

**Columns:**
- `student_id` - User ID (database primary key)
- `student_number` - Student ID number (e.g., 2024-00001)
- `student_name` - Student full name
- `course_id` - Course database ID
- `course_code` - Course code (e.g., CS101)
- `course_name` - Full course name
- `final_grade` - Final course grade (nullable)
- `total_submissions` - Count of submitted assignments
- `avg_assignment_grade` - Average grade across assignments (nullable)

**SQL Definition:**
```sql
CREATE VIEW view_student_performance AS
SELECT 
    u.id AS student_id,
    u.student_id AS student_number,
    u.name AS student_name,
    c.id AS course_id,
    c.course_code,
    c.course_name,
    e.final_grade,
    COUNT(DISTINCT s.id) AS total_submissions,
    AVG(s.grade) AS avg_assignment_grade
FROM users u
JOIN enrollments e ON u.id = e.student_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN assignments a ON c.id = a.course_id
LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = u.id
WHERE u.role_id = 3
GROUP BY u.id, u.student_id, u.name, c.id, c.course_code, c.course_name, e.final_grade
```

**Sample Query (Laravel):**
```php
// Get performance for all students
$performance = DB::table('view_student_performance')->get();

// Get performance for specific student
$studentPerformance = DB::table('view_student_performance')
    ->where('student_number', '2024-00001')
    ->get();

// Get students with low performance (example)
$lowPerformers = DB::table('view_student_performance')
    ->where('avg_assignment_grade', '<', 75)
    ->orWhereNull('avg_assignment_grade')
    ->get();
```

---

## 🔧 Usage Examples

### Get All Course Enrollments
```php
use Illuminate\Support\Facades\DB;

$enrollments = DB::table('view_course_enrollments')
    ->orderBy('course_code')
    ->get();
```

### Get Student Dashboard Data
```php
$studentId = '2024-00001';

$enrollments = DB::table('view_course_enrollments')
    ->where('student_id', $studentId)
    ->get();

$performance = DB::table('view_student_performance')
    ->where('student_number', $studentId)
    ->get();
```

### Get Faculty Course List with Enrollment Count
```php
$facultyName = 'Dr. John Smith';

$courses = DB::table('view_course_enrollments')
    ->select('course_code', 'course_name', DB::raw('COUNT(*) as enrollment_count'))
    ->where('faculty_name', $facultyName)
    ->groupBy('course_code', 'course_name')
    ->get();
```

### Get Course Statistics
```php
$courseCode = 'CS101';

$stats = DB::table('view_student_performance')
    ->where('course_code', $courseCode)
    ->select(
        DB::raw('COUNT(*) as total_students'),
        DB::raw('AVG(avg_assignment_grade) as class_average'),
        DB::raw('SUM(total_submissions) as total_submissions')
    )
    ->first();
```

---

## 📝 Current Data

### Enrollments (4 records)
| Student | Course | Faculty |
|---------|--------|---------|
| Juan Dela Cruz | CS101 - Introduction to Computer Science | Dr. John Smith |
| Juan Dela Cruz | MATH101 - College Algebra | Dr. John Smith |
| Maria Clara Santos | CS101 - Introduction to Computer Science | Dr. John Smith |
| Maria Clara Santos | ENG101 - English Communication Skills | Dr. John Smith |

### Performance (4 records)
| Student | Course | Submissions | Avg Grade |
|---------|--------|-------------|-----------|
| Juan Dela Cruz (2024-00001) | CS101 | 0 | N/A |
| Juan Dela Cruz (2024-00001) | MATH101 | 0 | N/A |
| Maria Clara Santos (2024-00002) | CS101 | 0 | N/A |
| Maria Clara Santos (2024-00002) | ENG101 | 0 | N/A |

*Note: No submissions yet as assignments were just created*

---

## 🔄 Migration

Views are included in Laravel migration:
- **File:** `database/migrations/2025_10_25_100012_create_database_views.php`
- **Status:** Created but not migrated yet

To apply (if needed):
```bash
php artisan migrate
```

To rollback:
```bash
php artisan migrate:rollback
```

---

## ✅ Verification Commands

### Check Views Exist
```bash
C:\xampp\mysql\bin\mysql.exe -u root minsu_lms_db -e "SHOW FULL TABLES WHERE Table_type = 'VIEW';"
```

### Test View Data
```bash
# Course Enrollments
C:\xampp\mysql\bin\mysql.exe -u root minsu_lms_db -e "SELECT * FROM view_course_enrollments;"

# Student Performance
C:\xampp\mysql\bin\mysql.exe -u root minsu_lms_db -e "SELECT * FROM view_student_performance;"
```

### Laravel Test
```bash
php artisan tinker --execute="echo DB::table('view_course_enrollments')->count();"
php artisan tinker --execute="echo DB::table('view_student_performance')->count();"
```

---

## 🎯 Use Cases

### For Students
- View all enrolled courses
- Check assignment submission status
- Track performance metrics

### For Faculty
- See all enrolled students per course
- Monitor class performance
- Identify students needing help

### For Admin
- Generate enrollment reports
- Track overall student performance
- Monitor course popularity

---

**Status:** ✅ Both views fully operational  
**Last Updated:** October 25, 2025
