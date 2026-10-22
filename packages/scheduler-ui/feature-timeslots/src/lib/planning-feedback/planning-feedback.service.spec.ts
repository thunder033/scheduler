import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { Store } from '@ngxs/store';
import { Timeslot } from '@scheduler/models';
import { TimeslotService } from '@scheduler/ui/data';
import { LoadTimeslots, UpdateTimeslot } from '@scheduler/ui/state';
import { Observable, of, Subject, throwError } from 'rxjs';
import { provideTestState } from '@scheduler/ui/test-utils';
import {
  DISMISS_LABEL,
  PlanningFeedbackService,
  SAVED_MESSAGE,
  SAVING_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
} from './planning-feedback.service';
import { mockTimeslot } from '@scheduler/ui/data/testing';

const OPERATION_ERROR_MESSAGE = 'The server could not be reached';

/** A test scene that starts the feedback the way the dashboard does */
@Component({ template: '' })
class FeedbackScene {
  constructor() {
    inject(PlanningFeedbackService);
  }
}

async function setup() {
  await TestBed.configureTestingModule({
    imports: [FeedbackScene],
    providers: [provideTestState()],
  }).compileComponents();

  const fixture = TestBed.createComponent(FeedbackScene);
  const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  const store = TestBed.inject(Store);
  const timeslotService = TestBed.inject(TimeslotService);

  return {
    timeslotService,
    /** Dispatches the action, ignoring its outcome since the feedback is what's under test */
    dispatch: (action: object) =>
      store.dispatch(action).subscribe({ error: () => undefined }),
    /** Makes timeslot updates stay in flight until the returned subject is completed */
    holdUpdates: () => {
      const response = new Subject<Timeslot>();
      vi.spyOn(timeslotService, 'updateTimeslot').mockImplementation(
        () => response as Observable<Timeslot>,
      );
      return response;
    },
    getSnackBar: () => loader.getHarnessOrNull(MatSnackBarHarness),
  };
}

