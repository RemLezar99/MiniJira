import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "../api/projectApi";
import type { CreateProjectInput } from "../types";
import { projectQueryKeys } from "./projectQueryKeys";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectQueryKeys.lists()
      });
    }
  });
}