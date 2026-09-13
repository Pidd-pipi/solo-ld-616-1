import { calibrationPlanRepository } from "../repositories/CalibrationPlanRepository";
import { measuringDeviceRepository } from "../repositories/MeasuringDeviceRepository";
import { calibrationVendorRepository } from "../repositories/CalibrationVendorRepository";
import { createCalibrationPlanDto } from "../constructors/CalibrationPlanDtoFactory";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { httpError } from "../utils/httpError";
import type { CalibrationPlanPayload, AssignCalibrationPlanPayload } from "../types/CalibrationPlanPayload";
import type { CalibrationPlan } from "../models/CalibrationPlan";

export const calibrationPlanService = {
  list: (): CalibrationPlan[] => calibrationPlanRepository.findAll(),

  create: (payload: CalibrationPlanPayload, actor: string): CalibrationPlan => {
    if (!payload.device_id) {
      throw httpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
    }
    const device = measuringDeviceRepository.findById(payload.device_id);
    if (!device) {
      throw httpError(404, ERROR_CODES.DEVICE_NOT_FOUND, ERROR_MESSAGES.DEVICE_NOT_FOUND);
    }
    const plan = calibrationPlanRepository.insert(createCalibrationPlanDto({
      device_id: payload.device_id,
      planned_date: payload.planned_date,
      plan_type: payload.plan_type,
      priority: payload.priority,
      created_by: payload.created_by ?? actor
    }));
    console.info(LOG_TEMPLATES.CalibrationPlan[0], `plan#${plan.id}`, `device#${plan.device_id}`, `by ${actor}`);
    return plan;
  },

  assign: (planId: number, payload: AssignCalibrationPlanPayload, actor: string): CalibrationPlan => {
    const plan = calibrationPlanRepository.findById(planId);
    if (!plan) {
      throw httpError(404, ERROR_CODES.PLAN_NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND);
    }
    if (!payload.vendor_id) {
      throw httpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
    }
    const vendor = calibrationVendorRepository.findById(payload.vendor_id);
    if (!vendor) {
      throw httpError(404, ERROR_CODES.VENDOR_NOT_FOUND, ERROR_MESSAGES.VENDOR_NOT_FOUND);
    }
    if (plan.status === "ASSIGNED" || plan.status === "IN_PROGRESS") {
      throw httpError(409, ERROR_CODES.DUPLICATE_ASSIGNMENT, ERROR_MESSAGES.DUPLICATE_ASSIGNMENT);
    }
    if (plan.status !== "PLANNED") {
      throw httpError(409, ERROR_CODES.INVALID_PLAN_TRANSITION, ERROR_MESSAGES.INVALID_PLAN_TRANSITION);
    }
    const saved = calibrationPlanRepository.update(planId, { status: "ASSIGNED", assigned_vendor_id: vendor.id })!;
    console.info(LOG_TEMPLATES.CalibrationPlan[1], `plan#${saved.id}`, `vendor#${vendor.id}`, `by ${actor}`);
    measuringDeviceRepository.updateStatus(saved.device_id, "CALIBRATING");
    console.info(LOG_TEMPLATES.MeasuringDevice[2], `device#${saved.device_id}`, "CALIBRATING");
    return saved;
  }
};
