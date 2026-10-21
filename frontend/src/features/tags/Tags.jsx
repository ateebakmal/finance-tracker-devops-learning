// src/features/tags/Tags.jsx
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/features/profiles/useProfile";
import { useModal } from "@/components/modal/ModalProvider";
import { MODALS } from "@/components/modal/modal-types";
import { useTags } from "./useTags";
import TagPill from "./TagPill";
import Button from "@/components/Button";
import { ChevronLeftIcon, PlusIcon } from "@/components/icons";

function TagTypeSection({ title, tags, onAdd }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-ink font-sans text-[15.5px] font-bold">{title}</h2>
        <Button variant="soft" onClick={onAdd}>
          <PlusIcon className="h-4 w-4" /> New
        </Button>
      </div>
      {tags.length === 0 ? (
        <p className="text-muted text-[13px]">
          No {title.toLowerCase()} tags yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {tags.map((t) => (
            <TagPill key={t.id} tag={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tags() {
  const navigate = useNavigate();
  const { activeProfileId } = useProfile();
  const { openModal } = useModal();
  const { data: all = [], isLoading, isError } = useTags(activeProfileId);

  const expense = all.filter((t) => t.type === "expense");
  const income = all.filter((t) => t.type === "income");

  return (
    <div className="space-y-6 px-5 pt-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="border-line bg-card text-muted grid h-9 w-9 place-items-center rounded-xl border"
          aria-label="Back"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-ink font-sans text-[22px] font-extrabold tracking-[-0.02em]">
          Tags
        </h1>
      </div>

      <p className="text-muted text-[13px]">
        Cross-category labels you can attach to any transaction and filter by
        later.
      </p>

      {isLoading ? (
        <p className="text-muted text-[13px]">Loading…</p>
      ) : isError ? (
        <p className="text-neg text-[13px]">Couldn’t load tags.</p>
      ) : (
        <>
          <TagTypeSection
            title="Expense"
            tags={expense}
            onAdd={() => openModal(MODALS.CREATE_TAG, { type: "expense" })}
          />
          <TagTypeSection
            title="Income"
            tags={income}
            onAdd={() => openModal(MODALS.CREATE_TAG, { type: "income" })}
          />
        </>
      )}
    </div>
  );
}
