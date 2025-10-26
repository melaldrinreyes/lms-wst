import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

/**
 * ROUTE GUARD SYSTEM
 * 
 * This application implements a comprehensive route guard system to prevent unauthorized access:
 * 
 * 1. ProtectedRoute: Wraps routes that require authentication
 *    - Checks if user is logged in (user object exists)
 *    - Checks if valid token exists in localStorage
 *    - Validates user role matches required role
 *    - Redirects unauthorized users to home page
 *    - Redirects users to their appropriate dashboard if accessing wrong role route
 * 
 * 2. PublicRoute: Wraps routes that should only be accessible to non-authenticated users
 *    - Redirects already logged-in users to their dashboard
 *    - Used for login, register pages
 * 
 * 3. API Interceptor: (in services/api.js)
 *    - Automatically adds Bearer token to all API requests
 *    - Handles 401 Unauthorized responses
 *    - Clears auth data and redirects to home on session expiry
 * 
 * Protected Routes:
 *    - /student/* - Student role only
 *    - /faculty/* - Faculty role only
 *    - /admin/* - Admin role only
 *    - /profile - Any authenticated user
 *    - /chatbot - Any authenticated user
 * 
 * Public Routes:
 *    - / - Home (accessible to all)
 *    - /register - Registration (redirects if logged in)
 *    - /courses - Public course listing
 *    - /invite/:id - Course invitation (accessible to all)
 *    - /about - About page
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
    return <Navigate to="/" replace />;
  }

  // Check if token exists
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
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
    return <Navigate to={`/${user.role}`} replace />;
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
