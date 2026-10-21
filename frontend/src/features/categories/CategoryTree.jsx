import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "@/components/icons";

function useChildrenMap(categories) {
  return useMemo(() => {
    const map = new Map();
    for (const c of categories) {
      const key = c.parent_id ?? "root";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }
    return map;
  }, [categories]);
}

function CategoryNode({
  node,
  childrenMap,
  depth,
  selectedId,
  onSelect,
  expanded,
  toggle,
  renderActions,
}) {
  const children = childrenMap.get(node.id) ?? [];
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  console.log(node);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-xl border px-1.5 py-2 transition",
          isSelected ? "border-accent bg-accent-tint" : "border-transparent",
        )}
        style={{ marginLeft: depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            aria-label={isOpen ? "Collapse" : "Expand"}
            className="text-faint grid h-6 w-6 shrink-0 place-items-center"
          >
            <ChevronRightIcon
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="h-6 w-6 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelect?.(node.id)}
          className="text-ink flex-1 py-1 text-left font-sans text-[14.5px] font-bold"
        >
          {node.category_name}
        </button>
        {renderActions?.(node)}
      </div>

      {isOpen &&
        children.map((child) => (
          <CategoryNode
            key={child.id}
            node={child}
            childrenMap={childrenMap}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            expanded={expanded}
            toggle={toggle}
            renderActions={renderActions}
          />
        ))}
    </div>
  );
}

export default function CategoryTree({
  categories,
  selectedId = null,
  onSelect,
  renderActions,
}) {
  const childrenMap = useChildrenMap(categories);
  const roots = childrenMap.get("root") ?? [];
  const [expanded, setExpanded] = useState(new Set());

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-0.5">
      {roots.map((node) => (
        <CategoryNode
          key={node.id}
          node={node}
          childrenMap={childrenMap}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          expanded={expanded}
          toggle={toggle}
          renderActions={renderActions}
        />
      ))}
    </div>
  );
}
