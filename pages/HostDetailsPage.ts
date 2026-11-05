import type { Locator, Page } from '@playwright/test';

/** Page object for a single host at /hosts/:id/details. */
export class HostDetailsPage {
  readonly hostName: Locator;
  readonly backToHostsButton: Locator;
  readonly detailsPanel: Locator;
  readonly localUsersCard: Locator;
  readonly localUsersSearch: Locator;
  readonly localUserRows: Locator;
  readonly localUsersEmptyState: Locator;
  readonly onlineHistoryModal: Locator;

  constructor(page: Page) {
    this.hostName = page.getByRole('heading', { level: 1 });
    this.backToHostsButton = page.getByRole('button', { name: 'Back to all hosts' });
    this.detailsPanel = page.getByRole('tabpanel', { name: 'Details', exact: true });
    this.localUsersCard = page.locator('.local-user-accounts-card');
    this.localUsersSearch = this.localUsersCard.getByRole('textbox', {
      name: 'Search local user accounts by username',
    });
    this.localUserRows = this.localUsersCard.locator('table tbody tr');
    this.localUsersEmptyState = this.localUsersCard.getByRole('heading', {
      name: 'No users match your search criteria',
    });
    this.onlineHistoryModal = page.locator('.host-online-history-modal.modal__modal_container');
  }

  /** Value next to a label in the Details tab, such as "Operating system". */
  detailValue(label: string): Locator {
    return this.detailsPanel
      .getByRole('term')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .locator('xpath=following-sibling::*[1]');
  }

  async goBackToHosts() {
    await this.backToHostsButton.click();
  }

  /** Clicks the Online or Offline status, which opens the host's online history. */
  async openOnlineHistory() {
    await this.detailValue('Status').getByRole('button').click();
  }

  async closeOnlineHistory() {
    await this.onlineHistoryModal.getByRole('button', { name: 'Done' }).click();
  }

  async searchLocalUsers(text: string) {
    await this.localUsersSearch.fill(text);
  }

  async getLocalUsernames(): Promise<string[]> {
    const usernames = this.localUserRows.locator('td:first-child');
    return (await usernames.allInnerTexts()).map((text) => text.trim());
  }
}
