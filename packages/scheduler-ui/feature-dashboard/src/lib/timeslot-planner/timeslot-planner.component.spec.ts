import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Timeslot } from '@org/models';
import { TimeslotDraft, TimeslotService } from '@org/scheduler-ui/data';
import { CreateTimeslot } from '@org/scheduler-ui/state';
import { firstValueFrom } from 'rxjs';
import {
  dragElementToDropListViaMouse,
  startDraggingViaMouse,
} from '../../test-utils/drag-drop-utils';
import { dispatchMouseEvent } from '../../test-utils/fake-events';
import {
  ElementBox,
  getCenter,
  stubLayout,
} from '../../test-utils/layout-stubs';
import { provideTestState } from '../../test-utils/provide-test-state';
import { formatTimeRange } from '../timeslot-card/timeslot-card.component';
import { DAY_LABELS, TimeslotPlannerComponent } from './timeslot-planner.component';
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

const DAY_WIDTH = 200;
const DAY_HEIGHT = 400;
const DAY_LABEL_HEIGHT = 40;
const CARD_HEIGHT = 50;
/** Far enough to get past the distance CDK requires before a drag starts */
const DRAG_START_DISTANCE = 20;

/** Lays the days out as columns, with each day's cards stacked under its label */
function layOutPlanner(fixture: ComponentFixture<TimeslotPlannerComponent>): void {
  const boxes = new Map<Element, ElementBox>();
  const days = fixture.nativeElement.querySelectorAll(
    '.day',
  ) as NodeListOf<Element>;
  days.forEach((day, dayIndex) => {
    const left = dayIndex * DAY_WIDTH;
    boxes.set(day, { left, top: 0, width: DAY_WIDTH, height: DAY_HEIGHT });
    day.querySelectorAll('lib-timeslot-card').forEach((card, cardIndex) => {
      boxes.set(card, {
        left,
        top: DAY_LABEL_HEIGHT + cardIndex * CARD_HEIGHT,
        width: DAY_WIDTH,
        height: CARD_HEIGHT,
      });
    });
  });
  stubLayout(boxes);
}

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

/** Picks up the timeslot's card with the mouse and holds it, still within its own day */
function startDraggingTimeslot(
  fixture: ComponentFixture<TimeslotPlannerComponent>,
  timeslot: Timeslot,
): void {
  layOutPlanner(fixture);
  const card = findElement(
    fixture,
    'lib-timeslot-card',
    formatTimeRange(timeslot),
  );
  const { left, top } = card.getBoundingClientRect();

  startDraggingViaMouse(fixture, card);
  dispatchMouseEvent(
    document,
    'mousemove',
    left + DRAG_START_DISTANCE,
    top + DRAG_START_DISTANCE,
  );
  fixture.detectChanges();
}

/** Drags the timeslot's card with the mouse onto the column of the day */
async function dragTimeslotToDay(
  fixture: ComponentFixture<TimeslotPlannerComponent>,
  timeslot: Timeslot,
  dayOfWeek: number,
): Promise<void> {
  layOutPlanner(fixture);
  const card = findElement(
    fixture,
    'lib-timeslot-card',
    formatTimeRange(timeslot),
  );
  const day = findElement(fixture, '.day', DAY_LABELS[dayOfWeek]);
  const dayBox = day.getBoundingClientRect() as DOMRect;
  const target = getCenter({
    left: dayBox.left,
    top: dayBox.top,
    width: dayBox.width,
    height: dayBox.height,
  });

  dragElementToDropListViaMouse(fixture, card, target.x, target.y);
  await fixture.whenStable();
}

async function setup(drafts: TimeslotDraft[] = []) {
  await TestBed.configureTestingModule({
    imports: [TimeslotPlannerComponent],
    providers: [provideTestState()],
  }).compileComponents();

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

  return {
    fixture,
    harness,
    created,
    store: TestBed.inject(Store),
    getServiceTimeslots: () => firstValueFrom(timeslotService.getTimeslots()),
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

  describe('dragging a timeslot to another day', () => {
    it('should highlight the other days as drop targets while dragging', async () => {
      const { fixture, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;
      expect(await harness.getDropTargetDayLabels()).toEqual([]);

      startDraggingTimeslot(fixture, timeslot);

      expect(await harness.getDropTargetDayLabels()).toEqual(
        (await harness.getDayLabels()).filter(
          (label) => label !== DAY_LABELS[timeslot.dayOfWeek],
        ),
      );
    });

    it('should stop highlighting the days once the timeslot is dropped', async () => {
      const { fixture, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;

      await dragTimeslotToDay(fixture, timeslot, OTHER_UNSEEDED_DAY);

      expect(await harness.getDropTargetDayLabels()).toEqual([]);
    });

    it('should move the timeslot to the day it is dropped on', async () => {
      const { fixture, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;

      await dragTimeslotToDay(fixture, timeslot, OTHER_UNSEEDED_DAY);

      expect(
        await harness.getTimeRanges(DAY_LABELS[OTHER_UNSEEDED_DAY]),
      ).toEqual([formatTimeRange(timeslot)]);
      expect(await harness.getTimeRanges(DAY_LABELS[UNSEEDED_DAY])).toEqual([]);
    });

    it('should keep the time of the timeslot when moving it', async () => {
      const { fixture, harness, created, getServiceTimeslots } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;

      await dragTimeslotToDay(fixture, timeslot, SUNDAY);

      expect(await harness.getTimeRanges(DAY_LABELS[SUNDAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
      expect(await getServiceTimeslots()).toContainEqual({
        ...timeslot,
        dayOfWeek: SUNDAY,
      });
    });

    it('should leave the timeslot where it is when dropped on its own day', async () => {
      const { fixture, harness, created } = await setup([
        createTimeslotDraft(),
      ]);
      const [timeslot] = created;

      await dragTimeslotToDay(fixture, timeslot, timeslot.dayOfWeek);

      expect(await harness.getTimeRanges(DAY_LABELS[UNSEEDED_DAY])).toEqual([
        formatTimeRange(timeslot),
      ]);
    });
  });
});
