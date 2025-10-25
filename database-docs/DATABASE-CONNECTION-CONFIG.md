# Database Connection Configuration

## ✅ Laravel Backend Successfully Connected to Database!

**Date Connected:** October 25, 2025  
**Database Name:** `minsu_lms_db`  
**Connection Status:** ✅ **ACTIVE**

---

## 📋 Connection Details

### Laravel .env Configuration
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=minsu_lms_db
DB_USERNAME=root
DB_PASSWORD=
```

### Connection Test Results

✅ **Database Name:** `minsu_lms_db`  
✅ **Roles Table:** 3 records  
✅ **Users Table:** 3 records  
✅ **Connection:** Active and verified

---

## 🔍 Database Verification

### Roles Available
```
ID | Role Name
---|----------
1  | admin
2  | faculty
3  | student
```

### Users in Database
```
ID | Name                  | Email
---|----------------------|---------------------------
1  | System Administrator | admin@minsu.edu.ph
2  | Dr. John Smith       | john.smith@minsu.edu.ph
3  | Juan Dela Cruz       | juan.delacruz@minsu.edu.ph
```

---

## 🛠️ Next Steps for Laravel Development

### 1. Create Eloquent Models

Create models for each database table in `app/Models/`:

```bash
php artisan make:model Role
php artisan make:model Course
php artisan make:model Module
php artisan make:model Assignment
php artisan make:model Submission
php artisan make:model Forum
php artisan make:model Post
php artisan make:model Announcement
php artisan make:model Notification
php artisan make:model ChatbotLog
```

**Note:** `User` model already exists in Laravel by default.

### 2. Define Relationships in Models

Example for `User.php`:
```php
public function role()
{
    return $this->belongsTo(Role::class);
}

public function courses()
{
    return $this->hasMany(Course::class, 'faculty_id');
}

public function submissions()
{
    return $this->hasMany(Submission::class, 'student_id');
}
```

### 3. Create API Controllers

```bash
php artisan make:controller API/AuthController
php artisan make:controller API/CourseController
php artisan make:controller API/AssignmentController
php artisan make:controller API/SubmissionController
php artisan make:controller API/ForumController
php artisan make:controller API/AnnouncementController
php artisan make:controller API/NotificationController
php artisan make:controller API/ChatbotController
```

### 4. Set Up Authentication

Install Laravel Sanctum (already included):
```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

Add Sanctum middleware to `api` routes in `app/Http/Kernel.php`:
```php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'throttle:api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

### 5. Create API Routes

In `routes/api.php`:
```php
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Courses
    Route::apiResource('courses', CourseController::class);
    
    // Assignments
    Route::apiResource('assignments', AssignmentController::class);
    
    // Submissions
    Route::apiResource('submissions', SubmissionController::class);
    
    // Forums
    Route::apiResource('forums', ForumController::class);
    Route::apiResource('posts', PostController::class);
    
    // Announcements
    Route::apiResource('announcements', AnnouncementController::class);
    
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    
    // Chatbot
    Route::post('/chatbot', [ChatbotController::class, 'chat']);
});
```

### 6. Configure CORS

In `config/cors.php`, ensure your React frontend URL is allowed:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
'supports_credentials' => true,
```

---

## 🔗 Connecting React Frontend to Laravel Backend

### 1. Install Axios in React
```bash
cd frontend-react
npm install axios
```

### 2. Create API Service

Create `frontend-react/src/services/api.js`:
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
```

### 3. Create Auth Service

Create `frontend-react/src/services/authService.js`:
```javascript
import api from './api';

export const authService = {
    async login(email, password, role) {
        const response = await api.post('/login', { email, password, role });
        if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
    
    async register(userData) {
        const response = await api.post('/register', userData);
        return response.data;
    },
    
    async logout() {
        await api.post('/logout');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },
    
    async getUser() {
        const response = await api.get('/user');
        return response.data;
    },
};
```

### 4. Update AuthContext to Use Real API

Modify `frontend-react/src/contexts/AuthContext.jsx` to use the auth service instead of mock data.

---

## 🧪 Testing Database Connection

### Test with Artisan Tinker
```bash
cd backend-laravel
php artisan tinker
```

Then run:
```php
// Get all roles
DB::table('roles')->get();

// Get all users
DB::table('users')->get();

// Get all courses
DB::table('courses')->get();

// Test authentication
$user = DB::table('users')->where('email', 'admin@minsu.edu.ph')->first();
```

### Test with API Route
Create a test route in `routes/api.php`:
```php
Route::get('/test-db', function () {
    return [
        'database' => DB::connection()->getDatabaseName(),
        'roles_count' => DB::table('roles')->count(),
        'users_count' => DB::table('users')->count(),
        'courses_count' => DB::table('courses')->count(),
    ];
});
```

Then visit: `http://localhost:8000/api/test-db`

---

## 📊 Database Tables Available

All these tables are ready for use:

1. ✅ `roles` - 3 records
2. ✅ `users` - 3 records  
3. ✅ `courses` - 1 record
4. ✅ `modules` - 0 records
5. ✅ `assignments` - 0 records
6. ✅ `submissions` - 0 records
7. ✅ `forums` - 0 records
8. ✅ `posts` - 0 records
9. ✅ `announcements` - 0 records
10. ✅ `notifications` - 0 records
11. ✅ `chatbot_logs` - 0 records

---

## ⚙️ Laravel Configuration Files

### Database Configuration
File: `config/database.php`  
Status: ✅ Using default MySQL configuration

### Authentication Configuration
File: `config/auth.php`  
Status: ✅ Ready for Sanctum integration

### Sanctum Configuration
File: `config/sanctum.php`  
Status: ✅ Configured for API authentication

---

## 🚀 Start Development

### Start Laravel Backend
```bash
cd backend-laravel
php artisan serve
```
Backend will run on: `http://localhost:8000`

### Start React Frontend
```bash
cd frontend-react
npm run dev
```
Frontend will run on: `http://localhost:5173` (or next available port)

---

## 📝 Important Notes

1. **Session Tables:** Laravel may need session and cache tables. Run migrations if needed:
   ```bash
   php artisan migrate
   ```

2. **Password Hashing:** All default users use password: `admin123`  
   Hash: `$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`

3. **CORS:** Remember to configure CORS for frontend-backend communication

4. **Environment:** Always use `.env` for local development, never commit it to Git

---

## ✅ Connection Status Summary

- **Database:** ✅ Connected
- **Tables:** ✅ 11 tables available
- **Views:** ✅ 2 views available
- **Stored Procedures:** ✅ 2 procedures available
- **Sample Data:** ✅ Loaded
- **Laravel:** ✅ Connected and tested
- **Ready for Development:** ✅ YES

---

**Created:** October 25, 2025  
**Status:** READY FOR API DEVELOPMENT 🚀
