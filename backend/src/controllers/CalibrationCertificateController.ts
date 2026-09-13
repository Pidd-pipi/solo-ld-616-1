import type { Request, Response, NextFunction } from "express";
import { calibrationCertificateService } from "../services/CalibrationCertificateService";

const actorOf = (req: Request): string => `user#${(req as any).user?.id ?? "anonymous"}`;

export const calibrationCertificateController = {
  list: (_req: Request, res: Response) => res.json(calibrationCertificateService.list()),

  create: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(calibrationCertificateService.register(req.body, actorOf(req)));
    } catch (err) {
      next(err);
    }
  }
};
