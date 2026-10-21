import Button from "@/components/Button";
import { api, getApiErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

async function renameTag(profileId, tagId, payload) {
  const res = await api.patch(`/profiles/${profileId}/tags/${tagId}`, payload);
  return res.data;
}

// We recieve tag as prop from where we open this model
export default function RenameTagModal({ tag, onClose }) {
  const [name, setName] = useState(tag.name);

  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload) => renameTag(tag.profile_id, tag.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(
        queryKeys.tags.byProfileId.all(tag.profile_id),
      );
      onClose?.();
    },
  });

  function handleRename() {
    toast.promise(mutateAsync({ name }), {
      loading: "Renaming tag...",
      success: "Renamed Tag",
      error: (e) => getApiErrorMessage(e) ?? "Some error occured",
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
        onClick={handleRename}
        disabled={name.trim().length < 3 || name == tag.name || isPending}
      >
        Rename tag
      </Button>
    </div>
  );
}
