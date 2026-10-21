import { Component, input, linkedSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { CommonTest, qaSelector } from '@org/scheduler-ui/test-utils';
import { ExpandableCard } from './expandable-card';
import {
  EXPANDABLE_CONTENT_SELECTOR,
  ExpandableCardHarness,
} from './expandable-card.harness';

const INNER_SELECTOR = qaSelector('inner');

@Component({
  selector: 'lib-test-card',
  template: `
    <button qa-toggle (click)="expanded.set(!expanded())">Toggle</button>
    @if (expanded()) {
      <div
        qa-expandable-content
        (animate.enter)="expandContent($event)"
        (animate.leave)="collapseContent($event)"
      >
        <span qa-inner>Content</span>
      </div>
    }
  `,
})
class TestCardComponent extends ExpandableCard {
  readonly startExpanded = input(false);
  readonly expanded = linkedSignal(() => this.startExpanded());
}

@Component({
  selector: 'lib-test-host',
  imports: [TestCardComponent],
  template: `
    @if (present()) {
      <lib-test-card [startExpanded]="startExpanded" />
    }
  `,
})
class TestHostComponent {
  readonly present = signal(true);
  startExpanded = false;
}

class TestCardHarness extends ExpandableCardHarness {
  static hostSelector = 'lib-test-card';

  private readonly toggleControl = this.locatorFor(qaSelector('toggle'));

  async toggle(): Promise<void> {
    return (await this.toggleControl()).click();
  }
}

interface SetupOptions {
  /** Expands the card before it is created */
  alreadyExpanded?: boolean;
  /** Runs the enter and leave animations, which TestBed disables unless asked */
  animated?: boolean;
}

async function setup({
  alreadyExpanded = false,
  animated = false,
}: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [TestHostComponent],
  }).compileComponents();
  const animations = animated ? CommonTest.withAnimations() : undefined;

  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.componentInstance.startExpanded = alreadyExpanded;
  const harness =
    await TestbedHarnessEnvironment.loader(fixture).getHarness(TestCardHarness);

  const getElement = (selector: string): Element | null =>
    fixture.nativeElement.querySelector(selector);

  return {
    fixture,
    harness,
    getElement,
    /** Removes the card, as when it is replaced by another one */
    removeCard: () => {
      fixture.componentInstance.present.set(false);
      fixture.detectChanges();
    },
    /** The animations of a test that was set up as `animated` */
    getAnimations: () => {
      assert(animations, 'The test was not set up with animated: true');
      return animations;
    },
  };
}

describe('ExpandableCard', () => {
  it('is not expanded by default', async () => {
    const { harness } = await setup();

    expect(await harness.isExpanded()).toBe(false);
    expect(await harness.hasContent()).toBe(false);
  });

  it('shows its content while expanded', async () => {
    const { harness } = await setup();

    await harness.toggle();

    expect(await harness.isExpanded()).toBe(true);
    expect(await harness.hasContent()).toBe(true);
  });

  it('is expanded when created expanded', async () => {
    const { harness } = await setup({ alreadyExpanded: true });

    expect(await harness.isExpanded()).toBe(true);
    expect(await harness.hasContent()).toBe(true);
  });

  describe('animations', () => {
    it('animates the content in when it expands', async () => {
      const { harness } = await setup({ animated: true });

      await harness.toggle();

      expect(await harness.isContentAnimating()).toBe(true);
    });

    it('does not animate the content in when the card is created expanded', async () => {
      const { harness } = await setup({
        alreadyExpanded: true,
        animated: true,
      });

      expect(await harness.hasContent()).toBe(true);
      expect(await harness.isContentAnimating()).toBe(false);
    });

    it('keeps animating the content when something inside it finishes its own animation', async () => {
      const { harness, getElement, getAnimations } = await setup({
        animated: true,
      });
      await harness.toggle();

      getAnimations().end(getElement(INNER_SELECTOR) as Element);

      expect(await harness.isContentAnimating()).toBe(true);
    });

    it('stops animating the content once the content finishes its animation', async () => {
      const { harness, getElement, getAnimations } = await setup({
        animated: true,
      });
      await harness.toggle();

      getAnimations().end(getElement(EXPANDABLE_CONTENT_SELECTOR) as Element);

      expect(await harness.isContentAnimating()).toBe(false);
    });

    it('animates the content out when it collapses', async () => {
      const { harness } = await setup({ animated: true });
      await harness.toggle();

      await harness.toggle();

      expect(await harness.isExpanded()).toBe(false);
      expect(await harness.isContentAnimating()).toBe(true);
      expect(await harness.hasContent()).toBe(true);
    });

    it('removes the content once it finishes collapsing', async () => {
      const { harness, getElement, getAnimations } = await setup({
        animated: true,
      });
      await harness.toggle();
      await harness.toggle();

      getAnimations().end(getElement(EXPANDABLE_CONTENT_SELECTOR) as Element);

      expect(await harness.hasContent()).toBe(false);
    });

    it('does not animate the content out when the expanded card itself goes away', async () => {
      const { harness, getElement, removeCard } = await setup({
        alreadyExpanded: true,
        animated: true,
      });
      expect(await harness.hasContent()).toBe(true);

      removeCard();

      // A collapse animation would keep the content until it ends, which it never does here
      expect(getElement(EXPANDABLE_CONTENT_SELECTOR)).toBeNull();
    });
  });
});
