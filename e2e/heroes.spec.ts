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
    await expect(page.getByText('No heroes found.')).toBeVisible();
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

    await expect(page).toHaveURL(/\/heroes$/);
    await expect(heroes.snackbar).toContainText('SHE-HULK was created');
    await heroes.filter('she');
    await expect(heroes.heroNames).toHaveText(['SHE-HULK']);
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
    await expect(heroes.dialog).toContainText('Are you sure you want to delete SUPERMAN?');
    await heroes.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(heroes.heroNames).toContainText(['SUPERMAN']);

    await heroes.rowAction('Delete', 'SUPERMAN').click();
    await heroes.dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(heroes.snackbar).toContainText('SUPERMAN was deleted');
    await expect(heroes.heroNames).not.toContainText(['SUPERMAN']);
  });

  test('shows the loading bar while an operation runs', async ({ page }) => {
    await heroes.rowAction('Delete', 'SPIDERMAN').click();
    await heroes.dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByTestId('loading')).toBeVisible();
    await expect(page.getByTestId('loading')).toBeHidden();
  });

  test('redirects an unknown hero back to the list', async ({ page }) => {
    await page.goto('/heroes/999/edit');

    await expect(page).toHaveURL(/\/heroes$/);
    await expect(heroes.snackbar).toContainText('Hero with id 999 was not found');
  });
});
