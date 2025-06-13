'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { rewardsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Users, Gift, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [totalReferrals, setTotalReferrals] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch reward points
      const pointsResponse = await rewardsApi.getUserPoints();
      setRewardPoints(pointsResponse.data.rewardPoints);
      
      // Fetch referrals count
      const referralsResponse = await rewardsApi.getUserReferrals('given', 100, 0);
      setTotalReferrals(referralsResponse.data.totalCount);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (user?.userId) {
      navigator.clipboard.writeText(user.userId);
      toast.success('Referral code copied to clipboard!');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">Manage your health journey and earn rewards</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reward Points</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {isLoading ? '...' : rewardPoints}
            </div>
            <p className="text-xs text-muted-foreground">
              Earn more by referring friends
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? '...' : totalReferrals}
            </div>
            <p className="text-xs text-muted-foreground">
              People you've referred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Referral Code</CardTitle>
            <Gift className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600 font-mono">
              {user?.userId || 'Loading...'}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyReferralCode}
              className="mt-2"
            >
              Copy Code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">85%</div>
            <p className="text-xs text-muted-foreground">
              Based on activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-yellow-600" />
              Rewards & Points
            </CardTitle>
            <CardDescription>
              View your reward points, transaction history, and refer friends to earn more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/patient/rewards">
              <Button className="w-full">
                View Rewards
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-600" />
              Referrals & Services
            </CardTitle>
            <CardDescription>
              Refer friends to healthcare services and track your referral history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/patient/referrals">
              <Button className="w-full" variant="outline">
                Manage Referrals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* How to Earn Points */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Earn Reward Points</CardTitle>
          <CardDescription>
            Here are the ways you can earn points in our platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">50</div>
              <div className="text-sm text-gray-600">User Referral</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">25</div>
              <div className="text-sm text-gray-600">Doctor Referral</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">15</div>
              <div className="text-sm text-gray-600">Medicine Purchase</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">30</div>
              <div className="text-sm text-gray-600">Checkup Service</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard; 