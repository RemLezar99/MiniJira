import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const PASSWORD_SALT_ROUNDS = 12;

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (existingUser) {
    throw new HttpError(409, "A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      displayName: input.displayName,
      passwordHash
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true
    }
  });

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new HttpError(401, "Invalid email or password");
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName
  };
}