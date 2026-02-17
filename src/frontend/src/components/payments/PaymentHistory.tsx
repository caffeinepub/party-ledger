import { formatMoney } from '../../lib/format';
import { formatDateTime, formatDate } from '../../lib/time';
import { Calendar, IndianRupee, MapPin } from 'lucide-react';
import type { VisitRecordMetadata, PaymentId } from '../../backend';

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
        <div key={payment.paymentId} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Payment ID: {payment.paymentId}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            {payment.hasNextPaymentDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Next payment scheduled</span>
              </div>
            )}
            
            {payment.hasLocation && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <MapPin className="h-4 w-4" />
                <span>Location saved</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
