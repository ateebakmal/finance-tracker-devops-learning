import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, getApiErrorMessage } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import { useModal } from "@/components/modal/ModalProvider";
import { MODALS } from "@/components/modal/modal-types";

async function deleteTag(tagId, profileId) {
  await api.delete(`/profiles/${profileId}/tags/${tagId}`);
}

export default function TagsDropDownMenu({ tag, children }) {
  const { openModal } = useModal();
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: () => deleteTag(tag.id, tag.profile_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags.byProfileId.all(tag.profile_id),
      });
    },
  });

  function handleDelete() {
    toast.promise(mutateAsync(), {
      success: "Tag deleted",
      loading: "Deleting tag...",
      error: (e) => getApiErrorMessage(e) ?? "Couldn't delete tag",
    });
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Category actions"
        onClick={(e) => e.stopPropagation()} // don't also trigger row select
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* later: <DropdownMenuItem>Rename</DropdownMenuItem> / Move */}
        <DropdownMenuItem
          className="text-neg"
          onClick={() => {
            handleDelete();
          }}
        >
          Delete
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-gray-700"
          onClick={() => {
            openModal(MODALS.RENAME_TAG, { tag });
          }}
        >
          Rename
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
