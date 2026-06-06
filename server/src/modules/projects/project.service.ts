import { ProjectRole } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateProjectInput } from "./project.schemas.js";

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