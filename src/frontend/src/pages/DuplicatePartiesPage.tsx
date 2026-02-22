import { useGetAllParties } from '../hooks/queries/useParties';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, AlertTriangle, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '../lib/format';
import type { Party } from '../backend';

export default function DuplicatePartiesPage() {
  const { data: parties, isLoading, error } = useGetAllParties();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Find Duplicate Parties</h1>
          <p className="text-muted-foreground">Identify potential duplicate party records</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
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
          <h1 className="text-3xl font-bold">Find Duplicate Parties</h1>
          <p className="text-muted-foreground">Identify potential duplicate party records</p>
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

  // Group parties by name (case-insensitive)
  const partyGroups = new Map<string, Array<[string, Party]>>();
  
  parties?.forEach(([partyId, party]) => {
    const normalizedName = party.name.toLowerCase().trim();
    if (!partyGroups.has(normalizedName)) {
      partyGroups.set(normalizedName, []);
    }
    partyGroups.get(normalizedName)!.push([partyId, party]);
  });

  // Filter to only groups with duplicates
  const duplicateGroups = Array.from(partyGroups.entries())
    .filter(([_, group]) => group.length > 1)
    .sort((a, b) => b[1].length - a[1].length); // Sort by number of duplicates

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Duplicate Parties</h1>
        <p className="text-muted-foreground">Identify and review potential duplicate party records</p>
      </div>

      {duplicateGroups.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Duplicate Records Detected</AlertTitle>
          <AlertDescription>
            Found {duplicateGroups.length} party name(s) with duplicate records. 
            Review the details below to identify which records should be merged or removed.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Duplicate Party Groups
          </CardTitle>
          <CardDescription>
            {duplicateGroups.length === 0 
              ? 'No duplicate party names found' 
              : `Found ${duplicateGroups.length} party name(s) with duplicates`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">✓ No duplicate party records detected</p>
              <p className="text-sm text-muted-foreground mt-2">All party names are unique</p>
            </div>
          ) : (
            <div className="space-y-6">
              {duplicateGroups.map(([normalizedName, group]) => (
                <div key={normalizedName} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{group[0][1].name}</h3>
                    <Badge variant="destructive">
                      {group.length} duplicates
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {group.map(([partyId, party]) => (
                      <div
                        key={partyId}
                        className="border rounded-md p-3 bg-card space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-sm">{party.name}</p>
                          <Badge variant="outline" className="text-xs">
                            ID: {partyId.split('.').pop()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            <span className="font-medium">Phone:</span> {party.phone || 'N/A'}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">PAN:</span> {party.pan || 'N/A'}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Address:</span> {party.address || 'N/A'}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Due:</span> {formatMoney(party.dueAmount)}
                          </p>
                        </div>
                        
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          {partyId}
                        </p>
                      </div>
                    ))}
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
