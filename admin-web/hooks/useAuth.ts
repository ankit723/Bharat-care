'use client'
import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  verificationStatus: VerificationStatus;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token');
      
      if (!token) {
        setAuthState({
          user: null,
          isLoading: false,
          error: null,
        });
        return;
      }
      
      try {
        const response = await authApi.getCurrentUser();
        setAuthState({
          user: response.data,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setAuthState({
          user: null,
          isLoading: false,
          error: 'Session expired or invalid',
        });
        Cookies.remove('token');
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log(email, password);
      const response = await authApi.login(email, password);
      const { token, user } = response.data;
      
      // Store token in cookies
      Cookies.set('token', token, { expires: 7 }); // Expires in 7 days
      
      setAuthState({
        user,
        isLoading: false,
        error: null,
      });
      
      return {isAuthSuccess: true, user};
    } catch (error: any) {
      setAuthState({
        user: null,
        isLoading: false,
        error: error.response?.data?.message || 'Login failed',
      });
      
      return {isAuthSuccess: false, user: null};
    }
  };

  // Logout function
  const logout = () => {
    Cookies.remove('token');
    setAuthState({
      user: null,
      isLoading: false,
      error: null,
    });
    router.push('/auth/login');
  };

  // Sign up function
  const signUp = async (userData: any) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authApi.register(userData);
      const { token, user } = response.data;
      
      // Store token in cookies
      Cookies.set('token', token, { expires: 7 }); // Expires in 7 days
      
      setAuthState({  
        user,
        isLoading: false,
        error: null,
      });
      
      return {isAuthSuccess: true, user};  
    } catch (error: any) {
      setAuthState({
        user: null,
        isLoading: false,
        error: error.response?.data?.message || 'Sign up failed',
      }); 
      return {isAuthSuccess: false, user: null};
    }
  };

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    logout,
    signUp,
    isAuthenticated: !!authState.user,
  };
};

export default useAuth; 