import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "../features/auth/components/PublicOnlyRoute";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { HomePage } from "../features/home/pages/Homepage";

function ProjectsPage() {
  return (
    <>
      <h1>Projects</h1>
      <p>Your project list will appear here.</p>
    </>
  );
}

function ProjectDetailPage() {
  return (
    <>
      <h1>Project Detail</h1>
      <p>Project details will appear here.</p>
    </>
  );
}

function IssueDetailPage() {
  return (
    <>
      <h1>Issue Detail</h1>
      <p>Issue details will appear here.</p>
    </>
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
        element: <AppLayout />,
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
    ]
  }
]);