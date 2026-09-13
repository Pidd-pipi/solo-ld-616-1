import { calibrationCertificateRepository } from "../repositories/CalibrationCertificateRepository";
import { calibrationPlanRepository } from "../repositories/CalibrationPlanRepository";
import { measuringDeviceRepository } from "../repositories/MeasuringDeviceRepository";
import { overdueAlertRepository } from "../repositories/OverdueAlertRepository";
import { createCalibrationCertificateDto } from "../constructors/CalibrationCertificateDtoFactory";
import { createOverdueAlertDto } from "../constructors/OverdueAlertDtoFactory";
import { CertificateResult } from "../constants/CertificateResult";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { httpError } from "../utils/httpError";
import { parseCalendarDate } from "../utils/formatters";
import type { CalibrationCertificatePayload } from "../types/CalibrationCertificatePayload";
import type { CalibrationCertificate } from "../models/CalibrationCertificate";
import type { OverdueAlert } from "../models/OverdueAlert";
import type { DeviceCalibrationStatus } from "../constants/DeviceCalibrationStatus";

export interface CertificateRegisterResult {
  certificate: CalibrationCertificate;
  device_status: DeviceCalibrationStatus;
  plan_status: string;
  closed_alert_ids: number[];
  generated_alert: OverdueAlert | null;
}

const PASS_RESULTS = new Set<string>(["PASS", "LIMITED_PASS"]);

export const calibrationCertificateService = {
  list: (): CalibrationCertificate[] => calibrationCertificateRepository.findAll(),

  register: (payload: CalibrationCertificatePayload, actor: string): CertificateRegisterResult => {
    if (!payload.device_id || !payload.plan_id || !payload.certificate_no || !payload.result_status || !payload.valid_until) {
      throw httpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
    }
    if (!(CertificateResult as readonly string[]).includes(payload.result_status)) {
      throw httpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
    }
    if (calibrationCertificateRepository.findByCertificateNo(payload.certificate_no)) {
      throw httpError(409, ERROR_CODES.DUPLICATE_CERTIFICATE_NO, ERROR_MESSAGES.DUPLICATE_CERTIFICATE_NO);
    }
    const validUntil = parseCalendarDate(payload.valid_until);
    if (!validUntil) {
      throw httpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
    }
    if (validUntil.getTime() < Date.now()) {
      throw httpError(409, ERROR_CODES.CERT_EXPIRED, ERROR_MESSAGES.CERT_EXPIRED);
    }
    const plan = calibrationPlanRepository.findById(payload.plan_id);
    if (!plan) {
      throw httpError(404, ERROR_CODES.PLAN_NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND);
    }
    const device = measuringDeviceRepository.findById(payload.device_id);
    if (!device) {
      throw httpError(404, ERROR_CODES.DEVICE_NOT_FOUND, ERROR_MESSAGES.DEVICE_NOT_FOUND);
    }
    if (plan.device_id !== payload.device_id) {
      throw httpError(409, ERROR_CODES.CERT_DEVICE_MISMATCH, ERROR_MESSAGES.CERT_DEVICE_MISMATCH);
    }
    if (plan.status !== "ASSIGNED" && plan.status !== "IN_PROGRESS") {
      throw httpError(409, ERROR_CODES.INVALID_PLAN_TRANSITION, ERROR_MESSAGES.INVALID_PLAN_TRANSITION);
    }

    const certificate = calibrationCertificateRepository.insert(createCalibrationCertificateDto({
      device_id: payload.device_id,
      plan_id: plan.id,
      certificate_no: payload.certificate_no,
      result_status: payload.result_status as CalibrationCertificate["result_status"],
      valid_until: payload.valid_until,
      file_path: payload.file_path ?? "",
      issued_by: payload.issued_by ?? actor
    }));
    console.info(LOG_TEMPLATES.CalibrationCertificate[0], `cert#${certificate.id}`, `plan#${plan.id}`, `device#${device.id}`, `by ${actor}`);

    calibrationPlanRepository.updateStatus(plan.id, "CERT_UPLOADED");
    console.info(LOG_TEMPLATES.CalibrationPlan[2], `plan#${plan.id}`, "CERT_UPLOADED");

    const passed = PASS_RESULTS.has(certificate.result_status);
    const deviceStatus: DeviceCalibrationStatus = passed ? "VALID" : "OVERDUE";
    measuringDeviceRepository.updateStatus(device.id, deviceStatus);
    console.info(LOG_TEMPLATES.MeasuringDevice[2], `device#${device.id}`, deviceStatus);

    const closedAlertIds: number[] = [];
    let generatedAlert: OverdueAlert | null = null;
    const openAlerts = overdueAlertRepository.findOpenByDeviceId(device.id);
    if (passed) {
      for (const alert of openAlerts) {
        overdueAlertRepository.update(alert.id, { status: "CLOSED", handled_by: actor, handled_at: new Date().toISOString() });
        closedAlertIds.push(alert.id);
        console.info(LOG_TEMPLATES.OverdueAlert[1], `alert#${alert.id}`, `device#${device.id}`, `by ${actor}`);
      }
    } else if (openAlerts.length === 0) {
      generatedAlert = overdueAlertRepository.insert(createOverdueAlertDto({
        device_id: device.id,
        plan_id: plan.id,
        alert_level: "HIGH",
        alert_reason: `证书 ${certificate.certificate_no} 校准结果为 ${certificate.result_status}，设备判定不合格`
      }));
      console.info(LOG_TEMPLATES.OverdueAlert[0], `alert#${generatedAlert.id}`, `device#${device.id}`);
    }

    return { certificate, device_status: deviceStatus, plan_status: "CERT_UPLOADED", closed_alert_ids: closedAlertIds, generated_alert: generatedAlert };
  }
};
