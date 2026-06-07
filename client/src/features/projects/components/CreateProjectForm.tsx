import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ApiError } from "../../../api/apiError";
import { useCreateProject } from "../hooks";
import {
  createProjectFormSchema,
  type CreateProjectFormValues
} from "../schemas";

export function CreateProjectForm() {
  const createProjectMutation = useCreateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  function onSubmit(values: CreateProjectFormValues) {
    createProjectMutation.mutate(
      {
        name: values.name,
        description: values.description || undefined
      },
      {
        onSuccess: () => {
          reset();
        }
      }
    );
  }

  const serverError = createProjectMutation.error as ApiError | null;

  return (
    <section>
      <h2>Create project</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            type="text"
            {...register("name")}
            disabled={createProjectMutation.isPending}
          />
          {errors.name ? <p role="alert">{errors.name.message}</p> : null}
        </div>

        <div>
          <label htmlFor="project-description">Description</label>
          <textarea
            id="project-description"
            rows={3}
            {...register("description")}
            disabled={createProjectMutation.isPending}
          />
          {errors.description ? (
            <p role="alert">{errors.description.message}</p>
          ) : null}
        </div>

        {serverError ? <p role="alert">{serverError.message}</p> : null}

        <button type="submit" disabled={createProjectMutation.isPending}>
          {createProjectMutation.isPending ? "Creating..." : "Create project"}
        </button>
      </form>
    </section>
  );
}