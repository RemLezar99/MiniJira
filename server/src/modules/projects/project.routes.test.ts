import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  ActivityEventType,
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

describe("project routes", () => {
  it("allows an authenticated user to create a project", async () => {
    const owner = await registerAgent("owner@example.com", "Project Owner");

    const response = await owner.agent
      .post("/projects")
      .send({
        name: "Mini Jira",
        description: "A Jira-style learning project"
      })
      .expect(201);

    expect(response.body.project).toMatchObject({
      name: "Mini Jira",
      description: "A Jira-style learning project",
      isArchived: false
    });

    expect(response.body.project.owner).toMatchObject({
      email: "owner@example.com",
      displayName: "Project Owner"
    });
  });

  it("does not allow an unauthenticated user to create a project", async () => {
    const response = await request(app)
      .post("/projects")
      .send({
        name: "Unauthenticated Project"
      })
      .expect(401);

    expect(response.body.message).toBe("Authentication required");
  });

  it("makes the creator the project owner and OWNER member", async () => {
    const owner = await registerAgent("owner@example.com", "Project Owner");

    const response = await owner.agent
      .post("/projects")
      .send({
        name: "Ownership Project"
      })
      .expect(201);

    const projectId = response.body.project.id;

    const project = await prisma.project.findUniqueOrThrow({
      where: {
        id: projectId
      },
      include: {
        owner: true,
        members: true
      }
    });

    expect(project.ownerId).toBe(owner.user.id);
    expect(project.owner.email).toBe("owner@example.com");
    expect(project.members).toHaveLength(1);
    expect(project.members[0]).toMatchObject({
      userId: owner.user.id,
      projectId,
      role: ProjectRole.OWNER
    });
  });

  it("validates project creation input", async () => {
    const owner = await registerAgent("owner@example.com", "Project Owner");

    const response = await owner.agent
      .post("/projects")
      .send({
        name: "",
        description: "Valid description"
      })
      .expect(400);

    expect(response.body.message).toContain("Project name is required");
  });

  it("allows a user to list their own projects", async () => {
    const owner = await registerAgent("owner@example.com", "Project Owner");

    await owner.agent
      .post("/projects")
      .send({
        name: "Project One"
      })
      .expect(201);

    await owner.agent
      .post("/projects")
      .send({
        name: "Project Two"
      })
      .expect(201);

    const response = await owner.agent.get("/projects").expect(200);

    expect(response.body.projects).toHaveLength(2);

    const projectNames = response.body.projects.map(
      (project: { name: string }) => project.name
    );

    expect(projectNames).toContain("Project One");
    expect(projectNames).toContain("Project Two");
  });

  it("requires authentication when listing projects", async () => {
    const response = await request(app).get("/projects").expect(401);

    expect(response.body.message).toBe("Authentication required");
  });

  it("does not list projects where the user is not a member", async () => {
    const userOne = await registerAgent("user-one@example.com", "User One");
    const userTwo = await registerAgent("user-two@example.com", "User Two");

    await userOne.agent
      .post("/projects")
      .send({
        name: "User One Project"
      })
      .expect(201);

    await userTwo.agent
      .post("/projects")
      .send({
        name: "User Two Project"
      })
      .expect(201);

    const response = await userOne.agent.get("/projects").expect(200);

    expect(response.body.projects).toHaveLength(1);
    expect(response.body.projects[0].name).toBe("User One Project");
  });

  it("gets project details for a project member", async () => {
    const owner = await registerAgent("owner@example.com", "Project Owner");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Project Details Test",
        description: "A project detail endpoint test"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    const response = await owner.agent.get(`/projects/${projectId}`).expect(200);

    expect(response.body.project).toMatchObject({
      id: projectId,
      name: "Project Details Test",
      description: "A project detail endpoint test",
      ownerId: owner.user.id,
      isArchived: false,
      currentUserRole: ProjectRole.OWNER
    });

    expect(response.body.project.owner).toMatchObject({
      id: owner.user.id,
      email: "owner@example.com",
      displayName: "Project Owner"
    });

    expect(response.body.project.currentUserMembership).toMatchObject({
      userId: owner.user.id,
      projectId,
      role: ProjectRole.OWNER
    });
  });

  it("requires authentication when getting project details", async () => {
    const owner = await registerAgent("owner@example.com", "Project Owner");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Private Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    const response = await request(app).get(`/projects/${projectId}`).expect(401);

    expect(response.body.message).toBe("Authentication required");
  });

  it("does not allow a user to access a project they do not belong to", async () => {
    const owner = await registerAgent("owner@example.com", "Project Owner");
    const outsider = await registerAgent("outsider@example.com", "Outsider");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Members Only Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    const response = await outsider.agent.get(`/projects/${projectId}`).expect(404);

    expect(response.body.message).toBe("Project not found");
  });

  it("returns the current user's role for non-owner project members", async () => {
    const owner = await registerAgent("owner@example.com", "Project Owner");
    const member = await registerAgent("member@example.com", "Project Member");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Shared Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: member.user.id,
        role: ProjectRole.MEMBER
      }
    });

    const response = await member.agent.get(`/projects/${projectId}`).expect(200);

    expect(response.body.project).toMatchObject({
      id: projectId,
      name: "Shared Project",
      currentUserRole: ProjectRole.MEMBER
    });

    expect(response.body.project.currentUserMembership).toMatchObject({
      userId: member.user.id,
      projectId,
      role: ProjectRole.MEMBER
    });
  });

  it("allows an owner to update a project", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Old Project Name",
        description: "Old description"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    const response = await owner.agent
      .patch(`/projects/${projectId}`)
      .send({
        name: "New Project Name",
        description: "New description"
      })
      .expect(200);

    expect(response.body.project).toMatchObject({
      id: projectId,
      name: "New Project Name",
      description: "New description"
    });
  });

  it("allows an admin to update a project", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const admin = await registerAgent("admin@example.com", "Admin");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Admin Editable Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: admin.user.id,
        role: ProjectRole.ADMIN
      }
    });

    const response = await admin.agent
      .patch(`/projects/${projectId}`)
      .send({
        name: "Updated By Admin"
      })
      .expect(200);

    expect(response.body.project.name).toBe("Updated By Admin");
  });

  it("does not allow a member to update a project", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const member = await registerAgent("member@example.com", "Member");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Member Restricted Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: member.user.id,
        role: ProjectRole.MEMBER
      }
    });

    const response = await member.agent
      .patch(`/projects/${projectId}`)
      .send({
        name: "Illegal Member Update"
      })
      .expect(403);

    expect(response.body.message).toBe(
      "You do not have permission to perform this action"
    );
  });

  it("does not allow a viewer to update a project", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const viewer = await registerAgent("viewer@example.com", "Viewer");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Viewer Restricted Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: viewer.user.id,
        role: ProjectRole.VIEWER
      }
    });

    const response = await viewer.agent
      .patch(`/projects/${projectId}`)
      .send({
        name: "Illegal Viewer Update"
      })
      .expect(403);

    expect(response.body.message).toBe(
      "You do not have permission to perform this action"
    );
  });

  it("does not allow a non-member to update a project", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const outsider = await registerAgent("outsider@example.com", "Outsider");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Private Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    const response = await outsider.agent
      .patch(`/projects/${projectId}`)
      .send({
        name: "Outsider Update"
      })
      .expect(404);

    expect(response.body.message).toBe("Project not found");
  });

  it("validates update project input", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Validation Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    const response = await owner.agent
      .patch(`/projects/${projectId}`)
      .send({
        name: ""
      })
      .expect(400);

    expect(response.body.message).toContain("Project name is required");
  });

  it("requires at least one field when updating a project", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Empty Update Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    const response = await owner.agent
      .patch(`/projects/${projectId}`)
      .send({})
      .expect(400);

    expect(response.body.message).toContain("At least one field must be provided");
  });

  it("allows updating only the project description", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Description Only Project",
        description: "Before"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    const response = await owner.agent
      .patch(`/projects/${projectId}`)
      .send({
        description: "After"
      })
      .expect(200);

    expect(response.body.project).toMatchObject({
      id: projectId,
      name: "Description Only Project",
      description: "After"
    });
  });

  it("allows an owner to archive a project", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Project To Archive"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    const archiveResponse = await owner.agent
      .delete(`/projects/${projectId}`)
      .expect(200);

    expect(archiveResponse.body.project).toMatchObject({
      id: projectId,
      isArchived: true
    });

    const project = await prisma.project.findUniqueOrThrow({
      where: {
        id: projectId
      }
    });

    expect(project.isArchived).toBe(true);
  });

  it("does not allow an admin to archive a project", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");
    const admin = await registerAgent("admin@example.com", "Admin");

    const createResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Admin Cannot Archive Project"
      })
      .expect(201);

    const projectId = createResponse.body.project.id;

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: admin.user.id,
        role: ProjectRole.ADMIN
      }
    });

    const response = await admin.agent.delete(`/projects/${projectId}`).expect(403);

    expect(response.body.message).toBe(
      "You do not have permission to perform this action"
    );

    const project = await prisma.project.findUniqueOrThrow({
      where: {
        id: projectId
      }
    });

    expect(project.isArchived).toBe(false);
  });

  it("hides archived projects from the normal project list", async () => {
    const owner = await registerAgent("owner@example.com", "Owner");

    const activeProjectResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Active Project"
      })
      .expect(201);

    const archivedProjectResponse = await owner.agent
      .post("/projects")
      .send({
        name: "Archived Project"
      })
      .expect(201);

    await owner.agent
      .delete(`/projects/${archivedProjectResponse.body.project.id}`)
      .expect(200);

    const listResponse = await owner.agent.get("/projects").expect(200);

    expect(listResponse.body.projects).toHaveLength(1);
    expect(listResponse.body.projects[0]).toMatchObject({
      id: activeProjectResponse.body.project.id,
      name: "Active Project",
      isArchived: false
    });
  });

  it("lists members for a project member", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const admin = await registerAgent("admin@example.com", "Admin");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Members Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.createMany({
    data: [
      {
        projectId,
        userId: admin.user.id,
        role: ProjectRole.ADMIN
      },
      {
        projectId,
        userId: member.user.id,
        role: ProjectRole.MEMBER
      }
    ]
  });

  const response = await member.agent
    .get(`/projects/${projectId}/members`)
    .expect(200);

  expect(response.body.members).toHaveLength(3);

  const membersByEmail = new Map(
    response.body.members.map(
      (projectMember: {
        role: ProjectRole;
        user: {
          email: string;
          displayName: string;
        };
      }) => [projectMember.user.email, projectMember]
    )
  );

  expect(membersByEmail.get("owner@example.com")).toMatchObject({
    role: ProjectRole.OWNER,
    user: {
      email: "owner@example.com",
      displayName: "Owner"
    }
  });

  expect(membersByEmail.get("admin@example.com")).toMatchObject({
    role: ProjectRole.ADMIN,
    user: {
      email: "admin@example.com",
      displayName: "Admin"
    }
  });

  expect(membersByEmail.get("member@example.com")).toMatchObject({
    role: ProjectRole.MEMBER,
    user: {
      email: "member@example.com",
      displayName: "Member"
    }
  });
});

