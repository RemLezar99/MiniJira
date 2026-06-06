import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createProjectController,
  listProjectsController
} from "./project.controller.js";
import { createProjectSchema } from "./project.schemas.js";

export const projectRoutes = Router();

projectRoutes.get("/", requireAuth, listProjectsController);

projectRoutes.post(
  "/",
  requireAuth,
  validateRequest({ body: createProjectSchema }),
  createProjectController
);