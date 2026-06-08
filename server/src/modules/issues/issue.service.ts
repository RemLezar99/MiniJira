import {
  ActivityEventType,
  ProjectRole
} from "../../generated/prisma/enums.js";
import { HttpError } from "../../lib/httpError.js";
import { prisma } from "../../lib/prisma.js";
import {
  requireProjectMembership,
  requireProjectRole
} from "../projects/project.auth.js";
import type {
  CreateIssueInput,
  ListIssuesQuery
} from "../issues/issue.schema.js";

type CreateIssueArgs = {
  projectId: string;
  userId: string;
  input: CreateIssueInput;
};

type ListIssuesArgs = {
  projectId: string;
  userId: string;
  query: ListIssuesQuery;
};

export async function createIssue({
  projectId,
  userId,
  input
}: CreateIssueArgs) {
  await requireProjectRole({
    projectId,
    userId,
    allowedRoles: [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER]
  });

  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      id: true,
      isArchived: true
    }
  });

  if (!project || project.isArchived) {
    throw new HttpError(404, "Project not found");
  }

  if (input.assigneeId) {
    await requireProjectMembership({
      projectId,
      userId: input.assigneeId
    });
  }

  return prisma.$transaction(async (tx) => {
    const issue = await tx.issue.create({
      data: {
        projectId,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        reporterId: userId,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        reporter: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        },
        assignee: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });

    await tx.activityEvent.create({
      data: {
        type: ActivityEventType.ISSUE_CREATED,
        projectId,
        issueId: issue.id,
        actorId: userId,
        metadata: {
          title: issue.title,
          status: issue.status,
          priority: issue.priority,
          assigneeId: issue.assigneeId
        }
      }
    });

    return issue;
  });
}

export async function listIssuesForProject({
  projectId,
  userId,
  query
}: ListIssuesArgs) {
  try {
    await requireProjectMembership({
      projectId,
      userId
    });

    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      },
      select: {
        id: true,
        isArchived: true
      }
    });

    if (!project || project.isArchived) {
      throw new HttpError(404, "Project not found");
    }

    const skip = (query.page - 1) * query.pageSize;
    const take = query.pageSize;

    const where = {
      projectId,
      archivedAt: null
    };

    const total = await prisma.issue.count({
      where
    });

    const issues = await prisma.issue.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        },
        assignee: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        },
        labels: {
          select: {
            label: {
              select: {
                id: true,
                projectId: true,
                name: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      skip,
      take
    });

    const normalizedIssues = issues.map((issue) => ({
      ...issue,
      labels: issue.labels.map((issueLabel) => issueLabel.label)
    }));

    const pageCount = Math.ceil(total / query.pageSize);

    return {
      issues: normalizedIssues,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        pageCount,
        hasNextPage: query.page < pageCount,
        hasPreviousPage: query.page > 1
      }
    };
  } catch (error) {
    console.error("listIssuesForProject error:", error);
    throw error;
  }
}