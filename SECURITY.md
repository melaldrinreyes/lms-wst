# LMS Security Documentation

## Overview
This Learning Management System implements a comprehensive multi-layered security architecture to protect against unauthorized access and ensure proper role-based access control.

## Security Layers

### 1. Frontend Route Guards

#### Protected Route Component
- **Location**: `frontend-react/src/App.jsx`
- **Purpose**: Prevents unauthorized access to authenticated routes
- **Features**:
  - User authentication verification
  - Token existence validation
  - JWT token format validation
  - Role-based authorization
  - Automatic redirect for unauthorized users
  - Logging of unauthorized access attempts

#### Public Route Component
- **Location**: `frontend-react/src/App.jsx`
- **Purpose**: Prevents authenticated users from accessing public auth pages
- **Features**:
  - Redirects logged-in users to their dashboard
  - Protects login/register pages from authenticated access

### 2. Authentication Context Security

#### AuthContext Guards
- **Location**: `frontend-react/src/contexts/AuthContext.jsx`
- **Features**:
  - User data structure validation on initialization
  - Synchronized user and token validation
  - Periodic token verification (every 5 minutes)
  - Automatic logout on token expiration
  - Stale data cleanup
  - Error handling and recovery

### 3. Backend API Security

#### Authentication Middleware
- **Middleware**: `auth:sanctum`
- **Location**: Applied to all protected routes in `routes/api.php`
- **Features**:
  - Bearer token validation
  - Laravel Sanctum integration
  - 401 Unauthorized responses for invalid tokens
  - Session management

#### Role-Based Access Control (RBAC)
- **Middleware**: `check.role`
- **Location**: `app/Http/Middleware/CheckRole.php`
- **Features**:
  - Single or multiple role authorization
  - Flexible role checking (supports comma-separated roles)
  - Detailed logging of unauthorized attempts
  - 403 Forbidden responses for role mismatches
  - IP address tracking
  - Route context logging

#### Dashboard Access Control
- **Middleware**: `check.dashboard`
- **Location**: `app/Http/Middleware/CheckDashboardAccess.php`
- **Features**:
  - Prevents cross-role dashboard access
  - Role-to-route mapping validation
  - Comprehensive audit logging
  - Suspicious activity detection

### 4. API Interceptor
- **Location**: `frontend-react/src/services/api.js`
- **Features**:
  - Automatic Bearer token injection
  - Global 401 error handling
  - Automatic session cleanup on expiration
  - API error logging with context

## Role Hierarchy

### Role IDs
- **1** - Admin (Super Admin)
- **2** - Faculty (Instructor)
- **3** - Student

### Permission Matrix

| Feature | Admin | Faculty | Student |
|---------|-------|---------|---------|
| View Courses | ✅ | ✅ | ✅ |
| Create Courses | ✅ | ✅ | ❌ |
| Edit Courses | ✅ | ✅ | ❌ |
| Delete Courses | ✅ | ✅ | ❌ |
| Enroll in Courses | ❌ | ❌ | ✅ |
| Manage Modules | ✅ | ✅ | ❌ |
| Create Assignments | ✅ | ✅ | ❌ |
| Grade Submissions | ✅ | ✅ | ❌ |
| View Submissions | ✅ | ✅ | ✅ |
| Manage Students | ✅ | ✅ | ❌ |
| Register Students | ✅ | ✅ | ❌ |
| Manage Instructors | ✅ | ❌ | ❌ |
| System Analytics | ✅ | ❌ | ❌ |
| Enrollment Requests | ✅ | ✅ | ❌ |

## Route Protection

### Public Routes (No Authentication Required)
```
GET  /                    - Home page
GET  /about              - About page
GET  /courses            - Public course listing
GET  /invite/:id         - Course invitation
POST /api/register       - User registration
POST /api/login          - User login
GET  /api/test          - API health check
```

### Student Routes (role_id: 3)
```
GET  /student                      - Student dashboard
GET  /student/courses              - Enrolled courses
GET  /student/courses/:id          - Course details
GET  /student/assignments          - Student assignments
GET  /api/student/classes          - My enrolled classes
GET  /api/student/assignments      - My assignments
POST /api/courses/:id/enroll       - Enroll in course
```

### Faculty Routes (role_id: 2)
```
GET    /faculty                              - Faculty dashboard
GET    /faculty/courses                      - Faculty courses
POST   /faculty/courses/create               - Create course
GET    /faculty/courses/:id                  - Manage course
GET    /faculty/students                     - Student list
POST   /faculty/students/new                 - Register student
GET    /faculty/submissions                  - View submissions
GET    /faculty/join-requests                - Enrollment requests
POST   /api/courses                          - Create course
PUT    /api/courses/:id                      - Update course
DELETE /api/courses/:id                      - Delete course
POST   /api/modules                          - Create module
PUT    /api/modules/:id                      - Update module
DELETE /api/modules/:id                      - Delete module
POST   /api/assignments                      - Create assignment
PUT    /api/assignments/:id                  - Update assignment
DELETE /api/assignments/:id                  - Delete assignment
POST   /api/submissions/:id/grade            - Grade submission
POST   /api/faculty/students                 - Register student
GET    /api/faculty/enrollment-requests      - Get requests
POST   /api/faculty/enrollment-requests/:id/approve
POST   /api/faculty/enrollment-requests/:id/reject
```

