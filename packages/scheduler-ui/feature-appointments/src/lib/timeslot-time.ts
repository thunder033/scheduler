import { parse, setISODay, setISOWeek, setISOWeekYear } from 'date-fns';
import { Timeslot } from '@org/models';
import { AppointmentWeek } from '@org/scheduler-ui/data';

const TIME_FORMAT = 'HH:mm';
/** A date well inside any year, so setting the ISO week and year from it cannot cross into another */
const MID_YEAR = new Date(2000, 5, 15);

/** The date of the ISO 8601 day of week in the week */
export function dateInWeek(
  { year, week }: AppointmentWeek,
  dayOfWeek: number,
): Date {
  return setISODay(setISOWeek(setISOWeekYear(MID_YEAR, year), week), dayOfWeek);
}

/** Whether the timeslot has ended, when it is on the day, which is when it is in the past */
export function hasTimeslotEnded(
  day: Date,
  { end }: Pick<Timeslot, 'end'>,
  now = new Date(),
): boolean {
  return parse(end, TIME_FORMAT, day) <= now;
}
