import { inject, Injectable } from '@angular/core';
import {
  Action,
  createSelector,
  Selector,
  State,
  StateContext,
} from '@ngxs/store';
import { Appointment, Timeslot } from '@org/models';
import {
  appointmentNotFoundMessage,
  AppointmentWeek,
  TimeslotService,
} from '@org/scheduler-ui/data';
import { Observable, tap, throwError } from 'rxjs';
import {
  ConfirmMember,
  CreateAppointment,
  CreateTimeslot,
  DeleteTimeslot,
  LoadAppointmentsByWeek,
  LoadTimeslots,
  RemoveAvailability,
  RemoveProspect,
  SetAvailability,
  SetProspect,
  StartEditingTimeslot,
  StopEditingTimeslot,
  UnconfirmMember,
  UpdateTimeslot,
  UpdateEditingTimeslot,
} from './planning.actions';
import { PLANNING_STATE_NAME, PlanningStateModel } from './planning.model';

type PlanningContext = StateContext<PlanningStateModel>;

function indexBy<T>(
  items: T[],
  getKey: (item: T) => string,
): Record<string, T> {
  return Object.fromEntries(items.map((item) => [getKey(item), item]));
}

@State<PlanningStateModel>({
  name: PLANNING_STATE_NAME,
  defaults: {
    timeslotsById: {},
    appointmentsById: {},
    editingTimeslot: null,
  },
})
@Injectable()
export class PlanningState {
  private readonly timeslotService = inject(TimeslotService);

  @Selector()
  static timeslots(state: PlanningStateModel): Timeslot[] {
    return Object.values(state.timeslotsById);
  }

  @Selector()
  static editingTimeslot(state: PlanningStateModel): Partial<Timeslot> | null {
    return state.editingTimeslot;
  }

  @Selector()
  static editingTimeslotId(state: PlanningStateModel): string {
    return state.editingTimeslot?.timeslotId ?? '';
  }

  static appointmentsByWeek(week: AppointmentWeek) {
    return createSelector(
      [PlanningState],
      (state: PlanningStateModel): Appointment[] =>
        Object.values(state.appointmentsById).filter(
          (appointment) =>
            appointment.year === week.year && appointment.week === week.week,
        ),
    );
  }

  @Action(LoadTimeslots)
  loadTimeslots(context: PlanningContext): Observable<Timeslot[]> {
    return this.timeslotService.getTimeslots().pipe(
      tap((timeslots) =>
        context.patchState({
          timeslotsById: indexBy(timeslots, (timeslot) => timeslot.timeslotId),
        }),
      ),
    );
  }

  @Action(LoadAppointmentsByWeek)
  loadAppointmentsByWeek(
    context: PlanningContext,
    { week }: LoadAppointmentsByWeek,
  ): Observable<Appointment[]> {
    return this.timeslotService.getAppointmentsByWeek(week).pipe(
      tap((appointments) =>
        context.patchState({
          appointmentsById: {
            ...context.getState().appointmentsById,
            ...indexBy(
              appointments,
              (appointment) => appointment.appointmentId,
            ),
          },
        }),
      ),
    );
  }

  @Action(CreateTimeslot)
  createTimeslot(
    context: PlanningContext,
    { draft }: CreateTimeslot,
  ): Observable<Timeslot> {
    return this.timeslotService
      .createTimeslot(draft)
      .pipe(tap((timeslot) => this.upsertTimeslot(context, timeslot)));
  }

  @Action(UpdateTimeslot)
  updateTimeslot(
    context: PlanningContext,
    { timeslotId, changes }: UpdateTimeslot,
  ): Observable<Timeslot> {
    return this.timeslotService
      .updateTimeslot(timeslotId, changes)
      .pipe(tap((timeslot) => this.upsertTimeslot(context, timeslot)));
  }

  @Action(StartEditingTimeslot)
  startEditingTimeslot(
    context: PlanningContext,
    { timeslotId }: StartEditingTimeslot,
  ): void {
    const { editingTimeslot } = context.getState();
    context.patchState({
      // A draft belongs to the timeslot it was entered for
      editingTimeslot:
        editingTimeslot?.timeslotId === timeslotId
          ? editingTimeslot
          : { timeslotId },
    });
  }

  @Action(UpdateEditingTimeslot)
  updateTimeslotDraft(
    context: PlanningContext,
    { timeslotPartial }: UpdateEditingTimeslot,
  ): void {
    const { editingTimeslot } = context.getState();
    if (editingTimeslot) {
      context.patchState({
        editingTimeslot: { ...editingTimeslot, ...timeslotPartial },
      });
    }
  }

