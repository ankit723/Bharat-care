'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, LogOut, ArrowRight } from 'lucide-react';

const VerificationStatusPage = () => {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    }
  }, [user, router, isLoading]);

  // Show loading state while checking auth
  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusContent = () => {
    switch (user.verificationStatus) {
      case 'PENDING':
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: 'Verification Pending',
          description: 'Your account is currently under review.',
          message: 'Our team is reviewing your details. This process usually takes 24-48 hours. We\'ll notify you once the verification is complete.',
          color: 'border-yellow-200 bg-yellow-50',
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="h-12 w-12 text-destructive" />,
          title: 'Verification Rejected',
          description: 'Your account verification was not approved.',
          message: 'Unfortunately, your account verification was rejected. This might be due to incomplete or incorrect information. Please contact support for more details.',
          color: 'border-destructive/20 bg-destructive/10',
        };
      default:
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
          title: 'Verification Complete',
          description: 'Your account has been verified.',
          message: 'You can now access all features of your account.',
          color: 'border-green-200 bg-green-50',
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className={`w-full max-w-lg ${content.color}`}>
        <CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
          {content.icon}
          <CardTitle className="text-2xl mt-4">{content.title}</CardTitle>
          <CardDescription className="text-base">
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            {content.message}
          </div>

          <div className="space-y-2">
            <div className="text-sm space-y-1">
              <div><strong>Name:</strong> {user.name}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> {user.role.charAt(0) + user.role.slice(1).toLowerCase()}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            {user.verificationStatus === 'REJECTED' && (
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => router.push('/auth/contact-support')}
              >
                Contact Support
              </Button>
            )}
            {(user.verificationStatus === 'PENDING' || user.verificationStatus === 'REJECTED') ? (
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationStatusPage;