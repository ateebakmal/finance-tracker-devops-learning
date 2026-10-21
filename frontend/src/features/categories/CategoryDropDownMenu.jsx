import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreIcon } from "@/components/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";

async function deleteCategory(profile_id, category_id) {
  await api.delete(`/profiles/${profile_id}/categories/${category_id}`);
}

export default function CategoryDropDownMenu({ node }) {
  console.log("This is from Category dropdown");
  console.log("This is the node:", node);

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: () => deleteCategory(node.profile_id, node.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.byProfileId.all(node.profile_id),
      });
    },
  });

  function handleDelete() {
    toast.promise(mutateAsync(), {
      loading: "Deleting category...",
      success: "Category deleted",
      error: (e) => getApiErrorMessage(e) ?? "Couldn't delete category",
    });
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Category actions"
        onClick={(e) => e.stopPropagation()} // don't also trigger row select
        className="text-faint hover:bg-bg grid h-7 w-7 shrink-0 place-items-center rounded-lg"
      >
        <MoreIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* later: <DropdownMenuItem>Rename</DropdownMenuItem> / Move */}
        <DropdownMenuItem className="text-neg" onClick={() => handleDelete()}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
