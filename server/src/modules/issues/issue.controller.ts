import type { RequestHandler } from "express";
import { HttpError } from "../../lib/httpError.js";
import type { ProjectParams } from "../projects/project.schemas.js";
import type { CreateIssueInput } from "../issues/issue.schema.js";
import { createIssue } from "./issue.service.js";

export const createIssueController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const { projectId } = req.params as ProjectParams;

    const issue = await createIssue({
      projectId,
      userId: req.user.id,
      input: req.body as CreateIssueInput
    });

    res.status(201).json({
      issue
    });
  } catch (error) {
    next(error);
  }
};