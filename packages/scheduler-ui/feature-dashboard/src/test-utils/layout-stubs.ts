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
