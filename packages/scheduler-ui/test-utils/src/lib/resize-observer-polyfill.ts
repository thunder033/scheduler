/** jsdom has no layout, so a resize observer has nothing to observe; this one never reports */
class NoopResizeObserver implements ResizeObserver {
  observe(): void {
    // nothing to observe without layout
  }
  unobserve(): void {
    // nothing to observe without layout
  }
  disconnect(): void {
    // nothing to observe without layout
  }
}

globalThis.ResizeObserver ??= NoopResizeObserver;
