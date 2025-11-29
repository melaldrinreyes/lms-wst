import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

/**
 * LMS Route Guards
 * 
 * This application implements route protection to ensure users can only access
 * appropriate pages based on their authentication status and role.
 * 
 * === ROUTE PROTECTION ===
 * 
 * ProtectedRoute: Requires authentication and optional role checking
 * - Checks if user is logged in
 * - Validates token exists
 * - Ensures user has required role (if specified)
 * - Redirects unauthorized users appropriately
 * 
 * PublicRoute: For login/register pages
 * - Redirects authenticated users to their dashboard
 * - Allows non-authenticated users to access login pages
 * 
 * === USER ROLES ===
 * - admin: Full system access
 * - faculty: Teaching and course management
 * - student: Learning and course access
 */

// Loading Component for Route Guards
function RouteLoading() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Verifying access...</p>
      </div>
    </div>
  );
}

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicCourses from './pages/Courses';
import CourseInvite from './pages/CourseInvite';
import StudentDashboard from './pages/student/Dashboard';
import StudentCourses from './pages/student/Courses';
import StudentCourseDetail from './pages/student/CourseDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminStudents from './pages/admin/Students';
import AdminInstructors from './pages/admin/Instructors';
import AdminCourses from './pages/admin/Courses';
import CourseManage from './pages/admin/CourseManage';
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
  console.log('[ProtectedRoute] Rendered. user:', user, 'requiredRole:', requiredRole, 'token:', localStorage.getItem('token'));

  // Check if user is authenticated
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if token exists
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('ProtectedRoute: No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
    console.log(`ProtectedRoute: User role '${user.role}' does not match required role '${requiredRole}', redirecting to appropriate dashboard`);
    // Redirect to user's appropriate dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
}// Public Route Component (redirect if already logged in)
function PublicRoute({ children }) {
  const { user } = useAuth();

  // If user is logged in, redirect to their dashboard
  if (user) {
    console.log(`PublicRoute: User already authenticated as '${user.role}', redirecting to dashboard`);
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
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/admin-login" 
            element={
              <PublicRoute>
                <AdminLogin />
              </PublicRoute>
            } 
          />
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
            {/* Assignments page removed */}
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
            <Route path="students" element={<AdminStudents />} />
            <Route path="instructors" element={<AdminInstructors />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/:id" element={<CourseManage />} />
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
