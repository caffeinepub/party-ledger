import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import type { UpgradeData } from '../../backend';

export function useExportData() {
  const { actor } = useActorSession();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportUpgradeData();
    },
  });
}

export function useImportData() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpgradeData) => {
      if (!actor) throw new Error('Actor not available');
      await actor.importUpgradeData(data);
    },
    onSuccess: () => {
      // Invalidate all data queries
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['shopBranding'] });
      queryClient.invalidateQueries({ queryKey: ['todayDashboard'] });
    },
  });
}
