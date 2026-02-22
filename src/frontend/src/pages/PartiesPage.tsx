import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllParties } from '../hooks/queries/useParties';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Users, X, Download, Info } from 'lucide-react';
import { formatMoney } from '../lib/format';
import { exportPartiesToCSV } from '../lib/export/csvExport';
import PartyFormDialog from '../components/parties/PartyFormDialog';

export default function PartiesPage() {
  const navigate = useNavigate();
  const { data: parties = [], isLoading } = useGetAllParties();
  const { isAdmin } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredParties = useMemo(() => {
    return parties.filter(([_, party]) => {
      const query = searchQuery.toLowerCase();
      return (
        party.name.toLowerCase().includes(query) ||
        party.phone.toLowerCase().includes(query) ||
        party.pan.toLowerCase().includes(query)
      );
    });
  }, [parties, searchQuery]);

  const handlePartyClick = (partyId: string) => {
    navigate({ to: '/parties/$partyId', params: { partyId } });
  };

  const handleExport = () => {
    exportPartiesToCSV(filteredParties);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-10 w-full" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parties</h1>
          <p className="text-muted-foreground">Manage your party records</p>
        </div>
        <div className="flex gap-2">
          {filteredParties.length > 0 && (
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Party
            </Button>
          )}
        </div>
      </div>

      {!isAdmin && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have view-only access. Admin credentials are required to add or edit parties.
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or PAN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {filteredParties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {searchQuery ? 'No parties found' : 'No parties yet'}
            </p>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Add your first party to get started'}
            </p>
            {!searchQuery && isAdmin && (
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Party
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredParties.map(([partyId, party]) => (
            <Card
              key={partyId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handlePartyClick(partyId)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{party.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <span className="font-medium">{party.phone || 'N/A'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">PAN:</span>{' '}
                  <span className="font-medium">{party.pan}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Due:</span>{' '}
                  <span className="font-bold text-primary">{formatMoney(party.dueAmount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && (
        <PartyFormDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          mode="add"
        />
      )}
    </div>
  );
}
