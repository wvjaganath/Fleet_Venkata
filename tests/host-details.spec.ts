import { expect, test } from '../fixtures';
import type { HostRow } from '../pages/HostsPage';

test.describe('Host details page', () => {
  let host: HostRow;

  test.beforeEach(async ({ hostsPage }) => {
    await hostsPage.goto();
    host = await hostsPage.clickRandomHost();
  });

  test('clicking a host in the list opens its details page', async ({ hostDetailsPage }) => {
    await expect(hostDetailsPage.hostName).toHaveText(host.name);
  });

  test('Back to all hosts returns to the host list', async ({ hostsPage, hostDetailsPage }) => {
    await hostDetailsPage.goBackToHosts();

    await expect(hostsPage.heading).toBeVisible();
  });

  test.describe('Details tab', () => {
    test('status matches the host list and opens the online history', async ({
      hostDetailsPage,
    }) => {
      await expect(hostDetailsPage.detailValue('Status')).toHaveText(host.status);

      await hostDetailsPage.openOnlineHistory();
      await expect(hostDetailsPage.onlineHistoryModal).toContainText('Online history');

      await hostDetailsPage.closeOnlineHistory();
      await expect(hostDetailsPage.onlineHistoryModal).toBeHidden();
    });

    test('status, OS and disk space match the host list', async ({ hostDetailsPage }) => {
      await expect(hostDetailsPage.detailValue('Status')).toHaveText(host.status);
      await expect(hostDetailsPage.detailValue('Operating system')).toHaveText(
        host.operatingSystem,
      );
      await expect(hostDetailsPage.detailValue('Disk space available')).toHaveText(host.diskSpace);
    });

    test('local user search narrows the list to matching usernames', async ({
      hostDetailsPage,
    }) => {
      await expect(hostDetailsPage.localUserRows.first()).toBeVisible();
      const usernames = await hostDetailsPage.getLocalUsernames();
      const [username] = usernames;

      await hostDetailsPage.searchLocalUsers(username);

      await expect
        .poll(() => hostDetailsPage.getLocalUsernames())
        .toEqual(usernames.filter((name) => name.includes(username)));
    });

    test('local user search with no match shows the empty state', async ({ hostDetailsPage }) => {
      await hostDetailsPage.searchLocalUsers('no-such-user-zzz');

      await expect(hostDetailsPage.localUsersEmptyState).toBeVisible();
      await expect(hostDetailsPage.localUserRows).toHaveCount(0);
    });
  });
});
