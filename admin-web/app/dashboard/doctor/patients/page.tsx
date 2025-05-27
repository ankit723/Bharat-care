'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { patientsApi, doctorsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Search, UserPlus, XCircle, BadgeInfo, Calendar as CalendarIcon, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pin?: string;
  country?: string;
  doctorNextVisit?: Date | null;
}

type SortField = 'name' | 'email' | 'city' | 'doctorNextVisit';
type SortOrder = 'asc' | 'desc';

const DoctorPatientsPage = () => {
  const { user } = useAuth();
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [allUnassignedPatients, setAllUnassignedPatients] = useState<Patient[]>([]);
  
  // State for the main page patient list
  const [mainSearchTerm, setMainSearchTerm] = useState('');
  const [displayedAssignedPatients, setDisplayedAssignedPatients] = useState<Patient[]>([]);
  
  // State for the Assign New Patient modal
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalDisplayedUnassignedPatients, setModalDisplayedUnassignedPatients] = useState<Patient[]>([]);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<Patient | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // State for Patient Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Patient | null>(null);
  const [selectedDateForVisit, setSelectedDateForVisit] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const fetchDoctorData = useCallback(async () => {
    if (!user || user.role !== 'DOCTOR') return;
    setIsLoading(true);
    try {
      const response = await doctorsApi.getById(user.id);
      const fetchedPatients = response.data.patients || [];
      setAssignedPatients(fetchedPatients);
    } catch (err: any) {
      console.error('Error fetching doctor data:', err);
      setError(err.response?.data?.message || 'Failed to load patient data.');
      toast.error(err.response?.data?.message || 'Failed to load patient data.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDoctorData();
  }, [fetchDoctorData]);

  const fetchAllPatientsForModal = async () => {
    setIsSubmitting(true);
    try {
      const response = await patientsApi.getAll({ limit: 200 });
      
      let patientsData = [];
      if (response.data && Array.isArray(response.data)) {
        patientsData = response.data;
      } else if (response.data && Array.isArray(response.data.patients)) {
        patientsData = response.data.patients;
      } else if (response.data && Array.isArray(response.data.data)) {
        patientsData = response.data.data;
      } else {
        console.error('Unexpected API response format for all patients:', response.data);
        patientsData = [];
      }
      
      const assignedPatientIds = new Set(assignedPatients.map(ap => ap.id));
      const availablePatients = patientsData.filter((p: Patient) => !assignedPatientIds.has(p.id));
      
      setAllUnassignedPatients(availablePatients);
      setModalDisplayedUnassignedPatients(availablePatients);
      
      if (availablePatients.length === 0 && !modalSearchTerm) {
        toast.info("No new patients available to assign.");
      }
    } catch (err: any) {
      console.error('Error fetching all patients for modal:', err);
      toast.error(err.response?.data?.message || 'Failed to load patients for assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isAssignModalOpen) {
      setModalSearchTerm('');
      setSelectedPatientForModal(null);
      fetchAllPatientsForModal();
    } else {
      setModalSearchTerm('');
      setAllUnassignedPatients([]);
      setModalDisplayedUnassignedPatients([]);
      setSelectedPatientForModal(null);
    }
  }, [isAssignModalOpen]);

  useEffect(() => {
    if (isAssignModalOpen) {
      const filtered = modalSearchTerm.trim() === ''
        ? allUnassignedPatients
        : allUnassignedPatients.filter(
          (patient) =>
              patient.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
              patient.email.toLowerCase().includes(modalSearchTerm.toLowerCase())
          );
      setModalDisplayedUnassignedPatients(filtered);
    }
  }, [modalSearchTerm, allUnassignedPatients, isAssignModalOpen]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  useEffect(() => {
    const filterMainPatients = (patients: Patient[]) => {
      return patients.filter(patient => 
        patient.name.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
        patient.phone.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
        patient.city?.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
        patient.state?.toLowerCase().includes(mainSearchTerm.toLowerCase())
      );
    };

    const sortMainPatients = (patients: Patient[]) => {
      return [...patients].sort((a, b) => {
        let compareResult = 0;
        switch (sortField) {
          case 'name': compareResult = a.name.localeCompare(b.name); break;
          case 'email': compareResult = a.email.localeCompare(b.email); break;
          case 'city': compareResult = (a.city || '').localeCompare(b.city || ''); break;
          case 'doctorNextVisit':
            const dateA = a.doctorNextVisit ? new Date(a.doctorNextVisit).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
            const dateB = b.doctorNextVisit ? new Date(b.doctorNextVisit).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
            compareResult = dateA - dateB;
            break;
        }
        return sortOrder === 'asc' ? compareResult : -compareResult;
      });
    };

    const filtered = filterMainPatients(assignedPatients);
    const sorted = sortMainPatients(filtered);
    setDisplayedAssignedPatients(sorted);
  }, [mainSearchTerm, assignedPatients, sortField, sortOrder]);

  const handleAssignPatient = async () => {
    if (!user || !selectedPatientForModal) return;
    setIsSubmitting(true);
    try {
      await doctorsApi.assignToPatient(user.id, selectedPatientForModal.id);
      toast.success(`${selectedPatientForModal.name} has been assigned successfully.`);
      setIsAssignModalOpen(false);
      fetchDoctorData();
    } catch (err: any) {
      console.error('Error assigning patient:', err);
      toast.error(err.response?.data?.message || 'Failed to assign patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePatient = async (patientId: string) => {
    if (!user) return;
    const patientToRemove = assignedPatients.find(p => p.id === patientId);
    if (!patientToRemove) return;

    if (!confirm(`Are you sure you want to remove ${patientToRemove.name} from your patient list?`)) return;

    setIsSubmitting(true);
    try {
      await doctorsApi.removeFromPatient(user.id, patientId);
      toast.success(`${patientToRemove.name} has been removed successfully.`);
      fetchDoctorData();
    } catch (err: any) {
      console.error('Error removing patient:', err);
      toast.error(err.response?.data?.message || 'Failed to remove patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignModal = () => {
    setIsAssignModalOpen(true);
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatientForDetails(patient);
    setSelectedDateForVisit(patient.doctorNextVisit ? new Date(patient.doctorNextVisit) : undefined);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateNextVisit = async () => {
    if (!user || !selectedPatientForDetails || !selectedDateForVisit) return;
    setIsSubmitting(true);
    try {
      await doctorsApi.updatePatientNextVisit(user.id, selectedPatientForDetails.id, selectedDateForVisit);
      toast.success('Next visit date updated successfully');
      setIsDetailsModalOpen(false);
      setSelectedDateForVisit(undefined);
      fetchDoctorData();
    } catch (err: any) {
      console.error('Error updating next visit date:', err);
      toast.error(err.response?.data?.message || 'Failed to update next visit date');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !assignedPatients.length) {
    return <div className="flex justify-center items-center h-screen"><div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-sm text-muted-foreground">Loading patient data...</p></div></div>;
  }

  if (error && !assignedPatients.length) {
    return <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded-md text-sm">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Patients</h1>
          <p className="text-sm md:text-lg text-gray-500 mt-1">View and manage patients assigned to you.</p>
        </div>
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAssignModal} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
              <UserPlus className="mr-2 h-5 w-5" /> 
              <span className="hidden sm:inline">Assign New Patient</span>
              <span className="sm:hidden">Assign Patient</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Assign Patient</DialogTitle>
              <DialogDescription className="text-sm">Search for a patient by name or email and assign them to your care.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Search patients by name or email..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {isSubmitting && modalDisplayedUnassignedPatients.length === 0 && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
              {!isSubmitting && modalDisplayedUnassignedPatients.length === 0 && modalSearchTerm && (
                <p className="text-center text-gray-500 py-4 text-sm">No patients found matching &quot;{modalSearchTerm}&quot;.</p>
              )}
              {!isSubmitting && modalDisplayedUnassignedPatients.length === 0 && !modalSearchTerm && allUnassignedPatients.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">No patients available in the system to assign.</p>
              )}

              {modalDisplayedUnassignedPatients.length > 0 && (
                <div className="border rounded-md divide-y max-h-[250px] md:max-h-[300px] overflow-y-auto">
                  {modalDisplayedUnassignedPatients.map((patient) => (
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
                onClick={() => setIsAssignModalOpen(false)}
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
            <CardTitle className="text-lg md:text-xl text-gray-700">
              Assigned Patients ({assignedPatients.length})
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Patients currently under your care.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Search your patients by name, email, phone, or location..."
                  value={mainSearchTerm}
                  onChange={(e) => setMainSearchTerm(e.target.value)}
                  className="pl-10"
                />
                    </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Name {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email {getSortIcon('email')}
                      </div>
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('city')}
                    >
                      <div className="flex items-center">
                        Location {getSortIcon('city')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('doctorNextVisit')}
                    >
                      <div className="flex items-center">
                        Next Visit {getSortIcon('doctorNextVisit')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedAssignedPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium text-gray-800">{patient.name}</TableCell>
                      <TableCell className="text-gray-600 break-all">{patient.email}</TableCell>
                      <TableCell className="text-gray-600">{patient.phone}</TableCell>
                      <TableCell className="text-gray-600">
                        {patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.city || patient.state || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {patient.doctorNextVisit ? format(new Date(patient.doctorNextVisit), 'PPP') : 'Not scheduled'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 h-auto"
                          onClick={() => handleViewDetails(patient)}
                          title="View Details & Schedule Visit"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 h-auto"
                          onClick={() => handleRemovePatient(patient.id)}
                          disabled={isSubmitting}
                          title="Remove Patient"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {displayedAssignedPatients.map((patient) => (
                <Card key={patient.id} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{patient.name}</div>
                          <div className="text-sm text-gray-600 break-all">{patient.email}</div>
                          <div className="text-sm text-gray-600">{patient.phone}</div>
                          {(patient.city || patient.state) && (
                            <div className="text-sm text-gray-500">
                              {patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.city || patient.state}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 mt-2">
                            Next Visit: {patient.doctorNextVisit ? format(new Date(patient.doctorNextVisit), 'PPP') : 'Not scheduled'}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 items-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 h-auto"
                            onClick={() => handleViewDetails(patient)}
                            title="View Details & Schedule Visit"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 h-auto"
                            onClick={() => handleRemovePatient(patient.id)}
                            disabled={isSubmitting}
                            title="Remove Patient"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
            <p className="text-gray-500 text-sm md:text-base">No patients are currently assigned to your care.</p>
            <p className="text-gray-500 text-sm mt-1">Use the &quot;Assign New Patient&quot; button to add patients.</p>
          </CardContent>
        </Card>
      )}

      {/* Patient Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatientForDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{selectedPatientForDetails.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 break-all">{selectedPatientForDetails.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{selectedPatientForDetails.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{selectedPatientForDetails.addressLine}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="text-gray-900">{selectedPatientForDetails.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">State</label>
                  <p className="text-gray-900">{selectedPatientForDetails.state}</p>
                </div>
                {selectedPatientForDetails.pin && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">PIN</label>
                    <p className="text-gray-900">{selectedPatientForDetails.pin}</p>
                  </div>
                )}
                {selectedPatientForDetails.country && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country</label>
                    <p className="text-gray-900">{selectedPatientForDetails.country}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Next Visit Date</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {selectedPatientForDetails.doctorNextVisit ? (
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900">
                            {format(new Date(selectedPatientForDetails.doctorNextVisit), 'PPP')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">No visit scheduled</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">
                      {selectedPatientForDetails.doctorNextVisit ? 'Update Next Visit Date' : 'Schedule Next Visit'}
                    </label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDateForVisit && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDateForVisit ? format(selectedDateForVisit, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDateForVisit}
                          onSelect={(date) => {
                            setSelectedDateForVisit(date);
                            setIsDatePickerOpen(false);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {selectedDateForVisit && selectedPatientForDetails.doctorNextVisit && (
                      <p className="text-sm text-muted-foreground">
                        This will update the current scheduled visit date.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDetailsModalOpen(false);
                setSelectedDateForVisit(undefined);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateNextVisit}
              disabled={isSubmitting || 
                !selectedDateForVisit || 
                (!!selectedPatientForDetails?.doctorNextVisit && selectedDateForVisit?.getTime() === new Date(selectedPatientForDetails.doctorNextVisit).getTime())}
              className={cn(
                "w-full sm:w-auto",
                selectedPatientForDetails?.doctorNextVisit ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
              )}
            >
              {isSubmitting ? 'Updating...' : selectedPatientForDetails?.doctorNextVisit ? 'Update Visit Date' : 'Schedule Visit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPatientsPage; 