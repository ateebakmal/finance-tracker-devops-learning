import { cn } from "@/lib/utils";

export default function TagFilterCard({
  tags,
  selectedIds,
  onToggle,
  onClear,
}) {
  return (
    <div className="border-line bg-card rounded-2xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-faint text-[11px] font-bold tracking-[0.1em] uppercase">
          Tags
        </p>
        {selectedIds.size > 0 && (
          <button
            onClick={onClear}
            className="text-accent text-[12px] font-bold"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {tags.length === 0 ? (
          <p className="text-muted text-[12px]">No tags.</p>
        ) : (
          tags.map((t) => {
            const on = selectedIds.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToggle(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border border-dashed px-3 py-1.5 font-sans text-[13px] font-bold transition",
                  on
                    ? "border-accent bg-accent text-white"
                    : "bg-card text-ink border-[#C7CBF2]",
                )}
              >
                <span className={on ? "text-white" : "text-accent"}>#</span>
                {t.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
