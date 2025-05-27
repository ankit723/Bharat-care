'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medicineSchedulesApi, MedicineSchedule, MedicineScheduleCreateData, MedicineScheduleUpdateData, PatientBasicInfo, patientsApi, ScheduledMedicineItemData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { PlusCircle, Edit3, Trash2, Loader2, CalendarDays, Pill, Users, AlertCircle, ListChecks, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

// Helper to create a new blank medicine item
const createNewMedicineItem = (): ScheduledMedicineItemData => ({
  medicineName: '',
  dosage: '',
  timesPerDay: 1,
  gapBetweenDays: 0,
  notes: '',
});

const DoctorMedicineSchedulerPage = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<MedicineSchedule[]>([]);
  const [patients, setPatients] = useState<PatientBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // Updated currentSchedule to include items array
  const [currentSchedule, setCurrentSchedule] = useState<Partial<Omit<MedicineScheduleCreateData, 'items'>> & { id?: string; items: ScheduledMedicineItemData[] }>({ items: [createNewMedicineItem()] });
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);

  const fetchSchedules = useCallback(async () => {
    if (!user || user.role !== 'DOCTOR') return;
    try {
      setIsLoading(true);
      const response = await medicineSchedulesApi.getSchedulesByDoctor();
      setSchedules(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedules. Please try again.');
      toast.error(error || 'Failed to load schedules.');
    } finally {
      setIsLoading(false);
    }
  }, [user, error]);

  const fetchPatients = useCallback(async () => {
    if (!user || user.role !== 'DOCTOR') return;
    try {
      const response = await patientsApi.getAll({ doctorId: user.id }); 
      setPatients(response.data || []); 
    } catch (err) {
      console.error('Error fetching patients:', err);
      toast.error('Failed to load patients for selection.');
    }
  }, [user]);

  useEffect(() => {
    fetchSchedules();
    fetchPatients();
  }, [fetchSchedules, fetchPatients]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSchedule(prev => ({ ...prev, [name]: value }));
  };

  // Handler for changes in medicine item inputs
  const handleItemInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedItems = [...currentSchedule.items];
    updatedItems[index] = { ...updatedItems[index], [name]: name === 'timesPerDay' || name === 'gapBetweenDays' ? parseInt(value) || 0 : value };
    setCurrentSchedule(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setCurrentSchedule(prev => ({ ...prev, [name]: value }));
  };

  const addMedicineItem = () => {
    setCurrentSchedule(prev => ({ ...prev, items: [...prev.items, createNewMedicineItem()] }));
  };

  const removeMedicineItem = (index: number) => {
    if (currentSchedule.items.length <= 1) {
      toast.error("At least one medicine item is required.");
      return;
    }
    const updatedItems = currentSchedule.items.filter((_, i) => i !== index);
    setCurrentSchedule(prev => ({ ...prev, items: updatedItems }));
  };

  const handleOpenModal = (schedule?: MedicineSchedule) => {
    if (schedule) {
      setCurrentSchedule({
        id: schedule.id,
        patientId: schedule.patientId,
        startDate: format(new Date(schedule.startDate), 'yyyy-MM-dd'),
        numberOfDays: schedule.numberOfDays,
        notes: schedule.notes || '',
        items: schedule.items.map(item => ({ // Map existing items
          id: item.id, // Keep item ID for updates
          medicineName: item.medicineName,
          dosage: item.dosage,
          timesPerDay: item.timesPerDay,
          gapBetweenDays: item.gapBetweenDays,
          notes: item.notes || '',
        }))
      });
      setSelectedPatientId(schedule.patientId);
    } else {
      setCurrentSchedule({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        numberOfDays: 7,
        notes: '',
        items: [createNewMedicineItem()] // Initialize with one blank item
      });
      setSelectedPatientId(undefined);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient.');
      return;
    }
    if (!currentSchedule.items || currentSchedule.items.length === 0) {
      toast.error('Please add at least one medicine item.');
      return;
    }

    // Validate each item
    for (const item of currentSchedule.items) {
      if (!item.medicineName || !item.dosage || item.timesPerDay <= 0 || item.gapBetweenDays < 0) {
        toast.error(`Please fill all required fields for: ${item.medicineName || 'Unnamed Medicine'}. Times per day must be > 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    
    const dataToSave: MedicineScheduleCreateData | MedicineScheduleUpdateData = {
      patientId: selectedPatientId!,
      startDate: currentSchedule.startDate ? new Date(currentSchedule.startDate).toISOString() : new Date().toISOString(),
      numberOfDays: Number(currentSchedule.numberOfDays) || 7,
      notes: currentSchedule.notes || undefined,
      items: currentSchedule.items.map(item => ({
        id: item.id, // Will be undefined for new items, present for existing ones
        medicineName: item.medicineName,
        dosage: item.dosage,
        timesPerDay: Number(item.timesPerDay),
        gapBetweenDays: Number(item.gapBetweenDays),
        notes: item.notes || undefined,
      }))
    };

    try {
      if (currentSchedule.id) {
        await medicineSchedulesApi.updateSchedule(currentSchedule.id, dataToSave as MedicineScheduleUpdateData);
        toast.success('Schedule updated successfully!');
      } else {
        await medicineSchedulesApi.createSchedule(dataToSave as MedicineScheduleCreateData);
        toast.success('Schedule created successfully!');
      }
      fetchSchedules();
      setIsModalOpen(false);
      setCurrentSchedule({ items: [createNewMedicineItem()] }); // Reset form
      setSelectedPatientId(undefined);
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      const errorMsg = err.response?.data?.error || 'Failed to save schedule. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await medicineSchedulesApi.deleteSchedule(scheduleId);
      toast.success('Schedule deleted successfully!');
      fetchSchedules();
    } catch (err: any) {
      console.error('Error deleting schedule:', err);
      const errorMsg = err.response?.data?.error || 'Failed to delete schedule. Please try again.';
      toast.error(errorMsg);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading schedules...</span></div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <CalendarDays className="mr-3 h-7 w-7 text-primary" />
            Manage Medicine Schedules
          </CardTitle>
          <CardDescription>
            Create, view, and manage medicine schedules for your patients with multiple medications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => handleOpenModal()} className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Schedule
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSchedules} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {schedules.length === 0 && !error && (
        <Card className="text-center py-12">
           <CardHeader>
            <div className="mx-auto bg-secondary p-3 rounded-full w-fit">
                <ListChecks className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4 text-xl text-muted-foreground">No Schedules Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You haven&apos;t created any medicine schedules.</p>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create First Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Created Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medicines</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Overall Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{schedule.patient?.name || schedule.patientId}</TableCell>
                    <TableCell>{schedule.items?.length || 0} item(s)</TableCell>
                    <TableCell>{format(new Date(schedule.startDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{schedule.numberOfDays} days</TableCell>
                    <TableCell className="max-w-xs truncate">{schedule.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(schedule)} className="mr-2">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal for Create/Edit Schedule */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Pill className="mr-2 h-6 w-6" /> 
              {currentSchedule.id ? 'Edit Medicine Schedule' : 'Create New Medicine Schedule'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <Select 
                value={selectedPatientId}
                onValueChange={(value) => setSelectedPatientId(value)}
                disabled={!!currentSchedule.id} // Disable if editing, patient shouldn't change
              >
                <SelectTrigger id="patientId">
                  <SelectValue placeholder="Select a patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedPatientId && <p className="text-xs text-red-500 mt-1">Patient selection is required.</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <Input 
                  id="startDate" 
                  name="startDate" 
                  type="date" 
                  value={typeof currentSchedule.startDate === 'string' ? currentSchedule.startDate : (currentSchedule.startDate ? format(currentSchedule.startDate, 'yyyy-MM-dd') : '')} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div>
                <label htmlFor="numberOfDays" className="block text-sm font-medium text-gray-700 mb-1">Number of Days</label>
                <Input 
                  id="numberOfDays" 
                  name="numberOfDays" 
                  type="number" 
                  value={currentSchedule.numberOfDays || 7} 
                  onChange={handleInputChange} 
                  min="1"
                  required 
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Overall Schedule Notes (Optional)</label>
              <Textarea 
                id="notes" 
                name="notes" 
                value={currentSchedule.notes || ''} 
                onChange={handleInputChange} 
                placeholder="e.g., Take all medicines with food."
              />
            </div>

            <hr className="my-6"/>

            <div className="space-y-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <ListChecks className="mr-2 h-5 w-5 text-primary"/> Medicine Items
              </h3>
              {currentSchedule.items.map((item, index) => (
                <div key={index} className="p-4 border rounded-md space-y-3 relative bg-slate-50/50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-md text-gray-700">Medicine #{index + 1}</h4>
                    {currentSchedule.items.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeMedicineItem(index)} 
                        className="text-destructive hover:text-destructive/80 absolute top-2 right-2 h-7 w-7"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`medicineName-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                      <Input 
                        id={`medicineName-${index}`} 
                        name="medicineName" 
                        value={item.medicineName} 
                        onChange={(e) => handleItemInputChange(index, e)} 
                        placeholder="e.g., Amoxicillin 250mg"
                        required 
                      />
                    </div>
                    <div>
                      <label htmlFor={`dosage-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                      <Input 
                        id={`dosage-${index}`} 
                        name="dosage" 
                        value={item.dosage} 
                        onChange={(e) => handleItemInputChange(index, e)} 
                        placeholder="e.g., 1 tablet, 5ml"
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor={`timesPerDay-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Times Per Day</label>
                        <Input 
                            id={`timesPerDay-${index}`} 
                            name="timesPerDay" 
                            type="number" 
                            value={item.timesPerDay} 
                            onChange={(e) => handleItemInputChange(index, e)} 
                            min="1" 
                            required 
                        />
                        </div>
                        <div>
                        <label htmlFor={`gapBetweenDays-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Gap Between Days</label>
                        <Input 
                            id={`gapBetweenDays-${index}`} 
                            name="gapBetweenDays" 
                            type="number" 
                            value={item.gapBetweenDays} 
                            onChange={(e) => handleItemInputChange(index, e)} 
                            min="0" 
                            placeholder="0 for daily, 1 for alternate days"
                            required 
                        />
                        </div>
                  </div>
                  <div>
                    <label htmlFor={`itemNotes-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Item Specific Notes (Optional)</label>
                    <Textarea 
                        id={`itemNotes-${index}`} 
                        name="notes" // Ensure this matches the field in ScheduledMedicineItemData
                        value={item.notes || ''} 
                        onChange={(e) => handleItemInputChange(index, e)} 
                        placeholder="e.g., Take after meals"
                        rows={2}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addMedicineItem} className="mt-2 flex items-center">
                <Plus className="mr-2 h-4 w-4" /> Add Another Medicine
              </Button>
            </div>
            
            <DialogFooter className="mt-8 pt-6 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (currentSchedule.id ? 'Save Changes' : 'Create Schedule')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorMedicineSchedulerPage; 