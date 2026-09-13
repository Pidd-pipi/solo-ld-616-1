import type { Request, Response, NextFunction } from "express";
import { measuringDeviceService } from "../services/MeasuringDeviceService";

const actorOf = (req: Request): string => `user#${(req as any).user?.id ?? "anonymous"}`;

export const measuringDeviceController = {
  list: (_req: Request, res: Response) => res.json(measuringDeviceService.list()),

  create: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(measuringDeviceService.create(req.body, actorOf(req)));
    } catch (err) {
      next(err);
    }
  }
};
