'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { hospitalsApi, clinicsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, Stethoscope, Users, Star, Phone, Mail, MapPin, Pill } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface DashboardStats {
  totalHospitals: number;
  totalReviews: number;
  averageRating: number;
  hasClinic: boolean;
  hasMedStore: boolean;
}

interface CompounderData {
  id: string;
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  clinic?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  medStore?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
}

const CompounderDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalHospitals: 0,
    totalReviews: 0,
    averageRating: 0,
    hasClinic: false,
    hasMedStore: false
  });
  const [compounderInfo, setCompounderInfo] = useState<CompounderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Note: We'll need to create compounder API endpoints
      // For now, using placeholder data structure
      
      // Fetch compounder information (placeholder - needs actual API)
      // const compounderResponse = await compoundersApi.getById(user!.id);
      // if (compounderResponse.data) {
      //   setCompounderInfo(compounderResponse.data);
      // }

      // Fetch hospitals affiliated with this compounder (placeholder)
      // const hospitalsResponse = await hospitalsApi.getAll({ compounderId: user!.id });
      // const hospitalsData = hospitalsResponse.data?.hospitals || hospitalsResponse.data || [];

      // For now, setting placeholder stats
      setStats({
        totalHospitals: 0,
        totalReviews: 0,
        averageRating: 0,
        hasClinic: false,
        hasMedStore: false
      });

      // Placeholder compounder info based on user
      setCompounderInfo({
        id: user!.id,
        name: user!.name || 'Compounder',
        phone: user!.phone || '',
        email: user!.email || '',
        addressLine: '',
        city: '',
        state: '',
        pin: '',
        country: ''
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-3 md:px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Compounder Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Welcome back, {compounderInfo?.name || 'Compounder'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard/compounder/hospitals">
            <Button variant="outline" className="w-full sm:w-auto">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Hospitals
            </Button>
          </Link>
          <Link href="/dashboard/compounder/clinic">
            <Button className="w-full sm:w-auto">
              <Stethoscope className="h-4 w-4 mr-2" />
              My Clinic
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliated Hospitals</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHospitals}</div>
            <p className="text-xs text-muted-foreground">
              Hospitals you work with
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clinic Status</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hasClinic ? 'Active' : 'None'}</div>
            <p className="text-xs text-muted-foreground">
              Clinic affiliation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Med Store</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hasMedStore ? 'Active' : 'None'}</div>
            <p className="text-xs text-muted-foreground">
              Med store affiliation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Patient reviews received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compounder Information */}
      {compounderInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Users className="h-5 w-5" />
              Your Profile
            </CardTitle>
            <CardDescription>Your professional details and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Name</div>
                  <div className="font-medium text-base md:text-lg mt-1">{compounderInfo.name}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{compounderInfo.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium break-all">{compounderInfo.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium">
                      {compounderInfo.addressLine}<br />
                      {compounderInfo.city}, {compounderInfo.state} {compounderInfo.pin}<br />
                      {compounderInfo.country}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
          <CardDescription>Manage your professional affiliations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/compounder/hospitals">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">Hospitals</div>
                      <div className="text-sm text-muted-foreground">
                        Manage hospital affiliations
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/compounder/clinic">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">My Clinic</div>
                      <div className="text-sm text-muted-foreground">
                        Manage clinic affiliation
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/compounder/medstore">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Pill className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">Med Store</div>
                      <div className="text-sm text-muted-foreground">
                        Manage store affiliation
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/compounder/reviews">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Star className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">Reviews</div>
                      <div className="text-sm text-muted-foreground">
                        View patient feedback
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompounderDashboard; 