describe('PlanningFeedbackService', () => {
  describe('while saving changes', () => {
    it('shows that changes are being saved', async () => {
      const { dispatch, holdUpdates, getSnackBar } = await setup();
      holdUpdates();

      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));

      expect(await (await getSnackBar())?.getMessage()).toBe(SAVING_MESSAGE);
    });

    it('stops showing it once the changes are saved', async () => {
      const { dispatch, holdUpdates, getSnackBar } = await setup();
      const response = holdUpdates();
      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));

      response.next(mockTimeslot.MONDAY_MORNING);
      response.complete();

      expect(await (await getSnackBar())?.getMessage()).not.toBe(
        SAVING_MESSAGE,
      );
    });

    it('keeps showing it until every save has finished', async () => {
      const { dispatch, timeslotService, getSnackBar } = await setup();
      const responses = [new Subject<Timeslot>(), new Subject<Timeslot>()];
      vi.spyOn(timeslotService, 'updateTimeslot')
        .mockReturnValueOnce(responses[0])
        .mockReturnValueOnce(responses[1]);
      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));
      dispatch(new UpdateTimeslot('timeslot-2', { start: '08:00' }));

      responses[0].next(mockTimeslot.MONDAY_MORNING);
      responses[0].complete();
      expect(await (await getSnackBar())?.getMessage()).toBe(SAVING_MESSAGE);

      responses[1].next(mockTimeslot.WEDNESDAY_EVENING);
      responses[1].complete();
      expect(await (await getSnackBar())?.getMessage()).not.toBe(
        SAVING_MESSAGE,
      );
    });

    it('does not show it while data is only being loaded', async () => {
      const { dispatch, timeslotService, getSnackBar } = await setup();
      vi.spyOn(timeslotService, 'getTimeslots').mockReturnValue(
        new Subject<Timeslot[]>(),
      );

      dispatch(new LoadTimeslots());

      expect(await getSnackBar()).toBeNull();
    });
  });

  describe('when changes are saved', () => {
    it('tells the user once the changes are saved', async () => {
      const { dispatch, holdUpdates, getSnackBar } = await setup();
      const response = holdUpdates();
      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));

      response.next(mockTimeslot.MONDAY_MORNING);
      response.complete();

      expect(await (await getSnackBar())?.getMessage()).toBe(SAVED_MESSAGE);
    });

    it('does not tell the user while changes are still being saved', async () => {
      const { dispatch, holdUpdates, getSnackBar } = await setup();
      holdUpdates();

      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));

      expect(await (await getSnackBar())?.getMessage()).not.toBe(SAVED_MESSAGE);
    });

    it('tells the user only once every save has finished', async () => {
      const { dispatch, timeslotService, getSnackBar } = await setup();
      const responses = [new Subject<Timeslot>(), new Subject<Timeslot>()];
      vi.spyOn(timeslotService, 'updateTimeslot')
        .mockReturnValueOnce(responses[0])
        .mockReturnValueOnce(responses[1]);
      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));
      dispatch(new UpdateTimeslot('timeslot-2', { start: '08:00' }));

      responses[0].next(mockTimeslot.MONDAY_MORNING);
      responses[0].complete();
      expect(await (await getSnackBar())?.getMessage()).toBe(SAVING_MESSAGE);

      responses[1].next(mockTimeslot.WEDNESDAY_EVENING);
      responses[1].complete();
      expect(await (await getSnackBar())?.getMessage()).toBe(SAVED_MESSAGE);
    });

    it('does not tell the user when the changes failed to save', async () => {
      const { dispatch, timeslotService, getSnackBar } = await setup();
      vi.spyOn(timeslotService, 'updateTimeslot').mockReturnValue(
        throwError(() => new Error(OPERATION_ERROR_MESSAGE)),
      );

      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));

      expect(await (await getSnackBar())?.getMessage()).toBe(
        OPERATION_ERROR_MESSAGE,
      );
    });

    it('does not tell the user when only some of the changes saved', async () => {
      const { dispatch, timeslotService, getSnackBar } = await setup();
      const responses = [new Subject<Timeslot>(), new Subject<Timeslot>()];
      vi.spyOn(timeslotService, 'updateTimeslot')
        .mockReturnValueOnce(responses[0])
        .mockReturnValueOnce(responses[1]);
      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));
      dispatch(new UpdateTimeslot('timeslot-2', { start: '08:00' }));

      responses[0].error(new Error(OPERATION_ERROR_MESSAGE));
      responses[1].next(mockTimeslot.WEDNESDAY_EVENING);
      responses[1].complete();

      expect(await (await getSnackBar())?.getMessage()).not.toBe(SAVED_MESSAGE);
    });

    it('tells the user about a later save after an earlier one failed', async () => {
      const { dispatch, timeslotService, getSnackBar } = await setup();
      vi.spyOn(timeslotService, 'updateTimeslot')
        .mockReturnValueOnce(
          throwError(() => new Error(OPERATION_ERROR_MESSAGE)),
        )
        .mockReturnValueOnce(of(mockTimeslot.MONDAY_MORNING));
      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));

      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:30' }));

      expect(await (await getSnackBar())?.getMessage()).toBe(SAVED_MESSAGE);
    });
  });

  describe('when an operation fails', () => {
    it('shows the error message with a way to dismiss it', async () => {
      const { dispatch, timeslotService, getSnackBar } = await setup();
      vi.spyOn(timeslotService, 'updateTimeslot').mockReturnValue(
        throwError(() => new Error(OPERATION_ERROR_MESSAGE)),
      );

      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));

      const snackBar = await getSnackBar();
      expect(await snackBar?.getMessage()).toBe(OPERATION_ERROR_MESSAGE);
      expect(await snackBar?.getActionDescription()).toBe(DISMISS_LABEL);
    });

    it('replaces the saving message with the error', async () => {
      const { dispatch, holdUpdates, getSnackBar } = await setup();
      const response = holdUpdates();
      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));

      response.error(new Error(OPERATION_ERROR_MESSAGE));

      expect(await (await getSnackBar())?.getMessage()).toBe(
        OPERATION_ERROR_MESSAGE,
      );
    });

    it('shows errors from loading data', async () => {
      const { dispatch, timeslotService, getSnackBar } = await setup();
      vi.spyOn(timeslotService, 'getTimeslots').mockReturnValue(
        throwError(() => new Error(OPERATION_ERROR_MESSAGE)),
      );

      dispatch(new LoadTimeslots());

      expect(await (await getSnackBar())?.getMessage()).toBe(
        OPERATION_ERROR_MESSAGE,
      );
    });

    it('shows a generic message when the failure is not an error', async () => {
      const { dispatch, timeslotService, getSnackBar } = await setup();
      vi.spyOn(timeslotService, 'updateTimeslot').mockReturnValue(
        throwError(() => OPERATION_ERROR_MESSAGE),
      );

      dispatch(new UpdateTimeslot('timeslot-1', { start: '08:00' }));

      expect(await (await getSnackBar())?.getMessage()).toBe(
        UNKNOWN_ERROR_MESSAGE,
      );
    });
  });
});
