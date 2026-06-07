import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { ApiError } from "../../../api/apiError";
import { useUpdateProject } from "../hooks";
import {
  updateProjectFormSchema,
  type UpdateProjectFormValues
} from "../schemas";
import type { ProjectDetails } from "../types";

type ProjectSettingsFormProps = {
  project: ProjectDetails;
};

export function ProjectSettingsForm({ project }: ProjectSettingsFormProps) {
  const updateProjectMutation = useUpdateProject({
    projectId: project.id
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(updateProjectFormSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? ""
    }
  });

  useEffect(() => {
    reset({
      name: project.name,
      description: project.description ?? ""
    });
  }, [project, reset]);

  function onSubmit(values: UpdateProjectFormValues) {
    updateProjectMutation.mutate(
      {
        name: values.name,
        description: values.description || undefined
      },
      {
        onSuccess: (updatedProject) => {
          reset({
            name: updatedProject.name,
            description: updatedProject.description ?? ""
          });
        }
      }
    );
  }

  const serverError = updateProjectMutation.error as ApiError | null;

  return (
    <section>
      <h2>Project settings</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="project-settings-name">Project name</label>
          <input
            id="project-settings-name"
            type="text"
            {...register("name")}
            disabled={updateProjectMutation.isPending}
          />
          {errors.name ? <p role="alert">{errors.name.message}</p> : null}
        </div>

        <div>
          <label htmlFor="project-settings-description">Description</label>
          <textarea
            id="project-settings-description"
            rows={4}
            {...register("description")}
            disabled={updateProjectMutation.isPending}
          />
          {errors.description ? (
            <p role="alert">{errors.description.message}</p>
          ) : null}
        </div>

        {serverError ? <p role="alert">{serverError.message}</p> : null}

        {updateProjectMutation.isSuccess ? (
          <p>Project settings updated.</p>
        ) : null}

        <button
          type="submit"
          disabled={updateProjectMutation.isPending || !isDirty}
        >
          {updateProjectMutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}