'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { hospitalsApi } from '@/lib/api';
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
import { Loader2, Building2, Phone, Mail, MapPin, Plus } from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pin: string;
  country: string;
}

const CompounderHospitalsPage = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Modal state for adding hospitals
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState('');
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [displayedHospitals, setDisplayedHospitals] = useState<Hospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    fetchHospitals();
  }, [user]);

  // Fetch all hospitals when dialog opens
  useEffect(() => {
    if (isDialogOpen && allHospitals.length === 0) {
      fetchAllHospitals();
    }
  }, [isDialogOpen]);

  // Filter available hospitals based on search query in dialog
  useEffect(() => {
    if (hospitalSearchQuery.trim() === '') {
      setDisplayedHospitals(allHospitals);
    } else {
      const query = hospitalSearchQuery.toLowerCase();
      const filtered = allHospitals.filter(
        hospital =>
          hospital.name?.toLowerCase().includes(query) ||
          hospital.email?.toLowerCase().includes(query) ||
          hospital.phone?.includes(query) ||
          hospital.city?.toLowerCase().includes(query) ||
          hospital.state?.toLowerCase().includes(query) ||
          hospital.pin?.includes(query)
      );
      setDisplayedHospitals(filtered);
    }
  }, [hospitalSearchQuery, allHospitals]);

  const fetchHospitals = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // For now, this is a placeholder since we need compounder API endpoints
      // In the actual implementation, this would be:
      // const response = await compoundersApi.getById(user.id);
      // const affiliatedHospitals = response.data.hospitals || [];
      
      const hospitalsData: Hospital[] = [];
      
      setHospitals(hospitalsData);
      setFilteredHospitals(hospitalsData);
      
      if (hospitalsData.length === 0) {
        console.log('No hospitals affiliated with this compounder');
      }
    } catch (error: any) {
      console.error('Error fetching hospitals:', error);
      setError(error?.response?.data?.message || 'Failed to load hospitals. Please try again later.');
      setHospitals([]);
      setFilteredHospitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all hospitals for selection
  const fetchAllHospitals = async () => {
    setIsLoadingHospitals(true);
    setError(null);
    
    try {
      const response = await hospitalsApi.getAll(); // Get all hospitals
      
      let hospitalsData = [];
      
      // Handle different possible API response formats
      if (response.data && Array.isArray(response.data)) {
        hospitalsData = response.data;
      } else if (response.data && Array.isArray(response.data.hospitals)) {
        hospitalsData = response.data.hospitals;
      } else if (response.data && Array.isArray(response.data.data)) {
        hospitalsData = response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        setError('Failed to load hospitals. Unexpected data format.');
        hospitalsData = [];
      }
      
      // Filter out hospitals already affiliated with this compounder
      const availableHospitals = hospitalsData.filter(
        (hospital: Hospital) => !hospitals.some(affiliatedHospital => affiliatedHospital.id === hospital.id)
      );
      
      setAllHospitals(availableHospitals);
      setDisplayedHospitals(availableHospitals);
      
      if (availableHospitals.length === 0) {
        setError('No available hospitals to assign.');
      }
    } catch (error: any) {
      console.error('Error fetching all hospitals:', error);
      setError('Failed to load hospitals. Please try again.');
      setAllHospitals([]);
      setDisplayedHospitals([]);
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  useEffect(() => {
    // Filter hospitals based on search query
    if (!Array.isArray(hospitals)) {
      setFilteredHospitals([]);
      return;
    }
    
    if (searchQuery.trim() === '') {
      setFilteredHospitals(hospitals);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = hospitals.filter(
        hospital =>
          hospital.name?.toLowerCase().includes(query) ||
          hospital.email?.toLowerCase().includes(query) ||
          hospital.phone?.includes(query) ||
          hospital.city?.toLowerCase().includes(query) ||
          hospital.state?.toLowerCase().includes(query) ||
          hospital.pin?.includes(query)
      );
      setFilteredHospitals(filtered);
    }
  }, [searchQuery, hospitals]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const openAddDialog = () => {
    // Reset search state
    setHospitalSearchQuery('');
    setSelectedHospital(null);
    setError(null);
    setIsDialogOpen(true);
  };

  // Function to assign compounder to hospital
  const assignToHospital = async (hospitalId: string) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // This would need to be implemented in the API
      // await compoundersApi.assignToHospital(user.id, hospitalId);
      
      // For now, just log the action
      console.log(`Assigning compounder ${user.id} to hospital ${hospitalId}`);
      
      // Simulate success
      // Refresh hospitals list
      await fetchHospitals();
      
      // Remove the assigned hospital from available hospitals
      setAllHospitals(prev => prev.filter(h => h.id !== hospitalId));
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error assigning compounder to hospital:', error);
      setError(error?.response?.data?.message || 'Failed to assign to hospital. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to select a hospital
  const selectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading hospitals...</span>
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
        <h2 className="text-3xl font-bold">My Hospitals</h2>
        <div className="flex items-center gap-4">
          <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Hospital
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Hospitals you work with
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search hospitals by name, location, or contact..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {searchQuery ? `Found: ${filteredHospitals.length}` : `Total: ${hospitals.length}`} hospitals
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliated Hospitals</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHospitals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHospitals.map((hospital) => (
                <Card key={hospital.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar>
                        <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center">
                          {hospital.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-lg">{hospital.name || 'Unknown'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {hospital.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{hospital.email}</span>
                        </div>
                      )}
                      
                      {hospital.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{hospital.phone}</span>
                        </div>
                      )}
                      
                      {(hospital.city || hospital.state) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {hospital.addressLine}<br />
                            {hospital.city && hospital.state 
                              ? `${hospital.city}, ${hospital.state} ${hospital.pin}` 
                              : hospital.city || hospital.state}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery 
                ? 'No hospitals found matching your search criteria.' 
                : 'You are not affiliated with any hospitals yet. Click "Add Hospital" to search and join hospitals.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {hospitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hospital Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{hospitals.length}</div>
                <div className="text-sm text-muted-foreground">Total Hospitals</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {new Set(hospitals.filter(h => h.city).map(h => h.city)).size}
                </div>
                <div className="text-sm text-muted-foreground">Cities</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {new Set(hospitals.filter(h => h.state).map(h => h.state)).size}
                </div>
                <div className="text-sm text-muted-foreground">States</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Hospital Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Hospital Affiliation</DialogTitle>
            <DialogDescription>
              Search and select a hospital to work with
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            {/* Hospital search */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search hospitals by name, location, contact..."
                    value={hospitalSearchQuery}
                    onChange={(e) => setHospitalSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Hospitals list */}
              {isLoadingHospitals ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : displayedHospitals.length > 0 ? (
                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                  {displayedHospitals.map((hospital) => (
                    <div
                      key={hospital.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedHospital?.id === hospital.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => selectHospital(hospital)}
                    >
                      <div className="font-medium">{hospital.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {hospital.email} • {hospital.phone}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {hospital.addressLine}, {hospital.city}, {hospital.state} {hospital.pin}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {hospitalSearchQuery.trim() !== '' 
                    ? 'No hospitals found matching your search criteria.' 
                    : 'No available hospitals to join.'}
                </div>
              )}
              
              {/* Selected hospital summary */}
              {selectedHospital && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg">Selected Hospital</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Name:</span> {selectedHospital.name}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {selectedHospital.phone}
                        {selectedHospital.email && `, ${selectedHospital.email}`}
                      </div>
                      <div>
                        <span className="font-medium">Address:</span> {selectedHospital.addressLine}
                        {selectedHospital.city && `, ${selectedHospital.city}`}
                        {selectedHospital.state && `, ${selectedHospital.state}`}
                        {selectedHospital.pin && `, ${selectedHospital.pin}`}
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
                disabled={isSubmitting || !selectedHospital}
                onClick={() => selectedHospital && assignToHospital(selectedHospital.id)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  'Join Hospital'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompounderHospitalsPage; 