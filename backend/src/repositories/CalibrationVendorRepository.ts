import { seed } from "../seed";
import type { CalibrationVendor } from "../models/CalibrationVendor";

const rows: CalibrationVendor[] = seed.calibrationVendor.map((row) => ({ ...row }));
let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

const reseed = (): void => {
  rows.length = 0;
  rows.push(...seed.calibrationVendor.map((row) => ({ ...row })));
  nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
};

export const calibrationVendorRepository = {
  findAll: (): CalibrationVendor[] => rows,
  findById: (id: number): CalibrationVendor | undefined => rows.find((row) => row.id === id),
  insert: (row: Omit<CalibrationVendor, "id">): CalibrationVendor => {
    const saved: CalibrationVendor = { ...row, id: nextId++ };
    rows.push(saved);
    return saved;
  },
  reset: reseed
};
