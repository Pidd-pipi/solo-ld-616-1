import { Router } from "express";
import { overdueAlertController } from "../controllers/OverdueAlertController";

const router = Router();
router.get("/", overdueAlertController.list);
router.get("/overdue", overdueAlertController.overdue);
router.post("/:id/close", overdueAlertController.close);
export default router;
