import { readFile } from 'node:fs/promises';
import { expect, test } from '../fixtures';
import { parseCsv } from '../utils/csv';

test.describe('Hosts page', () => {
  test.beforeEach(async ({ hostsPage }) => {
    await hostsPage.goto();
  });

  test('host count at the top left matches the hosts in the table', async ({ hostsPage }) => {
    const displayedCount = await hostsPage.getDisplayedHostCount();

    expect(displayedCount).toBeGreaterThan(0);
    await expect(hostsPage.rows).toHaveCount(displayedCount);
  });

  test('Export hosts downloads a CSV with the correct data', async ({ hostsPage }, testInfo) => {
    const hosts = await hostsPage.getHosts();

    const download = await hostsPage.exportHosts();

    expect(download.suggestedFilename()).toMatch(/^Hosts \d{4}-\d{2}-\d{2}\.csv$/);
    // saveAs works for local and remote browsers, but path() is only available for local ones.
    const csvPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(csvPath);
    const records = parseCsv(await readFile(csvPath, 'utf8'));

    expect(Object.keys(records[0])).toEqual([
      'display_name',
      'os_version',
      'detail_updated_at',
      'gigs_disk_space_available',
      'status',
      'orbit_version',
      'osquery_version',
      'last_restarted_at',
    ]);
    expect(
      records.map((record) => ({
        name: record.display_name,
        operatingSystem: record.os_version,
        status: record.status,
        diskSpace: Number(record.gigs_disk_space_available),
      })),
    ).toEqual(
      hosts.map((host) => ({
        name: host.name,
        operatingSystem: host.operatingSystem,
        status: host.status.toLowerCase(),
        diskSpace: parseFloat(host.diskSpace),
      })),
    );
  });

  test('search finds a host by name', async ({ hostsPage }) => {
    const names = await hostsPage.columnValues('Host');
    const hostName = names.find((name) => names.indexOf(name) === names.lastIndexOf(name));
    if (!hostName) {
      throw new Error('This test needs a host with a unique name.');
    }

    await hostsPage.search(hostName);

    await expect(hostsPage.resultCount).toHaveText('1 host');
    await expect.poll(() => hostsPage.columnValues('Host')).toEqual([hostName]);
  });

  test('revealed enroll secret matches the macOS, Windows and Linux add host commands', async ({
    hostsPage,
  }) => {
    await hostsPage.openEnrollSecrets();
    await expect(hostsPage.enrollSecretInput).toHaveAttribute('type', 'password');

    await hostsPage.showSecretButton.click();
    await expect(hostsPage.enrollSecretInput).toHaveAttribute('type', 'text');
    const secret = await hostsPage.enrollSecretInput.inputValue();
    expect(secret).not.toBe('');
    await hostsPage.closeEnrollSecrets();

    await hostsPage.openAddHosts();

    expect(await hostsPage.getSecretFromAddHostsTab('macOS')).toBe(secret);
    expect(await hostsPage.getSecretFromAddHostsTab('Windows')).toBe(secret);
    expect(await hostsPage.getSecretFromAddHostsTab('Linux')).toBe(secret);
  });
});
