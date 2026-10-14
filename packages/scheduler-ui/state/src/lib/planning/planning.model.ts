import { Appointment, Timeslot } from '@org/models';

export const PLANNING_STATE_NAME = 'planning';

export interface PlanningStateModel {
  timeslotsById: Record<string, Timeslot>;
  appointmentsById: Record<string, Appointment>;
}
