export const toAuditTarget = (type: string, id: string | number) => `${type}#${id}`;

const ISO_DATE_TIME = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?\s*(Z|[+-]\d{2}:?\d{2})?)?$/;

export const parseCalendarDate = (raw: string): Date | null => {
  const match = ISO_DATE_TIME.exec(raw.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const datePart = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const roundTrips = datePart.getUTCFullYear() === Number(year)
    && datePart.getUTCMonth() === Number(month) - 1
    && datePart.getUTCDate() === Number(day);
  if (!roundTrips) return null;
  if (hour !== undefined && (Number(hour) > 23 || Number(minute) > 59 || (second !== undefined && Number(second) > 59))) {
    return null;
  }
  const parsed = new Date(raw.trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

