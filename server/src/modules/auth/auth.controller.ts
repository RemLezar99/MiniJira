import type { RequestHandler } from "express";
import { clearAuthCookie, setAuthCookie } from "../../lib/authCookie.js";
import { signAuthToken } from "../../lib/jwt.js";
import { registerUser, loginUser } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await registerUser(req.body as RegisterInput);

    const token = signAuthToken({
      userId: user.id
    });

    setAuthCookie(res, token);

    res.status(201).json({
      user
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const user = await loginUser(req.body as LoginInput);

    const token = signAuthToken({
      userId: user.id
    });

    setAuthCookie(res, token);

    res.status(200).json({
      user
    });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (_req, res) => {
  clearAuthCookie(res);

  res.status(200).json({
    message: "Logged out"
  });
};

export const me: RequestHandler = (req, res) => {
  res.status(200).json({
    user: req.user
  });
};