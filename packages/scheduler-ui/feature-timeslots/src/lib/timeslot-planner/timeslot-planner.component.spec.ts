import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Timeslot } from '@scheduler/models';
import { TimeslotDraft, TimeslotService } from '@scheduler/ui/data';
import { CreateTimeslot, NEW_TIMESLOT } from '@scheduler/ui/state';
import { firstValueFrom } from 'rxjs';
import { CommonTest } from '@scheduler/ui/test-utils';
import { provideTestState } from '@scheduler/ui/test-utils';
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
import { mockTimeslotDraft } from '@scheduler/ui/data/testing';

const SUNDAY = 7;

/** Days of the week the drafts are created on and moved to */
const DRAFT_DAY = 2;
const OTHER_DAY = 4;

function getRanges(timeslots: Timeslot[], dayOfWeek: number): string[] {
  return timeslots
    .filter((timeslot) => timeslot.dayOfWeek === dayOfWeek)
    .sort((first, second) => first.start.localeCompare(second.start))
    .map(formatTimeRange);
}

type Grip = 'header' | 'body';

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
    harness.getTimeslotCard({ timeslotId });
  const getDay = (dayOfWeek: number) => harness.getDay({ dayOfWeek });
  /** Only the card's header drags the card, so grabbing its body does nothing */
  const getGrip = (grip: Grip) =>
    grip === 'header' ? CARD_HEADER_SELECTOR : undefined;

  return {
    harness,
    created,
    store: TestBed.inject(Store),
    getServiceTimeslots: () => firstValueFrom(timeslotService.getTimeslots()),
    /** Time ranges of the timeslots listed under the day, in display order */
    getTimeRanges: async (dayOfWeek: number) =>
      (await getDay(dayOfWeek)).getTimeRanges(),
    /** The card listed under the day with the time range, which is a label for a new timeslot */
    getListedCard: async (dayOfWeek: number, timeRange: string) =>
      (await getDay(dayOfWeek)).getTimeslotCard({ timeRange }),
    /** Puts the timeslot's card in edit mode, which is what allows it to be dragged */
    toggleEditing: async (timeslot: Timeslot) =>
      (await getCard(timeslot)).toggleEditing(),
    /** Picks up the timeslot's card with the mouse and holds it, still within its own day */
    pickUpTimeslot: async (timeslot: Timeslot, grip: Grip = 'header') =>
      dragAndDrop.pickUp(await getCard(timeslot), { grip: getGrip(grip) }),
    pickUpNewTimeslot: async () =>
      dragAndDrop.pickUp(await getCard(NEW_TIMESLOT), {
        grip: CARD_HEADER_SELECTOR,
      }),
    /** Drags the card of the new timeslot with the mouse onto the column of the day */
    dragNewTimeslotToDay: async (dayOfWeek: number) =>
      dragAndDrop.dragTo(await getCard(NEW_TIMESLOT), await getDay(dayOfWeek), {
        grip: CARD_HEADER_SELECTOR,
      }),
    /** Drags the timeslot's card with the mouse onto the column of the day */
    dragTimeslotToDay: async (
      timeslot: Timeslot,
      dayOfWeek: number,
      grip: Grip = 'header',
    ) =>
      dragAndDrop.dragTo(await getCard(timeslot), await getDay(dayOfWeek), {
        grip: getGrip(grip),
      }),
  };
}

