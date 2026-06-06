import { z } from "zod";

export const projectParamsSchema = z.object({
  projectId: z.uuid()
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(120),
  description: z.string().trim().max(1000).optional()
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(120).optional(),
    description: z.string().trim().max(1000).optional()
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field must be provided"
  });

export type ProjectParams = z.infer<typeof projectParamsSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;