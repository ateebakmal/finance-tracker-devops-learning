import Card from "@/components/Card";
import { Spinner } from "@/components/ui/Spinner";
import TransactionRow from "@/features/transactions/TransactionRow";

export default function TransactionList({ items = [], isLoading }) {
  if (isLoading) {
    return (
      <Card className="mx-5 mt-3 p-4">
        <Spinner />
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mx-5 mt-3 p-4">
        <p className="text-muted text-[13px]">No transactions yet.</p>
      </Card>
    );
  }
  return (
    <Card className="divide-line mx-5 mt-3 divide-y px-4">
      {items.map((t) => (
        <TransactionRow key={t.id} transaction={t} />
      ))}
    </Card>
  );
}
