import type { MeasuringDevice } from "../models/MeasuringDevice";

export const createMeasuringDeviceDto = (overrides: Partial<MeasuringDevice> = {}): Omit<MeasuringDevice, "id"> => ({
  device_code: "",
  name: "",
  device_type: "",
  accuracy_level: "",
  owner_dept: "",
  calibration_cycle_days: 365,
  status: "VALID",
  ...overrides
});
