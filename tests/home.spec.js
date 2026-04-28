const { test, expect } = require('@playwright/test');

test.describe('Home Page', () => {
  test('shows hero title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Road Rank/i })).toBeVisible();
  });

  test('shows Sign In and Create Account buttons when logged out', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('Sign In button navigates to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/auth/login');
  });

  test('Create Account button navigates to register page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL('/auth/register');
  });

  test('shows all six feature cards', async ({ page }) => {
    await page.goto('/');
    const cards = ['Live Camera Feed', 'AI Detection', 'Instant Alerts', 'Face Login', 'Behaviour History'];
    for (const title of cards) {
      await expect(page.getByText(title)).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
  });

  test('shows "Everything you need" section heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Everything you need')).toBeVisible();
  });

  test('shows View Live Feed and My Dashboard buttons when logged in', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('username', 'testuser'));
    await page.reload();
    await expect(page.getByRole('button', { name: 'View Live Feed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My Dashboard' })).toBeVisible();
  });
});
