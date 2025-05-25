'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { checkupCentersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, FileText, Building2, Phone, Mail, MapPin } from 'lucide-react'; // Added icons

// Define interfaces for data types
interface CheckupCenterData {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  patients: any[]; // Simplified for now
  medDocuments: any[]; // Simplified for now
}

const CheckupCenterDashboardPage = () => {
  const { user } = useAuth();
  const [centerInfo, setCenterInfo] = useState<CheckupCenterData | null>(null);
  const [stats, setStats] = useState({ totalPatients: 0, totalDocuments: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== 'CHECKUP_CENTER') {
        // Or redirect to login/error page if not a checkup center user
        setIsLoading(false);
        setError("Access denied. You must be logged in as a Checkup Center.");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await checkupCentersApi.getById(user.id);
        setCenterInfo(response.data);
        setStats({
          totalPatients: response.data.patients?.length || 0,
          totalDocuments: response.data.medDocuments?.length || 0,
        });
      } catch (err: any) {
        console.error('Error fetching checkup center data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><div className="text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div><p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p></div></div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded-md text-sm">{error}</div>;
  }

  if (!centerInfo) {
    return <div className="p-4 text-center text-sm md:text-base">Checkup Center information not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome, {centerInfo.name}</h1>
          <p className="text-sm md:text-lg text-gray-600 mt-1">Your Checkup Center Dashboard</p>
        </div>
        {/* Add any global action button here, e.g., Edit Profile */}
        {/* <Button>Edit Profile</Button> */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Patients</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalPatients}</div>
            <p className="text-xs text-gray-500">Patients associated with your center</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Uploaded Documents</CardTitle>
            <FileText className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalDocuments}</div>
            <p className="text-xs text-gray-500">Medical documents managed by your center</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions / Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700 text-lg">
                <Users className="h-6 w-6 text-indigo-600" />
                Manage Patients
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">View, assign, or manage patients associated with your center.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/checkup-center/patients" passHref>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Go to Patients</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700 text-lg">
                <FileText className="h-6 w-6 text-purple-600" />
                Manage Documents
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">Upload, view, and manage medical documents for your patients.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/checkup-center/documents" passHref>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Go to Documents</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Checkup Center Information */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 text-lg md:text-xl">
            <Building2 className="h-6 w-6 text-blue-600" />
            Center Information
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">Your checkup center details and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Center Name</div>
                <div className="font-medium text-base md:text-lg mt-1">{centerInfo.name}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{centerInfo.phone}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium break-all">{centerInfo.email}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <div className="text-sm text-muted-foreground">Address</div>
                  <div className="font-medium">
                    {centerInfo.addressLine}<br />
                    {centerInfo.city}, {centerInfo.state} {centerInfo.pin}<br />
                    {centerInfo.country}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckupCenterDashboardPage; 