it("requires authentication when listing project members", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Private Members Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  const response = await request(app)
    .get(`/projects/${projectId}/members`)
    .expect(401);

  expect(response.body.message).toBe("Authentication required");
});

it("does not allow non-members to list project members", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const outsider = await registerAgent("outsider@example.com", "Outsider");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Hidden Members Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  const response = await outsider.agent
    .get(`/projects/${projectId}/members`)
    .expect(404);

  expect(response.body.message).toBe("Project not found");
});

it("does not list members for archived projects", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Archived Members Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await owner.agent.delete(`/projects/${projectId}`).expect(200);

  const response = await owner.agent
    .get(`/projects/${projectId}/members`)
    .expect(404);

  expect(response.body.message).toBe("Project not found");
});
it("allows an owner to add a project member", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const newMember = await registerAgent("new-member@example.com", "New Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Owner Add Member Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

 const response = await owner.agent
  .post(`/projects/${projectId}/members`)
  .send({
    userId: newMember.user.id,
    role: ProjectRole.MEMBER
  })
  .expect(201);

  expect(response.body.member).toMatchObject({
    projectId,
    userId: newMember.user.id,
    role: ProjectRole.MEMBER,
    user: {
      id: newMember.user.id,
      email: "new-member@example.com",
      displayName: "New Member"
    }
  });

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: newMember.user.id
      }
    }
  });

  expect(membership?.role).toBe(ProjectRole.MEMBER);
});

