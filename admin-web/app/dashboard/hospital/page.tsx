'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { hospitalsApi, doctorsApi, patientsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Stethoscope, Building2, Calendar, Phone, Mail, MapPin, MessageSquare } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalReviews: number;
  averageRating: number;
}

interface HospitalData {
  id: string;
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pin: string;
  country: string;
}

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    totalPatients: 0,
    totalReviews: 0,
    averageRating: 0
  });
  const [hospitalInfo, setHospitalInfo] = useState<HospitalData | null>(null);
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

      // Fetch hospital information
      const hospitalResponse = await hospitalsApi.getById(user!.id);
      if (hospitalResponse.data) {
        setHospitalInfo(hospitalResponse.data);
      }

      // Fetch doctors affiliated with this hospital
      const doctorsResponse = await doctorsApi.getAll({ hospitalId: user!.id });
      const doctorsData = doctorsResponse.data?.doctors || doctorsResponse.data || [];

      // Fetch patients treated at this hospital
      const patientsResponse = await patientsApi.getAll({ hospitalId: user!.id });
      const patientsData = patientsResponse.data?.patients || patientsResponse.data || [];

      // For now, setting reviews to 0 - you can implement reviews API later
      setStats({
        totalDoctors: Array.isArray(doctorsData) ? doctorsData.length : 0,
        totalPatients: Array.isArray(patientsData) ? patientsData.length : 0,
        totalReviews: 0,
        averageRating: 0
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
          <h1 className="text-2xl md:text-3xl font-bold">Hospital Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Welcome back, {hospitalInfo?.name || 'Hospital'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard/hospital/doctors">
            <Button variant="outline" className="w-full sm:w-auto">
              <Stethoscope className="h-4 w-4 mr-2" />
              Manage Doctors
            </Button>
          </Link>
          <Link href="/dashboard/hospital/patients">
            <Button className="w-full sm:w-auto">
              <Users className="h-4 w-4 mr-2" />
              View Patients
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">
              Affiliated with your hospital
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Treated at your hospital
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Patient reviews received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hospital Information */}
      {hospitalInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Building2 className="h-5 w-5" />
              Hospital Information
            </CardTitle>
            <CardDescription>Your hospital details and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Hospital Name</div>
                  <div className="font-medium text-base md:text-lg mt-1">{hospitalInfo.name}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{hospitalInfo.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium break-all">{hospitalInfo.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium">
                      {hospitalInfo.addressLine}<br />
                      {hospitalInfo.city}, {hospitalInfo.state} {hospitalInfo.pin}<br />
                      {hospitalInfo.country}
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
          <CardDescription>Manage your hospital operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard/hospital/doctors">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">Manage Doctors</div>
                      <div className="text-sm text-muted-foreground">
                        View and manage affiliated doctors
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/hospital/patients">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">View Patients</div>
                      <div className="text-sm text-muted-foreground">
                        See patients treated at your hospital
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/hospital/reviews">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-8 w-8 text-primary flex-shrink-0" />
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

export default HospitalDashboard;