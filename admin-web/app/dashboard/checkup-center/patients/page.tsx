'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { checkupCentersApi, patientsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Search, UserPlus, XCircle, BadgeInfo } from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
}

interface CheckupCenter {
  id: string;
  name: string;
  patients: Patient[];
}

const CheckupCenterPatientsPage = () => {
  const { user } = useAuth();
  const [centerInfo, setCenterInfo] = useState<CheckupCenter | null>(null);
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]); // For search modal
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedPatients, setDisplayedPatients] = useState<Patient[]>([]); // For search modal
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCenterData = useCallback(async () => {
    if (!user || user.role !== 'CHECKUP_CENTER') return;
    setIsLoading(true);
    try {
      const response = await checkupCentersApi.getById(user.id);
      setCenterInfo(response.data);
      setAssignedPatients(response.data.patients || []);
    } catch (err: any) {
      console.error('Error fetching checkup center data:', err);
      setError(err.response?.data?.message || 'Failed to load center data.');
      toast.error(err.response?.data?.message || 'Failed to load center data.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCenterData();
  }, [fetchCenterData]);

  const fetchAllPatientsForModal = async () => {
    if (allPatients.length > 0 && !searchTerm) {
        setDisplayedPatients(allPatients.filter(p => !assignedPatients.find(ap => ap.id === p.id)));
        return; // Avoid refetching if already loaded and no search term
    }
    setIsSubmitting(true);
    try {
      const response = await patientsApi.getAll({ limit: 50 }); // Fetch a reasonable number for modal
      
      let patientsData = [];
      
      // Handle different possible API response formats
      if (response.data && Array.isArray(response.data)) {
        patientsData = response.data;
      } else if (response.data && Array.isArray(response.data.patients)) {
        patientsData = response.data.patients;
      } else if (response.data && Array.isArray(response.data.data)) {
        patientsData = response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        patientsData = [];
      }
      
      const availablePatients = patientsData.filter((p: Patient) => 
        !assignedPatients.find(ap => ap.id === p.id)
      );
      setAllPatients(availablePatients);
      setDisplayedPatients(availablePatients);
      if (availablePatients.length === 0) {
        toast.info("No new patients available to assign or all patients are already assigned.")
      }
    } catch (err: any) {
      console.error('Error fetching all patients:', err);
      toast.error(err.response?.data?.message || 'Failed to load patients for assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchAllPatientsForModal();
    }
  }, [isModalOpen]);

 useEffect(() => {
    const filtered = searchTerm.trim() === ''
        ? allPatients.filter(p => !assignedPatients.find(ap => ap.id === p.id))
        : allPatients.filter(
            (patient) =>
              (patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              patient.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
              !assignedPatients.find(ap => ap.id === patient.id)
          );
    setDisplayedPatients(filtered);
  }, [searchTerm, allPatients, assignedPatients]);

  const handleAssignPatient = async () => {
    if (!user || !selectedPatientForModal || !centerInfo) return;
    setIsSubmitting(true);
    try {
      await checkupCentersApi.assignPatient(centerInfo.id, selectedPatientForModal.id);
      toast.success(`${selectedPatientForModal.name} has been assigned successfully.`);
      setIsModalOpen(false);
      setSelectedPatientForModal(null);
      setSearchTerm('');
      fetchCenterData(); // Refresh assigned patients list
    } catch (err: any) {
      console.error('Error assigning patient:', err);
      toast.error(err.response?.data?.message || 'Failed to assign patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePatient = async (patientId: string) => {
    if (!user || !centerInfo) return;
    const patientToRemove = assignedPatients.find(p => p.id === patientId);
    if (!patientToRemove) return;

    if (!confirm(`Are you sure you want to remove ${patientToRemove.name} from your center?`)) return;

    setIsSubmitting(true);
    try {
      await checkupCentersApi.removePatient(centerInfo.id, patientId);
      toast.success(`${patientToRemove.name} has been removed successfully.`);
      fetchCenterData(); // Refresh assigned patients list
    } catch (err: any) {
      console.error('Error removing patient:', err);
      toast.error(err.response?.data?.message || 'Failed to remove patient.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openAssignModal = () => {
    setSearchTerm('');
    setSelectedPatientForModal(null);
    // fetchAllPatientsForModal(); // Data is fetched when modal opens via useEffect [isModalOpen]
    setIsModalOpen(true);
  };

  if (isLoading && !centerInfo) {
    return <div className="flex justify-center items-center h-screen"><div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-sm text-muted-foreground">Loading patient data...</p></div></div>;
  }

  if (error && !centerInfo) {
    return <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded-md text-sm">{error}</div>;
  }

  if (!centerInfo) {
    return <div className="p-4 text-center text-sm md:text-base">Checkup Center information not found or access denied.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Patients</h1>
          <p className="text-sm md:text-lg text-gray-500 mt-1">View and manage patients associated with {centerInfo.name}.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAssignModal} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
              <UserPlus className="mr-2 h-5 w-5" /> 
              <span className="hidden sm:inline">Assign New Patient</span>
              <span className="sm:hidden">Assign Patient</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Assign Patient to {centerInfo.name}</DialogTitle>
              <DialogDescription className="text-sm">Search for a patient by name or email and assign them to your center.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {isSubmitting && displayedPatients.length === 0 && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
              {!isSubmitting && displayedPatients.length === 0 && searchTerm && (
                <p className="text-center text-gray-500 py-4 text-sm">No patients found matching &quot;{searchTerm}&quot;.</p>
              )}
              {!isSubmitting && displayedPatients.length === 0 && !searchTerm && allPatients.length > 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">All available patients are listed. Or no unassigned patients found.</p>
              )}
              {!isSubmitting && allPatients.length === 0 && !searchTerm && (
                 <p className="text-center text-gray-500 py-4 text-sm">No patients available in the system to assign.</p>
              )}

              {displayedPatients.length > 0 && (
                <div className="border rounded-md divide-y max-h-[250px] md:max-h-[300px] overflow-y-auto">
                  {displayedPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedPatientForModal?.id === patient.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedPatientForModal(patient)}
                    >
                      <div className="text-sm md:text-base font-medium text-gray-800">{patient.name}</div>
                      <div className="text-xs md:text-sm text-gray-500 mt-1">{patient.email}</div>
                      {(patient.city || patient.state) && (
                        <div className="text-xs text-gray-400 mt-1">{patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.city || patient.state}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedPatientForModal && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="font-medium text-gray-800 text-sm md:text-base">Selected Patient</h4>
                  <p className="text-sm text-gray-600">{selectedPatientForModal.name} - {selectedPatientForModal.email}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || !selectedPatientForModal}
                onClick={handleAssignPatient}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {isSubmitting ? 'Assigning...' : 'Assign Patient'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {assignedPatients.length > 0 ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-gray-700">Assigned Patients ({assignedPatients.length})</CardTitle>
            <CardDescription className="text-sm text-gray-500">Patients currently associated with your center.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {assignedPatients.map((patient) => (
                <Card key={patient.id} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{patient.name}</div>
                          <div className="text-sm text-gray-600 break-all">{patient.email}</div>
                          <div className="text-sm text-gray-600">{patient.phone}</div>
                          {(patient.city || patient.state) && (
                            <div className="text-sm text-gray-500">{patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.city || patient.state}</div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          onClick={() => handleRemovePatient(patient.id)}
                          disabled={isSubmitting}
                          title="Remove Patient"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium text-gray-800">{patient.name}</TableCell>
                      <TableCell className="text-gray-600 break-all">{patient.email}</TableCell>
                      <TableCell className="text-gray-600">{patient.phone}</TableCell>
                      <TableCell className="text-gray-600">
                        {patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.city || patient.state || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemovePatient(patient.id)}
                          disabled={isSubmitting}
                          title="Remove Patient from Center"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-gray-700">No Patients Assigned</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <BadgeInfo className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-sm md:text-base">No patients are currently assigned to your checkup center.</p>
            <p className="text-gray-500 text-sm mt-1">Use the &quot;Assign New Patient&quot; button to add patients.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CheckupCenterPatientsPage; 