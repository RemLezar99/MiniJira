import jwt from "jsonwebtoken";
import { env } from "./env.js";

export type AuthTokenPayload = {
  userId: string;
};

const TOKEN_EXPIRES_IN = "7d";

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}