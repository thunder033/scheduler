import { withAnimations } from './animations';
import { withDragAndDrop } from './drag-and-drop';

export type { Animations } from './animations';
export type { DragAndDrop, GripOptions } from './drag-and-drop';

/** Configuration that tests commonly need, which applies when called in a test's `setup` */
export const CommonTest = { withAnimations, withDragAndDrop };
