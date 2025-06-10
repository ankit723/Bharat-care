'use client';

import React, { useState, useEffect } from 'react';
import { rewardsApi, RewardSetting } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, RefreshCcw, Settings, Edit } from 'lucide-react';

const RewardSettingsComponent = () => {
  const [settings, setSettings] = useState<RewardSetting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingSetting, setEditingSetting] = useState<RewardSetting | null>(null);
  const [newValue, setNewValue] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await rewardsApi.getRewardSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching reward settings:', error);
      toast.error('Failed to load reward settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (setting: RewardSetting) => {
    setEditingSetting(setting);
    setNewValue(setting.value);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingSetting) return;
    
    if (newValue < 0) {
      toast.error('Value must be a non-negative number');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await rewardsApi.updateRewardSetting(editingSetting.key, newValue);
      
      // Update the settings list with the new value
      setSettings(settings.map(setting => 
        setting.id === editingSetting.id ? response.data : setting
      ));
      
      setIsDialogOpen(false);
      toast.success(`${editingSetting.description} updated successfully`);
    } catch (error: any) {
      console.error('Error updating reward setting:', error);
      toast.error(error.response?.data?.error || 'Failed to update setting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl flex items-center">
            <Settings className="mr-2 h-6 w-6 text-primary" />
            Reward Settings
          </CardTitle>
          <CardDescription>
            Manage reward points and referral settings for the entire application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={fetchSettings} className="flex items-center">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No reward settings found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Updated By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.key.replace('_', ' ')}</TableCell>
                    <TableCell>{setting.description}</TableCell>
                    <TableCell>{setting.value}</TableCell>
                    <TableCell>{formatDate(setting.updatedAt)}</TableCell>
                    <TableCell>{setting.updatedBy?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(setting)} className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {editingSetting?.description}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="value" className="text-right text-sm font-medium">
                      Value
                    </label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      value={newValue}
                      onChange={(e) => setNewValue(parseInt(e.target.value) || 0)}
                      className="col-span-3"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardSettingsComponent; 