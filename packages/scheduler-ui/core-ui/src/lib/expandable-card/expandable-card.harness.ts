import { ComponentHarness } from '@angular/cdk/testing';
import { qaSelector } from '@scheduler/ui/test-utils';
import {
  CONTENT_COLLAPSE_CLASS,
  CONTENT_EXPAND_CLASS,
  EXPANDED_CLASS,
} from './expandable-card';

/** Marks the content of an expandable card, which is what animates in and out */
export const EXPANDABLE_CONTENT_SELECTOR = qaSelector('expandable-content');

/** The behavior of an expandable card, for the harness of a card to build on */
export abstract class ExpandableCardHarness extends ComponentHarness {
  /** Goes once it has collapsed, whereas the card stops being expanded as soon as it starts */
  private readonly content = this.locatorForOptional(
    EXPANDABLE_CONTENT_SELECTOR,
  );

  async isExpanded(): Promise<boolean> {
    return (await this.host()).hasClass(EXPANDED_CLASS);
  }

  /** Whether the content is there, which includes while it collapses */
  async hasContent(): Promise<boolean> {
    return (await this.content()) !== null;
  }

  /** Whether the content is playing its expand or collapse animation */
  async isContentAnimating(): Promise<boolean> {
    const animationClasses = `.${CONTENT_EXPAND_CLASS}, .${CONTENT_COLLAPSE_CLASS}`;
    const content = await this.content();
    return (await content?.matchesSelector(animationClasses)) ?? false;
  }
}
