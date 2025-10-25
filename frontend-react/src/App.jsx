import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import ChatbotPage from './pages/ChatbotPage';
import PublicCourses from './pages/Courses';
import About from './pages/About';
import StudentDashboard from './pages/student/Dashboard';
import Courses from './pages/student/Courses';
import CourseDetail from './pages/student/CourseDetail';
import Assignments from './pages/student/Assignments';
import Forums from './pages/student/Forums';
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
import ClassList from './pages/faculty/ClassList';
import ClassForm from './pages/faculty/ClassForm';
import ClassStudents from './pages/faculty/ClassStudents';

// Layouts
import DashboardLayout from './components/DashboardLayout';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<PublicCourses />} />
            <Route path="/about" element={<About />} />
            <Route path="/chatbot" element={<ChatbotPage />} />

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
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:courseId" element={<CourseDetail />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="forums" element={<Forums />} />
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
              <Route path="classes" element={<ClassList />} />
              <Route path="classes/new" element={<ClassForm />} />
              <Route path="classes/:id" element={<ClassStudents />} />
              <Route path="classes/:id/edit" element={<ClassForm />} />
              <Route path="students" element={<FacultyStudents />} />
              <Route path="students/new" element={<StudentRegistration />} />
              <Route path="submissions" element={<FacultySubmissions />} />
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
    </ThemeProvider>
  );
}

export default App;
