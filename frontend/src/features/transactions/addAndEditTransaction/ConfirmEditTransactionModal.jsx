import Button from "@/components/Button";

export default function ConfirmEditTransactionModal({
  changes = [],
  subtitle,
  onConfirm,
  onClose,
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-faint text-[11px] font-bold tracking-[0.12em] uppercase">
          {changes.length} {changes.length === 1 ? "change" : "changes"}
        </p>
        {subtitle && <p className="text-muted text-[13px]">{subtitle}</p>}
      </div>

      <div className="divide-line divide-y">
        {changes.map((c) => (
          <div key={c.label} className="space-y-1 py-3">
            <p className="text-faint text-[11px] font-bold tracking-[0.1em] uppercase">
              {c.label}
            </p>
            <p className="font-sans text-[14px] leading-relaxed">
              <span className="text-faint line-through">{c.before}</span>
              <span className="text-faint"> → </span>
              <span className="text-ink font-bold">{c.after}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="border-line bg-card text-ink flex-1 rounded-2xl border py-3.5 font-sans text-[14px] font-bold transition active:scale-[0.99]"
        >
          Keep editing
        </button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
        >
          Yes, save
        </Button>
      </div>
    </div>
  );
}
