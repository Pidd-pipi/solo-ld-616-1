import { calibrationVendorRepository } from "../repositories/CalibrationVendorRepository";
import { createCalibrationVendorDto } from "../constructors/CalibrationVendorDtoFactory";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { httpError } from "../utils/httpError";
import type { CalibrationVendorPayload } from "../types/CalibrationVendorPayload";
import type { CalibrationVendor } from "../models/CalibrationVendor";

export const calibrationVendorService = {
  list: (): CalibrationVendor[] => calibrationVendorRepository.findAll(),

  create: (payload: CalibrationVendorPayload, actor: string): CalibrationVendor => {
    if (!payload.vendor_name) {
      throw httpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
    }
    const vendor = calibrationVendorRepository.insert(createCalibrationVendorDto({
      vendor_name: payload.vendor_name,
      qualification_no: payload.qualification_no,
      contact_phone: payload.contact_phone,
      service_scope: payload.service_scope
    }));
    console.info(LOG_TEMPLATES.CalibrationVendor[0], `vendor#${vendor.id}`, `by ${actor}`);
    return vendor;
  }
};
