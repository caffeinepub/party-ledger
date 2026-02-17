import { useEffect, useState } from 'react';
import { useAppReadiness } from '../context/AppReadinessContext';
import type { PartyId, Party } from '../backend';

export function useDueTodayAlert() {
  const { isAppReadyForMainData } = useAppReadiness();
  const [partiesDueToday, setPartiesDueToday] = useState<Array<{ id: PartyId; party: Party }>>([]);
  const [dismissed, setDismissed] = useState(false);

  // Disable the alert entirely when app is not ready for main data
  useEffect(() => {
    if (!isAppReadyForMainData || dismissed) {
      setPartiesDueToday([]);
      return;
    }

    // This is a simplified implementation
    // The full implementation would require fetching all parties and their payment records
    // which is expensive. For now, we keep it disabled to avoid performance issues.
    // A better approach would be to have a backend query that returns parties due today.
  }, [isAppReadyForMainData, dismissed]);

  const dismissAlert = () => {
    setDismissed(true);
    setPartiesDueToday([]);
  };

  return { partiesDueToday, dismissAlert };
}
