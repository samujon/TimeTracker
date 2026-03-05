import {
  parseDuration,
  formatHoursMinutes,
  buildHourOptions,
  formatLocalDate,
  formatLocalTime,
  getISOWeekYear,
} from '../../src/lib/timeUtils';

// ─── parseDuration ──────────────────────────────────────────────────────────────

describe('parseDuration', () => {
  it('parses "1:30" as 90 minutes', () => {
    expect(parseDuration('1:30')).toBe(90);
  });

  it('parses "01:30" as 90 minutes (zero-padded)', () => {
    expect(parseDuration('01:30')).toBe(90);
  });

  it('parses "2:00" as 120 minutes', () => {
    expect(parseDuration('2:00')).toBe(120);
  });

  it('parses "0:45" as 45 minutes', () => {
    expect(parseDuration('0:45')).toBe(45);
  });

  it('parses "1h 30m" as 90 minutes', () => {
    expect(parseDuration('1h 30m')).toBe(90);
  });

  it('parses "1h 15m" as 75 minutes', () => {
    expect(parseDuration('1h 15m')).toBe(75);
  });

  it('parses "2h" with no minutes as 120 minutes', () => {
    expect(parseDuration('2h')).toBe(120);
  });

  it('parses "90m" as 90 minutes', () => {
    expect(parseDuration('90m')).toBe(90);
  });

  it('returns null for empty string', () => {
    expect(parseDuration('')).toBeNull();
  });

  it('rejects minutes > 59 in hh:mm format', () => {
    expect(parseDuration('1:60')).toBeNull();
  });
});

// ─── formatHoursMinutes ─────────────────────────────────────────────────────────

describe('formatHoursMinutes', () => {
  it('formats 0 as "00:00"', () => {
    expect(formatHoursMinutes(0)).toBe('00:00');
  });

  it('formats 90 as "01:30"', () => {
    expect(formatHoursMinutes(90)).toBe('01:30');
  });

  it('formats 150 as "02:30"', () => {
    expect(formatHoursMinutes(150)).toBe('02:30');
  });

  it('formats 60 as "01:00"', () => {
    expect(formatHoursMinutes(60)).toBe('01:00');
  });

  it('handles hours > 23 (does not wrap)', () => {
    expect(formatHoursMinutes(1500)).toBe('25:00'); // 25 hours exactly
  });
});

// ─── buildHourOptions ───────────────────────────────────────────────────────────

describe('buildHourOptions', () => {
  it('returns 96 entries (24 hours × 4 quarter-hours)', () => {
    expect(buildHourOptions()).toHaveLength(96);
  });

  it('first entry is "00:00"', () => {
    expect(buildHourOptions()[0]).toBe('00:00');
  });

  it('last entry is "23:45"', () => {
    const opts = buildHourOptions();
    expect(opts[opts.length - 1]).toBe('23:45');
  });

  it('second entry is "00:15"', () => {
    expect(buildHourOptions()[1]).toBe('00:15');
  });

  it('fifth entry is "01:00"', () => {
    expect(buildHourOptions()[4]).toBe('01:00');
  });
});

// ─── formatLocalDate ────────────────────────────────────────────────────────────

describe('formatLocalDate', () => {
  it('formats a date as yyyy-MM-dd', () => {
    // Use a fixed local date — constructor uses LOCAL time zone
    const d = new Date(2026, 2, 5); // March 5 2026
    expect(formatLocalDate(d)).toBe('2026-03-05');
  });

  it('zero-pads single-digit month and day', () => {
    const d = new Date(2026, 0, 9); // January 9 2026
    expect(formatLocalDate(d)).toBe('2026-01-09');
  });
});

// ─── formatLocalTime ────────────────────────────────────────────────────────────

describe('formatLocalTime', () => {
  it('formats hours and minutes as HH:mm', () => {
    const d = new Date(2026, 2, 5, 9, 5); // 09:05
    expect(formatLocalTime(d)).toBe('09:05');
  });

  it('formats midnight as "00:00"', () => {
    const d = new Date(2026, 2, 5, 0, 0);
    expect(formatLocalTime(d)).toBe('00:00');
  });

  it('formats 23:59 correctly', () => {
    const d = new Date(2026, 2, 5, 23, 59);
    expect(formatLocalTime(d)).toBe('23:59');
  });
});

// ─── getISOWeekYear ─────────────────────────────────────────────────────────────

describe('getISOWeekYear', () => {
  it('returns expected year for a mid-year date', () => {
    // June 15 2026 is solidly ISO week year 2026
    expect(getISOWeekYear(new Date(2026, 5, 15))).toBe(2026);
  });

  it('returns the ISO year (not calendar year) for Jan 1 2016', () => {
    // 2016-01-01 is a Friday, belongs to ISO week 53 of 2015
    expect(getISOWeekYear(new Date(2016, 0, 1))).toBe(2015);
  });

  it('returns the ISO year (not calendar year) for Dec 31 2018', () => {
    // 2018-12-31 is a Monday, belongs to ISO week 1 of 2019
    expect(getISOWeekYear(new Date(2018, 11, 31))).toBe(2019);
  });
});
