import { test as setup, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';

setup('log in', async ({ page, hostsPage }) => {
  const { username, password } = process.env;
  if (!username || !password) {
    throw new Error('Set username and password in .env (see .env.example).');
  }

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(username, password);

  await expect(hostsPage.navLink).toBeVisible();
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
