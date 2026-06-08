import "@testing-library/jest-dom/vitest";
import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import AccountAndOptionalSyncScreen, {
  copy,
  hasUsableAccountAndOptionalSyncReport,
  isAccountAndOptionalSyncState,
  isOptionalSyncAccountStatus,
  isOptionalSyncActionKind,
  type AccountAndOptionalSyncProfile,
  type AccountAndOptionalSyncReport,
  type AccountAndOptionalSyncScreenProps,
} from "./account-and-optional-sync-screen";

const opaqueProfileIds = [
  "profile-secret-alex",
  "profile-secret-maya",
  "profile-secret-noor",
] as const;

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

const defaultProfiles: AccountAndOptionalSyncProfile[] =
  [
    {
      profileId: opaqueProfileIds[0],
      displayName: "Alex",
      storageStateLabel:
        "Host label: local profile",
      storageSupporting:
        "Host says this profile remains local.",
      syncAction: "enable",
      consentStateLabel:
        "Host consent label: active",
      facialDataStateLabel:
        "Host facial-data label: saved locally",
    },
    {
      profileId: opaqueProfileIds[1],
      displayName: "Maya",
      storageStateLabel:
        "Host label: synced profile",
      storageSupporting:
        "Host says sync is available.",
      syncAction: "disable",
      syncActionLabel:
        "Host remove sync label",
      consentStateLabel:
        "Host consent label: active",
      facialDataStateLabel:
        "Host facial-data label: synced copy",
    },
    {
      profileId: opaqueProfileIds[2],
      displayName: "Noor",
      storageStateLabel:
        "Host label: sync unavailable",
      syncAction: null,
      syncBlockedLabel:
        "Host sync blocked label",
    },
  ];

const defaultReport: AccountAndOptionalSyncReport = {
  accountStatus: "signed-out",
  accountStatusLabel: "Host status: signed out",
  accountSupporting:
    "Host account supporting label.",
  accountDisplayLabel:
    "Host account display label",
  profiles: defaultProfiles,
  helperLabel:
    "Host helper: account actions are requests.",
  privacyLabel:
    "Host privacy label: settings stay host-owned.",
};

function reportWith(
  overrides: Partial<AccountAndOptionalSyncReport> = {},
): AccountAndOptionalSyncReport {
  return {
    ...defaultReport,
    ...overrides,
  };
}

function defaultProps(
  overrides: Partial<AccountAndOptionalSyncScreenProps> = {},
): AccountAndOptionalSyncScreenProps {
  return {
    state: "ready",
    report: defaultReport,
    onBack: vi.fn(),
    onRequestSignIn: vi.fn(),
    onRequestSignOut: vi.fn(),
    onEnableProfileSync: vi.fn(),
    onDisableProfileSync: vi.fn(),
    onRevokeConsent: vi.fn(),
    onRequestFacialDataDeletion: vi.fn(),
    onRetryLoad: vi.fn(),
    ...overrides,
  };
}

function renderScreen(
  overrides: Partial<AccountAndOptionalSyncScreenProps> = {},
) {
  const props = defaultProps(overrides);
  const view = render(
    <AccountAndOptionalSyncScreen {...props} />,
  );
  return { ...view, props };
}

function sourceText() {
  return document.body.textContent ?? "";
}

function getProfileCards() {
  return screen.getAllByTestId(
    "sync-profile-card",
  );
}

function profileCard(displayName: string) {
  const card = getProfileCards().find((candidate) =>
    within(candidate).queryByRole("heading", {
      level: 3,
      name: displayName,
    }),
  );

  if (!card) {
    throw new Error(`Missing card: ${displayName}`);
  }

  return card;
}

function expectTextOrder(
  ...texts: string[]
) {
  const rendered = sourceText();
  let lastIndex = -1;

  for (const text of texts) {
    const nextIndex = rendered.indexOf(text);
    expect(nextIndex).toBeGreaterThan(
      lastIndex,
    );
    lastIndex = nextIndex;
  }
}

function expectOpaqueIdsNotRendered() {
  const rendered = sourceText();

  for (const profileId of opaqueProfileIds) {
    expect(rendered).not.toContain(profileId);
  }
}

