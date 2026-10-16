import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Timeslot } from '@org/models';
import { TimeslotDraft, TimeslotService } from '@org/scheduler-ui/data';
import { CreateTimeslot } from '@org/scheduler-ui/state';
import { firstValueFrom } from 'rxjs';
import { CommonTest } from '../../test-utils/common-test';
import { provideTestState } from '../../test-utils/provide-test-state';
import { formatTimeRange } from '../timeslot-card/timeslot-card.component';
import { CARD_HEADER_SELECTOR } from '../timeslot-card/timeslot-card.harness';
import {
  DAY_LABELS,
  TimeslotPlannerComponent,
} from './timeslot-planner.component';
import {
  DAY_SELECTOR,
  TimeslotPlannerHarness,
} from './timeslot-planner.harness';

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

function findElement(
  fixture: ComponentFixture<TimeslotPlannerComponent>,
  selector: string,
  hasText: string,
): Element {
  const element = [
    ...(fixture.nativeElement.querySelectorAll(
      selector,
    ) as NodeListOf<Element>),
  ].find((candidate) => candidate.textContent?.includes(hasText));
  if (!element) {
    throw new Error(`No ${selector} containing "${hasText}" in the planner`);
  }
  return element;
}

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
  const getCard = (timeslot: Timeslot) =>
    findElement(fixture, 'lib-timeslot-card', formatTimeRange(timeslot));
  /** Only the card's header drags the card, so grabbing its body does nothing */
  const getGrip = (grip: Grip) =>
    grip === 'header' ? CARD_HEADER_SELECTOR : undefined;

  return {
    harness,
    created,
    store: TestBed.inject(Store),
    getServiceTimeslots: () => firstValueFrom(timeslotService.getTimeslots()),
    /** Picks up the timeslot's card with the mouse and holds it, still within its own day */
    pickUpTimeslot: (timeslot: Timeslot, grip: Grip = 'header') =>
      dragAndDrop.pickUp(getCard(timeslot), { grip: getGrip(grip) }),
    /** Drags the timeslot's card with the mouse onto the column of the day */
    dragTimeslotToDay: (
      timeslot: Timeslot,
      dayOfWeek: number,
      grip: Grip = 'header',
    ) =>
      dragAndDrop.dragTo(
        getCard(timeslot),
        findElement(fixture, DAY_SELECTOR, DAY_LABELS[dayOfWeek]),
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

      pickUpTimeslot(timeslot);

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

      pickUpTimeslot(timeslot);

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

    it('should keep the time of the timeslot when moving it', async () => {
      const { dragTimeslotToDay, harness, created, getServiceTimeslots } =
        await setup([createTimeslotDraft()]);
      const [timeslot] = created;

      await toggleEditing(harness, timeslot);
      await dragTimeslotToDay(timeslot, SUNDAY);

      expect(await harness.getTimeRanges(DAY_LABELS[SUNDAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
      expect(await getServiceTimeslots()).toContainEqual({
        ...timeslot,
        dayOfWeek: SUNDAY,
      });
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
});
