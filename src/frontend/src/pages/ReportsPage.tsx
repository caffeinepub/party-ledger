import { useState, useMemo } from 'react';
import { useGetAllParties } from '../hooks/queries/useParties';
import { useActorSafe } from '../hooks/useActorSafe';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatMoney } from '../lib/format';
import { formatDateTime, formatDate } from '../lib/time';
import { Calendar, IndianRupee, MapPin, Search, X, Filter, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // Fetch full visit records for advanced view
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

  // Calculate advanced analytics
  const analytics = useMemo(() => {
    if (payments.length === 0) return null;

    const totalPaid = payments.reduce((sum, [_, p]) => sum + p.amount, BigInt(0));
    const paymentsWithLocation = payments.filter(([_, p]) => p.location).length;
    const paymentsWithNextDate = payments.filter(([_, p]) => p.nextPaymentDate).length;
    const averagePayment = payments.length > 0 ? Number(totalPaid) / payments.length : 0;

    return {
      totalPaid,
      paymentsWithLocation,
      paymentsWithNextDate,
      averagePayment,
      totalPayments: payments.length,
    };
  }, [payments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Advanced Reports
          </h1>
          <p className="text-muted-foreground">Detailed payment history and comprehensive analytics</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Filter className="h-3 w-3 mr-1" />
          Advanced View
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Party for Detailed Analysis</CardTitle>
          <CardDescription>Search and filter parties to view comprehensive payment history</CardDescription>
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
              <SelectValue placeholder="Choose a party to view detailed reports" />
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
                    {party.name} - {party.phone}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedParty && (
        <>
          {/* Advanced Analytics Cards */}
          <div className="grid gap-6 md:grid-cols-3">
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
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <p className="font-medium">{selectedParty.phone}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Address</span>
                  <p className="font-medium text-sm">{selectedParty.address || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">PAN</span>
                  <p className="font-medium">{selectedParty.pan || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Current Due Amount</span>
                  <p className="text-xl font-bold text-primary">{formatMoney(selectedParty.dueAmount)}</p>
                </div>
                {analytics && (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground">Total Paid (All Time)</span>
                      <p className="text-lg font-bold text-green-600">{formatMoney(analytics.totalPaid)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Average Payment</span>
                      <p className="font-medium">{formatMoney(BigInt(Math.round(analytics.averagePayment)))}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Total Payments</span>
                  <p className="text-xl font-bold">{payments.length}</p>
                </div>
                {analytics && (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground">With Location Data</span>
                      <p className="font-medium">{analytics.paymentsWithLocation} ({Math.round((analytics.paymentsWithLocation / analytics.totalPayments) * 100)}%)</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">With Next Payment Date</span>
                      <p className="font-medium">{analytics.paymentsWithNextDate} ({Math.round((analytics.paymentsWithNextDate / analytics.totalPayments) * 100)}%)</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Latest Payment Details */}
          {latestPayment && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <p className="text-2xl font-bold text-primary">{formatMoney(latestPayment.amount)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Payment Date</span>
                    <p className="font-medium">{formatDateTime(latestPayment.paymentDate)}</p>
                  </div>
                  {latestPayment.nextPaymentDate && (
                    <div>
                      <span className="text-sm text-muted-foreground">Next Payment Scheduled</span>
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
                    <div>
                      <span className="text-sm text-muted-foreground">Location</span>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <MapPin className="h-4 w-4" />
                        <span>Lat: {latestPayment.location.latitude.toFixed(6)}, Lng: {latestPayment.location.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Payment History</CardTitle>
              <CardDescription>All {payments.length} payment records with full details</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No payment records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map(([paymentId, payment]) => (
                    <div key={paymentId} className="border rounded-lg p-4 space-y-3 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-5 w-5 text-primary" />
                          <span className="font-bold text-lg">{formatMoney(payment.amount)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDateTime(payment.paymentDate)}</p>
                          <p className="text-xs text-muted-foreground">ID: {paymentId}</p>
                        </div>
                      </div>
                      
                      {payment.comment && payment.comment.trim() !== '' && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Comment: </span>
                          <span className="italic">{payment.comment}</span>
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
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <MapPin className="h-4 w-4" />
                            <span>Location: {payment.location.latitude.toFixed(4)}, {payment.location.longitude.toFixed(4)}</span>
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
