'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi, VerifiableUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge'; // Temporarily removed to bypass import issue
import { Loader2, CheckCircle, XCircle, ShieldAlert, UserCheck, UserX, Search, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
// import { redirect } from 'next/navigation'; // Removed redirect, will use error card

// Define which fields are sortable
type SortableField = 'name' | 'email' | 'role' | 'phone' | 'userId' | 'createdAt';

const AdminVerificationPage = () => {
  const [pendingUsers, setPendingUsers] = useState<VerifiableUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);

  // State for search and sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortableField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [displayedPendingUsers, setDisplayedPendingUsers] = useState<VerifiableUser[]>([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  const fetchPendingUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPendingVerifications();
      let usersData: VerifiableUser[] = []; 
      if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && Array.isArray((response.data as any).data)) {
        usersData = (response.data as any).data;
      } else {
        console.warn('Unexpected API response format for pending users:', response.data);
        toast.error('Could not parse users from API response.');
        usersData = [];
      }
      // Ensure createdAt is consistently a string for initial load, sorting will handle Date conversion
      const formattedUsers = usersData.map(user => ({...user, createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date(0).toISOString() }));
      setPendingUsers(formattedUsers.filter((user: VerifiableUser) => user.verificationStatus === 'PENDING'));
    } catch (err: any) {
      console.error('Error fetching pending users:', err);
      const errMsg = err.response?.data?.error || 'Failed to load users for verification.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  // Get unique roles for filter buttons
  const uniqueRoles = useMemo(() => {
    const roles = new Set(pendingUsers.map(user => user.role).filter(role => role.toLowerCase() !== 'compounder'));
    return ['ALL', ...Array.from(roles)];
  }, [pendingUsers]);

  // Effect for filtering and sorting users
  useEffect(() => {
    let processedUsers = [...pendingUsers].filter(user => user.entityType !== 'compounder');

    // Filter by selectedRoleFilter
    if (selectedRoleFilter !== 'ALL') {
      processedUsers = processedUsers.filter(user => user.role === selectedRoleFilter);
    }

    // Filter by searchTerm
    if (searchTerm.trim() !== '') {
      processedUsers = processedUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Role is already filtered, but keep for consistency if needed for other searches
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.userId && user.userId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    if (sortField) {
      processedUsers.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        let comparison = 0;

        if (valA === null || typeof valA === 'undefined') {
          comparison = (valB === null || typeof valB === 'undefined') ? 0 : 1; // nulls/undefined go last
        } else if (valB === null || typeof valB === 'undefined') {
          comparison = -1; // non-nulls go first
        } else {
          if (sortField === 'createdAt') {
            comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
          } else if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
          }
          // Add other type comparisons if needed, e.g., for numbers
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    setDisplayedPendingUsers(processedUsers);
  }, [pendingUsers, searchTerm, sortField, sortOrder, selectedRoleFilter]);

  const handleSort = (field: SortableField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortableField) => {
    if (sortField !== field) return <ChevronDown className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-50" />;
    return sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  const handleVerificationAction = async (entityType: string, userId: string, newStatus: 'VERIFIED' | 'REJECTED') => {
    const submissionKey = `${entityType}-${userId}`;
    setIsSubmitting(prev => ({ ...prev, [submissionKey]: true }));
    try {
      await adminApi.updateVerificationStatus(entityType, userId, newStatus);
      toast.success(`User ${newStatus === 'VERIFIED' ? 'verified' : 'rejected'} successfully.`);
      // Instead of directly filtering pendingUsers, refetch to get the latest list from the server
      // This ensures consistency if multiple admins are working or if there are other side effects.
      fetchPendingUsers(); 
    } catch (err: any) {
      console.error(`Error ${newStatus === 'VERIFIED' ? 'verifying' : 'rejecting'} user:`, err);
      toast.error(err.response?.data?.error || `Failed to ${newStatus === 'VERIFIED' ? 'verify' : 'reject'} user.`);
    } finally {
      setIsSubmitting(prev => ({ ...prev, [submissionKey]: false }));
    }
  };

  if (isLoading && pendingUsers.length === 0) { // Show main loader only on initial load
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading users for verification...</p>
        </div>
      </div>
    );
  }

  // Error display if fetching fails (and no users are currently loaded to display)
  if (error && displayedPendingUsers.length === 0) {
    return (
      <div className="container mx-auto p-6">
          <Card className="border-destructive bg-destructive/10">
              <CardHeader>
                  <CardTitle className="text-destructive flex items-center">
                      <ShieldAlert className="mr-2 h-6 w-6"/> Error Loading Users
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-destructive">{error}</p>
                  <Button onClick={fetchPendingUsers} className="mt-4" variant="secondary" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Try Again
                  </Button>
              </CardContent>
          </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800">User Verification</CardTitle>
              <CardDescription className="text-sm md:text-lg text-gray-500 mt-1">
                Review and approve or reject new user registrations. ({displayedPendingUsers.length} pending)
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search by name, email, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
           {/* Role Filter Buttons */}
           {uniqueRoles.length > 1 && ( // Only show if there are roles to filter by (besides 'ALL')
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <Filter className="h-5 w-5 text-muted-foreground mr-1" />
              <span className="text-sm font-medium text-muted-foreground">Filter by Role:</span>
              {uniqueRoles.map(role => (
                <Button
                  key={role}
                  variant={selectedRoleFilter === role ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRoleFilter(role)}
                  className={cn(
                    "capitalize",
                    selectedRoleFilter === role ? "bg-primary text-primary-foreground" : ""
                  )}
                >
                  {role.toLowerCase().replace('_', ' ')}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && pendingUsers.length > 0 && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Refreshing user list...</p>
            </div>
          )}
          {!isLoading && displayedPendingUsers.length === 0 && !error && (
            <div className="text-center py-10">
              {searchTerm || selectedRoleFilter !== 'ALL' ? (
                <>
                  <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-xl font-semibold text-gray-700">No Users Found</p>
                  <p className="text-gray-500 mt-1">
                    No pending users match your current filter criteria.
                    {(searchTerm && selectedRoleFilter !=='ALL') && ` (Search: "${searchTerm}", Role: ${selectedRoleFilter})`}
                    {(searchTerm && selectedRoleFilter ==='ALL') && ` (Search: "${searchTerm}")`}
                    {(!searchTerm && selectedRoleFilter !=='ALL') && ` (Role: ${selectedRoleFilter})`}
                  </p>
                </>
              ) : (
                <>
                  <UserCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <p className="text-xl font-semibold text-gray-700">All Clear!</p>
                  <p className="text-gray-500 mt-1">There are no users currently awaiting verification.</p>
                </>
              )}
            </div>
          )}
          {displayedPendingUsers.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {(['name', 'userId', 'email', 'role', 'phone', 'createdAt'] as SortableField[]).map((field) => (
                      <TableHead 
                        key={field} 
                        className="cursor-pointer group hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort(field)}
                      >
                        <div className="flex items-center">
                          {field === 'userId' ? 'User ID' : field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} {/* Prettify name */}
                          {getSortIcon(field)}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedPendingUsers.map((user) => {
                    const submissionKey = `${user.entityType}-${user.id}`;
                    return (
                      <TableRow key={submissionKey}>
                        <TableCell className="font-medium text-gray-800">{user.name}</TableCell>
                        <TableCell className="text-gray-600">{user.userId || 'N/A'}</TableCell>
                        <TableCell className="text-gray-600 break-all">{user.email}</TableCell>
                        <TableCell className="capitalize">
                          {user.role.toLowerCase().replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-gray-600">{user.phone || 'N/A'}</TableCell>
                        <TableCell className="text-gray-600">
                          {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy h:mm a') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleVerificationAction(user.entityType, user.id, 'VERIFIED')}
                            disabled={isSubmitting[submissionKey]}
                            title={`Verify ${user.name}`}
                          >
                            {isSubmitting[submissionKey] ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Verify
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleVerificationAction(user.entityType, user.id, 'REJECTED')}
                            disabled={isSubmitting[submissionKey]}
                            title={`Reject ${user.name}`}
                          >
                             {isSubmitting[submissionKey] ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVerificationPage;
