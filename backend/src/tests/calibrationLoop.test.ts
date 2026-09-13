import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { calibrationPlanService } from "../services/CalibrationPlanService";
import { calibrationCertificateService } from "../services/CalibrationCertificateService";
import { calibrationPlanRepository } from "../repositories/CalibrationPlanRepository";
import { measuringDeviceRepository } from "../repositories/MeasuringDeviceRepository";
import { calibrationCertificateRepository } from "../repositories/CalibrationCertificateRepository";
import { calibrationVendorRepository } from "../repositories/CalibrationVendorRepository";
import { overdueAlertRepository } from "../repositories/OverdueAlertRepository";
import { ERROR_CODES } from "../constants/errorCodes";

const ACTOR = "tester";
const FUTURE = "2099-12-31";

const resetAll = (): void => {
  measuringDeviceRepository.reset();
  calibrationPlanRepository.reset();
  calibrationCertificateRepository.reset();
  calibrationVendorRepository.reset();
  overdueAlertRepository.reset();
};

const snapshot = (): string => JSON.stringify({
  devices: measuringDeviceRepository.findAll(),
  plans: calibrationPlanRepository.findAll(),
  certificates: calibrationCertificateRepository.findAll(),
  alerts: overdueAlertRepository.findAll()
});

const expectHttpError = (fn: () => unknown, status: number, code: string): void => {
  try {
    fn();
  } catch (err) {
    const e = err as { status?: number; code?: string };
    assert.equal(e.status, status, `expected http status ${status}, got ${e.status}`);
    assert.equal(e.code, code, `expected error code ${code}, got ${e.code}`);
    return;
  }
  assert.fail(`expected ${code} but no error was thrown`);
};

beforeEach(resetAll);

describe("计划指派", () => {
  it("指派成功：返回 ASSIGNED 计划，设备联动为 CALIBRATING", () => {
    const plan = calibrationPlanService.assign(1, { vendor_id: 1 }, ACTOR);
    assert.equal(plan.status, "ASSIGNED");
    assert.equal(plan.assigned_vendor_id, 1);
    assert.equal(calibrationPlanRepository.findById(1)?.status, "ASSIGNED");
    assert.equal(measuringDeviceRepository.findById(1)?.status, "CALIBRATING");
  });

  it("重复指派：ASSIGNED 计划返回 409 DUPLICATE_ASSIGNMENT 且状态不变", () => {
    const before = snapshot();
    expectHttpError(() => calibrationPlanService.assign(2, { vendor_id: 1 }, ACTOR), 409, ERROR_CODES.DUPLICATE_ASSIGNMENT);
    assert.equal(snapshot(), before);
  });

  it("重复指派：同一计划指派后再次指派被拒绝", () => {
    calibrationPlanService.assign(1, { vendor_id: 1 }, ACTOR);
    const before = snapshot();
    expectHttpError(() => calibrationPlanService.assign(1, { vendor_id: 2 }, ACTOR), 409, ERROR_CODES.DUPLICATE_ASSIGNMENT);
    assert.equal(snapshot(), before);
    assert.equal(calibrationPlanRepository.findById(1)?.assigned_vendor_id, 1);
  });

  it("重复指派：IN_PROGRESS 计划返回 409 DUPLICATE_ASSIGNMENT", () => {
    expectHttpError(() => calibrationPlanService.assign(3, { vendor_id: 1 }, ACTOR), 409, ERROR_CODES.DUPLICATE_ASSIGNMENT);
  });

  it("非法状态流转：已关闭计划返回 409 INVALID_PLAN_TRANSITION", () => {
    calibrationPlanRepository.update(1, { status: "CLOSED" });
    const before = snapshot();
    expectHttpError(() => calibrationPlanService.assign(1, { vendor_id: 1 }, ACTOR), 409, ERROR_CODES.INVALID_PLAN_TRANSITION);
    assert.equal(snapshot(), before);
  });

  it("计划不存在返回 404 PLAN_NOT_FOUND", () => {
    expectHttpError(() => calibrationPlanService.assign(999, { vendor_id: 1 }, ACTOR), 404, ERROR_CODES.PLAN_NOT_FOUND);
  });

  it("机构不存在返回 404 VENDOR_NOT_FOUND", () => {
    expectHttpError(() => calibrationPlanService.assign(1, { vendor_id: 999 }, ACTOR), 404, ERROR_CODES.VENDOR_NOT_FOUND);
  });

  it("缺少 vendor_id 返回 400 VALIDATION_FAILED", () => {
    expectHttpError(() => calibrationPlanService.assign(1, {}, ACTOR), 400, ERROR_CODES.VALIDATION_FAILED);
  });
});

