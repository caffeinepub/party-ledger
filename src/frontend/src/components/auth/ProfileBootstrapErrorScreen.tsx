import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ProfileBootstrapErrorScreenProps {
  onRetry: () => void;
}

export default function ProfileBootstrapErrorScreen({ onRetry }: ProfileBootstrapErrorScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-md px-6">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-3">Failed to Load Profile</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load your profile. Please try again.
        </p>
        <Button onClick={onRetry} size="lg">
          Retry
        </Button>
      </div>
    </div>
  );
}
