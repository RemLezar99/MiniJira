import { describe, expect, it } from "vitest";
import { IssueStatus, Priority, ProjectRole } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

async function createUser(email: string, displayName = email) {
  return prisma.user.create({
    data: {
      email,
      displayName,
      passwordHash: "hashed-password"
    }
  });
}

async function createProjectWithOwner() {
  const owner = await createUser("owner@example.com", "Owner");

  const project = await prisma.project.create({
    data: {
      name: "Issue Model Project",
      ownerId: owner.id,
      members: {
        create: {
          userId: owner.id,
          role: ProjectRole.OWNER
        }
      }
    }
  });

  return {
    owner,
    project
  };
}

describe("Issue model", () => {
  it("creates an issue that belongs to a project and has a reporter", async () => {
    const { owner, project } = await createProjectWithOwner();

    const issue = await prisma.issue.create({
      data: {
        projectId: project.id,
        title: "First issue",
        description: "This is the first issue",
        reporterId: owner.id
      },
      include: {
        project: true,
        reporter: true,
        assignee: true
      }
    });

    expect(issue.id).toBeDefined();
    expect(issue.projectId).toBe(project.id);
    expect(issue.project.name).toBe("Issue Model Project");
    expect(issue.reporterId).toBe(owner.id);
    expect(issue.reporter.email).toBe("owner@example.com");
    expect(issue.assignee).toBeNull();
    expect(issue.status).toBe(IssueStatus.TODO);
    expect(issue.priority).toBe(Priority.MEDIUM);
    expect(issue.archivedAt).toBeNull();
    expect(issue.createdAt).toBeInstanceOf(Date);
    expect(issue.updatedAt).toBeInstanceOf(Date);
  });

  it("creates an issue with an assignee", async () => {
    const { owner, project } = await createProjectWithOwner();
    const assignee = await createUser("assignee@example.com", "Assignee");

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: assignee.id,
        role: ProjectRole.MEMBER
      }
    });

    const issue = await prisma.issue.create({
      data: {
        projectId: project.id,
        title: "Assigned issue",
        reporterId: owner.id,
        assigneeId: assignee.id
      },
      include: {
        assignee: true
      }
    });

    expect(issue.assigneeId).toBe(assignee.id);
    expect(issue.assignee?.email).toBe("assignee@example.com");
  });

  it("supports status and priority enums", async () => {
    const { owner, project } = await createProjectWithOwner();

    const issue = await prisma.issue.create({
      data: {
        projectId: project.id,
        title: "Urgent in-progress issue",
        reporterId: owner.id,
        status: IssueStatus.IN_PROGRESS,
        priority: Priority.URGENT
      }
    });

    expect(issue.status).toBe(IssueStatus.IN_PROGRESS);
    expect(issue.priority).toBe(Priority.URGENT);
  });

  it("supports soft archive using archivedAt", async () => {
    const { owner, project } = await createProjectWithOwner();

    const issue = await prisma.issue.create({
      data: {
        projectId: project.id,
        title: "Issue to archive",
        reporterId: owner.id
      }
    });

    const archivedAt = new Date();

    const archivedIssue = await prisma.issue.update({
      where: {
        id: issue.id
      },
      data: {
        archivedAt
      }
    });

    expect(archivedIssue.archivedAt).toBeInstanceOf(Date);
  });
});