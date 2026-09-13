import { seed } from "../seed";
import type { CalibrationCertificate } from "../models/CalibrationCertificate";

const rows: CalibrationCertificate[] = seed.calibrationCertificate.map((row) => ({ ...row }));
let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

const reseed = (): void => {
  rows.length = 0;
  rows.push(...seed.calibrationCertificate.map((row) => ({ ...row })));
  nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
};

export const calibrationCertificateRepository = {
  findAll: (): CalibrationCertificate[] => rows,
  findById: (id: number): CalibrationCertificate | undefined => rows.find((row) => row.id === id),
  findByDeviceId: (deviceId: number): CalibrationCertificate[] => rows.filter((row) => row.device_id === deviceId),
  findByCertificateNo: (certificateNo: string): CalibrationCertificate | undefined => rows.find((row) => row.certificate_no === certificateNo),
  insert: (row: Omit<CalibrationCertificate, "id">): CalibrationCertificate => {
    const saved: CalibrationCertificate = { ...row, id: nextId++ };
    rows.push(saved);
    return saved;
  },
  reset: reseed
};
