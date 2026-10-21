import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useModal } from "@/components/modal/ModalProvider";
import { MODALS } from "@/components/modal/modal-types";
import Segmented from "@/components/Segmented";
import Button from "@/components/Button";
import Money from "@/components/Money";
import CategoryPicker from "../CategoryPicker";
import AmountKeypad from "../AmountKeypad";
import { RepeatIcon, CalendarIcon, PlusIcon } from "@/components/icons";
import Calendar from "../Calendar";
import { useCategories } from "../../categories/useCategories";
import { useProfile } from "../../profiles/useProfile";
import { useTags } from "../../tags/useTags";
import { Spinner } from "@/components/ui/Spinner";
import { categoryPath, indexById } from "../categoryFilter";
import { money } from "@/lib/money";

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
}
function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition",
        checked ? "bg-accent" : "bg-line",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          checked ? "left-5.5" : "left-0.5",
        )}
      />
    </button>
  );
}

function FieldLabel({ children, action, onAction }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted font-sans text-[13px] font-bold">
        {children}
      </span>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="text-accent flex items-center gap-1 font-sans text-[13px] font-bold"
        >
          <PlusIcon className="h-3.5 w-3.5" /> {action}
        </button>
      ) : null}
    </div>
  );
}

export default function TransactionForm({
  mode = "add",
  title,
  submitLabel,
  initial = {},
  submitting = false,
  onSubmit,
}) {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { activeProfileId } = useProfile();

  const todayISO = isoDaysAgo(0);
  const yesterdayISO = isoDaysAgo(1);

  // Seeded from `initial` (falls back to add-mode defaults).
  const [type, setType] = useState(initial.type ?? "expense");
  const [amount, setAmount] = useState(initial.amount ?? 0);
  const [date, setDate] = useState(initial.date ?? todayISO);
  const [showCal, setShowCal] = useState(false);
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? null);
  const [tagIds, setTagIds] = useState(new Set(initial.tagIds ?? []));
  const [description, setDescription] = useState(initial.description ?? "");
  const [note, setNote] = useState(initial.note ?? "");
  const [recurring, setRecurring] = useState(false);

  // // If initial data is sent we keep a snapshot of that.
  const baseline = useMemo(
    () => ({
      type: initial.type ?? "expense",
      amount: initial.amount ?? 0,
      date: initial.date ?? todayISO,
      categoryId: initial.categoryId ?? null,
      description: initial.description ?? "",
      note: initial.note ?? "",
      tagIds: new Set(initial.tagIds ?? []),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { data: categoriesData = [], isLoading: isLoadingCategories } =
    useCategories(activeProfileId);
  const { data: tagsData = [], isLoading: isLoadingTags } =
    useTags(activeProfileId);

  const categories = useMemo(
    () => categoriesData.filter((c) => c.type === type),
    [type, categoriesData],
  );
  const tags = useMemo(() => {
    const inType = tagsData.filter((t) => t.type === type);
    return [...inType].sort(
      (a, b) =>
        Number(baseline.tagIds.has(b.id)) - Number(baseline.tagIds.has(a.id)),
    );
  }, [type, tagsData, baseline]);

  function sameIds(a, b) {
    if (a.size !== b.size) return false;
    for (const id of a) if (!b.has(id)) return false;
    return true;
  }

  const isDirty =
    type !== baseline.type ||
    amount !== baseline.amount ||
    date !== baseline.date ||
    categoryId !== baseline.categoryId ||
    description.trim() !== baseline.description ||
    note.trim() !== baseline.note ||
    !sameIds(tagIds, baseline.tagIds);

  const MAX = 1_000_000_000_000;
  const pressDigit = (d) => setAmount((a) => Math.min(a * 10 + d, MAX));
  const pressTriple = () => setAmount((a) => Math.min(a * 1000, MAX));
  const backspace = () => setAmount((a) => Math.floor(a / 10));

  function toggleTag(id) {
    setTagIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const dateBtn = (active) =>
    cn(
      "rounded-xl border px-4 py-2.5 font-sans text-[13.5px] font-bold transition",
      active
        ? "border-accent bg-accent text-white"
        : "border-line bg-card text-ink",
    );
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function fullPayload() {
    return {
      transaction_type: type,
      amount,
      transaction_date: date,
      category_id: categoryId,
      tag_ids: [...tagIds],
      notes: note.trim() || null,
      description: description.trim() || null,
    };
  }

  function editPayload() {
    return {
      ...(type !== baseline.type && { transaction_type: type }),
      ...(amount !== baseline.amount && { amount }),
      ...(date !== baseline.date && { transaction_date: date }),
      ...(categoryId !== baseline.categoryId && { category_id: categoryId }),
      ...(note.trim() !== baseline.note && { notes: note.trim() || null }),
      ...(description.trim() !== baseline.description && {
        description: description.trim() || null,
      }),
      ...(!sameIds(tagIds, baseline.tagIds) && { tag_ids: [...tagIds] }),
    };
  }

  function buildChanges() {
    const byId = indexById(categoriesData);
    const catLabel = (id) =>
      id == null
        ? "—"
        : categoryPath(id, byId)
            .map((c) => c.category_name)
            .join(" › ");
    const tagLabel = (set) =>
      set.size === 0
        ? "—"
        : [...set]
            .map((id) => `#${tagsData.find((t) => t.id === id)?.name ?? id}`)
            .join(" ");

    const out = [];
    if (type !== baseline.type)
      out.push({ label: "Type", before: cap(baseline.type), after: cap(type) });
    if (amount !== baseline.amount)
      out.push({
        label: "Amount",
        before: money(baseline.amount),
        after: money(amount),
      });
    if (date !== baseline.date)
      out.push({
        label: "Date",
        before: formatDate(baseline.date),
        after: formatDate(date),
      });
    if (categoryId !== baseline.categoryId)
      out.push({
        label: "Category",
        before: catLabel(baseline.categoryId),
        after: catLabel(categoryId),
      });
    if (!sameIds(tagIds, baseline.tagIds))
      out.push({
        label: "Tags",
        before: tagLabel(baseline.tagIds),
        after: tagLabel(tagIds),
      });
    if (description.trim() !== baseline.description)
      out.push({
        label: "Description",
        before: baseline.description || "—",
        after: description.trim() || "—",
      });
    if (note.trim() !== baseline.note)
      out.push({
        label: "Note",
        before: baseline.note || "—",
        after: note.trim() || "—",
      });
    return out;
  }

  function handleSubmit() {
    if (mode === "add") {
      onSubmit(fullPayload());
      return;
    } else {
      openModal(MODALS.CONFIRM_EDIT_TRANSACTION, {
        changes: buildChanges(),
        description: description.trim(),
        onConfirm: () => onSubmit(editPayload()),
      });
    }
  }

  function handleTypeChange(nextType) {
    setType(nextType);
    setCategoryId(null);
    setTagIds(new Set());
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 bg-card fixed inset-0 mx-auto flex max-w-md flex-col duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <header className="border-line flex items-center gap-3 border-b px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="border-line text-muted grid h-9 w-9 place-items-center rounded-xl border"
          aria-label="Close"
        >
          ✕
        </button>
        <h1 className="text-ink font-sans text-[17px] font-extrabold">
          {title}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-5 pt-4 pb-6">
          <Segmented
            value={type}
            onChange={handleTypeChange}
            options={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
          />

          {/* Creation-only: seeding from a recurring template */}
          {mode === "add" && (
            <button
              type="button"
              onClick={() => {}}
              className="text-accent flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C7CBF2] py-3 font-sans text-[14px] font-bold"
            >
              <RepeatIcon className="h-4 w-4" /> From recurring
            </button>
          )}

          <div className="bg-card sticky top-0 z-10 -mx-5 px-5 pt-2 pb-3 text-center">
            <p className="text-muted text-[12px] font-semibold">Amount</p>
            <Money
              value={amount}
              className="text-ink mt-1 block text-[44px] leading-none font-semibold tracking-[-1px]"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Description:</FieldLabel>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (e.g. Metro Cash & Carry)"
              className="border-line bg-card text-ink placeholder:text-faint focus:border-accent w-full rounded-2xl border px-4 py-3.5 font-sans text-[14px] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Date</FieldLabel>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDate(todayISO);
                  setShowCal(false);
                }}
                className={dateBtn(date === todayISO)}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setDate(yesterdayISO);
                  setShowCal(false);
                }}
                className={dateBtn(date === yesterdayISO)}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setShowCal((v) => !v)}
                className={cn(
                  dateBtn(
                    showCal || (date !== todayISO && date !== yesterdayISO),
                  ),
                  "flex flex-1 items-center justify-center gap-2",
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {formatDate(date)}
              </button>
            </div>

            {showCal && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <Calendar
                  value={date}
                  max={todayISO}
                  onChange={(iso) => {
                    setDate(iso);
                    setShowCal(false);
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <FieldLabel
              action="New"
              onAction={() => openModal(MODALS.CREATE_CATEGORY, { type })}
            >
              Category
            </FieldLabel>
            {isLoadingCategories ? (
              <Spinner />
            ) : (
              <CategoryPicker
                key={type}
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
              />
            )}
          </div>

          <div className="space-y-2.5">
            <FieldLabel
              action="New"
              onAction={() => openModal(MODALS.CREATE_TAG, { type })}
            >
              Tags
            </FieldLabel>

            {isLoadingTags ? (
              <Spinner />
            ) : (
              <div className="flex scrollbar-none gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {tags.map((t) => {
                  const on = tagIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full border border-dashed px-3 py-1.5 font-sans text-[13px] font-bold transition",
                        on
                          ? "border-accent bg-accent-tint text-accent"
                          : "bg-card text-ink border-[#C7CBF2]",
                      )}
                    >
                      <span className="text-accent">#</span>
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="border-line bg-card text-ink placeholder:text-faint focus:border-accent w-full rounded-2xl border px-4 py-3.5 font-sans text-[14px] focus:outline-none"
          />

          <AmountKeypad
            onDigit={pressDigit}
            onTripleZero={pressTriple}
            onBackspace={backspace}
          />

          {/* Creation-only: recurring toggle */}
          {mode === "add" && (
            <div className="border-line flex items-center justify-between rounded-2xl border px-4 py-3">
              <span className="text-ink flex items-center gap-2 font-sans text-[14px] font-bold">
                <RepeatIcon className="text-muted h-4 w-4" /> Save as recurring
              </span>
              <Switch checked={recurring} onChange={setRecurring} />
            </div>
          )}
        </div>
      </div>

      <footer className="border-line border-t px-5 py-4">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          disabled={
            amount <= 0 ||
            categoryId == null ||
            submitting ||
            (mode === "edit" && !isDirty)
          }
        >
          {submitLabel}
        </Button>
      </footer>
    </div>
  );
}
