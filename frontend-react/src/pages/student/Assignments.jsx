import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Assignments page removed — redirect users to Courses
export default function Assignments() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to student courses since Assignments UI is removed
    navigate('/student/courses', { replace: true });
  }, [navigate]);

  return null;
}
