import { formatLocalDate, localDateEndOfDay, nextRecurringDate } from '../src/utils/dates';

describe('date helpers', () => {
  it('formats the local calendar date without UTC shifting', () => {
    expect(formatLocalDate(new Date(2026, 7, 21, 23, 30))).toBe('2026-08-21');
  });

  it('creates a local end-of-day deadline', () => {
    const result = new Date(localDateEndOfDay('2026-08-21'));
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
  });

  it('calculates the next monthly run and clamps invalid month days', () => {
    const result = nextRecurringDate('monthly', new Date(2026, 0, 31), 31);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });
});
