'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { clinicsApi, doctorsApi } from '@/lib/api';
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
import { Loader2, Building2, Phone, Mail, MapPin, Calendar } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
  email?: string;
  phone: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
  createdAt?: string;
}

const DoctorClinicsPage = () => {
  const { user } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Clinic search and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [displayedClinics, setDisplayedClinics] = useState<Clinic[]>([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    const fetchClinic = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch doctor information to get assigned clinic
        const response = await doctorsApi.getById(user.id);
        if (response.data && response.data.clinic) {
          setClinic(response.data.clinic);
        } else {
          setClinic(null);
        }
      } catch (error: any) {
        console.error('Error fetching clinic data:', error);
        setError('Failed to load clinic data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinic();
  }, [user]);

  // Fetch all clinics when dialog opens
  useEffect(() => {
    if (isDialogOpen && allClinics.length === 0) {
      fetchAllClinics();
    }
  }, [isDialogOpen]);

  // Filter clinics based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setDisplayedClinics(allClinics);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allClinics.filter(
        clinic =>
          clinic.name?.toLowerCase().includes(query) ||
          clinic.email?.toLowerCase().includes(query) ||
          clinic.phone?.includes(query) ||
          clinic.city?.toLowerCase().includes(query) ||
          clinic.state?.toLowerCase().includes(query)
      );
      setDisplayedClinics(filtered);
    }
  }, [searchQuery, allClinics]);
  
  const openDialog = () => {
    // Reset search state
    setSearchQuery('');
    setSelectedClinic(null);
    setError(null);
    setIsDialogOpen(true);
  };
  
  // Fetch all clinics
  const fetchAllClinics = async () => {
    setIsLoadingClinics(true);
    setError(null);
    
    try {
      const response = await clinicsApi.getAll();
      
      let clinicsData = [];
      
      if (response.data && Array.isArray(response.data)) {
        clinicsData = response.data;
      } else if (response.data && response.data.clinics && Array.isArray(response.data.clinics)) {
        clinicsData = response.data.clinics;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        clinicsData = response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        setError('Failed to load clinics. Unexpected data format.');
        clinicsData = [];
      }
      
      // Filter out clinics that already have a doctor (one-to-one relationship)
      const availableClinics = clinicsData.filter((clinicItem: Clinic) => {
        // Exclude the current clinic if one is assigned
        return clinicItem.id !== clinic?.id;
      });
      
      setAllClinics(availableClinics);
      setDisplayedClinics(availableClinics);
      
      if (availableClinics.length === 0) {
        setError('No available clinics found.');
      }
    } catch (error: any) {
      console.error('Error fetching clinics:', error);
      setError('Failed to load clinics. Please try again.');
      setAllClinics([]);
      setDisplayedClinics([]);
    } finally {
      setIsLoadingClinics(false);
    }
  };
  
  // Function to assign doctor to clinic
  const assignToClinic = async (clinicId: string) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await clinicsApi.assignDoctor(clinicId, user.id);
      
      // Update local state with the assigned clinic
      if (selectedClinic) {
        setClinic(selectedClinic);
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error assigning doctor to clinic:', error);
      setError(error?.response?.data?.error || 'Failed to assign to clinic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to remove doctor from clinic
  const removeDoctorFromClinic = async () => {
    if (!user?.id || !clinic) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      await clinicsApi.removeDoctor(clinic.id);
      
      // Clear the clinic from local state
      setClinic(null);
    } catch (error: any) {
      console.error('Error removing doctor from clinic:', error);
      setError(error?.response?.data?.error || 'Failed to remove from clinic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to select a clinic
  const selectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
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
        <span className="ml-2">Loading clinic data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">My Clinic</h2>
        <div className="flex gap-2">
          {clinic ? (
            <>
              <Button onClick={openDialog} variant="outline">
                Change Clinic
              </Button>
              <Button onClick={removeDoctorFromClinic} variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Leaving...' : 'Leave Clinic'}
              </Button>
            </>
          ) : (
        <Button onClick={openDialog}>
              <Building2 className="h-4 w-4 mr-2" />
              Join Clinic
        </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {clinic ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {clinic.name}
            </CardTitle>
            <CardDescription>Clinic you are affiliated with</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center">
                    {clinic.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-xl">{clinic.name}</div>
                  <div className="text-muted-foreground">Healthcare Clinic</div>
                </div>
                </div>
                
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {clinic.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{clinic.email}</div>
                      </div>
                </div>
                  )}
                
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{clinic.phone}</div>
                    </div>
                </div>
                
                  {clinic.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                        <div className="text-sm text-muted-foreground">Established</div>
                        <div className="font-medium">{formatDate(clinic.createdAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {(clinic.city || clinic.state) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                        <div className="text-sm text-muted-foreground">Location</div>
                        <div className="font-medium">
                          {clinic.addressLine && `${clinic.addressLine}`}<br />
                          {clinic.city && clinic.state 
                            ? `${clinic.city}, ${clinic.state}` 
                            : clinic.city || clinic.state}
                          {clinic.pin && ` ${clinic.pin}`}<br />
                          {clinic.country}
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
            <CardTitle>No Clinic Affiliation</CardTitle>
            <CardDescription>Join a clinic to start practicing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Clinic Affiliation</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven&apos;t joined any clinic yet. Search and select a clinic to work with.
              </p>
              <Button onClick={openDialog}>
                <Building2 className="h-4 w-4 mr-2" />
                Join Clinic
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{clinic ? 'Change Clinic Affiliation' : 'Join Clinic'}</DialogTitle>
            <DialogDescription>
              Search and select a clinic to work with
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            {/* Clinic search */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                <Input
                    placeholder="Search clinics by name, location, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              </div>
              
              {/* Clinics list */}
              {isLoadingClinics ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : displayedClinics.length > 0 ? (
                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                  {displayedClinics.map((clinicItem) => (
                    <div
                      key={clinicItem.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedClinic?.id === clinicItem.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => selectClinic(clinicItem)}
                    >
                      <div className="font-medium">{clinicItem.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {clinicItem.email && `${clinicItem.email} • `}
                        {clinicItem.phone}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {clinicItem.city && clinicItem.state 
                          ? `${clinicItem.city}, ${clinicItem.state}` 
                          : clinicItem.city || clinicItem.state || 'Location not specified'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {searchQuery.trim() !== '' 
                    ? 'No clinics found matching your search criteria.' 
                    : 'No available clinics to join.'}
              </div>
              )}
              
              {/* Selected clinic summary */}
              {selectedClinic && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg">Selected Clinic</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
              <div className="space-y-2">
                      <div>
                        <span className="font-medium">Name:</span> {selectedClinic.name}
              </div>
                      <div>
                        <span className="font-medium">Contact:</span> {selectedClinic.phone}
                        {selectedClinic.email && `, ${selectedClinic.email}`}
              </div>
                      {(selectedClinic.city || selectedClinic.state) && (
                        <div>
                          <span className="font-medium">Location:</span> 
                          {selectedClinic.city && ` ${selectedClinic.city}`}
                          {selectedClinic.state && `, ${selectedClinic.state}`}
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
                disabled={isSubmitting || !selectedClinic}
                onClick={() => selectedClinic && assignToClinic(selectedClinic.id)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  'Join Clinic'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorClinicsPage; 