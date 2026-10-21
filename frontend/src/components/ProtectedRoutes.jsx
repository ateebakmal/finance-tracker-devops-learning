import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { Spinner } from "./ui/Spinner";

export default function ProtectedRoutes() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={"/login"} replace />;
  }

  return <Outlet />;
}
