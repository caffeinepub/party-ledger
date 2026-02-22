import { useGetAllParties } from '../hooks/queries/useParties';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AllPartiesListPage() {
  const { data: parties, isLoading, error } = useGetAllParties();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Parties</h1>
          <p className="text-muted-foreground">Complete list of all party names</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Parties</h1>
          <p className="text-muted-foreground">Complete list of all party names</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load parties: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sortedParties = [...(parties || [])].sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Parties</h1>
        <p className="text-muted-foreground">Complete list of all party names in the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Party Names ({sortedParties.length})
          </CardTitle>
          <CardDescription>
            All registered parties sorted alphabetically by name
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedParties.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No parties found</p>
          ) : (
            <div className="space-y-2">
              {sortedParties.map(([partyId, party]) => (
                <div
                  key={partyId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{party.name}</p>
                    <p className="text-sm text-muted-foreground">{party.address}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{party.phone || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