it("allows an admin to add a project member", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const admin = await registerAgent("admin@example.com", "Admin");
  const newMember = await registerAgent("new-member@example.com", "New Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Admin Add Member Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: admin.user.id,
      role: ProjectRole.ADMIN
    }
  });

  const response = await admin.agent
    .post(`/projects/${projectId}/members`)
    .send({
      userId: newMember.user.id,
      role: ProjectRole.VIEWER
    })
    .expect(201);

  expect(response.body.member).toMatchObject({
    projectId,
    userId: newMember.user.id,
    role: ProjectRole.VIEWER
  });
});

it("does not allow a member to add project members", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");
  const targetUser = await registerAgent("target@example.com", "Target");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Member Restricted Add Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: member.user.id,
      role: ProjectRole.MEMBER
    }
  });

  const response = await member.agent
    .post(`/projects/${projectId}/members`)
    .send({
      userId: targetUser.user.id,
      role: ProjectRole.MEMBER
    })
    .expect(403);

  expect(response.body.message).toBe(
    "You do not have permission to perform this action"
  );
});

it("does not allow a viewer to add project members", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const viewer = await registerAgent("viewer@example.com", "Viewer");
  const targetUser = await registerAgent("target@example.com", "Target");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Viewer Restricted Add Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: viewer.user.id,
      role: ProjectRole.VIEWER
    }
  });

  const response = await viewer.agent
    .post(`/projects/${projectId}/members`)
    .send({
      userId: targetUser.user.id,
      role: ProjectRole.MEMBER
    })
    .expect(403);

  expect(response.body.message).toBe(
    "You do not have permission to perform this action"
  );
});

