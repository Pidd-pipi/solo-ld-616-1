import { seed } from "../seed";
import type { MeasuringDevice } from "../models/MeasuringDevice";
import type { DeviceCalibrationStatus } from "../constants/DeviceCalibrationStatus";

const rows: MeasuringDevice[] = seed.measuringDevice.map((row) => ({ ...row }));
let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

const reseed = (): void => {
  rows.length = 0;
  rows.push(...seed.measuringDevice.map((row) => ({ ...row })));
  nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
};

export const measuringDeviceRepository = {
  findAll: (): MeasuringDevice[] => rows,
  findById: (id: number): MeasuringDevice | undefined => rows.find((row) => row.id === id),
  insert: (row: Omit<MeasuringDevice, "id">): MeasuringDevice => {
    const saved: MeasuringDevice = { ...row, id: nextId++ };
    rows.push(saved);
    return saved;
  },
  updateStatus: (id: number, status: DeviceCalibrationStatus): MeasuringDevice | undefined => {
    const row = rows.find((item) => item.id === id);
    if (!row) return undefined;
    row.status = status;
    return row;
  },
  reset: reseed
};
