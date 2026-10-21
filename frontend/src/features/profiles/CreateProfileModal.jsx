import { useState } from "react";
import Button from "@/components/Button";
import { api, getApiErrorMessage } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import { toast } from "sonner";

async function createProfile(userId, payload) {
  const res = await api.post("/profiles", payload);
  return res.data;
}

export default function CreateProfileModal({ onClose }) {
  const [name, setName] = useState("");
  const { user } = useAuth();

  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload) => createProfile(user.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["me"]);
      onClose?.();
    },
  });

  function handleCreate() {
    const payload = { name };
    toast.promise(mutateAsync(payload), {
      loading: "Creating profile...",
      success: "Profile created successfully",
      error: (e) => getApiErrorMessage(e) ?? "Some error occured",
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-muted text-[13px]">
        A profile is a separate space with its own balance, categories, and
        transactions.
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Profile name"
        maxLength={15}
        className="border-line bg-card text-ink placeholder:text-faint focus:border-accent w-full rounded-2xl border px-4 py-3.5 font-sans text-[15px] focus:outline-none"
      />

      <Button
        variant="primary"
        className="w-full"
        onClick={handleCreate}
        disabled={name.trim().length < 3 || isPending}
      >
        Create profile
      </Button>
    </div>
  );
}