it("does not allow non-members to add project members", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const outsider = await registerAgent("outsider@example.com", "Outsider");
  const targetUser = await registerAgent("target@example.com", "Target");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Hidden Add Member Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  const response = await outsider.agent
    .post(`/projects/${projectId}/members`)
    .send({
      userId: targetUser.user.id,
      role: ProjectRole.MEMBER
    })
    .expect(404);

  expect(response.body.message).toBe("Project not found");
});

it("does not allow adding the same user twice", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Duplicate Add Member Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await owner.agent
    .post(`/projects/${projectId}/members`)
    .send({
      userId: member.user.id,
      role: ProjectRole.MEMBER
    })
    .expect(201);

  const response = await owner.agent
    .post(`/projects/${projectId}/members`)
    .send({
      userId: member.user.id,
      role: ProjectRole.ADMIN
    })
    .expect(409);

  expect(response.body.message).toBe("User is already a project member");
});

it("validates role when adding a project member", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Role Validation Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  const response = await owner.agent
    .post(`/projects/${projectId}/members`)
    .send({
      userId: member.user.id,
      role: "OWNER"
    })
    .expect(400);

  expect(response.body.message).toContain("role");
});

it("creates an activity event when a project member is added", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Activity Add Member Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await owner.agent
    .post(`/projects/${projectId}/members`)
    .send({
      userId: member.user.id,
      role: ProjectRole.MEMBER
    })
    .expect(201);

  const activityEvent = await prisma.activityEvent.findFirst({
    where: {
      projectId,
      actorId: owner.user.id,
      targetUserId: member.user.id,
      type: ActivityEventType.PROJECT_MEMBER_ADDED
    }
  });

  expect(activityEvent).not.toBeNull();
  expect(activityEvent?.metadata).toMatchObject({
    role: ProjectRole.MEMBER
  });
});
it("allows an owner to update a project member role", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Owner Role Update Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: member.user.id,
      role: ProjectRole.MEMBER
    }
  });

  const response = await owner.agent
    .patch(`/projects/${projectId}/members/${member.user.id}`)
    .send({
      role: ProjectRole.ADMIN
    })
    .expect(200);

  expect(response.body.member).toMatchObject({
    projectId,
    userId: member.user.id,
    role: ProjectRole.ADMIN,
    user: {
      id: member.user.id,
      email: "member@example.com",
      displayName: "Member"
    }
  });
});

