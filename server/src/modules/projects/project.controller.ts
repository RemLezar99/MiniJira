import type { RequestHandler } from "express";
import { HttpError } from "../../lib/httpError.js";
import {
  createProject,
  getProjectForUser,
  listProjectsForUser,
  updateProject
} from "./project.service.js";
import type {
  CreateProjectInput,
  ProjectParams,
  UpdateProjectInput
} from "./project.schemas.js";

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

export const getProjectController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const { projectId } = req.params as ProjectParams;

    const project = await getProjectForUser({
      projectId,
      userId: req.user.id
    });

    res.status(200).json({
      project
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const { projectId } = req.params as ProjectParams;

    const project = await updateProject({
      projectId,
      userId: req.user.id,
      input: req.body as UpdateProjectInput
    });

    res.status(200).json({
      project
    });
  } catch (error) {
    next(error);
  }
};