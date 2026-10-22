import { Availability, Timeslot } from '@scheduler/models';
import {
  AppointmentWeek,
  TimeslotChanges,
  TimeslotDraft,
} from '@scheduler/ui/data';

export class LoadTimeslots {
  static readonly type = '[Planning] Load Timeslots';
}

export class LoadAppointmentsByWeek {
  static readonly type = '[Planning] Load Appointments By Week';

  constructor(readonly week: AppointmentWeek) {}
}

/** Starts editing the timeslot, which stops editing any other */
export class StartEditingTimeslot {
  static readonly type = '[Planning] Start Editing Timeslot';

  constructor(readonly timeslotId: string) {}
}

/** Keeps unsaved times for the timeslot being edited, and does nothing when none is */
export class UpdateEditingTimeslot {
  static readonly type = '[Planning] Update Editing Timeslot';

  constructor(readonly timeslotPartial: Partial<Timeslot>) {}
}

export class StopEditingTimeslot {
  static readonly type = '[Planning] Stop Editing Timeslot';
}

export class CreateTimeslot {
  static readonly type = '[Planning] Create Timeslot';

  constructor(readonly draft: TimeslotDraft) {}
}

export class UpdateTimeslot {
  static readonly type = '[Planning] Update Timeslot';

  constructor(
    readonly timeslotId: string,
    readonly changes: TimeslotChanges,
  ) {}
}

export class DeleteTimeslot {
  static readonly type = '[Planning] Delete Timeslot';

  constructor(readonly timeslotId: string) {}
}

export class CreateAppointment {
  static readonly type = '[Planning] Create Appointment';

  constructor(
    readonly timeslotId: string,
    readonly week: AppointmentWeek,
  ) {}
}

export class SetAvailability {
  static readonly type = '[Planning] Set Availability';

  constructor(
    readonly appointmentId: string,
    readonly availability: Availability,
  ) {}
}

export class RemoveAvailability {
  static readonly type = '[Planning] Remove Availability';

  constructor(
    readonly appointmentId: string,
    readonly participantId: string,
  ) {}
}

export class SetProspect {
  static readonly type = '[Planning] Set Prospect';

  constructor(
    readonly appointmentId: string,
    readonly prospectId: string,
  ) {}
}

export class RemoveProspect {
  static readonly type = '[Planning] Remove Prospect';

  constructor(readonly appointmentId: string) {}
}

export class ConfirmParticipant {
  static readonly type = '[Planning] Confirm Participant';

  constructor(
    readonly appointmentId: string,
    readonly participantId: string,
  ) {}
}

export class UnconfirmParticipant {
  static readonly type = '[Planning] Unconfirm Member';

  constructor(
    readonly appointmentId: string,
    readonly participantId: string,
  ) {}
}
