import type { Request, Response, NextFunction } from "express";
import { overdueAlertService } from "../services/OverdueAlertService";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { httpError } from "../utils/httpError";

const actorOf = (req: Request): string => `user#${(req as any).user?.id ?? "anonymous"}`;

export const overdueAlertController = {
  list: (req: Request, res: Response) => res.json(overdueAlertService.list({
    status: req.query.status as string | undefined,
    device_id: req.query.device_id ? Number(req.query.device_id) : undefined,
    alert_level: req.query.alert_level as string | undefined
  })),

  overdue: (_req: Request, res: Response) => res.json(overdueAlertService.overdue()),

  close: (req: Request, res: Response, next: NextFunction) => {
    try {
      const alertId = Number(req.params.id);
      if (!Number.isInteger(alertId)) {
        throw httpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
      }
      res.json(overdueAlertService.close(alertId, actorOf(req)));
    } catch (err) {
      next(err);
    }
  }
};