function restoreDescriptor(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(
      target,
      property,
      descriptor,
    );
  } else {
    delete (target as Record<PropertyKey, unknown>)[property];
  }
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("AccountAndOptionalSyncScreen runtime helpers", () => {
  it.each([
    "loading",
    "ready",
    "empty",
    "error",
  ])("recognises supported state %s", (state) => {
    expect(
      isAccountAndOptionalSyncState(state),
    ).toBe(true);
  });

  it.each([
    "idle",
    "",
    null,
    undefined,
    1,
    {},
  ])("rejects unsupported state %s", (state) => {
    expect(
      isAccountAndOptionalSyncState(state),
    ).toBe(false);
  });

  it.each([
    "signed-out",
    "signed-in",
  ])("recognises account status %s", (status) => {
    expect(
      isOptionalSyncAccountStatus(status),
    ).toBe(true);
  });

  it.each([
    "unknown",
    "",
    null,
    undefined,
  ])("rejects account status %s", (status) => {
    expect(
      isOptionalSyncAccountStatus(status),
    ).toBe(false);
  });

  it.each([
    "enable",
    "disable",
  ])("recognises sync action %s", (action) => {
    expect(isOptionalSyncActionKind(action)).toBe(
      true,
    );
  });

  it.each([
    "remove",
    "",
    null,
    undefined,
    2,
  ])("rejects sync action %s", (action) => {
    expect(isOptionalSyncActionKind(action)).toBe(
      false,
    );
  });

  it("validates only usable required report context", () => {
    expect(
      hasUsableAccountAndOptionalSyncReport(
        defaultReport,
      ),
    ).toBe(true);
    expect(
      hasUsableAccountAndOptionalSyncReport(null),
    ).toBe(false);
    expect(
      hasUsableAccountAndOptionalSyncReport({
        ...defaultReport,
        accountStatus:
          "bad" as AccountAndOptionalSyncReport["accountStatus"],
      }),
    ).toBe(false);
    expect(
      hasUsableAccountAndOptionalSyncReport({
        ...defaultReport,
        accountStatusLabel: " ",
      }),
    ).toBe(false);
    expect(
      hasUsableAccountAndOptionalSyncReport({
        ...defaultReport,
        profiles:
          "bad" as unknown as AccountAndOptionalSyncProfile[],
      }),
    ).toBe(false);
  });

  it("fails malformed ready context closed and renders ready empty arrays", () => {
    renderScreen({
      report: null,
      state: "ready",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      copy.errorHeading,
    );

    cleanup();

    renderScreen({
      report: reportWith({ profiles: [] }),
      state: "ready",
    });

    expect(
      screen.getByText(copy.emptyHeading),
    ).toBeVisible();

    cleanup();

    renderScreen({
      state:
        "mystery" as AccountAndOptionalSyncScreenProps["state"],
    });

    expect(
      screen.getByRole("alert"),
    ).toBeInTheDocument();
  });
});

describe("AccountAndOptionalSyncScreen core rendering", () => {
  it("renders loading heading with polite static-only semantics", () => {
    renderScreen({ state: "loading" });

    const heading = screen.getByRole(
      "heading",
      {
        level: 1,
        name: copy.loadingHeading,
      },
    );
    const status = heading.closest('[role="status"]');

    expect(status).toHaveTextContent(
      copy.loadingSupporting,
    );
    expect(status).not.toContainElement(
      screen.getByRole("button", {
        name: copy.back,
      }),
    );
  });

  it("renders ready heading, one h1, explanation, and trust copy", () => {
    renderScreen();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.heading,
      }),
    ).toBeVisible();
    expect(
      screen.getAllByRole("heading", {
        level: 1,
      }),
    ).toHaveLength(1);
    expect(
      screen.getByText(copy.supporting),
    ).toBeVisible();
    expect(
      screen.getByTestId(
        "local-first-trust-card",
      ),
    ).toHaveTextContent(copy.trustCopy);
  });

  it("keeps mobile reading order aligned with account controls", () => {
    renderScreen({ isOffline: true });

    expectTextOrder(
      copy.wordmark,
      copy.heading,
      copy.offline,
      copy.trustHeading,
      copy.accountCardHeading,
      copy.profileListHeading,
      "Alex",
      defaultReport.helperLabel as string,
    );
  });

  it("renders offline as informational while content remains readable", () => {
    renderScreen({ isOffline: true });

    expect(
      screen
        .getByText(copy.offline)
        .closest('[role="status"]'),
    ).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeVisible();
    expect(
      screen.getByText(defaultReport.accountStatusLabel),
    ).toBeVisible();
  });

  it("preserves received profile order and never renders opaque IDs", () => {
    renderScreen({
      report: reportWith({
        profiles: [
          defaultProfiles[1],
          defaultProfiles[0],
          defaultProfiles[2],
        ],
      }),
    });

    expectTextOrder("Maya", "Alex", "Noor");
    expectOpaqueIdsNotRendered();
  });

  it("preserves malformed profile entries in place with neutral fallbacks", () => {
    renderScreen({
      report: reportWith({
        profiles: [
          defaultProfiles[0],
          null,
          undefined,
          "unexpected",
          42,
          {
            profileId: " ",
            displayName: "",
            storageStateLabel: null,
            storageSupporting:
              "Host storage supporting copy",
            consentStateLabel:
              "Host consent display copy",
            facialDataStateLabel:
              "Host saved-data display copy",
          },
          defaultProfiles[1],
        ] as unknown as AccountAndOptionalSyncProfile[],
      }),
    });

    const cards = getProfileCards();
    expect(cards).toHaveLength(7);
    expect(cards[0]).toHaveTextContent("Alex");
    expect(cards[1]).toHaveTextContent(
      copy.unnamedProfile,
    );
    expect(cards[1]).toHaveTextContent(
      copy.storageFallback,
    );
    expect(cards[5]).toHaveTextContent(
      "Host storage supporting copy",
    );
    expect(cards[5]).toHaveTextContent(
      "Host consent display copy",
    );
    expect(cards[5]).toHaveTextContent(
      "Host saved-data display copy",
    );
    expect(cards[6]).toHaveTextContent("Maya");
    expect(sourceText()).not.toContain(
      "unexpected",
    );
  });
});

