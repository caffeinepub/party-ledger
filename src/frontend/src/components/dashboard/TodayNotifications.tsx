import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Bell, Loader2 } from 'lucide-react';
import { useTodayNotifications } from '../../hooks/queries/useTodayNotifications';
import { useGetAllParties } from '../../hooks/queries/useParties';
import { createTelLink } from '../../lib/phone';

export default function TodayNotifications() {
  const { data: notifications = [], isLoading } = useTodayNotifications();
  const { data: parties = [] } = useGetAllParties();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Payment Reminders
          </CardTitle>
          <CardDescription>Parties with payments due today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Payment Reminders
          </CardTitle>
          <CardDescription>Parties with payments due today</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No payments due today. All caught up! 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Payment Reminders
        </CardTitle>
        <CardDescription>
          {notifications.length} {notifications.length === 1 ? 'party has' : 'parties have'} payments due today
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map(([partyId, records]) => {
            const party = parties.find(([id]) => id === partyId)?.[1];
            if (!party) return null;

            return (
              <div
                key={partyId}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{party.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {records.length} payment{records.length !== 1 ? 's' : ''} due
                  </p>
                </div>
                {party.phone && (
                  <Button
                    size="sm"
                    variant="default"
                    asChild
                    className="shrink-0"
                  >
                    <a href={createTelLink(party.phone)}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
