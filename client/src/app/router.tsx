import { createBrowserRouter } from "react-router-dom";
import { AuthStatus } from "../features/auth/components/AuthStatus";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "../features/auth/components/PublicOnlyRoute";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { HomePage } from "../features/home/pages/Homepage";

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
      <AuthStatus />
    </main>
  );
}

function IssueDetailPage() {
  return (
    <main>
      <h1>Issue Detail</h1>
      <AuthStatus />
    </main>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />
      },
      {
        path: "/register",
        element: <RegisterPage />
      }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
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
    ]
  }
]);