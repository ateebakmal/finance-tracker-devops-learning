import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useModal } from "@/components/modal/ModalProvider";
import { MODALS } from "@/components/modal/modal-types";
import Segmented from "@/components/Segmented";
import Button from "@/components/Button";
import Money from "@/components/Money";
import CategoryPicker from "./CategoryPicker";
import AmountKeypad from "./AmountKeypad";
import { RepeatIcon, CalendarIcon, PlusIcon } from "@/components/icons";
import Calendar from "./Calendar";
import { useCategories } from "../categories/useCategories";
import { useProfile } from "../profiles/useProfile";
import { useTags } from "../tags/useTags";
import { api, getApiErrorMessage } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";

// Dummy — you'll swap for useCategories / useTags(activeProfileId)
// const DUMMY_CATEGORIES = [
//   { id: 1, category_name: "Bills & Home", parent_id: null, type: "expense" },
//   { id: 2, category_name: "Essentials", parent_id: 1, type: "expense" },
//   { id: 3, category_name: "Grocery", parent_id: 2, type: "expense" },
//   { id: 7, category_name: "Food", parent_id: null, type: "expense" },
//   { id: 8, category_name: "Salary", parent_id: null, type: "income" },
//   { id: 9, category_name: "Freelance", parent_id: null, type: "income" },
// ];
// const DUMMY_TAGS = [
//   { id: 1, name: "reimbursable", type: "expense" },
//   { id: 2, name: "shared", type: "expense" },
//   { id: 3, name: "bonus", type: "income" },
// ];

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
          checked ? "left-[22px]" : "left-0.5",
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

async function addTransaction(profileId, payload) {
  const result = await api.post(`/profiles/${profileId}/transactions`, payload);
  return result.data;
}

export default function AddTransaction() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { activeProfileId } = useProfile();

  const todayISO = isoDaysAgo(0);
  const yesterdayISO = isoDaysAgo(1);

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayISO);
  const [showCal, setShowCal] = useState(false);
  const [categoryId, setCategoryId] = useState(null);
  const [tagIds, setTagIds] = useState(new Set());
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [recurring, setRecurring] = useState(false);

  const { data: categoriesData = [], isLoading: isLoadingCategories } =
    useCategories(activeProfileId);
  const { data: tagsData = [], isLoading: isLoadingTags } =
    useTags(activeProfileId);

  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload) => addTransaction(activeProfileId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes("transactions") &&
          query.queryKey.includes(activeProfileId),
      });
      navigate(-1);
    },
  });

  const categories = useMemo(
    () => categoriesData.filter((c) => c.type === type),
    [type, categoriesData],
  );
  const tags = useMemo(
    () => tagsData.filter((t) => t.type === type),
    [type, tagsData],
  );

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

  function handleSave() {
    // description: nullable
    //     amount,
    // transaction_type,
    // transaction_date,
    // notes: nullable
    // source_template_id: nullable
    // category_id:
    // tag_ids:

    // console.log({
    //   transaction_type: type,
    //   amount,
    //   transaction_date: date,
    //   category_id: categoryId,
    //   tag_ids: [...tagIds],
    //   notes: note.trim() || null,
    //   description: description.trim(),
    // });
    // TODO: We havent taken care of recurring transctions. so that button doesnt work we need to take care of that as well as save recurring transaction templates
    // mutate({
    //   transaction_type: type,
    //   amount,
    //   transaction_date: date,
    //   category_id: categoryId,
    //   tag_ids: [...tagIds],
    //   notes: note.trim() || null,
    //   description: description.trim() || null,
    // });
    const payload = {
      transaction_type: type,
      amount,
      transaction_date: date,
      category_id: categoryId,
      tag_ids: [...tagIds],
      notes: note.trim() || null,
      description: description.trim() || null,
    };

    toast.promise(mutateAsync(payload), {
      loading: "Saving transaction...",
      success: "Transaction Saved",
      error: (e) => getApiErrorMessage(e) ?? "Couldn't save transaction",
    });
  }

  function handleTypeChange(type) {
    setType(type);
    setCategoryId(null);
    setTagIds(new Set());
  }
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 bg-card fixed inset-0 mx-auto flex max-w-md flex-col duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
      {/* Sticky header */}
      <header className="border-line flex items-center gap-3 border-b px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="border-line text-muted grid h-9 w-9 place-items-center rounded-xl border"
          aria-label="Close"
        >
          ✕
        </button>
        <h1 className="text-ink font-sans text-[17px] font-extrabold">
          New transaction
        </h1>
      </header>

      {/* Scrollable body */}
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

          <button
            type="button"
            onClick={() => {}}
            className="text-accent flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C7CBF2] py-3 font-sans text-[14px] font-bold"
          >
            <RepeatIcon className="h-4 w-4" /> From recurring
          </button>

          {/* Amount — sticky: pins under the header while the rest scrolls.
        -mx-5 px-5 makes its background span the full width so scrolling
        content is fully covered; z-10 keeps it above what slides beneath. */}
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

          {/* Date */}
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

          {/* Category — now shown for income too */}
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
              <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
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

          {/* Note */}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="border-line bg-card text-ink placeholder:text-faint focus:border-accent w-full rounded-2xl border px-4 py-3.5 font-sans text-[14px] focus:outline-none"
          />

          {/* Keypad */}
          <AmountKeypad
            onDigit={pressDigit}
            onTripleZero={pressTriple}
            onBackspace={backspace}
          />

          {/* Save as recurring */}
          <div className="border-line flex items-center justify-between rounded-2xl border px-4 py-3">
            <span className="text-ink flex items-center gap-2 font-sans text-[14px] font-bold">
              <RepeatIcon className="text-muted h-4 w-4" /> Save as recurring
            </span>
            <Switch checked={recurring} onChange={setRecurring} />
          </div>
        </div>
      </div>

      {/* Pinned footer */}
      <footer className="border-line border-t px-5 py-4">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSave}
          disabled={amount <= 0 || categoryId == null || isPending}
        >
          Save transaction
        </Button>
      </footer>
    </div>
  );
}
