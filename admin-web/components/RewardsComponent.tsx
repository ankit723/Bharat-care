'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { rewardsApi, Referral, RewardTransaction, doctorsApi, patientsApi, hospitalsApi, clinicsApi, medStoresApi, checkupCentersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Copy, Gift, Award, RefreshCcw, BarChart3, Clock, Check, Send, UserPlus, Loader2, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type ReferralTarget = {
  id: string;
  name: string;
  role: string;
  details?: string;
};

const RewardsComponent = () => {
  const { user } = useAuth();
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [referralsGiven, setReferralsGiven] = useState<Referral[]>([]);
  const [referralsReceived, setReferralsReceived] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('points');
  
  // Referral form
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState<boolean>(false);
  const [referralForm, setReferralForm] = useState({
    referredId: '',
    referredName: '',
    referredRole: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Search state
  const [targetResults, setTargetResults] = useState<ReferralTarget[]>([]);
  const [targetSearchTerm, setTargetSearchTerm] = useState('');
  const [targetPopoverOpen, setTargetPopoverOpen] = useState(false);
  const [isTargetSearching, setIsTargetSearching] = useState(false);
  
  // Load initial data
  useEffect(() => {
    if (user) {
      fetchRewardPoints();
      fetchTransactions();
      fetchReferrals('given');
      fetchReferrals('received');
    }
  }, [user]);
  
  const fetchRewardPoints = async () => {
    try {
      const response = await rewardsApi.getUserPoints();
      setRewardPoints(response.data.rewardPoints);
    } catch (error) {
      console.error('Error fetching reward points:', error);
      toast.error('Failed to load reward points');
    }
  };
  
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await rewardsApi.getRewardHistory(20, 0);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchReferrals = async (type: 'given' | 'received') => {
    setIsLoading(true);
    try {
      const response = await rewardsApi.getUserReferrals(type, 20, 0);
      if (type === 'given') {
        setReferralsGiven(response.data.referrals);
      } else {
        setReferralsReceived(response.data.referrals);
      }
    } catch (error) {
      console.error(`Error fetching ${type} referrals:`, error);
      toast.error(`Failed to load ${type} referrals`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchDoctors = async (term: string) => {
    if (!term || term.length < 2) return [];
    
    try {
      const response = await doctorsApi.getAll({ search: term });
      const doctors = response.data.data || [];
      
      return doctors.map((doctor: any) => ({
        id: doctor.id,
        name: doctor.name,
        role: 'DOCTOR',
        details: `${doctor.specialization || 'General'} • ${doctor.city || ''}`
      }));
    } catch (error) {
      console.error('Error searching doctors:', error);
      return [];
    }
  };
  
  const searchPatients = async (term: string) => {
    if (!term || term.length < 2) return [];
    
    try {
      const response = await patientsApi.getAll({ search: term });
      const patients = response.data.data || [];
      
      return patients.map((patient: any) => ({
        id: patient.id,
        name: patient.name,
        role: 'PATIENT',
        details: `${patient.email} ${patient.phone ? `• ${patient.phone}` : ''}`
      }));
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  };
  
  const searchHospitals = async (term: string) => {
    if (!term || term.length < 2) return [];
    
    try {
      const response = await hospitalsApi.getAll({ search: term });
      const hospitals = response.data.data || [];
      
      return hospitals.map((hospital: any) => ({
        id: hospital.id,
        name: hospital.name,
        role: 'HOSPITAL',
        details: `${hospital.city || ''}`
      }));
    } catch (error) {
      console.error('Error searching hospitals:', error);
      return [];
    }
  };
  
  const searchMedStores = async (term: string) => {
    if (!term || term.length < 2) return [];
    
    try {
      const response = await medStoresApi.getAll({ search: term });
      const stores = response.data.data || [];
      
      return stores.map((store: any) => ({
        id: store.id,
        name: store.name,
        role: 'MEDSTORE',
        details: `${store.city || ''}`
      }));
    } catch (error) {
      console.error('Error searching med stores:', error);
      return [];
    }
  };
  
  const searchClinics = async (term: string) => {
    if (!term || term.length < 2) return [];
    
    try {
      const response = await clinicsApi.getAll({ search: term });
      const clinics = response.data.data || [];
      
      return clinics.map((clinic: any) => ({
        id: clinic.id,
        name: clinic.name,
        role: 'CLINIC',
        details: `${clinic.city || ''}`
      }));
    } catch (error) {
      console.error('Error searching clinics:', error);
      return [];
    }
  };
  
  const searchCheckupCenters = async (term: string) => {
    if (!term || term.length < 2) return [];
    
    try {
      const response = await checkupCentersApi.getAll({ search: term });
      const centers = response.data.data || [];
      
      return centers.map((center: any) => ({
        id: center.id,
        name: center.name,
        role: 'CHECKUP_CENTER',
        details: `${center.city || ''}`
      }));
    } catch (error) {
      console.error('Error searching checkup centers:', error);
      return [];
    }
  };
  
  // Using debounce for search terms
  useEffect(() => {
    const searchTargets = async () => {
      if (targetSearchTerm.length < 2) {
        setTargetResults([]);
        return;
      }
      
      setIsTargetSearching(true);
      
      try {
        let results: ReferralTarget[] = [];
        
        // Search in all entity types based on selected role
        switch (referralForm.referredRole) {
          case 'DOCTOR':
            results = await searchDoctors(targetSearchTerm) || [];
            break;
          case 'PATIENT':
            results = await searchPatients(targetSearchTerm) || [];
            break;
          case 'HOSPITAL':
            results = await searchHospitals(targetSearchTerm) || [];
            break;
          case 'MEDSTORE':
            results = await searchMedStores(targetSearchTerm) || [];
            break;
          case 'CLINIC':
            results = await searchClinics(targetSearchTerm) || [];
            break;
          case 'CHECKUP_CENTER':
            results = await searchCheckupCenters(targetSearchTerm) || [];
            break;
          case 'ALL':
          default:
            // If ALL or no role is selected, search in all entity types
            const doctors = await searchDoctors(targetSearchTerm) || [];
            const patients = await searchPatients(targetSearchTerm) || [];
            const hospitals = await searchHospitals(targetSearchTerm) || [];
            const medStores = await searchMedStores(targetSearchTerm) || [];
            const clinics = await searchClinics(targetSearchTerm) || [];
            const checkupCenters = await searchCheckupCenters(targetSearchTerm) || [];
            
            results = [
              ...doctors,
              ...patients,
              ...hospitals,
              ...medStores,
              ...clinics,
              ...checkupCenters
            ];
        }
        
        setTargetResults(results);
      } catch (error) {
        console.error('Error during target search:', error);
      } finally {
        setIsTargetSearching(false);
      }
    };
    
    // Add a small delay to avoid too many API calls while typing
    const timer = setTimeout(() => {
      searchTargets();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [targetSearchTerm, referralForm.referredRole]);
  
  const handleRoleChange = (value: string) => {
    setReferralForm({
      ...referralForm,
      referredRole: value,
      referredId: '',
      referredName: '',
    });
    setTargetSearchTerm('');
    setTargetResults([]);
  };
  
  const handleTargetSelect = (target: ReferralTarget) => {
    setReferralForm({
      ...referralForm,
      referredId: target.id,
      referredName: target.name,
      referredRole: target.role,
    });
    setTargetPopoverOpen(false);
  };
  
  const handleCreateReferral = async () => {
    if (!referralForm.referredId || !referralForm.referredRole || referralForm.referredRole === 'ALL') {
      toast.error('Please select a user to refer');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await rewardsApi.createReferral(
        referralForm.referredId,
        referralForm.referredRole
      );
      toast.success('Referral created successfully');
      setIsReferralDialogOpen(false);
      // Reset form and refresh data
      setReferralForm({ referredId: '', referredName: '', referredRole: '' });
      fetchReferrals('given');
      fetchRewardPoints();
    } catch (error: any) {
      console.error('Error creating referral:', error);
      toast.error(error.response?.data?.error || 'Failed to create referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReferralStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatReferralName = (referral: Referral, type: 'referrer' | 'referred') => {
    const prefix = type === 'referrer' ? 'referrer' : 'referred';
    const role = type === 'referrer' ? referral.referrerRole : referral.referredRole;
    
    switch (role) {
      case 'DOCTOR':
        return referral[`${prefix}Doctor`]?.name || 'Unknown Doctor';
      case 'PATIENT':
        return referral[`${prefix}Patient`]?.name || 'Unknown Patient';
      case 'HOSPITAL':
        return referral[`${prefix}Hospital`]?.name || 'Unknown Hospital';
      case 'MEDSTORE':
        return referral[`${prefix}MedStore`]?.name || 'Unknown Med Store';
      case 'CLINIC':
        return referral[`${prefix}Clinic`]?.name || 'Unknown Clinic';
      case 'CHECKUP_CENTER':
        return referral[`${prefix}CheckupCenter`]?.name || 'Unknown Checkup Center';
      case 'ADMIN':
        return type === 'referrer' ? 
          (referral.referrerAdmin?.name || 'Admin') : 
          'Admin';
      default:
        return 'Unknown';
    }
  };

  const copyReferralLink = () => {
    // In a real app, this would generate a shareable link with the user's referral code
    navigator.clipboard.writeText(`https://bharatcare.com/refer?id=${user?.userId || user?.id}`);
    toast.success('Referral link copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl flex items-center">
            <Award className="mr-2 h-6 w-6 text-primary" />
            Rewards & Referrals
          </CardTitle>
          <CardDescription>
            View your points, transaction history, and manage referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
            <div className="bg-primary/10 p-4 rounded-lg flex items-center space-x-4">
              <Gift className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Rewards</p>
                <p className="text-3xl font-bold">{rewardPoints} pts</p>
              </div>
            </div>
            
            <div className="flex-1" />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex items-center" onClick={copyReferralLink}>
                <Copy className="mr-2 h-4 w-4" /> 
                Copy Referral Link
              </Button>
              
              <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" /> 
                    Create Referral
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Referral</DialogTitle>
                    <DialogDescription>
                      Search and select a user you&apos;re referring to BharatCare.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="referredRole" className="text-sm font-medium">
                        User Role (Optional)
                      </label>
                      <Select
                        value={referralForm.referredRole}
                        onValueChange={handleRoleChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user role or search all" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Roles</SelectItem>
                          <SelectItem value="DOCTOR">Doctor</SelectItem>
                          <SelectItem value="PATIENT">Patient</SelectItem>
                          <SelectItem value="HOSPITAL">Hospital</SelectItem>
                          <SelectItem value="CLINIC">Clinic</SelectItem>
                          <SelectItem value="MEDSTORE">Medical Store</SelectItem>
                          <SelectItem value="CHECKUP_CENTER">Checkup Center</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Filter your search by selecting a role, or leave empty to search all roles
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Search Users
                      </label>
                      <Popover open={targetPopoverOpen} onOpenChange={setTargetPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={targetPopoverOpen}
                            className="w-full justify-between"
                          >
                            {referralForm.referredName || "Search for users..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <div className="flex items-center border-b px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder={`Search for users...`}
                                value={targetSearchTerm}
                                onChange={(e) => setTargetSearchTerm(e.target.value)}
                              />
                            </div>
                            {targetSearchTerm.length < 2 ? (
                              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                Type at least 2 characters to search
                              </div>
                            ) : isTargetSearching ? (
                              <div className="flex justify-center items-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                                <span className="text-sm text-muted-foreground">Searching...</span>
                              </div>
                            ) : (
                              <>
                                <CommandEmpty>No results found</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-auto">
                                  {targetResults.map((target) => (
                                    <CommandItem
                                      key={target.id}
                                      onSelect={() => handleTargetSelect(target)}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex flex-col">
                                        <span>{target.name}</span>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                          <span className="bg-slate-200 rounded-full px-1.5 py-0.5 text-[10px] font-medium mr-1">
                                            {target.role.replace('_', ' ')}
                                          </span>
                                          {target.details && target.details}
                                        </span>
                                      </div>
                                      <span
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          referralForm.referredId === target.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      >
                                        ✓
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsReferralDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateReferral} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" /> Create Referral</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="points">
                <BarChart3 className="h-4 w-4 mr-2" />
                Transaction History
              </TabsTrigger>
              <TabsTrigger value="given">
                <Send className="h-4 w-4 mr-2" />
                Referrals Given
              </TabsTrigger>
              <TabsTrigger value="received">
                <UserPlus className="h-4 w-4 mr-2" />
                Referrals Received
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="points" className="mt-0">
              <Card>
                <CardHeader className="py-4">
                  <div className="flex justify-between">
                    <CardTitle>Transaction History</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchTransactions}>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No transaction history yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                            <TableCell className="font-medium">
                              <span className={transaction.points > 0 ? "text-green-600" : "text-red-600"}>
                                {transaction.points > 0 ? "+" : ""}{transaction.points}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {transaction.transactionType.replace('_', ' ')}
                              </span>
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="given" className="mt-0">
              <Card>
                <CardHeader className="py-4">
                  <div className="flex justify-between">
                    <CardTitle>Referrals Given</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => fetchReferrals('given')}>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : referralsGiven.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Send className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>You haven&apos;t given any referrals yet.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setIsReferralDialogOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Referral
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Referred To</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referralsGiven.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell>{formatDate(referral.createdAt)}</TableCell>
                            <TableCell>{formatReferralName(referral, 'referred')}</TableCell>
                            <TableCell>{referral.referredRole.replace('_', ' ')}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReferralStatusBadgeColor(referral.status)}`}>
                                {referral.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {referral.status === 'COMPLETED' ? (
                                <span className="text-green-600">+{referral.pointsAwarded}</span>
                              ) : (
                                <span className="text-muted-foreground">{referral.pointsAwarded}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="received" className="mt-0">
              <Card>
                <CardHeader className="py-4">
                  <div className="flex justify-between">
                    <CardTitle>Referrals Received</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => fetchReferrals('received')}>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : referralsReceived.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No one has referred you yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Referred By</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referralsReceived.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell>{formatDate(referral.createdAt)}</TableCell>
                            <TableCell>{formatReferralName(referral, 'referrer')}</TableCell>
                            <TableCell>{referral.referrerRole.replace('_', ' ')}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReferralStatusBadgeColor(referral.status)}`}>
                                {referral.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {referral.status === 'COMPLETED' ? (
                                <span className="text-green-600">+{referral.pointsAwarded}</span>
                              ) : (
                                <span className="text-muted-foreground">{referral.pointsAwarded}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {referral.status === 'PENDING' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await rewardsApi.completeReferral(referral.id);
                                      toast.success('Referral completed successfully');
                                      fetchReferrals('received');
                                      fetchRewardPoints();
                                      fetchTransactions();
                                    } catch (error: any) {
                                      console.error('Error completing referral:', error);
                                      toast.error(error.response?.data?.error || 'Failed to complete referral');
                                    }
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Complete
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsComponent; 