import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Key, UserX, UserCheck, Shield } from 'lucide-react';
import { useListStaffAccounts, useCreateStaffAccount, useUpdateStaffAccount } from '../../hooks/queries/useStaffAdmin';
import { toast } from 'sonner';
import type { StaffAccountInfo } from '../../backend';
import { ADMIN_STAFF_ACCOUNTS } from '../../utils/staffSession';

export default function StaffManagementPanel() {
  const { data: accounts, isLoading } = useListStaffAccounts();
  const createMutation = useCreateStaffAccount();
  const updateMutation = useUpdateStaffAccount();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<StaffAccountInfo | null>(null);

  const [newLoginName, setNewLoginName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCanViewAll, setNewCanViewAll] = useState(true);

  const [resetPassword, setResetPassword] = useState('');

  const isAdminAccount = (loginName: string): boolean => {
    return ADMIN_STAFF_ACCOUNTS.includes(loginName);
  };

  const handleCreateStaff = async () => {
    if (!newLoginName.trim() || !newPassword.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createMutation.mutateAsync({
        loginName: newLoginName.trim(),
        password: newPassword,
        canViewAllRecords: newCanViewAll,
      });
      toast.success('Staff account created successfully');
      setCreateDialogOpen(false);
      setNewLoginName('');
      setNewPassword('');
      setNewCanViewAll(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create staff account');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAccount || !resetPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        loginName: selectedAccount.loginName,
        newPassword: resetPassword,
      });
      toast.success('Password reset successfully');
      setResetPasswordDialogOpen(false);
      setResetPassword('');
      setSelectedAccount(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    }
  };

  const handleTogglePermission = async (account: StaffAccountInfo) => {
    try {
      await updateMutation.mutateAsync({
        loginName: account.loginName,
        canViewAllRecords: !account.canViewAllRecords,
      });
      toast.success('Permissions updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permissions');
    }
  };

  const handleToggleDisabled = async (account: StaffAccountInfo) => {
    try {
      await updateMutation.mutateAsync({
        loginName: account.loginName,
        isDisabled: !account.isDisabled,
      });
      toast.success(account.isDisabled ? 'Account enabled' : 'Account disabled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account status');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Create and manage staff accounts</CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Staff Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!accounts || accounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No staff accounts yet. Create one to get started.
            </p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Bound Identity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.loginName}>
                      <TableCell className="font-medium">
                        {account.loginName}
                        {isAdminAccount(account.loginName) && (
                          <Badge variant="secondary" className="ml-2">Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.isDisabled ? (
                          <Badge variant="destructive">Disabled</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.canViewAllRecords ? (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Full Access
                          </Badge>
                        ) : (
                          <Badge variant="outline">Limited</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.boundPrincipal ? (
                          <span className="text-xs text-muted-foreground">Bound</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not bound</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAccount(account);
                              setResetPasswordDialogOpen(true);
                            }}
                            disabled={isAdminAccount(account.loginName)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePermission(account)}
                            disabled={isAdminAccount(account.loginName)}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleDisabled(account)}
                            disabled={isAdminAccount(account.loginName)}
                          >
                            {account.isDisabled ? (
                              <UserCheck className="h-4 w-4" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Staff Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Staff Account</DialogTitle>
            <DialogDescription>
              Create a new staff account with login credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-loginName">Staff ID</Label>
              <Input
                id="create-loginName"
                value={newLoginName}
                onChange={(e) => setNewLoginName(e.target.value)}
                placeholder="e.g., staff.name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-permissions">Full Access (View All Records)</Label>
              <Switch
                id="create-permissions"
                checked={newCanViewAll}
                onCheckedChange={setNewCanViewAll}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStaff} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedAccount?.loginName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResetPasswordDialogOpen(false);
              setResetPassword('');
              setSelectedAccount(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
