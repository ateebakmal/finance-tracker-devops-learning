import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useProfile } from "@/features/profiles/useProfile";
import { useCategories } from "@/features/categories/useCategories";
import {
  indexById,
  categoryPath,
} from "@/features/transactions/categoryFilter";
import { useTransaction } from "./useTransaction";
import Money from "@/components/Money";
import Card from "@/components/Card";
import { ChevronLeftIcon, PencilIcon, TrashIcon } from "@/components/icons";

function formatFullDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Eyebrow({ children }) {
  return (
    <p className="text-faint text-[11px] font-bold tracking-[0.12em] uppercase">
      {children}
    </p>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-muted shrink-0 font-sans text-[13px] font-semibold">
        {label}
      </span>
      <span className="text-ink text-right font-sans text-[14px] font-bold">
        {value}
      </span>
    </div>
  );
}

export default function TransactionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { activeProfileId, activeProfile } = useProfile();

  const {
    data: transaction,
    isLoading,
    isError,
  } = useTransaction(activeProfileId, id);
  const { data: categories = [] } = useCategories(activeProfileId);

  const byId = useMemo(() => indexById(categories), [categories]);
  const path = useMemo(
    () =>
      transaction?.category?.id
        ? categoryPath(transaction.category.id, byId)
        : [],
    [transaction, byId],
  );

  const del = useMutation({
    mutationFn: () =>
      api.delete(`/profiles/${activeProfileId}/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.byProfileId.byProfile(activeProfileId),
      });
      navigate(-1);
    },
  });

  function handleDelete() {
    toast.promise(del.mutateAsync(), {
      loading: "Deleting transaction…",
      success: "Transaction deleted",
      error: (e) => getApiErrorMessage(e) ?? "Couldn’t delete transaction",
    });
  }

  if (isLoading && !transaction) {
    return <p className="text-muted px-5 pt-6 text-[13px]">Loading…</p>;
  }
  if (isError || !transaction) {
    return (
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="text-muted text-[13px]">
          ← Back
        </button>
        <p className="text-muted mt-4 text-[13px]">Transaction not found.</p>
      </div>
    );
  }

  const isIncome = transaction.transaction_type === "income";
  const categoryLabel = path.length
    ? path.map((c) => c.category_name).join(" › ")
    : (transaction.category?.category_name ?? "—"); // fallback while categories load

  return (
    <div className="space-y-4 px-5 pt-4">
      {/* header */}
      <div className="relative flex items-center justify-center py-1">
        <button
          onClick={() => navigate(-1)}
          className="border-line bg-card text-muted absolute left-0 grid h-9 w-9 place-items-center rounded-xl border"
          aria-label="Back"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <Eyebrow>Transaction details</Eyebrow>
      </div>

      {/* amount */}
      <Card className="p-6 text-center">
        <Eyebrow>{isIncome ? "Income" : "Expense"}</Eyebrow>
        <Money
          value={transaction.amount}
          sign={transaction.transaction_type}
          className="mt-2 block text-[38px] leading-none font-semibold tracking-[-0.5px]"
        />
      </Card>

      {/* details */}
      <Card className="divide-line divide-y px-4">
        <DetailRow label="Description" value={transaction.description || "—"} />
        <DetailRow label="Category" value={categoryLabel} />
        <DetailRow
          label="Date"
          value={formatFullDate(transaction.transaction_date)}
        />
        <DetailRow label="Profile" value={activeProfile?.name ?? "—"} />
      </Card>

      {/* note */}
      {transaction.notes && (
        <Card className="space-y-1.5 p-4">
          <Eyebrow>Note</Eyebrow>
          <p className="text-ink font-sans text-[14px] leading-relaxed">
            {transaction.notes}
          </p>
        </Card>
      )}

      {/* tags */}
      {transaction.tags?.length > 0 && (
        <Card className="space-y-2 p-4">
          <Eyebrow>Tags</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {transaction.tags.map((t) => (
              <span
                key={t.id}
                className="bg-card text-ink flex items-center gap-1 rounded-full border border-dashed border-[#C7CBF2] px-3 py-1.5 font-sans text-[13px] font-bold"
              >
                <span className="text-accent">#</span>
                {t.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={() => navigate(`/transactions/${id}/edit`)}
          className="border-line bg-card text-ink flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3.5 font-sans text-[14px] font-bold"
        >
          <PencilIcon className="h-4 w-4" /> Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={del.isPending}
          className="text-neg flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FBEDEA] py-3.5 font-sans text-[14px] font-bold disabled:opacity-60"
        >
          <TrashIcon className="h-4 w-4" /> Delete
        </button>
      </div>
    </div>
  );
}
