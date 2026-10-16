import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTest } from './common-test';
import { qaSelector } from './qa-selector';

const HANDLE_SELECTOR = qaSelector('handle');
const ITEM_SELECTOR = qaSelector('item');
const RECEIVING_CLASS = 'cdk-drop-list-receiving';

type ListId = 'first' | 'second';

/** A test scene with two drop lists of draggable items, each with a handle */
@Component({
  imports: [CdkDrag, CdkDragHandle, CdkDropList, CdkDropListGroup],
  template: `
    <div cdkDropListGroup>
      @for (list of lists; track list) {
        <div
          cdkDropList
          [id]="list"
          [cdkDropListData]="list"
          [cdkDropListSortingDisabled]="true"
          (cdkDropListDropped)="drop($event)"
        >
          @for (item of items()[list]; track item) {
            <div qa-item cdkDrag [cdkDragData]="item">
              <span qa-handle cdkDragHandle>::</span>
              {{ item }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
class DragScene {
  protected readonly lists: ListId[] = ['first', 'second'];
  readonly items = signal<Record<ListId, string[]>>({
    first: ['one', 'two'],
    second: [],
  });

  protected drop({
    item,
    container,
    previousContainer,
  }: CdkDragDrop<ListId, ListId, string>): void {
    if (container === previousContainer) {
      return;
    }

    this.items.update((items) => ({
      ...items,
      [previousContainer.data]: items[previousContainer.data].filter(
        (existing) => existing !== item.data,
      ),
      [container.data]: [...items[container.data], item.data],
    }));
  }
}

function setup() {
  TestBed.configureTestingModule({ imports: [DragScene] });
  const fixture = TestBed.createComponent(DragScene);
  fixture.detectChanges();

  const dragAndDrop = CommonTest.withDragAndDrop(fixture);

  return {
    fixture,
    dragAndDrop,
    getItems: (list: ListId) => fixture.componentInstance.items()[list],
    ...getElements(fixture),
  };
}

/** The elements of the scene, found afresh since items are recreated when they move */
function getElements(fixture: ComponentFixture<DragScene>) {
  const root: Element = fixture.nativeElement;

  return {
    getList: (list: ListId): Element => {
      const element = root.querySelector(`#${list}`);
      if (!element) {
        throw new Error(`No ${list} list`);
      }
      return element;
    },
    getItem: (item: string): Element => {
      const element = [...root.querySelectorAll(ITEM_SELECTOR)].find(
        (candidate) => candidate.textContent?.includes(item),
      );
      if (!element) {
        throw new Error(`No ${item} item`);
      }
      return element;
    },
  };
}

describe('CommonTest', () => {
  describe('withDragAndDrop', () => {
    it('should move an item to the drop list it is dragged to', async () => {
      const { dragAndDrop, getItem, getList, getItems } = setup();

      await dragAndDrop.dragTo(getItem('one'), getList('second'), {
        grip: HANDLE_SELECTOR,
      });

      expect(getItems('second')).toEqual(['one']);
      expect(getItems('first')).toEqual(['two']);
    });

    it('should leave an item where it is when it is dropped on its own drop list', async () => {
      const { dragAndDrop, getItem, getList, getItems } = setup();

      await dragAndDrop.dragTo(getItem('one'), getList('first'), {
        grip: HANDLE_SELECTOR,
      });

      expect(getItems('first')).toEqual(['one', 'two']);
    });

    it('should move items again after the layout has changed', async () => {
      const { dragAndDrop, getItem, getList, getItems } = setup();
      await dragAndDrop.dragTo(getItem('one'), getList('second'), {
        grip: HANDLE_SELECTOR,
      });

      await dragAndDrop.dragTo(getItem('one'), getList('first'), {
        grip: HANDLE_SELECTOR,
      });

      expect(getItems('first')).toEqual(['two', 'one']);
    });

    it('should hold an item so the other drop lists can receive it', async () => {
      const { dragAndDrop, getItem, getList } = setup();

      await dragAndDrop.pickUp(getItem('one'), { grip: HANDLE_SELECTOR });

      expect(getList('second').classList).toContain(RECEIVING_CLASS);
      expect(getList('first').classList).not.toContain(RECEIVING_CLASS);
    });

    it('should accept the grip as an element', async () => {
      const { dragAndDrop, getItem, getList, getItems } = setup();
      const handle = getItem('one').querySelector(HANDLE_SELECTOR);

      await dragAndDrop.dragTo(getItem('one'), getList('second'), {
        grip: handle ?? undefined,
      });

      expect(getItems('second')).toEqual(['one']);
    });

    it('should only start a drag from the grip when items have handles', async () => {
      const { dragAndDrop, getItem, getList, getItems } = setup();

      await dragAndDrop.dragTo(getItem('one'), getList('second'));

      expect(getItems('first')).toEqual(['one', 'two']);
    });

    it('should report a grip the item does not have', async () => {
      const { dragAndDrop, getItem, getList } = setup();

      await expect(
        dragAndDrop.dragTo(getItem('one'), getList('second'), {
          grip: '.missing',
        }),
      ).rejects.toThrow('.missing');
    });
  });

  describe('withAnimations', () => {
    it('should make elements report an animation', () => {
      const before = getComputedStyle(document.body).animationName;

      CommonTest.withAnimations();

      expect(getComputedStyle(document.body).animationName).not.toBe(before);
    });

    it('should end an animation in a way that bubbles up to the ancestors of the element', () => {
      const animations = CommonTest.withAnimations();
      const parent = document.createElement('div');
      const child = parent.appendChild(document.createElement('div'));
      const ended: EventTarget[] = [];
      parent.addEventListener('animationend', (event) => {
        if (event.target) {
          ended.push(event.target);
        }
      });

      animations.end(child);

      expect(ended).toEqual([child]);
    });
  });
});
