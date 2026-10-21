// This is just a layout component which just takes care of setup.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

function RequireProfile() {
  const { user } = useAuth();
  if (!user.profiles || user.profiles.length == 0)
    return <Navigate to={"/setup"} replace />;

  return <Outlet />;
}

export default RequireProfile;
