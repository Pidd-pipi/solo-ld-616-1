import type { Request, Response, NextFunction } from "express";
import { calibrationPlanService } from "../services/CalibrationPlanService";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { httpError } from "../utils/httpError";

const actorOf = (req: Request): string => `user#${(req as any).user?.id ?? "anonymous"}`;

export const calibrationPlanController = {
  list: (_req: Request, res: Response) => res.json(calibrationPlanService.list()),

  create: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(calibrationPlanService.create(req.body, actorOf(req)));
    } catch (err) {
      next(err);
    }
  },

  assign: (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = Number(req.params.id);
      if (!Number.isInteger(planId)) {
        throw httpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
      }
      res.json(calibrationPlanService.assign(planId, req.body, actorOf(req)));
    } catch (err) {
      next(err);
    }
  }
};
