// src/features/categories/CreateCategoryModal.jsx
import { useMemo, useState } from "react";
import Button from "@/components/Button";
import ParentPicker from "./ParentPicker";
import { useProfile } from "@/features/profiles/useProfile";
import { useCategories } from "./useCategories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";

async function createCategory(profileId, payload) {
  const res = await api.post(`/profiles/${profileId}/categories`, payload);
  return res.data;
}

export default function CreateCategoryModal({ type = "expense", onClose }) {
  const { activeProfileId } = useProfile();
  const { data: all = [], isLoading } = useCategories(activeProfileId);

  // a parent must be the SAME type — you can't nest income under expense
  const categories = useMemo(
    () => all.filter((c) => c.type === type),
    [all, type],
  );

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(null);

  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload) => createCategory(activeProfileId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.byProfileId.all(activeProfileId),
      });
      onClose?.();
    },
  });
  const parentName =
    parentId === null
      ? "Top level"
      : categories.find((c) => c.id === parentId)?.category_name;

  function handleCreate() {
    // POST { category_name: name, parent_id: parentId, type }
    // mutate({ category_name: name, parent_id: parentId, type });
    const payload = { category_name: name, parent_id: parentId, type };
    toast.promise(mutateAsync(payload), {
      loading: "Adding new category",
      onSuccess: () => "Category added",
      error: (e) => getApiErrorMessage(e) ?? "Some error happened",
    });
  }

  return (
    <div className="space-y-5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        className="border-line bg-card text-ink placeholder:text-faint focus:border-accent w-full rounded-2xl border px-4 py-3.5 font-sans text-[15px] focus:outline-none"
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-ink font-sans text-[13px] font-bold">
            Nest under
          </span>
          <span className="bg-accent-tint text-accent rounded-full px-2 py-0.5 text-[11px] font-bold">
            {parentName}
          </span>
        </div>
        <p className="text-muted text-[12px]">
          Pick a parent to make a sub-category, or keep it Top level.
        </p>
        {isLoading ? (
          <p className="text-muted py-2 text-[13px]">Loading categories…</p>
        ) : (
          <ParentPicker
            categories={categories}
            value={parentId}
            onChange={setParentId}
          />
        )}
      </div>
      <Button
        variant="primary"
        className="w-full"
        onClick={handleCreate}
        disabled={name.trim().length < 3 || isPending}
      >
        Create category
      </Button>
    </div>
  );
}
