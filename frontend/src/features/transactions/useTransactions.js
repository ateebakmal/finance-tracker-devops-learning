import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

async function fetchTransactions(profileId, filters) {
  const res = await api.get(`/profiles/${profileId}/transactions`, {
    params: filters,
  });
  return res.data;
}

export function useTransaction(profileId, filters = null) {
  return useQuery({
    queryKey: queryKeys.transactions.byProfileId.all(profileId, filters),
    queryFn: () => fetchTransactions(profileId, filters),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000,
    refetchOnReconnect: true,
  });
}
