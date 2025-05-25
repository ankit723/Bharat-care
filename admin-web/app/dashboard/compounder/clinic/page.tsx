'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { clinicsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Stethoscope, Phone, Mail, MapPin } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pin: string;
  country: string;
}

const CompounderClinicPage = () => {
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
        
        // For now, this is a placeholder since we need compounder API endpoints
        // In the actual implementation, this would be:
        // const response = await compoundersApi.getById(user.id);
        // if (response.data.clinic) {
        //   setClinic(response.data.clinic);
        // }
        
        setClinic(null); // Placeholder
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
          clinic.phone?.includes(query) ||
          clinic.city?.toLowerCase().includes(query) ||
          clinic.state?.toLowerCase().includes(query) ||
          clinic.pin?.includes(query)
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
      
      // Filter out clinics that already have a compounder
      const availableClinics = clinicsData.filter((clinic: Clinic) => {
        // In the actual implementation, check if clinic already has a compounder
        return true; // Placeholder
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
  
  // Function to assign compounder to clinic
  const assignToClinic = async (clinicId: string) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // This would need to be implemented in the API
      // await compoundersApi.assignToClinic(user.id, clinicId);
      
      // For now, just log the action
      console.log(`Assigning compounder ${user.id} to clinic ${clinicId}`);
      
      // Simulate success - in real implementation, fetch the updated clinic data
      if (selectedClinic) {
        setClinic(selectedClinic);
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error assigning to clinic:', error);
      setError(error?.response?.data?.message || 'Failed to assign to clinic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to remove clinic affiliation
  const removeClinicAffiliation = async () => {
    if (!user?.id || !clinic) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // This would need to be implemented in the API
      // await compoundersApi.removeFromClinic(user.id);
      
      console.log(`Removing compounder ${user.id} from clinic ${clinic.id}`);
      
      // Simulate success
      setClinic(null);
    } catch (error: any) {
      console.error('Error removing clinic affiliation:', error);
      setError(error?.response?.data?.message || 'Failed to remove clinic affiliation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to select a clinic
  const selectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
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
              <Button onClick={removeClinicAffiliation} variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Removing...' : 'Leave Clinic'}
              </Button>
            </>
          ) : (
            <Button onClick={openDialog}>
              <Stethoscope className="h-4 w-4 mr-2" />
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
              <Stethoscope className="h-5 w-5" />
              {clinic.name}
            </CardTitle>
            <CardDescription>Your current clinic affiliation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Clinic Name</div>
                    <div className="font-medium text-lg">{clinic.name}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone Number</div>
                      <div className="font-medium">{clinic.phone}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">
                        {clinic.addressLine}<br />
                        {clinic.city}, {clinic.state} {clinic.pin}<br />
                        {clinic.country}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Clinic Affiliation</CardTitle>
            <CardDescription>Join a clinic to start working</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't joined any clinic yet. Search and select a clinic to work with.
              </p>
              <Button onClick={openDialog}>
                <Stethoscope className="h-4 w-4 mr-2" />
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
                        {clinicItem.phone}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {clinicItem.addressLine}, {clinicItem.city}, {clinicItem.state} {clinicItem.pin}
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
                        <span className="font-medium">Phone:</span> {selectedClinic.phone}
                      </div>
                      <div>
                        <span className="font-medium">Address:</span> {selectedClinic.addressLine}, {selectedClinic.city}, {selectedClinic.state} {selectedClinic.pin}
                      </div>
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

export default CompounderClinicPage; 