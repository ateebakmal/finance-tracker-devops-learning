import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthProvider";
import Button from "@/components/Button";

export default function Setup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // already set up — don't let them sit on setup
  if (user?.profiles?.length > 0) return <Navigate to="/dashboard" replace />;

  async function handleContinue() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/profiles", { name: name.trim() });
      // refetch /auth/me; user.profiles repopulates, useProfile re-renders
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-bg mx-auto flex min-h-screen max-w-md flex-col">
      <header className="border-line bg-card border-b px-5 py-4">
        <p className="text-faint text-[11px] font-bold tracking-[0.1em] uppercase">
          Set up
        </p>
        <div className="bg-line mt-2 h-1 w-full rounded-full">
          <div className="bg-accent h-1 w-1/4 rounded-full" />
        </div>
      </header>

      <div className="flex-1 px-5 pt-6">
        <h1 className="text-ink font-sans text-[22px] font-extrabold tracking-[-0.02em]">
          Create your profile
        </h1>
        <p className="text-muted mt-1 text-[13px]">
          This is required — name the space you’re tracking.
        </p>

        <div className="mt-6 space-y-2">
          <label className="text-muted text-[12px] font-bold">
            Profile name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Home"
            className="border-line bg-card text-ink placeholder:text-faint focus:border-accent w-full rounded-2xl border px-4 py-3.5 font-sans text-[15px] focus:outline-none"
          />
          {error && <p className="text-neg text-[12px]">{error}</p>}
        </div>
      </div>

      <footer className="border-line bg-card border-t px-5 py-4">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleContinue}
          disabled={name.trim().length < 3 || submitting}
        >
          {submitting ? "Creating…" : "Continue"}
        </Button>
      </footer>
    </div>
  );
}
