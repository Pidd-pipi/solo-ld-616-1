export const LOG_TEMPLATES = {
  MeasuringDevice: ["MeasuringDevice.create", "MeasuringDevice.update", "MeasuringDevice.status", "MeasuringDevice.export"],
  CalibrationPlan: ["CalibrationPlan.create", "CalibrationPlan.assign", "CalibrationPlan.status", "CalibrationPlan.export"],
  CalibrationCertificate: ["CalibrationCertificate.register", "CalibrationCertificate.update", "CalibrationCertificate.status", "CalibrationCertificate.export"],
  CalibrationVendor: ["CalibrationVendor.create", "CalibrationVendor.update", "CalibrationVendor.status", "CalibrationVendor.export"],
  OverdueAlert: ["OverdueAlert.generate", "OverdueAlert.close", "OverdueAlert.status", "OverdueAlert.export"]
};
