import Money from "@/components/Money";
import { relativeDate } from "./utils";

export default function TransactionRow({ transaction: t }) {
  const title =
    t.description?.trim() || t.category?.category_name || "Transaction";

  return (
    <div className="flex items-center gap-3 py-3">
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
    </div>
  );
}
