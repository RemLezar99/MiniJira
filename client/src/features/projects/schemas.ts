import { z } from "zod";

export const createProjectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(120, "Project name must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
});

export const updateProjectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(120, "Project name must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
});

export type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;
export type UpdateProjectFormValues = z.infer<typeof updateProjectFormSchema>;