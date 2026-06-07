import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject } from "../api/projectApi";
import type { ProjectDetails, UpdateProjectInput } from "../types";
import { projectQueryKeys } from "./projectQueryKeys";

type UseUpdateProjectArgs = {
  projectId: string;
};

export function useUpdateProject({ projectId }: UseUpdateProjectArgs) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => updateProject(projectId, input),

    onSuccess: async (updatedProject) => {
      queryClient.setQueryData<ProjectDetails | undefined>(
        projectQueryKeys.detail(projectId),
        (currentProject) => {
          if (!currentProject) {
            return updatedProject as ProjectDetails;
          }

          return {
            ...currentProject,
            ...updatedProject,
            currentUserRole: currentProject.currentUserRole,
            currentUserMembership: currentProject.currentUserMembership
          };
        }
      );

      await queryClient.invalidateQueries({
        queryKey: projectQueryKeys.lists()
      });
    }
  });
}