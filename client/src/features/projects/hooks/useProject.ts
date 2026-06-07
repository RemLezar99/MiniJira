import { useQuery } from "@tanstack/react-query";
import { getProject } from "../api/projectApi";
import type { ApiError } from "../../../api/apiError";
import type { ProjectDetails } from "../types";
import { projectQueryKeys } from "./projectQueryKeys";

export function useProject(projectId: string | undefined) {
  return useQuery<ProjectDetails, ApiError>({
    queryKey: projectQueryKeys.detail(projectId ?? ""),
    queryFn: () => getProject(projectId as string),
    enabled: Boolean(projectId)
  });
}