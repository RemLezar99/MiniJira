import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { AUTH_COOKIE_NAME } from "../lib/authCookie.js";
import { verifyAuthToken } from "../lib/jwt.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      throw new HttpError(401, "Authentication required");
    }

    const payload = verifyAuthToken(token);

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });

    if (!user) {
      throw new HttpError(401, "Invalid authentication token");
    }

    req.user = user;
    next();
  } catch (error) {
    next(new HttpError(401, "Authentication required"));
  }
};