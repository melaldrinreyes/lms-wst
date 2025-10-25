# MINSU E-LEARN Database Setup - Completion Report

## ✅ Database Successfully Created!

**Database Name:** `minsu_lms_db`  
**Date Created:** October 25, 2025  
**Location:** XAMPP MySQL Server (localhost)

---

## 📊 Database Statistics

### Tables Created: 11
1. ✅ `roles` - User role types
2. ✅ `users` - All system users (admin, faculty, students)
3. ✅ `courses` - Faculty courses
4. ✅ `modules` - Learning materials
5. ✅ `assignments` - Course assignments
6. ✅ `submissions` - Student assignment submissions
7. ✅ `forums` - Discussion forums
8. ✅ `posts` - Forum posts/replies
9. ✅ `announcements` - System and course announcements
10. ✅ `notifications` - User notifications
11. ✅ `chatbot_logs` - AI chatbot interaction logs

### Views Created: 2
1. ✅ `view_course_enrollments` - Course enrollment statistics
2. ✅ `view_student_performance` - Student performance tracking

### Stored Procedures Created: 2
1. ✅ `sp_get_student_dashboard` - Student dashboard statistics
2. ✅ `sp_get_faculty_dashboard` - Faculty dashboard statistics

---

## 👥 Default Data Inserted

### Roles (3 roles)
| ID | Role Name |
|----|-----------|
| 1  | admin     |
| 2  | faculty   |
| 3  | student   |

### Users (3 sample users)
| ID | Role     | Name                  | Email                       | Department       |
|----|----------|-----------------------|-----------------------------|------------------|
| 1  | admin    | System Administrator  | admin@minsu.edu.ph          | IT Department    |
| 2  | faculty  | Dr. John Smith        | john.smith@minsu.edu.ph     | Computer Science |
| 3  | student  | Juan Dela Cruz        | juan.delacruz@minsu.edu.ph  | Computer Science |

**Default Password for all users:** `admin123`

### Courses (1 sample course)
| ID | Course Code | Course Title                 | Faculty         | Semester      | Year Level |
|----|-------------|------------------------------|-----------------|---------------|------------|
| 1  | CS101       | Introduction to Programming  | Dr. John Smith  | 1st Semester  | 1          |

---

## 🔑 Login Credentials

### Admin Account
- **Email:** admin@minsu.edu.ph
- **Password:** admin123
- **Role:** Administrator

### Faculty Account
- **Email:** john.smith@minsu.edu.ph
- **Password:** admin123
- **Role:** Faculty

### Student Account
- **Email:** juan.delacruz@minsu.edu.ph
- **Password:** admin123
- **Student No:** 2021-00001
- **Role:** Student

---

## 🔗 Relationships Summary

### One-to-Many Relationships
- `roles` (1) → `users` (many)
- `users` (faculty) (1) → `courses` (many)
- `users` (student) (1) → `submissions` (many)
- `courses` (1) → `modules` (many)
- `courses` (1) → `assignments` (many)
- `courses` (1) → `forums` (many)
- `courses` (1) → `announcements` (many)
- `assignments` (1) → `submissions` (many)
- `forums` (1) → `posts` (many)
- `users` (1) → `posts` (many)
- `users` (1) → `announcements` (many)
- `users` (1) → `notifications` (many)
- `users` (1) → `chatbot_logs` (many)

### Unique Constraints
- `roles.name` - Each role name must be unique
- `users.email` - Each email must be unique
- `users.student_no` - Each student number must be unique
- `courses.course_code` - Each course code must be unique
- `submissions(assignment_id, student_id)` - One submission per student per assignment

---

## 📝 Important Notes

### Cascade Rules

**ON DELETE CASCADE** (Child records deleted when parent deleted):
- When a course is deleted → All modules, assignments, forums are deleted
- When an assignment is deleted → All submissions are deleted
- When a forum is deleted → All posts are deleted
- When a user is deleted → All notifications are deleted

**ON DELETE SET NULL** (Reference set to NULL when parent deleted):
- When a course is deleted → Announcements remain but course_id = NULL
- When a user is deleted → Chatbot logs remain but user_id = NULL

**ON DELETE RESTRICT** (Prevents deletion if children exist):
- Cannot delete a role if users exist with that role
- Cannot delete a faculty if they have created courses
- Cannot delete a user if they created forums

### Character Set
- **Database:** `utf8mb4_unicode_ci`
- **All Tables:** `utf8mb4_unicode_ci`
- Supports full Unicode including emojis and special characters

---

## 🛠️ Next Steps

### For Laravel Backend:
1. Update `.env` file with database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=minsu_lms_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```

2. Create Laravel models for each table:
   - `Role.php`
   - `User.php`
   - `Course.php`
   - `Module.php`
   - `Assignment.php`
   - `Submission.php`
   - `Forum.php`
   - `Post.php`
   - `Announcement.php`
   - `Notification.php`
   - `ChatbotLog.php`

3. Define relationships in Eloquent models

4. Create API controllers and routes

### For React Frontend:
1. Update API endpoints to match Laravel routes
2. Create services to interact with backend
3. Implement authentication using Laravel Sanctum
4. Build CRUD operations for all entities

---

## 🔍 Verification Commands

To verify the database setup, use these MySQL commands:

```sql
-- Show all tables
USE minsu_lms_db;
SHOW TABLES;

-- Check roles
SELECT * FROM roles;

-- Check users
SELECT id, role_id, name, email FROM users;

-- Check courses
SELECT * FROM courses;

-- View course enrollments
SELECT * FROM view_course_enrollments;

-- Get student dashboard (for student_id = 3)
CALL sp_get_student_dashboard(3);

-- Get faculty dashboard (for faculty_id = 2)
CALL sp_get_faculty_dashboard(2);
```

---

## 📊 Database Size Information

Current database size can be checked with:
```sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'minsu_lms_db'
GROUP BY table_schema;
```

---

## ✅ Status: READY FOR DEVELOPMENT

The database is now fully set up and ready for integration with your Laravel backend and React frontend!

**Created by:** Database Setup Script  
**Schema File:** `minsu_lms_schema.sql`  
**Documentation:** `MINSU-ELEARN-ERD.md`
