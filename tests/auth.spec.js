const { test, expect } = require('@playwright/test');

// Use exact API origin so route patterns don't accidentally match page navigation URLs
// e.g. '**/login' would also intercept GET http://localhost:3000/auth/login
const API = 'http://localhost:5001';

test.describe('Login Page', () => {
  test('renders login form fields', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('shows face recognition button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: /Sign in with Face Recognition/i })).toBeVisible();
  });

  test('shows error message on invalid credentials', async ({ page }) => {
    await page.route(`${API}/login`, route =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Invalid username or password' }) })
    );
    await page.goto('/auth/login');
    await page.getByPlaceholder('Username').fill('wronguser');
    await page.getByPlaceholder('Password').fill('wrongpass');
    await page.getByPlaceholder('Email').fill('wrong@email.com');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('shows network error when server is unreachable', async ({ page }) => {
    await page.route(`${API}/login`, route => route.abort());
    await page.goto('/auth/login');
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('testpass');
    await page.getByPlaceholder('Email').fill('test@test.com');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText(/Network error/i)).toBeVisible();
  });

  test('"Create one" link navigates to register page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Create one' }).click();
    await expect(page).toHaveURL('/auth/register');
  });

  test('face recognition button shows scanning state', async ({ page }) => {
    await page.route('**/verified-user', route => route.abort());
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /Sign in with Face Recognition/i }).click();
    await expect(page.getByText(/Scanning for your face/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('Cancel button stops face scanning and restores button', async ({ page }) => {
    await page.route('**/verified-user', route => route.abort());
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /Sign in with Face Recognition/i }).click();
    await expect(page.getByText(/Scanning for your face/i)).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('button', { name: /Sign in with Face Recognition/i })).toBeVisible();
  });

  test('successful login redirects to home page', async ({ page }) => {
    await page.route(`${API}/login`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) })
    );
    await page.route('**/set-user', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    );
    await page.route(`${API}/api/behavior-log**`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.goto('/auth/login');
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('testpass');
    await page.getByPlaceholder('Email').fill('test@test.com');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL('/');
  });

  test('Sign In button shows loading state while submitting', async ({ page }) => {
    await page.route(`${API}/login`, async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) });
    });
    await page.route('**/set-user', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    );
    await page.goto('/auth/login');
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('testpass');
    await page.getByPlaceholder('Email').fill('test@test.com');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByRole('button', { name: /Signing in/i })).toBeVisible();
  });
});

test.describe('Register Page', () => {
  test('renders register form fields', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('"Sign in" link navigates to login page', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/auth/login');
  });

  test('shows error when username already exists', async ({ page }) => {
    await page.route(`${API}/register`, route =>
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ detail: 'Username already exists' }) })
    );
    await page.goto('/auth/register');
    await page.getByPlaceholder('Username').fill('existinguser');
    await page.getByPlaceholder('Email').fill('existing@email.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Username already exists')).toBeVisible();
  });

  test('shows network error when server is unreachable', async ({ page }) => {
    await page.route(`${API}/register`, route => route.abort());
    await page.goto('/auth/register');
    await page.getByPlaceholder('Username').fill('newuser');
    await page.getByPlaceholder('Email').fill('newuser@email.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText(/Network error/i)).toBeVisible();
  });

  test('successful registration redirects to facial-setup', async ({ page }) => {
    await page.route(`${API}/register`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'User created' }) })
    );
    await page.goto('/auth/register');
    await page.getByPlaceholder('Username').fill('newuser');
    await page.getByPlaceholder('Email').fill('newuser@email.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/auth\/facial-setup/);
  });

  test('Create Account button shows loading state while submitting', async ({ page }) => {
    await page.route(`${API}/register`, async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) });
    });
    await page.goto('/auth/register');
    await page.getByPlaceholder('Username').fill('newuser');
    await page.getByPlaceholder('Email').fill('newuser@email.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByRole('button', { name: /Creating account/i })).toBeVisible();
  });
});

test.describe('Protected Route Redirect', () => {
  test('visiting /data while logged out redirects to login', async ({ page }) => {
    await page.route(`${API}/api/behavior-log**`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.goto('/data');
    await expect(page).toHaveURL('/auth/login');
  });
});
