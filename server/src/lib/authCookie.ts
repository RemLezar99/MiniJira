import type { Response } from "express";
import { env } from "./env.js";

export const AUTH_COOKIE_NAME = "mini_jira_token";

const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sevenDaysInMs,
    path: "/"
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}