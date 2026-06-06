import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(120),
  description: z.string().trim().max(1000).optional()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;