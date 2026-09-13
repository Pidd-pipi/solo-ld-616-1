import { Router } from "express";
import { calibrationPlanController } from "../controllers/CalibrationPlanController";

const router = Router();
router.get("/", calibrationPlanController.list);
router.post("/", calibrationPlanController.create);
router.post("/:id/assign", calibrationPlanController.assign);
export default router;
