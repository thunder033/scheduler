import { ComponentFixture } from '@angular/core/testing';
import { dispatchMouseEvent, dispatchTouchEvent } from './fake-events';

// Based on: https://github.com/angular/components/issues/16661

/**
 * Drags an element to a position on the page using the mouse.
 * @param fixture Fixture on which to run change detection.
 * @param element Element which is being dragged.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
export function dragElementViaMouse(
  fixture: ComponentFixture<unknown>,
  element: Element,
  x: number,
  y: number,
) {
  startDraggingViaMouse(fixture, element);

  dispatchMouseEvent(document, 'mousemove', x, y);
  fixture.detectChanges();

  dispatchMouseEvent(document, 'mouseup', x, y);
  fixture.detectChanges();
}

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

/**
 * Drags an element to a position on the page using a touch device.
 * @param fixture Fixture on which to run change detection.
 * @param element Element which is being dragged.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
export function dragElementViaTouch(
  fixture: ComponentFixture<unknown>,
  element: Element,
  x: number,
  y: number,
) {
  startDraggingViaTouch(fixture, element);
  continueDraggingViaTouch(fixture, x, y);
  stopDraggingViaTouch(fixture, x, y);
}

/**
 * @param fixture Fixture on which to run change detection.
 * @param element Element which is being dragged.
 */
export function startDraggingViaTouch(
  fixture: ComponentFixture<unknown>,
  element: Element,
) {
  dispatchTouchEvent(element, 'touchstart');
  fixture.detectChanges();

  dispatchTouchEvent(document, 'touchmove');
  fixture.detectChanges();
}

/**
 * @param fixture Fixture on which to run change detection.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
export function continueDraggingViaTouch(
  fixture: ComponentFixture<unknown>,
  x: number,
  y: number,
) {
  dispatchTouchEvent(document, 'touchmove', x, y);
  fixture.detectChanges();
}

/**
 * @param fixture Fixture on which to run change detection.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
export function stopDraggingViaTouch(
  fixture: ComponentFixture<unknown>,
  x: number,
  y: number,
) {
  dispatchTouchEvent(document, 'touchend', x, y);
  fixture.detectChanges();
}
