import { createBrowserRouter, Link } from "react-router-dom";
import { AuthStatus } from "../features/auth/components/AuthStatus";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { LoginPage } from "../features/auth/pages/LoginPage";

function HomePage() {
  return (
    <main>
      <h1>Mini Jira</h1>
      <p>Project issue tracking app.</p>

      <nav>
        <Link to="/register">Register</Link>
      </nav>

      <nav>
        <Link to="/login">Log in</Link>
      </nav>

      <AuthStatus />
    </main>
  );
}



function ProjectsPage() {
  return (
    <main>
      <h1>Projects</h1>
      <AuthStatus />
    </main>
  );
}

function ProjectDetailPage() {
  return (
    <main>
      <h1>Project Detail</h1>
    </main>
  );
}

function IssueDetailPage() {
  return (
    <main>
      <h1>Issue Detail</h1>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/register",
    element: <RegisterPage />
  },
  {
    path: "/projects",
    element: <ProjectsPage />
  },
  {
    path: "/projects/:projectId",
    element: <ProjectDetailPage />
  },
  {
    path: "/projects/:projectId/issues/:issueId",
    element: <IssueDetailPage />
  }
]);