import { getISODay, getISOWeek, getISOWeekYear } from 'date-fns';
import { dateInWeek, hasTimeslotEnded } from './timeslot-time';

const DAY = new Date(2030, 2, 6);
const TIMESLOT = { end: '10:30' };

function at(hours: number, minutes: number): Date {
  return new Date(2030, 2, 6, hours, minutes);
}

describe('dateInWeek', () => {
  it.each([
    [{ year: 2030, week: 10 }, 3],
    [{ year: 2026, week: 53 }, 7],
    [{ year: 2027, week: 1 }, 1],
  ])('finds the date of the day in the week %o', (week, dayOfWeek) => {
    const date = dateInWeek(week, dayOfWeek);

    expect(getISOWeekYear(date)).toBe(week.year);
    expect(getISOWeek(date)).toBe(week.week);
    expect(getISODay(date)).toBe(dayOfWeek);
  });
});

describe('hasTimeslotEnded', () => {
  it('does not have ended before its end time', () => {
    expect(hasTimeslotEnded(DAY, TIMESLOT, at(10, 29))).toBe(false);
  });

  it('has ended at its end time', () => {
    expect(hasTimeslotEnded(DAY, TIMESLOT, at(10, 30))).toBe(true);
  });

  it('does not have ended on an earlier day', () => {
    expect(hasTimeslotEnded(DAY, TIMESLOT, new Date(2030, 2, 5, 23))).toBe(
      false,
    );
  });

  it('has ended on a later day', () => {
    expect(hasTimeslotEnded(DAY, TIMESLOT, new Date(2030, 2, 7, 1))).toBe(true);
  });
});
