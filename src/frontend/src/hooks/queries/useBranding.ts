import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import type { ShopBranding } from '../../backend';
import { ExternalBlob } from '../../backend';

export function useGetShopBranding() {
  const { actor } = useActorSession();

  return useQuery<ShopBranding | null>({
    queryKey: ['shopBranding'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getShopBranding();
    },
    enabled: !!actor,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useSetShopBranding() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string | null; logo: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setShopBranding(params.name, params.logo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopBranding'] });
    },
  });
}
