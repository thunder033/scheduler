import { Appointment, Timeslot } from '@scheduler/models';

export const PLANNING_STATE_NAME = 'planning';

/**
 * Stands in for a timeslot that is being created, which has no id and no day yet. Starting to
 * edit its id edits the new timeslot like any other, until it is saved.
 */
export const NEW_TIMESLOT: Timeslot = {
  timeslotId: '',
  start: '',
  end: '',
  dayOfWeek: 0,
};

export interface PlanningStateModel {
  timeslotsById: Record<string, Timeslot>;
  appointmentsById: Record<string, Appointment>;
  /** The timeslot being edited, of which there is at most one at a time */
  editingTimeslot: Partial<Timeslot> | null;
}
