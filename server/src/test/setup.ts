import { beforeEach, afterAll } from "vitest";
import { prisma } from "../lib/prisma.js";

beforeEach(async () => {
  await prisma.activityEvent.deleteMany();
  await prisma.issueLabel.deleteMany();
  await prisma.label.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});