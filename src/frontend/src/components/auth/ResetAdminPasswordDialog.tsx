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
import { AlertCircle, Loader2, Zap } from 'lucide-react';
import { useResetAdminPassword } from '../../hooks/queries/useStaffAdmin';
import { toast } from 'sonner';

interface ResetAdminPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResetSuccess?: (credentials: { loginName: string; password: string }) => void;
}

const DEFAULT_PASSWORD = 'rkbrothers.lts';
const ADMIN_LOGIN_NAME = 'rkbrothers.lts';

export default function ResetAdminPasswordDialog({
  open,
  onOpenChange,
  onResetSuccess,
}: ResetAdminPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const resetMutation = useResetAdminPassword();

  const handleUseDefaultPassword = () => {
    setNewPassword(DEFAULT_PASSWORD);
    setConfirmPassword(DEFAULT_PASSWORD);
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Client-side validation
    if (!newPassword.trim()) {
      setValidationError('New password is required');
      return;
    }

    if (!confirmPassword.trim()) {
      setValidationError('Please confirm your password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    try {
      const result = await resetMutation.mutateAsync(newPassword);
      
      // Only show success if mutation completes (which now includes verification)
      toast.success(
        `Admin password reset and verified successfully! You can now log in with Staff ID "${ADMIN_LOGIN_NAME}" and the new password.`,
        { duration: 6000 }
      );
      
      // Clear form
      setNewPassword('');
      setConfirmPassword('');
      
      // Close dialog
      onOpenChange(false);
      
      // Notify parent component with credentials
      if (onResetSuccess) {
        onResetSuccess(result);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to reset password';
      
      // Keep dialog open and show detailed error
      if (errorMessage.includes('must be logged in with Internet Identity') || errorMessage.includes('Actor not available')) {
        setValidationError('You must first sign in with Internet Identity before resetting the admin password.');
        toast.error(
          'You must first sign in with Internet Identity before resetting the admin password. Please log in with Internet Identity and try again.',
          { duration: 8000 }
        );
      } else if (errorMessage.includes('Only an admin') || errorMessage.includes('Unauthorized')) {
        setValidationError('Only an admin can reset the admin password.');
        toast.error(
          'Only an admin can reset the admin password. If this is first-time setup, ensure you are logged in with Internet Identity as the initial admin.',
          { duration: 10000 }
        );
      } else if (errorMessage.includes('bound to a different Internet Identity')) {
        setValidationError('This admin account is bound to a different Internet Identity.');
        toast.error(
          'This admin account is bound to a different Internet Identity. You must log in with the correct Internet Identity to reset the password.',
          { duration: 8000 }
        );
      } else if (errorMessage.includes('verification failed') || errorMessage.includes('does not work')) {
        setValidationError('Password reset verification failed. The backend may not have persisted the change.');
        toast.error(
          'Password reset verification failed: The password was not applied successfully. This may be due to a backend persistence issue. Please retry.',
          { duration: 8000 }
        );
      } else if (errorMessage.includes('backend may not have persisted')) {
        setValidationError('Backend persistence issue detected.');
        toast.error(
          'The password may have been set but could not be verified. This suggests a backend persistence issue. Please try logging in, and if it fails, retry the reset.',
          { duration: 10000 }
        );
      } else {
        setValidationError(errorMessage);
        toast.error(`Failed to reset password: ${errorMessage}`, { duration: 6000 });
      }
      
      // Do NOT close dialog on error - keep it open so user can retry
    }
  };

  const handleCancel = () => {
    setNewPassword('');
    setConfirmPassword('');
    setValidationError('');
    resetMutation.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Admin Password</DialogTitle>
          <DialogDescription>
            Set a new password for the admin account ({ADMIN_LOGIN_NAME}). You must be logged in with Internet Identity as an admin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleUseDefaultPassword}
              disabled={resetMutation.isPending}
            >
              <Zap className="mr-2 h-4 w-4" />
              Use Default Password ({DEFAULT_PASSWORD})
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Click above to auto-fill both fields with the default password
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={resetMutation.isPending}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={resetMutation.isPending}
              autoComplete="new-password"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={resetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                resetMutation.isPending ||
                !newPassword.trim() ||
                !confirmPassword.trim()
              }
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting & Verifying...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
