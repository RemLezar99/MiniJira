import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";

describe("auth routes", () => {
  it("registers a user and sets an auth cookie", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User"
      })
      .expect(201);

    expect(response.body.user).toMatchObject({
      email: "test@example.com",
      displayName: "Test User"
    });

    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.headers["set-cookie"]).toBeDefined();

    const user = await prisma.user.findUnique({
      where: {
        email: "test@example.com"
      }
    });

    expect(user).not.toBeNull();
    expect(user?.passwordHash).not.toBe("password123");
  });

  it("does not allow duplicate registration", async () => {
    await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User"
      })
      .expect(201);

    const response = await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
        displayName: "Duplicate User"
      })
      .expect(409);

    expect(response.body.message).toBe("A user with this email already exists");
  });

  it("logs in a registered user and sets an auth cookie", async () => {
    await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User"
      })
      .expect(201);

    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "password123"
      })
      .expect(200);

    expect(response.body.user).toMatchObject({
      email: "test@example.com",
      displayName: "Test User"
    });

    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("rejects login with an invalid password", async () => {
    await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User"
      })
      .expect(201);

    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "wrong-password"
      })
      .expect(401);

    expect(response.body.message).toBe("Invalid email or password");
  });

  it("returns the current user from /auth/me when authenticated", async () => {
    const agent = request.agent(app);

    await agent
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User"
      })
      .expect(201);

    const response = await agent.get("/auth/me").expect(200);

    expect(response.body.user).toMatchObject({
      email: "test@example.com",
      displayName: "Test User"
    });
  });

  it("rejects /auth/me when unauthenticated", async () => {
    const response = await request(app).get("/auth/me").expect(401);

    expect(response.body.message).toBe("Authentication required");
  });

  it("logs out the current user", async () => {
    const agent = request.agent(app);

    await agent
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User"
      })
      .expect(201);

    await agent.post("/auth/logout").expect(200);

    const response = await agent.get("/auth/me").expect(401);

    expect(response.body.message).toBe("Authentication required");
  });

  it("validates registration input", async () => {
  const response = await request(app)
    .post("/auth/register")
    .send({
      email: "not-an-email",
      password: "short",
      displayName: ""
    })
    .expect(400);

  expect(response.body.message).toContain("Invalid email address");
  expect(response.body.message).toContain("Password must be at least 8 characters");
  expect(response.body.message).toContain("Display name is required");
});
});