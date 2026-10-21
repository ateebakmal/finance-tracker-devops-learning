import { useNavigate } from "react-router-dom";
import Money from "@/components/Money";
import { relativeDate } from "./utils";
import { ChevronRightIcon } from "@/components/icons";

export default function TransactionRow({ transaction: t }) {
  const navigate = useNavigate();
  const title =
    t.description?.trim() || t.category?.category_name || "Transaction";

  return (
    <button
      type="button"
      onClick={() => navigate(`/transactions/${t.id}`)}
      className="active:bg-bg flex w-full items-center gap-3 px-4 py-3 text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="text-ink truncate font-sans text-[14.5px] font-bold">
          {title}
        </p>
        <p className="text-muted truncate text-[12px]">
          {t.category?.category_name} · {relativeDate(t.transaction_date)}
        </p>
      </div>
      <Money
        value={t.amount}
        sign={t.transaction_type}
        className="text-[15px]"
      />
      <ChevronRightIcon className="text-faint h-4 w-4 shrink-0" />
    </button>
  );
}
