import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";
import { useProfile } from "../../profiles/useProfile";
import { useTransaction } from "../useTransaction";
import { Spinner } from "@/components/ui/Spinner";
import TransactionForm from "./TransactionForm";

async function updateTransaction(profileId, transactionId, payload) {
  console.log(payload);
  const result = await api.patch(
    `/profiles/${profileId}/transactions/${transactionId}`,
    payload,
  );
  return result.data;
}

export default function EditTransactionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeProfileId } = useProfile();
  const queryClient = useQueryClient();

  const { data: txn, isLoading } = useTransaction(activeProfileId, id);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload) => updateTransaction(activeProfileId, id, payload),
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
      loading: "Updating transaction...",
      success: "Transaction updated",
      error: (e) => getApiErrorMessage(e) ?? "Couldn't update transaction",
    });
  }

  // Gate: only mount the form once data exists, so useState seeds correctly.
  if (isLoading || !txn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  return (
    <TransactionForm
      mode="edit"
      title="Edit transaction"
      submitLabel="Save changes"
      submitting={isPending}
      onSubmit={handleSubmit}
      initial={{
        type: txn.transaction_type,
        amount: txn.amount,
        date: txn.transaction_date,
        categoryId: txn.category?.id ?? null,
        tagIds: txn.tags?.map((t) => t.id) ?? [],
        description: txn.description ?? "",
        note: txn.notes ?? "",
      }}
    />
  );
}
