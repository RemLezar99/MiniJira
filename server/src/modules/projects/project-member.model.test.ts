import { describe, expect, it } from "vitest";
import { ProjectRole } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

describe("ProjectMember model", () => {
  it("creates a project membership with OWNER role", async () => {
    const user = await prisma.user.create({
      data: {
        email: "owner@example.com",
        displayName: "Project Owner",
        passwordHash: "hashed-password"
      }
    });

    const project = await prisma.project.create({
      data: {
        name: "Mini Jira",
        ownerId: user.id
      }
    });

    const membership = await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: ProjectRole.OWNER
      },
      include: {
        user: true,
        project: true
      }
    });

    expect(membership.projectId).toBe(project.id);
    expect(membership.userId).toBe(user.id);
    expect(membership.role).toBe(ProjectRole.OWNER);
    expect(membership.user.email).toBe("owner@example.com");
    expect(membership.project.name).toBe("Mini Jira");
    expect(membership.joinedAt).toBeInstanceOf(Date);
  });

  it("allows a project to have multiple members with different roles", async () => {
    const owner = await prisma.user.create({
      data: {
        email: "owner@example.com",
        displayName: "Owner",
        passwordHash: "hashed-password"
      }
    });

    const member = await prisma.user.create({
      data: {
        email: "member@example.com",
        displayName: "Member",
        passwordHash: "hashed-password"
      }
    });

    const viewer = await prisma.user.create({
      data: {
        email: "viewer@example.com",
        displayName: "Viewer",
        passwordHash: "hashed-password"
      }
    });

    const project = await prisma.project.create({
      data: {
        name: "Role Test Project",
        ownerId: owner.id
      }
    });

    await prisma.projectMember.createMany({
      data: [
        {
          projectId: project.id,
          userId: owner.id,
          role: ProjectRole.OWNER
        },
        {
          projectId: project.id,
          userId: member.id,
          role: ProjectRole.MEMBER
        },
        {
          projectId: project.id,
          userId: viewer.id,
          role: ProjectRole.VIEWER
        }
      ]
    });

    const projectWithMembers = await prisma.project.findUnique({
      where: {
        id: project.id
      },
      include: {
        members: {
          include: {
            user: true
          },
          orderBy: {
            user: {
              email: "asc"
            }
          }
        }
      }
    });

    expect(projectWithMembers?.members).toHaveLength(3);

    const rolesByEmail = new Map(
      projectWithMembers?.members.map((membership) => [
        membership.user.email,
        membership.role
      ])
    );

    expect(rolesByEmail.get("owner@example.com")).toBe(ProjectRole.OWNER);
    expect(rolesByEmail.get("member@example.com")).toBe(ProjectRole.MEMBER);
    expect(rolesByEmail.get("viewer@example.com")).toBe(ProjectRole.VIEWER);
  });

  it("prevents duplicate membership for the same user and project", async () => {
    const user = await prisma.user.create({
      data: {
        email: "duplicate@example.com",
        displayName: "Duplicate Member",
        passwordHash: "hashed-password"
      }
    });

    const project = await prisma.project.create({
      data: {
        name: "Duplicate Membership Project",
        ownerId: user.id
      }
    });

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: ProjectRole.OWNER
      }
    });

    await expect(
      prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: ProjectRole.ADMIN
        }
      })
    ).rejects.toThrow();
  });

  it("allows a user to belong to multiple projects", async () => {
    const user = await prisma.user.create({
      data: {
        email: "multi-project@example.com",
        displayName: "Multi Project User",
        passwordHash: "hashed-password"
      }
    });

    const projectOne = await prisma.project.create({
      data: {
        name: "Project One",
        ownerId: user.id
      }
    });

    const projectTwo = await prisma.project.create({
      data: {
        name: "Project Two",
        ownerId: user.id
      }
    });

    await prisma.projectMember.createMany({
      data: [
        {
          projectId: projectOne.id,
          userId: user.id,
          role: ProjectRole.OWNER
        },
        {
          projectId: projectTwo.id,
          userId: user.id,
          role: ProjectRole.OWNER
        }
      ]
    });

    const userWithMemberships = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      include: {
        memberships: {
          include: {
            project: true
          }
        }
      }
    });

    expect(userWithMemberships?.memberships).toHaveLength(2);

    const projectNames = userWithMemberships?.memberships.map(
      (membership) => membership.project.name
    );

    expect(projectNames).toContain("Project One");
    expect(projectNames).toContain("Project Two");
  });
});