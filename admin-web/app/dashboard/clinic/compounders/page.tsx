'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { compoundersApi, clinicsApi } from '@/lib/api';
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
import { Loader2, Pill, Phone, Mail, MapPin, Calendar } from 'lucide-react';

interface Compounder {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
  experience?: number;
  createdAt?: string;
}

const ClinicCompoundersPage = () => {
  const { user } = useAuth();
  const [compounder, setCompounder] = useState<Compounder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Compounder search and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [allCompounders, setAllCompounders] = useState<Compounder[]>([]);
  const [displayedCompounders, setDisplayedCompounders] = useState<Compounder[]>([]);
  const [isLoadingCompounders, setIsLoadingCompounders] = useState(false);
  const [selectedCompounder, setSelectedCompounder] = useState<Compounder | null>(null);

  useEffect(() => {
    const fetchCompounder = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch clinic information to get assigned compounder
        const response = await clinicsApi.getById(user.id);
        if (response.data && response.data.compounder) {
          setCompounder(response.data.compounder);
        } else {
          setCompounder(null);
        }
      } catch (error: any) {
        console.error('Error fetching compounder data:', error);
        setError('Failed to load compounder data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompounder();
  }, [user]);

  // Fetch all compounders when dialog opens
  useEffect(() => {
    if (isDialogOpen && allCompounders.length === 0) {
      fetchAllCompounders();
    }
  }, [isDialogOpen]);

  // Filter compounders based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setDisplayedCompounders(allCompounders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allCompounders.filter(
        compounder =>
          compounder.name?.toLowerCase().includes(query) ||
          compounder.email?.toLowerCase().includes(query) ||
          compounder.phone?.includes(query) ||
          compounder.city?.toLowerCase().includes(query) ||
          compounder.state?.toLowerCase().includes(query)
      );
      setDisplayedCompounders(filtered);
    }
  }, [searchQuery, allCompounders]);
  
  const openDialog = () => {
    // Reset search state
    setSearchQuery('');
    setSelectedCompounder(null);
    setError(null);
    setIsDialogOpen(true);
  };
  
  // Fetch all compounders
  const fetchAllCompounders = async () => {
    setIsLoadingCompounders(true);
    setError(null);
    
    try {
      const response = await compoundersApi.getAll();
      
      let compoundersData = [];
      
      if (response.data && Array.isArray(response.data)) {
        compoundersData = response.data;
      } else if (response.data && response.data.compounders && Array.isArray(response.data.compounders)) {
        compoundersData = response.data.compounders;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        compoundersData = response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        setError('Failed to load compounders. Unexpected data format.');
        compoundersData = [];
      }
      
      // Filter out compounders that already have a clinic (one-to-one relationship)
      const availableCompounders = compoundersData.filter((comp: Compounder) => {
        // In the actual implementation, check if compounder already has a clinic
        // and exclude the current compounder if one is assigned
        return comp.id !== compounder?.id;
      });
      
      setAllCompounders(availableCompounders);
      setDisplayedCompounders(availableCompounders);
      
      if (availableCompounders.length === 0) {
        setError('No available compounders found.');
      }
    } catch (error: any) {
      console.error('Error fetching compounders:', error);
      setError('Failed to load compounders. Please try again.');
      setAllCompounders([]);
      setDisplayedCompounders([]);
    } finally {
      setIsLoadingCompounders(false);
    }
  };
  
  // Function to assign compounder to clinic
  const assignToClinic = async (compounderId: string) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await clinicsApi.assignCompounder(user.id, compounderId);
      
      // Update local state with the assigned compounder
      if (selectedCompounder) {
        setCompounder(selectedCompounder);
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error assigning compounder to clinic:', error);
      setError(error?.response?.data?.error || 'Failed to assign compounder to clinic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to remove compounder from clinic
  const removeCompounderFromClinic = async () => {
    if (!user?.id || !compounder) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await clinicsApi.removeCompounder(user.id);
      
      // Clear the compounder from local state
      setCompounder(null);
    } catch (error: any) {
      console.error('Error removing compounder from clinic:', error);
      setError(error?.response?.data?.error || 'Failed to remove compounder from clinic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to select a compounder
  const selectCompounder = (compounder: Compounder) => {
    setSelectedCompounder(compounder);
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
        <span className="ml-2">Loading compounder data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Clinic Compounder</h2>
        <div className="flex gap-2">
          {compounder ? (
            <>
              <Button onClick={openDialog} variant="outline">
                Change Compounder
              </Button>
              <Button onClick={removeCompounderFromClinic} variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Removing...' : 'Remove Compounder'}
              </Button>
            </>
          ) : (
            <Button onClick={openDialog}>
              <Pill className="h-4 w-4 mr-2" />
              Assign Compounder
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {compounder ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              {compounder.name}
            </CardTitle>
            <CardDescription>Compounder assigned to this clinic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center">
                    {compounder.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-xl">{compounder.name}</div>
                  <div className="text-muted-foreground">Pharmaceutical Compounder</div>
                  {compounder.experience && (
                    <div className="text-sm text-muted-foreground">{compounder.experience} years experience</div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{compounder.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{compounder.phone}</div>
                    </div>
                  </div>
                  
                  {compounder.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Joined</div>
                        <div className="font-medium">{formatDate(compounder.createdAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {(compounder.city || compounder.state) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <div className="text-sm text-muted-foreground">Location</div>
                        <div className="font-medium">
                          {compounder.addressLine && `${compounder.addressLine}`}<br />
                          {compounder.city && compounder.state 
                            ? `${compounder.city}, ${compounder.state}` 
                            : compounder.city || compounder.state}
                          {compounder.pin && ` ${compounder.pin}`}<br />
                          {compounder.country}
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
            <CardTitle>No Compounder Assigned</CardTitle>
            <CardDescription>Assign a compounder to your clinic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Pill className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Compounder Assigned</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your clinic doesn&apos;t have a compounder assigned yet. Search and select a compounder to work at your clinic.
              </p>
              <Button onClick={openDialog}>
                <Pill className="h-4 w-4 mr-2" />
                Assign Compounder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{compounder ? 'Change Clinic Compounder' : 'Assign Compounder'}</DialogTitle>
            <DialogDescription>
              Search and select a compounder to work at your clinic
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            {/* Compounder search */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search compounders by name, email, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Compounders list */}
              {isLoadingCompounders ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : displayedCompounders.length > 0 ? (
                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                  {displayedCompounders.map((compounderItem) => (
                    <div
                      key={compounderItem.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedCompounder?.id === compounderItem.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => selectCompounder(compounderItem)}
                    >
                      <div className="font-medium">{compounderItem.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {compounderItem.email} • {compounderItem.phone}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {compounderItem.city && compounderItem.state 
                          ? `${compounderItem.city}, ${compounderItem.state}` 
                          : compounderItem.city || compounderItem.state || 'Location not specified'}
                        {compounderItem.experience && ` • ${compounderItem.experience} years exp.`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {searchQuery.trim() !== '' 
                    ? 'No compounders found matching your search criteria.' 
                    : 'No available compounders to assign.'}
                </div>
              )}
              
              {/* Selected compounder summary */}
              {selectedCompounder && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg">Selected Compounder</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Name:</span> {selectedCompounder.name}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {selectedCompounder.phone}
                        {selectedCompounder.email && `, ${selectedCompounder.email}`}
                      </div>
                      {(selectedCompounder.city || selectedCompounder.state) && (
                        <div>
                          <span className="font-medium">Location:</span> 
                          {selectedCompounder.city && ` ${selectedCompounder.city}`}
                          {selectedCompounder.state && `, ${selectedCompounder.state}`}
                        </div>
                      )}
                      {selectedCompounder.experience && (
                        <div>
                          <span className="font-medium">Experience:</span> {selectedCompounder.experience} years
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
                disabled={isSubmitting || !selectedCompounder}
                onClick={() => selectedCompounder && assignToClinic(selectedCompounder.id)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  'Assign Compounder'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicCompoundersPage; 