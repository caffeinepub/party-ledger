import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface AccessDeniedScreenProps {
  reason?: string;
}

export default function AccessDeniedScreen({ reason }: AccessDeniedScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Access Denied</CardTitle>
          </div>
          <CardDescription>
            You do not have permission to access this area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {reason || 'Your account does not have the required permissions to view this content. Please contact your administrator if you believe this is an error.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
