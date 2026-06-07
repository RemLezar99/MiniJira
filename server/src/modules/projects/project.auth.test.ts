import { describe, expect, it } from "vitest";
import { ProjectRole } from "../../generated/prisma/enums.js";
import { HttpError } from "../../lib/httpError.js";
import { prisma } from "../../lib/prisma.js";
import {
  getProjectMembership,
  requireProjectMembership,
  requireProjectRole
} from "./project.auth.js";

async function createUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      displayName: email,
      passwordHash: "hashed-password"
    }
  });
}

describe("project auth helpers", () => {
  it("returns membership when user belongs to project", async () => {
    const user = await createUser("member@example.com");

    const project = await prisma.project.create({
      data: {
        name: "Membership Project",
        ownerId: user.id
      }
    });

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: ProjectRole.MEMBER
      }
    });

    const membership = await getProjectMembership({
      projectId: project.id,
      userId: user.id
    });

    expect(membership).toMatchObject({
      projectId: project.id,
      userId: user.id,
      role: ProjectRole.MEMBER
    });
  });

  it("throws 404 when required membership does not exist", async () => {
    const owner = await createUser("owner@example.com");
    const outsider = await createUser("outsider@example.com");

    const project = await prisma.project.create({
      data: {
        name: "Private Project",
        ownerId: owner.id
      }
    });

    await expect(
      requireProjectMembership({
        projectId: project.id,
        userId: outsider.id
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Project not found"
    });
  });

  it("allows users with required role", async () => {
    const user = await createUser("admin@example.com");

    const project = await prisma.project.create({
      data: {
        name: "Admin Project",
        ownerId: user.id
      }
    });

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: ProjectRole.ADMIN
      }
    });

    const membership = await requireProjectRole({
      projectId: project.id,
      userId: user.id,
      allowedRoles: [ProjectRole.OWNER, ProjectRole.ADMIN]
    });

    expect(membership.role).toBe(ProjectRole.ADMIN);
  });

  it("throws 403 when user has insufficient role", async () => {
    const user = await createUser("viewer@example.com");

    const project = await prisma.project.create({
      data: {
        name: "Viewer Project",
        ownerId: user.id
      }
    });

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: ProjectRole.VIEWER
      }
    });

    await expect(
      requireProjectRole({
        projectId: project.id,
        userId: user.id,
        allowedRoles: [ProjectRole.OWNER, ProjectRole.ADMIN]
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "You do not have permission to perform this action"
    });
  });

  it("uses HttpError for authorization failures", async () => {
    const owner = await createUser("owner@example.com");
    const outsider = await createUser("outsider@example.com");

    const project = await prisma.project.create({
      data: {
        name: "Error Type Project",
        ownerId: owner.id
      }
    });

    await expect(
      requireProjectMembership({
        projectId: project.id,
        userId: outsider.id
      })
    ).rejects.toBeInstanceOf(HttpError);
  });
});