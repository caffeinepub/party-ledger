import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, DollarSign, Phone } from 'lucide-react';
import { useTodayDashboard } from '../hooks/queries/useTodayDashboard';
import { formatMoney } from '../lib/format';
import { formatDateTime } from '../lib/time';
import { createTelLink } from '../lib/phone';
import { useNavigate } from '@tanstack/react-router';
import TodayNotifications from '../components/dashboard/TodayNotifications';
import UpcomingPaymentsCalendar from '../components/dashboard/UpcomingPaymentsCalendar';

export default function DashboardPage() {
  const { data, isLoading } = useTodayDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { visits, count, totalAmount } = data || { visits: [], count: 0, totalAmount: BigInt(0) };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Today's Dashboard</h1>
        <p className="text-muted-foreground">Overview of today's visits and payments</p>
      </div>

      {/* Today's Notifications */}
      <TodayNotifications />

      {/* Upcoming Payments Calendar */}
      <UpcomingPaymentsCalendar />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{count}</div>
            <p className="text-xs text-muted-foreground">
              Total visits recorded today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Total amount collected today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visits List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Visits</CardTitle>
          <CardDescription>
            {count === 0 ? 'No visits recorded today' : `${count} visit${count !== 1 ? 's' : ''} recorded`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No visits recorded today. Start by creating a new party visit.
            </p>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => (
                <Card key={`${visit.partyId}-${visit.paymentId}`} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{visit.partyName}</h3>
                          {visit.record.location && (
                            <span className="text-xs text-muted-foreground">📍</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatDateTime(visit.record.paymentDate)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-medium text-primary">
                            {formatMoney(visit.record.amount)}
                          </span>
                          {visit.record.comment && (
                            <span className="text-muted-foreground truncate">
                              {visit.record.comment}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate({ to: '/parties/$partyId', params: { partyId: visit.partyId } })}
                        >
                          View Party
                        </Button>
                        {visit.partyPhone && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a href={createTelLink(visit.partyPhone)}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
