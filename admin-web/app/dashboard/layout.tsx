'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-open sidebar on desktop, auto-close on mobile
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If no user, show loading or redirect would handle this
  if (!user) {
    return <div className="p-4 md:p-8">Loading...</div>;
  }

  // Define navigation links based on user role
  const getNavLinks = () => {
    switch (user.role) {
      case 'DOCTOR':
        return [
          { href: '/dashboard/doctor', label: 'Overview' },
          { href: '/dashboard/doctor/patients', label: 'Patients' },
          { href: '/dashboard/doctor/medicine-scheduler', label: 'Medicine Scheduler' },
          { href: '/dashboard/doctor/referrals', label: 'Referrals' },
          { href: '/dashboard/doctor/reviews', label: 'Reviews' },
          { href: '/dashboard/doctor/documents', label: 'Documents' },
          { href: '/dashboard/doctor/rewards', label: 'Rewards' },
        ];
      case 'HOSPITAL':
        return [
          { href: '/dashboard/hospital', label: 'Overview' },
          { href: '/dashboard/hospital/doctors', label: 'Doctors' },
          { href: '/dashboard/hospital/patients', label: 'Patients' },
          { href: '/dashboard/hospital/referrals', label: 'Referrals' },
          { href: '/dashboard/hospital/reviews', label: 'Reviews' },
          { href: '/dashboard/hospital/rewards', label: 'Rewards' },
        ];
      case 'CLINIC':
        return [
          { href: '/dashboard/clinic', label: 'Overview' },
          { href: '/dashboard/clinic/doctors', label: 'Doctor' },
          { href: '/dashboard/clinic/reviews', label: 'Reviews' },
          { href: '/dashboard/clinic/rewards', label: 'Rewards' },
        ];
      case 'MEDSTORE':
        return [
          { href: '/dashboard/medstore', label: 'Overview' },
          { href: '/dashboard/medstore/available-prescriptions', label: 'Available Prescriptions' },
          { href: '/dashboard/medstore/medicine-scheduler', label: 'Medicine Scheduler' },
          { href: '/dashboard/medstore/referrals', label: 'Referrals' },
          { href: '/dashboard/medstore/reviews', label: 'Reviews' },
          { href: '/dashboard/medstore/rewards', label: 'Rewards' },
        ];
      case 'CHECKUP_CENTER':
        return [
          { href: '/dashboard/checkup-center', label: 'Overview' },
          { href: '/dashboard/checkup-center/patients', label: 'Patients' },
          { href: '/dashboard/checkup-center/documents', label: 'Documents' },
          { href: '/dashboard/checkup-center/referrals', label: 'Referrals' },
          { href: '/dashboard/checkup-center/rewards', label: 'Rewards' },
        ];
      case 'ADMIN':
        return [
          { href: '/dashboard', label: 'Overview' },
          { href: '/dashboard/admin/verifications', label: 'Verifications' },
          { href: '/dashboard/documents', label: 'Documents' },
          { href: '/dashboard/admin/reward-settings', label: 'Reward Settings' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${!isMobile && !sidebarOpen ? 'w-16' : 'w-64'}
        ${isMobile ? 'z-50' : 'z-auto'}
        bg-sidebar text-sidebar-foreground border-r border-sidebar-border 
        transition-all duration-300 flex flex-col h-full
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
          <div className={`text-lg font-semibold transition-opacity duration-300 ${
            !sidebarOpen && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}>
            <Image src="/bharat-care-text-logo.png" alt="BharatCare" width={100} height={50} />
          </div>
          <div className={`text-lg font-semibold ${
            !sidebarOpen && !isMobile ? 'block' : 'hidden'
          }`}>
            <Image src="/bharat-care-logo.png" alt="BharatCare" width={100} height={100} />
          </div>
          
          {/* Desktop toggle button */}
          {!isMobile && (
            <button 
              onClick={toggleSidebar}
              className="text-sidebar-foreground hover:text-sidebar-primary-foreground p-1 rounded"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          )}
          
          {/* Mobile close button */}
          {isMobile && sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className="text-sidebar-foreground hover:text-sidebar-primary-foreground p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* User Info */}
        <div className="p-4 border-b border-sidebar-border">
          <div className={`transition-opacity duration-300 ${
            !sidebarOpen && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-sidebar-foreground/70 capitalize">
              {user.role.replace('_', ' ')}
            </div>
            {user.rewardPoints !== undefined && (
              <div className="text-xs text-primary mt-1 flex items-center">
                <span className="bg-primary/10 rounded-full px-2 py-0.5">
                  {user.rewardPoints} points
                </span>
              </div>
            )}
          </div>
          <div className={`text-center text-xl font-bold ${
            !sidebarOpen && !isMobile ? 'block' : 'hidden'
          }`}>
            {user.name.charAt(0)}
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="p-2 flex-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              onClick={closeSidebarOnMobile}
              className={`
                block rounded-md p-3 my-1 text-sm font-medium transition-colors
                ${pathname === link.href ? 
                  'bg-sidebar-primary text-sidebar-primary-foreground' : 
                  'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }
              `}
            >
              <span className={`transition-opacity duration-300 ${
                !sidebarOpen && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              }`}>
                {link.label}
              </span>
              <span className={`${
                !sidebarOpen && !isMobile ? 'block' : 'hidden'
              }`}>
                {link.label.charAt(0)}
              </span>
            </Link>
          ))}
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-sidebar-border">
          <Button 
            variant="outline" 
            className={`
              border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/50
              ${!sidebarOpen && !isMobile ? 'w-12 h-12 p-0' : 'w-full'}
              transition-all duration-300
            `}
            onClick={logout}
          >
            <span className={`transition-opacity duration-300 ${
              !sidebarOpen && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}>
              Logout
            </span>
            <span className={`${
              !sidebarOpen && !isMobile ? 'block' : 'hidden'
            }`}>
              ↩️
            </span>
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-background border-b p-4 sticky top-0 z-30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              {isMobile && (
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="text-foreground hover:text-primary p-1 rounded"
                >
                  <Menu className="h-6 w-6" />
                </button>
              )}
              <h1 className="text-lg md:text-xl font-semibold capitalize">
                {user.role.replace('_', ' ')} Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user.name}
                {user.rewardPoints !== undefined && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                    {user.rewardPoints} pts
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground sm:hidden">
                {user.name.split(' ')[0]}
                {user.rewardPoints !== undefined && (
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                    {user.rewardPoints}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 