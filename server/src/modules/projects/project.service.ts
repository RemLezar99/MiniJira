import { ProjectRole } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import type {
  CreateProjectInput,
  UpdateProjectInput
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