describe("Account state actions", () => {
  it("renders signed-out host labels and invokes sign-in explicitly", () => {
    const onRequestSignIn = vi.fn();
    renderScreen({ onRequestSignIn });

    expect(
      screen.getByText("Host status: signed out"),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Host account display label",
      ),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.signIn,
      }),
    );

    expect(onRequestSignIn).toHaveBeenCalledTimes(1);
  });

  it("renders signed-in host labels and invokes sign-out explicitly", () => {
    const onRequestSignOut = vi.fn();
    renderScreen({
      onRequestSignOut,
      report: reportWith({
        accountStatus: "signed-in",
        accountStatusLabel:
          "Host status: signed in",
      }),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.signOut,
      }),
    );

    expect(onRequestSignOut).toHaveBeenCalledTimes(1);
  });

  it("shows sign-in pending state, duplicate protection, success toast, and no local mutation", async () => {
    const pending = deferred();
    const onRequestSignIn = vi.fn(
      () => pending.promise,
    );
    renderScreen({ onRequestSignIn });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.signIn,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.signInPending,
      }),
    );

    expect(onRequestSignIn).toHaveBeenCalledTimes(1);
    pending.resolve();

    expect(
      await screen.findByText(copy.accountSuccess),
    ).toBeVisible();
    expect(
      screen.getByText("Host status: signed out"),
    ).toBeVisible();
  });

  it.each([
    {
      name: "host block",
      props: { canRequestSignIn: false },
      label: copy.signInBlocked,
    },
    {
      name: "callback absent",
      props: { onRequestSignIn: undefined },
      label: copy.signInBlocked,
    },
    {
      name: "offline block",
      props: {
        isOffline: true,
        isSignInAvailableOffline: false,
      },
      label: copy.signInReconnect,
    },
    {
      name: "host block beats offline",
      props: {
        canRequestSignIn: false,
        isOffline: true,
        isSignInAvailableOffline: false,
      },
      label: copy.signInBlocked,
    },
  ])("keeps blocked sign-in guarded for $name", ({ props, label }) => {
    const onRequestSignIn = vi.fn();
    renderScreen({
      onRequestSignIn,
      ...props,
    });

    const button = screen.getByRole("button", {
      name: label,
    });
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onRequestSignIn).not.toHaveBeenCalled();
  });

  it("shows sign-out rejection toast", async () => {
    renderScreen({
      onRequestSignOut: vi.fn().mockRejectedValue(
        new Error("fail"),
      ),
      report: reportWith({
        accountStatus: "signed-in",
        accountStatusLabel:
          "Host status: signed in",
      }),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.signOut,
      }),
    );

    expect(
      await screen.findByText(copy.signOutError),
    ).toBeVisible();
  });
});

