import { DateTime } from 'luxon';

/**
 * ISO-8601 with offset, e.g. 2026-01-01T12:00:00+01:00
 */
export function isoOffset(input, { zone = 'Europe/Berlin', setTime } = {}) {
  let dt = DateTime.fromJSDate(new Date(input), { zone }).setZone(zone);
  if (setTime) {
    dt = dt.set({
      hour: setTime.hour,
      minute: setTime.minute ?? 0,
      second: setTime.second ?? 0,
      millisecond: 0
    });
  }
  return dt.toFormat("yyyy-LL-dd'T'HH:mm:ssZZ");
}

export const isoAtNoon = (input, zone = 'Europe/Berlin') =>
  isoOffset(input, { zone, setTime: { hour: 12 } });
