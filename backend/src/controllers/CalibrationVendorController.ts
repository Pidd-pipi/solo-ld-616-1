import type { Request, Response, NextFunction } from "express";
import { calibrationVendorService } from "../services/CalibrationVendorService";

const actorOf = (req: Request): string => `user#${(req as any).user?.id ?? "anonymous"}`;

export const calibrationVendorController = {
  list: (_req: Request, res: Response) => res.json(calibrationVendorService.list()),

  create: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(calibrationVendorService.create(req.body, actorOf(req)));
    } catch (err) {
      next(err);
    }
  }
};
