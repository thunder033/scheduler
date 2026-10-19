import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Timeslot } from '@org/models';
import { TimeslotDraft, TimeslotService } from '@org/scheduler-ui/data';
import { CreateTimeslot, NEW_TIMESLOT } from '@org/scheduler-ui/state';
import { firstValueFrom } from 'rxjs';
import { CommonTest } from '../../test-utils/common-test';
import { provideTestState } from '../../test-utils/provide-test-state';
import {
  formatTimeRange,
  NEW_TIMESLOT_LABEL,
} from '../timeslot-card/timeslot-card.component';
import { CARD_HEADER_SELECTOR } from '../timeslot-card/timeslot-card.harness';
import {
  DAY_LABELS,
  TimeslotPlannerComponent,
} from './timeslot-planner.component';
import { TimeslotPlannerHarness } from './timeslot-planner.harness';

const SUNDAY = 7;

/** Days of the week none of the seeded timeslots use */
const UNSEEDED_DAY = 2;
const OTHER_UNSEEDED_DAY = 4;

function createTimeslotDraft(
  overrides: Partial<TimeslotDraft> = {},
): TimeslotDraft {
  return {
    start: '13:00',
    end: '14:00',
    dayOfWeek: UNSEEDED_DAY,
    ...overrides,
  };
}

function getRanges(timeslots: Timeslot[], dayOfWeek: number): string[] {
  return timeslots
    .filter((timeslot) => timeslot.dayOfWeek === dayOfWeek)
    .sort((first, second) => first.start.localeCompare(second.start))
    .map(formatTimeRange);
}

type Grip = 'header' | 'body';

/** Puts the timeslot's card in edit mode, which is what allows it to be dragged */
async function toggleEditing(
  harness: TimeslotPlannerHarness,
  timeslot: Timeslot,
): Promise<void> {
  await harness.toggleTimeslotEditing(
    DAY_LABELS[timeslot.dayOfWeek],
    formatTimeRange(timeslot),
  );
}

interface SetupOptions {
  /** Runs the enter and leave animations, which TestBed disables unless asked */
  animated?: boolean;
}

async function setup(
  drafts: TimeslotDraft[] = [],
  { animated = false }: SetupOptions = {},
) {
  await TestBed.configureTestingModule({
    imports: [TimeslotPlannerComponent],
    providers: [provideTestState()],
  }).compileComponents();
  if (animated) {
    CommonTest.withAnimations();
  }

  const timeslotService = TestBed.inject(TimeslotService);
  const created: Timeslot[] = [];
  for (const draft of drafts) {
    created.push(await firstValueFrom(timeslotService.createTimeslot(draft)));
  }

  const fixture = TestBed.createComponent(TimeslotPlannerComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    TimeslotPlannerHarness,
  );

  const dragAndDrop = CommonTest.withDragAndDrop(fixture);
  const getCard = ({ timeslotId }: Pick<Timeslot, 'timeslotId'>) =>
    harness.getTimeslotCard(timeslotId);
  /** Only the card's header drags the card, so grabbing its body does nothing */
  const getGrip = (grip: Grip) =>
    grip === 'header' ? CARD_HEADER_SELECTOR : undefined;

  return {
    harness,
    created,
    store: TestBed.inject(Store),
    getServiceTimeslots: () => firstValueFrom(timeslotService.getTimeslots()),
    /** Picks up the timeslot's card with the mouse and holds it, still within its own day */
    pickUpTimeslot: async (timeslot: Timeslot, grip: Grip = 'header') =>
      dragAndDrop.pickUp(await getCard(timeslot), { grip: getGrip(grip) }),
    pickUpNewTimeslot: async () =>
      dragAndDrop.pickUp(await getCard(NEW_TIMESLOT), {
        grip: CARD_HEADER_SELECTOR,
      }),
    /** Drags the card of the new timeslot with the mouse onto the column of the day */
    dragNewTimeslotToDay: async (dayOfWeek: number) =>
      dragAndDrop.dragTo(
        await getCard(NEW_TIMESLOT),
        await harness.getDay(dayOfWeek),
        { grip: CARD_HEADER_SELECTOR },
      ),
    /** Drags the timeslot's card with the mouse onto the column of the day */
    dragTimeslotToDay: async (
      timeslot: Timeslot,
      dayOfWeek: number,
      grip: Grip = 'header',
    ) =>
      dragAndDrop.dragTo(
        await getCard(timeslot),
        await harness.getDay(dayOfWeek),
        { grip: getGrip(grip) },
      ),
  };
}

