import { apiClient } from "../../../api/apiClient";
import { toApiError } from "../../../api/apiError";
import type {
  CreateProjectInput,
  Project,
  ProjectResponse,
  ProjectsResponse
} from "../types";

export async function getProjects(): Promise<Project[]> {
  try {
    const response = await apiClient.get<ProjectsResponse>("/projects");
    return response.data.projects;
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