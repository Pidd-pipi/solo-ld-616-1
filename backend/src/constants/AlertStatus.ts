export const AlertStatus = ["OPEN","CLOSED"] as const;
export type AlertStatus = (typeof AlertStatus)[number];
