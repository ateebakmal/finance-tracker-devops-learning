import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { useAuthConfig } from "./useAuthConfig";
import AuthShell from "./AuthShell";
import AuthForm from "./AuthForm";
import GoogleButton from "./GoogleButton";

export default function LoginPage() {
  const { login, loginWithPassword } = useAuth();
  const { googleEnabled, passwordEnabled } = useAuthConfig();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: () => navigate("/dashboard", { replace: true }),
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  function handleSubmit(credentials) {
    setErrorMessage(null);
    mutate(credentials);
  }

  // TODO (you): enter the app in demo mode.
  function onSkip() {
    toast("The demo feature will be implemented soon :)");
  }

  return (
    <AuthShell
      title="Quiet"
      subtitle="Calm money, clearly tracked. Household and personal, side by side."
      footer={
        <>
          {passwordEnabled ? (
            <p className="text-muted text-center text-sm">
              New here?{" "}
              <Link
                to="/signup"
                className="text-accent font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
          ) : null}

          <button
            type="button"
            onClick={onSkip}
            className="text-ink hover:text-muted mt-5 w-full text-sm font-semibold"
          >
            Skip &mdash; explore the demo
          </button>

          <p className="text-faint mt-5 text-center text-xs leading-relaxed">
            By continuing you agree to the Terms and Privacy Policy.
          </p>
        </>
      }
    >
      {passwordEnabled ? (
        <AuthForm
          mode="login"
          onSubmit={handleSubmit}
          isPending={isPending}
          errorMessage={errorMessage}
        />
      ) : null}

      {passwordEnabled && googleEnabled ? (
        <div className="my-6 flex items-center gap-4">
          <span className="bg-line h-px flex-1" />
          <span className="text-faint text-xs font-semibold tracking-wide uppercase">
            or
          </span>
          <span className="bg-line h-px flex-1" />
        </div>
      ) : null}

      {googleEnabled ? (
        <GoogleButton onClick={login} label="Continue with Google" />
      ) : null}
    </AuthShell>
  );
}
