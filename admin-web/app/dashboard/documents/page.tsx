'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  MoreHorizontal,
  FileText,
  Image,
  Calendar,
  User,
  Building,
  Activity,
  TrendingUp,
  FileImage,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface MedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: 'PRESCRIPTION' | 'MEDICAL_REPORT';
  description?: string;
  seekAvailability: boolean;
  uploaderType: 'PATIENT' | 'DOCTOR' | 'HOSPITAL' | 'CHECKUP_CENTER';
  uploaderId: string;
  patientId: string;
  permittedDoctorIds: string[];
  permittedCheckupCenterIds: string[];
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    email: string;
  };
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
}

interface DocumentStats {
  totalDocuments: number;
  prescriptions: number;
  medicalReports: number;
  documentsThisMonth: number;
  averageDocumentsPerPatient: number;
  documentsWithPermissions: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<MedDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    prescriptions: 0,
    medicalReports: 0,
    documentsThisMonth: 0,
    averageDocumentsPerPatient: 0,
    documentsWithPermissions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PRESCRIPTION' | 'MEDICAL_REPORT'>('ALL');
  const [selectedDocument, setSelectedDocument] = useState<MedDocument | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/documents/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete document');
      
      toast.success('Document deleted successfully');
      fetchDocuments();
      fetchStats();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleViewDocument = (document: MedDocument) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  const handleDownloadDocument = async (medDocument: MedDocument) => {
    try {
      const link = document.createElement('a');
      link.href = medDocument.fileUrl;
      link.download = medDocument.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploader?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'ALL' || doc.documentType === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentTypeIcon = (type: string) => {
    return type === 'PRESCRIPTION' ? <FileCheck className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  const getUploaderTypeColor = (type: string) => {
    switch (type) {
      case 'PATIENT': return 'bg-blue-100 text-blue-800';
      case 'DOCTOR': return 'bg-green-100 text-green-800';
      case 'HOSPITAL': return 'bg-purple-100 text-purple-800';
      case 'CHECKUP_CENTER': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents Management</h1>
          <p className="text-gray-600 mt-1">Manage all medical documents in the system</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prescriptions}</p>
              </div>
              <FileCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medical Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.medicalReports}</p>
              </div>
              <FileImage className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.documentsThisMonth}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg per Patient</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageDocumentsPerPatient.toFixed(1)}</p>
              </div>
              <Activity className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Permissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.documentsWithPermissions}</p>
              </div>
              <User className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents, patients, or uploaders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)}>
                <TabsList>
                  <TabsTrigger value="ALL">All</TabsTrigger>
                  <TabsTrigger value="PRESCRIPTION">Prescriptions</TabsTrigger>
                  <TabsTrigger value="MEDICAL_REPORT">Reports</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getDocumentTypeIcon(document.documentType)}
                        <div>
                          <p className="font-medium text-gray-900">{document.fileName}</p>
                          {document.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {document.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={document.documentType === 'PRESCRIPTION' ? 'default' : 'secondary'}>
                        {document.documentType === 'PRESCRIPTION' ? 'Prescription' : 'Medical Report'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{document.patient?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{document.patient?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className={getUploaderTypeColor(document.uploaderType)}>
                          {document.uploaderType}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{document.uploader?.name || 'Unknown'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {document.permittedDoctorIds.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {document.permittedDoctorIds.length} Doctor{document.permittedDoctorIds.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {document.permittedCheckupCenterIds.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {document.permittedCheckupCenterIds.length} Center{document.permittedCheckupCenterIds.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {document.seekAvailability && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                            Med Stores
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(document.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{document.fileName}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDocument(document.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search criteria.' : 'No documents have been uploaded yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              View detailed information about this medical document.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">File Name</label>
                  <p className="text-sm text-gray-900">{selectedDocument.fileName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Document Type</label>
                  <p className="text-sm text-gray-900">
                    {selectedDocument.documentType === 'PRESCRIPTION' ? 'Prescription' : 'Medical Report'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Patient</label>
                  <p className="text-sm text-gray-900">{selectedDocument.patient?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{selectedDocument.patient?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Uploaded By</label>
                  <p className="text-sm text-gray-900">{selectedDocument.uploader?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{selectedDocument.uploaderType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Upload Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedDocument.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedDocument.updatedAt)}</p>
                </div>
              </div>
              
              {selectedDocument.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedDocument.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Permissions</label>
                <div className="mt-2 space-y-2">
                  {selectedDocument.permittedDoctorIds.length > 0 && (
                    <Badge variant="outline">
                      {selectedDocument.permittedDoctorIds.length} Doctor{selectedDocument.permittedDoctorIds.length !== 1 ? 's' : ''} have access
                    </Badge>
                  )}
                  {selectedDocument.permittedCheckupCenterIds.length > 0 && (
                    <Badge variant="outline">
                      {selectedDocument.permittedCheckupCenterIds.length} Checkup Center{selectedDocument.permittedCheckupCenterIds.length !== 1 ? 's' : ''} have access
                    </Badge>
                  )}
                  {selectedDocument.seekAvailability && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
                      Available to Med Stores
                    </Badge>
                  )}
                  {selectedDocument.permittedDoctorIds.length === 0 && 
                   selectedDocument.permittedCheckupCenterIds.length === 0 && 
                   !selectedDocument.seekAvailability && (
                    <p className="text-sm text-gray-500">No special permissions granted</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadDocument(selectedDocument)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View File
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 