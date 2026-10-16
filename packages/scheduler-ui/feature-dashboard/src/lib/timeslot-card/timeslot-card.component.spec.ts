import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Timeslot } from '@org/models';
import { TimeslotDraft } from '@org/scheduler-ui/data';
import {
  CreateTimeslot,
  PlanningState,
  StartEditingTimeslot,
} from '@org/scheduler-ui/state';
import { firstValueFrom } from 'rxjs';
import { Animations, CommonTest } from '../../test-utils/common-test';
import { provideTestState } from '../../test-utils/provide-test-state';
import {
  TimeslotCardComponent,
  formatTimeRange,
} from './timeslot-card.component';
import { EDITOR_SELECTOR, TimeslotCardHarness } from './timeslot-card.harness';

const OTHER_TIMESLOT_ID = 'other-timeslot';

function createTimeslotDraft(
  overrides: Partial<TimeslotDraft> = {},
): TimeslotDraft {
  return {
    start: '09:00',
    end: '10:30',
    dayOfWeek: 1,
    ...overrides,
  };
}

interface SetupOptions {
  draft?: TimeslotDraft;
  /** Starts editing the timeslot before the card is created, as when a card is recreated on another day */
  alreadyEditing?: boolean;
  /** Runs the enter and leave animations, which TestBed disables unless asked */
  animated?: boolean;
}

async function setup({
  draft = createTimeslotDraft(),
  alreadyEditing = false,
  animated = false,
}: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [TimeslotCardComponent],
    providers: [provideTestState()],
  }).compileComponents();
  const animations = animated ? CommonTest.withAnimations() : undefined;

  const store = TestBed.inject(Store);
  await firstValueFrom(store.dispatch(new CreateTimeslot(draft)));
  const timeslot = store.selectSnapshot(PlanningState.timeslots)[0];

  if (alreadyEditing) {
    await firstValueFrom(
      store.dispatch(new StartEditingTimeslot(timeslot.timeslotId)),
    );
  }

  const fixture = TestBed.createComponent(TimeslotCardComponent);
  fixture.componentRef.setInput('timeslot', timeslot);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    TimeslotCardHarness,
  );

  return {
    fixture,
    harness,
    store,
    timeslot,
    /** The animations of a test that was set up as `animated` */
    getAnimations: (): Animations => {
      if (!animations) {
        throw new Error('The test was not set up with animated: true');
      }
      return animations;
    },
    getSavedTimeslot: (): Timeslot =>
      store.selectSnapshot(PlanningState.timeslots)[0],
  };
}