  @Action(StopEditingTimeslot)
  stopEditingTimeslot(context: PlanningContext): void {
    context.patchState({ editingTimeslot: null });
  }

  @Action(DeleteTimeslot)
  deleteTimeslot(
    context: PlanningContext,
    { timeslotId }: DeleteTimeslot,
  ): Observable<void> {
    return this.timeslotService.deleteTimeslot(timeslotId).pipe(
      tap(() => {
        const { timeslotsById, appointmentsById, editingTimeslot } =
          context.getState();
        context.patchState({
          editingTimeslot:
            editingTimeslot?.timeslotId === timeslotId ? null : editingTimeslot,
          timeslotsById: indexBy(
            Object.values(timeslotsById).filter(
              (timeslot) => timeslot.timeslotId !== timeslotId,
            ),
            (timeslot) => timeslot.timeslotId,
          ),
          appointmentsById: indexBy(
            Object.values(appointmentsById).filter(
              (appointment) => appointment.timeslotId !== timeslotId,
            ),
            (appointment) => appointment.appointmentId,
          ),
        });
      }),
    );
  }

  @Action(CreateAppointment)
  createAppointment(
    context: PlanningContext,
    { timeslotId, week }: CreateAppointment,
  ): Observable<Appointment> {
    return this.timeslotService
      .createAppointment(timeslotId, week)
      .pipe(tap((appointment) => this.upsertAppointment(context, appointment)));
  }

  @Action(SetAvailability)
  setAvailability(
    context: PlanningContext,
    { appointmentId, availability }: SetAvailability,
  ): Observable<Appointment> {
    return this.timeslotService
      .setAvailability(appointmentId, availability)
      .pipe(tap((appointment) => this.upsertAppointment(context, appointment)));
  }

  @Action(RemoveAvailability)
  removeAvailability(
    context: PlanningContext,
    { appointmentId, memberId }: RemoveAvailability,
  ): Observable<Appointment> {
    return this.timeslotService
      .removeAvailability(appointmentId, memberId)
      .pipe(tap((appointment) => this.upsertAppointment(context, appointment)));
  }

  @Action(SetProspect)
  setProspect(
    context: PlanningContext,
    { appointmentId, prospectId }: SetProspect,
  ): Observable<Appointment> {
    return this.timeslotService
      .setProspect(appointmentId, prospectId)
      .pipe(tap((appointment) => this.upsertAppointment(context, appointment)));
  }

  @Action(RemoveProspect)
  removeProspect(
    context: PlanningContext,
    { appointmentId }: RemoveProspect,
  ): Observable<Appointment> {
    return this.timeslotService
      .setProspect(appointmentId)
      .pipe(tap((appointment) => this.upsertAppointment(context, appointment)));
  }

  @Action(ConfirmMember)
  confirmMember(
    context: PlanningContext,
    { appointmentId, memberId }: ConfirmMember,
  ): Observable<Appointment> {
    return this.updateConfirmedUsers(context, appointmentId, (ids) => [
      ...new Set([...ids, memberId]),
    ]);
  }

  @Action(UnconfirmMember)
  unconfirmMember(
    context: PlanningContext,
    { appointmentId, memberId }: UnconfirmMember,
  ): Observable<Appointment> {
    return this.updateConfirmedUsers(context, appointmentId, (ids) =>
      ids.filter((id) => id !== memberId),
    );
  }

  private updateConfirmedUsers(
    context: PlanningContext,
    appointmentId: string,
    getConfirmedUserIds: (current: string[]) => string[],
  ): Observable<Appointment> {
    const appointment = context.getState().appointmentsById[appointmentId];
    if (!appointment) {
      return throwError(
        () => new Error(appointmentNotFoundMessage(appointmentId)),
      );
    }

    return this.timeslotService
      .setConfirmedUsers(
        appointmentId,
        getConfirmedUserIds(appointment.confirmedUserIds),
      )
      .pipe(tap((updated) => this.upsertAppointment(context, updated)));
  }

  private upsertTimeslot(context: PlanningContext, timeslot: Timeslot): void {
    context.patchState({
      timeslotsById: {
        ...context.getState().timeslotsById,
        [timeslot.timeslotId]: timeslot,
      },
    });
  }

  private upsertAppointment(
    context: PlanningContext,
    appointment: Appointment,
  ): void {
    context.patchState({
      appointmentsById: {
        ...context.getState().appointmentsById,
        [appointment.appointmentId]: appointment,
      },
    });
  }
}
