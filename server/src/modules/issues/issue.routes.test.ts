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
  it("lists issues for a project member", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const project = await createProject(owner);

  await owner.agent
    .post(`/projects/${project.id}/issues`)
    .send({
      title: "First issue",
      priority: Priority.HIGH
    })
    .expect(201);

  await owner.agent
    .post(`/projects/${project.id}/issues`)
    .send({
      title: "Second issue",
      status: IssueStatus.IN_PROGRESS,
      priority: Priority.URGENT
    })
    .expect(201);

  const response = await owner.agent.get(`/projects/${project.id}/issues`);

console.log("STATUS:", response.status);
console.log("BODY:", response.body);
console.log("TEXT:", response.text);

expect(response.status).toBe(200);

  expect(response.body.issues).toHaveLength(2);
  expect(response.body.pagination).toMatchObject({
    page: 1,
    pageSize: 20,
    total: 2,
    pageCount: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const titles = response.body.issues.map((issue: { title: string }) => issue.title);

  expect(titles).toContain("First issue");
  expect(titles).toContain("Second issue");
});

it("requires authentication when listing issues", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const project = await createProject(owner);

  const response = await request(app)
    .get(`/projects/${project.id}/issues`)
    .expect(401);

  expect(response.body.message).toBe("Authentication required");
});

it("does not allow non-members to list issues", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const outsider = await registerAgent("outsider@example.com", "Outsider");
  const project = await createProject(owner);

  const response = await outsider.agent
    .get(`/projects/${project.id}/issues`)
    .expect(404);

  expect(response.body.message).toBe("Project not found");
});

it("allows viewers to list issues", async () => {
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

  await owner.agent
    .post(`/projects/${project.id}/issues`)
    .send({
      title: "Visible issue"
    })
    .expect(201);

  const response = await viewer.agent
    .get(`/projects/${project.id}/issues`)
    .expect(200);

  expect(response.body.issues).toHaveLength(1);
  expect(response.body.issues[0].title).toBe("Visible issue");
});

it("excludes archived issues by default", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const project = await createProject(owner);

  const activeIssueResponse = await owner.agent
    .post(`/projects/${project.id}/issues`)
    .send({
      title: "Active issue"
    })
    .expect(201);

  const archivedIssueResponse = await owner.agent
    .post(`/projects/${project.id}/issues`)
    .send({
      title: "Archived issue"
    })
    .expect(201);

  await prisma.issue.update({
    where: {
      id: archivedIssueResponse.body.issue.id
    },
    data: {
      archivedAt: new Date()
    }
  });

  const response = await owner.agent
    .get(`/projects/${project.id}/issues`)
    .expect(200);

  expect(response.body.issues).toHaveLength(1);
  expect(response.body.issues[0]).toMatchObject({
    id: activeIssueResponse.body.issue.id,
    title: "Active issue"
  });
});

it("includes status, priority, reporter, assignee, and labels when listing issues", async () => {
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

  const label = await prisma.label.create({
    data: {
      projectId: project.id,
      name: "bug",
      color: "#ff0000"
    }
  });

  const issueResponse = await owner.agent
    .post(`/projects/${project.id}/issues`)
    .send({
      title: "Labeled issue",
      priority: Priority.HIGH,
      assigneeId: assignee.user.id
    })
    .expect(201);

  await prisma.issueLabel.create({
    data: {
      issueId: issueResponse.body.issue.id,
      labelId: label.id
    }
  });

  const response = await owner.agent
    .get(`/projects/${project.id}/issues`)
    .expect(200);

  expect(response.body.issues).toHaveLength(1);

  expect(response.body.issues[0]).toMatchObject({
    id: issueResponse.body.issue.id,
    title: "Labeled issue",
    status: IssueStatus.TODO,
    priority: Priority.HIGH,
    reporter: {
      id: owner.user.id,
      email: "owner@example.com",
      displayName: "Owner"
    },
    assignee: {
      id: assignee.user.id,
      email: "assignee@example.com",
      displayName: "Assignee"
    }
  });

    expect(response.body.issues[0].labels).toHaveLength(1);
    expect(response.body.issues[0].labels[0]).toMatchObject({
    id: label.id,
    projectId: project.id,
    name: "bug",
    color: "#ff0000"
    });
});

it("supports pagination when listing issues", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const project = await createProject(owner);

  for (let index = 1; index <= 3; index += 1) {
    await owner.agent
      .post(`/projects/${project.id}/issues`)
      .send({
        title: `Issue ${index}`
      })
      .expect(201);
  }

  const response = await owner.agent
    .get(`/projects/${project.id}/issues?page=1&pageSize=2`)
    .expect(200);

  expect(response.body.issues).toHaveLength(2);
  expect(response.body.pagination).toMatchObject({
    page: 1,
    pageSize: 2,
    total: 3,
    pageCount: 2,
    hasNextPage: true,
    hasPreviousPage: false
  });

  const secondPageResponse = await owner.agent
    .get(`/projects/${project.id}/issues?page=2&pageSize=2`)
    .expect(200);

  expect(secondPageResponse.body.issues).toHaveLength(1);
  expect(secondPageResponse.body.pagination).toMatchObject({
    page: 2,
    pageSize: 2,
    total: 3,
    pageCount: 2,
    hasNextPage: false,
    hasPreviousPage: true
  });
});

it("validates pagination query parameters", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const project = await createProject(owner);

  const response = await owner.agent
    .get(`/projects/${project.id}/issues?page=0&pageSize=101`)
    .expect(400);

  expect(response.body.message).toBeDefined();
});
});