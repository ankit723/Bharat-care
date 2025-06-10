'use client';

import React from 'react';
import RewardSettingsComponent from '@/components/RewardSettingsComponent';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

const AdminRewardSettingsPage = () => {
  const { user } = useAuth();
  
  // Ensure only admins can access this page
  if (user && user.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  return <RewardSettingsComponent />;
};

export default AdminRewardSettingsPage; 