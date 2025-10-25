# Quick Reference - Database Commands

## 🚀 Quick Start

### Run Everything (Fresh Start)
```bash
cd backend-laravel
php artisan migrate:fresh --seed
```

---

## 📋 Common Commands

### Migrations
```bash
# Run all pending migrations
php artisan migrate

# Rollback last batch
php artisan migrate:rollback

# Reset and re-run all migrations
php artisan migrate:fresh

# Check migration status
php artisan migrate:status

# Create new migration
php artisan make:migration create_table_name
```

### Seeders
```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=UserSeeder
php artisan db:seed --class=CourseSeeder

# Fresh migration with seed
php artisan migrate:fresh --seed

# Create new seeder
php artisan make:seeder TableNameSeeder
```

### Database
```bash
# Drop all tables
php artisan db:wipe

# Show database info
php artisan db:show

# Open Tinker (REPL)
php artisan tinker
```

---

## 🔍 Quick Database Queries (Tinker)

### Count Records
```php
DB::table('users')->count();
DB::table('courses')->count();
DB::table('enrollments')->count();
```

### Get All Records
```php
DB::table('roles')->get();
DB::table('users')->get();
DB::table('courses')->get();
```

### Specific Queries
```php
// Get user by email
DB::table('users')->where('email', 'admin@minsu.edu.ph')->first();

// Get active courses
DB::table('courses')->where('status', 'active')->get();

// Get student enrollments
DB::table('enrollments')
    ->join('users', 'enrollments.student_id', '=', 'users.id')
    ->join('courses', 'enrollments.course_id', '=', 'courses.id')
    ->select('users.name', 'courses.course_name')
    ->get();
```

---

## 👤 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@minsu.edu.ph | admin123 |
| Faculty | john.smith@minsu.edu.ph | admin123 |
| Student 1 | juan.delacruz@minsu.edu.ph | admin123 |
| Student 2 | maria.santos@minsu.edu.ph | admin123 |

---

## 📊 Current Database State

- **Roles:** 3 (admin, faculty, student)
- **Users:** 4 (1 admin, 1 faculty, 2 students)
- **Courses:** 3 (CS101, MATH101, ENG101)
- **Enrollments:** 4
- **Modules:** 5
- **Assignments:** 3
- **Announcements:** 3

---

## 🔧 Troubleshooting

### Clear All Caches
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Fix Migration Issues
```bash
# If migrations fail, try:
php artisan db:wipe
php artisan migrate
php artisan db:seed
```

### Check Database Connection
```bash
php artisan tinker --execute="echo DB::connection()->getDatabaseName();"
```

---

## 📁 File Locations

- **Migrations:** `backend-laravel/database/migrations/`
- **Seeders:** `backend-laravel/database/seeders/`
- **Models:** `backend-laravel/app/Models/`
- **Controllers:** `backend-laravel/app/Http/Controllers/`

---

*Quick Reference - MINSU E-LEARN Platform*
