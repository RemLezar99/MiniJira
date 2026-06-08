import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { z } from "zod";
import { HttpError } from "../lib/httpError.js";

type RequestSchemas = {
  body?: z.ZodType;
  params?: z.ZodType<ParamsDictionary>;
  query?: z.ZodType;
};

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(", ");
}

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.query) {
        schemas.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, formatZodError(error)));
        return;
      }

      next(error);
    }
  };
}