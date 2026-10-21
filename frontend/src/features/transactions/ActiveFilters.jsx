import { cn } from "@/lib/utils";
import { CloseIcon } from "@/components/icons";

function formatShort(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
function rangeLabel({ date_from, date_to }) {
  if (date_from && date_to)
    return `${formatShort(date_from)} – ${formatShort(date_to)}`;
  if (date_from) return `From ${formatShort(date_from)}`;
  if (date_to) return `To ${formatShort(date_to)}`;
  return "";
}

function Chip({ children, onRemove, tone = "solid" }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full py-1 pr-1 pl-3 font-sans text-[12.5px] font-bold",
        tone === "dashed"
          ? "bg-card text-ink border border-dashed border-[#C7CBF2]"
          : "bg-accent-tint text-accent",
      )}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove filter"
        className="grid h-5 w-5 place-items-center rounded-full opacity-60 hover:opacity-100"
      >
        <CloseIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function ActiveFilters({
  selectedCategories,
  selectedTags,
  dateRange,
  onRemoveCategory,
  onRemoveTag,
  onRemoveDate,
  onClearAll,
}) {
  const hasDate = !!(dateRange.date_from || dateRange.date_to);
  if (selectedCategories.length === 0 && selectedTags.length === 0 && !hasDate)
    return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedCategories.map((c) => (
        <Chip key={`c-${c.id}`} onRemove={() => onRemoveCategory(c.id)}>
          {c.category_name}
        </Chip>
      ))}
      {selectedTags.map((t) => (
        <Chip
          key={`t-${t.id}`}
          tone="dashed"
          onRemove={() => onRemoveTag(t.id)}
        >
          <span className="text-accent">#</span>
          {t.name}
        </Chip>
      ))}
      {hasDate && <Chip onRemove={onRemoveDate}>{rangeLabel(dateRange)}</Chip>}

      <button
        type="button"
        onClick={onClearAll}
        className="text-muted px-1 text-[12px] font-bold"
      >
        Clear all
      </button>
    </div>
  );
}
