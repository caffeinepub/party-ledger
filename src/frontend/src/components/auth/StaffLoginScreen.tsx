import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, KeyRound, CheckCircle } from 'lucide-react';
import { useStaffAuthContext } from '../../context/StaffAuthContext';
import ResetAdminPasswordDialog from './ResetAdminPasswordDialog';

export default function StaffLoginScreen() {
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, isAuthenticating, authError } = useStaffAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim() || !password.trim()) return;
    
    const success = await login(loginName.trim(), password);
    
    if (success) {
      setLoginSuccess(true);
    }
  };

  const handleResetSuccess = (credentials: { loginName: string; password: string }) => {
    // Auto-fill the login form with the newly reset credentials
    setLoginName(credentials.loginName);
    setPassword(credentials.password);
    
    // Optionally auto-submit the login
    setTimeout(() => {
      login(credentials.loginName, credentials.password).then((success) => {
        if (success) {
          setLoginSuccess(true);
        }
      });
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Staff Login</CardTitle>
          <CardDescription>
            Enter your staff ID and password to access the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginSuccess && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-sm leading-relaxed text-green-800 dark:text-green-200">
                  Login successful. Entering app...
                </AlertDescription>
              </Alert>
            )}

            {authError && !loginSuccess && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm leading-relaxed">
                  {authError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="loginName">Staff ID</Label>
              <Input
                id="loginName"
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="Enter your staff ID"
                disabled={isAuthenticating || loginSuccess}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isAuthenticating || loginSuccess}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isAuthenticating || !loginName.trim() || !password.trim() || loginSuccess}
            >
              {isAuthenticating || loginSuccess ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loginSuccess ? 'Entering app...' : 'Logging in...'}
                </>
              ) : (
                'Login'
              )}
            </Button>

            <div className="pt-2 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowResetDialog(true)}
                disabled={isAuthenticating || loginSuccess}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Admin Password
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Forgot your password? Use the one-tap default reset (password: rkbrothers.lts). 
                You must be signed in with Internet Identity as an admin first.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <ResetAdminPasswordDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onResetSuccess={handleResetSuccess}
      />
    </div>
  );
}