describe('TimeslotCardComponent', () => {
  it('should display the time range of the timeslot', async () => {
    const { harness, timeslot } = await setup();

    expect(await harness.getTimeRange()).toBe(formatTimeRange(timeslot));
  });

  it('should update when the timeslot changes', async () => {
    const { fixture, harness, timeslot } = await setup();
    const next: Timeslot = { ...timeslot, start: '18:00', end: '19:00' };

    fixture.componentRef.setInput('timeslot', next);

    expect(await harness.getTimeRange()).toBe(formatTimeRange(next));
  });

  describe('edit mode', () => {
    it('should not be editing by default', async () => {
      const { harness } = await setup();

      expect(await harness.isEditing()).toBe(false);
    });

    it('should toggle editing on and off', async () => {
      const { harness } = await setup();

      await harness.toggleEditing();
      expect(await harness.isEditing()).toBe(true);

      await harness.toggleEditing();
      expect(await harness.isEditing()).toBe(false);
    });

    it('should stop editing when another timeslot starts being edited', async () => {
      const { harness, store } = await setup();
      await harness.toggleEditing();

      store.dispatch(new StartEditingTimeslot(OTHER_TIMESLOT_ID));

      expect(await harness.isEditing()).toBe(false);
    });

    it('should discard unsaved times when another timeslot starts being edited', async () => {
      const { harness, store, timeslot } = await setup();
      await harness.toggleEditing();
      await harness.setStartTime('11:00');

      store.dispatch(new StartEditingTimeslot(OTHER_TIMESLOT_ID));
      await harness.toggleEditing();

      expect(await harness.getStartTime()).toBe(timeslot.start);
      expect(await harness.hasStartTimeError()).toBe(false);
    });

    describe('animations', () => {
      it('should animate the editor in when editing starts', async () => {
        const { harness } = await setup({ animated: true });

        await harness.toggleEditing();

        expect(await harness.isEditorAnimating()).toBe(true);
      });

      it('should not animate the editor in when the card is created while its timeslot is being edited', async () => {
        const { harness } = await setup({
          alreadyEditing: true,
          animated: true,
        });

        expect(await harness.isEditing()).toBe(true);
        expect(await harness.isEditorAnimating()).toBe(false);
      });

      it('should keep animating the editor when something inside it finishes its own animation', async () => {
        const { fixture, harness, getAnimations } = await setup({
          animated: true,
        });
        await harness.toggleEditing();

        // Material and the CDK animate parts of the form fields, and those events bubble up
        getAnimations().end(fixture.nativeElement.querySelector('input'));

        expect(await harness.isEditorAnimating()).toBe(true);
      });

      it('should stop animating the editor once the editor finishes its animation', async () => {
        const { fixture, harness, getAnimations } = await setup({
          animated: true,
        });
        await harness.toggleEditing();

        getAnimations().end(
          fixture.nativeElement.querySelector(EDITOR_SELECTOR),
        );

        expect(await harness.isEditorAnimating()).toBe(false);
      });

      it('should animate the editor out when editing ends', async () => {
        const { harness } = await setup({ animated: true });
        await harness.toggleEditing();

        await harness.toggleEditing();

        expect(await harness.isEditorAnimating()).toBe(true);
      });
    });

    it('should show a drag handle only while editing', async () => {
      const { harness } = await setup();
      expect(await harness.hasDragHandle()).toBe(false);

      await harness.toggleEditing();
      expect(await harness.hasDragHandle()).toBe(true);

      await harness.toggleEditing();
      expect(await harness.hasDragHandle()).toBe(false);
    });

    it('should show the start and end time of the timeslot', async () => {
      const { harness, timeslot } = await setup();

      await harness.toggleEditing();

      expect(await harness.getStartTime()).toBe(timeslot.start);
      expect(await harness.getEndTime()).toBe(timeslot.end);
    });

    it('should save a changed start time without being asked', async () => {
      const { harness, timeslot, getSavedTimeslot } = await setup();
      await harness.toggleEditing();

      await harness.setStartTime('08:30');

      expect(getSavedTimeslot()).toEqual({ ...timeslot, start: '08:30' });
      expect(await harness.hasStartTimeError()).toBe(false);
    });

    it('should save a changed end time without being asked', async () => {
      const { harness, timeslot, getSavedTimeslot } = await setup();
      await harness.toggleEditing();

      await harness.setEndTime('11:45');

      expect(getSavedTimeslot()).toEqual({ ...timeslot, end: '11:45' });
      expect(await harness.hasEndTimeError()).toBe(false);
    });

    describe('with an invalid time range', () => {
      it.each([
        ['after', '11:00'],
        ['equal to', '10:30'],
      ])(
        'should show the start time as an error and not save it when it is %s the end',
        async (_relation, start) => {
          const { harness, timeslot, getSavedTimeslot } = await setup();
          await harness.toggleEditing();

          await harness.setStartTime(start);

          expect(await harness.hasStartTimeError()).toBe(true);
          expect(await harness.hasEndTimeError()).toBe(false);
          expect(getSavedTimeslot()).toEqual(timeslot);
        },
      );

      it.each([
        ['before', '08:00'],
        ['equal to', '09:00'],
      ])(
        'should show the end time as an error and not save it when it is %s the start',
        async (_relation, end) => {
          const { harness, timeslot, getSavedTimeslot } = await setup();
          await harness.toggleEditing();

          await harness.setEndTime(end);

          expect(await harness.hasEndTimeError()).toBe(true);
          expect(await harness.hasStartTimeError()).toBe(false);
          expect(getSavedTimeslot()).toEqual(timeslot);
        },
      );

      it('should save and clear the error once the other time makes the range valid', async () => {
        const { harness, timeslot, getSavedTimeslot } = await setup();
        await harness.toggleEditing();
        await harness.setStartTime('11:00');

        await harness.setEndTime('12:00');

        expect(await harness.hasStartTimeError()).toBe(false);
        expect(await harness.hasEndTimeError()).toBe(false);
        expect(getSavedTimeslot()).toEqual({
          ...timeslot,
          start: '11:00',
          end: '12:00',
        });
      });

      it('should show a cleared time as an error and not save it', async () => {
        const { harness, timeslot, getSavedTimeslot } = await setup();
        await harness.toggleEditing();

        await harness.setStartTime('');

        expect(await harness.hasStartTimeError()).toBe(true);
        expect(getSavedTimeslot()).toEqual(timeslot);
      });

      it('should discard the unsaved times when editing is closed', async () => {
        const { harness, timeslot } = await setup();
        await harness.toggleEditing();
        await harness.setStartTime('11:00');

        await harness.toggleEditing();
        await harness.toggleEditing();

        expect(await harness.getStartTime()).toBe(timeslot.start);
        expect(await harness.hasStartTimeError()).toBe(false);
      });
    });
  });
});
