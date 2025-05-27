'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medStoresApi, MedDocumentWithPatient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Eye, FileText, UserCircle, AlertCircle, CheckCircle, ListChecks, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface RaisedHandDocument extends MedDocumentWithPatient {
  // Patient details are in MedDocumentWithPatient
  id: string;
  patientId: string;
  doctorId: string;
  title: string;
  description: string;
  prescriptionUrl: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface MedStoreData {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  verificationStatus: string;
  raisedHands?: Array<{
    id: string;
    medDocumentId: string;
    medStoreId: string;
    createdAt: string;
    status: string;
    medDocument: RaisedHandDocument;
  }>;
}

const MedStoreDashboardPage = () => {
  const { user } = useAuth();
  const [medStoreData, setMedStoreData] = useState<MedStoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState<{[key: string]: boolean}>({}); // For medDocumentId
  const [error, setError] = useState<string | null>(null);

  const fetchMedStoreData = useCallback(async () => {
    if (!user || user.role !== 'MEDSTORE') return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await medStoresApi.getById(user.id);
      setMedStoreData(response.data);
    } catch (err: any) {
      console.error('Error fetching MedStore data:', err);
      const errMsg = err.response?.data?.error || 'Failed to load MedStore data.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMedStoreData();
  }, [fetchMedStoreData]);

  const handleWithdrawHand = async (medDocumentId: string) => {
    if (!user || !medStoreData) return;
    setIsWithdrawing(prev => ({ ...prev, [medDocumentId]: true }));
    try {
      await medStoresApi.withdrawHand(user.id, medDocumentId);
      toast.success('Successfully withdrew hand for this prescription.');
      // Refresh data to update UI
      fetchMedStoreData(); 
    } catch (err: any) {
      console.error('Error withdrawing hand:', err);
      toast.error(err.response?.data?.error || 'Failed to withdraw hand.');
    } finally {
      setIsWithdrawing(prev => ({ ...prev, [medDocumentId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <p className="text-xl font-semibold text-red-700">Error Loading Dashboard</p>
        <p className="text-red-600 mt-1">{error}</p>
        <Button onClick={fetchMedStoreData} className="mt-4" variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  if (!medStoreData) {
    return (
      <div className="container mx-auto p-6 text-center"><p>MedStore data not found.</p></div>
    );
  }
  
  const raisedHandPrescriptions = medStoreData.raisedHands?.filter(rh => rh.status === "ACTIVE") || [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">MedStore Dashboard</h1>
          <p className="text-sm md:text-lg text-gray-500 mt-1">Welcome, {medStoreData.name}</p>
        </div>
        <Link href="/dashboard/medstore/available-prescriptions">
          <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Eye className="mr-2 h-5 w-5" /> View Available Prescriptions
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700">My Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p><strong>Email:</strong> {medStoreData.email}</p>
          <p><strong>Phone:</strong> {medStoreData.phone}</p>
          <p><strong>Address:</strong> {`${medStoreData.addressLine}, ${medStoreData.city}, ${medStoreData.state} - ${medStoreData.pin}, ${medStoreData.country}`}</p>
          <p><strong>Verification Status:</strong> 
            <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ml-1 
              ${medStoreData.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 
                medStoreData.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'}
            `}>
              {medStoreData.verificationStatus}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-blue-600" /> My Active Hand Raises
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-1">
            Prescriptions you have offered to fulfill. ({raisedHandPrescriptions.length} active)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {raisedHandPrescriptions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">You have not raised your hand for any prescriptions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Patient Contact</TableHead>
                    <TableHead>Raised At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {raisedHandPrescriptions.map((handRaise) => (
                    <TableRow key={handRaise.id}>
                      <TableCell className="font-medium">
                         <a href={handRaise.medDocument.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary flex items-center gap-1.5">
                          <FileText className="h-4 w-4 flex-shrink-0" /> 
                          {handRaise.medDocument.fileName}
                        </a>
                      </TableCell>
                      <TableCell>{handRaise.medDocument.patient?.name || 'N/A'}</TableCell>
                      <TableCell>{handRaise.medDocument.patient?.email || 'N/A'} {handRaise.medDocument.patient?.phone && `(${handRaise.medDocument.patient.phone})`}</TableCell>
                      <TableCell>{format(new Date(handRaise.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleWithdrawHand(handRaise.medDocumentId)}
                          disabled={isWithdrawing[handRaise.medDocumentId]}
                        >
                          {isWithdrawing[handRaise.medDocumentId] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                          )}
                          Withdraw Hand
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedStoreDashboardPage; 