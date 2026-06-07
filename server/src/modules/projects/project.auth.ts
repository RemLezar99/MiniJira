import type { ProjectRole } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/httpError.js";

type RequireProjectMembershipArgs = {
  projectId: string;
  userId: string;
};

type RequireProjectRoleArgs = {
  projectId: string;
  userId: string;
  allowedRoles: ProjectRole[];
};

export async function getProjectMembership({
  projectId,
  userId
}: RequireProjectMembershipArgs) {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    }
  });
}

export async function requireProjectMembership({
  projectId,
  userId
}: RequireProjectMembershipArgs) {
  const membership = await getProjectMembership({
    projectId,
    userId
  });

  if (!membership) {
    throw new HttpError(404, "Project not found");
  }

  return membership;
}

export async function requireProjectRole({
  projectId,
  userId,
  allowedRoles
}: RequireProjectRoleArgs) {
  const membership = await requireProjectMembership({
    projectId,
    userId
  });

  if (!allowedRoles.includes(membership.role)) {
    throw new HttpError(403, "You do not have permission to perform this action");
  }

  return membership;
}