import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle } from 'lucide-react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PrincipalDisplayCard() {
  const { identity } = useInternetIdentity();
  const [copied, setCopied] = useState(false);

  const principalId = identity?.getPrincipal().toString() || '';
  const isAuthenticated = !!identity;

  const handleCopy = async () => {
    if (!principalId) return;

    try {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      toast.success('Principal ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Principal ID</CardTitle>
        <CardDescription>
          Your unique Internet Identity Principal ID used for authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="principal-id">Principal ID</Label>
              <div className="flex gap-2">
                <Input
                  id="principal-id"
                  value={principalId}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this Principal ID with an administrator to grant you admin access.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            Not authenticated. Please log in with Internet Identity to view your Principal ID.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
