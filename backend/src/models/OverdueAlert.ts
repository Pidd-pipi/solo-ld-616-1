import type { AlertStatus } from "../constants/AlertStatus";

export interface OverdueAlert { id: number; device_id: number; plan_id: number; alert_level: string; alert_reason: string; handled_by: string | null; handled_at: string | null; status: AlertStatus }
