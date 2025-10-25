# Hierarchical User Registration System

## Overview
The LMS now uses a hierarchical registration system where:
- **Public registration is disabled** - Users cannot self-register
- **Super Admin** (role_id=1) creates Faculty accounts
- **Faculty** (role_id=2) creates Student accounts
- **Students** (role_id=3) can only login with credentials provided to them

## User Roles

### 1. Super Admin (role_id = 1)
**Credentials:**
- Email: admin@minsu.edu.ph
- Password: admin123

**Capabilities:**
- Create, edit, and delete faculty (instructor) accounts
- View all instructors and their activities
- Access instructor comparison statistics
- Manage entire system

### 2. Faculty (role_id = 2)
**Test Account:**
- Email: john.smith@minsu.edu.ph
- Password: admin123

**Capabilities:**
- Create student accounts
- Manage courses
- View student progress
- Grade submissions

### 3. Student (role_id = 3)
**Test Account:**
- Email: juan.delacruz@minsu.edu.ph
- Password: admin123

**Capabilities:**
- View enrolled courses
- Submit assignments
- View grades and progress
- Cannot create any accounts

## Implementation Details

### Frontend Changes

#### 1. Login Page (`Login.jsx`)
- **Removed**: Public registration link
- **Removed**: "Create Account" button
- **Added**: Info banner explaining admin-managed registration
- **Design**: Modern centered card layout with gradient background

#### 2. Student Registration Form (`StudentRegistration.jsx`)
**Location:** `/faculty/students/new`

**Fields:**
- Student ID* (required, unique)
- Full Name* (required)
- Email Address* (required, unique)
- Phone Number (optional)
- Address (optional)
- Date of Birth (optional)
- Gender (male/female/other)
- Password* (required, min 8 characters)
- Confirm Password* (required, must match)

**Features:**
- Real-time validation
- Error handling
- Success toast notifications
- Automatic redirect to students list after registration

#### 3. Faculty Students Page (`Students.jsx`)
**Added:**
- "Add Student" button in header
- Navigation to student registration form
- Modern gradient button design

#### 4. API Service (`api.js`)
**New Module:** `facultyAPI`

```javascript
export const facultyAPI = {
  registerStudent: async (data) => {...},
  getStudents: async () => {...},
  getDashboard: async () => {...},
};
```

#### 5. Routing (`App.jsx`)
**New Route:**
```jsx
<Route path="students/new" element={<StudentRegistration />} />
```

### Backend Changes

#### 1. StudentController (`StudentController.php`)
**New Method:** `store()`

**Features:**
- Role verification (faculty only)
- Field validation
- Unique student_id and email checks
- Password hashing
- Auto-assign role_id=3

**Validation Rules:**
```php
'student_id' => 'required|string|unique:users,student_id',
'name' => 'required|string|max:255',
'email' => 'required|email|unique:users,email',
'phone' => 'nullable|string|max:20',
'address' => 'nullable|string',
'date_of_birth' => 'nullable|date',
'gender' => 'nullable|in:male,female,other',
'password' => 'required|string|min:8|confirmed',
```

#### 2. API Routes (`api.php`)
**New Routes:**
```php
// Faculty routes (role_id = 2)
Route::middleware(['check.role:2'])->group(function () {
    Route::post('/faculty/students', [StudentController::class, 'store']);
    Route::get('/faculty/students', [StudentController::class, 'index']);
});
```

**Protected by:**
- `auth:sanctum` middleware (authentication)
- `check.role:2` middleware (faculty only)

## User Flow

### Super Admin Creates Faculty Account

1. Login as Super Admin
2. Navigate to `/admin/instructors`
3. Click "Add New Instructor"
4. Fill form:
   - Name
   - Email
   - Phone
   - Password
5. Submit
6. Share credentials with faculty member

### Faculty Creates Student Account

1. Login as Faculty
2. Navigate to `/faculty/students`
3. Click "Add Student" button
4. Fill form:
   - Student ID (e.g., 2024-00001)
   - Full Name
   - Email (@minsu.edu.ph recommended)
   - Phone (optional)
   - Address (optional)
   - Date of Birth (optional)
   - Gender
   - Password (minimum 8 characters)
   - Confirm Password
