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
  const { partyId } = useParams({ from: '/party/$partyId' });
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
        navigate({ to: '/' });
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
        <Button onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Parties
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold">{party.name}</h1>
          <p className="text-muted-foreground">Party Details</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {party.phone && (
            <Button variant="outline" asChild>
              <a href={createTelLink(party.phone)} className="gap-2">
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
          )}
          <Button variant="default" onClick={() => setShowVisitDialog(true)}>
            <MapPin className="h-4 w-4 mr-2" />
            Party Visit
          </Button>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Party Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Name</span>
              <p className="font-medium">{party.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Address</span>
              <p className="font-medium">{party.address || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Phone</span>
              <p className="font-medium">{formatPhone(party.phone)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">PAN</span>
              <p className="font-medium">{formatPAN(party.pan)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Due Amount</span>
              <p className="text-xl font-bold text-primary">{formatMoney(party.dueAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              <Button size="sm" onClick={() => setShowPaymentDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <PaymentHistory payments={payments} />
          </CardContent>
        </Card>
      </div>

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
            <AlertDialogTitle>Delete Party</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {party.name}? This action cannot be undone and will also delete all payment records.
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
