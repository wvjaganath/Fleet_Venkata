# Fleet end-to-end tests

Playwright tests for the **Hosts** and **Host details** pages of [Fleet](https://fleetdm.com), written in TypeScript using the page object model. They run on Chromium against a local Fleet sandbox.

## Prerequisites

- Node.js 20.12 or newer
- Docker
- fleet preview is up and running. 

## Setup

Install the dependencies and the browser:

```bash
npm install
```

```bash
npx playwright install chromium
```

Create your settings file, then add the email and password you use to log in to Fleet:

```bash
cp .env.example .env
```

Keep the password in single quotes. 

### Settings

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `username` | Yes | | Fleet login email |
| `password` | Yes | | Fleet login password |
| `BASE_URL` | No | `http://localhost:1337` | Fleet server to test |

## Running the tests

Playwright doesn't start Fleet, so start it first:

```bash
fleetctl preview
```

Then run the tests:

| Command | What it does |
|---|---|
| `npm test` | Runs every test |
| `npm run test:headed` | Runs every test with the browser visible |
| `npm run report` | Opens the latest HTML report |
| `npx playwright test tests/hosts.spec.ts` | Runs one spec file |

After a failed run, the HTML report opens automatically and the command waits until you press Ctrl+C.

To stop Fleet when you're finished:

```bash
fleetctl preview stop
```

## Coverage matrix

| Status | Meaning |
|---|---|
| ✅ Covered | A test checks the feature's main behaviour |
| 🟡 Partial | A test checks part of it, and the notes say what's missing |
| ❌ Not covered | No test checks it |

### Hosts page ([tests/hosts.spec.ts](tests/hosts.spec.ts))

| Feature | Status | Notes |
|---|---|---|
| Host count matches the table rows | ✅ Covered | Only works up to 50 hosts, the size of one page |
| Export hosts to CSV | 🟡 Partial | Checks the filename, columns, and each host's name, OS, status and disk space. Doesn't compare agent versions or timestamps, or export with filters applied |
| Search | 🟡 Partial | Checks an exact host name only. Doesn't cover hostname, UUID, serial number, IP address, email or no results |
| Reveal the enroll secret | ✅ Covered | Checks that the secret starts hidden and the eye icon reveals it |
| Enroll secret in Add hosts commands | ✅ Covered | Checks macOS, Windows and Linux |
| Add, edit or delete an enroll secret | ❌ Not covered |  |
| Enroll a host | ❌ Not covered | |
| Status filter | ❌ Not covered | |
| Platform and label filter | ❌ Not covered | |
| Column sorting | ❌ Not covered | |
| Edit columns | ❌ Not covered | |
| Pagination | ❌ Not covered | Needs more than 50 hosts |
| Selecting rows and bulk actions | ❌ Not covered | |
| Custom host vitals and Activity automations | ❌ Not covered |  |

### Host details page ([tests/host-details.spec.ts](tests/host-details.spec.ts))

Each test here clicks one random host, so a single run doesn't cover every host.

| Feature | Status | Notes |
|---|---|---|
| Open a host from the list | ✅ Covered | Checks the heading shows the host's name |
| Back to all hosts | ✅ Covered | |
| Status matches the host list | 🟡 Partial | Offline is only checked when the random host is offline |
| Online history modal | 🟡 Partial | Checks that it opens and closes, but not the chart's contents |
| OS and disk space match the host list | ✅ Covered | |
| Other vitals | ❌ Not covered | Includes agent, memory, MAC address, IP addresses and serial number |
| Local user search | ✅ Covered | Checks a matching username and no match |
| Local user sorting | ❌ Not covered | |
| Activity (Past and Upcoming) | ❌ Not covered | |
| User card and Add user | ❌ Not covered | Add user shows a Fleet Premium message on this install |
| Labels | ❌ Not covered | |
| Agent options | ❌ Not covered | |
| Software tab | ❌ Not covered | Search, filters, pagination and links to software pages |
| Reports tab | ❌ Not covered | |
| Policies tab | ❌ Not covered | |
| Refetch | ❌ Not covered | Queues real work on the host |
| Actions: Live report | ❌ Not covered | |
| Actions: Run script | ❌ Not covered | |
| Actions: Delete | ❌ Not covered | |

### Login and browsers

| Feature | Status | Notes |
|---|---|---|
| Log in with valid credentials | ✅ Covered | Checked by the login setup step |
| Wrong password | ❌ Not covered | Fleet rate-limits failed logins |
| Forgot password | ❌ Not covered | |

## Project structure

```text
fixtures/index.ts    Custom test object: health check and page objects
pages/               Page objects, which hold the selectors and page actions
tests/auth.setup.ts  Logs in once and saves the session
tests/*.spec.ts      The tests and their assertions
utils/               CSV parsing helper
```

## How it works

**Health check.** Before every test, an automatic fixture calls Fleet's `/healthz` endpoint. If it doesn't return 200 within 5 seconds, the test fails without running.

**Login.** The `setup` project logs in once per run and saves the session to `playwright/.auth/user.json`. Every test reuses it, because Fleet rate-limits login attempts.

**Navigation.** Tests open the app at its root and click through to each page: the Hosts link in the navigation, then a host in the table. They don't use page URLs.

**Random hosts.** Each host details test picks a random row number from the Hosts table and clicks that host. `clickRandomHost()` returns what the table showed for it, so the test can compare that with the details page.

