const categories = [
  {
    category_name: "Bills",
    parent_id: null,
    id: 1,
    profile_id: 1,
  },
  {
    category_name: "Utilities",
    parent_id: 1,
    id: 2,
    profile_id: 1,
  },
  {
    category_name: "Electricity",
    parent_id: 2,
    id: 3,
    profile_id: 1,
  },
  {
    category_name: "Gas",
    parent_id: 2,
    id: 4,
    profile_id: 1,
  },
  {
    category_name: "Subscription",
    parent_id: 1,
    id: 5,
    profile_id: 1,
  },
  {
    category_name: "Spotify",
    parent_id: 5,
    id: 6,
    profile_id: 1,
  },
  {
    category_name: "Grocery",
    parent_id: null,
    id: 7,
    profile_id: 1,
  },
];

const map = new Map();
for (const c of categories) {
  const key = c.parent_id ?? "root";
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(c);
}

console.log(map);
