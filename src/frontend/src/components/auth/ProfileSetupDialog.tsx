import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '@/hooks/queries/useAuth';
import { useAuthenticateStaff } from '@/hooks/queries/useStaffPermissions';

interface ProfileSetupDialogProps {
  open: boolean;
}

export default function ProfileSetupDialog({ open }: ProfileSetupDialogProps) {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();
  const authenticateStaff = useAuthenticateStaff();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      // First save the user profile
      await saveProfile.mutateAsync({ name: name.trim() });
      
      // Then authenticate as staff with the same name
      await authenticateStaff.mutateAsync(name.trim());
    } catch (error) {
      console.error('Profile setup error:', error);
    }
  };

  const isLoading = saveProfile.isPending || authenticateStaff.isPending;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Set up your profile</DialogTitle>
          <DialogDescription>
            Please enter your name to get started. This will be used to identify you in the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={!name.trim() || isLoading}>
            {isLoading ? 'Setting up...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
