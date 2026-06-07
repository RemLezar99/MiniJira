import { Link } from "react-router-dom";
import { useProjects } from "../hooks";

export function ProjectsPage() {
  const projectsQuery = useProjects();

  if (projectsQuery.isLoading) {
    return (
      <section>
        <h1>Projects</h1>
        <p>Loading projects...</p>
      </section>
    );
  }

  if (projectsQuery.isError) {
    return (
      <section>
        <h1>Projects</h1>
        <p role="alert">
          Could not load projects: {projectsQuery.error.message}
        </p>
      </section>
    );
  }

  const projects = projectsQuery.data ?? [];

  if (projects.length === 0) {
    return (
      <section>
        <h1>Projects</h1>
        <p>You do not have any projects yet.</p>
        <p>Create project functionality will be added next.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Projects</h1>

      <ul>
        {projects.map((project) => {
          const currentUserRole = project.members[0]?.role;

          return (
            <li key={project.id}>
              <Link to={`/projects/${project.id}`}>
                <strong>{project.name}</strong>
              </Link>

              {project.description ? <p>{project.description}</p> : null}

              <p>
                Owner: {project.owner.displayName} · Your role:{" "}
                {currentUserRole ?? "Unknown"}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}