'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { Loader2, Pill, Phone, Mail, MapPin } from 'lucide-react';

interface MedStore {
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

const CompounderMedStorePage = () => {
  const { user } = useAuth();
  const [medStore, setMedStore] = useState<MedStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Med store search and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [allMedStores, setAllMedStores] = useState<MedStore[]>([]);
  const [displayedMedStores, setDisplayedMedStores] = useState<MedStore[]>([]);
  const [isLoadingMedStores, setIsLoadingMedStores] = useState(false);
  const [selectedMedStore, setSelectedMedStore] = useState<MedStore | null>(null);

  useEffect(() => {
    const fetchMedStore = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // For now, this is a placeholder since we need compounder API endpoints
        // In the actual implementation, this would be:
        // const response = await compoundersApi.getById(user.id);
        // if (response.data.medStore) {
        //   setMedStore(response.data.medStore);
        // }
        
        setMedStore(null); // Placeholder
      } catch (error: any) {
        console.error('Error fetching med store data:', error);
        setError('Failed to load med store data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedStore();
  }, [user]);

  // Fetch all med stores when dialog opens
  useEffect(() => {
    if (isDialogOpen && allMedStores.length === 0) {
      fetchAllMedStores();
    }
  }, [isDialogOpen]);

  // Filter med stores based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setDisplayedMedStores(allMedStores);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allMedStores.filter(
        store =>
          store.name?.toLowerCase().includes(query) ||
          store.email?.toLowerCase().includes(query) ||
          store.phone?.includes(query) ||
          store.city?.toLowerCase().includes(query) ||
          store.state?.toLowerCase().includes(query) ||
          store.pin?.includes(query)
      );
      setDisplayedMedStores(filtered);
    }
  }, [searchQuery, allMedStores]);
  
  const openDialog = () => {
    // Reset search state
    setSearchQuery('');
    setSelectedMedStore(null);
    setError(null);
    setIsDialogOpen(true);
  };
  
  // Fetch all med stores (placeholder)
  const fetchAllMedStores = async () => {
    setIsLoadingMedStores(true);
    setError(null);
    
    try {
      // For now, this is a placeholder since there's no MedStore API in the existing lib/api.ts
      // In the actual implementation, this would be:
      // const response = await medStoresApi.getAll();
      
      // Placeholder med stores
      const medStoresData: MedStore[] = [];
      
      // Filter out med stores that already have a compounder
      const availableMedStores = medStoresData.filter((store: MedStore) => {
        // In the actual implementation, check if store already has a compounder
        return true; // Placeholder
      });
      
      setAllMedStores(availableMedStores);
      setDisplayedMedStores(availableMedStores);
      
      if (availableMedStores.length === 0) {
        setError('No available med stores found.');
      }
    } catch (error: any) {
      console.error('Error fetching med stores:', error);
      setError('Failed to load med stores. Please try again.');
      setAllMedStores([]);
      setDisplayedMedStores([]);
    } finally {
      setIsLoadingMedStores(false);
    }
  };
  
  // Function to assign compounder to med store
  const assignToMedStore = async (medStoreId: string) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // This would need to be implemented in the API
      // await compoundersApi.assignToMedStore(user.id, medStoreId);
      
      // For now, just log the action
      console.log(`Assigning compounder ${user.id} to med store ${medStoreId}`);
      
      // Simulate success - in real implementation, fetch the updated med store data
      if (selectedMedStore) {
        setMedStore(selectedMedStore);
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error assigning to med store:', error);
      setError(error?.response?.data?.message || 'Failed to assign to med store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to remove med store affiliation
  const removeMedStoreAffiliation = async () => {
    if (!user?.id || !medStore) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // This would need to be implemented in the API
      // await compoundersApi.removeFromMedStore(user.id);
      
      console.log(`Removing compounder ${user.id} from med store ${medStore.id}`);
      
      // Simulate success
      setMedStore(null);
    } catch (error: any) {
      console.error('Error removing med store affiliation:', error);
      setError(error?.response?.data?.message || 'Failed to remove med store affiliation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to select a med store
  const selectMedStore = (store: MedStore) => {
    setSelectedMedStore(store);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading med store data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">My Med Store</h2>
        <div className="flex gap-2">
          {medStore ? (
            <>
              <Button onClick={openDialog} variant="outline">
                Change Med Store
              </Button>
              <Button onClick={removeMedStoreAffiliation} variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Removing...' : 'Leave Med Store'}
              </Button>
            </>
          ) : (
            <Button onClick={openDialog}>
              <Pill className="h-4 w-4 mr-2" />
              Join Med Store
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {medStore ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              {medStore.name}
            </CardTitle>
            <CardDescription>Your current med store affiliation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Med Store Name</div>
                    <div className="font-medium text-lg">{medStore.name}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone Number</div>
                      <div className="font-medium">{medStore.phone}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{medStore.email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">
                        {medStore.addressLine}<br />
                        {medStore.city}, {medStore.state} {medStore.pin}<br />
                        {medStore.country}
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
            <CardTitle>No Med Store Affiliation</CardTitle>
            <CardDescription>Join a med store to start working</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't joined any med store yet. Search and select a med store to work with.
              </p>
              <Button onClick={openDialog}>
                <Pill className="h-4 w-4 mr-2" />
                Join Med Store
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{medStore ? 'Change Med Store Affiliation' : 'Join Med Store'}</DialogTitle>
            <DialogDescription>
              Search and select a med store to work with
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            {/* Med store search */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search med stores by name, location, contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Med stores list */}
              {isLoadingMedStores ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : displayedMedStores.length > 0 ? (
                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                  {displayedMedStores.map((store) => (
                    <div
                      key={store.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedMedStore?.id === store.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => selectMedStore(store)}
                    >
                      <div className="font-medium">{store.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {store.email} • {store.phone}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {store.addressLine}, {store.city}, {store.state} {store.pin}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {searchQuery.trim() !== '' 
                    ? 'No med stores found matching your search criteria.' 
                    : 'No available med stores to join.'}
                </div>
              )}
              
              {/* Selected med store summary */}
              {selectedMedStore && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg">Selected Med Store</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Name:</span> {selectedMedStore.name}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {selectedMedStore.phone}
                        {selectedMedStore.email && `, ${selectedMedStore.email}`}
                      </div>
                      <div>
                        <span className="font-medium">Address:</span> {selectedMedStore.addressLine}, {selectedMedStore.city}, {selectedMedStore.state} {selectedMedStore.pin}
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
                disabled={isSubmitting || !selectedMedStore}
                onClick={() => selectedMedStore && assignToMedStore(selectedMedStore.id)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  'Join Med Store'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompounderMedStorePage; 