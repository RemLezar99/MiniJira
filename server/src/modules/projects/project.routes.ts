import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  addProjectMemberController,
  archiveProjectController,
  createProjectController,
  getProjectController,
  listProjectMembersController,
  listProjectsController,
  removeProjectMemberController,
  updateProjectController,
  updateProjectMemberRoleController
} from "./project.controller.js";
import {
  addProjectMemberSchema,
  createProjectSchema,
  projectMemberParamsSchema,
  projectParamsSchema,
  updateProjectMemberRoleSchema,
  updateProjectSchema
} from "./project.schemas.js";
import { issueRoutes } from "../issues/issue.routes.js";

export const projectRoutes = Router();

projectRoutes.get("/", requireAuth, listProjectsController);

projectRoutes.post(
  "/",
  requireAuth,
  validateRequest({ body: createProjectSchema }),
  createProjectController
);

projectRoutes.use("/:projectId/issues", issueRoutes);

projectRoutes.get(
  "/:projectId/members",
  requireAuth,
  validateRequest({ params: projectParamsSchema }),
  listProjectMembersController
);

projectRoutes.post(
  "/:projectId/members",
  requireAuth,
  validateRequest({
    params: projectParamsSchema,
    body: addProjectMemberSchema
  }),
  addProjectMemberController
);

projectRoutes.patch(
  "/:projectId/members/:userId",
  requireAuth,
  validateRequest({
    params: projectMemberParamsSchema,
    body: updateProjectMemberRoleSchema
  }),
  updateProjectMemberRoleController
);

projectRoutes.delete(
  "/:projectId/members/:userId",
  requireAuth,
  validateRequest({
    params: projectMemberParamsSchema
  }),
  removeProjectMemberController
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

projectRoutes.delete(
  "/:projectId",
  requireAuth,
  validateRequest({ params: projectParamsSchema }),
  archiveProjectController
);

