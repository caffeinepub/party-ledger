import { useState } from 'react';
import type { PartyId, Party } from '../backend';

export function useDueTodayAlert() {
  const [partiesDueToday] = useState<Array<{ id: PartyId; party: Party }>>([]);
  const [dismissed, setDismissed] = useState(false);

  // This is a simplified implementation
  // The full implementation would require fetching all parties and their payment records
  // which is expensive. For now, we keep it disabled to avoid performance issues.
  // A better approach would be to have a backend query that returns parties due today.

  const dismissAlert = () => {
    setDismissed(true);
  };

  return { partiesDueToday, dismissAlert };
}
