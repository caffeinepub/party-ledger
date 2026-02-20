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
import { useAddParty, useUpdateParty, useValidateAndGeneratePartyId } from '../../hooks/queries/useParties';
import { parseMoney } from '../../lib/format';
import { toast } from 'sonner';
import type { Party, PartyId } from '../../backend';
import { Loader2, AlertCircle } from 'lucide-react';

interface PartyFormDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  partyId?: PartyId;
  initialData?: Party;
}

export default function PartyFormDialog({ open, onClose, mode, partyId, initialData }: PartyFormDialogProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { mutateAsync: addParty, isPending: isAdding } = useAddParty();
  const { mutateAsync: generatePartyId, isPending: isGenerating } = useValidateAndGeneratePartyId();
  const { mutate: updateParty, isPending: isUpdating } = useUpdateParty();

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setName(initialData.name);
      setAddress(initialData.address);
      setPhone(initialData.phone);
      setPan(initialData.pan);
      setDueAmount(Number(initialData.dueAmount).toString());
    } else {
      setName('');
      setAddress('');
      setPhone('');
      setPan('');
      setDueAmount('');
    }
    setGenerationError(null);
  }, [mode, initialData, open]);

  const handleGenerateId = async () => {
    if (!name.trim()) {
      setGenerationError('Party name is required to generate ID');
      return null;
    }

    setGenerationError(null);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🟢 Form: Starting ID generation from form`, {
      name: name.trim(),
      phone: phone.trim(),
    });

    try {
      const newPartyId = await generatePartyId({ name: name.trim(), phone: phone.trim() });
      console.log(`[${timestamp}] 🟢 Form: ID generation successful`, { newPartyId });
      return newPartyId;
    } catch (error: any) {
      console.error(`[${timestamp}] 🔴 Form: ID generation failed`, {
        errorMessage: error?.message,
        fullError: error,
      });
      const errorMessage = error?.message || 'Failed to generate party ID';
      setGenerationError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🟡 Form: Submit triggered`, {
      mode,
      name: name.trim(),
      phone: phone.trim(),
      pan: pan.trim(),
    });

    if (!name.trim() || !pan.trim()) {
      toast.error('Name and PAN are required');
      return;
    }

    const dueAmountBigInt = parseMoney(dueAmount);

    if (mode === 'add') {
      try {
        console.log(`[${timestamp}] 🟡 Form: Generating party ID...`);
        const newPartyId = await handleGenerateId();
        
        if (!newPartyId) {
          console.error(`[${timestamp}] 🔴 Form: Party ID generation returned null/undefined`);
          return;
        }

        console.log(`[${timestamp}] 🟡 Form: Adding party with ID: ${newPartyId}`);
        await addParty({
          partyId: newPartyId,
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          pan: pan.trim(),
          dueAmount: dueAmountBigInt,
        });
        
        console.log(`[${timestamp}] ✅ Form: Party added successfully`);
        toast.success('Party added successfully');
        onClose();
      } catch (error: any) {
        console.error(`[${timestamp}] 🔴 Form: Failed to add party`, {
          errorMessage: error?.message,
          fullError: error,
        });
        toast.error(`Failed to add party: ${error.message}`);
      }
    } else if (mode === 'edit' && partyId) {
      console.log(`[${timestamp}] 🟡 Form: Updating party ${partyId}`);
      updateParty(
        { partyId, name: name.trim(), address: address.trim(), phone: phone.trim(), pan: pan.trim(), dueAmount: dueAmountBigInt },
        {
          onSuccess: () => {
            console.log(`[${timestamp}] ✅ Form: Party updated successfully`);
            toast.success('Party updated successfully');
            onClose();
          },
          onError: (error) => {
            console.error(`[${timestamp}] 🔴 Form: Failed to update party`, error);
            toast.error(`Failed to update party: ${error.message}`);
          },
        }
      );
    }
  };

  const isPending = isAdding || isUpdating || isGenerating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Party' : 'Edit Party'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Enter party details to add a new record' : 'Update party information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Party Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setGenerationError(null);
              }}
              placeholder="Enter party name"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
              rows={2}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setGenerationError(null);
              }}
              placeholder="Enter phone number"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pan">PAN *</Label>
            <Input
              id="pan"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              placeholder="Enter PAN"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueAmount">Due Amount (₹)</Label>
            <Input
              id="dueAmount"
              type="number"
              value={dueAmount}
              onChange={(e) => setDueAmount(e.target.value)}
              placeholder="0"
              disabled={isPending}
            />
          </div>

          {generationError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Party ID Generation Error</p>
                  <p className="mt-1">{generationError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleGenerateId}
                    disabled={isPending}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              <span>Generating Party ID...</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating ID...
                </>
              ) : isPending ? (
                'Saving...'
              ) : (
                mode === 'add' ? 'Add Party' : 'Update Party'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
