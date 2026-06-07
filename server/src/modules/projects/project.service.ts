import { ProjectRole } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schemas.js";
import { HttpError } from "../../lib/httpError.js";

type CreateProjectArgs = {
  input: CreateProjectInput;
  userId: string;
};

type UpdateProjectArgs = {
  projectId: string;
  userId: string;
  input: UpdateProjectInput;
};

type ListProjectsArgs = {
  userId: string;
};

type ArchiveProjectArgs = {
  projectId: string;
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

async function getMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    }
  });
}

function requireProjectRole(
  role: ProjectRole | undefined,
  allowedRoles: ProjectRole[]
) {
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpError(403, "You do not have permission to perform this action");
  }
}



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

  export async function updateProject({
  projectId,
  userId,
  input
}: UpdateProjectArgs) {
  const membership = await getMembership(projectId, userId);

  if (!membership) {
    throw new HttpError(404, "Project not found");
  }

  requireProjectRole(membership.role, [ProjectRole.OWNER, ProjectRole.ADMIN]);

  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  });

  if (!project || project.isArchived) {
    throw new HttpError(404, "Project not found");
  }

  await prisma.project.update({
    where: {
      id: projectId
    },
    data: {
      name: input.name,
      description: input.description
    }
  });

  return getProjectForUser({
    projectId,
    userId
  });
}

export async function archiveProject({ projectId, userId }: ArchiveProjectArgs) {
  const membership = await getMembership(projectId, userId);

  if (!membership) {
    throw new HttpError(404, "Project not found");
  }

  requireProjectRole(membership.role, [ProjectRole.OWNER]);

  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  });

  if (!project || project.isArchived) {
    throw new HttpError(404, "Project not found");
  }

  return prisma.project.update({
    where: {
      id: projectId
    },
    data: {
      isArchived: true
    },
    include: projectIncludeForCurrentUser(userId)
  });
}

