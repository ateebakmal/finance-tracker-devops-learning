// src/features/tags/CreateTagModal.jsx
import { useState } from "react";
import Button from "@/components/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { useProfile } from "../profiles/useProfile";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";

async function createTag(profileId, payload) {
  const res = await api.post(`/profiles/${profileId}/tags`, payload);
  return res.data;
}

export default function CreateTagModal({ type = "expense", onClose }) {
  const [name, setName] = useState("");
  const { activeProfileId } = useProfile();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload) => createTag(activeProfileId, payload),
    onSuccess: () => {
      (queryClient.invalidateQueries(
        queryKeys.tags.byProfileId.all(activeProfileId),
      ),
        onClose?.());
    },
  });

  function handleCreate() {
    // POST { name, type }
    // mutate({ name, type });
    toast.promise(mutateAsync({ name, type }), {
      loading: "Adding tag...",
      onSuccess: "Tag added successfully",
      error: (e) => getApiErrorMessage(e) ?? "Unable to add tag",
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-muted text-[13px]">
        Tags are cross-category labels — attach them to any transaction to slice
        spending your own way.
      </p>

      <div className="border-line focus-within:border-accent bg-card flex items-center gap-2 rounded-2xl border px-4 py-3.5">
        <span className="text-faint font-numeric text-[15px]">#</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="tag name"
          className="text-ink placeholder:text-faint flex-1 bg-transparent font-sans text-[15px] focus:outline-none"
        />
      </div>

      <Button
        variant="primary"
        className="w-full"
        onClick={handleCreate}
        disabled={name.trim().length < 3 || isPending}
      >
        Create tag
      </Button>
    </div>
  );
}
