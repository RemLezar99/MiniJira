import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthState } from "../hooks";

export function ProtectedRoute() {
  const location = useLocation();
  const { isLoading, isAuthenticated, error } = useAuthState();

  if (isLoading) {
    return <p>Checking authentication...</p>;
  }

  if (error) {
    return <p>Could not verify authentication: {error.message}</p>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location
        }}
      />
    );
  }

  return <Outlet />;
}