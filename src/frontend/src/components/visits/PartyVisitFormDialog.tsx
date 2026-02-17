import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRecordPartyVisit } from '../../hooks/queries/usePayments';
import { parseMoney } from '../../lib/format';
import { dateToTime, formatDate, dateToDatetimeLocal, datetimeLocalToDate } from '../../lib/time';
import { toast } from 'sonner';
import { MapPin, Loader2 } from 'lucide-react';
import type { PartyId, Location } from '../../backend';

interface PartyVisitFormDialogProps {
  open: boolean;
  onClose: () => void;
  partyId: PartyId;
  partyName: string;
}

type LocationStatus = 'idle' | 'getting' | 'captured' | 'unavailable';

export default function PartyVisitFormDialog({ 
  open, 
  onClose, 
  partyId, 
  partyName 
}: PartyVisitFormDialogProps) {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [visitDateTimeInput, setVisitDateTimeInput] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  const { mutate: recordVisit, isPending } = useRecordPartyVisit();

  // Initialize visit date/time and attempt location capture when dialog opens
  useEffect(() => {
    if (open) {
      // Initialize visit date/time to now
      const now = new Date();
      setVisitDateTimeInput(dateToDatetimeLocal(now));
      
      // Attempt to get location
      setLocationStatus('getting');
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationStatus('captured');
          },
          (error) => {
            console.log('Location error:', error.message);
            setLocationStatus('unavailable');
          },
          {
            timeout: 10000,
            enableHighAccuracy: false,
          }
        );
      } else {
        setLocationStatus('unavailable');
      }
    } else {
      // Reset form when dialog closes
      setAmount('');
      setComment('');
      setNextPaymentDate('');
      setVisitDateTimeInput('');
      setLocation(null);
      setLocationStatus('idle');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse and validate visit date/time
    const visitDateTime = datetimeLocalToDate(visitDateTimeInput);
    if (!visitDateTime) {
      toast.error('Please enter a valid visit date and time');
      return;
    }

    const amountBigInt = parseMoney(amount);

    // Validate: if amount is 0, next payment date is required
    if (amountBigInt === BigInt(0) && !nextPaymentDate) {
      toast.error('Next payment date is required when amount is 0');
      return;
    }

    const paymentDate = dateToTime(visitDateTime);
    const nextPayment = nextPaymentDate ? dateToTime(new Date(nextPaymentDate)) : null;

    recordVisit(
      { 
        partyId, 
        amount: amountBigInt, 
        comment: comment.trim(), 
        paymentDate, 
        nextPayment,
        location 
      },
      {
        onSuccess: () => {
          toast.success('Party visit recorded successfully');
          if (nextPayment) {
            const nextDate = formatDate(nextPayment);
            toast.success(`Next payment scheduled for ${nextDate}`);
          }
          onClose();
        },
        onError: (error) => {
          toast.error(`Failed to record visit: ${error.message}`);
        },
      }
    );
  };

  const amountValue = parseMoney(amount);
  const requiresNextDate = amountValue === BigInt(0);

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case 'getting':
        return 'Getting location...';
      case 'captured':
        return 'Location captured';
      case 'unavailable':
        return 'Location not available';
      default:
        return '';
    }
  };

  const getLocationStatusColor = () => {
    switch (locationStatus) {
      case 'getting':
        return 'text-muted-foreground';
      case 'captured':
        return 'text-green-600';
      case 'unavailable':
        return 'text-amber-600';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Party Visit</DialogTitle>
          <DialogDescription>
            Recording visit for {partyName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visitDateTime">Visit Date & Time *</Label>
            <Input
              id="visitDateTime"
              type="datetime-local"
              value={visitDateTimeInput}
              onChange={(e) => setVisitDateTimeInput(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location Status
            </Label>
            <div className={`flex items-center gap-2 text-sm ${getLocationStatusColor()}`}>
              {locationStatus === 'getting' && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{getLocationStatusText()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextPaymentDate">
              Next Payment Date {requiresNextDate && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="nextPaymentDate"
              type="date"
              value={nextPaymentDate}
              onChange={(e) => setNextPaymentDate(e.target.value)}
              required={requiresNextDate}
            />
            {requiresNextDate && (
              <p className="text-xs text-muted-foreground">
                Next payment date is required when amount is 0
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add notes about this visit"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Recording...' : 'Submit Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
