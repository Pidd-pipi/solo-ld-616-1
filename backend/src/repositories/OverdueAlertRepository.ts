import { seed } from "../seed";
import type { OverdueAlert } from "../models/OverdueAlert";
import type { AlertStatus } from "../constants/AlertStatus";

const rows: OverdueAlert[] = seed.overdueAlert.map((row) => ({ ...row }));
let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

const reseed = (): void => {
  rows.length = 0;
  rows.push(...seed.overdueAlert.map((row) => ({ ...row })));
  nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
};

export const overdueAlertRepository = {
  findAll: (): OverdueAlert[] => rows,
  findById: (id: number): OverdueAlert | undefined => rows.find((row) => row.id === id),
  findByDeviceId: (deviceId: number): OverdueAlert[] => rows.filter((row) => row.device_id === deviceId),
  findOpenByDeviceId: (deviceId: number): OverdueAlert[] => rows.filter((row) => row.device_id === deviceId && row.status === "OPEN"),
  insert: (row: Omit<OverdueAlert, "id">): OverdueAlert => {
    const saved: OverdueAlert = { ...row, id: nextId++ };
    rows.push(saved);
    return saved;
  },
  update: (id: number, patch: Partial<Pick<OverdueAlert, "status" | "handled_by" | "handled_at">>): OverdueAlert | undefined => {
    const row = rows.find((item) => item.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    return row;
  },
  updateStatus: (id: number, status: AlertStatus): OverdueAlert | undefined => {
    const row = rows.find((item) => item.id === id);
    if (!row) return undefined;
    row.status = status;
    return row;
  },
  reset: reseed
};
