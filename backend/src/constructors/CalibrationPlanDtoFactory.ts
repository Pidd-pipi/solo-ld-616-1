import type { CalibrationPlan } from "../models/CalibrationPlan";

export const createCalibrationPlanDto = (overrides: Partial<CalibrationPlan> = {}): Omit<CalibrationPlan, "id"> => ({
  device_id: 0,
  planned_date: new Date().toISOString(),
  plan_type: "PERIODIC",
  priority: "MEDIUM",
  status: "PLANNED",
  assigned_vendor_id: null,
  created_by: "system",
  ...overrides
});
