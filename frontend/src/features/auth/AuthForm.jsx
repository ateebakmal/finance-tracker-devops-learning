import { useState } from "react";
import Button from "@/components/Button";
import { Spinner } from "@/components/ui/Spinner";

const inputClass =
  "border-line bg-card text-ink placeholder:text-faint focus:border-accent w-full rounded-2xl border px-4 py-3.5 font-sans text-[15px] focus:outline-none";

/* Shared by /login and /signup -- same precedent as TransactionForm being
   shared by the add and edit transaction pages.

   The checks here are for fast feedback only. The backend validates the same
   rules again, because anything in the browser can be bypassed. */
export default function AuthForm({ mode, onSubmit, isPending, errorMessage }) {
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const longEnough = password.length >= 8;
  const confirmMatches = password === confirm;

  // Signup enforces the 8-character minimum. Sign-in only needs *something*:
  // an older or shorter password must get a real 401 from the server, not a
  // form that silently refuses to submit.
  const passwordAcceptable = isSignup ? longEnough : password.length > 0;
  const canSubmit =
    emailLooksValid &&
    passwordAcceptable &&
    (!isSignup || confirmMatches) &&
    !isPending;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ email: email.trim(), password });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        maxLength={254}
        className={inputClass}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={isSignup ? "Password (8+ characters)" : "Password"}
        autoComplete={isSignup ? "new-password" : "current-password"}
        maxLength={128}
        className={inputClass}
      />

      {isSignup ? (
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          maxLength={128}
          className={inputClass}
        />
      ) : null}

      {/* Nudges, shown only once the user has actually typed something. */}
      {isSignup && password.length > 0 && !longEnough ? (
        <p className="text-neg text-[13px]">
          Password must be at least 8 characters.
        </p>
      ) : null}

      {isSignup && confirm.length > 0 && !confirmMatches ? (
        <p className="text-neg text-[13px]">Passwords do not match.</p>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="text-neg text-[13px]">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!canSubmit}
      >
        {isPending ? <Spinner /> : null}
        {isSignup ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
