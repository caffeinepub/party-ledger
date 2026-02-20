import { useState, useMemo } from 'react';
import { useGetAllParties } from '../hooks/queries/useParties';
import { useActorSafe } from '../hooks/useActorSafe';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatMoney } from '../lib/format';
import { formatDateTime, formatDate } from '../lib/time';
import { Calendar, IndianRupee, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PartyId, PartyVisitRecord, PaymentId } from '../backend';

export default function ReportsPage() {
  const { data: parties = [], isLoading: partiesLoading } = useGetAllParties();
  const [selectedPartyId, setSelectedPartyId] = useState<PartyId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { actor } = useActorSafe();

  // Filter parties based on search query
  const filteredParties = useMemo(() => {
    if (!searchQuery.trim()) return parties;
    
    const query = searchQuery.toLowerCase();
    return parties.filter(([_, party]) => {
      return (
        party.name.toLowerCase().includes(query) ||
        party.phone.toLowerCase().includes(query) ||
        party.pan.toLowerCase().includes(query)
      );
    });
  }, [parties, searchQuery]);

  // Fetch full visit records instead of just metadata
  const { data: payments = [] } = useQuery<Array<[PaymentId, PartyVisitRecord]>>({
    queryKey: ['fullPayments', selectedPartyId],
    queryFn: async () => {
      if (!actor || !selectedPartyId) return [];
      return actor.getPartyVisitRecords(selectedPartyId);
    },
    enabled: !!actor && !!selectedPartyId,
  });

  const selectedParty = parties.find(([id]) => id === selectedPartyId)?.[1];
  const latestPayment = payments.length > 0 ? payments[payments.length - 1][1] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View payment history and analytics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Party</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or PAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
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

          {/* Party Selector */}
          <Select value={selectedPartyId || ''} onValueChange={setSelectedPartyId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a party to view reports" />
            </SelectTrigger>
            <SelectContent>
              {partiesLoading ? (
                <SelectItem value="loading" disabled>
                  Loading parties...
                </SelectItem>
              ) : filteredParties.length === 0 ? (
                <SelectItem value="empty" disabled>
                  {searchQuery ? 'No parties match your search' : 'No parties available'}
                </SelectItem>
              ) : (
                filteredParties.map(([id, party]) => (
                  <SelectItem key={id} value={id}>
                    {party.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedParty && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Party Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Name</span>
                  <p className="font-medium">{selectedParty.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Due Amount</span>
                  <p className="text-xl font-bold text-primary">{formatMoney(selectedParty.dueAmount)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Payments</span>
                  <p className="font-medium">{payments.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {latestPayment ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <p className="text-xl font-bold text-primary">{formatMoney(latestPayment.amount)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Date</span>
                      <p className="font-medium">{formatDateTime(latestPayment.paymentDate)}</p>
                    </div>
                    {latestPayment.nextPaymentDate && (
                      <div>
                        <span className="text-sm text-muted-foreground">Next Payment</span>
                        <p className="font-medium">{formatDate(latestPayment.nextPaymentDate)}</p>
                      </div>
                    )}
                    {latestPayment.comment && latestPayment.comment.trim() !== '' && (
                      <div>
                        <span className="text-sm text-muted-foreground">Comment</span>
                        <p className="font-medium italic">{latestPayment.comment}</p>
                      </div>
                    )}
                    {latestPayment.location && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <MapPin className="h-4 w-4" />
                        <span>Location saved</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No payments recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No payment records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map(([paymentId, payment]) => (
                    <div key={paymentId} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-primary" />
                          <span className="font-bold text-lg">{formatMoney(payment.amount)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(payment.paymentDate)}
                        </span>
                      </div>
                      
                      {payment.comment && payment.comment.trim() !== '' && (
                        <div className="text-sm text-muted-foreground">
                          <p className="italic">{payment.comment}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        {payment.nextPaymentDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Next payment:</span>
                            <span className="font-medium">{formatDate(payment.nextPaymentDate)}</span>
                          </div>
                        )}
                        
                        {payment.location && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <MapPin className="h-4 w-4" />
                            <span>Location saved</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
