import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await authAPI.login(credentials);
      if (response.success) {
        // Store token first
        localStorage.setItem('token', response.token);
        // Refresh full user from API to ensure fields (student_id etc.) are present
        try {
          const fresh = await authAPI.getUser();
          if (fresh && fresh.success && fresh.user) {
            localStorage.setItem('user', JSON.stringify(fresh.user));
            setUser(fresh.user);
            return { success: true, user: fresh.user };
          }
        } catch (err) {
          // Fallback to response.user
          localStorage.setItem('user', JSON.stringify(response.user));
          setUser(response.user);
          return { success: true, user: response.user };
        }
      } else {
        console.error('Login failed:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Full error object:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        }
      });
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      // Prepare data for API - Laravel expects password_confirmation
      const registrationData = {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.confirmPassword || data.password, // Add password_confirmation field
        role: data.role || 'student',
        // Include student_id when provided (frontend sends optional student ID on registration)
        student_id: data.student_id || data.studentId || undefined,
      };

      const response = await authAPI.register(registrationData);
      
      if (response.success) {
        // Save token then fetch fresh user to ensure we have latest fields
        localStorage.setItem('token', response.token);
        try {
          const fresh = await authAPI.getUser();
          if (fresh && fresh.success && fresh.user) {
            localStorage.setItem('user', JSON.stringify(fresh.user));
            setUser(fresh.user);
          } else {
            localStorage.setItem('user', JSON.stringify(response.user));
            setUser(response.user);
          }
        } catch (err) {
          localStorage.setItem('user', JSON.stringify(response.user));
          setUser(response.user);
        }
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0][0];
        return { success: false, error: firstError };
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
