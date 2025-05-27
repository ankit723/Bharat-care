'use client'
import React, { useEffect } from 'react'
import { useAuth, VerificationStatus } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const DashboardPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || isLoading) return;
    
    // If user is not verified, let the middleware handle the redirect
    if (user.verificationStatus !== 'VERIFIED' && user.role !== 'ADMIN') {
      return router.push('/auth/verification-status');
    }
    
    // Only redirect to role-specific dashboard if user is verified
    switch (user.role) {
    case 'DOCTOR':
        router.push('/dashboard/doctor');
        break;
    case 'HOSPITAL':
        router.push('/dashboard/hospital');
        break;
    case 'MEDSTORE':
        router.push('/dashboard/medstore');
        break;
    case 'CLINIC':
        router.push('/dashboard/clinic');
        break;
    case 'PATIENT':
        router.push('/dashboard/patient');
        break;
    case 'CHECKUP_CENTER':
        router.push('/dashboard/checkup-center');
        break;
    case 'ADMIN':
        router.push('/admin');
        break;
    }
  }, [user, router, isLoading]);

  // Show loading state while redirecting
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
};

export default DashboardPage;