describe('TimeslotPlannerComponent', () => {
  it('should list every timeslot under the label of its day of week', async () => {
    const { harness, getServiceTimeslots } = await setup([
      createTimeslotDraft(),
    ]);
    const timeslots = await getServiceTimeslots();

    for (const { dayOfWeek } of timeslots) {
      expect(await harness.getTimeRanges(DAY_LABELS[dayOfWeek])).toEqual(
        getRanges(timeslots, dayOfWeek),
      );
    }
  });

  it('should always list all seven days from Monday to Sunday', async () => {
    const { harness } = await setup();

    expect(await harness.getDayLabels()).toEqual(
      Object.entries(DAY_LABELS)
        .sort(([first], [second]) => Number(first) - Number(second))
        .map(([, label]) => label),
    );
    expect((await harness.getDayLabels()).at(-1)).toBe(DAY_LABELS[SUNDAY]);
  });

  it('should list days without timeslots as empty', async () => {
    const { harness } = await setup();

    expect(await harness.getTimeRanges(DAY_LABELS[OTHER_UNSEEDED_DAY])).toEqual(
      [],
    );
  });

  it('should order the timeslots within a day by start time', async () => {
    const later = createTimeslotDraft({ start: '15:00', end: '16:00' });
    const earlier = createTimeslotDraft({ start: '08:00', end: '09:00' });
    const { harness } = await setup([later, earlier]);

    expect(await harness.getTimeRanges(DAY_LABELS[UNSEEDED_DAY])).toEqual([
      formatTimeRange(earlier),
      formatTimeRange(later),
    ]);
  });

  it('should list timeslots created after it was rendered', async () => {
    const { harness, store } = await setup();
    const draft = createTimeslotDraft();

    store.dispatch(new CreateTimeslot(draft));

    expect(await harness.getTimeRanges(DAY_LABELS[draft.dayOfWeek])).toEqual([
      formatTimeRange(draft),
    ]);
  });

  describe('editing a timeslot', () => {
    it('should only let one timeslot be edited at a time', async () => {
      const first = createTimeslotDraft({ start: '08:00', end: '09:00' });
      const second = createTimeslotDraft({ start: '10:00', end: '11:00' });
      const { harness, created } = await setup([first, second]);
      const [firstTimeslot, secondTimeslot] = created;
      await toggleEditing(harness, firstTimeslot);

      await toggleEditing(harness, secondTimeslot);

      expect(
        await harness.isTimeslotEditing(
          DAY_LABELS[firstTimeslot.dayOfWeek],
          formatTimeRange(firstTimeslot),
        ),
      ).toBe(false);
      expect(
        await harness.isTimeslotEditing(
          DAY_LABELS[secondTimeslot.dayOfWeek],
          formatTimeRange(secondTimeslot),
        ),
      ).toBe(true);
    });
  });

  describe('dragging a timeslot to another day', () => {
    it('should not replay the editing animations for a timeslot that is moved', async () => {
      const { dragTimeslotToDay, harness, created } = await setup(
        [createTimeslotDraft()],
        { animated: true },
      );
      const [timeslot] = created;
      await toggleEditing(harness, timeslot);

      await dragTimeslotToDay(timeslot, OTHER_UNSEEDED_DAY);

      expect(
        await harness.isTimeslotEditorAnimating(
          DAY_LABELS[OTHER_UNSEEDED_DAY],
          formatTimeRange(timeslot),
        ),
      ).toBe(false);
    });

    it('should keep the timeslot in edit mode after it is moved', async () => {
      const { dragTimeslotToDay, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;
      await toggleEditing(harness, timeslot);

      await dragTimeslotToDay(timeslot, OTHER_UNSEEDED_DAY);

      expect(
        await harness.isTimeslotEditing(
          DAY_LABELS[OTHER_UNSEEDED_DAY],
          formatTimeRange(timeslot),
        ),
      ).toBe(true);
    });

    it('should not move a timeslot that is not being edited', async () => {
      const { dragTimeslotToDay, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;

      await dragTimeslotToDay(timeslot, OTHER_UNSEEDED_DAY);

      expect(await harness.getTimeRanges(DAY_LABELS[UNSEEDED_DAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
      expect(
        await harness.getTimeRanges(DAY_LABELS[OTHER_UNSEEDED_DAY]),
      ).toEqual([]);
    });

    it('should not highlight drop targets for a timeslot that is not being edited', async () => {
      const { pickUpTimeslot, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;

      await pickUpTimeslot(timeslot);

      expect(await harness.getDropTargetDayLabels()).toEqual([]);
    });

    it('should only move a timeslot that is dragged by its header', async () => {
      const { dragTimeslotToDay, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;
      await toggleEditing(harness, timeslot);

      await dragTimeslotToDay(timeslot, OTHER_UNSEEDED_DAY, 'body');

      expect(await harness.getTimeRanges(DAY_LABELS[UNSEEDED_DAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
    });

    it('should not move a timeslot once it is no longer being edited', async () => {
      const { dragTimeslotToDay, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;
      await toggleEditing(harness, timeslot);
      await toggleEditing(harness, timeslot);

      await dragTimeslotToDay(timeslot, OTHER_UNSEEDED_DAY);

      expect(await harness.getTimeRanges(DAY_LABELS[UNSEEDED_DAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
    });

    it('should highlight the other days as drop targets while dragging', async () => {
      const { pickUpTimeslot, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;
      await toggleEditing(harness, timeslot);
      expect(await harness.getDropTargetDayLabels()).toEqual([]);

      await pickUpTimeslot(timeslot);

      expect(await harness.getDropTargetDayLabels()).toEqual(
        (await harness.getDayLabels()).filter(
          (label) => label !== DAY_LABELS[timeslot.dayOfWeek],
        ),
      );
    });

    it('should stop highlighting the days once the timeslot is dropped', async () => {
      const { dragTimeslotToDay, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;

      await toggleEditing(harness, timeslot);
      await dragTimeslotToDay(timeslot, OTHER_UNSEEDED_DAY);

      expect(await harness.getDropTargetDayLabels()).toEqual([]);
    });

    it('should move the timeslot to the day it is dropped on', async () => {
      const { dragTimeslotToDay, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;

      await toggleEditing(harness, timeslot);
      await dragTimeslotToDay(timeslot, OTHER_UNSEEDED_DAY);

      expect(
        await harness.getTimeRanges(DAY_LABELS[OTHER_UNSEEDED_DAY]),
      ).toEqual([formatTimeRange(timeslot)]);
      expect(await harness.getTimeRanges(DAY_LABELS[UNSEEDED_DAY])).toEqual([]);
    });

    it('should not save the new day until asked to', async () => {
      const { dragTimeslotToDay, harness, created, getServiceTimeslots } =
        await setup([createTimeslotDraft()]);
      const [timeslot] = created;

      await toggleEditing(harness, timeslot);
      await dragTimeslotToDay(timeslot, SUNDAY);

      expect(await harness.getTimeRanges(DAY_LABELS[SUNDAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
      expect(await getServiceTimeslots()).toContainEqual(timeslot);
    });

    it('should save the new day and keep the time when asked to', async () => {
      const { dragTimeslotToDay, harness, created, getServiceTimeslots } =
        await setup([createTimeslotDraft()]);
      const [timeslot] = created;
      await toggleEditing(harness, timeslot);
      await dragTimeslotToDay(timeslot, SUNDAY);

      await harness.saveTimeslot(DAY_LABELS[SUNDAY], formatTimeRange(timeslot));

      expect(await getServiceTimeslots()).toContainEqual({
        ...timeslot,
        dayOfWeek: SUNDAY,
      });
      expect(await harness.getTimeRanges(DAY_LABELS[SUNDAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
    });

    it('should return the timeslot to its day when editing is closed without saving', async () => {
      const { dragTimeslotToDay, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;
      await toggleEditing(harness, timeslot);
      await dragTimeslotToDay(timeslot, SUNDAY);

      await harness.toggleTimeslotEditing(
        DAY_LABELS[SUNDAY],
        formatTimeRange(timeslot),
      );

      expect(await harness.getTimeRanges(DAY_LABELS[UNSEEDED_DAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
      expect(await harness.getTimeRanges(DAY_LABELS[SUNDAY])).toEqual([]);
    });

    it('should leave the timeslot where it is when dropped on its own day', async () => {
      const { dragTimeslotToDay, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;

      await toggleEditing(harness, timeslot);
      await dragTimeslotToDay(timeslot, timeslot.dayOfWeek);

      expect(await harness.getTimeRanges(DAY_LABELS[UNSEEDED_DAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
    });
  });

  describe('creating a timeslot', () => {
    const NEW_TIMES = { start: '09:00', end: '10:00' };

    it('should not show a new timeslot until asked to', async () => {
      const { harness } = await setup();

      expect(await harness.hasFloatingTimeslot()).toBe(false);
    });

    it('should show a new timeslot floating, without a day', async () => {
      const { harness } = await setup();

      await harness.startCreatingTimeslot();

      expect(await harness.hasFloatingTimeslot()).toBe(true);
      for (const label of await harness.getDayLabels()) {
        expect(await harness.getTimeRanges(label)).not.toContain(
          NEW_TIMESLOT_LABEL,
        );
      }
    });

    it('should highlight every day as a drop target while dragging the new timeslot', async () => {
      const { harness, pickUpNewTimeslot } = await setup();
      await harness.startCreatingTimeslot();

      await pickUpNewTimeslot();

      expect(await harness.getDropTargetDayLabels()).toEqual(
        await harness.getDayLabels(),
      );
    });

    it('should list the new timeslot under the day it is dragged to', async () => {
      const { harness, dragNewTimeslotToDay } = await setup();
      await harness.startCreatingTimeslot();

      await dragNewTimeslotToDay(OTHER_UNSEEDED_DAY);

      expect(await harness.hasFloatingTimeslot()).toBe(false);
      expect(
        await harness.getTimeRanges(DAY_LABELS[OTHER_UNSEEDED_DAY]),
      ).toEqual([NEW_TIMESLOT_LABEL]);
      expect(
        await harness.isTimeslotEditing(
          DAY_LABELS[OTHER_UNSEEDED_DAY],
          NEW_TIMESLOT_LABEL,
        ),
      ).toBe(true);
    });

    it('should not allow saving while the new timeslot has no day', async () => {
      const { harness } = await setup();
      await harness.startCreatingTimeslot();

      await harness.setFloatingTimeslotTimes(NEW_TIMES);

      expect(await harness.canSaveFloatingTimeslot()).toBe(false);
    });

    it('should not allow saving while the new timeslot has no times', async () => {
      const { harness, dragNewTimeslotToDay } = await setup();
      await harness.startCreatingTimeslot();

      await dragNewTimeslotToDay(OTHER_UNSEEDED_DAY);

      expect(
        await harness.canSaveTimeslot(
          DAY_LABELS[OTHER_UNSEEDED_DAY],
          NEW_TIMESLOT_LABEL,
        ),
      ).toBe(false);
    });

    it('should keep the times entered before the new timeslot is dragged to a day', async () => {
      const { harness, dragNewTimeslotToDay } = await setup();
      await harness.startCreatingTimeslot();
      await harness.setFloatingTimeslotTimes(NEW_TIMES);

      await dragNewTimeslotToDay(OTHER_UNSEEDED_DAY);

      expect(
        await harness.canSaveTimeslot(
          DAY_LABELS[OTHER_UNSEEDED_DAY],
          NEW_TIMESLOT_LABEL,
        ),
      ).toBe(true);
    });

    it('should allow saving once the new timeslot has a day and times', async () => {
      const { harness, dragNewTimeslotToDay } = await setup();
      await harness.startCreatingTimeslot();
      await dragNewTimeslotToDay(OTHER_UNSEEDED_DAY);

      await harness.setTimeslotTimes(
        DAY_LABELS[OTHER_UNSEEDED_DAY],
        NEW_TIMESLOT_LABEL,
        NEW_TIMES,
      );

      expect(
        await harness.canSaveTimeslot(
          DAY_LABELS[OTHER_UNSEEDED_DAY],
          NEW_TIMESLOT_LABEL,
        ),
      ).toBe(true);
    });

    it('should not create the timeslot until asked to', async () => {
      const { harness, dragNewTimeslotToDay, getServiceTimeslots } =
        await setup();
      const before = await getServiceTimeslots();
      await harness.startCreatingTimeslot();
      await harness.setFloatingTimeslotTimes(NEW_TIMES);

      await dragNewTimeslotToDay(OTHER_UNSEEDED_DAY);

      expect(await getServiceTimeslots()).toEqual(before);
    });

    it('should create the timeslot on the day with the times when asked to', async () => {
      const { harness, dragNewTimeslotToDay, getServiceTimeslots } =
        await setup();
      await harness.startCreatingTimeslot();
      await harness.setFloatingTimeslotTimes(NEW_TIMES);
      await dragNewTimeslotToDay(OTHER_UNSEEDED_DAY);

      await harness.saveTimeslot(
        DAY_LABELS[OTHER_UNSEEDED_DAY],
        NEW_TIMESLOT_LABEL,
      );

      expect(await getServiceTimeslots()).toContainEqual({
        ...NEW_TIMES,
        dayOfWeek: OTHER_UNSEEDED_DAY,
        timeslotId: expect.any(String),
      });
      expect(
        await harness.getTimeRanges(DAY_LABELS[OTHER_UNSEEDED_DAY]),
      ).toEqual([formatTimeRange(NEW_TIMES)]);
    });

    it('should stop showing the new timeslot when creating it is cancelled', async () => {
      const { harness } = await setup();
      await harness.startCreatingTimeslot();

      await harness.cancelFloatingTimeslot();

      expect(await harness.hasFloatingTimeslot()).toBe(false);
    });

    it('should stop editing another timeslot when a new one is started', async () => {
      const { harness, created } = await setup([createTimeslotDraft()]);
      const [timeslot] = created;
      await toggleEditing(harness, timeslot);

      await harness.startCreatingTimeslot();

      expect(
        await harness.isTimeslotEditing(
          DAY_LABELS[timeslot.dayOfWeek],
          formatTimeRange(timeslot),
        ),
      ).toBe(false);
    });
  });

  describe('deleting a timeslot', () => {
    it('should remove the timeslot from its day and the service once it is deleted', async () => {
      const { harness, created, getServiceTimeslots } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;
      await toggleEditing(harness, timeslot);

      await harness.deleteTimeslot(
        DAY_LABELS[timeslot.dayOfWeek],
        formatTimeRange(timeslot),
      );

      expect(
        await harness.getTimeRanges(DAY_LABELS[timeslot.dayOfWeek]),
      ).toEqual([]);
      expect(await getServiceTimeslots()).not.toContainEqual(timeslot);
    });
  });
});
