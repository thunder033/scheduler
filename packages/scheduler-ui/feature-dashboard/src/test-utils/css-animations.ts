import { vi } from 'vitest';

const STUBBED_ANIMATION_NAME = 'stubbed-animation';

/**
 * jsdom doesn't run CSS animations, so every element reports having none. This makes every
 * element report an animation that never ends, so code that plays one can be observed.
 * Returns a function that undoes it.
 */
export function stubCssAnimations(): () => void {
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

  return () => spy.mockRestore();
}
