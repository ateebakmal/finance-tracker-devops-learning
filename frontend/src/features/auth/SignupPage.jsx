import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { useAuthConfig } from "./useAuthConfig";
import AuthShell from "./AuthShell";
import AuthForm from "./AuthForm";
import GoogleButton from "./GoogleButton";

export default function SignupPage() {
  const { login, signup } = useAuth();
  const { googleEnabled, passwordEnabled } = useAuthConfig();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: signup,
    // A fresh account has no profile yet, so RequireProfile bounces the user
    // on to /setup from here.
    onSuccess: () => navigate("/dashboard", { replace: true }),
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  function handleSubmit(credentials) {
    setErrorMessage(null);
    mutate(credentials);
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="One place for every rupee, across all your profiles."
      footer={
        <>
          <p className="text-muted text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-accent font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="text-faint mt-5 text-center text-xs leading-relaxed">
            By continuing you agree to the Terms and Privacy Policy.
          </p>
        </>
      }
    >
      {passwordEnabled ? (
        <AuthForm
          mode="signup"
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
        <GoogleButton onClick={login} label="Sign up with Google" />
      ) : null}
    </AuthShell>
  );
}
