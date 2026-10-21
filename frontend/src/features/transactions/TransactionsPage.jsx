import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/features/profiles/useProfile";
import { useTransaction } from "./useTransactions.js";
import { useCategories } from "@/features/categories/useCategories";
import { useTags } from "@/features/tags/useTags";
import { buildChildren, subtreeIds } from "./categoryFilter";
import { groupTransactions } from "./utils";
import TransactionRow from "./TransactionRow";
import CategoryFilterCard from "./CategoryFilterCard";
import TagFilterCard from "./TagFilterCard";
import Segmented from "@/components/Segmented";
import Card from "@/components/Card";
import { SearchIcon, ChevronDownIcon, FilterIcon } from "@/components/icons";
import ActiveFilters from "./ActiveFilters.jsx";
import { useModal } from "@/components/modal/ModalProvider.jsx";
import { MODALS } from "@/components/modal/modal-types.js";

function FilterToggle({ label, count, open, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-sans text-[14px] font-bold transition",
        open
          ? "border-accent bg-accent-tint text-accent"
          : "border-line bg-card text-ink",
      )}
    >
      {label}
      {count > 0 && (
        <span className="bg-accent grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
      <ChevronDownIcon
        className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
      />
    </button>
  );
}

export default function TransactionsPage() {
  const { activeProfileId } = useProfile();
  const { openModal } = useModal();

  // date range (backend fetch boundary) — wired to the sheet in step 4
  const [dateRange, setDateRange] = useState({}); // {} = default month
  const {
    data: transactions = [],
    isLoading,
    isError,
  } = useTransaction(activeProfileId, dateRange);
  const { data: categoriesData = [] } = useCategories(activeProfileId);
  const { data: tagsData = [] } = useTags(activeProfileId);

  // frontend refinement state
  const [type, setType] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState(new Set());
  const [showCategories, setShowCategories] = useState(false);
  const [showTags, setShowTags] = useState(false);

  // filter cards scope to the chosen type (both when "all")
  const filterableCategories = useMemo(
    () =>
      type === "all"
        ? categoriesData
        : categoriesData.filter((c) => c.type === type),
    [type, categoriesData],
  );
  const filterableTags = useMemo(
    () => (type === "all" ? tagsData : tagsData.filter((t) => t.type === type)),
    [type, tagsData],
  );

  function handleTypeChange(next) {
    setType(next);
    setSelectedCategories([]); // type-specific -> reset
    setSelectedTagIds(new Set());
  }

  // ---- the frontend filter (Q1) ----
  const childrenByParent = useMemo(
    () => buildChildren(categoriesData),
    [categoriesData],
  );

  const allowedCatIds = useMemo(() => {
    if (selectedCategories.length === 0) return null;
    const s = new Set();
    for (const c of selectedCategories)
      for (const id of subtreeIds(c.id, childrenByParent)) s.add(id);
    return s;
  }, [selectedCategories, childrenByParent]);

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (type !== "all" && t.transaction_type !== type) return false;
        if (allowedCatIds && !allowedCatIds.has(t.category?.id)) return false;
        if (
          selectedTagIds.size > 0 &&
          !t.tags?.some((tag) => selectedTagIds.has(tag.id))
        )
          return false;
        return true;
      }),
    [transactions, type, allowedCatIds, selectedTagIds],
  );

  const relative = !dateRange.date_from && !dateRange.date_to;
  const groups = useMemo(
    () => groupTransactions(filtered, { relative }),
    [filtered, relative],
  );

  function toggleTag(id) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedTags = useMemo(
    () => tagsData.filter((t) => selectedTagIds.has(t.id)),
    [tagsData, selectedTagIds],
  );

  const hasDate = !!(dateRange.date_from || dateRange.date_to);
  const hasFilters =
    type !== "all" ||
    selectedCategories.length > 0 ||
    selectedTagIds.size > 0 ||
    hasDate;

  function removeCategory(id) {
    setSelectedCategories((prev) => prev.filter((c) => c.id !== id));
  }
  function removeTag(id) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }
  function clearAll() {
    setType("all");
    setSelectedCategories([]);
    setSelectedTagIds(new Set());
    setDateRange({});
  }

  return (
    <div className="space-y-4 px-5 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-ink font-sans text-[22px] font-extrabold tracking-[-0.02em]">
            Transactions
          </h1>
          <p className="text-muted text-[12px] font-semibold">
            {relative ? "This month" : "Custom range"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="border-line bg-card text-muted grid h-9 w-9 place-items-center rounded-xl border"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() =>
              openModal(MODALS.FILTER_TRANSACTIONS, {
                value: dateRange,
                onApply: setDateRange,
              })
            }
            className={cn(
              "relative grid h-9 w-9 place-items-center rounded-xl border",
              hasDate
                ? "border-accent bg-accent-tint text-accent"
                : "border-line bg-card text-muted",
            )}
            aria-label="Filter"
          >
            <FilterIcon className="h-5 w-5" />
            {hasDate && (
              <span className="bg-accent absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white" />
            )}
          </button>
        </div>

        {/* <button
          className="border-line bg-card text-muted grid h-9 w-9 place-items-center rounded-xl border"
          aria-label="Search"
        >
          <SearchIcon className="h-5 w-5" />
        </button> */}
        {/* filter-sheet button lands here in step 4 */}
      </div>

      <Segmented
        value={type}
        onChange={handleTypeChange}
        options={[
          { value: "all", label: "All" },
          { value: "income", label: "Income" },
          { value: "expense", label: "Expense" },
        ]}
      />

      <div className="flex gap-3">
        <FilterToggle
          label="Categories"
          count={selectedCategories.length}
          open={showCategories}
          onClick={() => setShowCategories((v) => !v)}
        />
        <FilterToggle
          label="Tags"
          count={selectedTagIds.size}
          open={showTags}
          onClick={() => setShowTags((v) => !v)}
        />
      </div>

      {showCategories && (
        <CategoryFilterCard
          key={type} // reset drill-nav when the type (and its tree) changes
          categories={filterableCategories}
          selected={selectedCategories}
          onChange={setSelectedCategories}
          onClear={() => setSelectedCategories([])}
        />
      )}
      {showTags && (
        <TagFilterCard
          tags={filterableTags}
          selectedIds={selectedTagIds}
          onToggle={toggleTag}
          onClear={() => setSelectedTagIds(new Set())}
        />
      )}

      <ActiveFilters
        selectedCategories={selectedCategories}
        selectedTags={selectedTags}
        dateRange={dateRange}
        onRemoveCategory={removeCategory}
        onRemoveTag={removeTag}
        onRemoveDate={() => setDateRange({})}
        onClearAll={clearAll}
      />

      {hasFilters && (
        <p className="text-muted text-[12px]">
          {filtered.length}{" "}
          {filtered.length === 1 ? "transaction" : "transactions"}
        </p>
      )}

      {isLoading ? (
        <p className="text-muted text-[13px]">Loading…</p>
      ) : isError ? (
        <p className="text-neg text-[13px]">Couldn’t load transactions.</p>
      ) : groups.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-ink font-sans text-[15px] font-bold">
            No transactions match these filters
          </p>
          <p className="text-muted mt-1 text-[13px]">
            Try a wider date range or a different type.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="text-accent bg-accent-tint mt-4 rounded-2xl px-5 py-3 font-sans text-[14px] font-bold"
          >
            Clear filters
          </button>
        </Card>
      ) : (
        groups.map((g) => (
          <div key={g.label ?? "all"} className="space-y-2">
            {g.label && (
              <p className="text-faint px-1 text-[11px] font-bold tracking-widest uppercase">
                {g.label}
              </p>
            )}
            <Card className="divide-line divide-y">
              {g.items.map((t) => (
                <TransactionRow key={t.id} transaction={t} />
              ))}
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
