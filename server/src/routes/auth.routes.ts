import { Router } from "express";
import { validateRequest } from "../middleware/validateRequest.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { loginSchema, registerSchema } from "../modules/auth/auth.schemas.js";
import { login, logout, me, register } from "../modules/auth/auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/register", validateRequest({ body: registerSchema }), register);
authRoutes.post("/login", validateRequest({ body: loginSchema }), login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", requireAuth, me);