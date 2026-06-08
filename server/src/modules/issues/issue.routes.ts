import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { projectParamsSchema } from "../projects/project.schemas.js";
import {
  createIssueController,
  listIssuesController
} from "./issue.controller.js"
import {
  createIssueSchema,
  listIssuesQuerySchema
} from "../issues/issue.schema.js";

export const issueRoutes = Router({
  mergeParams: true
});

issueRoutes.get(
  "/",
  requireAuth,
  validateRequest({
    params: projectParamsSchema,
    query: listIssuesQuerySchema
  }),
  listIssuesController
);

issueRoutes.post(
  "/",
  requireAuth,
  validateRequest({
    params: projectParamsSchema,
    body: createIssueSchema
  }),
  createIssueController
);