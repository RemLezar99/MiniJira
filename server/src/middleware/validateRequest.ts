import type { RequestHandler } from "express";
import { z, ZodError } from "zod";
import { HttpError } from "../lib/httpError.js";
import type { ParamsDictionary } from "express-serve-static-core";

type RequestSchemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as ParamsDictionary;
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new HttpError(
            400,
            error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join("; ")
          )
        );
        return;
      }

      next(error);
    }
  };
}