import { describe, expect, it } from "vitest";
import { prisma } from "../../lib/prisma.js";

describe("Project model", () => {
  it("creates a project owned by a user", async () => {
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
        description: "A test project",
        ownerId: user.id
      },
      include: {
        owner: true
      }
    });

    expect(project.id).toBeDefined();
    expect(project.name).toBe("Mini Jira");
    expect(project.description).toBe("A test project");
    expect(project.ownerId).toBe(user.id);
    expect(project.isArchived).toBe(false);
    expect(project.owner.email).toBe("owner@example.com");
    expect(project.createdAt).toBeInstanceOf(Date);
    expect(project.updatedAt).toBeInstanceOf(Date);
  });

  it("allows a user to own multiple projects", async () => {
    const user = await prisma.user.create({
      data: {
        email: "multi-owner@example.com",
        displayName: "Multi Owner",
        passwordHash: "hashed-password"
      }
    });

    await prisma.project.createMany({
      data: [
        {
          name: "Project One",
          ownerId: user.id
        },
        {
          name: "Project Two",
          ownerId: user.id
        }
      ]
    });

    const ownerWithProjects = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      include: {
        ownedProjects: true
      }
    });

    expect(ownerWithProjects?.ownedProjects).toHaveLength(2);
  });
});