it("allows an admin to update a non-owner project member role", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const admin = await registerAgent("admin@example.com", "Admin");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Admin Role Update Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.createMany({
    data: [
      {
        projectId,
        userId: admin.user.id,
        role: ProjectRole.ADMIN
      },
      {
        projectId,
        userId: member.user.id,
        role: ProjectRole.MEMBER
      }
    ]
  });

  const response = await admin.agent
    .patch(`/projects/${projectId}/members/${member.user.id}`)
    .send({
      role: ProjectRole.VIEWER
    })
    .expect(200);

  expect(response.body.member).toMatchObject({
    userId: member.user.id,
    role: ProjectRole.VIEWER
  });
});

it("does not allow a member to update project member roles", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");
  const target = await registerAgent("target@example.com", "Target");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Member Role Restricted Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.createMany({
    data: [
      {
        projectId,
        userId: member.user.id,
        role: ProjectRole.MEMBER
      },
      {
        projectId,
        userId: target.user.id,
        role: ProjectRole.VIEWER
      }
    ]
  });

  const response = await member.agent
    .patch(`/projects/${projectId}/members/${target.user.id}`)
    .send({
      role: ProjectRole.ADMIN
    })
    .expect(403);

  expect(response.body.message).toBe(
    "You do not have permission to perform this action"
  );
});

it("does not allow a viewer to update project member roles", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const viewer = await registerAgent("viewer@example.com", "Viewer");
  const target = await registerAgent("target@example.com", "Target");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Viewer Role Restricted Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.createMany({
    data: [
      {
        projectId,
        userId: viewer.user.id,
        role: ProjectRole.VIEWER
      },
      {
        projectId,
        userId: target.user.id,
        role: ProjectRole.MEMBER
      }
    ]
  });

  const response = await viewer.agent
    .patch(`/projects/${projectId}/members/${target.user.id}`)
    .send({
      role: ProjectRole.ADMIN
    })
    .expect(403);

  expect(response.body.message).toBe(
    "You do not have permission to perform this action"
  );
});

it("does not allow an admin to demote an owner", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const admin = await registerAgent("admin@example.com", "Admin");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Admin Cannot Demote Owner Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: admin.user.id,
      role: ProjectRole.ADMIN
    }
  });

  const response = await admin.agent
    .patch(`/projects/${projectId}/members/${owner.user.id}`)
    .send({
      role: ProjectRole.MEMBER
    })
    .expect(403);

  expect(response.body.message).toBe("Admins cannot change an owner's role");
});

