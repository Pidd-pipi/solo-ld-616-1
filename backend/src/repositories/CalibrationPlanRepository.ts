import { seed } from "../seed";
import type { CalibrationPlan } from "../models/CalibrationPlan";
import type { PlanStatus } from "../constants/PlanStatus";

const rows: CalibrationPlan[] = seed.calibrationPlan.map((row) => ({ ...row }));
let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

const reseed = (): void => {
  rows.length = 0;
  rows.push(...seed.calibrationPlan.map((row) => ({ ...row })));
  nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
};

export const calibrationPlanRepository = {
  findAll: (): CalibrationPlan[] => rows,
  findById: (id: number): CalibrationPlan | undefined => rows.find((row) => row.id === id),
  findByDeviceId: (deviceId: number): CalibrationPlan[] => rows.filter((row) => row.device_id === deviceId),
  insert: (row: Omit<CalibrationPlan, "id">): CalibrationPlan => {
    const saved: CalibrationPlan = { ...row, id: nextId++ };
    rows.push(saved);
    return saved;
  },
  update: (id: number, patch: Partial<Pick<CalibrationPlan, "status" | "assigned_vendor_id" | "planned_date">>): CalibrationPlan | undefined => {
    const row = rows.find((item) => item.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    return row;
  },
  updateStatus: (id: number, status: PlanStatus): CalibrationPlan | undefined => {
    const row = rows.find((item) => item.id === id);
    if (!row) return undefined;
    row.status = status;
    return row;
  },
  reset: reseed
};
