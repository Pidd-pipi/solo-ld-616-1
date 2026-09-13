import { measuringDeviceRepository } from "../repositories/MeasuringDeviceRepository";
import { createMeasuringDeviceDto } from "../constructors/MeasuringDeviceDtoFactory";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { httpError } from "../utils/httpError";
import type { MeasuringDevicePayload } from "../types/MeasuringDevicePayload";
import type { MeasuringDevice } from "../models/MeasuringDevice";

export const measuringDeviceService = {
  list: (): MeasuringDevice[] => measuringDeviceRepository.findAll(),

  create: (payload: MeasuringDevicePayload, actor: string): MeasuringDevice => {
    if (!payload.device_code || !payload.name) {
      throw httpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
    }
    const device = measuringDeviceRepository.insert(createMeasuringDeviceDto({
      device_code: payload.device_code,
      name: payload.name,
      device_type: payload.device_type,
      accuracy_level: payload.accuracy_level,
      owner_dept: payload.owner_dept,
      calibration_cycle_days: payload.calibration_cycle_days ?? 365
    }));
    console.info(LOG_TEMPLATES.MeasuringDevice[0], `device#${device.id}`, `by ${actor}`);
    return device;
  }
};
