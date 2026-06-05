import { createBrowserRouter } from "react-router-dom";

function HomePage() {
  return (
    <main>
      <h1>Mini Jira</h1>
      <p>Project issue tracking app.</p>
    </main>
  );
}

function LoginPage() {
  return (
    <main>
      <h1>Login</h1>
    </main>
  );
}

function RegisterPage() {
  return (
    <main>
      <h1>Register</h1>
    </main>
  );
}

function ProjectsPage() {
  return (
    <main>
      <h1>Projects</h1>
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