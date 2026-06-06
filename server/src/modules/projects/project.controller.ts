import type { RequestHandler } from "express";
import { HttpError } from "../../lib/httpError.js";
import { createProject, listProjectsForUser } from "./project.service.js";
import type { CreateProjectInput } from "./project.schemas.js";

export const createProjectController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const project = await createProject({
      input: req.body as CreateProjectInput,
      userId: req.user.id
    });

    res.status(201).json({
      project
    });
  } catch (error) {
    next(error);
  }
};

export const listProjectsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const projects = await listProjectsForUser({
      userId: req.user.id
    });

    res.status(200).json({
      projects
    });
  } catch (error) {
    next(error);
  }
};