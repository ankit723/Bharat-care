'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medStoresApi, MedDocumentWithPatient } from '@/lib/api'; // Assuming MedDocumentWithPatient is defined in api.ts
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2, Search, FileText, UserCircle, PhoneIcon, MapPinIcon, Handshake, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AvailablePrescription extends MedDocumentWithPatient {
  // patient details are already in MedDocumentWithPatient
  // Add any specific fields if needed, e.g. if medStoreHandRaises was included in API response
  raisedByStores?: { medStoreId: string }[]; // Example if API includes this
  isHandRaisedByCurrentUser?: boolean; // To be determined client-side
}

const AvailablePrescriptionsPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<AvailablePrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;

  const fetchAvailablePrescriptions = useCallback(async (page = 1, search = '') => {
    if (!user || user.role !== 'MEDSTORE') return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await medStoresApi.getAvailablePrescriptions(page, recordsPerPage, search);
      
      const myRaisedHandsResponse = await medStoresApi.getById(user.id);
      const myRaisedHandDocIds = new Set(myRaisedHandsResponse.data.raisedHands?.map((rh:any) => rh.medDocumentId) || []);

      const processedPrescriptions = response.data.data.map((doc: MedDocumentWithPatient) => ({
        ...doc,
        isHandRaisedByCurrentUser: myRaisedHandDocIds.has(doc.id)
      }));

      setPrescriptions(processedPrescriptions);
      setTotalPages(response.data.pagination.pages || 1);
      setTotalRecords(response.data.pagination.total || 0);
      setCurrentPage(response.data.pagination.page || 1);

    } catch (err: any) {
      console.error('Error fetching available prescriptions:', err);
      const errMsg = err.response?.data?.error || 'Failed to load available prescriptions.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAvailablePrescriptions(currentPage, searchTerm);
  }, [fetchAvailablePrescriptions, currentPage, searchTerm]);

  const handleRaiseHand = async (medDocumentId: string) => {
    if (!user || user.role !== 'MEDSTORE') return;
    setIsSubmitting(prev => ({ ...prev, [medDocumentId]: true }));
    try {
      await medStoresApi.raiseHand(user.id, medDocumentId);
      toast.success('Successfully raised hand for this prescription!');
      // Refresh list to update UI state
      setPrescriptions(prev => prev.map(p => 
        p.id === medDocumentId ? { ...p, isHandRaisedByCurrentUser: true } : p
      ));
    } catch (err: any) {
      console.error('Error raising hand:', err);
      toast.error(err.response?.data?.error || 'Failed to raise hand.');
    } finally {
      setIsSubmitting(prev => ({ ...prev, [medDocumentId]: false }));
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading && prescriptions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800">Available Prescriptions</CardTitle>
              <CardDescription className="text-sm md:text-lg text-gray-500 mt-1">
                Browse patient prescriptions marked for medicine availability. ({totalRecords} available)
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search by filename, patient..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on new search
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && !isLoading && (
            <div className="text-center py-10 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
              <p className="text-xl font-semibold text-red-700">Error Loading Data</p>
              <p className="text-red-600 mt-1">{error}</p>
              <Button onClick={() => fetchAvailablePrescriptions(1, '')} className="mt-4" variant="destructive">
                Try Again
              </Button>
            </div>
          )}
          {!error && !isLoading && prescriptions.length === 0 && (
            <div className="text-center py-10">
              <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-xl font-semibold text-gray-700">No Prescriptions Found</p>
              <p className="text-gray-500 mt-1">
                {searchTerm ? `No prescriptions match your search for "${searchTerm}".` : "There are currently no prescriptions seeking medicine availability."}
              </p>
            </div>
          )}

          {prescriptions.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Uploaded On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium text-gray-800">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary flex items-center gap-1.5">
                          <FileText className="h-4 w-4 flex-shrink-0" /> 
                          {doc.fileName}
                        </a>
                        {doc.description && <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs" title={doc.description}>{doc.description}</p>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <UserCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                           <div>
                            <div>{doc.patient?.name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground break-all">{doc.patient?.email || 'N/A'}</div>
                           </div>
                        </div>
                      </TableCell>
                       <TableCell>
                        <div className="flex items-center gap-1.5">
                          <PhoneIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          {doc.patient?.phone || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPinIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          {doc.patient?.city && doc.patient?.state ? `${doc.patient.city}, ${doc.patient.state}` : (doc.patient?.city || doc.patient?.state || 'N/A')}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {doc.isHandRaisedByCurrentUser ? (
                          <Button variant="ghost" size="sm" disabled className="text-green-600 flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4" />
                            Hand Raised
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handleRaiseHand(doc.id)}
                            disabled={isSubmitting[doc.id]}
                          >
                            {isSubmitting[doc.id] ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            ) : (
                              <Handshake className="mr-2 h-4 w-4" />
                            )}
                            Raise Hand
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} aria-disabled={currentPage <= 1} tabIndex={currentPage <= 1 ? -1 : undefined} className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined} />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }} isActive={currentPage === i + 1}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} aria-disabled={currentPage >= totalPages} tabIndex={currentPage >= totalPages ? -1 : undefined} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailablePrescriptionsPage; 