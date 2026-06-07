import { z } from "zod";
import { ProjectRole } from "../../generated/prisma/enums.js";

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

  export const addProjectMemberSchema = z.object({
  userId: z.uuid(),
  role: z.enum([
    ProjectRole.ADMIN,
    ProjectRole.MEMBER,
    ProjectRole.VIEWER
  ])
});

export type ProjectParams = z.infer<typeof projectParamsSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;