'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorsApi, hospitalsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { Loader2 } from 'lucide-react';

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

const HospitalsPage = () => {
  const { user } = useAuth();
  const [hospital, setHospital] = useState<HospitalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<HospitalData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hospital search and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [allHospitals, setAllHospitals] = useState<HospitalData[]>([]);
  const [displayedHospitals, setDisplayedHospitals] = useState<HospitalData[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<HospitalData | null>(null);

  useEffect(() => {
    const fetchHospital = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await doctorsApi.getById(user.id);
        
        // Check if user has hospitals array and use the first one
        if (response.data.hospitals && Array.isArray(response.data.hospitals) && response.data.hospitals.length > 0) {
          setHospital(response.data.hospitals[0]);
          setFormData(response.data.hospitals[0]);
        } else if (response.data.hospital) {
          // Fallback to single hospital property
          setHospital(response.data.hospital);
          setFormData(response.data.hospital);
        } else {
          // Initialize empty form data for new hospital
          setFormData({
            name: '',
            phone: '',
            email: '',
            addressLine: '',
            city: '',
            state: '',
            pin: '',
            country: ''
          });
        }
      } catch (error) {
        console.error('Error fetching hospital data:', error);
        setError('Failed to load hospital data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHospital();
  }, [user]);

  // Fetch all hospitals when dialog opens
  useEffect(() => {
    if (isDialogOpen && allHospitals.length === 0) {
      fetchAllHospitals();
    }
  }, [isDialogOpen]);

  // Filter hospitals based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // Show all hospitals if search query is empty
      setDisplayedHospitals(allHospitals);
    } else {
      // Filter hospitals based on search query
      const filtered = allHospitals.filter(
        (hospital) =>
          hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hospital.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hospital.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hospital.pin.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setDisplayedHospitals(filtered);
    }
  }, [searchQuery, allHospitals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!user?.id) return;
      
      // Update hospital affiliation
      const response = await doctorsApi.update(user.id, { hospital: formData });
      
      // Update local state with the response data
      if (response.data?.hospital) {
        setHospital(response.data.hospital);
      } else {
        // If response doesn't include hospital, use form data
        setHospital(formData as HospitalData);
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating hospital affiliation:', error);
      setError(error?.response?.data?.message || 'Failed to update hospital affiliation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openDialog = () => {
    // Reset search state
    setSearchQuery('');
    setSelectedHospital(null);
    
    // If hospital exists, populate form data with hospital data
    if (hospital) {
      setFormData(hospital);
    } else {
      // Initialize empty form data for new hospital
      setFormData({
        name: '',
        phone: '',
        email: '',
        addressLine: '',
        city: '',
        state: '',
        pin: '',
        country: ''
      });
    }
    setIsDialogOpen(true);
  };
  
  // Fetch all hospitals
  const fetchAllHospitals = async () => {
    setIsLoadingHospitals(true);
    setError(null);
    
    try {
      const response = await hospitalsApi.getAll();
      
      if (response.data && Array.isArray(response.data)) {
        // If response.data is an array directly
        setAllHospitals(response.data);
        setDisplayedHospitals(response.data);
      } else if (response.data && response.data.hospitals && Array.isArray(response.data.hospitals)) {
        // If response.data has a hospitals property that is an array
        setAllHospitals(response.data.hospitals);
        setDisplayedHospitals(response.data.hospitals);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // If response.data has a data property that is an array
        setAllHospitals(response.data.data);
        setDisplayedHospitals(response.data.data);
      } else {
        console.error('Unexpected API response format:', response.data);
        setError('Failed to load hospitals. Unexpected data format.');
        setAllHospitals([]);
        setDisplayedHospitals([]);
      }
      
      if (
        (Array.isArray(response.data) && response.data.length === 0) ||
        (response.data.hospitals && response.data.hospitals.length === 0) ||
        (response.data.data && response.data.data.length === 0)
      ) {
        setError('No hospitals found in the system.');
      }
    } catch (error: any) {
      console.error('Error fetching hospitals:', error);
      setError('Failed to load hospitals. Please try again.');
      setAllHospitals([]);
      setDisplayedHospitals([]);
    } finally {
      setIsLoadingHospitals(false);
    }
  };
  
  // Function to assign doctor to hospital
  const assignToHospital = async (hospitalId: string) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await doctorsApi.assignToHospital(user.id, hospitalId);
      
      // Fetch updated doctor data to get the hospital
      const response = await doctorsApi.getById(user.id);
      if (response.data.hospital) {
        setHospital(response.data.hospital);
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error assigning to hospital:', error);
      setError(error?.response?.data?.message || 'Failed to assign to hospital. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to select a hospital
  const selectHospital = (hospital: HospitalData) => {
    setSelectedHospital(hospital);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><div className="text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div><p className="mt-2 text-sm text-muted-foreground">Loading...</p></div></div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">My Hospital</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Manage your hospital affiliation</p>
        </div>
        <Button onClick={openDialog} className="w-full sm:w-auto">
          {hospital ? 'Change Hospital' : 'Assign Hospital'}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-3 md:px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {hospital ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">{hospital.name}</CardTitle>
            <CardDescription>Your hospital affiliation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Hospital Name</div>
                  <div className="font-medium mt-1">{hospital.name}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Phone Number</div>
                  <div className="font-medium mt-1">{hospital.phone}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="font-medium mt-1 break-all">{hospital.email}</div>
                </div>
                
                <div className="sm:col-span-2">
                  <div className="text-sm font-medium text-muted-foreground">Address</div>
                  <div className="font-medium mt-1">{hospital.addressLine}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground">City</div>
                  <div className="font-medium mt-1">{hospital.city}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground">State</div>
                  <div className="font-medium mt-1">{hospital.state}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground">PIN Code</div>
                  <div className="font-medium mt-1">{hospital.pin}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Country</div>
                  <div className="font-medium mt-1">{hospital.country}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">No Hospital Affiliation</CardTitle>
            <CardDescription>Assign yourself to a hospital</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4 text-sm md:text-base">
                You haven&apos;t been assigned to any hospital yet. Search and select a hospital to affiliate with.
              </p>
              <Button onClick={openDialog} className="w-full sm:w-auto">
                Assign Hospital
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">{hospital ? 'Change Hospital Affiliation' : 'Assign Hospital'}</DialogTitle>
            <DialogDescription className="text-sm">
              Search and select a hospital to affiliate with
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/15 text-destructive px-3 md:px-4 py-2 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4 md:space-y-6">
            {/* Hospital search */}
            <div className="space-y-4">
              <div className="w-full">
                <Input
                    placeholder="Search hospitals by name, city, state, etc."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                />
              </div>
              
              {/* Hospitals list */}
              {isLoadingHospitals ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : displayedHospitals.length > 0 ? (
                <div className="border rounded-md divide-y max-h-[250px] md:max-h-[300px] overflow-y-auto">
                  {displayedHospitals.map((h) => (
                    <div
                      key={h.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedHospital?.id === h.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => selectHospital(h)}
                    >
                      <div className="font-medium text-sm md:text-base">{h.name}</div>
                      <div className="text-xs md:text-sm text-muted-foreground mt-1 break-words">
                        {h.addressLine}, {h.city}, {h.state}, {h.pin}
                      </div>
              </div>
                  ))}
              </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  {searchQuery.trim() !== '' 
                    ? 'No hospitals found matching your search criteria.' 
                    : 'No hospitals available.'}
              </div>
              )}
              
              {/* Selected hospital summary */}
              {selectedHospital && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base md:text-lg">Selected Hospital</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedHospital.name}
              </div>
                      <div>
                        <span className="font-medium">Address:</span> {selectedHospital.addressLine}, {selectedHospital.city}, {selectedHospital.state}, {selectedHospital.pin}
              </div>
                      <div>
                        <span className="font-medium">Contact:</span> {selectedHospital.phone}, {selectedHospital.email}
              </div>
              </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="button"
                disabled={isSubmitting || !selectedHospital}
                onClick={() => selectedHospital && assignToHospital(selectedHospital.id)}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Assigning...' : 'Assign to Hospital'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalsPage; 