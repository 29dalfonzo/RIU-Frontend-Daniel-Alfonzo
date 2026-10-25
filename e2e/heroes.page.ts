import { Locator, Page, expect } from '@playwright/test';

/** Page object for the hero list and form screens. */
export class HeroesPage {
  readonly search: Locator;
  readonly heroNames: Locator;
  readonly snackbar: Locator;
  readonly dialog: Locator;

  constructor(private readonly page: Page) {
    this.search = page.getByRole('searchbox', { name: 'Filter by name' });
    this.heroNames = page.getByTestId('hero-name');
    this.snackbar = page.locator('mat-snack-bar-container');
    this.dialog = page.getByRole('dialog');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.heroNames.first()).toBeVisible();
  }

  async filter(term: string): Promise<void> {
    await this.search.fill(term);
  }

  async fillForm(hero: { name: string; realName: string; publisher: string; year: string }) {
    await this.page.getByLabel('Name', { exact: true }).fill(hero.name);
    await this.page.getByLabel('Real name').fill(hero.realName);
    await this.page.getByRole('combobox', { name: 'Publisher' }).click();
    await this.page.getByRole('option', { name: hero.publisher }).click();
    await this.page.getByLabel('First appearance').fill(hero.year);
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  rowAction(action: 'Edit' | 'Delete', heroName: string): Locator {
    return this.page.getByRole('button', { name: `${action} ${heroName}`, exact: true });
  }
}
