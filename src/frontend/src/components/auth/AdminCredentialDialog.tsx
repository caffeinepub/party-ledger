import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AlertCircle, Lock } from 'lucide-react';

interface AdminCredentialDialogProps {
  rePrompt?: boolean;
}

export default function AdminCredentialDialog({ rePrompt = false }: AdminCredentialDialogProps) {
  const { showPrompt, setShowPrompt, validateCredentials } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!showPrompt) {
      setUsername('');
      setPassword('');
      setError('');
    }
  }, [showPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    const isValid = validateCredentials(username.trim(), password);
    if (!isValid) {
      setError('Invalid credentials. Please try again.');
      setPassword('');
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {rePrompt ? 'Admin Session Expired' : 'Admin Access Required'}
          </DialogTitle>
          <DialogDescription>
            {rePrompt
              ? 'Your admin session has expired. Please re-enter your credentials to continue.'
              : 'Enter admin credentials to access management features. You can skip to continue as a viewer.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip (View Only)
            </Button>
            <Button type="submit">Login as Admin</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
