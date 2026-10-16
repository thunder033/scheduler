/**
 * Angular only supports enter and leave animations when elements have `getAnimations`, which
 * jsdom lacks. This has to be loaded before Angular, since support is checked as it loads.
 * Specs still have to opt in to the animations, with `animationsEnabled` in the TestBed config.
 */
if (typeof document.documentElement.getAnimations !== 'function') {
  Element.prototype.getAnimations = () => [];
}
