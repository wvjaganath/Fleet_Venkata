import { expect, test as base } from '@playwright/test';
import { HostDetailsPage } from '../pages/HostDetailsPage';
import { HostsPage } from '../pages/HostsPage';

const HEALTH_CHECK_TIMEOUT_MS = 5_000;

interface Fixtures {
  /** Fails the test before it starts if Fleet's /healthz doesn't return 200. */
  fleetHealthCheck: void;
  hostsPage: HostsPage;
  hostDetailsPage: HostDetailsPage;
}

/** Import `test` from here in every spec, not from @playwright/test, to get the health check. */
export const test = base.extend<Fixtures>({
  fleetHealthCheck: [
    async ({ request }, use) => {
      const response = await request
        .get('/healthz', { timeout: HEALTH_CHECK_TIMEOUT_MS })
        .catch((error: Error) => {
          throw new Error(`Fleet is not reachable, so the test was not run: ${error.message}`);
        });

      expect(response.status(), 'Fleet /healthz status, so the test was not run').toBe(200);

      await use();
    },
    { auto: true },
  ],
  hostsPage: async ({ page }, use) => {
    await use(new HostsPage(page));
  },
  hostDetailsPage: async ({ page }, use) => {
    await use(new HostDetailsPage(page));
  },
});

export { expect };