describe("Profile sync actions", () => {
  it("invokes enable and disable callbacks with callback-only profile IDs", async () => {
    const onEnableProfileSync = vi.fn();
    const onDisableProfileSync = vi.fn();
    renderScreen({
      onDisableProfileSync,
      onEnableProfileSync,
    });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.enableSync}: Alex`,
        },
      ),
    );

    expect(onEnableProfileSync).toHaveBeenCalledWith(
      opaqueProfileIds[0],
    );
    expect(
      await screen.findByText(copy.syncSuccess),
    ).toBeVisible();

    fireEvent.click(
      within(profileCard("Maya")).getByRole(
        "button",
        {
          name: "Host remove sync label: Maya",
        },
      ),
    );

    expect(onDisableProfileSync).toHaveBeenCalledWith(
      opaqueProfileIds[1],
    );
    expectOpaqueIdsNotRendered();
  });

  it("shows sync pending label, disables conflicting controls, and shows success toast", async () => {
    const pending = deferred();
    const onEnableProfileSync = vi.fn(
      () => pending.promise,
    );
    renderScreen({ onEnableProfileSync });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.enableSync}: Alex`,
        },
      ),
    );
    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.enableSyncPending}: Alex`,
        },
      ),
    );

    expect(onEnableProfileSync).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", {
        name: copy.back,
      }),
    ).toBeDisabled();
    pending.resolve();

    expect(
      await screen.findByText(copy.syncSuccess),
    ).toBeVisible();
    expect(
      within(profileCard("Alex")).getByText(
        "Host label: local profile",
      ),
    ).toBeVisible();
  });

  it.each([
    {
      name: "global host block",
      props: { canManageProfileSync: false },
      label: copy.syncBlocked,
      profileName: "Alex",
    },
    {
      name: "per-profile host block",
      props: {
        report: reportWith({
          profiles: [
            {
              ...defaultProfiles[0],
              canActivateSyncAction: false,
              syncBlockedLabel:
                "Host profile sync blocked",
            },
          ],
        }),
      },
      label: "Host profile sync blocked",
      profileName: "Alex",
    },
    {
      name: "malformed ID",
      props: {
        report: reportWith({
          profiles: [
            {
              ...defaultProfiles[0],
              profileId: "",
            },
          ],
        }),
      },
      label: copy.syncBlocked,
      profileName: "Alex",
    },
    {
      name: "missing action",
      props: {
        report: reportWith({
          profiles: [
            {
              ...defaultProfiles[0],
              syncAction: null,
            },
          ],
        }),
      },
      label: copy.syncBlocked,
      profileName: "Alex",
    },
    {
      name: "callback absent",
      props: { onEnableProfileSync: undefined },
      label: copy.syncBlocked,
      profileName: "Alex",
    },
    {
      name: "offline block",
      props: {
        isOffline: true,
        isSyncAvailableOffline: false,
      },
      label: copy.syncReconnect,
      profileName: "Alex",
    },
    {
      name: "general block beats reconnect",
      props: {
        canManageProfileSync: false,
        isOffline: true,
        isSyncAvailableOffline: false,
      },
      label: copy.syncBlocked,
      profileName: "Alex",
    },
  ])("keeps blocked sync action guarded for $name", ({ props, label, profileName }) => {
    const onEnableProfileSync = vi.fn();
    renderScreen({
      onEnableProfileSync,
      ...props,
    });

    const button = within(
      profileCard(profileName),
    ).getByRole("button", {
      name: `${label}: ${profileName}`,
    });
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onEnableProfileSync).not.toHaveBeenCalled();
  });

  it("shows sync rejection toast", async () => {
    renderScreen({
      onEnableProfileSync: vi.fn().mockRejectedValue(
        new Error("fail"),
      ),
    });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.enableSync}: Alex`,
        },
      ),
    );

    expect(
      await screen.findByText(copy.enableSyncError),
    ).toBeVisible();
  });
});

describe("Duplicate profile IDs", () => {
  it("keeps duplicate cards readable while disabling all trust-critical actions", () => {
    const onEnableProfileSync = vi.fn();
    const onRevokeConsent = vi.fn();
    const onRequestFacialDataDeletion = vi.fn();
    renderScreen({
      onEnableProfileSync,
      onRequestFacialDataDeletion,
      onRevokeConsent,
      report: reportWith({
        profiles: [
          {
            ...defaultProfiles[0],
            profileId: "duplicate-profile",
            displayName: "June duplicate",
          },
          {
            ...defaultProfiles[0],
            profileId: "duplicate-profile",
            displayName: "July duplicate",
          },
          {
            ...defaultProfiles[2],
            displayName: "August unique",
          },
        ],
      }),
    });

    expectTextOrder(
      "June duplicate",
      "July duplicate",
      "August unique",
    );
    expect(getProfileCards()).toHaveLength(3);

    for (const label of [
      "June duplicate",
      "July duplicate",
    ]) {
      const card = profileCard(label);
      const buttons = within(card).getAllByRole(
        "button",
      );
      for (const button of buttons) {
        expect(button).toBeDisabled();
        button.removeAttribute("disabled");
        fireEvent.click(button);
      }
    }

    expect(onEnableProfileSync).not.toHaveBeenCalled();
    expect(onRevokeConsent).not.toHaveBeenCalled();
    expect(
      onRequestFacialDataDeletion,
    ).not.toHaveBeenCalled();
    expect(
      within(profileCard("August unique")).getByRole(
        "button",
        {
          name: "Host sync blocked label: August unique",
        },
      ),
    ).toBeDisabled();
  });
});

