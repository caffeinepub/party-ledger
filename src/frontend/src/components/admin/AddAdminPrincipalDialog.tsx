import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAddAdminPrincipal } from '../../hooks/queries/useAdminPrincipals';
import { Principal } from '@dfinity/principal';

interface AddAdminPrincipalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddAdminPrincipalDialog({
  open,
  onOpenChange,
}: AddAdminPrincipalDialogProps) {
  const [principalId, setPrincipalId] = useState('');
  const [validationError, setValidationError] = useState('');

  const addMutation = useAddAdminPrincipal();

  const validatePrincipal = (value: string): boolean => {
    if (!value.trim()) {
      setValidationError('Principal ID is required');
      return false;
    }

    try {
      Principal.fromText(value.trim());
      setValidationError('');
      return true;
    } catch (error) {
      setValidationError('Invalid Principal ID format');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePrincipal(principalId)) {
      return;
    }

    try {
      await addMutation.mutateAsync(principalId.trim());
      setPrincipalId('');
      setValidationError('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleClose = () => {
    setPrincipalId('');
    setValidationError('');
    addMutation.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Admin Principal</DialogTitle>
          <DialogDescription>
            Enter the Principal ID of the user you want to grant admin access to.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="principal-id">Principal ID</Label>
            <Input
              id="principal-id"
              value={principalId}
              onChange={(e) => {
                setPrincipalId(e.target.value);
                setValidationError('');
              }}
              placeholder="Enter Principal ID"
              className="font-mono text-sm"
              disabled={addMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              The Principal ID should look like: abc123-xyz789-...
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Admin'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
