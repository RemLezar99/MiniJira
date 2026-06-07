import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { ActivityEventType, ProjectRole } from "../../generated/prisma/enums.js";
import type {
  AddProjectMemberInput,
  CreateProjectInput,
  UpdateProjectInput,
  UpdateProjectMemberRoleInput
} from "./project.schemas.js";
import {
  requireProjectMembership,
  requireProjectRole
} from "./project.auth.js";


type CreateProjectArgs = {
  input: CreateProjectInput;
  userId: string;
};

type ListProjectsArgs = {
  userId: string;
};

type GetProjectArgs = {
  projectId: string;
  userId: string;
};

type UpdateProjectArgs = {
  projectId: string;
  userId: string;
  input: UpdateProjectInput;
};

type ArchiveProjectArgs = {
  projectId: string;
  userId: string;
};

type ListProjectMembersArgs = {
  projectId: string;
  userId: string;
};

type AddProjectMemberArgs = {
  projectId: string;
  userId: string;
  input: AddProjectMemberInput;
};

type UpdateProjectMemberRoleArgs = {
  projectId: string;
  actorUserId: string;
  targetUserId: string;
  input: UpdateProjectMemberRoleInput;
};

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

function toProjectDetails(
  project: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    owner: {
      id: string;
      email: string;
      displayName: string;
    };
    members: {
      userId: string;
      projectId: string;
      role: ProjectRole;
      joinedAt: Date;
    }[];
  }
) {
  const currentUserMembership = project.members[0];

  if (!currentUserMembership) {
    throw new HttpError(404, "Project not found");
  }

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
      include: projectIncludeForCurrentUser(userId)
    });
  });
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
    include: projectIncludeForCurrentUser(userId),
    orderBy: {
      updatedAt: "desc"
    }
  });
}

export async function getProjectForUser({ projectId, userId }: GetProjectArgs) {
  await requireProjectMembership({
    projectId,
    userId
  });

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      isArchived: false
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

export async function updateProject({
  projectId,
  userId,
  input
}: UpdateProjectArgs) {
  await requireProjectRole({
    projectId,
    userId,
    allowedRoles: [ProjectRole.OWNER, ProjectRole.ADMIN]
  });

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
  await requireProjectRole({
    projectId,
    userId,
    allowedRoles: [ProjectRole.OWNER]
  });

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

export async function listProjectMembers({
  projectId,
  userId
}: ListProjectMembersArgs) {
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

  const members = await prisma.projectMember.findMany({
    where: {
      projectId
    },
    select: {
      projectId: true,
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true
        }
      }
    },
    orderBy: [
      {
        role: "asc"
      },
      {
        joinedAt: "asc"
      }
    ]
  });

  return members;
}

export async function addProjectMember({
  projectId,
  userId,
  input
}: AddProjectMemberArgs) {
  await requireProjectRole({
    projectId,
    userId,
    allowedRoles: [ProjectRole.OWNER, ProjectRole.ADMIN]
  });

  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  });

  if (!project || project.isArchived) {
    throw new HttpError(404, "Project not found");
  }

  const userToAdd = await prisma.user.findUnique({
    where: {
      id: input.userId
    },
    select: {
      id: true
    }
  });

  if (!userToAdd) {
    throw new HttpError(404, "User not found");
  }

  const existingMembership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: input.userId
      }
    }
  });

  if (existingMembership) {
    throw new HttpError(409, "User is already a project member");
  }

  return prisma.$transaction(async (tx) => {
    const membership = await tx.projectMember.create({
      data: {
        projectId,
        userId: input.userId,
        role: input.role
      },
      select: {
        projectId: true,
        userId: true,
        role: true,
        joinedAt: true,
        user: {
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
        type: ActivityEventType.PROJECT_MEMBER_ADDED,
        projectId,
        actorId: userId,
        targetUserId: input.userId,
        metadata: {
          role: input.role
        }
      }
    });

    return membership;
  });
}

async function countProjectOwners(projectId: string) {
  return prisma.projectMember.count({
    where: {
      projectId,
      role: ProjectRole.OWNER
    }
  });
}

export async function updateProjectMemberRole({
  projectId,
  actorUserId,
  targetUserId,
  input
}: UpdateProjectMemberRoleArgs) {
  const actorMembership = await requireProjectRole({
    projectId,
    userId: actorUserId,
    allowedRoles: [ProjectRole.OWNER, ProjectRole.ADMIN]
  });

  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  });

  if (!project || project.isArchived) {
    throw new HttpError(404, "Project not found");
  }

  const targetMembership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: targetUserId
      }
    }
  });

  if (!targetMembership) {
    throw new HttpError(404, "Project member not found");
  }

  if (
    actorMembership.role === ProjectRole.ADMIN &&
    targetMembership.role === ProjectRole.OWNER
  ) {
    throw new HttpError(403, "Admins cannot change an owner's role");
  }

  if (
    targetMembership.role === ProjectRole.OWNER &&
    input.role !== ProjectRole.OWNER
  ) {
    const ownerCount = await countProjectOwners(projectId);

    if (ownerCount <= 1) {
      throw new HttpError(400, "Project must have at least one owner");
    }
  }

  if (targetMembership.role === input.role) {
    return prisma.projectMember.findUniqueOrThrow({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId
        }
      },
      select: {
        projectId: true,
        userId: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });
  }

  return prisma.$transaction(async (tx) => {
    const updatedMember = await tx.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId
        }
      },
      data: {
        role: input.role
      },
      select: {
        projectId: true,
        userId: true,
        role: true,
        joinedAt: true,
        user: {
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
        type: ActivityEventType.PROJECT_MEMBER_ROLE_CHANGED,
        projectId,
        actorId: actorUserId,
        targetUserId,
        oldValue: targetMembership.role,
        newValue: input.role,
        metadata: {
          oldRole: targetMembership.role,
          newRole: input.role
        }
      }
    });

    return updatedMember;
  });
}
