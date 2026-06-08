import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  ActivityEventType,
  IssueStatus,
  Priority,
  ProjectRole
} from "../../generated/prisma/enums.js";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";

async function registerAgent(email: string, displayName = "Test User") {
  const agent = request.agent(app);

  await agent
    .post("/auth/register")
    .send({
      email,
      password: "password123",
      displayName
    })
    .expect(201);

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email
    }
  });

  return {
    agent,
    user
  };
}

async function createProject(owner: Awaited<ReturnType<typeof registerAgent>>) {
  const response = await owner.agent
    .post("/projects")
    .send({
      name: "Issue Test Project"
    })
    .expect(201);

  return response.body.project as {
    id: string;
    name: string;
  };
}

describe("issue routes", () => {
  it("allows a project owner to create an issue", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const project = await createProject(owner);

    const response = await owner.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: "First issue",
        description: "Issue description",
        priority: Priority.HIGH
      })
      .expect(201);

    expect(response.body.issue).toMatchObject({
      projectId: project.id,
      title: "First issue",
      description: "Issue description",
      priority: Priority.HIGH,
      status: IssueStatus.TODO,
      reporterId: owner.user.id,
      assigneeId: null
    });

    expect(response.body.issue.reporter).toMatchObject({
      id: owner.user.id,
      email: "owner@example.com",
      displayName: "Owner"
    });
  });

  it("sets reporter to the current user", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const project = await createProject(owner);

    const response = await owner.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: "Reporter issue"
      })
      .expect(201);

    expect(response.body.issue.reporterId).toBe(owner.user.id);
  });

  it("allows a project member to create an issue", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const member = await registerAgent("member@example.com", "Member");
    const project = await createProject(owner);

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: member.user.id,
        role: ProjectRole.MEMBER
      }
    });

    const response = await member.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: "Member-created issue"
      })
      .expect(201);

    expect(response.body.issue.reporterId).toBe(member.user.id);
    expect(response.body.issue.title).toBe("Member-created issue");
  });

  it("does not allow a viewer to create an issue", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const viewer = await registerAgent("viewer@example.com", "Viewer");
    const project = await createProject(owner);

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: viewer.user.id,
        role: ProjectRole.VIEWER
      }
    });

    const response = await viewer.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: "Viewer issue"
      })
      .expect(403);

    expect(response.body.message).toBe(
      "You do not have permission to perform this action"
    );
  });

  it("does not allow non-members to create issues", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const outsider = await registerAgent("outsider@example.com", "Outsider");
    const project = await createProject(owner);

    const response = await outsider.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: "Outsider issue"
      })
      .expect(404);

    expect(response.body.message).toBe("Project not found");
  });

  it("requires authentication when creating an issue", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const project = await createProject(owner);

    const response = await request(app)
      .post(`/projects/${project.id}/issues`)
      .send({
        title: "Unauthenticated issue"
      })
      .expect(401);

    expect(response.body.message).toBe("Authentication required");
  });

  it("validates issue title", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const project = await createProject(owner);

    const response = await owner.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: ""
      })
      .expect(400);

    expect(response.body.message).toContain("Issue title is required");
  });

  it("allows assigning an issue to a project member", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const assignee = await registerAgent("assignee@example.com", "Assignee");
    const project = await createProject(owner);

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: assignee.user.id,
        role: ProjectRole.MEMBER
      }
    });

    const response = await owner.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: "Assigned issue",
        assigneeId: assignee.user.id
      })
      .expect(201);

    expect(response.body.issue.assigneeId).toBe(assignee.user.id);
    expect(response.body.issue.assignee).toMatchObject({
      id: assignee.user.id,
      email: "assignee@example.com",
      displayName: "Assignee"
    });
  });

  it("does not allow assigning an issue to a non-project member", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const outsider = await registerAgent("outsider@example.com", "Outsider");
    const project = await createProject(owner);

    const response = await owner.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: "Invalid assignee issue",
        assigneeId: outsider.user.id
      })
      .expect(404);

    expect(response.body.message).toBe("Project not found");
  });

  it("creates an activity event in the same transaction", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const project = await createProject(owner);

    const response = await owner.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: "Activity issue",
        priority: Priority.URGENT
      })
      .expect(201);

    const issueId = response.body.issue.id;

    const activityEvent = await prisma.activityEvent.findFirst({
      where: {
        projectId: project.id,
        issueId,
        actorId: owner.user.id,
        type: ActivityEventType.ISSUE_CREATED
      }
    });

    expect(activityEvent).not.toBeNull();
    expect(activityEvent?.metadata).toMatchObject({
      title: "Activity issue",
      status: IssueStatus.TODO,
      priority: Priority.URGENT,
      assigneeId: null
    });
  });
});