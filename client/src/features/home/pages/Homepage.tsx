import { Link, Navigate } from "react-router-dom";
import { AuthStatus } from "../../auth/components/AuthStatus";
import { useAuthState } from "../../auth/hooks";

export function HomePage() {
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

  return (
    <main>
      <h1>Mini Jira</h1>
      <p>Project issue tracking app.</p>

      <nav>
        <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
      </nav>

      <AuthStatus />
    </main>
  );
}