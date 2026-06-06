import { ProjectRole } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateProjectInput } from "./project.schemas.js";
import { HttpError } from "../../lib/httpError.js";

type CreateProjectArgs = {
  input: CreateProjectInput;
  userId: string;
};

export async function createProject({ input, userId }: CreateProjectArgs) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: input.name,
        description: input.description,
        ownerId: userId
      }
    });

    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        role: ProjectRole.OWNER
      }
    });

    return tx.project.findUniqueOrThrow({
      where: {
        id: project.id
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        },
        members: true
      }
    });
  });
}

type ListProjectsArgs = {
  userId: string;
};

export async function listProjectsForUser({ userId }: ListProjectsArgs) {
  return prisma.project.findMany({
    where: {
      isArchived: false,
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          displayName: true
        }
      },
      members: {
        where: {
          userId
        },
        select: {
          userId: true,
          projectId: true,
          role: true,
          joinedAt: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}

type GetProjectArgs = {
  projectId: string;
  userId: string;
};

export async function getProjectForUser({ projectId, userId }: GetProjectArgs) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      isArchived: false,
      members: {
        some: {
          userId
        }
      }
    },
    include: projectIncludeForCurrentUser(userId)
  });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const currentUserMembership = project.members[0];

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    isArchived: project.isArchived,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    owner: project.owner,
    currentUserRole: currentUserMembership.role,
    currentUserMembership
  };
}

const projectIncludeForCurrentUser = (userId: string) =>
  ({
    owner: {
      select: {
        id: true,
        email: true,
        displayName: true
      }
    },
    members: {
      where: {
        userId
      },
      select: {
        userId: true,
        projectId: true,
        role: true,
        joinedAt: true
      }
    }
  }) as const;