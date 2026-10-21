import { cn } from "@/lib/utils";
import { PlusIcon } from "@/components/icons";
import CategoryTree from "./CategoryTree";

export default function ParentPicker({ categories, value, onChange }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 transition",
          value === null
            ? "border-accent bg-accent-tint"
            : "border-line bg-card",
        )}
      >
        <span className="text-accent flex items-center gap-2 font-sans text-[15px] font-bold">
          <span className="bg-accent grid h-6 w-6 place-items-center rounded-full text-white">
            <PlusIcon className="h-3.5 w-3.5" />
          </span>
          Top level
        </span>
        <span className="text-faint text-[12px] font-semibold">no parent</span>
      </button>

      <div className="border-line bg-card max-h-[38vh] overflow-y-auto rounded-2xl border p-2">
        <CategoryTree
          categories={categories}
          selectedId={value}
          onSelect={onChange}
        />
      </div>
    </div>
  );
}