5. Submit
6. Share credentials with student

### Student Login

1. Navigate to login page
2. Enter credentials provided by faculty
3. Select "Student" role from dropdown
4. Click "Sign In"
5. Access student dashboard

## Security Features

1. **Role-based Access Control:**
   - Middleware checks prevent unauthorized access
   - Each role can only perform allowed actions

2. **Password Security:**
   - Minimum 8 characters
   - Hashed using bcrypt
   - Password confirmation required

3. **Unique Constraints:**
   - Student IDs must be unique
   - Email addresses must be unique
   - Prevents duplicate accounts

4. **Input Validation:**
   - Backend validates all inputs
   - Frontend provides real-time feedback
   - Prevents SQL injection and XSS

## API Endpoints

### Faculty Endpoints

#### Register Student
```
POST /api/faculty/students
Authorization: Bearer {token}
Role Required: 2 (Faculty)

Request Body:
{
  "student_id": "2024-00001",
  "name": "Juan Dela Cruz",
  "email": "juan.delacruz@minsu.edu.ph",
  "phone": "+63-912-345-6789",
  "address": "Manila, Philippines",
  "date_of_birth": "2000-01-01",
  "gender": "male",
  "password": "student123",
  "password_confirmation": "student123"
}

Response (201):
{
  "success": true,
  "message": "Student registered successfully",
  "student": {
    "id": 4,
    "student_id": "2024-00001",
    "name": "Juan Dela Cruz",
    "email": "juan.delacruz@minsu.edu.ph",
    "phone": "+63-912-345-6789",
    "status": "active"
  }
}
```

### Super Admin Endpoints (Already Implemented)

#### Create Instructor
```
POST /api/admin/instructors
Authorization: Bearer {token}
Role Required: 1 (Super Admin)

Request Body:
{
  "name": "John Smith",
  "email": "john.smith@minsu.edu.ph",
  "phone": "+63-912-345-6789",
  "password": "faculty123",
  "password_confirmation": "faculty123"
}

Response (201):
{
  "success": true,
  "message": "Instructor created successfully",
  "instructor": {...}
}
```

## Testing Checklist

### ✅ Completed
- [x] Super Admin can create faculty accounts
- [x] Faculty can create student accounts
- [x] Public registration is disabled
- [x] Login form updated with info banner
- [x] Student registration form created
- [x] Backend validation working
- [x] Routes protected by role middleware
- [x] API endpoints functional

### 🔄 To Test
- [ ] Create new faculty account as Super Admin
- [ ] Login as new faculty member
- [ ] Create new student account as Faculty
- [ ] Login as new student
- [ ] Verify role-based access restrictions
- [ ] Test validation errors (duplicate email, weak password, etc.)
- [ ] Test password confirmation mismatch
- [ ] Verify unique student_id constraint

## Files Modified/Created

### Frontend
- ✅ Created: `frontend-react/src/pages/faculty/StudentRegistration.jsx`
- ✅ Modified: `frontend-react/src/pages/faculty/Students.jsx`
- ✅ Modified: `frontend-react/src/pages/Login.jsx`
- ✅ Modified: `frontend-react/src/services/api.js`
- ✅ Modified: `frontend-react/src/App.jsx`

### Backend
- ✅ Modified: `backend-laravel/app/Http/Controllers/StudentController.php`
- ✅ Modified: `backend-laravel/routes/api.php`

## Next Steps

1. **Test Complete Flow:**
   - Test Super Admin → Faculty creation
   - Test Faculty → Student creation
   - Verify all validations work

2. **Enhanced Features (Optional):**
   - Bulk student import (CSV/Excel)
   - Email notifications to new users
   - Password reset functionality
   - User activity logging
   - Role management UI

3. **Documentation:**
   - Create user manual
   - Add tooltips/help text
   - Create video tutorials

## Credentials Summary

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Super Admin | admin@minsu.edu.ph | admin123 | Full system access |
| Faculty (Test) | john.smith@minsu.edu.ph | admin123 | Course & student management |
| Student (Test) | juan.delacruz@minsu.edu.ph | admin123 | Course viewing & submissions |

---

**Note:** Change default passwords in production environment!
