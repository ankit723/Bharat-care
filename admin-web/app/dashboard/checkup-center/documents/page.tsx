'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medDocumentsApi, checkupCentersApi, doctorsApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, Upload, FileText, Trash2, Download, Search, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: 'PRESCRIPTION' | 'MEDICAL_REPORT';
  description?: string;
  createdAt: string;
  patient: { id: string; name: string };
  uploaderType?: string;
  uploadedById?: string;
  permittedDoctorIds?: string[];
  permittedCheckupCenterIds?: string[];
}

interface Patient {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
}

const CheckupCenterDocumentsPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<MedDocument[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    patientId: '',
    documentType: '' as 'PRESCRIPTION' | 'MEDICAL_REPORT' | '',
    description: '',
    file: null as File | null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatient, setFilterPatient] = useState('ALL');
  const [filterDocType, setFilterDocType] = useState('ALL');
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<MedDocument | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user || user.role !== 'CHECKUP_CENTER') return;
    setIsLoading(true);
    try {
      const params: any = { uploaderType: 'CHECKUP_CENTER', uploadedByMySelf: 'true' }; // Fetch only docs uploaded by this center
      if (filterPatient && filterPatient !== 'ALL') params.patientId = filterPatient;
      if (filterDocType && filterDocType !== 'ALL') params.documentType = filterDocType;
      // Add search term if searching server-side, currently client-side after fetch

      const response = await medDocumentsApi.getAll(params);
      setDocuments(response.data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error(error.response?.data?.message || 'Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  }, [user, filterPatient, filterDocType]);

  const fetchPatientsForFilter = useCallback(async () => {
    if(!user || user.role !== 'CHECKUP_CENTER') return;
    try {
        // Fetch patients directly from checkup center data
        const centerDetails = await checkupCentersApi.getById(user.id);
        if (centerDetails.data.patients && Array.isArray(centerDetails.data.patients)) {
            setPatients(centerDetails.data.patients.map((patient: { id: string; name: string }) => ({
                id: patient.id,
                name: patient.name
            })));
        } else {
            setPatients([]);
        }
    } catch (error: any) {
        console.error("Error fetching patients for filter:", error);
        toast.error(error.response?.data?.message || "Could not load patients for filtering.");
    }
  }, [user]);

 useEffect(() => {
    fetchDocuments();
    fetchPatientsForFilter();
  }, [fetchDocuments, fetchPatientsForFilter]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to upload documents.');
      return;
    }

    if (!uploadForm.file || !uploadForm.patientId || !uploadForm.documentType) {
      toast.error('Please fill in all required fields: patient, document type, and file.');
      return;
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (uploadForm.file.size > maxSize) {
      toast.error('File size must be less than 10MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(uploadForm.file.type)) {
      toast.error('Only PDF, JPEG, and PNG files are allowed.');
      return;
    }

    setIsUploading(true);
    try {
      const file = uploadForm.file;
      const fileName = `${user.id}/${uploadForm.patientId}/${Date.now()}-${file.name}`;
      
      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded file.');
      }

      // Save metadata to backend
      const docMetadata = {
        fileName: file.name,
        fileUrl: publicUrlData.publicUrl,
        documentType: uploadForm.documentType,
        patientId: uploadForm.patientId,
        description: uploadForm.description,
        uploaderType: 'CHECKUP_CENTER',
        permittedDoctorIds: [], // Initialize empty permissions
        permittedCheckupCenterIds: []
      };
      
      await medDocumentsApi.create(docMetadata);

      toast.success('Document uploaded successfully!');
      setIsModalOpen(false);
      setUploadForm({ patientId: '', documentType: '', description: '', file: null });
      fetchDocuments(); // Refresh list
      fetchPatientsForFilter(); // Refresh patient filter list potentially
    } catch (error: any) {
      console.error('Error uploading document:', error);
      let errorMessage = 'Failed to upload document.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, fileUrl: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;

    setIsProcessingDelete(docId);
    try {
      // Extract file path from URL for Supabase deletion
      const filePath = fileUrl.substring(fileUrl.indexOf('/documents/') + '/documents/'.length);

      // Delete from Supabase storage
      const { error: storageError } = await supabase.storage.from('documents').remove([filePath]);
      if (storageError) {
        // Log error but proceed to delete metadata if file not found, as it might have been deleted manually
        console.warn('Supabase storage deletion error (might be ignorable if file already deleted):', storageError);
        if (storageError.message !== 'The resource was not found') {
            toast.error(`Storage deletion error: ${storageError.message}. Metadata not deleted.`);
            // return; // Decide if you want to stop metadata deletion on storage error other than not found
        }
      }

      // Delete metadata from backend
      await medDocumentsApi.delete(docId);
      toast.success('Document deleted successfully!');
      fetchDocuments(); // Refresh list
      fetchPatientsForFilter();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document.');
    } finally {
      setIsProcessingDelete(null);
    }
  };

  const handleManagePermissions = async (doc: MedDocument) => {
    setSelectedDocument(doc);
    setIsPermissionsModalOpen(true);
    
    // Fetch available doctors
    setIsLoadingDoctors(true);
    try {
      const response = await doctorsApi.getAll();
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setAvailableDoctors(response.data);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setAvailableDoctors(response.data.data);
      } else {
        setAvailableDoctors([]);
        toast.error('No doctors available for permissions.');
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load available doctors.');
      setAvailableDoctors([]); // Ensure we set an empty array on error
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleToggleDoctorPermission = async (doctorId: string) => {
    if (!selectedDocument) return;
    
    try {
      const isPermitted = selectedDocument.permittedDoctorIds?.includes(doctorId);
      
      if (isPermitted) {
        await medDocumentsApi.revokeDoctorPermission(selectedDocument.id, doctorId);
        toast.success('Permission revoked successfully.');
      } else {
        await medDocumentsApi.grantDoctorPermission(selectedDocument.id, doctorId);
        toast.success('Permission granted successfully.');
      }
      
      // Refresh documents list
      fetchDocuments();
    } catch (error: any) {
      console.error('Error managing permission:', error);
      toast.error(error.response?.data?.message || 'Failed to update permission.');
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && !documents.length) {
    return <div className="flex justify-center items-center h-screen"><div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-sm text-muted-foreground">Loading documents...</p></div></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Documents</h1>
          <p className="text-sm md:text-lg text-gray-500 mt-1">Upload and manage medical documents for your patients.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 w-full lg:w-auto">
              <Upload className="mr-2 h-5 w-5" /> 
              <span className="hidden sm:inline">Upload New Document</span>
              <span className="sm:hidden">Upload Document</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[90vw] md:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Upload New Document</DialogTitle>
              <DialogDescription className="text-sm">Select a patient, document type, and file to upload.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUploadSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="patientId">Patient</Label>
                <Select 
                    value={uploadForm.patientId} 
                    onValueChange={(value) => setUploadForm({...uploadForm, patientId: value })}
                    required
                >
                  <SelectTrigger id="patientId"><SelectValue placeholder="Select Patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.length === 0 ? (
                      <SelectItem value="NONE" disabled>No patients available</SelectItem>
                    ) : (
                      patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Note: You can assign patients from the Patients page first.</p>
              </div>
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select 
                    value={uploadForm.documentType} 
                    onValueChange={(value: 'PRESCRIPTION' | 'MEDICAL_REPORT') => setUploadForm({...uploadForm, documentType: value })}
                    required
                >
                  <SelectTrigger id="documentType"><SelectValue placeholder="Select Document Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                    <SelectItem value="MEDICAL_REPORT">Medical Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                    id="description" 
                    value={uploadForm.description} 
                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})} 
                    placeholder="Brief description of the document..."
                />
              </div>
              <div>
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" onChange={handleFileChange} required className="cursor-pointer"/>
                {uploadForm.file && <p className='text-xs text-gray-500 mt-1'>{uploadForm.file.name} ({Math.round(uploadForm.file.size / 1024)} KB)</p>}
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isUploading} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" disabled={isUploading || !uploadForm.file || !uploadForm.patientId || !uploadForm.documentType} className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto">
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Upload
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6 space-y-4">
            <div className="w-full">
                <Label htmlFor="searchDocs" className="sr-only">Search Documents</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="searchDocs" placeholder="Search by filename, patient, type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                    <Label htmlFor="filterPatient" className="text-sm">Patient</Label>
                    <Select value={filterPatient} onValueChange={(value) => setFilterPatient(value)}>
                        <SelectTrigger id="filterPatient"><SelectValue placeholder="Filter by Patient" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Patients</SelectItem>
                            {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="filterDocType" className="text-sm">Document Type</Label>
                    <Select value={filterDocType} onValueChange={(value) => setFilterDocType(value)}>
                        <SelectTrigger id="filterDocType"><SelectValue placeholder="Filter by Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                            <SelectItem value="MEDICAL_REPORT">Medical Report</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
      </Card>

      {filteredDocuments.length > 0 ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-gray-700">Uploaded Documents ({filteredDocuments.length})</CardTitle>
            <CardDescription className="text-sm text-gray-500">Documents you have uploaded for your patients.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <FileText className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                          <span className="font-medium text-gray-800 text-sm truncate">{doc.fileName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${doc.documentType === 'PRESCRIPTION' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {doc.documentType.replace('_',' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div><strong>Patient:</strong> {doc.patient?.name || 'N/A'}</div>
                        <div><strong>Uploaded:</strong> {format(new Date(doc.createdAt), 'PPpp')}</div>
                        {doc.description && <div><strong>Description:</strong> {doc.description}</div>}
                        <div><strong>Permissions:</strong></div>
                        <div className="mt-1 space-y-1">
                          <div className="text-xs">
                            Doctors: {doc.permittedDoctorIds?.length || 0} permitted
                          </div>
                          <div className="text-xs">
                            Checkup Centers: {doc.permittedCheckupCenterIds?.length || 0} permitted
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" asChild className="hover:bg-gray-50 flex-1">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title="Download/View Document">
                            <Download className="h-4 w-4 mr-1" />
                            <span className="text-xs">View</span>
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManagePermissions(doc)}
                          className="flex-1"
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          <span className="text-xs">Permissions</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          onClick={() => handleDeleteDocument(doc.id, doc.fileUrl)}
                          disabled={isProcessingDelete === doc.id}
                          title="Delete Document"
                        >
                          {isProcessingDelete === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                    <TableHead>File Name</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium text-gray-800">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="truncate max-w-[200px]" title={doc.fileName}>{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{doc.patient?.name || 'N/A'}</TableCell>
                      <TableCell className="text-gray-600">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${doc.documentType === 'PRESCRIPTION' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {doc.documentType.replace('_',' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">{format(new Date(doc.createdAt), 'PPpp')}</TableCell>
                      <TableCell className="text-gray-600 text-xs">
                        <div>Doctors: {doc.permittedDoctorIds?.length || 0}</div>
                        <div>Centers: {doc.permittedCheckupCenterIds?.length || 0}</div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" asChild className="hover:bg-gray-50">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title="Download/View Document">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManagePermissions(doc)}
                          title="Manage Permissions"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteDocument(doc.id, doc.fileUrl)}
                          disabled={isProcessingDelete === doc.id}
                          title="Delete Document"
                        >
                          {isProcessingDelete === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
            <CardTitle className="text-lg md:text-xl text-gray-700">No Documents Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-sm md:text-base">No documents match your current filters.</p>
            <p className="text-gray-500 text-sm mt-1">Try uploading a new document or adjusting your search criteria.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Manage Document Permissions</DialogTitle>
            <DialogDescription className="text-sm">
              Control which doctors can access this document
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-4">
              <div className="border rounded-md p-3 bg-muted/50">
                <p className="font-medium">{selectedDocument.fileName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Patient: {selectedDocument.patient?.name}
                </p>
              </div>
              
              {isLoadingDoctors ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Available Doctors</Label>
                  <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                    {availableDoctors.map((doctor) => {
                      const isPermitted = selectedDocument.permittedDoctorIds?.includes(doctor.id);
                      return (
                        <div
                          key={doctor.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/50"
                        >
                          <span className="font-medium">{doctor.name}</span>
                          <Button
                            variant={isPermitted ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleToggleDoctorPermission(doctor.id)}
                          >
                            {isPermitted ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Revoke Access
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Grant Access
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                    {availableDoctors.length === 0 && (
                      <div className="p-3 text-center text-muted-foreground">
                        No doctors available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPermissionsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckupCenterDocumentsPage; 