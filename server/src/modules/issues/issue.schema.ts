import { z } from "zod";
import { Priority, IssueStatus } from "../../generated/prisma/enums.js";

export const createIssueSchema = z.object({
  title: z.string().trim().min(1, "Issue title is required").max(200),
  description: z.string().trim().max(5000).optional(),
  status: z
    .enum([
      IssueStatus.BACKLOG,
      IssueStatus.TODO,
      IssueStatus.IN_PROGRESS,
      IssueStatus.IN_REVIEW,
      IssueStatus.DONE,
      IssueStatus.CANCELLED
    ])
    .optional(),
  priority: z
    .enum([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT])
    .optional(),
  assigneeId: z.uuid().optional(),
  dueDate: z.coerce.date().optional()
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;