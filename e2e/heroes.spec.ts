import { expect, test } from '@playwright/test';

import { HeroesPage } from './heroes.page';

test.describe('Super heroes maintenance', () => {
  let heroes: HeroesPage;

  test.beforeEach(async ({ page }) => {
    heroes = new HeroesPage(page);
    await heroes.open();
  });

  test('lists heroes in pages of five', async ({ page }) => {
    await expect(heroes.heroNames).toHaveCount(5);
    await expect(page.getByText('1 – 5 of 12')).toBeVisible();

    await page.getByRole('button', { name: 'Next page' }).click();

    await expect(heroes.heroNames.first()).toHaveText('IRON MAN');
    await expect(page.getByText('6 – 10 of 12')).toBeVisible();
  });

  test('filters heroes by name', async ({ page }) => {
    await heroes.filter('man');

    await expect(heroes.heroNames).toHaveText([
      'SPIDERMAN',
      'SUPERMAN',
      'MANOLITO EL FUERTE',
      'BATMAN',
      'WONDER WOMAN',
    ]);

    await heroes.filter('xyz');

    await expect(heroes.heroNames).toHaveCount(0);
    await expect(page.getByText('No heroes match "xyz"')).toBeVisible();
    await expect(page).toHaveURL(/\/heroes\?q=xyz$/);

    await page.getByRole('button', { name: 'Clear filter' }).click();

    await expect(heroes.heroNames).toHaveCount(5);
    await expect(page).toHaveURL(/\/heroes$/);
  });

  test('restores filter, sort and page from a shared link', async ({ page }) => {
    await page.goto('/heroes?q=man&sort=name:asc&page=2');

    await expect(heroes.search).toHaveValue('man');
    // Seed matches for "man" sorted by name: AQUAMAN … SPIDERMAN | SUPERMAN, WONDER WOMAN.
    await expect(heroes.heroNames).toHaveText(['SUPERMAN', 'WONDER WOMAN']);
  });

  test('creates a hero with validation and the name in upper case', async ({ page }) => {
    await page.getByRole('button', { name: 'Add hero' }).click();
    await expect(page).toHaveURL(/\/heroes\/new$/);

    await heroes.save();
    await expect(page.getByText('Name is required', { exact: true })).toBeVisible();

    await page.getByLabel('Name', { exact: true }).pressSequentially('she-hulk');
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('SHE-HULK');
    await heroes.fillForm({
      name: 'she-hulk',
      realName: 'Jennifer Walters',
      publisher: 'Marvel',
      year: '1980',
    });
    await heroes.save();

    // The new hero is the 13th: the list jumps to its page and highlights it.
    await expect(page).toHaveURL(/\/heroes\?page=3$/);
    await expect(heroes.snackbar).toContainText('SHE-HULK was created');
    await expect(page.locator('tr.highlighted')).toContainText('SHE-HULK');
  });

  test('rejects a duplicated hero name', async ({ page }) => {
    await page.getByRole('button', { name: 'Add hero' }).click();
    await heroes.fillForm({ name: 'batman', realName: 'Someone', publisher: 'DC', year: '2000' });
    await heroes.save();

    await expect(heroes.snackbar).toContainText('A hero named "BATMAN" already exists');
    await expect(page).toHaveURL(/\/heroes\/new$/);
  });

  test('edits a hero and returns to the list', async ({ page }) => {
    await heroes.rowAction('Edit', 'BATMAN').click();
    await expect(page).toHaveURL(/\/heroes\/4\/edit$/);
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('BATMAN');

    await page.getByLabel('Real name').fill('Dick Grayson');
    await heroes.save();

    await expect(page).toHaveURL(/\/heroes$/);
    await expect(heroes.snackbar).toContainText('BATMAN was updated');
    await page.getByRole('button', { name: 'Edit BATMAN' }).click();
    await expect(page.getByLabel('Real name')).toHaveValue('Dick Grayson');
  });

  test('deletes a hero only after confirmation', async () => {
    await heroes.rowAction('Delete', 'SUPERMAN').click();
    await expect(heroes.dialog).toContainText('Delete hero');
    await expect(heroes.dialog).toContainText('SUPERMAN');
    await heroes.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(heroes.heroNames).toContainText(['SUPERMAN']);

    await heroes.rowAction('Delete', 'SUPERMAN').click();
    await heroes.dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(heroes.snackbar).toContainText('SUPERMAN was deleted');
    await expect(heroes.heroNames).not.toContainText(['SUPERMAN']);
  });

  test('undoes a deletion from the snackbar', async () => {
    await heroes.rowAction('Delete', 'BATMAN').click();
    await heroes.dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(heroes.heroNames).not.toContainText(['BATMAN']);

    await heroes.snackbar.getByRole('button', { name: 'Undo' }).click();

    await expect(heroes.snackbar).toContainText('BATMAN was restored');
    await expect(heroes.heroNames).toContainText(['BATMAN']);
  });

  test('shows the loading bar while an operation runs', async ({ page }) => {
    await heroes.rowAction('Delete', 'SPIDERMAN').click();
    await heroes.dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByTestId('loading')).toBeVisible();
    await expect(page.getByTestId('loading')).toBeHidden();
  });

  test('asks before leaving a form with unsaved changes', async ({ page }) => {
    await heroes.rowAction('Edit', 'BATMAN').click();
    await page.getByLabel('Real name').fill('Dick Grayson');
    await expect(page.getByText('Dick Grayson')).toBeVisible();

    await page.getByRole('link', { name: 'Heroes' }).click();
    await expect(heroes.dialog).toContainText('Discard changes?');
    await heroes.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/heroes\/4\/edit$/);

    await page.getByRole('link', { name: 'Heroes' }).click();
    await heroes.dialog.getByRole('button', { name: 'Discard' }).click();
    await expect(page).toHaveURL(/\/heroes$/);
  });

  test('switches and remembers the color theme', async ({ page }) => {
    const colorScheme = () => page.evaluate(() => document.documentElement.style.colorScheme);
    const initial = await colorScheme();

    await page.getByRole('button', { name: /Switch to (dark|light) theme/ }).click();
    await expect.poll(colorScheme).not.toBe(initial);
    const scheme = await colorScheme();

    await page.reload();

    await expect.poll(colorScheme).toBe(scheme);
  });

  test('redirects an unknown hero back to the list', async ({ page }) => {
    await page.goto('/heroes/999/edit');

    await expect(page).toHaveURL(/\/heroes$/);
    await expect(heroes.snackbar).toContainText('Hero with id 999 was not found');
  });
});