describe("Privacy request confirmations", () => {
  it("opens consent confirmation without invoking the host callback", () => {
    const onRevokeConsent = vi.fn();
    renderScreen({ onRevokeConsent });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );

    expect(onRevokeConsent).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", {
      name: copy.revokeDialogTitle,
    });
    expect(dialog).toHaveTextContent(
      copy.revokeDialogTitle,
    );
    expect(dialog).toHaveAttribute(
      "aria-describedby",
    );
    expect(
      document.getElementById(
        dialog.getAttribute(
          "aria-describedby",
        ) ?? "",
      ),
    ).toHaveTextContent(
      copy.revokeDialogSupporting,
    );
    expect(dialog).toHaveTextContent("Alex");
    expect(sourceText()).not.toContain(
      opaqueProfileIds[0],
    );
    expect(
      document
        .querySelector('[aria-hidden="true"]')
        ?.hasAttribute("inert"),
    ).toBe(true);
  });

  it("opens facial-data deletion confirmation without invoking the host callback", () => {
    const onRequestFacialDataDeletion = vi.fn();
    renderScreen({ onRequestFacialDataDeletion });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestFacialData}: Alex`,
        },
      ),
    );

    expect(
      onRequestFacialDataDeletion,
    ).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", {
      name: copy.deletionDialogTitle,
    });
    expect(dialog).toHaveTextContent(
      copy.deletionDialogTitle,
    );
    expect(dialog).toHaveAttribute(
      "aria-describedby",
    );
    expect(
      document.getElementById(
        dialog.getAttribute(
          "aria-describedby",
        ) ?? "",
      ),
    ).toHaveTextContent(
      copy.deletionDialogSupporting,
    );
  });

  it("guards immediate dismissal attempts after confirmation begins", async () => {
    const pending = deferred();
    const onRevokeConsent = vi.fn(
      () => pending.promise,
    );
    renderScreen({ onRevokeConsent });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );

    const dialog = screen.getByRole("dialog", {
      name: copy.revokeDialogTitle,
    });
    const cancelButton = screen.getByRole(
      "button",
      {
        name: copy.cancel,
      },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    );
    fireEvent.click(cancelButton);
    fireEvent.keyDown(dialog, {
      key: "Escape",
    });

    expect(onRevokeConsent).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("dialog", {
        name: copy.revokeDialogTitle,
      }),
    ).toBeVisible();

    pending.resolve();
    expect(
      await screen.findByText(copy.privacySuccess),
    ).toBeVisible();
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog"),
      ).not.toBeInTheDocument();
    });
  });

  it("prevents pending Tab movement from leaving the confirmation dialog", () => {
    const pending = deferred();
    renderScreen({
      onRevokeConsent: vi.fn(
        () => pending.promise,
      ),
    });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );
    const confirmButton = screen.getByRole(
      "button",
      {
        name: copy.confirmRequest,
      },
    );
    confirmButton.focus();
    fireEvent.click(confirmButton);

    const dialog = screen.getByRole("dialog", {
      name: copy.revokeDialogTitle,
    });
    expect(
      fireEvent.keyDown(dialog, {
        key: "Tab",
      }),
    ).toBe(false);
    expect(
      fireEvent.keyDown(dialog, {
        key: "Tab",
        shiftKey: true,
      }),
    ).toBe(false);
    expect(dialog).toBeVisible();

    pending.resolve();
  });

  it("does not replace an active privacy confirmation candidate", () => {
    const onRevokeConsent = vi.fn();
    const onRequestFacialDataDeletion = vi.fn();
    renderScreen({
      onRequestFacialDataDeletion,
      onRevokeConsent,
    });
    const mayaDeletionButton = within(
      profileCard("Maya"),
    ).getByRole("button", {
      name: `${copy.requestFacialData}: Maya`,
    });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );
    fireEvent.click(mayaDeletionButton);

    const dialog = screen.getByRole("dialog", {
      name: copy.revokeDialogTitle,
    });
    expect(dialog).toHaveTextContent("Alex");
    expect(dialog).not.toHaveTextContent("Maya");
    expect(
      screen.queryByRole("dialog", {
        name: copy.deletionDialogTitle,
      }),
    ).not.toBeInTheDocument();
    expect(onRevokeConsent).not.toHaveBeenCalled();
    expect(
      onRequestFacialDataDeletion,
    ).not.toHaveBeenCalled();
  });

  it("keeps the first candidate through same-window forced privacy activations", () => {
    renderScreen();
    const alexConsentButton = within(
      profileCard("Alex"),
    ).getByRole("button", {
      name: `${copy.requestConsent}: Alex`,
    });
    const mayaDeletionButton = within(
      profileCard("Maya"),
    ).getByRole("button", {
      name: `${copy.requestFacialData}: Maya`,
    });

    fireEvent.click(alexConsentButton);
    fireEvent.click(mayaDeletionButton);

    const dialog = screen.getByRole("dialog", {
      name: copy.revokeDialogTitle,
    });
    expect(dialog).toHaveTextContent("Alex");
    expect(dialog).not.toHaveTextContent("Maya");
    expect(
      screen.queryByRole("dialog", {
        name: copy.deletionDialogTitle,
      }),
    ).not.toBeInTheDocument();
  });

  it("blocks forced background callbacks while a privacy dialog is open and restores them after cancel", async () => {
    const onBack = vi.fn();
    const onRequestSignIn = vi.fn();
    const onEnableProfileSync = vi.fn();
    renderScreen({
      onBack,
      onEnableProfileSync,
      onRequestSignIn,
    });

    const backButton = screen.getByRole("button", {
      name: copy.back,
    });
    const signInButton = screen.getByRole("button", {
      name: copy.signIn,
    });
    const syncButton = within(
      profileCard("Alex"),
    ).getByRole("button", {
      name: `${copy.enableSync}: Alex`,
    });
    const privacyButton = within(
      profileCard("Alex"),
    ).getByRole("button", {
      name: `${copy.requestConsent}: Alex`,
    });

    fireEvent.click(privacyButton);
    fireEvent.click(backButton);
    fireEvent.click(signInButton);
    fireEvent.click(syncButton);

    expect(onBack).not.toHaveBeenCalled();
    expect(onRequestSignIn).not.toHaveBeenCalled();
    expect(onEnableProfileSync).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.cancel,
      }),
    );

    fireEvent.click(backButton);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(signInButton);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(syncButton);
    await act(async () => {
      await Promise.resolve();
    });

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onRequestSignIn).toHaveBeenCalledTimes(1);
    expect(onEnableProfileSync).toHaveBeenCalledWith(
      opaqueProfileIds[0],
    );
  });

  it("blocks forced background Retry while a privacy dialog is open", () => {
    const onRetryLoad = vi.fn();
    const { rerender, props } = renderScreen({
      onRetryLoad,
    });

    rerender(
      <AccountAndOptionalSyncScreen
        {...props}
        report={defaultReport}
        state="ready"
      />,
    );

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );
    rerender(
      <AccountAndOptionalSyncScreen
        {...props}
        report={null}
        state="empty"
      />,
    );
    const retryButton = screen.getByRole("button", {
      hidden: true,
      name: copy.retryLoad,
    });
    fireEvent.click(retryButton);
    expect(onRetryLoad).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.cancel,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.retryLoad,
      }),
    );
    expect(onRetryLoad).toHaveBeenCalledTimes(1);
  });

  it("cancels with button and Escape while returning focus", async () => {
    const user = userEvent.setup();
    renderScreen();
    const opener = within(profileCard("Alex")).getByRole(
      "button",
      {
        name: `${copy.requestConsent}: Alex`,
      },
    );

    await user.click(opener);
    expect(
      screen.getByRole("button", {
        name: copy.cancel,
      }),
    ).toHaveFocus();

    await user.tab();
    expect(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    ).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("button", {
        name: copy.cancel,
      }),
    ).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("dialog"), {
      key: "Escape",
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog"),
      ).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(opener).toHaveFocus();
    });

    await user.click(opener);
    await user.click(
      screen.getByRole("button", {
        name: copy.cancel,
      }),
    );
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog"),
      ).not.toBeInTheDocument();
    });
  });

  it("confirms privacy request with callback-only profile ID and no local card mutation", async () => {
    const onRevokeConsent = vi.fn();
    renderScreen({ onRevokeConsent });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    );

    expect(onRevokeConsent).toHaveBeenCalledWith(
      opaqueProfileIds[0],
    );
    expect(
      await screen.findByText(copy.privacySuccess),
    ).toBeVisible();
    expect(
      screen.queryByRole("dialog"),
    ).not.toBeInTheDocument();
    expect(profileCard("Alex")).toHaveTextContent(
      "Host consent label: active",
    );
    expectOpaqueIdsNotRendered();
  });

  it("blocks duplicate confirmation and dismissal while pending", async () => {
    const pending = deferred();
    const onRevokeConsent = vi.fn(
      () => pending.promise,
    );
    renderScreen({ onRevokeConsent });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    );

    expect(onRevokeConsent).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", {
        name: copy.privacyPending,
      }),
    ).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), {
      key: "Escape",
    });
    expect(screen.getByRole("dialog")).toBeVisible();

    pending.resolve();
    expect(
      await screen.findByText(copy.privacySuccess),
    ).toBeVisible();
  });

  it("shows rejection toast for privacy callback failure", async () => {
    renderScreen({
      onRequestFacialDataDeletion: vi
        .fn()
        .mockRejectedValue(new Error("fail")),
    });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestFacialData}: Alex`,
        },
      ),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    );

    expect(
      await screen.findByText(copy.privacyError),
    ).toBeVisible();
  });

  it("keeps the dialog open after privacy callback rejection until explicit cancel", async () => {
    const onRevokeConsent = vi
      .fn()
      .mockRejectedValue(new Error("fail"));
    renderScreen({ onRevokeConsent });
    const opener = within(profileCard("Alex")).getByRole(
      "button",
      {
        name: `${copy.requestConsent}: Alex`,
      },
    );

    fireEvent.click(opener);
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    );

    expect(
      await screen.findByText(copy.privacyError),
    ).toBeVisible();
    expect(
      screen.getByRole("dialog", {
        name: copy.revokeDialogTitle,
      }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    );
    await waitFor(() => {
      expect(onRevokeConsent).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.cancel,
      }),
    );
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog"),
      ).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(opener).toHaveFocus();
    });
  });

  it.each([
    {
      name: "removed candidate",
      report: reportWith({ profiles: [] }),
    },
    {
      name: "duplicated candidate",
      report: reportWith({
        profiles: [
          defaultProfiles[0],
          defaultProfiles[0],
        ],
      }),
    },
    {
      name: "newly blocked candidate",
      report: reportWith({
        profiles: [
          {
            ...defaultProfiles[0],
            canRevokeConsent: false,
          },
        ],
      }),
    },
  ])("fails closed for stale $name", async ({ report }) => {
    const onRevokeConsent = vi.fn();
    const { rerender, props } = renderScreen({
      onRevokeConsent,
    });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );

    rerender(
      <AccountAndOptionalSyncScreen
        {...props}
        report={report}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    );

    expect(onRevokeConsent).not.toHaveBeenCalled();
    expect(
      await screen.findByText(copy.privacyError),
    ).toBeVisible();
  });

  it("fails closed when refreshed required report context becomes malformed", async () => {
    const onRevokeConsent = vi.fn();
    const { rerender, props } = renderScreen({
      onRevokeConsent,
    });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );

    rerender(
      <AccountAndOptionalSyncScreen
        {...props}
        report={reportWith({
          accountStatusLabel: " ",
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    );

    expect(onRevokeConsent).not.toHaveBeenCalled();
    expect(
      await screen.findByText(copy.privacyError),
    ).toBeVisible();
    expect(
      screen.queryByRole("dialog"),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      name: "callback withheld",
      props: { onRevokeConsent: undefined },
    },
    {
      name: "offline blocked",
      props: {
        isOffline: true,
        isPrivacyRequestAvailableOffline: false,
      },
    },
  ])("fails closed for $name confirmation", async ({ props }) => {
    const onRevokeConsent = vi.fn();
    const { rerender, props: initialProps } =
      renderScreen({ onRevokeConsent });

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.requestConsent}: Alex`,
        },
      ),
    );

    rerender(
      <AccountAndOptionalSyncScreen
        {...initialProps}
        {...props}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.confirmRequest,
      }),
    );

    expect(onRevokeConsent).not.toHaveBeenCalled();
    expect(
      await screen.findByText(copy.privacyError),
    ).toBeVisible();
  });
});

describe("Empty, Back, and Retry", () => {
  it("lets explicit Empty override stale profiles while keeping account card readable", () => {
    renderScreen({
      state: "empty",
      report: defaultReport,
    });

    expect(
      screen.getByText(copy.emptyHeading),
    ).toBeVisible();
    expect(
      screen.getByText(defaultReport.accountStatusLabel),
    ).toBeVisible();
    expect(screen.queryByText("Alex")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("alert"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: copy.back,
      }),
    ).toBeVisible();
  });

  it("fails malformed explicit Empty context closed instead of rendering a blank shell", () => {
    const { rerender } = renderScreen({
      report: null,
      state: "empty",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      copy.errorHeading,
    );
    expect(
      screen.queryByText(copy.emptyHeading),
    ).not.toBeInTheDocument();

    rerender(
      <AccountAndOptionalSyncScreen
        {...defaultProps({
          report: {
            ...defaultReport,
            accountStatusLabel: " ",
          },
          state: "empty",
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      copy.errorHeading,
    );
  });

  it.each([
    {
      state: "empty" as const,
      report: defaultReport,
    },
    {
      state: "ready" as const,
      report: reportWith({ profiles: [] }),
    },
  ])("renders neutral empty profile card for $state", (props) => {
    renderScreen(props);

    const card = screen.getByTestId(
      "empty-sync-profile-card",
    );
    expect(card).toHaveClass(
      "border-[var(--dl-parchment)]",
    );
    expect(card).toHaveClass(
      "bg-[var(--dl-surface-soft)]",
    );
    expect(card).not.toHaveAttribute(
      "role",
      "alert",
    );
  });

  it("runs Back only on explicit activation and guards failures", async () => {
    const onBack = vi.fn().mockRejectedValue(
      new Error("fail"),
    );
    const { rerender, props } = renderScreen({
      onBack,
    });

    expect(onBack).not.toHaveBeenCalled();
    rerender(
      <AccountAndOptionalSyncScreen
        {...props}
        isOffline
      />,
    );
    expect(onBack).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.back,
      }),
    );
    expect(
      await screen.findByText(copy.backError),
    ).toBeVisible();
  });

  it("shows Back pending label and duplicate protection", () => {
    const pending = deferred();
    const onBack = vi.fn(() => pending.promise);
    renderScreen({ onBack });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.back,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.backPending,
      }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
    pending.resolve();
  });

  it("keeps blocked Back visible and guarded", () => {
    const onBack = vi.fn();
    renderScreen({
      canGoBack: false,
      onBack,
    });

    const button = screen.getByRole("button", {
      name: copy.backBlocked,
    });
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("renders Retry only when supplied and protects rejection", async () => {
    renderScreen({
      onRetryLoad: undefined,
      report: null,
      state: "error",
    });

    expect(
      screen.queryByRole("button", {
        name: copy.retryLoad,
      }),
    ).not.toBeInTheDocument();

    cleanup();

    const onRetryLoad = vi
      .fn()
      .mockRejectedValue(new Error("fail"));
    renderScreen({
      onRetryLoad,
      report: null,
      state: "error",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.retryLoad,
      }),
    );

    expect(
      await screen.findByText(copy.retryError),
    ).toBeVisible();
  });
});

describe("Architecture boundaries", () => {
  it("keeps StrictMode pending and toast recovery stable", async () => {
    render(
      <StrictMode>
        <AccountAndOptionalSyncScreen
          {...defaultProps({
            onEnableProfileSync: vi
              .fn()
              .mockRejectedValue(
                new Error("fail"),
              ),
          })}
        />
      </StrictMode>,
    );

    fireEvent.click(
      within(profileCard("Alex")).getByRole(
        "button",
        {
          name: `${copy.enableSync}: Alex`,
        },
      ),
    );

    expect(
      await screen.findByText(copy.enableSyncError),
    ).toBeVisible();
  });

  it("auto-dismisses callback toasts", async () => {
    vi.useFakeTimers();
    renderScreen({
      onRequestSignIn: vi.fn().mockRejectedValue(
        new Error("fail"),
      ),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.signIn,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText(copy.signInError),
    ).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(
      screen.getByTestId("toast-region"),
    ).toHaveTextContent("");
  });

  it("does not call callbacks during mount or rerender", () => {
    const callbacks = [
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
    ];
    const { rerender, props } = renderScreen({
      onBack: callbacks[0],
      onRequestSignIn: callbacks[1],
      onRequestSignOut: callbacks[2],
      onEnableProfileSync: callbacks[3],
      onDisableProfileSync: callbacks[4],
      onRevokeConsent: callbacks[5],
      onRequestFacialDataDeletion: callbacks[6],
      onRetryLoad: callbacks[7],
    });

    rerender(
      <AccountAndOptionalSyncScreen
        {...props}
        isOffline
      />,
    );

    for (const callback of callbacks) {
      expect(callback).not.toHaveBeenCalled();
    }
  });

  it("does not call browser, storage, camera, picker, file, or location APIs", () => {
    const fetchSpy = vi.fn();
    const storageSet = vi.spyOn(
      Storage.prototype,
      "setItem",
    );
    const storageGet = vi.spyOn(
      Storage.prototype,
      "getItem",
    );
    const indexedDbOpen = vi.fn();
    const originalCookie = document.cookie;
    const originalFetch = globalThis.fetch;
    const originalIndexedDb =
      Object.getOwnPropertyDescriptor(
        window,
        "indexedDB",
      );
    const originalGeolocation =
      Object.getOwnPropertyDescriptor(
        window.navigator,
        "geolocation",
      );
    const originalMediaDevices =
      Object.getOwnPropertyDescriptor(
        window.navigator,
        "mediaDevices",
      );
    const originalFileReader =
      Object.getOwnPropertyDescriptor(
        globalThis,
        "FileReader",
      );
    const geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
    };
    const mediaDevices = {
      getUserMedia: vi.fn(),
    };
    const FileReaderSpy = vi.fn();

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchSpy,
    });
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: indexedDbOpen },
    });
    Object.defineProperty(
      window.navigator,
      "geolocation",
      {
        configurable: true,
        value: geolocation,
      },
    );
    Object.defineProperty(
      window.navigator,
      "mediaDevices",
      {
        configurable: true,
        value: mediaDevices,
      },
    );
    Object.defineProperty(globalThis, "FileReader", {
      configurable: true,
      value: FileReaderSpy,
    });

    try {
      renderScreen({ isOffline: true });
      fireEvent.click(
        screen.getByRole("button", {
          name: copy.signInReconnect,
        }),
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageSet).not.toHaveBeenCalled();
      expect(storageGet).not.toHaveBeenCalled();
      expect(indexedDbOpen).not.toHaveBeenCalled();
      expect(document.cookie).toBe(originalCookie);
      expect(
        geolocation.getCurrentPosition,
      ).not.toHaveBeenCalled();
      expect(
        geolocation.watchPosition,
      ).not.toHaveBeenCalled();
      expect(
        mediaDevices.getUserMedia,
      ).not.toHaveBeenCalled();
      expect(FileReaderSpy).not.toHaveBeenCalled();
    } finally {
      restoreDescriptor(
        globalThis,
        "fetch",
        originalFetch
          ? {
              configurable: true,
              value: originalFetch,
            }
          : undefined,
      );
      restoreDescriptor(
        window,
        "indexedDB",
        originalIndexedDb,
      );
      restoreDescriptor(
        window.navigator,
        "geolocation",
        originalGeolocation,
      );
      restoreDescriptor(
        window.navigator,
        "mediaDevices",
        originalMediaDevices,
      );
      restoreDescriptor(
        globalThis,
        "FileReader",
        originalFileReader,
      );
    }
  });

  it("renders no forbidden route elements, wording, styles, or opaque IDs", () => {
    const { container } = renderScreen();
    const rendered = sourceText();
    const markup = container.innerHTML;

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(
      container.querySelector('input[type="file"]'),
    ).toBeNull();
    expect(container.querySelector("nav")).toBeNull();
    expect(rendered).not.toContain("account created");
    expect(rendered).not.toContain("sync completed");
    expect(rendered).not.toContain("all data is always stored only");
    expect(rendered).not.toContain("forced sign-in");
    expect(rendered).not.toContain("affiliate");
    expect(rendered).not.toContain("marketplace");
    expect(rendered).not.toContain("external seller");
    expect(rendered).not.toContain("sponsored");
    expect(markup).not.toContain("sage");
    expect(markup).not.toContain("green");
    expect(markup).not.toContain("blue");
    expectOpaqueIdsNotRendered();
  });
});
