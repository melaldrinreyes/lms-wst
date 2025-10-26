import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // Validate that both user and token exist
    if (!saved || !token) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
    
    try {
      const parsedUser = JSON.parse(saved);
      // Validate user has required fields
      if (!parsedUser.id || !parsedUser.email || !parsedUser.role) {
        console.warn('Invalid user data in localStorage');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
      return parsedUser;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Verify authentication on mount and periodically
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && user) {
        try {
          // Verify the token is still valid
          const response = await authAPI.getUser();
          if (!response.success) {
            console.warn('Token verification failed - logging out');
            logout();
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          if (error.response?.status === 401) {
            logout();
          }
        }
      }
    };

    verifyAuth();
    
    // Verify auth every 5 minutes
    const interval = setInterval(verifyAuth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      console.log('Logging in with credentials:', { email: credentials.email });
      const response = await authAPI.login(credentials);
      console.log('Login response:', response);
      
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        setUser(response.user);
        return { success: true, user: response.user };
      } else {
        console.error('Login failed:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
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
      };

      const response = await authAPI.register(registrationData);
      
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        setUser(response.user);
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

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

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
