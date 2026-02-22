import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Calendar, Loader2 } from 'lucide-react';
import { useUpcomingPayments } from '../../hooks/queries/useUpcomingPayments';
import { createTelLink } from '../../lib/phone';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UpcomingPaymentsCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: parties = [], isLoading } = useUpcomingPayments(selectedDate);
  const navigate = useNavigate();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const newDate = new Date(dateValue + 'T00:00:00');
      setSelectedDate(newDate);
    }
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    if (dateToCheck.getTime() === today.getTime()) {
      return 'Today';
    } else {
      return date.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const isToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() === today.getTime();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payment Reminders
          </CardTitle>
          <CardDescription>View payments due by date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Payment Reminders
        </CardTitle>
        <CardDescription>View payments due by date</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Date Picker Section */}
          <div className="flex flex-col sm:flex-row gap-3 pb-4 border-b">
            <div className="flex-1">
              <Label htmlFor="payment-date" className="text-sm font-medium mb-2 block">
                Select Date
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={formatDateForInput(selectedDate)}
                onChange={handleDateChange}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant={isToday() ? 'default' : 'outline'}
                onClick={handleTodayClick}
                className="w-full sm:w-auto"
              >
                Today
              </Button>
            </div>
          </div>

          {/* Selected Date Display */}
          <div className="flex items-center gap-2 pb-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-lg">{formatDisplayDate(selectedDate)}</h3>
            <span className="text-sm text-muted-foreground ml-auto">
              {parties.length} {parties.length === 1 ? 'payment' : 'payments'}
            </span>
          </div>

          {/* Parties List */}
          {parties.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No payments due on this date. 🎉
            </p>
          ) : (
            <div className="space-y-2">
              {parties.map((party) => (
                <div
                  key={party.partyId}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate({ to: '/parties/$partyId', params: { partyId: party.partyId } })}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {party.partyName || party.partyId}
                    </h4>
                    {party.partyPhone && (
                      <p className="text-sm text-muted-foreground">{party.partyPhone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {party.partyPhone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={createTelLink(party.partyPhone)}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