it("does not allow demoting the last owner", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Last Owner Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  const response = await owner.agent
    .patch(`/projects/${projectId}/members/${owner.user.id}`)
    .send({
      role: ProjectRole.ADMIN
    })
    .expect(400);

  expect(response.body.message).toBe("Project must have at least one owner");
});

it("allows demoting an owner when another owner remains", async () => {
  const ownerOne = await registerAgent("owner-one@example.com", "Owner One");
  const ownerTwo = await registerAgent("owner-two@example.com", "Owner Two");

  const createResponse = await ownerOne.agent
    .post("/projects")
    .send({
      name: "Multiple Owner Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: ownerTwo.user.id,
      role: ProjectRole.OWNER
    }
  });

  const response = await ownerOne.agent
    .patch(`/projects/${projectId}/members/${ownerTwo.user.id}`)
    .send({
      role: ProjectRole.ADMIN
    })
    .expect(200);

  expect(response.body.member).toMatchObject({
    userId: ownerTwo.user.id,
    role: ProjectRole.ADMIN
  });
});

it("validates updated project member role", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Role Validation Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: member.user.id,
      role: ProjectRole.MEMBER
    }
  });

  const response = await owner.agent
    .patch(`/projects/${projectId}/members/${member.user.id}`)
    .send({
      role: "INVALID_ROLE"
    })
    .expect(400);

  expect(response.body.message).toContain("role");
});

it("creates an activity event when a project member role changes", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Role Change Activity Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: member.user.id,
      role: ProjectRole.MEMBER
    }
  });

  await owner.agent
    .patch(`/projects/${projectId}/members/${member.user.id}`)
    .send({
      role: ProjectRole.ADMIN
    })
    .expect(200);

  const activityEvent = await prisma.activityEvent.findFirst({
    where: {
      projectId,
      actorId: owner.user.id,
      targetUserId: member.user.id,
      type: ActivityEventType.PROJECT_MEMBER_ROLE_CHANGED
    }
  });

  expect(activityEvent).not.toBeNull();
  expect(activityEvent?.oldValue).toBe(ProjectRole.MEMBER);
  expect(activityEvent?.newValue).toBe(ProjectRole.ADMIN);
  expect(activityEvent?.metadata).toMatchObject({
    oldRole: ProjectRole.MEMBER,
    newRole: ProjectRole.ADMIN
  });
});
it("allows an owner to remove a project member", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Owner Remove Member Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: member.user.id,
      role: ProjectRole.MEMBER
    }
  });

  const response = await owner.agent
    .delete(`/projects/${projectId}/members/${member.user.id}`)
    .expect(200);

  expect(response.body.member).toMatchObject({
    projectId,
    userId: member.user.id,
    role: ProjectRole.MEMBER,
    user: {
      id: member.user.id,
      email: "member@example.com",
      displayName: "Member"
    }
  });

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: member.user.id
      }
    }
  });

  expect(membership).toBeNull();
});

it("allows an admin to remove a non-owner project member", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const admin = await registerAgent("admin@example.com", "Admin");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Admin Remove Member Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.createMany({
    data: [
      {
        projectId,
        userId: admin.user.id,
        role: ProjectRole.ADMIN
      },
      {
        projectId,
        userId: member.user.id,
        role: ProjectRole.MEMBER
      }
    ]
  });

  await admin.agent
    .delete(`/projects/${projectId}/members/${member.user.id}`)
    .expect(200);

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: member.user.id
      }
    }
  });

  expect(membership).toBeNull();
});

it("does not allow a member to remove project members", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");
  const target = await registerAgent("target@example.com", "Target");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Member Cannot Remove Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.createMany({
    data: [
      {
        projectId,
        userId: member.user.id,
        role: ProjectRole.MEMBER
      },
      {
        projectId,
        userId: target.user.id,
        role: ProjectRole.VIEWER
      }
    ]
  });

  const response = await member.agent
    .delete(`/projects/${projectId}/members/${target.user.id}`)
    .expect(403);

  expect(response.body.message).toBe(
    "You do not have permission to perform this action"
  );
});

