import { useAuthState } from "../hooks";
import { LogoutButton } from "./LogoutButton";

export function AuthStatus() {
  const { currentUser, isLoading, isAuthenticated, isUnauthenticated, error } =
    useAuthState();

  if (isLoading) {
    return <p>Checking authentication...</p>;
  }

  if (isUnauthenticated) {
    return <p>You are not logged in.</p>;
  }

  if (error) {
    return <p>Could not check authentication: {error.message}</p>;
  }

  if (!isAuthenticated || !currentUser) {
    return <p>You are not logged in.</p>;
  }

  return (
    <div>
      <p>
        Logged in as <strong>{currentUser.displayName}</strong> ({currentUser.email})
      </p>

      <LogoutButton />
    </div>
  );
}