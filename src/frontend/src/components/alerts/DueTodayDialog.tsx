import { useNavigate } from '@tanstack/react-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Party, PartyId } from '../../backend';
import { Bell } from 'lucide-react';

interface DueTodayDialogProps {
  parties: Array<{ id: PartyId; party: Party }>;
  open: boolean;
  onClose: () => void;
}

export default function DueTodayDialog({ parties, open, onClose }: DueTodayDialogProps) {
  const navigate = useNavigate();

  const handleViewParty = (partyId: PartyId) => {
    onClose();
    navigate({ to: '/party/$partyId', params: { partyId } });
  };

  if (parties.length === 0) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5 text-primary" />
            <AlertDialogTitle>Payment Due Today</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            The following {parties.length === 1 ? 'party has' : 'parties have'} payments due today:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 my-4">
          {parties.map(({ id, party }) => (
            <div
              key={id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer"
              onClick={() => handleViewParty(id)}
            >
              <div>
                <p className="font-medium">{party.name}</p>
                <p className="text-sm text-muted-foreground">{party.phone}</p>
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