it("does not allow a viewer to remove project members", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const viewer = await registerAgent("viewer@example.com", "Viewer");
  const target = await registerAgent("target@example.com", "Target");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Viewer Cannot Remove Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.createMany({
    data: [
      {
        projectId,
        userId: viewer.user.id,
        role: ProjectRole.VIEWER
      },
      {
        projectId,
        userId: target.user.id,
        role: ProjectRole.MEMBER
      }
    ]
  });

  const response = await viewer.agent
    .delete(`/projects/${projectId}/members/${target.user.id}`)
    .expect(403);

  expect(response.body.message).toBe(
    "You do not have permission to perform this action"
  );
});

it("does not allow an admin to remove an owner", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const admin = await registerAgent("admin@example.com", "Admin");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Admin Cannot Remove Owner Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: admin.user.id,
      role: ProjectRole.ADMIN
    }
  });

  const response = await admin.agent
    .delete(`/projects/${projectId}/members/${owner.user.id}`)
    .expect(403);

  expect(response.body.message).toBe("Admins cannot remove an owner");
});

it("does not allow removing the last owner", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Last Owner Remove Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  const response = await owner.agent
    .delete(`/projects/${projectId}/members/${owner.user.id}`)
    .expect(400);

  expect(response.body.message).toBe("Project must have at least one owner");

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: owner.user.id
      }
    }
  });

  expect(membership).not.toBeNull();
});

it("allows removing an owner when another owner remains", async () => {
  const ownerOne = await registerAgent("owner-one@example.com", "Owner One");
  const ownerTwo = await registerAgent("owner-two@example.com", "Owner Two");

  const createResponse = await ownerOne.agent
    .post("/projects")
    .send({
      name: "Multiple Owner Remove Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: ownerTwo.user.id,
      role: ProjectRole.OWNER
    }
  });

  await ownerOne.agent
    .delete(`/projects/${projectId}/members/${ownerTwo.user.id}`)
    .expect(200);

  const ownerTwoMembership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: ownerTwo.user.id
      }
    }
  });

  expect(ownerTwoMembership).toBeNull();

  const ownerCount = await prisma.projectMember.count({
    where: {
      projectId,
      role: ProjectRole.OWNER
    }
  });

  expect(ownerCount).toBe(1);
});

it("does not allow non-members to remove project members", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const outsider = await registerAgent("outsider@example.com", "Outsider");
  const target = await registerAgent("target@example.com", "Target");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Hidden Remove Member Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: target.user.id,
      role: ProjectRole.MEMBER
    }
  });

  const response = await outsider.agent
    .delete(`/projects/${projectId}/members/${target.user.id}`)
    .expect(404);

  expect(response.body.message).toBe("Project not found");
});

it("creates an activity event when a project member is removed", async () => {
  const owner = await registerAgent("owner@example.com", "Owner");
  const member = await registerAgent("member@example.com", "Member");

  const createResponse = await owner.agent
    .post("/projects")
    .send({
      name: "Remove Member Activity Project"
    })
    .expect(201);

  const projectId = createResponse.body.project.id;

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: member.user.id,
      role: ProjectRole.MEMBER
    }
  });

  await owner.agent
    .delete(`/projects/${projectId}/members/${member.user.id}`)
    .expect(200);

  const activityEvent = await prisma.activityEvent.findFirst({
    where: {
      projectId,
      actorId: owner.user.id,
      targetUserId: member.user.id,
      type: ActivityEventType.PROJECT_MEMBER_REMOVED
    }
  });

  expect(activityEvent).not.toBeNull();
  expect(activityEvent?.oldValue).toBe(ProjectRole.MEMBER);
  expect(activityEvent?.metadata).toMatchObject({
    removedRole: ProjectRole.MEMBER
  });
});
});