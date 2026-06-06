import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController
} from "./project.controller.js";
import {
  createProjectSchema,
  projectParamsSchema,
  updateProjectSchema
} from "./project.schemas.js";

export const projectRoutes = Router();

projectRoutes.get("/", requireAuth, listProjectsController);

projectRoutes.post(
  "/",
  requireAuth,
  validateRequest({ body: createProjectSchema }),
  createProjectController
);

projectRoutes.get(
  "/:projectId",
  requireAuth,
  validateRequest({ params: projectParamsSchema }),
  getProjectController
);

projectRoutes.patch(
  "/:projectId",
  requireAuth,
  validateRequest({
    params: projectParamsSchema,
    body: updateProjectSchema
  }),
  updateProjectController
);