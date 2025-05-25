'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorsApi, clinicsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Stethoscope, Phone, Mail, MapPin, Calendar } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
  specialization?: string;
  experience?: number;
  createdAt?: string;
}

const ClinicDoctorsPage = () => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Doctor search and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [displayedDoctors, setDisplayedDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch clinic information to get assigned doctor
        const response = await clinicsApi.getById(user.id);
        if (response.data && response.data.doctor) {
          setDoctor(response.data.doctor);
        } else {
          setDoctor(null);
        }
      } catch (error: any) {
        console.error('Error fetching doctor data:', error);
        setError('Failed to load doctor data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctor();
  }, [user]);

  // Fetch all doctors when dialog opens
  useEffect(() => {
    if (isDialogOpen && allDoctors.length === 0) {
      fetchAllDoctors();
    }
  }, [isDialogOpen]);

  // Filter doctors based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setDisplayedDoctors(allDoctors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allDoctors.filter(
        doctor =>
          doctor.name?.toLowerCase().includes(query) ||
          doctor.email?.toLowerCase().includes(query) ||
          doctor.phone?.includes(query) ||
          doctor.specialization?.toLowerCase().includes(query) ||
          doctor.city?.toLowerCase().includes(query) ||
          doctor.state?.toLowerCase().includes(query)
      );
      setDisplayedDoctors(filtered);
    }
  }, [searchQuery, allDoctors]);
  
  const openDialog = () => {
    // Reset search state
    setSearchQuery('');
    setSelectedDoctor(null);
    setError(null);
    setIsDialogOpen(true);
  };
  
  // Fetch all doctors
  const fetchAllDoctors = async () => {
    setIsLoadingDoctors(true);
    setError(null);
    
    try {
      const response = await doctorsApi.getAll();
      
      let doctorsData = [];
      
      if (response.data && Array.isArray(response.data)) {
        doctorsData = response.data;
      } else if (response.data && response.data.doctors && Array.isArray(response.data.doctors)) {
        doctorsData = response.data.doctors;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        doctorsData = response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        setError('Failed to load doctors. Unexpected data format.');
        doctorsData = [];
      }
      
      // Filter out doctors that already have a clinic (one-to-one relationship)
      const availableDoctors = doctorsData.filter((doc: Doctor) => {
        // In the actual implementation, check if doctor already has a clinic
        // and exclude the current doctor if one is assigned
        return doc.id !== doctor?.id;
      });
      
      setAllDoctors(availableDoctors);
      setDisplayedDoctors(availableDoctors);
      
      if (availableDoctors.length === 0) {
        setError('No available doctors found.');
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load doctors. Please try again.');
      setAllDoctors([]);
      setDisplayedDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };
  
  // Function to assign doctor to clinic
  const assignToClinic = async (doctorId: string) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await clinicsApi.assignDoctor(user.id, doctorId);
      
      // Update local state with the assigned doctor
      if (selectedDoctor) {
        setDoctor(selectedDoctor);
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error assigning doctor to clinic:', error);
      setError(error?.response?.data?.error || 'Failed to assign doctor to clinic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to remove doctor from clinic
  const removeDoctorFromClinic = async () => {
    if (!user?.id || !doctor) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await clinicsApi.removeDoctor(user.id);
      
      // Clear the doctor from local state
      setDoctor(null);
    } catch (error: any) {
      console.error('Error removing doctor from clinic:', error);
      setError(error?.response?.data?.error || 'Failed to remove doctor from clinic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to select a doctor
  const selectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading doctor data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Clinic Doctor</h2>
        <div className="flex gap-2">
          {doctor ? (
            <>
              <Button onClick={openDialog} variant="outline">
                Change Doctor
              </Button>
              <Button onClick={removeDoctorFromClinic} variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Removing...' : 'Remove Doctor'}
              </Button>
            </>
          ) : (
            <Button onClick={openDialog}>
              <Stethoscope className="h-4 w-4 mr-2" />
              Assign Doctor
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {doctor ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Dr. {doctor.name}
            </CardTitle>
            <CardDescription>Doctor assigned to this clinic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center">
                    {doctor.name?.charAt(0).toUpperCase() || 'D'}
                  </div>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-xl">{doctor.name}</div>
                  {doctor.specialization && (
                    <div className="text-muted-foreground">{doctor.specialization}</div>
                  )}
                  {doctor.experience && (
                    <div className="text-sm text-muted-foreground">{doctor.experience} years experience</div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{doctor.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{doctor.phone}</div>
                    </div>
                  </div>
                  
                  {doctor.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Joined</div>
                        <div className="font-medium">{formatDate(doctor.createdAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {(doctor.city || doctor.state) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <div className="text-sm text-muted-foreground">Location</div>
                        <div className="font-medium">
                          {doctor.addressLine && `${doctor.addressLine}`}<br />
                          {doctor.city && doctor.state 
                            ? `${doctor.city}, ${doctor.state}` 
                            : doctor.city || doctor.state}
                          {doctor.pin && ` ${doctor.pin}`}<br />
                          {doctor.country}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Doctor Assigned</CardTitle>
            <CardDescription>Assign a doctor to your clinic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Stethoscope className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Doctor Assigned</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your clinic doesn't have a doctor assigned yet. Search and select a doctor to work at your clinic.
              </p>
              <Button onClick={openDialog}>
                <Stethoscope className="h-4 w-4 mr-2" />
                Assign Doctor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{doctor ? 'Change Clinic Doctor' : 'Assign Doctor'}</DialogTitle>
            <DialogDescription>
              Search and select a doctor to work at your clinic
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            {/* Doctor search */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search doctors by name, specialization, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Doctors list */}
              {isLoadingDoctors ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : displayedDoctors.length > 0 ? (
                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                  {displayedDoctors.map((doctorItem) => (
                    <div
                      key={doctorItem.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedDoctor?.id === doctorItem.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => selectDoctor(doctorItem)}
                    >
                      <div className="font-medium">Dr. {doctorItem.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {doctorItem.specialization && `${doctorItem.specialization} • `}
                        {doctorItem.email} • {doctorItem.phone}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {doctorItem.city && doctorItem.state 
                          ? `${doctorItem.city}, ${doctorItem.state}` 
                          : doctorItem.city || doctorItem.state || 'Location not specified'}
                        {doctorItem.experience && ` • ${doctorItem.experience} years exp.`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {searchQuery.trim() !== '' 
                    ? 'No doctors found matching your search criteria.' 
                    : 'No available doctors to assign.'}
                </div>
              )}
              
              {/* Selected doctor summary */}
              {selectedDoctor && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg">Selected Doctor</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Name:</span> Dr. {selectedDoctor.name}
                      </div>
                      {selectedDoctor.specialization && (
                        <div>
                          <span className="font-medium">Specialization:</span> {selectedDoctor.specialization}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Contact:</span> {selectedDoctor.phone}
                        {selectedDoctor.email && `, ${selectedDoctor.email}`}
                      </div>
                      {(selectedDoctor.city || selectedDoctor.state) && (
                        <div>
                          <span className="font-medium">Location:</span> 
                          {selectedDoctor.city && ` ${selectedDoctor.city}`}
                          {selectedDoctor.state && `, ${selectedDoctor.state}`}
                        </div>
                      )}
                      {selectedDoctor.experience && (
                        <div>
                          <span className="font-medium">Experience:</span> {selectedDoctor.experience} years
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                disabled={isSubmitting || !selectedDoctor}
                onClick={() => selectedDoctor && assignToClinic(selectedDoctor.id)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  'Assign Doctor'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicDoctorsPage; 