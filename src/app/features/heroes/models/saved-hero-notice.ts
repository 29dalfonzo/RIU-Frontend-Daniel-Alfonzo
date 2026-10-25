import { HeroId } from './hero.model';

/**
 * Passed in the navigation state from the form back to the list after saving.
 * The list announces it, because only the list knows whether the hero is on screen.
 */
export interface SavedHeroNotice {
  readonly id: HeroId;
  readonly message: string;
}
