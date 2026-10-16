import { Appointment, Timeslot } from '@org/models';

export const PLANNING_STATE_NAME = 'planning';

export interface PlanningStateModel {
  timeslotsById: Record<string, Timeslot>;
  appointmentsById: Record<string, Appointment>;
  /** The timeslot being edited, of which there is at most one at a time */
  editingTimeslot: Partial<Timeslot> | null;
}
