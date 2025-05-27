'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorsApi, patientsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ClinicData {
  id: string;
  name: string;
}

interface HospitalData {
  id: string;
  name: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
}

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [patientCount, setPatientCount] = useState(0);
  const [recentPatients, setRecentPatients] = useState<PatientData[]>([]);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [hospital, setHospital] = useState<HospitalData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch doctor's data including relationships
        if (user?.id) {
          try {
            const doctorResponse = await doctorsApi.getById(user.id);
            const doctorData = doctorResponse.data;
            
            // Set clinic and hospital if available
            if (doctorData.clinic) {
              setClinic(doctorData.clinic);
            }
            
            if (doctorData.hospital) {
              setHospital(doctorData.hospital);
            }
            
            // Set reviews - ensure it's an array even if undefined
            setReviews(Array.isArray(doctorData.reviews) ? doctorData.reviews : []);
          } catch (error) {
            console.error('Error fetching doctor data:', error);
            setError('Failed to load doctor information');
          }
          
          // Fetch patients in a separate try/catch to ensure one failure doesn't affect the other
          try {
            const patientsResponse = await patientsApi.getAll({ doctorId: user.id, limit: 5 });
            if (patientsResponse.data && Array.isArray(patientsResponse.data.patients)) {
              setRecentPatients(patientsResponse.data.patients);
              setPatientCount(patientsResponse.data.total || patientsResponse.data.patients.length);
            } else {
              setRecentPatients([]);
              setPatientCount(0);
            }
          } catch (error) {
            console.error('Error fetching patient data:', error);
            setRecentPatients([]);
            setPatientCount(0);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const calculateAverageRating = () => {
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}
      
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Welcome, Dr. {user?.name}</h2>
          <p className="text-muted-foreground">Here&apos;s an overview of your practice</p>
        </div>

      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2 flex justify-between items-center">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Patients
            </CardTitle>
            <Button variant="default" size="sm" onClick={() => router.push('/dashboard/doctor/patients')}>Add Patient</Button>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{patientCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calculateAverageRating()} / 5</div>
            <p className="text-xs text-muted-foreground">
              From {Array.isArray(reviews) ? reviews.length : 0} reviews
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Patients */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Patients</CardTitle>
              <Link href="/dashboard/doctor/patients">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(recentPatients) && recentPatients.length > 0 ? (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
                          {patient.name.charAt(0)}
                        </div>
                      </Avatar>
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-muted-foreground">{patient.email}</div>
                      </div>
                    </div>
                    <Link href={`/dashboard/doctor/patients/${patient.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No patients found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Reviews */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Reviews</CardTitle>
              <Link href="/dashboard/doctor/reviews">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(reviews) && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                      <span className="ml-2 text-sm font-medium">
                        {review.rating}/5
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">&quot;{review.comment}&quot;</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No reviews yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;