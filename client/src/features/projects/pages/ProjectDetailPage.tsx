import { Link, useParams } from "react-router-dom";
import { ProjectSettingsForm } from "../components/ProjectSettingsForm";
import { useProject } from "../hooks";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const projectQuery = useProject(projectId);

  if (projectQuery.isLoading) {
    return (
      <section>
        <p>Loading project...</p>
      </section>
    );
  }

  if (projectQuery.isError) {
    return (
      <section>
        <h1>Project not available</h1>
        <p role="alert">{projectQuery.error.message}</p>
        <Link to="/projects">Back to projects</Link>
      </section>
    );
  }

  if (!projectQuery.data) {
    return (
      <section>
        <h1>Project not found</h1>
        <Link to="/projects">Back to projects</Link>
      </section>
    );
  }

  const project = projectQuery.data;
  const canUpdate =
    project.currentUserRole === "OWNER" || project.currentUserRole === "ADMIN";

  return (
    <section>
      <Link to="/projects">Back to projects</Link>

      <h1>{project.name}</h1>

      {project.description ? <p>{project.description}</p> : null}

      <dl>
        <div>
          <dt>Owner</dt>
          <dd>
            {project.owner.displayName} ({project.owner.email})
          </dd>
        </div>

        <div>
          <dt>Your role</dt>
          <dd>{project.currentUserRole}</dd>
        </div>
      </dl>

      {canUpdate ? (
        <ProjectSettingsForm project={project} />
      ) : (
        <section>
          <h2>Project settings</h2>
          <p>You do not have permission to edit this project.</p>
        </section>
      )}
    </section>
  );
}