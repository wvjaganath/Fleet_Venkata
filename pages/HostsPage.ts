import type { Download, Locator, Page } from '@playwright/test';

export interface HostRow {
  name: string;
  operatingSystem: string;
  diskSpace: string;
  status: string;
}

/** Page object for the host list at /hosts/manage. */
export class HostsPage {
  readonly navLink: Locator;
  readonly heading: Locator;
  readonly resultCount: Locator;
  readonly searchInput: Locator;
  readonly columnHeaders: Locator;
  readonly rows: Locator;
  readonly emptyState: Locator;
  readonly addHostsButton: Locator;
  readonly addHostsModal: Locator;
  readonly exportButton: Locator;
  readonly settingsButton: Locator;
  readonly enrollSecretsModal: Locator;
  readonly enrollSecretInput: Locator;
  readonly showSecretButton: Locator;

  constructor(private readonly page: Page) {
    this.navLink = page.getByRole('navigation').getByRole('link', { name: 'Hosts', exact: true });
    this.heading = page.getByRole('heading', { name: 'Hosts', level: 1 });
    this.resultCount = page.locator('.table-container__results-count');
    this.searchInput = page.getByRole('textbox', { name: /^Search name, user email/ });
    this.columnHeaders = page.getByRole('columnheader');
    this.rows = page.locator('table tbody tr');
    this.emptyState = page.getByRole('heading', { name: 'No hosts match your filters' });
    // The empty state renders a second "Add hosts" button.
    this.addHostsButton = page.locator('.manage-hosts__add-hosts');
    this.addHostsModal = page.locator('.add-hosts-modal.modal__modal_container');
    this.exportButton = page.getByRole('button', { name: 'Export hosts' });
    this.settingsButton = page.getByRole('button', { name: 'Hosts page settings' });
    this.enrollSecretsModal = page.locator('.enroll-secret-modal.modal__modal_container');
    this.enrollSecretInput = this.enrollSecretsModal.locator('.enroll-secrets__secret input').first();
    this.showSecretButton = this.enrollSecretsModal.getByRole('button', { name: 'Show secret' }).first();
  }

  async goto() {
    await this.page.goto('/');
    await this.navLink.click();
    await this.waitForResults();
  }

  async waitForResults() {
    await this.rows.first().or(this.emptyState).waitFor();
  }

  async search(text: string) {
    await this.searchInput.fill(text);
  }

  /** Clicks a random host in the table and returns what the table showed for it. */
  async clickRandomHost(): Promise<HostRow> {
    const hosts = await this.getHosts();
    const index = Math.floor(Math.random() * hosts.length);
    await this.rows.nth(index).getByRole('link').click();
    return hosts[index];
  }

  /** Text of every visible row in the named column. */
  async columnValues(column: string): Promise<string[]> {
    // The empty state replaces the whole table, headers included.
    if ((await this.rows.count()) === 0) {
      return [];
    }
    const headers = (await this.columnHeaders.allInnerTexts()).map((text) => text.trim());
    const index = headers.indexOf(column);
    if (index === -1) {
      throw new Error(`No "${column}" column. Visible columns: ${headers.join(', ')}`);
    }
    const cells = this.rows.locator(`td:nth-child(${index + 1})`);
    return (await cells.allInnerTexts()).map((text) => text.trim());
  }

  /** Reads the visible rows into plain objects. */
  async getHosts(): Promise<HostRow[]> {
    const [names, operatingSystems, diskSpaces, statuses] = await Promise.all([
      this.columnValues('Host'),
      this.columnValues('Operating system'),
      this.columnValues('Disk space available'),
      this.columnValues('Status'),
    ]);

    return names.map((name, i) => ({
      name,
      operatingSystem: operatingSystems[i],
      diskSpace: diskSpaces[i],
      status: statuses[i],
    }));
  }

  async openAddHosts() {
    await this.addHostsButton.click();
    await this.addHostsModal.waitFor();
  }

  /** The number in the results label at the top left of the table. */
  async getDisplayedHostCount(): Promise<number> {
    const label = await this.resultCount.innerText();
    const count = label.match(/^(\d+) hosts?$/)?.[1];
    if (count === undefined) {
      throw new Error(`Unexpected host count label: "${label}"`);
    }
    return Number(count);
  }

  async exportHosts(): Promise<Download> {
    const downloadStarted = this.page.waitForEvent('download');
    await this.exportButton.click();
    return downloadStarted;
  }

  async openEnrollSecrets() {
    await this.settingsButton.click();
    await this.page.locator('.actions-dropdown-select__option').filter({ hasText: 'Enroll secrets' }).click();
    await this.enrollSecretsModal.waitFor();
  }

  async closeEnrollSecrets() {
    await this.enrollSecretsModal.getByRole('button', { name: 'Done' }).click();
    await this.enrollSecretsModal.waitFor({ state: 'hidden' });
  }

  /** Selects a platform tab in the Add hosts modal and reads the secret from its install command. */
  async getSecretFromAddHostsTab(platform: 'macOS' | 'Windows' | 'Linux'): Promise<string> {
    await this.addHostsModal.getByRole('tab', { name: platform, exact: true }).click();
    const command = await this.addHostsModal
      .getByRole('tabpanel', { name: platform, exact: true })
      .locator('textarea[name="installer"]')
      .inputValue();
    const secret = command.match(/--enroll-secret=(\S+)/)?.[1];
    if (!secret) {
      throw new Error(`No --enroll-secret in the ${platform} install command.`);
    }
    return secret;
  }
}
