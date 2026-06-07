import { apiClient } from "../../../api/apiClient";
import { toApiError } from "../../../api/apiError";
import type {
  CreateProjectInput,
  Project,
  ProjectDetails,
  ProjectDetailsResponse,
  ProjectResponse,
  ProjectsResponse,
  UpdateProjectInput
} from "../types";

export async function getProjects(): Promise<Project[]> {
  try {
    const response = await apiClient.get<ProjectsResponse>("/projects");
    return response.data.projects;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getProject(projectId: string): Promise<ProjectDetails> {
  try {
    const response = await apiClient.get<ProjectDetailsResponse>(
      `/projects/${projectId}`
    );

    return response.data.project;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  try {
    const response = await apiClient.post<ProjectResponse>("/projects", input);
    return response.data.project;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<ProjectDetails> {
  try {
    const response = await apiClient.patch<ProjectDetailsResponse>(
      `/projects/${projectId}`,
      input
    );

    return response.data.project;
  } catch (error) {
    throw toApiError(error);
  }
}