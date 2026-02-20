import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useGetParty, useDeleteParty } from '../hooks/queries/useParties';
import { useGetPayments } from '../hooks/queries/usePayments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Phone, Plus, MapPin } from 'lucide-react';
import { formatMoney, formatPhone, formatPAN } from '../lib/format';
import { createTelLink } from '../lib/phone';
import PartyFormDialog from '../components/parties/PartyFormDialog';
import PaymentFormDialog from '../components/payments/PaymentFormDialog';
import PartyVisitFormDialog from '../components/visits/PartyVisitFormDialog';
import PaymentHistory from '../components/payments/PaymentHistory';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function PartyDetailsPage() {
  const navigate = useNavigate();
  const { partyId } = useParams({ from: '/parties/$partyId' });
  const { data: party, isLoading } = useGetParty(partyId);
  const { data: payments = [] } = useGetPayments(partyId);
  const { mutate: deleteParty, isPending: isDeleting } = useDeleteParty();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    deleteParty(partyId, {
      onSuccess: () => {
        toast.success('Party deleted successfully');
        navigate({ to: '/parties' });
      },
      onError: (error) => {
        toast.error(`Failed to delete party: ${error.message}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading party details...</p>
        </div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium mb-2">Party not found</p>
        <Button onClick={() => navigate({ to: '/parties' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Parties
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/parties' })} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold break-words">{party.name}</h1>
          <p className="text-muted-foreground">Party details and payment history</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Party Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="font-medium">{party.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{formatPhone(party.phone)}</p>
                {party.phone && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={createTelLink(party.phone)}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              <p className="font-medium">{party.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">PAN</p>
              <p className="font-medium">{formatPAN(party.pan)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Due Amount</p>
              <p className="text-xl font-bold text-primary">{formatMoney(party.dueAmount)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button onClick={() => setShowEditDialog(true)} variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button onClick={() => setShowPaymentDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
            <Button onClick={() => setShowVisitDialog(true)} variant="secondary" className="gap-2">
              <MapPin className="h-4 w-4" />
              Party Visit
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentHistory payments={payments} />
        </CardContent>
      </Card>

      <PartyFormDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        mode="edit"
        partyId={partyId}
        initialData={party}
      />

      <PaymentFormDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        partyId={partyId}
      />

      <PartyVisitFormDialog
        open={showVisitDialog}
        onClose={() => setShowVisitDialog(false)}
        partyId={partyId}
        partyName={party.name}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the party "{party.name}" and all associated payment records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
