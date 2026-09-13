import type { CalibrationVendor } from "../models/CalibrationVendor";

export const createCalibrationVendorDto = (overrides: Partial<CalibrationVendor> = {}): Omit<CalibrationVendor, "id"> => ({
  vendor_name: "",
  qualification_no: "",
  contact_phone: "",
  service_scope: "",
  vendor_status: "ACTIVE",
  ...overrides
});
