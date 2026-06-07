import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../api/projectApi";
import type { Project } from "../types";
import type { ApiError } from "../../../api/apiError";
import { projectQueryKeys } from "./projectQueryKeys";

export function useProjects() {
  return useQuery<Project[], ApiError>({
    queryKey: projectQueryKeys.lists(),
    queryFn: getProjects
  });
}