describe('TimeslotPlannerComponent', () => {
  it('lists every timeslot under the label of its day of week', async () => {
    const { getTimeRanges, getServiceTimeslots } = await setup([
      mockTimeslotDraft({ dayOfWeek: DRAFT_DAY }),
    ]);
    const timeslots = await getServiceTimeslots();

    for (const { dayOfWeek } of timeslots) {
      expect(await getTimeRanges(dayOfWeek)).toEqual(
        getRanges(timeslots, dayOfWeek),
      );
    }
  });

  it('always lists all seven days from Monday to Sunday', async () => {
    const { harness } = await setup();

    expect(await harness.getDayLabels()).toEqual(
      Object.entries(DAY_LABELS)
        .sort(([first], [second]) => Number(first) - Number(second))
        .map(([, label]) => label),
    );
    expect((await harness.getDayLabels()).at(-1)).toBe(DAY_LABELS[SUNDAY]);
  });

  it('lists days without timeslots as empty', async () => {
    const { getTimeRanges } = await setup();

    expect(await getTimeRanges(OTHER_DAY)).toEqual([]);
  });

  it('orders the timeslots within a day by start time', async () => {
    const later = mockTimeslotDraft({
      dayOfWeek: DRAFT_DAY,
      start: '15:00',
      end: '16:00',
    });
    const earlier = mockTimeslotDraft({
      dayOfWeek: DRAFT_DAY,
      start: '08:00',
      end: '09:00',
    });
    const { getTimeRanges } = await setup([later, earlier]);

    expect(await getTimeRanges(DRAFT_DAY)).toEqual([
      formatTimeRange(earlier),
      formatTimeRange(later),
    ]);
  });

  it('lists timeslots created after it was rendered', async () => {
    const { getTimeRanges, store } = await setup();
    const draft = mockTimeslotDraft({ dayOfWeek: DRAFT_DAY });

    store.dispatch(new CreateTimeslot(draft));

    expect(await getTimeRanges(draft.dayOfWeek)).toEqual([
      formatTimeRange(draft),
    ]);
  });

  describe('editing a timeslot', () => {
    it('only lets one timeslot be edited at a time', async () => {
      const first = mockTimeslotDraft({
        dayOfWeek: DRAFT_DAY,
        start: '08:00',
        end: '09:00',
      });
      const second = mockTimeslotDraft({
        dayOfWeek: DRAFT_DAY,
        start: '10:00',
        end: '11:00',
      });
      const { getListedCard, toggleEditing, created } = await setup([
        first,
        second,
      ]);
      const [firstTimeslot, secondTimeslot] = created;
      await toggleEditing(firstTimeslot);

      await toggleEditing(secondTimeslot);

      const firstCard = await getListedCard(
        firstTimeslot.dayOfWeek,
        formatTimeRange(firstTimeslot),
      );
      const secondCard = await getListedCard(
        secondTimeslot.dayOfWeek,
        formatTimeRange(secondTimeslot),
      );
      expect(await firstCard.isEditing()).toBe(false);
      expect(await secondCard.isEditing()).toBe(true);
    });
  });

  describe('dragging a timeslot to another day', () => {
    it('does not replay the editing animations for a timeslot that is moved', async () => {
      const { dragTimeslotToDay, getListedCard, toggleEditing, created } =
        await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })], {
          animated: true,
        });
      const [timeslot] = created;
      await toggleEditing(timeslot);

      await dragTimeslotToDay(timeslot, OTHER_DAY);

      const card = await getListedCard(OTHER_DAY, formatTimeRange(timeslot));
      expect(await card.isContentAnimating()).toBe(false);
    });

    it('keeps the timeslot in edit mode after it is moved', async () => {
      const { dragTimeslotToDay, getListedCard, toggleEditing, created } =
        await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;
      await toggleEditing(timeslot);

      await dragTimeslotToDay(timeslot, OTHER_DAY);

      const card = await getListedCard(OTHER_DAY, formatTimeRange(timeslot));
      expect(await card.isEditing()).toBe(true);
    });

    it('does not move a timeslot that is not being edited', async () => {
      const { dragTimeslotToDay, getTimeRanges, created } = await setup([
        mockTimeslotDraft({ dayOfWeek: DRAFT_DAY }),
      ]);
      const [timeslot] = created;

      await dragTimeslotToDay(timeslot, OTHER_DAY);

      expect(await getTimeRanges(DRAFT_DAY)).toEqual([
        formatTimeRange(timeslot),
      ]);
      expect(await getTimeRanges(OTHER_DAY)).toEqual([]);
    });

    it('does not highlight drop targets for a timeslot that is not being edited', async () => {
      const { pickUpTimeslot, harness, created } = await setup([
        mockTimeslotDraft({ dayOfWeek: DRAFT_DAY }),
      ]);
      const [timeslot] = created;

      await pickUpTimeslot(timeslot);

      expect(await harness.getDropTargetDayLabels()).toEqual([]);
    });

    it('only moves a timeslot that is dragged by its header', async () => {
      const { dragTimeslotToDay, getTimeRanges, toggleEditing, created } =
        await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;
      await toggleEditing(timeslot);

      await dragTimeslotToDay(timeslot, OTHER_DAY, 'body');

      expect(await getTimeRanges(DRAFT_DAY)).toEqual([
        formatTimeRange(timeslot),
      ]);
    });

    it('does not move a timeslot once it is no longer being edited', async () => {
      const { dragTimeslotToDay, getTimeRanges, toggleEditing, created } =
        await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;
      await toggleEditing(timeslot);
      await toggleEditing(timeslot);

      await dragTimeslotToDay(timeslot, OTHER_DAY);

      expect(await getTimeRanges(DRAFT_DAY)).toEqual([
        formatTimeRange(timeslot),
      ]);
    });

    it('highlights the other days as drop targets while dragging', async () => {
      const { pickUpTimeslot, toggleEditing, harness, created } = await setup([
        mockTimeslotDraft({ dayOfWeek: DRAFT_DAY }),
      ]);
      const [timeslot] = created;
      await toggleEditing(timeslot);
      expect(await harness.getDropTargetDayLabels()).toEqual([]);

      await pickUpTimeslot(timeslot);

      expect(await harness.getDropTargetDayLabels()).toEqual(
        (await harness.getDayLabels()).filter(
          (label) => label !== DAY_LABELS[timeslot.dayOfWeek],
        ),
      );
    });

    it('stops highlighting the days once the timeslot is dropped', async () => {
      const { dragTimeslotToDay, toggleEditing, harness, created } =
        await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;

      await toggleEditing(timeslot);
      await dragTimeslotToDay(timeslot, OTHER_DAY);

      expect(await harness.getDropTargetDayLabels()).toEqual([]);
    });

    it('moves the timeslot to the day it is dropped on', async () => {
      const { dragTimeslotToDay, getTimeRanges, toggleEditing, created } =
        await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;

      await toggleEditing(timeslot);
      await dragTimeslotToDay(timeslot, OTHER_DAY);

      expect(await getTimeRanges(OTHER_DAY)).toEqual([
        formatTimeRange(timeslot),
      ]);
      expect(await getTimeRanges(DRAFT_DAY)).toEqual([]);
    });

    it('does not save the new day until asked to', async () => {
      const {
        dragTimeslotToDay,
        getTimeRanges,
        toggleEditing,
        created,
        getServiceTimeslots,
      } = await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;

      await toggleEditing(timeslot);
      await dragTimeslotToDay(timeslot, SUNDAY);

      expect(await getTimeRanges(SUNDAY)).toEqual([formatTimeRange(timeslot)]);
      expect(await getServiceTimeslots()).toContainEqual(timeslot);
    });

    it('saves the new day and keeps the time when asked to', async () => {
      const {
        dragTimeslotToDay,
        getListedCard,
        getTimeRanges,
        toggleEditing,
        created,
        getServiceTimeslots,
      } = await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;
      await toggleEditing(timeslot);
      await dragTimeslotToDay(timeslot, SUNDAY);

      await (await getListedCard(SUNDAY, formatTimeRange(timeslot))).save();

      expect(await getServiceTimeslots()).toContainEqual({
        ...timeslot,
        dayOfWeek: SUNDAY,
      });
      expect(await getTimeRanges(SUNDAY)).toEqual([formatTimeRange(timeslot)]);
    });

    it('returns the timeslot to its day when editing is closed without saving', async () => {
      const {
        dragTimeslotToDay,
        getListedCard,
        getTimeRanges,
        toggleEditing,
        created,
      } = await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;
      await toggleEditing(timeslot);
      await dragTimeslotToDay(timeslot, SUNDAY);

      await (
        await getListedCard(SUNDAY, formatTimeRange(timeslot))
      ).toggleEditing();

      expect(await getTimeRanges(DRAFT_DAY)).toEqual([
        formatTimeRange(timeslot),
      ]);
      expect(await getTimeRanges(SUNDAY)).toEqual([]);
    });

    it('leaves the timeslot where it is when dropped on its own day', async () => {
      const { dragTimeslotToDay, getTimeRanges, toggleEditing, created } =
        await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;

      await toggleEditing(timeslot);
      await dragTimeslotToDay(timeslot, timeslot.dayOfWeek);

      expect(await getTimeRanges(DRAFT_DAY)).toEqual([
        formatTimeRange(timeslot),
      ]);
    });
  });

  describe('creating a timeslot', () => {
    const NEW_TIMES = { start: '09:00', end: '10:00' };

    it('does not show a new timeslot until asked to', async () => {
      const { harness } = await setup();

      expect(await harness.hasFloatingTimeslot()).toBe(false);
    });

    it('shows a new timeslot floating, without a day', async () => {
      const { harness } = await setup();

      await harness.startCreatingTimeslot();

      expect(await harness.hasFloatingTimeslot()).toBe(true);
      for (const day of await harness.getDays()) {
        expect(await day.getTimeRanges()).not.toContain(NEW_TIMESLOT_LABEL);
      }
    });

    it('highlights every day as a drop target while dragging the new timeslot', async () => {
      const { harness, pickUpNewTimeslot } = await setup();
      await harness.startCreatingTimeslot();

      await pickUpNewTimeslot();

      expect(await harness.getDropTargetDayLabels()).toEqual(
        await harness.getDayLabels(),
      );
    });

    it('lists the new timeslot under the day it is dragged to', async () => {
      const { harness, getListedCard, getTimeRanges, dragNewTimeslotToDay } =
        await setup();
      await harness.startCreatingTimeslot();

      await dragNewTimeslotToDay(OTHER_DAY);

      expect(await harness.hasFloatingTimeslot()).toBe(false);
      expect(await getTimeRanges(OTHER_DAY)).toEqual([NEW_TIMESLOT_LABEL]);
      const card = await getListedCard(OTHER_DAY, NEW_TIMESLOT_LABEL);
      expect(await card.isEditing()).toBe(true);
    });

    it('does not allow saving while the new timeslot has no day', async () => {
      const { harness } = await setup();
      const floatingTimeslot = await harness.startCreatingTimeslot();

      await floatingTimeslot.setTimes(NEW_TIMES);

      expect(await floatingTimeslot.canSave()).toBe(false);
    });

    it('does not allow saving while the new timeslot has no times', async () => {
      const { harness, getListedCard, dragNewTimeslotToDay } = await setup();
      await harness.startCreatingTimeslot();

      await dragNewTimeslotToDay(OTHER_DAY);

      const card = await getListedCard(OTHER_DAY, NEW_TIMESLOT_LABEL);
      expect(await card.canSave()).toBe(false);
    });

    it('keeps the times entered before the new timeslot is dragged to a day', async () => {
      const { harness, getListedCard, dragNewTimeslotToDay } = await setup();
      const floatingTimeslot = await harness.startCreatingTimeslot();
      await floatingTimeslot.setTimes(NEW_TIMES);

      await dragNewTimeslotToDay(OTHER_DAY);

      const card = await getListedCard(OTHER_DAY, NEW_TIMESLOT_LABEL);
      expect(await card.canSave()).toBe(true);
    });

    it('allows saving once the new timeslot has a day and times', async () => {
      const { harness, getListedCard, dragNewTimeslotToDay } = await setup();
      await harness.startCreatingTimeslot();
      await dragNewTimeslotToDay(OTHER_DAY);
      const card = await getListedCard(OTHER_DAY, NEW_TIMESLOT_LABEL);

      await card.setTimes(NEW_TIMES);

      expect(await card.canSave()).toBe(true);
    });

    it('does not create the timeslot until asked to', async () => {
      const { harness, dragNewTimeslotToDay, getServiceTimeslots } =
        await setup();
      const before = await getServiceTimeslots();
      const floatingTimeslot = await harness.startCreatingTimeslot();
      await floatingTimeslot.setTimes(NEW_TIMES);

      await dragNewTimeslotToDay(OTHER_DAY);

      expect(await getServiceTimeslots()).toEqual(before);
    });

    it('creates the timeslot on the day with the times when asked to', async () => {
      const {
        harness,
        getListedCard,
        getTimeRanges,
        dragNewTimeslotToDay,
        getServiceTimeslots,
      } = await setup();
      const floatingTimeslot = await harness.startCreatingTimeslot();
      await floatingTimeslot.setTimes(NEW_TIMES);
      await dragNewTimeslotToDay(OTHER_DAY);

      await (await getListedCard(OTHER_DAY, NEW_TIMESLOT_LABEL)).save();

      expect(await getServiceTimeslots()).toContainEqual({
        ...NEW_TIMES,
        dayOfWeek: OTHER_DAY,
        timeslotId: expect.any(String),
      });
      expect(await getTimeRanges(OTHER_DAY)).toEqual([
        formatTimeRange(NEW_TIMES),
      ]);
    });

    it('stops showing the new timeslot when creating it is cancelled', async () => {
      const { harness } = await setup();
      const floatingTimeslot = await harness.startCreatingTimeslot();

      await floatingTimeslot.toggleEditing();

      expect(await harness.hasFloatingTimeslot()).toBe(false);
    });

    it('stops editing another timeslot when a new one is started', async () => {
      const { harness, getListedCard, toggleEditing, created } = await setup([
        mockTimeslotDraft({ dayOfWeek: DRAFT_DAY }),
      ]);
      const [timeslot] = created;
      await toggleEditing(timeslot);

      await harness.startCreatingTimeslot();

      const card = await getListedCard(
        timeslot.dayOfWeek,
        formatTimeRange(timeslot),
      );
      expect(await card.isEditing()).toBe(false);
    });
  });

  describe('deleting a timeslot', () => {
    it('removes the timeslot from its day and the service once it is deleted', async () => {
      const {
        getListedCard,
        getTimeRanges,
        toggleEditing,
        created,
        getServiceTimeslots,
      } = await setup([mockTimeslotDraft({ dayOfWeek: DRAFT_DAY })]);
      const [timeslot] = created;
      await toggleEditing(timeslot);

      await (
        await getListedCard(timeslot.dayOfWeek, formatTimeRange(timeslot))
      ).delete();

      expect(await getTimeRanges(timeslot.dayOfWeek)).toEqual([]);
      expect(await getServiceTimeslots()).not.toContainEqual(timeslot);
    });
  });
});
