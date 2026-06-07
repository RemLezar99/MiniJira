import { apiClient } from "../../../api/apiClient";
import { toApiError } from "../../../api/apiError";
import type { Project, ProjectsResponse } from "../types";

export async function getProjects(): Promise<Project[]> {
  try {
    const response = await apiClient.get<ProjectsResponse>("/projects");
    return response.data.projects;
  } catch (error) {
    throw toApiError(error);
  }
}