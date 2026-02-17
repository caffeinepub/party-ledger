import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Phone, MapPin, Calendar } from 'lucide-react';
import { useActorSafe } from '../hooks/useActorSafe';
import { useQuery } from '@tanstack/react-query';
import { formatMoney } from '../lib/format';
import { formatDateTime } from '../lib/time';
import { createTelLink } from '../lib/phone';
import type { PartyVisitRecord, Party } from '../backend';

export default function VisitDetailsPage() {
  const { partyId, paymentId } = useParams({ strict: false }) as { partyId: string; paymentId: string };
  const navigate = useNavigate();
  const { actor } = useActorSafe();

  const { data: party, isLoading: partyLoading } = useQuery<Party | null>({
    queryKey: ['party', partyId],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getParty(partyId);
      if (!result) return null;
      return {
        id: partyId,
        ...result,
      };
    },
    enabled: !!actor && !!partyId,
  });

  const { data: visitRecord, isLoading: recordLoading } = useQuery<PartyVisitRecord | null>({
    queryKey: ['visitRecord', partyId, paymentId],
    queryFn: async () => {
      if (!actor) return null;
      const records = await actor.getPartyVisitRecords(partyId);
      const found = records.find(([id]) => id === paymentId);
      return found ? found[1] : null;
    },
    enabled: !!actor && !!partyId && !!paymentId,
  });

  if (partyLoading || recordLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!party || !visitRecord) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Visit record not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{party.name}</CardTitle>
          <CardDescription>Visit Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Amount</p>
              <p className="text-2xl font-bold text-primary">
                {formatMoney(visitRecord.amount)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Visit Date & Time</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg">{formatDateTime(visitRecord.paymentDate)}</p>
              </div>
            </div>
          </div>

          {visitRecord.comment && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Comment</p>
              <p className="text-sm">{visitRecord.comment}</p>
            </div>
          )}

          {visitRecord.nextPaymentDate && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Next Payment Date</p>
              <p className="text-sm">{formatDateTime(visitRecord.nextPaymentDate)}</p>
            </div>
          )}

          {visitRecord.location && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  {visitRecord.location.latitude.toFixed(6)}, {visitRecord.location.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {party.phone && (
            <div className="pt-4 border-t">
              <Button asChild className="w-full">
                <a href={createTelLink(party.phone)}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call {party.name}
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