describe("证书登记校验", () => {
  it("跨设备证书：返回 409 CERT_DEVICE_MISMATCH 且状态不变", () => {
    calibrationPlanService.assign(1, { vendor_id: 1 }, ACTOR);
    const before = snapshot();
    expectHttpError(
      () => calibrationCertificateService.register({ device_id: 2, plan_id: 1, certificate_no: "CERT-NEW-001", result_status: "PASS", valid_until: FUTURE }, ACTOR),
      409, ERROR_CODES.CERT_DEVICE_MISMATCH
    );
    assert.equal(snapshot(), before);
  });

  it("证书编号重复：返回 409 DUPLICATE_CERTIFICATE_NO 且状态不变", () => {
    calibrationPlanService.assign(1, { vendor_id: 1 }, ACTOR);
    const before = snapshot();
    expectHttpError(
      () => calibrationCertificateService.register({ device_id: 1, plan_id: 1, certificate_no: "CERT-2025-0001", result_status: "PASS", valid_until: FUTURE }, ACTOR),
      409, ERROR_CODES.DUPLICATE_CERTIFICATE_NO
    );
    assert.equal(snapshot(), before);
  });

  it("过期证书：PASS 与 FAIL 均返回 409 CERT_EXPIRED 且状态不变", () => {
    calibrationPlanService.assign(1, { vendor_id: 1 }, ACTOR);
    const before = snapshot();
    expectHttpError(
      () => calibrationCertificateService.register({ device_id: 1, plan_id: 1, certificate_no: "CERT-NEW-002", result_status: "PASS", valid_until: "2020-01-01" }, ACTOR),
      409, ERROR_CODES.CERT_EXPIRED
    );
    expectHttpError(
      () => calibrationCertificateService.register({ device_id: 1, plan_id: 1, certificate_no: "CERT-NEW-003", result_status: "FAIL", valid_until: "2020-01-01" }, ACTOR),
      409, ERROR_CODES.CERT_EXPIRED
    );
    expectHttpError(
      () => calibrationCertificateService.register({ device_id: 1, plan_id: 1, certificate_no: "CERT-NEW-004", result_status: "PASS", valid_until: "2020-01-01T00:00:00Z" }, ACTOR),
      409, ERROR_CODES.CERT_EXPIRED
    );
    assert.equal(snapshot(), before);
  });

  it("无效日历日期：返回 400 VALIDATION_FAILED 且状态不变", () => {
    calibrationPlanService.assign(1, { vendor_id: 1 }, ACTOR);
    const before = snapshot();
    for (const valid_until of ["2026-02-30", "2026-13-45", "not-a-date"]) {
      expectHttpError(
        () => calibrationCertificateService.register({ device_id: 1, plan_id: 1, certificate_no: `CERT-NEW-${valid_until}`, result_status: "PASS", valid_until }, ACTOR),
        400, ERROR_CODES.VALIDATION_FAILED
      );
    }
    assert.equal(snapshot(), before);
  });

  it("带时间部分的无效日历日期：返回 400 VALIDATION_FAILED 且状态不变", () => {
    calibrationPlanService.assign(1, { vendor_id: 1 }, ACTOR);
    const before = snapshot();
    const invalid = [
      "2027-02-30T00:00:00Z",
      "2027-02-30T10:30:00+08:00",
      "2027-04-31T00:00:00Z",
      "2099-03-01T25:00:00Z",
      "2099-03-01T10:61:00Z"
    ];
    invalid.forEach((valid_until, index) => {
      expectHttpError(
        () => calibrationCertificateService.register({ device_id: 1, plan_id: 1, certificate_no: `CERT-DT-${index}`, result_status: "PASS", valid_until }, ACTOR),
        400, ERROR_CODES.VALIDATION_FAILED
      );
    });
    assert.equal(snapshot(), before);
  });

  it("合法 ISO 日期时间仍可登记成功并联动状态", () => {
    calibrationPlanService.assign(1, { vendor_id: 1 }, ACTOR);
    const result = calibrationCertificateService.register(
      { device_id: 1, plan_id: 1, certificate_no: "CERT-DT-OK", result_status: "PASS", valid_until: "2099-02-28T23:59:59Z" },
      ACTOR
    );
    assert.equal(result.device_status, "VALID");
    assert.equal(result.plan_status, "CERT_UPLOADED");
    assert.equal(measuringDeviceRepository.findById(1)?.status, "VALID");
    assert.equal(calibrationPlanRepository.findById(1)?.status, "CERT_UPLOADED");
  });

  it("非法状态流转：PLANNED 计划登记证书返回 409 INVALID_PLAN_TRANSITION", () => {
    const before = snapshot();
    expectHttpError(
      () => calibrationCertificateService.register({ device_id: 1, plan_id: 1, certificate_no: "CERT-NEW-004", result_status: "PASS", valid_until: FUTURE }, ACTOR),
      409, ERROR_CODES.INVALID_PLAN_TRANSITION
    );
    assert.equal(snapshot(), before);
  });

  it("计划不存在返回 404 PLAN_NOT_FOUND，设备不存在返回 404 DEVICE_NOT_FOUND", () => {
    expectHttpError(
      () => calibrationCertificateService.register({ device_id: 1, plan_id: 999, certificate_no: "CERT-NEW-005", result_status: "PASS", valid_until: FUTURE }, ACTOR),
      404, ERROR_CODES.PLAN_NOT_FOUND
    );
    expectHttpError(
      () => calibrationCertificateService.register({ device_id: 999, plan_id: 2, certificate_no: "CERT-NEW-006", result_status: "PASS", valid_until: FUTURE }, ACTOR),
      404, ERROR_CODES.DEVICE_NOT_FOUND
    );
  });
});

