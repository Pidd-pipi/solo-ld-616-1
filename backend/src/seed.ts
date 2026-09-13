import type { MeasuringDevice } from "./models/MeasuringDevice";
import type { CalibrationPlan } from "./models/CalibrationPlan";
import type { CalibrationCertificate } from "./models/CalibrationCertificate";
import type { CalibrationVendor } from "./models/CalibrationVendor";
import type { OverdueAlert } from "./models/OverdueAlert";

export interface SeedData {
  measuringDevice: MeasuringDevice[];
  calibrationPlan: CalibrationPlan[];
  calibrationCertificate: CalibrationCertificate[];
  calibrationVendor: CalibrationVendor[];
  overdueAlert: OverdueAlert[];
}

export const seed: SeedData = {
  measuringDevice: [
    { id: 1, device_code: "DEV-001", name: "游标卡尺", device_type: "长度量具", accuracy_level: "0.02mm", owner_dept: "机加车间", calibration_cycle_days: 365, status: "VALID" },
    { id: 2, device_code: "DEV-002", name: "电子天平", device_type: "衡器", accuracy_level: "0.1mg", owner_dept: "理化实验室", calibration_cycle_days: 180, status: "OVERDUE" },
    { id: 3, device_code: "DEV-003", name: "压力表", device_type: "压力仪表", accuracy_level: "1.6级", owner_dept: "动力车间", calibration_cycle_days: 365, status: "CALIBRATING" }
  ],
  calibrationPlan: [
    { id: 1, device_id: 1, planned_date: "2026-10-01T09:00:00Z", plan_type: "PERIODIC", priority: "MEDIUM", status: "PLANNED", assigned_vendor_id: null, created_by: "admin" },
    { id: 2, device_id: 2, planned_date: "2026-08-01T09:00:00Z", plan_type: "PERIODIC", priority: "HIGH", status: "ASSIGNED", assigned_vendor_id: 2, created_by: "admin" },
    { id: 3, device_id: 3, planned_date: "2026-09-10T09:00:00Z", plan_type: "PERIODIC", priority: "MEDIUM", status: "IN_PROGRESS", assigned_vendor_id: 3, created_by: "admin" }
  ],
  calibrationCertificate: [
    { id: 1, device_id: 1, plan_id: null, certificate_no: "CERT-2025-0001", result_status: "PASS", valid_until: "2026-10-15", file_path: "/files/cert-2025-0001.pdf", issued_by: "华测计量" },
    { id: 2, device_id: 2, plan_id: null, certificate_no: "CERT-2025-0002", result_status: "PASS", valid_until: "2026-08-01", file_path: "/files/cert-2025-0002.pdf", issued_by: "华测计量" },
    { id: 3, device_id: 3, plan_id: null, certificate_no: "CERT-2025-0003", result_status: "LIMITED_PASS", valid_until: "2026-09-30", file_path: "/files/cert-2025-0003.pdf", issued_by: "中检集团" }
  ],
  calibrationVendor: [
    { id: 1, vendor_name: "华测计量", qualification_no: "JL-2024-001", contact_phone: "13800000001", service_scope: "长度/力学", vendor_status: "ACTIVE" },
    { id: 2, vendor_name: "中检集团", qualification_no: "JL-2024-002", contact_phone: "13800000002", service_scope: "衡器/电磁", vendor_status: "ACTIVE" },
    { id: 3, vendor_name: "省计量院", qualification_no: "JL-2024-003", contact_phone: "13800000003", service_scope: "压力/温度", vendor_status: "ACTIVE" }
  ],
  overdueAlert: [
    { id: 1, device_id: 2, plan_id: 2, alert_level: "HIGH", alert_reason: "设备校准证书已过有效期", handled_by: null, handled_at: null, status: "OPEN" },
    { id: 2, device_id: 2, plan_id: 2, alert_level: "MEDIUM", alert_reason: "校准计划超期未执行", handled_by: null, handled_at: null, status: "OPEN" },
    { id: 3, device_id: 1, plan_id: 1, alert_level: "LOW", alert_reason: "证书即将到期提醒", handled_by: "quality.li", handled_at: "2026-09-01T09:00:00Z", status: "CLOSED" }
  ]
};
