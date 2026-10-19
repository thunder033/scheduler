import { ComponentHarness } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture } from '@angular/core/testing';
import { dispatchMouseEvent } from './fake-events';

// Layout: jsdom does none, so drag and drop needs it provided

export interface ElementBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

function createRect({ left, top, width, height }: ElementBox): DOMRect {
  const rect = {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
  return { ...rect, toJSON: () => rect };
}

function contains(box: ElementBox, x: number, y: number): boolean {
  return (
    x >= box.left &&
    x <= box.left + box.width &&
    y >= box.top &&
    y <= box.top + box.height
  );
}

/** The center of a box, e.g. for pointing a drag at it */
export function getCenter({ left, top, width, height }: ElementBox) {
  return { x: left + width / 2, y: top + height / 2 };
}

/**
 * jsdom does no layout, so every element is zero sized and `elementFromPoint`
 * doesn't exist. This gives the elements the provided boxes, and resolves points
 * to the smallest of those elements that contains them.
 */
export function stubLayout(boxes: Map<Element, ElementBox>): void {
  for (const [element, box] of boxes) {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(createRect(box));
  }

  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: (x: number, y: number): Element | null =>
      [...boxes]
        .filter(([, box]) => contains(box, x, y))
        .sort(
          ([, first], [, second]) =>
            first.width * first.height - second.width * second.height,
        )[0]?.[0] ?? null,
  });
}

// Mouse and touch gestures

// Based on: https://github.com/angular/components/issues/16661

/**
 * Drags an element onto another drop list using the mouse. The first move past the
 * drag threshold only starts the drag, so the pointer is moved a second time for
 * the drop list under it to take effect before releasing.
 * @param fixture Fixture on which to run change detection.
 * @param element Element which is being dragged.
 * @param x Position along the x axis of the drop list to drag the element to.
 * @param y Position along the y axis of the drop list to drag the element to.
 */
export function dragElementToDropListViaMouse(
  fixture: ComponentFixture<unknown>,
  element: Element,
  x: number,
  y: number,
) {
  startDraggingViaMouse(fixture, element);

  dispatchMouseEvent(document, 'mousemove', x, y);
  fixture.detectChanges();

  dispatchMouseEvent(document, 'mousemove', x, y);
  fixture.detectChanges();

  dispatchMouseEvent(document, 'mouseup', x, y);
  fixture.detectChanges();
}

/**
 * Dispatches the events for starting a drag sequence.
 * @param fixture Fixture on which to run change detection.
 * @param element Element on which to dispatch the events.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
export function startDraggingViaMouse(
  fixture: ComponentFixture<unknown>,
  element: Element,
  x?: number,
  y?: number,
) {
  dispatchMouseEvent(element, 'mousedown', x, y);
  fixture.detectChanges();

  dispatchMouseEvent(document, 'mousemove', x, y);
  fixture.detectChanges();
}

// Drag and drop for tests

const DROP_LIST_SELECTOR = '.cdk-drop-list';
const DRAG_ITEM_SELECTOR = '.cdk-drag';

/** Sizes for the layout given to drop lists and the items in them, which don't need to be realistic */
const DROP_LIST_WIDTH = 200;
const DROP_LIST_HEIGHT = 400;
const ITEM_HEIGHT = 50;
/** Far enough to get past the distance CDK requires before a drag starts */
const DRAG_START_DISTANCE = 20;

export interface GripOptions {
  /**
   * The part of the item that is grabbed, as an element or a selector within the item.
   * Needed when the item has a drag handle, since only the handle starts a drag.
   * Defaults to the item itself.
   */
  grip?: Element | string;
}

/** An element, or the harness of the component it is the host of */
export type DragTarget = Element | ComponentHarness;

export interface DragAndDrop {
  /** Picks up the item with the mouse and holds it, still over its own drop list */
  pickUp(item: DragTarget, options?: GripOptions): Promise<void>;

  /** Drags the item onto the drop list and releases it there, then waits for the app to settle */
  dragTo(
    item: DragTarget,
    dropList: DragTarget,
    options?: GripOptions,
  ): Promise<void>;
}

async function toElement(target: DragTarget): Promise<Element> {
  return target instanceof Element
    ? target
    : TestbedHarnessEnvironment.getNativeElement(await target.host());
}

/** Lays drop lists out as columns, left to right, with the items in each stacked from the top */
function layOutDropLists(root: Element): Map<Element, ElementBox> {
  const boxes = new Map<Element, ElementBox>();

  root.querySelectorAll(DROP_LIST_SELECTOR).forEach((dropList, listIndex) => {
    const left = listIndex * DROP_LIST_WIDTH;
    boxes.set(dropList, {
      left,
      top: 0,
      width: DROP_LIST_WIDTH,
      height: DROP_LIST_HEIGHT,
    });

    dropList.querySelectorAll(DRAG_ITEM_SELECTOR).forEach((item, itemIndex) => {
      boxes.set(item, {
        left,
        top: itemIndex * ITEM_HEIGHT,
        width: DROP_LIST_WIDTH,
        height: ITEM_HEIGHT,
      });
    });
  });

  return boxes;
}

function getGrip(item: Element, grip: GripOptions['grip']): Element {
  if (grip === undefined) {
    return item;
  }

  const element = typeof grip === 'string' ? item.querySelector(grip) : grip;
  if (!element) {
    throw new Error(`The item has no grip matching "${String(grip)}"`);
  }
  return element;
}

/**
 * Makes CDK drag and drop work in jsdom, which does no layout and lacks `elementFromPoint`.
 * Call it once in the test's setup, with the fixture holding the drop lists. It must be
 * called while a test is running, as it cleans up when that test finishes.
 */
export function withDragAndDrop(
  fixture: ComponentFixture<unknown>,
): DragAndDrop {
  const layOut = () => stubLayout(layOutDropLists(fixture.nativeElement));

  onTestFinished(() => {
    Reflect.deleteProperty(document, 'elementFromPoint');
  });

  return {
    async pickUp(target, { grip } = {}) {
      const item = await toElement(target);
      layOut();
      const { left, top } = item.getBoundingClientRect();

      startDraggingViaMouse(fixture, getGrip(item, grip));
      dispatchMouseEvent(
        document,
        'mousemove',
        left + DRAG_START_DISTANCE,
        top + DRAG_START_DISTANCE,
      );
      fixture.detectChanges();
    },

    async dragTo(itemTarget, dropListTarget, { grip } = {}) {
      const item = await toElement(itemTarget);
      const dropList = await toElement(dropListTarget);
      layOut();
      const { x, y } = getCenter(dropList.getBoundingClientRect());

      dragElementToDropListViaMouse(fixture, getGrip(item, grip), x, y);
      await fixture.whenStable();
      // The drop may have changed what's rendered, which the fixture only shows once checked
      fixture.detectChanges();
    },
  };
}
