import {
    parseDuration,
    formatHoursMinutes,
    buildHourOptions,
    formatLocalDate,
    formatLocalTime,
    getISOWeekYear,
    extractProjectFields,
    computeEffectiveTags,
    extractTagsFromJoin,
    toggleArrayId,
    getPeriodRange,
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

// ─── extractProjectFields ────────────────────────────────────────────────────

describe('extractProjectFields', () => {
    it('extracts name and color from a plain object', () => {
        expect(extractProjectFields({ name: 'Dev', color: '#ef4444' })).toEqual({
            project_name: 'Dev',
            project_color: '#ef4444',
        });
    });

    it('extracts from a single-element array (Supabase one-to-one join)', () => {
        expect(extractProjectFields([{ name: 'Design', color: '#6366f1' }])).toEqual({
            project_name: 'Design',
            project_color: '#6366f1',
        });
    });

    it('returns nulls when passed null', () => {
        expect(extractProjectFields(null)).toEqual({ project_name: null, project_color: null });
    });

    it('returns nulls when passed an empty array', () => {
        expect(extractProjectFields([])).toEqual({ project_name: null, project_color: null });
    });

    it('handles missing color gracefully', () => {
        expect(extractProjectFields({ name: 'Backend' })).toEqual({
            project_name: 'Backend',
            project_color: null,
        });
    });
});

// ─── extractTagsFromJoin ─────────────────────────────────────────────────────

describe('extractTagsFromJoin', () => {
    it('returns empty array for null / undefined', () => {
        expect(extractTagsFromJoin(null)).toEqual([]);
        expect(extractTagsFromJoin(undefined)).toEqual([]);
    });

    it('extracts a single tag from an array row', () => {
        const raw = [{ tags: { id: 't1', name: 'Work', color: '#ef4444' } }];
        expect(extractTagsFromJoin(raw)).toEqual([
            { id: 't1', name: 'Work', color: '#ef4444' },
        ]);
    });

    it('extracts multiple tags from multiple rows', () => {
        const raw = [
            { tags: { id: 't1', name: 'Work', color: '#ef4444' } },
            { tags: { id: 't2', name: 'Personal', color: '#6366f1' } },
        ];
        expect(extractTagsFromJoin(raw)).toHaveLength(2);
        expect(extractTagsFromJoin(raw)[1].name).toBe('Personal');
    });

    it('defaults color to null when not present on tag', () => {
        const raw = [{ tags: { id: 't3', name: 'NoColor' } }];
        expect(extractTagsFromJoin(raw)[0].color).toBeNull();
    });

    it('accepts a single object (non-array) input', () => {
        const raw = { tags: { id: 't4', name: 'Solo', color: '#fbbf24' } };
        expect(extractTagsFromJoin(raw)).toEqual([
            { id: 't4', name: 'Solo', color: '#fbbf24' },
        ]);
    });

    it('skips rows where tags is null or malformed', () => {
        const raw = [
            { tags: null },
            { tags: { id: 't5', name: 'Valid', color: '#22d3ee' } },
            { tags: { id: 123, name: 'BadId' } }, // id is number, not string
        ];
        const result = extractTagsFromJoin(raw);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('t5');
    });
});

// ─── toggleArrayId ───────────────────────────────────────────────────────────

describe('toggleArrayId', () => {
    it('appends an id that is not in the array', () => {
        expect(toggleArrayId(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    });

    it('removes an id that is already in the array', () => {
        expect(toggleArrayId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
    });

    it('does not mutate the original array', () => {
        const original = ['x', 'y'];
        toggleArrayId(original, 'x');
        expect(original).toEqual(['x', 'y']);
    });

    it('handles an empty array by appending', () => {
        expect(toggleArrayId([], 'id1')).toEqual(['id1']);
    });

    it('removes the only element, resulting in empty array', () => {
        expect(toggleArrayId(['id1'], 'id1')).toEqual([]);
    });
});

// ─── computeEffectiveTags ─────────────────────────────────────────────────────

describe('computeEffectiveTags', () => {
    const tagA = { id: 'a', name: 'Alpha', color: '#ef4444' };
    const tagB = { id: 'b', name: 'Beta', color: '#6366f1' };
    const tagC = { id: 'c', name: 'Gamma', color: '#fbbf24' };

    it('returns an empty array when entry and project have no tags', () => {
        const entry = { id: 'e1', description: null, project_id: null, started_at: '', ended_at: null, duration_seconds: null };
        expect(computeEffectiveTags(entry)).toEqual([]);
    });

    it('returns only project tags when the entry has no entry_tags', () => {
        const entry = { id: 'e1', description: null, project_id: 'p1', started_at: '', ended_at: null, duration_seconds: null };
        const project = { id: 'p1', name: 'Dev', tags: [tagA, tagB] };
        expect(computeEffectiveTags(entry, project)).toEqual([tagA, tagB]);
    });

    it('returns only entry tags when there is no project', () => {
        const entry = { id: 'e1', description: null, project_id: null, started_at: '', ended_at: null, duration_seconds: null, entry_tags: [tagC] };
        expect(computeEffectiveTags(entry)).toEqual([tagC]);
    });

    it('merges project tags (first) with entry tags (after), deduplicated', () => {
        const entry = { id: 'e1', description: null, project_id: 'p1', started_at: '', ended_at: null, duration_seconds: null, entry_tags: [tagA, tagC] };
        const project = { id: 'p1', name: 'Dev', tags: [tagA, tagB] };
        // tagA is on both — should appear only once (from project)
        const result = computeEffectiveTags(entry, project);
        expect(result).toHaveLength(3);
        expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    });

    it('project tags come before entry-specific tags in the result', () => {
        const entry = { id: 'e1', description: null, project_id: 'p1', started_at: '', ended_at: null, duration_seconds: null, entry_tags: [tagC] };
        const project = { id: 'p1', name: 'Dev', tags: [tagB] };
        const result = computeEffectiveTags(entry, project);
        expect(result[0].id).toBe('b'); // project tag first
        expect(result[1].id).toBe('c'); // entry tag second
    });
});

// ─── getPeriodRange ──────────────────────────────────────────────────────────

describe('getPeriodRange', () => {
    // Wednesday March 11 2026
    const anchor = new Date(2026, 2, 11);

    describe('daily view', () => {
        it('from is midnight of the anchor date', () => {
            const { from } = getPeriodRange('daily', anchor);
            expect(from.getFullYear()).toBe(2026);
            expect(from.getMonth()).toBe(2);
            expect(from.getDate()).toBe(11);
            expect(from.getHours()).toBe(0);
            expect(from.getMinutes()).toBe(0);
        });

        it('to is exactly one day after from', () => {
            const { from, to } = getPeriodRange('daily', anchor);
            expect(to.getTime() - from.getTime()).toBe(24 * 60 * 60 * 1000);
        });
    });

    describe('weekly view', () => {
        it('from is the Monday of the week containing the anchor', () => {
            const { from } = getPeriodRange('weekly', anchor);
            // 2026-03-11 is a Wednesday → Monday should be 2026-03-09
            expect(from.getFullYear()).toBe(2026);
            expect(from.getMonth()).toBe(2);
            expect(from.getDate()).toBe(9);
        });

        it('to is 7 days after from', () => {
            const { from, to } = getPeriodRange('weekly', anchor);
            expect(to.getTime() - from.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
        });

        it('Sunday anchor still resolves to correct Monday', () => {
            // 2026-03-08 is a Sunday
            const sunday = new Date(2026, 2, 8);
            const { from } = getPeriodRange('weekly', sunday);
            // ISO: Monday 2026-03-02
            expect(from.getDate()).toBe(2);
            expect(from.getMonth()).toBe(2);
        });
    });

    describe('monthly view', () => {
        it('from is the first of the month', () => {
            const { from } = getPeriodRange('monthly', anchor);
            expect(from.getFullYear()).toBe(2026);
            expect(from.getMonth()).toBe(2);
            expect(from.getDate()).toBe(1);
        });

        it('to is the first of the next month', () => {
            const { to } = getPeriodRange('monthly', anchor);
            expect(to.getFullYear()).toBe(2026);
            expect(to.getMonth()).toBe(3); // April
            expect(to.getDate()).toBe(1);
        });

        it('handles December → January year roll-over', () => {
            const dec = new Date(2026, 11, 15);
            const { to } = getPeriodRange('monthly', dec);
            expect(to.getFullYear()).toBe(2027);
            expect(to.getMonth()).toBe(0);
        });
    });
});