### Admin Routes (role_id: 1)
```
GET    /admin                              - Admin dashboard
GET    /admin/users                        - User management
GET    /admin/courses                      - Course management
GET    /admin/courses/:id                  - Course details
GET    /admin/instructors                  - Instructor list
POST   /admin/instructors/new              - Create instructor
PUT    /admin/instructors/:id/edit         - Edit instructor
GET    /api/admin/dashboard                - Dashboard stats
GET    /api/admin/instructors              - Get instructors
GET    /api/admin/instructors/:id          - Get instructor
POST   /api/admin/instructors              - Create instructor
PUT    /api/admin/instructors/:id          - Update instructor
DELETE /api/admin/instructors/:id          - Delete instructor
GET    /api/admin/instructors/:id/activities - Instructor activities
GET    /api/admin/instructors-comparison   - Comparison data
```

### Shared Authenticated Routes
```
GET  /profile              - User profile
GET  /chatbot              - AI Assistant
POST /api/logout           - Logout
GET  /api/user             - Get user data
PUT  /api/user/profile     - Update profile
PUT  /api/user/password    - Change password
```

## Security Best Practices Implemented

### 1. Authentication
- ✅ Token-based authentication (Laravel Sanctum)
- ✅ Secure password hashing (bcrypt)
- ✅ Token expiration and refresh
- ✅ Automatic session cleanup
- ✅ HTTPS enforcement (production)

### 2. Authorization
- ✅ Role-based access control
- ✅ Route-level permissions
- ✅ Middleware-based guards
- ✅ Frontend and backend validation
- ✅ Principle of least privilege

### 3. Data Protection
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Eloquent ORM)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Mass assignment protection

### 4. Logging & Monitoring
- ✅ Unauthorized access attempt logging
- ✅ IP address tracking
- ✅ Route context logging
- ✅ Error logging with context
- ✅ Security event monitoring

### 5. Session Management
- ✅ Token-based sessions
- ✅ Automatic expiration
- ✅ Secure token storage
- ✅ Session validation
- ✅ Concurrent session handling

## Security Configuration

### Backend Configuration
```php
// config/sanctum.php
'expiration' => 60,  // Token expiration in minutes
'stateful' => [],    // Stateful domains
'guard' => ['web'],  // Default guard

// config/cors.php
'allowed_origins' => [env('FRONTEND_URL')],
'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
'supports_credentials' => false,
```

### Frontend Configuration
```javascript
// services/api.js
const API_URL = 'http://127.0.0.1:8000/api';

// Automatic token injection
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}
```

## Common Security Scenarios

### Scenario 1: Unauthorized Access Attempt
**User tries to access admin route without admin role**
```
1. Frontend ProtectedRoute checks user role
2. Logs warning: "Unauthorized access attempt"
3. Redirects to user's appropriate dashboard
4. If API call is made, backend check.role middleware blocks
5. Returns 403 Forbidden
6. Logs attempt with user details and IP
```

### Scenario 2: Token Expiration
**User's session expires during activity**
```
1. API request fails with 401 Unauthorized
2. API interceptor catches error
3. Clears localStorage (user, token)
4. Redirects to home page
5. User must login again
```

### Scenario 3: Cross-Role Access
**Faculty tries to access student dashboard**
```
1. Frontend ProtectedRoute validates role
2. Detects role mismatch
3. Redirects to /faculty dashboard
4. Logs attempt
```

### Scenario 4: Invalid Token
**User modifies token in localStorage**
```
1. API request with invalid token
2. auth:sanctum middleware validates
3. Returns 401 Unauthorized
4. Frontend clears auth data
5. Redirects to login
```

## Testing Security

### Manual Testing Checklist
- [ ] Try accessing /admin as student
- [ ] Try accessing /faculty as student
- [ ] Try accessing /student as faculty
- [ ] Modify token in localStorage and make request
- [ ] Delete token and try to access protected route
- [ ] Try to access registration page while logged in
- [ ] Let token expire and verify auto-logout
- [ ] Try to access API endpoints without token

### Automated Testing
```bash
# Run backend tests
cd backend-laravel
php artisan test --filter AuthenticationTest
php artisan test --filter AuthorizationTest

# Run frontend tests
cd frontend-react
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=guards
```

## Security Incident Response

### If Unauthorized Access Detected
1. Check logs: `storage/logs/laravel.log`
2. Identify user ID and IP address
3. Review access patterns
4. Block IP if necessary
5. Reset user password if compromised
6. Audit related activities

### Log Locations
- **Backend Logs**: `backend-laravel/storage/logs/laravel.log`
- **Frontend Console**: Browser DevTools Console
- **API Logs**: Network tab in DevTools

## Future Security Enhancements

### Planned Features
- [ ] Two-factor authentication (2FA)
- [ ] Rate limiting on API endpoints
- [ ] IP whitelisting/blacklisting
- [ ] Session timeout warnings
- [ ] Security audit trail dashboard
- [ ] Automated security scanning
- [ ] Penetration testing
- [ ] CAPTCHA on login/registration

## Contact

For security vulnerabilities or concerns, please contact:
- **Security Team**: security@lms-wst.com
- **Developer**: melaldrinreyes@github.com

## Last Updated
October 27, 2025
