import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, HomeIcon } from "@/components/icons";
import {
  buildChildren,
  indexById,
  ancestorIds,
  toggleCategory,
} from "./categoryFilter";

export default function CategoryFilterCard({
  categories,
  selected,
  onChange,
  onClear,
}) {
  const childrenByParent = useMemo(
    () => buildChildren(categories),
    [categories],
  );
  const byId = useMemo(() => indexById(categories), [categories]);
  const [parentId, setParentId] = useState(null); // current drill level

  const level = childrenByParent.get(parentId ?? "root") ?? [];
  const selectedIds = new Set(selected.map((c) => c.id));

  // breadcrumb path root -> parentId
  const path = [];
  let cur = parentId != null ? byId.get(parentId) : null;
  while (cur) {
    path.unshift(cur);
    cur = cur.parent_id != null ? byId.get(cur.parent_id) : null;
  }

  function stateOf(node) {
    if (selectedIds.has(node.id)) return "selected";
    for (const a of ancestorIds(node.id, byId))
      if (selectedIds.has(a)) return "included";
    return "none";
  }

  return (
    <div className="border-line bg-card rounded-2xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-faint text-[11px] font-bold tracking-[0.1em] uppercase">
          Categories
        </p>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="text-accent text-[12px] font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {parentId != null && (
        <div className="mb-2 flex [scrollbar-width:none] items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setParentId(null)}
            className="text-faint grid h-6 w-6 shrink-0 place-items-center"
          >
            <HomeIcon className="h-4 w-4" />
          </button>
          {path.map((n) => (
            <div key={n.id} className="flex shrink-0 items-center gap-1">
              <ChevronRightIcon className="text-faint h-3.5 w-3.5" />
              <button
                onClick={() => setParentId(n.id)}
                className="text-ink text-[13px] font-bold"
              >
                {n.category_name}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {level.length === 0 ? (
          <p className="text-muted text-[12px]">No categories.</p>
        ) : (
          level.map((node) => {
            const st = stateOf(node);
            const kids = childrenByParent.get(node.id) ?? [];
            return (
              <div
                key={node.id}
                className={cn(
                  "flex shrink-0 items-center rounded-[13px] border transition",
                  st === "selected"
                    ? "border-accent bg-accent text-white"
                    : st === "included"
                      ? "border-accent/40 bg-accent-tint text-accent"
                      : "border-line bg-card text-ink",
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      toggleCategory(selected, node, childrenByParent, byId),
                    )
                  }
                  className="py-2 pl-3 font-sans text-[13px] font-bold"
                >
                  {node.category_name}
                  {st === "included" && (
                    <span className="ml-1 text-[10px] font-semibold opacity-70">
                      included
                    </span>
                  )}
                </button>
                {kids.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setParentId(node.id)}
                    aria-label="Drill in"
                    className="grid h-8 w-7 place-items-center"
                  >
                    <ChevronRightIcon className="h-3.5 w-3.5 opacity-70" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
