// src/features/categories/Categories.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/features/profiles/useProfile";
import { useModal } from "@/components/modal/ModalProvider";
import { MODALS } from "@/components/modal/modal-types";
import { useCategories } from "./useCategories";
import CategoryTree from "./CategoryTree";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { ChevronLeftIcon, PlusIcon } from "@/components/icons";
import CategoryDropDownMenu from "./CategoryDropDownMenu";

function TypeSection({ title, categories, selectedId, onSelect, onAdd }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-ink font-sans text-[15.5px] font-bold">{title}</h2>
        <Button variant="soft" onClick={onAdd}>
          <PlusIcon className="h-4 w-4" /> New
        </Button>
      </div>
      <Card className="p-2">
        {categories.length === 0 ? (
          <p className="text-muted p-3 text-[13px]">
            No {title.toLowerCase()} categories yet.
          </p>
        ) : (
          <CategoryTree
            categories={categories}
            selectedId={selectedId}
            onSelect={onSelect}
            renderActions={(node) => <CategoryDropDownMenu node={node} />}
          />
        )}
      </Card>
    </div>
  );
}

export default function Categories() {
  const navigate = useNavigate();
  const { activeProfileId } = useProfile();
  const { openModal } = useModal();
  const { data: all = [], isLoading, isError } = useCategories(activeProfileId);
  const [selectedId, setSelectedId] = useState(null);

  const expense = all.filter((c) => c.type === "expense");
  const income = all.filter((c) => c.type === "income");

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
          Categories
        </h1>
      </div>

      <p className="text-muted text-[13px]">
        Your spending buckets, grouped into a hierarchy. Tap New to add a
        category or nest a sub-category.
      </p>

      {isLoading ? (
        <p className="text-muted text-[13px]">Loading…</p>
      ) : isError ? (
        <p className="text-neg text-[13px]">Couldn’t load categories.</p>
      ) : (
        <>
          <TypeSection
            title="Expense"
            categories={expense}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={() => openModal(MODALS.CREATE_CATEGORY, { type: "expense" })}
          />
          <TypeSection
            title="Income"
            categories={income}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={() => openModal(MODALS.CREATE_CATEGORY, { type: "income" })}
          />
        </>
      )}
    </div>
  );
}
