import { overdueAlertRepository } from "../repositories/OverdueAlertRepository";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { httpError } from "../utils/httpError";
import type { OverdueAlertQuery } from "../types/OverdueAlertPayload";
import type { OverdueAlert } from "../models/OverdueAlert";

export const overdueAlertService = {
  list: (query: OverdueAlertQuery = {}): OverdueAlert[] => {
    let rows = overdueAlertRepository.findAll();
    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.device_id) rows = rows.filter((row) => row.device_id === Number(query.device_id));
    if (query.alert_level) rows = rows.filter((row) => row.alert_level === query.alert_level);
    return rows;
  },

  overdue: (): OverdueAlert[] => overdueAlertRepository.findAll().filter((row) => row.status === "OPEN"),

  close: (alertId: number, actor: string): OverdueAlert => {
    const alert = overdueAlertRepository.findById(alertId);
    if (!alert) {
      throw httpError(404, ERROR_CODES.ALERT_NOT_FOUND, ERROR_MESSAGES.ALERT_NOT_FOUND);
    }
    if (alert.status !== "OPEN") {
      throw httpError(409, ERROR_CODES.INVALID_ALERT_TRANSITION, ERROR_MESSAGES.INVALID_ALERT_TRANSITION);
    }
    const saved = overdueAlertRepository.update(alertId, { status: "CLOSED", handled_by: actor, handled_at: new Date().toISOString() })!;
    console.info(LOG_TEMPLATES.OverdueAlert[1], `alert#${saved.id}`, `by ${actor}`);
    return saved;
  }
};
