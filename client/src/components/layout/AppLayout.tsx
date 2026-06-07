import { Link, NavLink, Outlet } from "react-router-dom";
import { LogoutButton } from "../../features/auth/components/LogoutButton";
import { useAuthState } from "../../features/auth/hooks";

export function AppLayout() {
  const { currentUser } = useAuthState();

  return (
    <div className="app-layout">
      <header className="app-layout__topbar">
        <div>
          <Link to="/projects" className="app-layout__brand">
            Mini Jira
          </Link>
        </div>

        <nav className="app-layout__topnav" aria-label="Top navigation">
          <NavLink to="/projects">Projects</NavLink>
        </nav>

        <div className="app-layout__user">
          {currentUser ? (
            <span>
              {currentUser.displayName} ({currentUser.email})
            </span>
          ) : null}

          <LogoutButton />
        </div>
      </header>

      <div className="app-layout__body">
        <aside className="app-layout__sidebar">
          <nav aria-label="Project navigation">
            <p className="app-layout__sidebar-title">Navigation</p>

            <NavLink to="/projects">All projects</NavLink>

            <span className="app-layout__sidebar-muted">
              Project shortcuts will appear here later.
            </span>
          </nav>
        </aside>

        <main className="app-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}