'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorsApi, hospitalsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, Stethoscope, Phone, Mail, MapPin, Plus } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization?: string;
  experience?: number;
  addressLine?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
}

const HospitalDoctorsPage = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Modal state for adding doctors
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [displayedDoctors, setDisplayedDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, [user]);

  // Fetch all doctors when dialog opens
  useEffect(() => {
    if (isDialogOpen && allDoctors.length === 0) {
      fetchAllDoctors();
    }
  }, [isDialogOpen]);

  // Filter available doctors based on search query in dialog
  useEffect(() => {
    if (doctorSearchQuery.trim() === '') {
      setDisplayedDoctors(allDoctors);
    } else {
      const query = doctorSearchQuery.toLowerCase();
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
  }, [doctorSearchQuery, allDoctors]);

  const fetchDoctors = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await doctorsApi.getAll({ hospitalId: user.id });
      
      let doctorsData = [];
      
      // Handle different possible API response formats
      if (response.data && Array.isArray(response.data)) {
        doctorsData = response.data;
      } else if (response.data && Array.isArray(response.data.doctors)) {
        doctorsData = response.data.doctors;
      } else if (response.data && Array.isArray(response.data.data)) {
        doctorsData = response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        doctorsData = [];
      }
      
      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
      
      if (doctorsData.length === 0) {
        console.log('No doctors affiliated with this hospital');
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      setError(error?.response?.data?.message || 'Failed to load doctors. Please try again later.');
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all doctors for selection
  const fetchAllDoctors = async () => {
    setIsLoadingDoctors(true);
    setError(null);
    
    try {
      const response = await doctorsApi.getAll(); // Get all doctors, not filtered by hospital
      
      let doctorsData = [];
      
      // Handle different possible API response formats
      if (response.data && Array.isArray(response.data)) {
        doctorsData = response.data;
      } else if (response.data && Array.isArray(response.data.doctors)) {
        doctorsData = response.data.doctors;
      } else if (response.data && Array.isArray(response.data.data)) {
        doctorsData = response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        setError('Failed to load doctors. Unexpected data format.');
        doctorsData = [];
      }
      
      // Filter out doctors already affiliated with this hospital
      const availableDoctors = doctorsData.filter(
        (doctor: Doctor) => !doctors.some(affiliatedDoctor => affiliatedDoctor.id === doctor.id)
      );
      
      setAllDoctors(availableDoctors);
      setDisplayedDoctors(availableDoctors);
      
      if (availableDoctors.length === 0) {
        setError('No available doctors to assign.');
      }
    } catch (error: any) {
      console.error('Error fetching all doctors:', error);
      setError('Failed to load doctors. Please try again.');
      setAllDoctors([]);
      setDisplayedDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  useEffect(() => {
    // Filter doctors based on search query
    if (!Array.isArray(doctors)) {
      setFilteredDoctors([]);
      return;
    }
    
    if (searchQuery.trim() === '') {
      setFilteredDoctors(doctors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = doctors.filter(
        doctor =>
          doctor.name?.toLowerCase().includes(query) ||
          doctor.email?.toLowerCase().includes(query) ||
          doctor.phone?.includes(query) ||
          doctor.specialization?.toLowerCase().includes(query) ||
          doctor.city?.toLowerCase().includes(query) ||
          doctor.state?.toLowerCase().includes(query)
      );
      setFilteredDoctors(filtered);
    }
  }, [searchQuery, doctors]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const openAddDialog = () => {
    // Reset search state
    setDoctorSearchQuery('');
    setSelectedDoctor(null);
    setError(null);
    setIsDialogOpen(true);
  };

  // Function to assign doctor to hospital
  const assignToHospital = async (doctorId: string) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await doctorsApi.assignToHospital(doctorId, user.id);
      
      // Refresh doctors list
      await fetchDoctors();
      
      // Remove the assigned doctor from available doctors
      setAllDoctors(prev => prev.filter(d => d.id !== doctorId));
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error assigning doctor to hospital:', error);
      setError(error?.response?.data?.message || 'Failed to assign doctor to hospital. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to select a doctor
  const selectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading doctors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Hospital Doctors</h2>
        <div className="flex items-center gap-4">
          <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Doctor
          </Button>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Affiliated doctors at your hospital
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search doctors by name, specialization, or location..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {searchQuery ? `Found: ${filteredDoctors.length}` : `Total: ${doctors.length}`} doctors
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliated Doctors</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar>
                        <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center">
                          {doctor.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-lg">{doctor.name || 'Unknown'}</div>
                        {doctor.specialization && (
                          <span className="inline-block bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs mt-1">
                            {doctor.specialization}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {doctor.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                      )}
                      
                      {doctor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{doctor.phone}</span>
                        </div>
                      )}
                      
                      {(doctor.city || doctor.state) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {doctor.city && doctor.state 
                              ? `${doctor.city}, ${doctor.state}` 
                              : doctor.city || doctor.state}
                          </span>
                        </div>
                      )}
                      
                      {doctor.experience && (
                        <div className="text-muted-foreground">
                          Experience: {doctor.experience} years
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery 
                ? 'No doctors found matching your search criteria.' 
                : 'No doctors are currently affiliated with your hospital. Click "Add Doctor" to assign doctors.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {doctors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Doctor Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{doctors.length}</div>
                <div className="text-sm text-muted-foreground">Total Doctors</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {new Set(doctors.filter(d => d.specialization).map(d => d.specialization)).size}
                </div>
                <div className="text-sm text-muted-foreground">Specializations</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {doctors.filter(d => d.experience).length > 0 
                    ? Math.round(doctors.filter(d => d.experience).reduce((sum, d) => sum + (d.experience || 0), 0) / doctors.filter(d => d.experience).length)
                    : 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg. Experience (years)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Doctor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Doctor to Hospital</DialogTitle>
            <DialogDescription>
              Search and select a doctor to affiliate with your hospital
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
                    value={doctorSearchQuery}
                    onChange={(e) => setDoctorSearchQuery(e.target.value)}
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
                  {displayedDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedDoctor?.id === doctor.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => selectDoctor(doctor)}
                    >
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {doctor.specialization && `${doctor.specialization} • `}
                        {doctor.email} • {doctor.phone}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {doctor.city && doctor.state 
                          ? `${doctor.city}, ${doctor.state}` 
                          : doctor.city || doctor.state || 'Unknown location'}
                        {doctor.experience && ` • ${doctor.experience} years exp.`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {doctorSearchQuery.trim() !== '' 
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
                        <span className="font-medium">Name:</span> {selectedDoctor.name}
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
                onClick={() => selectedDoctor && assignToHospital(selectedDoctor.id)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  'Add Doctor'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalDoctorsPage;