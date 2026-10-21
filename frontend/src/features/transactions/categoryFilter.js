export function buildChildren(categories) {
  const map = new Map();
  for (const c of categories) {
    const k = c.parent_id ?? "root";
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(c);
  }
  return map;
}

export function indexById(categories) {
  const map = new Map();
  for (const c of categories) map.set(c.id, c);
  return map;
}

// node id + every descendant id (inclusive)
export function subtreeIds(categoryId, childrenByParent) {
  const ids = new Set([categoryId]);
  const stack = [categoryId];
  while (stack.length) {
    for (const child of childrenByParent.get(stack.pop()) ?? []) {
      ids.add(child.id);
      stack.push(child.id);
    }
  }
  return ids;
}

export function ancestorIds(categoryId, byId) {
  const ids = new Set();
  let cur = byId.get(categoryId);
  while (cur?.parent_id != null) {
    ids.add(cur.parent_id);
    cur = byId.get(cur.parent_id);
  }
  return ids;
}

// selecting a node drops any selected ancestor/descendant, then adds it (or toggles off)
export function toggleCategory(selected, node, childrenByParent, byId) {
  if (selected.some((c) => c.id === node.id)) {
    return selected.filter((c) => c.id !== node.id);
  }
  const sub = subtreeIds(node.id, childrenByParent);
  const anc = ancestorIds(node.id, byId);
  return [...selected.filter((c) => !sub.has(c.id) && !anc.has(c.id)), node];
}

export function categoryPath(categoryId, byId) {
  const path = [];
  let cur = byId.get(categoryId);
  while (cur) {
    path.unshift(cur); // prepend so root ends up first
    cur = cur.parent_id != null ? byId.get(cur.parent_id) : null;
  }
  return path; // [{root}, …, {leaf}]
}
