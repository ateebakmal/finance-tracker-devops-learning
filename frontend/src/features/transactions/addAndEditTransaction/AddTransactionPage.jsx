import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";
import { useProfile } from "../../profiles/useProfile";
import TransactionForm from "./TransactionForm";

async function addTransaction(profileId, payload) {
  const result = await api.post(`/profiles/${profileId}/transactions`, payload);
  return result.data;
}

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { activeProfileId } = useProfile();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload) => addTransaction(activeProfileId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes("transactions") &&
          query.queryKey.includes(activeProfileId),
      });
      navigate(-1);
    },
  });

  function handleSubmit(payload) {
    toast.promise(mutateAsync(payload), {
      loading: "Saving transaction...",
      success: "Transaction Saved",
      error: (e) => getApiErrorMessage(e) ?? "Couldn't save transaction",
    });
  }

  return (
    <TransactionForm
      mode="add"
      title="New transaction"
      submitLabel="Add transaction"
      submitting={isPending}
      onSubmit={handleSubmit}
    />
  );
}
