export interface Timeslot {
  timeslotId: string;
  /** 24h time - 00:00 */
  start: string;
  /** 24h time - 00:00 */
  end: string;
  /** ISO 8601 day of week - 1 (Monday) to 7 (Sunday) */
  dayOfWeek: number;
}

export enum AvailabilityStatus {
  Available = 'available',
  IfNeeded = 'if-needed',
}

export interface Availability {
  memberId: string;
  status: AvailabilityStatus;
}

export interface Appointment {
  appointmentId: string;
  timeslotId: string;

  /** ISO week-numbering year */
  year: number;
  /** ISO week number 1 - 53 */
  week: number;

  availabilities: Availability[];
  /** A list of user IDs confirmed to be present at the appointment */
  confirmedUserIds: string[];
  prospectId?: string;
}
