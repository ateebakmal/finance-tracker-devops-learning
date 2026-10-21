import { Fragment, useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HomeIcon, ChevronRightIcon } from "@/components/icons";

export default function CategoryPicker({ categories, value, onChange }) {
  const byId = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const childrenMap = useMemo(() => {
    const m = new Map();
    for (const c of categories) {
      const key = c.parent_id ?? "root";
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(c);
    }
    return m;
  }, [categories]);

  const [viewParentId, setViewParentId] = useState(null); // null = root

  // On first load with a preselected category, jump the view to that category's
  // parent level so the selected chip is visible and highlighted right away.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    if (value == null || byId.size === 0) return; // wait for categories to load
    const node = byId.get(value);
    if (!node) return;
    setViewParentId(node.parent_id ?? null);
    didInit.current = true; // run ONCE — never fight the user's navigation after
  }, [value, byId]);

  const chips = childrenMap.get(viewParentId ?? "root") ?? [];

  // breadcrumb: root..current view node
  const trail = useMemo(() => {
    const chain = [];
    let cur = viewParentId == null ? null : byId.get(viewParentId);
    while (cur) {
      chain.unshift(cur);
      cur = cur.parent_id == null ? null : byId.get(cur.parent_id);
    }
    return chain;
  }, [viewParentId, byId]);

  function selectChip(cat) {
    onChange(cat.id); // choose it as the category
    const hasKids = (childrenMap.get(cat.id) ?? []).length > 0;
    if (hasKids) setViewParentId(cat.id); // and drill in to reveal children
  }

  const scroll =
    "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  return (
    <div className="space-y-2.5">
      {trail.length > 0 && (
        <div className={cn(scroll, "items-center")}>
          <button
            type="button"
            onClick={() => setViewParentId(null)}
            className="text-faint shrink-0"
          >
            <HomeIcon className="h-4 w-4" />
          </button>
          {trail.map((node, i) => {
            const isLast = i === trail.length - 1;
            return (
              <Fragment key={node.id}>
                <ChevronRightIcon className="text-faint h-3.5 w-3.5 shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    setViewParentId(node.id);
                    onChange(node.id);
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 font-sans text-[12.5px] font-bold",
                    isLast ? "border-accent text-accent border" : "text-muted",
                  )}
                >
                  {node.category_name}
                </button>
              </Fragment>
            );
          })}
        </div>
      )}

      <div className={scroll}>
        {chips.map((cat) => {
          const hasKids = (childrenMap.get(cat.id) ?? []).length > 0;
          const selected = value === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectChip(cat)}
              className={cn(
                "bg-card text-ink flex shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 font-sans text-[13.5px] font-bold transition",
                selected ? "border-ink" : "border-line",
              )}
            >
              {cat.category_name}
              {hasKids && (
                <ChevronRightIcon className="text-faint h-3.5 w-3.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
