import { formatMoney } from '../../lib/format';
import { formatDateTime, formatDate } from '../../lib/time';
import { Calendar, IndianRupee, MapPin } from 'lucide-react';
import type { VisitRecordMetadata } from '../../backend';

interface PaymentHistoryProps {
  payments: Array<VisitRecordMetadata>;
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No payment records yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div key={payment.paymentId} className="border rounded-lg p-4 space-y-2 hover:bg-accent/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Payment ID: {payment.paymentId}</span>
            </div>
            <div className="flex items-center gap-2">
              {payment.hasLocation && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" title="Location recorded">
                  <MapPin className="h-3 w-3" />
                  <span>Location</span>
                </div>
              )}
              {payment.hasNextPaymentDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" title="Next payment date set">
                  <Calendar className="h-3 w-3" />
                  <span>Next Due</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
