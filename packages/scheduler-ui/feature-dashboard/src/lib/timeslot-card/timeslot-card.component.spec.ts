import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Timeslot } from '@org/models';
import { TimeslotDraft } from '@org/scheduler-ui/data';
import {
  CreateTimeslot,
  NEW_TIMESLOT,
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
const OTHER_START = '13:00';
const OTHER_END = '14:00';

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

  const getSavedTimeslot = (): Timeslot =>
    store.selectSnapshot(PlanningState.timeslots)[0];
  const createCard = async (cardTimeslot: Timeslot) => {
    const cardFixture = TestBed.createComponent(TimeslotCardComponent);
    cardFixture.componentRef.setInput('timeslot', cardTimeslot);
    const cardHarness = await TestbedHarnessEnvironment.harnessForFixture(
      cardFixture,
      TimeslotCardHarness,
    );
    return { fixture: cardFixture, harness: cardHarness };
  };
  const { fixture, harness } = await createCard(timeslot);

  return {
    fixture,
    harness,
    store,
    timeslot,
    createCard,
    /** Replaces the card with a new one for the timeslot, as when a card moves to another day */
    recreateCard: async () => {
      fixture.destroy();
      return (await createCard(getSavedTimeslot())).harness;
    },
    /** The animations of a test that was set up as `animated` */
    getAnimations: (): Animations => {
      if (!animations) {
        throw new Error('The test was not set up with animated: true');
      }
      return animations;
    },
    getSavedTimeslot,
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

    it('should not save a changed time until asked to', async () => {
      const { harness, timeslot, getSavedTimeslot } = await setup();
      await harness.toggleEditing();

      await harness.setStartTime('08:30');

      expect(getSavedTimeslot()).toEqual(timeslot);
    });

    it('should save a changed start time when asked to', async () => {
      const { harness, timeslot, getSavedTimeslot } = await setup();
      await harness.toggleEditing();
      await harness.setStartTime('08:30');

      await harness.save();

      expect(getSavedTimeslot()).toEqual({ ...timeslot, start: '08:30' });
    });

    it('should save a changed end time when asked to', async () => {
      const { harness, timeslot, getSavedTimeslot } = await setup();
      await harness.toggleEditing();
      await harness.setEndTime('11:45');

      await harness.save();

      expect(getSavedTimeslot()).toEqual({ ...timeslot, end: '11:45' });
    });

    it('should only allow saving once a time has changed', async () => {
      const { harness } = await setup();
      await harness.toggleEditing();
      expect(await harness.canSave()).toBe(false);

      await harness.setStartTime('08:30');

      expect(await harness.canSave()).toBe(true);
    });

    it('should stop editing once the changes are saved', async () => {
      const { harness } = await setup();
      await harness.toggleEditing();
      await harness.setStartTime('08:30');

      await harness.save();

      expect(await harness.isEditing()).toBe(false);
    });

    it('should show the saved times after the changes are saved', async () => {
      const { fixture, harness, getSavedTimeslot } = await setup();
      await harness.toggleEditing();
      await harness.setStartTime('08:30');

      await harness.save();
      // The planner passes the saved timeslot back to the card
      fixture.componentRef.setInput('timeslot', getSavedTimeslot());

      expect(await harness.getTimeRange()).toBe(
        formatTimeRange(getSavedTimeslot()),
      );
    });

    describe('when the card is recreated', () => {
      it('should keep the unsaved times', async () => {
        const { harness, recreateCard } = await setup();
        await harness.toggleEditing();
        await harness.setStartTime('08:30');
        await harness.setEndTime('09:45');

        const recreated = await recreateCard();

        expect(await recreated.getStartTime()).toBe('08:30');
        expect(await recreated.getEndTime()).toBe('09:45');
        expect(await recreated.canSave()).toBe(true);
      });

      it('should not use the unsaved times for another timeslot that is edited', async () => {
        const { harness, store, createCard } = await setup();
        await firstValueFrom(
          store.dispatch(
            new CreateTimeslot(
              createTimeslotDraft({ start: OTHER_START, end: OTHER_END }),
            ),
          ),
        );
        const other = store
          .selectSnapshot(PlanningState.timeslots)
          .find((candidate) => candidate.start === OTHER_START);
        if (!other) {
          throw new Error('The other timeslot was not created');
        }
        await harness.toggleEditing();
        await harness.setStartTime('08:30');

        await firstValueFrom(
          store.dispatch(new StartEditingTimeslot(other.timeslotId)),
        );
        const { harness: otherHarness } = await createCard(other);

        expect(await otherHarness.getStartTime()).toBe(OTHER_START);
        expect(await otherHarness.getEndTime()).toBe(OTHER_END);
      });

      it('should discard the unsaved times when editing is closed', async () => {
        const { harness, recreateCard } = await setup();
        await harness.toggleEditing();
        await harness.setStartTime('08:30');
        const recreated = await recreateCard();

        await recreated.toggleEditing();
        await recreated.toggleEditing();

        expect(await recreated.getStartTime()).not.toBe('08:30');
      });
    });

    it('should not allow saving once the times are changed back', async () => {
      const { harness, timeslot } = await setup();
      await harness.toggleEditing();
      await harness.setStartTime('08:30');

      await harness.setStartTime(timeslot.start);

      expect(await harness.canSave()).toBe(false);
    });

    describe('with an invalid time range', () => {
      it.each([
        ['after', '11:00'],
        ['equal to', '10:30'],
      ])(
        'should show the start time as an error and not allow saving it when it is %s the end',
        async (_relation, start) => {
          const { harness } = await setup();
          await harness.toggleEditing();

          await harness.setStartTime(start);

          expect(await harness.hasStartTimeError()).toBe(true);
          expect(await harness.hasEndTimeError()).toBe(false);
          expect(await harness.canSave()).toBe(false);
        },
      );

      it.each([
        ['before', '08:00'],
        ['equal to', '09:00'],
      ])(
        'should show the end time as an error and not allow saving it when it is %s the start',
        async (_relation, end) => {
          const { harness } = await setup();
          await harness.toggleEditing();

          await harness.setEndTime(end);

          expect(await harness.hasEndTimeError()).toBe(true);
          expect(await harness.hasStartTimeError()).toBe(false);
          expect(await harness.canSave()).toBe(false);
        },
      );

      it('should clear the error and allow saving once the other time makes the range valid', async () => {
        const { harness, timeslot, getSavedTimeslot } = await setup();
        await harness.toggleEditing();
        await harness.setStartTime('11:00');

        await harness.setEndTime('12:00');
        await harness.save();

        expect(getSavedTimeslot()).toEqual({
          ...timeslot,
          start: '11:00',
          end: '12:00',
        });
      });

      it('should show a cleared time as an error and not allow saving it', async () => {
        const { harness } = await setup();
        await harness.toggleEditing();

        await harness.setStartTime('');

        expect(await harness.hasStartTimeError()).toBe(true);
        expect(await harness.canSave()).toBe(false);
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

  describe('deleting the timeslot', () => {
    it('should only offer to delete while editing', async () => {
      const { harness } = await setup({ alreadyEditing: true });
      expect(await harness.canDelete()).toBe(true);

      await harness.toggleEditing();

      expect(await harness.canDelete()).toBe(false);
    });

    it('should not offer to delete a timeslot that is not created yet', async () => {
      const { store, createCard } = await setup();
      await firstValueFrom(
        store.dispatch(new StartEditingTimeslot(NEW_TIMESLOT.timeslotId)),
      );
      const { harness } = await createCard(NEW_TIMESLOT);

      expect(await harness.isEditing()).toBe(true);
      expect(await harness.canDelete()).toBe(false);
    });

    it('should ask for confirmation without deleting the timeslot', async () => {
      const { harness, store } = await setup({ alreadyEditing: true });

      await harness.requestDelete();

      expect(await harness.isConfirmingDelete()).toBe(true);
      expect(store.selectSnapshot(PlanningState.timeslots)).toHaveLength(1);
    });

    it('should delete the timeslot once it is confirmed', async () => {
      const { harness, store } = await setup({ alreadyEditing: true });
      await harness.requestDelete();

      await harness.confirmDelete();

      expect(await harness.isConfirmingDelete()).toBe(false);
      expect(store.selectSnapshot(PlanningState.timeslots)).toEqual([]);
    });

    it('should keep the timeslot when the deletion is cancelled', async () => {
      const { harness, store, timeslot } = await setup({
        alreadyEditing: true,
      });
      await harness.requestDelete();

      await harness.cancelDelete();

      expect(await harness.isConfirmingDelete()).toBe(false);
      expect(store.selectSnapshot(PlanningState.timeslots)).toEqual([timeslot]);
      expect(await harness.isEditing()).toBe(true);
    });
  });
});
