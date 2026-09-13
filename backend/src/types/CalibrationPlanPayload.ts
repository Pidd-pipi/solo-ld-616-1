export interface CalibrationPlanPayload {
  device_id?: number;
  planned_date?: string;
  plan_type?: string;
  priority?: string;
  created_by?: string;
}

export interface AssignCalibrationPlanPayload {
  vendor_id?: number;
}
