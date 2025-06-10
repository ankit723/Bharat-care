'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { rewardsApi, Referral, PatientBasicInfo, patientsApi, doctorsApi, checkupCentersApi, medStoresApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  MoveRight, Award, RefreshCcw, Check, User, Stethoscope, Building, 
  Building2, FlaskConical, Loader2, Search
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type ReferralTarget = {
  id: string;
  name: string;
  role: string;
  details?: string;
};

type ReferralPatient = {
  id: string;
  name: string;
  details?: string;
};

const ServiceReferralComponent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('sent');
  const [sentReferrals, setSentReferrals] = useState<Referral[]>([]);
  const [receivedReferrals, setReceivedReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Referral form state
  const [referralForm, setReferralForm] = useState({
    referredId: '',
    referredName: '',
    referredRole: '',
    patientId: '',
    patientName: '',
    serviceType: 'DOCTOR_CONSULT' as 'DOCTOR_CONSULT' | 'MEDSTORE_PURCHASE' | 'CHECKUP_SERVICE',
    notes: '',
  });
  
  // Search state
  const [targetResults, setTargetResults] = useState<ReferralTarget[]>([]);
  const [patientResults, setPatientResults] = useState<ReferralPatient[]>([]);
  const [targetSearchTerm, setTargetSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [targetPopoverOpen, setTargetPopoverOpen] = useState(false);
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);
  const [isTargetSearching, setIsTargetSearching] = useState(false);
  const [isPatientSearching, setIsPatientSearching] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchReferrals('given');
      fetchReferrals('received');
    }
  }, [user]);
  
  const fetchReferrals = async (type: 'given' | 'received') => {
    setIsLoading(true);
    try {
      const response = await rewardsApi.getUserReferrals(type, 20, 0);
      // Filter only service referrals
      const serviceReferrals = response.data.referrals.filter(
        referral => referral.isServiceReferral
      );
      
      if (type === 'given') {
        setSentReferrals(serviceReferrals);
      } else {
        setReceivedReferrals(serviceReferrals);
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
  
  const searchPatients = async (term: string) => {
    if (!term || term.length < 2) return [];
    
    try {
      const response = await patientsApi.getAll({ search: term });
      const patients = response.data.data || [];
      
      return patients.map((patient: PatientBasicInfo) => ({
        id: patient.id,
        name: patient.name,
        details: `${patient.email} ${patient.phone ? `• ${patient.phone}` : ''}`
      }));
    } catch (error) {
      console.error('Error searching patients:', error);
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
        
        switch (referralForm.serviceType) {
          case 'DOCTOR_CONSULT':
            results = await searchDoctors(targetSearchTerm) || [];
            break;
          case 'MEDSTORE_PURCHASE':
            results = await searchMedStores(targetSearchTerm) || [];
            break;
          case 'CHECKUP_SERVICE':
            results = await searchCheckupCenters(targetSearchTerm) || [];
            break;
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
  }, [targetSearchTerm, referralForm.serviceType]);
  
  useEffect(() => {
    const searchPatientsEffect = async () => {
      if (patientSearchTerm.length < 2) {
        setPatientResults([]);
        return;
      }
      
      setIsPatientSearching(true);
      
      try {
        const results = await searchPatients(patientSearchTerm) || [];
        setPatientResults(results);
      } catch (error) {
        console.error('Error during patient search:', error);
      } finally {
        setIsPatientSearching(false);
      }
    };
    
    // Add a small delay to avoid too many API calls while typing
    const timer = setTimeout(() => {
      searchPatientsEffect();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [patientSearchTerm]);
  
  const handleServiceTypeChange = (value: string) => {
    setReferralForm({
      ...referralForm,
      serviceType: value as 'DOCTOR_CONSULT' | 'MEDSTORE_PURCHASE' | 'CHECKUP_SERVICE',
      referredId: '',
      referredName: '',
      referredRole: '',
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
  
  const handlePatientSelect = (patient: ReferralPatient) => {
    setReferralForm({
      ...referralForm,
      patientId: patient.id,
      patientName: patient.name,
    });
    setPatientPopoverOpen(false);
  };
  
  const handleCreateReferral = async () => {
    if (!referralForm.referredId || !referralForm.patientId || !referralForm.serviceType) {
      toast.error('Please select a patient and a referral target');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await rewardsApi.createServiceReferral({
        referredId: referralForm.referredId,
        referredRole: referralForm.referredRole,
        patientId: referralForm.patientId,
        serviceType: referralForm.serviceType,
        notes: referralForm.notes,
      });
      
      toast.success('Service referral created successfully');
      setIsDialogOpen(false);
      
      // Reset form
      setReferralForm({
        referredId: '',
        referredName: '',
        referredRole: '',
        patientId: '',
        patientName: '',
        serviceType: 'DOCTOR_CONSULT',
        notes: '',
      });
      
      // Refresh sent referrals
      fetchReferrals('given');
      
    } catch (error: any) {
      console.error('Error creating service referral:', error);
      toast.error(error.response?.data?.error || 'Failed to create referral');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCompleteReferral = async (referralId: string) => {
    try {
      await rewardsApi.completeReferral(referralId);
      toast.success('Referral completed successfully');
      fetchReferrals('received');
    } catch (error: any) {
      console.error('Error completing referral:', error);
      toast.error(error.response?.data?.error || 'Failed to complete referral');
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
      default:
        return 'Unknown';
    }
  };
  
  const formatServiceType = (type?: string) => {
    switch (type) {
      case 'DOCTOR_CONSULT':
        return 'Doctor Consultation';
      case 'MEDSTORE_PURCHASE':
        return 'Medicine Purchase';
      case 'CHECKUP_SERVICE':
        return 'Medical Checkup';
      default:
        return 'Service';
    }
  };
  
  const getServiceTypeIcon = (type?: string) => {
    switch (type) {
      case 'DOCTOR_CONSULT':
        return <Stethoscope className="h-4 w-4 text-blue-500" />;
      case 'MEDSTORE_PURCHASE':
        return <Building2 className="h-4 w-4 text-green-500" />;
      case 'CHECKUP_SERVICE':
        return <FlaskConical className="h-4 w-4 text-purple-500" />;
      default:
        return <Building className="h-4 w-4 text-gray-500" />;
    }
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
            Service Referrals
          </CardTitle>
          <CardDescription>
            Refer patients to other doctors, medical stores, and checkup centers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Manage your referrals</h3>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <MoveRight className="mr-2 h-4 w-4" /> 
                  Create Referral
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Service Referral</DialogTitle>
                  <DialogDescription>
                    Refer a patient to another healthcare provider
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Service Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service Type</label>
                    <Select 
                      value={referralForm.serviceType} 
                      onValueChange={handleServiceTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOCTOR_CONSULT">Doctor Consultation</SelectItem>
                        <SelectItem value="MEDSTORE_PURCHASE">Medicine Purchase</SelectItem>
                        <SelectItem value="CHECKUP_SERVICE">Medical Checkup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Patient Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Patient</label>
                    <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={patientPopoverOpen}
                          className="w-full justify-between"
                        >
                          {referralForm.patientName || "Select patient..."}
                          <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Search patients..." 
                              value={patientSearchTerm}
                              onChange={(e) => setPatientSearchTerm(e.target.value)}
                            />
                          </div>
                          {patientSearchTerm.length < 2 ? (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                              Type at least 2 characters to search
                            </div>
                          ) : isPatientSearching ? (
                            <div className="flex justify-center items-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                              <span className="text-sm text-muted-foreground">Searching...</span>
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>No patient found</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {patientResults.map((patient) => (
                                  <CommandItem
                                    key={patient.id}
                                    onSelect={() => handlePatientSelect(patient)}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex flex-col">
                                      <span>{patient.name}</span>
                                      {patient.details && (
                                        <span className="text-xs text-muted-foreground">
                                          {patient.details}
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        referralForm.patientId === patient.id
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
                  
                  {/* Referral Target */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {referralForm.serviceType === 'DOCTOR_CONSULT' ? 'Doctor' : 
                       referralForm.serviceType === 'MEDSTORE_PURCHASE' ? 'Medical Store' : 
                       'Checkup Center'}
                    </label>
                    <Popover open={targetPopoverOpen} onOpenChange={setTargetPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={targetPopoverOpen}
                          className="w-full justify-between"
                        >
                          {referralForm.referredName || 
                            `Select ${
                              referralForm.serviceType === 'DOCTOR_CONSULT' ? 'doctor' : 
                              referralForm.serviceType === 'MEDSTORE_PURCHASE' ? 'medical store' : 
                              'checkup center'
                            }...`
                          }
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder={`Search ${
                                referralForm.serviceType === 'DOCTOR_CONSULT' ? 'doctors' : 
                                referralForm.serviceType === 'MEDSTORE_PURCHASE' ? 'medical stores' : 
                                'checkup centers'
                              }...`}
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
                                      {target.details && (
                                        <span className="text-xs text-muted-foreground">
                                          {target.details}
                                        </span>
                                      )}
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
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes (Optional)
                    </label>
                    <Textarea
                      id="notes"
                      value={referralForm.notes}
                      onChange={(e) => setReferralForm({...referralForm, notes: e.target.value})}
                      placeholder="Add any special instructions or context for this referral"
                      rows={3}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReferral} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                    ) : (
                      'Create Referral'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="sent">
                <MoveRight className="h-4 w-4 mr-2" />
                Sent Referrals
              </TabsTrigger>
              <TabsTrigger value="received">
                <Award className="h-4 w-4 mr-2" />
                Received Referrals
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sent" className="mt-0">
              <Card>
                <CardHeader className="py-4">
                  <div className="flex justify-between">
                    <CardTitle>Sent Referrals</CardTitle>
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
                  ) : sentReferrals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MoveRight className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>You haven&apos;t sent any service referrals yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Create Referral
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Referred To</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reward</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sentReferrals.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell>{formatDate(referral.createdAt)}</TableCell>
                            <TableCell>
                              {referral.patientDetails?.name || 'Unknown Patient'}
                            </TableCell>
                            <TableCell>{formatReferralName(referral, 'referred')}</TableCell>
                            <TableCell className="flex items-center">
                              {getServiceTypeIcon(referral.serviceType)}
                              <span className="ml-2">{formatServiceType(referral.serviceType)}</span>
                            </TableCell>
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
                    <CardTitle>Received Referrals</CardTitle>
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
                  ) : receivedReferrals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>You haven&apos;t received any service referrals yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Referred By</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receivedReferrals.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell>{formatDate(referral.createdAt)}</TableCell>
                            <TableCell>
                              {referral.patientDetails?.name || 'Unknown Patient'}
                            </TableCell>
                            <TableCell>{formatReferralName(referral, 'referrer')}</TableCell>
                            <TableCell className="flex items-center">
                              {getServiceTypeIcon(referral.serviceType)}
                              <span className="ml-2">{formatServiceType(referral.serviceType)}</span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {referral.notes || '-'}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReferralStatusBadgeColor(referral.status)}`}>
                                {referral.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {referral.status === 'PENDING' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCompleteReferral(referral.id)}
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

export default ServiceReferralComponent; 