'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medDocumentsApi, patientsApi, doctorsApi } from '@/lib/api'; // Assuming doctorsApi might be needed for doctor-specific patient lists
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
import { Loader2, Upload, FileText, Trash2, Download, Search, Eye, UserCheck, Shield } from 'lucide-react';
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
  // doctor specific fields if any, like if doctor is uploader
  doctor?: {id: string, name: string}
}

interface Patient {
  id: string;
  name: string;
}

const DoctorDocumentsPage = () => {
  const { user } = useAuth(); // This user is the doctor
  const [documents, setDocuments] = useState<MedDocument[]>([]);
  const [doctorPatients, setDoctorPatients] = useState<Patient[]>([]); // Patients assigned to this doctor
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
  const [filterPatient, setFilterPatient] = useState('ALL_PATIENTS');
  const [filterDocType, setFilterDocType] = useState('ALL_TYPES');
  const [viewScope, setViewScope] = useState<'uploadedByMe' | 'patientUploaded' | 'allPermitted'>('allPermitted');

  const fetchDocuments = useCallback(async () => {
    if (!user || user.role !== 'DOCTOR') return;
    setIsLoading(true);
    try {
      const params: any = { }; 
      // Based on viewScope, modify params
      if(viewScope === 'uploadedByMe'){
        params.uploaderType = 'DOCTOR';
        params.uploadedByMySelf = 'true';
      } else if (viewScope === 'patientUploaded'){
        params.uploaderType = 'PATIENT';
        // Server will filter by permittedDoctorIds based on current doctor user
      } else { // allPermitted
        // No specific uploaderType, server side will check uploadedById OR permittedDoctorIds
      }

      if (filterPatient && filterPatient !== 'ALL_PATIENTS') params.patientId = filterPatient;
      if (filterDocType && filterDocType !== 'ALL_TYPES') params.documentType = filterDocType;
      
      const response = await medDocumentsApi.getAll(params);
      setDocuments(response.data || []);
    } catch (error: any) {
      console.error('Error fetching documents for doctor:', error);
      toast.error(error.response?.data?.message || 'Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  }, [user, filterPatient, filterDocType, viewScope]);

  const fetchDoctorPatients = useCallback(async () => {
    if (!user || user.role !== 'DOCTOR') return;
    try {
      // Get doctor data with assigned patients
      const response = await doctorsApi.getById(user.id);
      if (response.data.patients && Array.isArray(response.data.patients)) {
        setDoctorPatients(response.data.patients);
      } else {
        setDoctorPatients([]);
        toast.error("No patients are currently assigned to you.");
      }
    } catch (error) {
      console.error("Error fetching doctor's patients:", error);
      toast.error("Could not load your assigned patients.");
    }
  }, [user]);

 useEffect(() => {
    fetchDocuments();
    if(isModalOpen || doctorPatients.length === 0) fetchDoctorPatients();
  }, [fetchDocuments, fetchDoctorPatients, isModalOpen]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.patientId || !uploadForm.documentType || !user) return;

    setIsUploading(true);
    try {
      const file = uploadForm.file;
      // Unique filename: doctorId/patientId/timestamp-filename
      const fileName = `${user.id}/${uploadForm.patientId}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded file.');
      }

      const docMetadata = {
        fileName: file.name,
        fileUrl: publicUrlData.publicUrl,
        documentType: uploadForm.documentType,
        patientId: uploadForm.patientId,
        description: uploadForm.description,
        uploaderType: 'DOCTOR', 
      };
      await medDocumentsApi.create(docMetadata);

      toast.success('Document uploaded successfully!');
      setIsModalOpen(false);
      setUploadForm({ patientId: '', documentType: '', description: '', file: null });
      fetchDocuments(); 
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || error.response?.data?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, fileUrl: string) => {
    if (!user) return;
    // Check if the document was uploaded by this doctor before deleting
    const docToDelete = documents.find(d => d.id === docId);
    if (docToDelete && docToDelete.uploaderType === 'DOCTOR' && docToDelete.uploadedById !== user.id) {
        toast.error("You can only delete documents you uploaded.");
        return;
    }
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;

    setIsProcessingDelete(docId);
    try {
      const filePath = fileUrl.substring(fileUrl.indexOf('/documents/') + '/documents/'.length);
      const { error: storageError } = await supabase.storage.from('documents').remove([filePath]);
      if (storageError && storageError.message !== 'The resource was not found') {
        console.warn('Supabase storage deletion error:', storageError);
        // toast.error(`Storage deletion error: ${storageError.message}. Metadata not deleted.`);
        // Potentially do not proceed if storage deletion fails critically
      }

      await medDocumentsApi.delete(docId);
      toast.success('Document deleted successfully!');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document.');
    } finally {
      setIsProcessingDelete(null);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    (doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading && documents.length === 0 && !filterPatient && !filterDocType && !searchTerm) {
    return <div className="flex justify-center items-center h-screen"><div className="text-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2 text-sm text-muted-foreground">Loading documents...</p></div></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Patient Documents</h1>
            <p className="text-sm md:text-lg text-gray-500 mt-1">Manage medical documents for your assigned patients.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 w-full lg:w-auto">
              <Upload className="mr-2 h-5 w-5" /> 
              <span className="hidden sm:inline">Upload Document for Patient</span>
              <span className="sm:hidden">Upload Document</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[90vw] md:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Upload New Document</DialogTitle>
              <DialogDescription className="text-sm">Select a patient, document type, and file.</DialogDescription>
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
                    {doctorPatients.length > 0 ? doctorPatients.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    )) : <SelectItem value="NO_PATIENTS_PLACEHOLDER" disabled>No patients available/assigned</SelectItem>}
                  </SelectContent>
                </Select>
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
                    placeholder="Brief description..."
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <Label htmlFor="filterPatientD" className="text-sm">Patient</Label>
                    <Select value={filterPatient} onValueChange={(value) => setFilterPatient(value)}>
                        <SelectTrigger id="filterPatientD"><SelectValue placeholder="Filter by Patient" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL_PATIENTS">All My Patients</SelectItem>
                            {doctorPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="filterDocTypeD" className="text-sm">Document Type</Label>
                    <Select value={filterDocType} onValueChange={(value) => setFilterDocType(value)}>
                        <SelectTrigger id="filterDocTypeD"><SelectValue placeholder="Filter by Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL_TYPES">All Types</SelectItem>
                            <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                            <SelectItem value="MEDICAL_REPORT">Medical Report</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="viewScope" className="text-sm">View Scope</Label>
                    <Select value={viewScope} onValueChange={(val) => setViewScope(val as any)}>
                        <SelectTrigger id="viewScope"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="allPermitted">All Permitted</SelectItem>
                            <SelectItem value="uploadedByMe">Uploaded by Me</SelectItem>
                            <SelectItem value="patientUploaded">Patient Uploaded</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
      </Card>

      {filteredDocuments.length > 0 ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-gray-700">Documents ({filteredDocuments.length})</CardTitle>
            <CardDescription className="text-sm text-gray-500">
                {viewScope === 'uploadedByMe' && 'Documents you have uploaded.'}
                {viewScope === 'patientUploaded' && 'Documents your patients have uploaded and permitted you to see.'}
                {viewScope === 'allPermitted' && 'All documents you have permission to view.'}
            </CardDescription>
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
                        <div className="flex items-center mt-1">
                          <strong>Uploaded by:</strong>
                          <span className="ml-1">
                            {doc.uploaderType === 'DOCTOR' && doc.uploadedById === user?.id ? 
                              <span className="flex items-center"><UserCheck className="h-3 w-3 mr-1 text-green-600"/>You</span> : 
                              doc.uploaderType === 'PATIENT' ? 
                              <span className="flex items-center"><Shield className="h-3 w-3 mr-1 text-blue-600"/>Patient</span> : 
                              doc.uploaderType}
                          </span>
                        </div>
                        <div><strong>Date:</strong> {format(new Date(doc.createdAt), 'PPpp')}</div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" asChild className="hover:bg-gray-50 flex-1">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title="Download/View Document">
                            <Download className="h-4 w-4 mr-1" />
                            <span className="text-xs">View</span>
                          </a>
                        </Button>
                        {(doc.uploaderType === 'DOCTOR' && doc.uploadedById === user?.id) && (
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
                        )}
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
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium text-gray-800 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" /> 
                          <span className="truncate max-w-[200px]" title={doc.fileName}>{doc.fileName}</span>
                      </TableCell>
                      <TableCell className="text-gray-600">{doc.patient?.name || 'N/A'}</TableCell>
                      <TableCell className="text-gray-600">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${doc.documentType === 'PRESCRIPTION' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {doc.documentType.replace('_',' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                          {doc.uploaderType === 'DOCTOR' && doc.uploadedById === user?.id ? <span className="flex items-center"><UserCheck className="h-4 w-4 mr-1 text-green-600"/>You</span> : 
                           doc.uploaderType === 'PATIENT' ? <span className="flex items-center"><Shield className="h-4 w-4 mr-1 text-blue-600"/>Patient</span> : 
                           doc.uploaderType}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">{format(new Date(doc.createdAt), 'PPpp')}</TableCell>
                      <TableCell className="text-right space-x-1">
                          <Button variant="outline" size="sm" asChild className="hover:bg-gray-50">
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title="Download/View Document">
                                  <Download className="h-4 w-4" />
                              </a>
                          </Button>
                        {(doc.uploaderType === 'DOCTOR' && doc.uploadedById === user?.id) && (
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
                        )}
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
                <p className="text-gray-500 text-sm md:text-base">No documents match your current filters or scope.</p>
                {viewScope === 'uploadedByMe' && <p className="text-gray-500 mt-1 text-sm">Try uploading a new document or changing the view scope.</p>}
            </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorDocumentsPage; 