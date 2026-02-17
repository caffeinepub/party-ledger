import { useState } from 'react';
import { useGetAllParties } from '../hooks/queries/useParties';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Users } from 'lucide-react';
import { formatMoney } from '../lib/format';
import PartyVisitFormDialog from '../components/visits/PartyVisitFormDialog';
import type { PartyId } from '../backend';

export default function NewPartyVisitPage() {
  const { data: parties = [], isLoading } = useGetAllParties();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState<{ id: PartyId; name: string } | null>(null);

  const filteredParties = parties.filter(([_, party]) => {
    const query = searchQuery.toLowerCase();
    return (
      party.name.toLowerCase().includes(query) ||
      party.phone.toLowerCase().includes(query) ||
      party.pan.toLowerCase().includes(query)
    );
  });

  const handlePartySelect = (partyId: PartyId, partyName: string) => {
    setSelectedParty({ id: partyId, name: partyName });
  };

  const handleDialogClose = () => {
    setSelectedParty(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading parties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">New Party Visit</h1>
          <p className="text-muted-foreground">Select a party to record a visit</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or PAN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredParties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {searchQuery ? 'No parties found' : 'No parties available'}
            </p>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Add parties first to record visits'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredParties.map(([partyId, party]) => (
            <Card
              key={partyId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handlePartySelect(partyId, party.name)}
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

      {selectedParty && (
        <PartyVisitFormDialog
          open={!!selectedParty}
          onClose={handleDialogClose}
          partyId={selectedParty.id}
          partyName={selectedParty.name}
        />
      )}
    </div>
  );
}
