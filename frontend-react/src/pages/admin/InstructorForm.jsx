import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InstructorForm() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin/instructors', { state: { openAddModal: true } });
  }, [navigate]);
  return null;
}
