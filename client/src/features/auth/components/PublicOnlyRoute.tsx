import { Navigate, Outlet } from "react-router-dom";
import { useAuthState } from "../hooks";

export function PublicOnlyRoute() {
  const { isLoading, isAuthenticated, error } = useAuthState();

  if (isLoading) {
    return <p>Checking authentication...</p>;
  }

  if (error) {
    return <p>Could not verify authentication: {error.message}</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return <Outlet />;
}