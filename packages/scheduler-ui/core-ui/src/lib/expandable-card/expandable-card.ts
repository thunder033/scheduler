import {
  afterNextRender,
  AnimationCallbackEvent,
  Directive,
  Signal,
} from '@angular/core';

/** Classes that play the matching keyframes in the shared styles of the expandable cards */
export const CONTENT_EXPAND_CLASS = 'content-expand';
export const CONTENT_COLLAPSE_CLASS = 'content-collapse';
/** Set on the card while it is expanded, matching the host binding of `ExpandableCard` */
export const EXPANDED_CLASS = 'expanded';

const NO_ANIMATION_NAME = 'none';

/**
 * Plays the animation the class applies to the element, then reports it complete.
 * Finishes right away when the class results in no animation.
 */
function playAnimation(
  { target, animationComplete }: AnimationCallbackEvent,
  animationClass: string,
  { keepClass = false }: { keepClass?: boolean } = {},
): void {
  target.classList.add(animationClass);

  const { animationName } = getComputedStyle(target);
  if (!animationName || animationName === NO_ANIMATION_NAME) {
    target.classList.remove(animationClass);
    animationComplete();
    return;
  }

  const finishOnAnimationEnd = (event: Event) => {
    // Animations of descendants bubble up too, such as those Material and the CDK put on inputs
    if (event.target !== target) {
      return;
    }

    target.removeEventListener('animationend', finishOnAnimationEnd);
    if (!keepClass) {
      target.classList.remove(animationClass);
    }
    animationComplete();
  };
  target.addEventListener('animationend', finishOnAnimationEnd);
}

/**
 * A card with content that is shown while it is expanded, which the card animates in and out.
 *
 * The card says when it is expanded, and puts the animation handlers on the enter and leave of
 * the content:
 * ```html
 * @if (expanded()) {
 *   <div (animate.enter)="expandContent($event)" (animate.leave)="collapseContent($event)">
 * ```
 */
@Directive({ host: { '[class.expanded]': 'expanded()' } })
export abstract class ExpandableCard {
  /** Whether the card is expanded, which is up to what the card expands for */
  abstract readonly expanded: Signal<boolean>;

  /** Whether the card has rendered, so how it was created isn't animated in as if it just changed */
  private hasRendered = false;

  constructor() {
    afterNextRender(() => {
      this.hasRendered = true;
    });
  }

  protected expandContent(event: AnimationCallbackEvent): void {
    this.playIfRendered(event, CONTENT_EXPAND_CLASS);
  }

  protected collapseContent(event: AnimationCallbackEvent): void {
    // Still expanded means the card itself is going away, such as when it moves to another place
    if (this.expanded()) {
      event.animationComplete();
      return;
    }
    playAnimation(event, CONTENT_COLLAPSE_CLASS, { keepClass: true });
  }

  /**
   * Plays the animation of the class on what enters, for the parts of a card that animate in
   * with the content. A card created while expanded shows it as it is, without animating in.
   */
  protected playIfRendered(
    event: AnimationCallbackEvent,
    animationClass: string,
  ): void {
    if (this.hasRendered) {
      playAnimation(event, animationClass);
    } else {
      event.animationComplete();
    }
  }
}
