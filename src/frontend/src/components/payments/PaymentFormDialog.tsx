import { useState } from 'react';
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
import { useRecordPayment } from '../../hooks/queries/usePayments';
import { parseMoney } from '../../lib/format';
import { dateToTime } from '../../lib/time';
import { toast } from 'sonner';
import type { PartyId } from '../../backend';

interface PaymentFormDialogProps {
  open: boolean;
  onClose: () => void;
  partyId: PartyId;
}

export default function PaymentFormDialog({ open, onClose, partyId }: PaymentFormDialogProps) {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');

  const { mutate: recordPayment, isPending } = useRecordPayment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountBigInt = parseMoney(amount);

    // Validate: if amount is 0, next payment date is required
    if (amountBigInt === BigInt(0) && !nextPaymentDate) {
      toast.error('Next payment date is required when amount is 0');
      return;
    }

    const paymentDate = dateToTime(new Date());
    const nextPayment = nextPaymentDate ? dateToTime(new Date(nextPaymentDate)) : null;

    recordPayment(
      { partyId, amount: amountBigInt, comment: comment.trim(), paymentDate, nextPayment },
      {
        onSuccess: () => {
          toast.success('Payment recorded successfully');
          setAmount('');
          setComment('');
          setNextPaymentDate('');
          onClose();
        },
        onError: (error) => {
          toast.error(`Failed to record payment: ${error.message}`);
        },
      }
    );
  };

  const amountValue = parseMoney(amount);
  const requiresNextDate = amountValue === BigInt(0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter payment details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
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
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note about this payment"
              rows={3}
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

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
