import type { CalibrationCertificate } from "../models/CalibrationCertificate";

export const createCalibrationCertificateDto = (overrides: Partial<CalibrationCertificate> = {}): Omit<CalibrationCertificate, "id"> => ({
  device_id: 0,
  plan_id: null,
  certificate_no: "",
  result_status: "PASS",
  valid_until: "",
  file_path: "",
  issued_by: "",
  ...overrides
});
