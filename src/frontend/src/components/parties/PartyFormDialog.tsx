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
  }, [mode, initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !pan.trim()) {
      toast.error('Name and PAN are required');
      return;
    }

    const dueAmountBigInt = parseMoney(dueAmount);

    if (mode === 'add') {
      try {
        // Generate party ID first
        const newPartyId = await generatePartyId({ name: name.trim(), phone: phone.trim() });
        await addParty({
          partyId: newPartyId,
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          pan: pan.trim(),
          dueAmount: dueAmountBigInt,
        });
        toast.success('Party added successfully');
        onClose();
      } catch (error: any) {
        toast.error(`Failed to add party: ${error.message}`);
      }
    } else if (mode === 'edit' && partyId) {
      updateParty(
        { partyId, name: name.trim(), address: address.trim(), phone: phone.trim(), pan: pan.trim(), dueAmount: dueAmountBigInt },
        {
          onSuccess: () => {
            toast.success('Party updated successfully');
            onClose();
          },
          onError: (error) => {
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
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter party name"
              required
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
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
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : mode === 'add' ? 'Add Party' : 'Update Party'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
