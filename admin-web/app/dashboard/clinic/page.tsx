'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { clinicsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Stethoscope, Users, Pill, Phone, Mail, MapPin, UserCheck, MessageSquare } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface DashboardStats {
  hasDoctor: boolean;
  hasCompounder: boolean;
  totalPatients: number;
  averageRating: number;
}

interface ClinicData {
  id: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  doctor?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  compounder?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

const ClinicDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    hasDoctor: false,
    hasCompounder: false,
    totalPatients: 0,
    averageRating: 0
  });
  const [clinicInfo, setClinicInfo] = useState<ClinicData | null>(null);
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

      // Fetch clinic information
      const response = await clinicsApi.getById(user!.id);
      if (response.data) {
        setClinicInfo(response.data);
        
        // Set stats based on clinic data
        setStats({
          hasDoctor: !!response.data.doctor,
          hasCompounder: !!response.data.compounder,
          totalPatients: 0, // This would need to be calculated from actual patient data
          averageRating: 0 // This would need to be calculated from reviews
        });
      } else {
        // If no clinic data found, create placeholder
        setClinicInfo({
          id: user!.id,
          name: user!.name || 'Clinic',
          phone: user!.phone || '',
          addressLine: '',
          city: '',
          state: '',
          pin: '',
          country: ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      
      // Set placeholder data on error
      setClinicInfo({
        id: user!.id,
        name: user!.name || 'Clinic',
        phone: user!.phone || '',
        addressLine: '',
        city: '',
        state: '',
        pin: '',
        country: ''
      });
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
          <h1 className="text-2xl md:text-3xl font-bold">Clinic Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Welcome to {clinicInfo?.name || 'Your Clinic'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard/clinic/doctors">
            <Button variant="outline" className="w-full sm:w-auto">
              <Stethoscope className="h-4 w-4 mr-2" />
              Manage Doctor
            </Button>
          </Link>
          <Link href="/dashboard/clinic/compounders">
            <Button className="w-full sm:w-auto">
              <Pill className="h-4 w-4 mr-2" />
              Manage Compounder
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctor Status</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hasDoctor ? 'Assigned' : 'None'}</div>
            <p className="text-xs text-muted-foreground">
              {stats.hasDoctor ? 'Doctor working at clinic' : 'No doctor assigned'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compounder Status</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hasCompounder ? 'Assigned' : 'None'}</div>
            <p className="text-xs text-muted-foreground">
              {stats.hasCompounder ? 'Compounder working at clinic' : 'No compounder assigned'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Complete</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.hasDoctor && stats.hasCompounder ? 'Yes' : 'No'}
            </div>
            <p className="text-xs text-muted-foreground">
              Full staffing status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Served</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Total patients treated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clinic Information */}
      {clinicInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Stethoscope className="h-5 w-5" />
              Clinic Information
            </CardTitle>
            <CardDescription>Your clinic details and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Clinic Name</div>
                  <div className="font-medium text-base md:text-lg mt-1">{clinicInfo.name}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone Number</div>
                    <div className="font-medium">{clinicInfo.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium break-all">{clinicInfo.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium">
                      {clinicInfo.addressLine}<br />
                      {clinicInfo.city}, {clinicInfo.state} {clinicInfo.pin}<br />
                      {clinicInfo.country}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Doctor Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5" />
              Assigned Doctor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinicInfo?.doctor ? (
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-base md:text-lg">{clinicInfo.doctor.name}</div>
                  <div className="text-sm text-muted-foreground break-all">{clinicInfo.doctor.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{clinicInfo.doctor.phone}</span>
                </div>
                <Link href="/dashboard/clinic/doctors">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Manage Doctor
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4 text-sm md:text-base">No doctor assigned to this clinic</p>
                <Link href="/dashboard/clinic/doctors">
                  <Button className="w-full sm:w-auto">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Assign Doctor
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compounder Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5" />
              Assigned Compounder
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinicInfo?.compounder ? (
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-base md:text-lg">{clinicInfo.compounder.name}</div>
                  <div className="text-sm text-muted-foreground break-all">{clinicInfo.compounder.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{clinicInfo.compounder.phone}</span>
                </div>
                <Link href="/dashboard/clinic/compounders">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Manage Compounder
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4 text-sm md:text-base">No compounder assigned to this clinic</p>
                <Link href="/dashboard/clinic/compounders">
                  <Button className="w-full sm:w-auto">
                    <Pill className="h-4 w-4 mr-2" />
                    Assign Compounder
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
          <CardDescription>Manage your clinic operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard/clinic/doctors">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">Doctor</div>
                      <div className="text-sm text-muted-foreground">
                        Manage clinic doctor
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/clinic/compounders">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Pill className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">Compounder</div>
                      <div className="text-sm text-muted-foreground">
                        Manage clinic compounder
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/clinic/reviews">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">Reviews</div>
                      <div className="text-sm text-muted-foreground">
                        View patient reviews
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

export default ClinicDashboard; 