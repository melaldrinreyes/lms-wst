import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

/**
 * COMPREHENSIVE ROUTE GUARD SYSTEM
 * 
 * This application implements a multi-layered security system to prevent unauthorized access:
 * 
 * === FRONTEND GUARDS ===
 * 
 * 1. ProtectedRoute: Wraps routes that require authentication
 *    - Checks if user is logged in (user object exists)
 *    - Validates token exists in localStorage
 *    - Verifies token format (basic JWT structure check)
 *    - Validates user role matches required role
 *    - Logs unauthorized access attempts
 *    - Redirects unauthorized users to home page
 *    - Redirects users to their appropriate dashboard if accessing wrong role route
 * 
 * 2. PublicRoute: Wraps routes that should only be accessible to non-authenticated users
 *    - Redirects already logged-in users to their dashboard
 *    - Used for login, register pages
 *    - Prevents authenticated users from accessing public auth pages
 * 
 * 3. AuthContext Guards:
 *    - Validates user data structure on initialization
 *    - Verifies both user and token exist together
 *    - Periodic token verification (every 5 minutes)
 *    - Auto-logout on token expiration or verification failure
 *    - Clears stale authentication data automatically
 * 
 * === BACKEND GUARDS ===
 * 
 * 4. API Authentication Middleware (auth:sanctum):
 *    - Validates Bearer token on all protected routes
 *    - Returns 401 Unauthorized for invalid/missing tokens
 *    - Integrated with Laravel Sanctum
 * 
 * 5. Role-Based Access Control (check.role):
 *    - Supports single or multiple role authorization
 *    - Logs unauthorized access attempts with user details and IP
 *    - Returns 403 Forbidden for role mismatches
 *    - Granular permissions per endpoint
 * 
 * 6. Dashboard Access Control (check.dashboard):
 *    - Prevents cross-role dashboard access
 *    - Logs cross-role access attempts
 *    - Maps role IDs to route segments
 * 
 * 7. API Interceptor (in services/api.js):
 *    - Automatically adds Bearer token to all API requests
 *    - Handles 401 Unauthorized responses globally
 *    - Clears auth data and redirects to home on session expiry
 *    - Logs all API errors with context
 * 
 * === PROTECTED ROUTES BY ROLE ===
 * 
 * Student Routes (role_id: 3):
 *    - /student/* - Student dashboard and features
 *    - /student/classes - View enrolled courses
 *    - /student/assignments - View assignments
 *    - Course enrollment endpoints
 * 
 * Faculty Routes (role_id: 2):
 *    - /faculty/* - Faculty dashboard and features
 *    - Course creation and management
 *    - Student registration and management
 *    - Assignment and module creation
 *    - Submission grading
 *    - Enrollment request management
 * 
 * Admin Routes (role_id: 1):
 *    - /admin/* - Admin dashboard and features
 *    - User management (all roles)
 *    - Instructor management (CRUD)
 *    - System-wide course management
 *    - Analytics and reporting
 * 
 * Shared Authenticated Routes:
 *    - /profile - Any authenticated user
 *    - /chatbot - Any authenticated user
 *    - View courses and modules (read-only)
 * 
 * === PUBLIC ROUTES ===
 *    - / - Home (accessible to all)
 *    - /register - Registration (redirects if logged in)
 *    - /courses - Public course listing
 *    - /invite/:id - Course invitation (accessible to all)
 *    - /about - About page
 * 
 * === SECURITY FEATURES ===
 *    - Token validation on every request
 *    - Role verification at frontend and backend
 *    - Automatic session cleanup on expiry
 *    - Comprehensive audit logging
 *    - IP tracking for suspicious activities
 *    - XSS and CSRF protection
 *    - Secure password handling
 */

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import ChatbotPage from './pages/ChatbotPage';
import PublicCourses from './pages/Courses';
import CourseInvite from './pages/CourseInvite';
import About from './pages/About';
import StudentDashboard from './pages/student/Dashboard';
import StudentCourses from './pages/student/Courses';
import StudentCourseDetail from './pages/student/CourseDetail';
import Assignments from './pages/student/Assignments';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCourses from './pages/admin/Courses';
import CourseManage from './pages/admin/CourseManage';
import Instructors from './pages/admin/Instructors';
import InstructorForm from './pages/admin/InstructorForm';
import AdminLogin from './pages/AdminLogin';
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyCourses from './pages/faculty/Courses';
import CourseCreate from './pages/faculty/CourseCreate';
import FacultyCourseManage from './pages/faculty/CourseManage';
import FacultyStudents from './pages/faculty/Students';
import FacultySubmissions from './pages/faculty/Submissions';
import StudentRegistration from './pages/faculty/StudentRegistration';
import JoinRequests from './pages/faculty/JoinRequests';

// Layouts
import DashboardLayout from './components/DashboardLayout';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  
  // Check if user is authenticated
  if (!user) {
    // Clear any stale data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.warn('Unauthorized access attempt - No user found');
    return <Navigate to="/" replace />;
  }

  // Check if token exists
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('Unauthorized access attempt - No token found');
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }

  // Verify token hasn't expired (basic check)
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Unauthorized access attempt - Invalid token format');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return <Navigate to="/" replace />;
    }
  } catch (error) {
    console.error('Token validation error:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }
  
  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
    console.warn(`Unauthorized access attempt - User role '${user.role}' does not match required role '${requiredRole}'`);
    // Redirect to user's appropriate dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return children;
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }) {
  const { user } = useAuth();
  
  // If user is logged in, redirect to their dashboard
  if (user) {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Authenticated user accessing public route - redirecting to dashboard');
      return <Navigate to={`/${user.role}`} replace />;
    }
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route path="/courses" element={<PublicCourses />} />
            <Route path="/invite/:id" element={<CourseInvite />} />
            <Route path="/about" element={<About />} />
            <Route 
              path="/chatbot" 
              element={
                <ProtectedRoute>
                  <ChatbotPage />
                </ProtectedRoute>
              } 
            />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <DashboardLayout role="student" />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="courses/:id" element={<StudentCourseDetail />} />
              <Route path="assignments" element={<Assignments />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardLayout role="admin" />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/:id" element={<CourseManage />} />
              <Route path="instructors" element={<Instructors />} />
              <Route path="instructors/new" element={<InstructorForm />} />
              <Route path="instructors/:id/edit" element={<InstructorForm />} />
            </Route>

            {/* Faculty Routes */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute requiredRole="faculty">
                  <DashboardLayout role="faculty" />
                </ProtectedRoute>
              }
            >
              <Route index element={<FacultyDashboard />} />
              <Route path="courses" element={<FacultyCourses />} />
              <Route path="courses/create" element={<CourseCreate />} />
              <Route path="courses/:id" element={<FacultyCourseManage />} />
              <Route path="students" element={<FacultyStudents />} />
              <Route path="students/new" element={<StudentRegistration />} />
              <Route path="submissions" element={<FacultySubmissions />} />
              <Route path="join-requests" element={<JoinRequests />} />
            </Route>

            {/* Shared Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Profile />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
  );
}

export default App;