describe("证书结果联动设备状态与预警", () => {
  it("PASS：设备置 VALID，计划置 CERT_UPLOADED，设备 OPEN 预警全部关闭", () => {
    const result = calibrationCertificateService.register(
      { device_id: 2, plan_id: 2, certificate_no: "CERT-NEW-101", result_status: "PASS", valid_until: FUTURE, issued_by: "中检集团" },
      ACTOR
    );
    assert.equal(result.device_status, "VALID");
    assert.equal(result.plan_status, "CERT_UPLOADED");
    assert.deepEqual([...result.closed_alert_ids].sort(), [1, 2]);
    assert.equal(result.generated_alert, null);
    assert.equal(result.certificate.certificate_no, "CERT-NEW-101");

    assert.equal(measuringDeviceRepository.findById(2)?.status, "VALID");
    assert.equal(calibrationPlanRepository.findById(2)?.status, "CERT_UPLOADED");
    for (const alertId of [1, 2]) {
      const alert = overdueAlertRepository.findById(alertId);
      assert.equal(alert?.status, "CLOSED");
      assert.equal(alert?.handled_by, ACTOR);
      assert.ok(alert?.handled_at);
    }
  });

  it("LIMITED_PASS：设备置 VALID 并关闭 OPEN 预警", () => {
    const result = calibrationCertificateService.register(
      { device_id: 2, plan_id: 2, certificate_no: "CERT-NEW-102", result_status: "LIMITED_PASS", valid_until: FUTURE },
      ACTOR
    );
    assert.equal(result.device_status, "VALID");
    assert.deepEqual([...result.closed_alert_ids].sort(), [1, 2]);
    assert.equal(measuringDeviceRepository.findById(2)?.status, "VALID");
    assert.equal(overdueAlertRepository.findOpenByDeviceId(2).length, 0);
  });

  it("FAIL：设备置 OVERDUE，无 OPEN 预警时自动生成 HIGH 预警", () => {
    const result = calibrationCertificateService.register(
      { device_id: 3, plan_id: 3, certificate_no: "CERT-NEW-103", result_status: "FAIL", valid_until: FUTURE },
      ACTOR
    );
    assert.equal(result.device_status, "OVERDUE");
    assert.equal(result.plan_status, "CERT_UPLOADED");
    assert.deepEqual(result.closed_alert_ids, []);
    assert.ok(result.generated_alert);
    assert.equal(result.generated_alert?.alert_level, "HIGH");
    assert.equal(result.generated_alert?.status, "OPEN");
    assert.equal(result.generated_alert?.device_id, 3);
    assert.equal(result.generated_alert?.plan_id, 3);

    assert.equal(measuringDeviceRepository.findById(3)?.status, "OVERDUE");
    assert.equal(calibrationPlanRepository.findById(3)?.status, "CERT_UPLOADED");
    const openAlerts = overdueAlertRepository.findOpenByDeviceId(3);
    assert.equal(openAlerts.length, 1);
    assert.equal(openAlerts[0].id, result.generated_alert?.id);
  });

  it("NEED_REPAIR：设备置 OVERDUE，已有 OPEN 预警时不重复生成", () => {
    const result = calibrationCertificateService.register(
      { device_id: 2, plan_id: 2, certificate_no: "CERT-NEW-104", result_status: "NEED_REPAIR", valid_until: FUTURE },
      ACTOR
    );
    assert.equal(result.device_status, "OVERDUE");
    assert.deepEqual(result.closed_alert_ids, []);
    assert.equal(result.generated_alert, null);

    assert.equal(measuringDeviceRepository.findById(2)?.status, "OVERDUE");
    const openAlerts = overdueAlertRepository.findOpenByDeviceId(2);
    assert.deepEqual(openAlerts.map((alert) => alert.id).sort(), [1, 2]);
    assert.ok(openAlerts.every((alert) => alert.status === "OPEN"));
  });

  it("重复登记：CERT_UPLOADED 计划再次登记返回 409 INVALID_PLAN_TRANSITION", () => {
    calibrationCertificateService.register(
      { device_id: 2, plan_id: 2, certificate_no: "CERT-NEW-105", result_status: "PASS", valid_until: FUTURE },
      ACTOR
    );
    const before = snapshot();
    expectHttpError(
      () => calibrationCertificateService.register({ device_id: 2, plan_id: 2, certificate_no: "CERT-NEW-106", result_status: "PASS", valid_until: FUTURE }, ACTOR),
      409, ERROR_CODES.INVALID_PLAN_TRANSITION
    );
    assert.equal(snapshot(), before);
  });
});
