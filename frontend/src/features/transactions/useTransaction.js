/**
 * @file useTransaction.js
 * @description React Query hook for fetching a single transaction. Different than useTransactions which is used for fetching multiple transactions
 */

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery, useQueryClient } from "@tanstack/react-query";

async function getTransaction(profileId, transactionId) {
  const res = await api.get(
    `/profiles/${profileId}/transactions/${transactionId}`,
  );
  return res.data;
}
export function useTransaction(profileId, transactionId) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.transactions.byProfileId.detail(
      profileId,
      transactionId,
    ),
    queryFn: () => getTransaction(profileId, transactionId),
    enabled: !!profileId && !!transactionId,
    // When this page loads we reuse the data from transactions data that we fetched earlier
    // For a faster inital load, we fetch new data in the background asap

    initialData: () => {
      const cachedTransactionsLists = queryClient.getQueriesData({
        queryKey: ["transactions", profileId, "all"],
      });
      console.log(cachedTransactionsLists);

      for (const [, data] of cachedTransactionsLists) {
        const hit = data?.find((t) => String(t.id) === String(transactionId));
        if (hit) return hit;
      }
      return undefined;
    },

    initialDataUpdatedAt: 0,
  });
}
