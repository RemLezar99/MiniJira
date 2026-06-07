import { Link } from "react-router-dom";
import { CreateProjectForm } from "../components/CreateProjectForm";
import { useProjects } from "../hooks";

export function ProjectsPage() {
  const projectsQuery = useProjects();

  if (projectsQuery.isLoading) {
    return (
      <section>
        <h1>Projects</h1>
        <CreateProjectForm />
        <p>Loading projects...</p>
      </section>
    );
  }

  if (projectsQuery.isError) {
    return (
      <section>
        <h1>Projects</h1>
        <CreateProjectForm />
        <p role="alert">
          Could not load projects: {projectsQuery.error.message}
        </p>
      </section>
    );
  }

  const projects = projectsQuery.data ?? [];

  return (
    <section>
      <h1>Projects</h1>

      <CreateProjectForm />

      {projects.length === 0 ? (
        <div>
          <h2>No projects yet</h2>
          <p>Create your first project using the form above.</p>
        </div>
      ) : (
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
      )}
    </section>
  );
}