import { TestBed } from '@angular/core/testing';

const STUBBED_ANIMATION_NAME = 'stubbed-animation';
const ANIMATION_END_EVENT = 'animationend';

export interface Animations {
  /**
   * Finishes the element's animation, as the browser does when one ends. Like the browser's
   * event, it bubbles up through the element's ancestors.
   */
  end(element: Element): void;
}

/**
 * Makes enter and leave animations run in jsdom, where they otherwise never do. Every element
 * then reports an animation that doesn't end until `end` is called, so code that plays one
 * can be observed.
 *
 * Call it in the test's setup right after `TestBed.configureTestingModule`, since any later
 * call turns animations off again, and before anything is injected or created. It relies on
 * `get-animations-polyfill`, which is loaded by `test-setup`. Cleans up when the test finishes,
 * so it must be called while a test is running.
 */
export function withAnimations(): Animations {
  TestBed.configureTestingModule({ animationsEnabled: true });

  const getStyle = globalThis.getComputedStyle.bind(globalThis);
  const spy = vi
    .spyOn(globalThis, 'getComputedStyle')
    .mockImplementation((element, pseudoElement) => {
      const style = getStyle(element, pseudoElement);
      return new Proxy(style, {
        get: (target, property) => {
          if (property === 'animationName') {
            return STUBBED_ANIMATION_NAME;
          }
          const value = Reflect.get(target, property);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    });
  onTestFinished(() => spy.mockRestore());

  return {
    end: (element) =>
      element.dispatchEvent(new Event(ANIMATION_END_EVENT, { bubbles: true })),
  };
}
