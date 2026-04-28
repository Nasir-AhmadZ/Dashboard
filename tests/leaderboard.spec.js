const { test, expect } = require('@playwright/test');

const mockData = [
  { _id: '1', name: 'alice', score: 950, rank: 1 },
  { _id: '2', name: 'bob', score: 820, rank: 2 },
  { _id: '3', name: 'carol', score: 710, rank: 3 },
  { _id: '4', name: 'dave', score: 480, rank: 4 },
];

const mockLeaderboard = (page) =>
  page.route('**/api/leaderboard', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData) })
  );

test.describe('Leaderboard Page', () => {
  test('renders page title', async ({ page }) => {
    await mockLeaderboard(page);
    await page.goto('/Leaderboard');
    await expect(page.getByRole('heading', { name: /Leaderboard/i })).toBeVisible();
  });

  test('shows all players by name', async ({ page }) => {
    await mockLeaderboard(page);
    await page.goto('/Leaderboard');
    for (const player of mockData) {
      await expect(page.getByText(player.name)).toBeVisible();
    }
  });

  test('shows medal emojis for top 3', async ({ page }) => {
    await mockLeaderboard(page);
    await page.goto('/Leaderboard');
    await expect(page.getByText('🥇')).toBeVisible();
    await expect(page.getByText('🥈')).toBeVisible();
    await expect(page.getByText('🥉')).toBeVisible();
  });

  test('shows rank number for players outside top 3', async ({ page }) => {
    await mockLeaderboard(page);
    await page.goto('/Leaderboard');
    await expect(page.getByText('#4')).toBeVisible();
  });

  test('shows player scores', async ({ page }) => {
    await mockLeaderboard(page);
    await page.goto('/Leaderboard');
    await expect(page.getByText('950')).toBeVisible();
    await expect(page.getByText('820')).toBeVisible();
    await expect(page.getByText('710')).toBeVisible();
  });

  test('highlights current user with "You" badge', async ({ page }) => {
    await mockLeaderboard(page);
    await page.goto('/Leaderboard');
    await page.evaluate(() => localStorage.setItem('username', 'alice'));
    await page.reload();
    await mockLeaderboard(page);
    await expect(page.getByText('You')).toBeVisible();
  });

  test('shows error message when API fails', async ({ page }) => {
    await page.route('**/api/leaderboard', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) })
    );
    await page.goto('/Leaderboard');
    await expect(page.getByText(/Error/i)).toBeVisible();
  });

  test('shows Retry button when API fails', async ({ page }) => {
    await page.route('**/api/leaderboard', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) })
    );
    await page.goto('/Leaderboard');
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('Retry button refetches and shows data on success', async ({ page }) => {
    // Always fail on first load, then switch to success before clicking Retry.
    // A callCount approach breaks here because React 18 StrictMode double-invokes
    // effects in dev, so callCount reaches 2 before the page finishes mounting and
    // the success branch runs, wiping out the error state before we can assert it.
    await page.route('**/api/leaderboard', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) })
    );
    await page.goto('/Leaderboard');
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();

    await page.unroute('**/api/leaderboard');
    await page.route('**/api/leaderboard', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData) })
    );
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText('alice')).toBeVisible();
  });

  test('shows empty list when API returns no players', async ({ page }) => {
    await page.route('**/api/leaderboard', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.goto('/Leaderboard');
    await expect(page.getByRole('heading', { name: /Leaderboard/i })).toBeVisible();
    await expect(page.getByText('alice')).not.toBeVisible();
  });
});
