import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, Shield, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGetAdminPrincipals, useRemoveAdminPrincipal, useIsCallerAdmin } from '../../hooks/queries/useAdminPrincipals';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import AddAdminPrincipalDialog from './AddAdminPrincipalDialog';

export default function AdminPrincipalsPanel() {
  const { data: adminPrincipals, isLoading } = useGetAdminPrincipals();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const removeMutation = useRemoveAdminPrincipal();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState<string | null>(null);

  const currentPrincipalId = identity?.getPrincipal().toString() || '';

  const handleRemoveClick = (principalId: string) => {
    setSelectedPrincipal(principalId);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!selectedPrincipal) return;

    try {
      await removeMutation.mutateAsync(selectedPrincipal);
      setRemoveDialogOpen(false);
      setSelectedPrincipal(null);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  // Only show this panel to admin users
  if (isAdminLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const canRemove = (adminPrincipals?.length || 0) > 1;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Principals
              </CardTitle>
              <CardDescription>
                Manage users with admin access to the application
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canRemove && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                At least one admin is required. You cannot remove the last admin Principal from the system.
              </AlertDescription>
            </Alert>
          )}

          {!adminPrincipals || adminPrincipals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No admin principals found.
            </p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminPrincipals.map((principal) => {
                    const principalId = principal.toString();
                    const isCurrentUser = principalId === currentPrincipalId;

                    return (
                      <TableRow key={principalId}>
                        <TableCell className="font-mono text-sm">
                          {principalId}
                        </TableCell>
                        <TableCell>
                          {isCurrentUser && (
                            <Badge variant="secondary">You</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveClick(principalId)}
                            disabled={!canRemove || removeMutation.isPending}
                            title={!canRemove ? 'Cannot remove the last admin' : 'Remove admin access'}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      <AddAdminPrincipalDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access for this Principal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
