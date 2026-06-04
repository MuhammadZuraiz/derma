import "@testing-library/jest-dom/vitest";

import { StrictMode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProfileSwitcherAndManagementScreen, {
  copy,
  hasUsableProfileSwitcherAndManagementReport,
  isProfileSwitcherAndManagementState,
  type ManagedProfileSummary,
  type ProfileSwitcherAndManagementReport,
  type ProfileSwitcherAndManagementScreenProps,
  type ProfileSwitcherAndManagementState,
} from "./profile-switcher-and-management-screen";

const opaqueIds = [
  "profile-secret-active",
  "profile-secret-amara",
  "profile-secret-noor",
  "profile-secret-blank",
];

const activeProfile: ManagedProfileSummary = {
  profileId: "profile-secret-active",
  displayName: "  Maya  ",
  isActive: true,
  syncState: "local-only",
  syncLabel: "Local profile saved on this device",
  supporting: "Primary skincare profile",
  latestSnapshotLabel: "Today at 8:15 AM",
  canDelete: false,
  deleteBlockLabel: "Keep one active profile",
};

const inactiveProfile: ManagedProfileSummary = {
  profileId: "profile-secret-amara",
  displayName: "Amara",
  isActive: false,
  syncState: "synced",
  syncLabel: "Host sync label: synced",
  supporting: "Shared-device profile",
  latestSnapshotLabel: "Yesterday",
};

const thirdProfile: ManagedProfileSummary = {
  profileId: "profile-secret-noor",
  displayName: "Noor",
  isActive: false,
  syncState: "sync-pending",
  syncLabel: "Host sync label: pending",
};

const defaultReport: ProfileSwitcherAndManagementReport = {
  profiles: [activeProfile, inactiveProfile, thirdProfile],
  helperLabel: "Host helper: three local profiles on this device.",
  profileLimitLabel: "Host profile limit: 3 of 5 profiles used.",
  syncHelperLabel: "Host sync helper: sync is paused until the host resumes it.",
};

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function createProps(
  overrides: Partial<ProfileSwitcherAndManagementScreenProps> = {},
): ProfileSwitcherAndManagementScreenProps {
  return {
    report: defaultReport,
    onBack: vi.fn(),
    onAddProfile: vi.fn(),
    onOpenSyncSettings: vi.fn(),
    onSelectProfile: vi.fn(),
    onEditProfile: vi.fn(),
    onDeleteProfile: vi.fn(),
    onRetryLoad: vi.fn(),
    ...overrides,
  };
}

function renderScreen(
  overrides: Partial<ProfileSwitcherAndManagementScreenProps> = {},
) {
  return render(
    <ProfileSwitcherAndManagementScreen {...createProps(overrides)} />,
  );
}

function profileCardByName(name: string) {
  const card = screen
    .getAllByTestId("profile-card")
    .find((candidate) =>
      within(candidate).queryByRole("heading", { level: 3, name }),
    );

  if (!card) {
    throw new Error(`Profile card not found: ${name}`);
  }

  return card;
}

function profileActionLabel(label: string, displayName: string) {
  return `${label}: ${displayName}`;
}

function getProfileActionButton(displayName: string, label: string) {
  return within(profileCardByName(displayName)).getByRole("button", {
    name: profileActionLabel(label, displayName),
  });
}

function queryProfileActionButton(displayName: string, label: string) {
  return within(profileCardByName(displayName)).queryByRole("button", {
    name: profileActionLabel(label, displayName),
  });
}

function getDialogDeleteButton(
  dialog: HTMLElement,
  displayName: string,
  label: string = copy.deleteProfile,
) {
  return within(dialog).getByRole("button", {
    name: profileActionLabel(label, displayName),
  });
}

function expectOpaqueIdsNotRendered(container: HTMLElement) {
  for (const opaqueId of opaqueIds) {
    expect(container.textContent).not.toContain(opaqueId);
    expect(container.innerHTML).not.toContain(opaqueId);
  }
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ProfileSwitcherAndManagementScreen core states", () => {
  it("recognises only supported runtime states", () => {
    expect(isProfileSwitcherAndManagementState("loading")).toBe(true);
    expect(isProfileSwitcherAndManagementState("ready")).toBe(true);
    expect(isProfileSwitcherAndManagementState("empty")).toBe(true);
    expect(isProfileSwitcherAndManagementState("error")).toBe(true);
    expect(isProfileSwitcherAndManagementState("stale")).toBe(false);
  });

  it("recognises only reports with a host-supplied profile array", () => {
    expect(hasUsableProfileSwitcherAndManagementReport(defaultReport)).toBe(true);
    expect(hasUsableProfileSwitcherAndManagementReport(null)).toBe(false);
    expect(hasUsableProfileSwitcherAndManagementReport(undefined)).toBe(false);
    expect(
      hasUsableProfileSwitcherAndManagementReport({
        profiles: "unexpected",
      } as unknown as ProfileSwitcherAndManagementReport),
    ).toBe(false);
  });

  it("renders the loading heading with polite static-only status semantics", () => {
    renderScreen({ report: null, state: "loading" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.loadingHeading,
      }),
    ).toBeVisible();

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(copy.loadingSupporting);
    expect(within(status).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.back })).toBeVisible();
  });

  it("renders the ready heading and exactly one h1", () => {
    renderScreen();

    expect(
      screen.getByRole("heading", { level: 1, name: copy.heading }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("falls back to error when ready state has a null report", () => {
    renderScreen({ report: null, state: "ready" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();
  });

  it("renders the explicit empty state", () => {
    renderScreen({ report: null, state: "empty" });

    expect(screen.getByText(copy.emptyHeading)).toBeVisible();
    expect(screen.getByText(copy.emptySupporting)).toBeVisible();
    expect(screen.getByRole("button", { name: copy.addProfile })).toBeVisible();
    expect(screen.getByText(copy.syncTitle)).toBeVisible();
  });

  it("renders ready with an empty profile array as the empty state", () => {
    renderScreen({
      report: { profiles: [], syncHelperLabel: "Optional host sync note." },
      state: "ready",
    });

    expect(screen.getByText(copy.emptyHeading)).toBeVisible();
    expect(screen.getByText(copy.emptySupporting)).toBeVisible();
    expect(screen.getByText("Optional host sync note.")).toBeVisible();
  });

  it("renders the error state and keeps Retry outside the alert", () => {
    renderScreen({ report: null, state: "error" });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(copy.errorHeading);
    expect(alert).toHaveTextContent(copy.errorSupporting);
    expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.retry })).toBeVisible();
  });

  it("shows Retry only when the callback exists", () => {
    const { rerender } = renderScreen({
      onRetryLoad: undefined,
      report: null,
      state: "error",
    });

    expect(
      screen.queryByRole("button", { name: copy.retry }),
    ).not.toBeInTheDocument();

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          onRetryLoad: vi.fn(),
          report: null,
          state: "error",
        })}
      />,
    );

    expect(screen.getByRole("button", { name: copy.retry })).toBeVisible();
  });

  it("shows Retry pending state and prevents duplicate retry activation", async () => {
    const deferred = createDeferred();
    const onRetryLoad = vi.fn(() => deferred.promise);

    renderScreen({ onRetryLoad, report: null, state: "error" });

    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    fireEvent.click(screen.getByRole("button", { name: copy.retrying }));

    expect(onRetryLoad).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: copy.retrying })).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.retry })).toBeEnabled();
    });
  });

  it("turns Retry rejection into a readable toast", async () => {
    renderScreen({
      onRetryLoad: vi.fn().mockRejectedValue(new Error("retry rejected")),
      report: null,
      state: "error",
    });

    fireEvent.click(screen.getByRole("button", { name: copy.retry }));

    expect(await screen.findByText(copy.retryError)).toBeVisible();
  });

  it("fails closed to error for an unknown runtime state", () => {
    renderScreen({ state: "unknown" as ProfileSwitcherAndManagementState });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();
  });

  it("fails closed to error when ready report profiles are malformed", () => {
    renderScreen({
      report: {
        profiles: "unexpected",
      } as unknown as ProfileSwitcherAndManagementReport,
      state: "ready",
    });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();
  });
});

describe("ProfileSwitcherAndManagementScreen profile rendering", () => {
  it("preserves the received profile order", () => {
    renderScreen({
      report: {
        ...defaultReport,
        profiles: [inactiveProfile, activeProfile, thirdProfile],
      },
    });

    expect(
      screen
        .getAllByTestId("profile-card")
        .map((card) => within(card).getByRole("heading", { level: 3 }).textContent),
    ).toEqual(["Amara", "Maya", "Noor"]);
  });

  it("renders the active profile label and inactive Select profile action", () => {
    renderScreen();

    expect(screen.getAllByText(copy.activeBadge).length).toBeGreaterThan(0);
    expect(getProfileActionButton("Amara", copy.selectProfile)).toBeVisible();
    expect(
      queryProfileActionButton("Maya", copy.selectProfile),
    ).not.toBeInTheDocument();
  });

  it("uses contextual accessible names for repeated profile actions", () => {
    const deletableActiveProfile = {
      ...activeProfile,
      canDelete: true,
    };

    renderScreen({
      report: {
        ...defaultReport,
        profiles: [deletableActiveProfile, inactiveProfile, thirdProfile],
      },
    });

    expect(
      screen.getByRole("button", {
        name: profileActionLabel(copy.selectProfile, "Amara"),
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: profileActionLabel(copy.selectProfile, "Noor"),
      }),
    ).toBeVisible();

    for (const displayName of ["Maya", "Amara", "Noor"]) {
      expect(
        screen.getByRole("button", {
          name: profileActionLabel(copy.editProfile, displayName),
        }),
      ).toBeVisible();
      expect(
        screen.getByRole("button", {
          name: profileActionLabel(copy.deleteProfile, displayName),
        }),
      ).toBeVisible();
    }
  });

  it("uses contextual blocked and pending accessible names", async () => {
    const editDeferred = createDeferred();
    const onEditProfile = vi.fn(() => editDeferred.promise);
    const { rerender } = renderScreen({
      onEditProfile,
      report: {
        ...defaultReport,
        profiles: [
          {
            ...inactiveProfile,
            canSelect: false,
          },
        ],
      },
    });

    expect(
      getProfileActionButton("Amara", copy.selectBlocked),
    ).toBeDisabled();

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({ onEditProfile })}
      />,
    );

    fireEvent.click(getProfileActionButton("Amara", copy.editProfile));
    expect(
      getProfileActionButton("Amara", copy.editingProfile),
    ).toBeDisabled();

    editDeferred.resolve(undefined);

    await waitFor(() => {
      expect(getProfileActionButton("Amara", copy.editProfile)).toBeEnabled();
    });

    const deleteDeferred = createDeferred();
    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          onDeleteProfile: vi.fn(() => deleteDeferred.promise),
        })}
      />,
    );

    fireEvent.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(getDialogDeleteButton(dialog, "Amara"));

    expect(
      getDialogDeleteButton(dialog, "Amara", copy.deletingProfile),
    ).toBeDisabled();

    deleteDeferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("renders host sync and helper labels unchanged", () => {
    renderScreen();

    expect(screen.getByText(defaultReport.helperLabel!)).toBeVisible();
    expect(screen.getByText(defaultReport.profileLimitLabel!)).toBeVisible();
    expect(screen.getByText(activeProfile.syncLabel)).toBeVisible();
    expect(screen.getByText(inactiveProfile.syncLabel)).toBeVisible();
    expect(screen.getByText(thirdProfile.syncLabel)).toBeVisible();
  });

  it("renders supporting and latest snapshot labels when supplied", () => {
    renderScreen();

    expect(screen.getByText(activeProfile.supporting!)).toBeVisible();
    expect(screen.getByText(inactiveProfile.supporting!)).toBeVisible();
    expect(screen.getByText(`${copy.latestSnapshot}: ${activeProfile.latestSnapshotLabel}`)).toBeVisible();
    expect(screen.getByText(`${copy.latestSnapshot}: ${inactiveProfile.latestSnapshotLabel}`)).toBeVisible();
  });

  it("renders a safe fallback for a blank display name without changing actions", () => {
    const onEditProfile = vi.fn();

    renderScreen({
      onEditProfile,
      report: {
        ...defaultReport,
        profiles: [
          {
            ...inactiveProfile,
            displayName: "   ",
          },
        ],
      },
    });

    const card = profileCardByName(copy.unnamedProfile);
    fireEvent.click(
      within(card).getByRole("button", {
        name: profileActionLabel(copy.editProfile, copy.unnamedProfile),
      }),
    );

    expect(onEditProfile).toHaveBeenCalledWith(inactiveProfile.profileId);
  });

  it.each([
    ["null", null],
    ["number", 42],
  ])(
    "renders Unnamed profile safely when displayName is %s at runtime",
    (_label, displayName) => {
      const onEditProfile = vi.fn();

      renderScreen({
        onEditProfile,
        report: {
          ...defaultReport,
          profiles: [
            {
              ...inactiveProfile,
              displayName,
            } as unknown as ManagedProfileSummary,
          ],
        },
      });

      expect(
        screen.getByRole("heading", {
          level: 3,
          name: copy.unnamedProfile,
        }),
      ).toBeVisible();

      fireEvent.click(
        getProfileActionButton(copy.unnamedProfile, copy.editProfile),
      );

      expect(onEditProfile).toHaveBeenCalledWith(inactiveProfile.profileId);
    },
  );

  it("never renders opaque profile IDs", () => {
    const { container } = renderScreen();

    expectOpaqueIdsNotRendered(container);
  });

  it("does not infer active profile from array position", () => {
    renderScreen({
      report: {
        ...defaultReport,
        profiles: [
          {
            ...inactiveProfile,
            displayName: "First inactive",
          },
          {
            ...activeProfile,
            displayName: "Second active",
          },
        ],
      },
    });

    expect(
      within(profileCardByName("First inactive")).queryByText(copy.activeBadge),
    ).not.toBeInTheDocument();
    expect(
      within(profileCardByName("Second active")).getByText(copy.activeBadge),
    ).toBeVisible();
  });
});

describe("ProfileSwitcherAndManagementScreen select profile", () => {
  it("passes the selected opaque profile ID and does not invoke on mount", () => {
    const onSelectProfile = vi.fn();

    renderScreen({ onSelectProfile });

    expect(onSelectProfile).not.toHaveBeenCalled();

    fireEvent.click(getProfileActionButton("Amara", copy.selectProfile));

    expect(onSelectProfile).toHaveBeenCalledTimes(1);
    expect(onSelectProfile).toHaveBeenCalledWith(inactiveProfile.profileId);
  });

  it("shows action-scoped pending state and disables conflicting controls", async () => {
    const deferred = createDeferred();
    const onSelectProfile = vi.fn(() => deferred.promise);

    renderScreen({ onSelectProfile });

    fireEvent.click(getProfileActionButton("Amara", copy.selectProfile));

    expect(
      getProfileActionButton("Amara", copy.selectingProfile),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.addProfile })).toBeDisabled();
    expect(
      getProfileActionButton("Noor", copy.selectProfile),
    ).toBeDisabled();

    fireEvent.click(getProfileActionButton("Amara", copy.selectingProfile));

    expect(onSelectProfile).toHaveBeenCalledTimes(1);

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(
        getProfileActionButton("Amara", copy.selectProfile),
      ).toBeEnabled();
    });
  });

  it("keeps host-blocked selection visible and inert", () => {
    const onSelectProfile = vi.fn();

    renderScreen({
      onSelectProfile,
      report: {
        ...defaultReport,
        profiles: [
          {
            ...inactiveProfile,
            canSelect: false,
          },
        ],
      },
    });

    const button = getProfileActionButton("Amara", copy.selectBlocked);
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onSelectProfile).not.toHaveBeenCalled();
  });

  it.each(["", "   "])(
    "disables selection for malformed profile ID %j",
    (profileId) => {
      const onSelectProfile = vi.fn();

      renderScreen({
        onSelectProfile,
        report: {
          ...defaultReport,
          profiles: [
            {
              ...inactiveProfile,
              profileId,
            },
          ],
        },
      });

      const button = getProfileActionButton("Amara", copy.selectBlocked);
      expect(button).toBeDisabled();

      fireEvent.click(button);

      expect(onSelectProfile).not.toHaveBeenCalled();
    },
  );

  it("turns select rejection into a toast and does not mutate active profile locally", async () => {
    renderScreen({
      onSelectProfile: vi.fn().mockRejectedValue(new Error("select rejected")),
    });

    fireEvent.click(getProfileActionButton("Amara", copy.selectProfile));

    expect(await screen.findByText(copy.selectError)).toBeVisible();
    expect(
      within(profileCardByName("Maya")).getByText(copy.activeBadge),
    ).toBeVisible();
    expect(
      within(profileCardByName("Amara")).queryByText(copy.activeBadge),
    ).not.toBeInTheDocument();
  });

  it("does not locally mark the selected profile active after callback resolution", async () => {
    renderScreen({ onSelectProfile: vi.fn() });

    fireEvent.click(getProfileActionButton("Amara", copy.selectProfile));

    await waitFor(() => {
      expect(
        within(profileCardByName("Maya")).getByText(copy.activeBadge),
      ).toBeVisible();
    });
    expect(
      within(profileCardByName("Amara")).queryByText(copy.activeBadge),
    ).not.toBeInTheDocument();
  });
});

describe("ProfileSwitcherAndManagementScreen add and edit profile", () => {
  it("invokes Add profile with pending and duplicate protection", async () => {
    const deferred = createDeferred();
    const onAddProfile = vi.fn(() => deferred.promise);

    renderScreen({ onAddProfile });

    fireEvent.click(screen.getByRole("button", { name: copy.addProfile }));
    fireEvent.click(screen.getByRole("button", { name: copy.addingProfile }));

    expect(onAddProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: copy.addingProfile })).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.addProfile })).toBeEnabled();
    });
  });

  it("keeps blocked Add profile visible and converts rejection into toast", async () => {
    const onAddProfile = vi.fn().mockRejectedValue(new Error("add rejected"));
    const { rerender } = renderScreen({
      canAddProfile: false,
      onAddProfile,
    });

    const blocked = screen.getByRole("button", { name: copy.addProfileBlocked });
    expect(blocked).toBeDisabled();
    fireEvent.click(blocked);
    expect(onAddProfile).not.toHaveBeenCalled();

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({ onAddProfile })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.addProfile }));
    expect(await screen.findByText(copy.addError)).toBeVisible();
  });

  it("passes selected profile ID to Edit profile with pending state", async () => {
    const deferred = createDeferred();
    const onEditProfile = vi.fn(() => deferred.promise);

    renderScreen({ onEditProfile });

    fireEvent.click(getProfileActionButton("Amara", copy.editProfile));

    expect(onEditProfile).toHaveBeenCalledWith(inactiveProfile.profileId);
    expect(
      getProfileActionButton("Amara", copy.editingProfile),
    ).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(
        getProfileActionButton("Amara", copy.editProfile),
      ).toBeEnabled();
    });
  });

  it("keeps blocked and malformed Edit actions visible and inert", () => {
    const onEditProfile = vi.fn();
    const { rerender } = renderScreen({
      canEditProfiles: false,
      onEditProfile,
    });

    expect(
      getProfileActionButton("Amara", copy.editBlocked),
    ).toBeDisabled();

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          onEditProfile,
          report: {
            ...defaultReport,
            profiles: [{ ...inactiveProfile, profileId: "   " }],
          },
        })}
      />,
    );

    const malformed = getProfileActionButton("Amara", copy.editBlocked);
    expect(malformed).toBeDisabled();
    fireEvent.click(malformed);

    expect(onEditProfile).not.toHaveBeenCalled();
  });

  it("turns Edit rejection into a toast", async () => {
    renderScreen({
      onEditProfile: vi.fn().mockRejectedValue(new Error("edit rejected")),
    });

    fireEvent.click(getProfileActionButton("Amara", copy.editProfile));

    expect(await screen.findByText(copy.editError)).toBeVisible();
  });
});

describe("ProfileSwitcherAndManagementScreen optional sync", () => {
  it("renders fixed optional-sync copy and the host helper label", () => {
    renderScreen();

    expect(screen.getByText(copy.syncTitle)).toBeVisible();
    expect(screen.getByText(copy.syncSupporting)).toBeVisible();
    expect(screen.getByText(defaultReport.syncHelperLabel!)).toBeVisible();
  });

  it("invokes Manage sync settings and reports rejection through toast", async () => {
    const onOpenSyncSettings = vi
      .fn()
      .mockRejectedValue(new Error("sync rejected"));

    renderScreen({ onOpenSyncSettings });

    fireEvent.click(screen.getByRole("button", { name: copy.manageSync }));

    expect(onOpenSyncSettings).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(copy.syncError)).toBeVisible();
  });

  it("keeps Manage sync settings visible but disabled when absent or host-blocked", () => {
    const { rerender } = renderScreen({ onOpenSyncSettings: undefined });

    expect(
      screen.getByRole("button", { name: copy.syncBlocked }),
    ).toBeDisabled();

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          canOpenSyncSettings: false,
          onOpenSyncSettings: vi.fn(),
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: copy.syncBlocked }),
    ).toBeDisabled();
  });

  it("does not render a sync toggle, sign-in requirement, or account creation UI", () => {
    const { container } = renderScreen();

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/sign in|account required|create account/i);
  });
});

describe("ProfileSwitcherAndManagementScreen offline behaviour", () => {
  it("shows the offline status while keeping profile content visible", () => {
    renderScreen({ isOffline: true });

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(copy.offline);
    expect(screen.getByText("Maya")).toBeVisible();
    expect(screen.getByText("Amara")).toBeVisible();
  });

  it("keeps actions governed by supplied availability instead of offline status", () => {
    renderScreen({
      canAddProfile: false,
      isOffline: true,
    });

    expect(
      getProfileActionButton("Amara", copy.selectProfile),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: copy.addProfileBlocked }),
    ).toBeDisabled();
  });
});

describe("ProfileSwitcherAndManagementScreen delete confirmation", () => {
  it("opens a confirmation dialog without calling delete", async () => {
    const user = userEvent.setup();
    const onDeleteProfile = vi.fn();

    renderScreen({ onDeleteProfile });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onDeleteProfile).not.toHaveBeenCalled();
  });

  it("uses the safe display name in the dialog and omits opaque IDs", async () => {
    const user = userEvent.setup();
    const { container } = renderScreen({
      report: {
        ...defaultReport,
        profiles: [
          {
            ...inactiveProfile,
            displayName: "   ",
          },
        ],
      },
    });

    await user.click(
      getProfileActionButton(copy.unnamedProfile, copy.deleteProfile),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(copy.unnamedProfile);
    expect(dialog).not.toHaveTextContent(inactiveProfile.profileId);
    expectOpaqueIdsNotRendered(container);
  });

  it("closes on Cancel and returns focus to the originating Delete button", async () => {
    const user = userEvent.setup();
    renderScreen();

    const deleteButton = getProfileActionButton("Amara", copy.deleteProfile);
    await user.click(deleteButton);

    const cancel = await screen.findByRole("button", { name: copy.cancel });
    await waitFor(() => expect(cancel).toHaveFocus());

    await user.click(cancel);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    await waitFor(() => expect(deleteButton).toHaveFocus());
  });

  it("closes on Escape and returns focus to the originating Delete button", async () => {
    const user = userEvent.setup();
    renderScreen();

    const deleteButton = getProfileActionButton("Amara", copy.deleteProfile);
    await user.click(deleteButton);

    const dialog = await screen.findByRole("dialog");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: copy.cancel })).toHaveFocus(),
    );

    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    await waitFor(() => expect(deleteButton).toHaveFocus());
  });

  it("makes the background shell inert while the delete dialog is open", async () => {
    const user = userEvent.setup();
    renderScreen();

    const deleteButton = getProfileActionButton("Amara", copy.deleteProfile);
    await user.click(deleteButton);

    const backgroundShell = screen.getByTestId("profile-management-background-shell");
    const dialog = await screen.findByRole("dialog");

    expect(backgroundShell).toHaveAttribute("aria-hidden", "true");
    expect(backgroundShell).toHaveAttribute("inert");
    expect(dialog).toBeVisible();
    expect(backgroundShell).not.toContainElement(dialog);

    await user.click(within(dialog).getByRole("button", { name: copy.cancel }));

    await waitFor(() => {
      expect(backgroundShell).not.toHaveAttribute("aria-hidden");
      expect(backgroundShell).not.toHaveAttribute("inert");
    });
    await waitFor(() => expect(deleteButton).toHaveFocus());

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const reopenedDialog = await screen.findByRole("dialog");

    fireEvent.keyDown(reopenedDialog, { key: "Escape" });

    await waitFor(() => {
      expect(backgroundShell).not.toHaveAttribute("aria-hidden");
      expect(backgroundShell).not.toHaveAttribute("inert");
    });
    await waitFor(() =>
      expect(getProfileActionButton("Amara", copy.deleteProfile)).toHaveFocus(),
    );
  });

  it("traps focus within the dialog", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));

    const dialog = await screen.findByRole("dialog");
    const cancel = within(dialog).getByRole("button", { name: copy.cancel });
    const confirm = getDialogDeleteButton(dialog, "Amara");

    await waitFor(() => expect(cancel).toHaveFocus());

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(cancel).toHaveFocus();
  });

  it("confirms deletion with the opaque profile ID and prevents duplicate activation", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onDeleteProfile = vi.fn(() => deferred.promise);

    renderScreen({ onDeleteProfile });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");
    await user.click(getDialogDeleteButton(dialog, "Amara"));
    fireEvent.click(
      getDialogDeleteButton(dialog, "Amara", copy.deletingProfile),
    );

    expect(onDeleteProfile).toHaveBeenCalledTimes(1);
    expect(onDeleteProfile).toHaveBeenCalledWith(inactiveProfile.profileId);
    expect(
      getDialogDeleteButton(dialog, "Amara", copy.deletingProfile),
    ).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("blocks dismissal while deletion is pending", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();

    renderScreen({
      onDeleteProfile: vi.fn(() => deferred.promise),
    });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");
    await user.click(getDialogDeleteButton(dialog, "Amara"));

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: copy.cancel })).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("successful deletion closes the dialog without removing the card locally", async () => {
    const user = userEvent.setup();
    renderScreen({ onDeleteProfile: vi.fn() });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");
    await user.click(getDialogDeleteButton(dialog, "Amara"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(profileCardByName("Amara")).toBeVisible();
  });

  it("delete rejection shows toast, keeps retry available, and does not close the dialog", async () => {
    const user = userEvent.setup();
    const onDeleteProfile = vi
      .fn()
      .mockRejectedValueOnce(new Error("delete rejected"))
      .mockResolvedValueOnce(undefined);

    renderScreen({ onDeleteProfile });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");
    await user.click(getDialogDeleteButton(dialog, "Amara"));

    expect(await screen.findByText(copy.deleteError)).toBeVisible();
    expect(screen.getByRole("dialog")).toBeVisible();

    await user.click(
      getDialogDeleteButton(screen.getByRole("dialog"), "Amara"),
    );

    expect(onDeleteProfile).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it.each(["", "   "])("disables Delete for malformed profile ID %j", (profileId) => {
    const onDeleteProfile = vi.fn();

    renderScreen({
      onDeleteProfile,
      report: {
        ...defaultReport,
        profiles: [
          {
            ...inactiveProfile,
            profileId,
          },
        ],
      },
    });

    const button = getProfileActionButton("Amara", copy.deleteBlocked);
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onDeleteProfile).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps host-blocked and callback-absent Delete visible but disabled", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        profiles: [
          {
            ...inactiveProfile,
            canDelete: false,
            deleteBlockLabel: "Host blocked deletion",
          },
        ],
      },
    });

    expect(
      getProfileActionButton("Amara", "Host blocked deletion"),
    ).toBeDisabled();

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          onDeleteProfile: undefined,
          report: {
            ...defaultReport,
            profiles: [inactiveProfile],
          },
        })}
      />,
    );

    expect(
      getProfileActionButton("Amara", copy.deleteBlocked),
    ).toBeDisabled();
  });
});

describe("ProfileSwitcherAndManagementScreen latest host deletion availability", () => {
  it("disables dialog confirmation when global deletion becomes blocked", async () => {
    const user = userEvent.setup();
    const onDeleteProfile = vi.fn();
    const { rerender } = renderScreen({ onDeleteProfile });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          canDeleteProfiles: false,
          onDeleteProfile,
        })}
      />,
    );

    const confirm = getDialogDeleteButton(dialog, "Amara");
    expect(confirm).toBeDisabled();

    fireEvent.click(confirm);

    expect(onDeleteProfile).not.toHaveBeenCalled();
  });

  it("disables dialog confirmation when the refreshed profile blocks deletion", async () => {
    const user = userEvent.setup();
    const onDeleteProfile = vi.fn();
    const { rerender } = renderScreen({ onDeleteProfile });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          onDeleteProfile,
          report: {
            ...defaultReport,
            profiles: [
              activeProfile,
              {
                ...inactiveProfile,
                canDelete: false,
                deleteBlockLabel: "Host blocked deletion",
              },
              thirdProfile,
            ],
          },
        })}
      />,
    );

    const confirm = getDialogDeleteButton(dialog, "Amara");
    expect(confirm).toBeDisabled();

    fireEvent.click(confirm);

    expect(onDeleteProfile).not.toHaveBeenCalled();
  });

  it("disables dialog confirmation when the delete callback is removed", async () => {
    const user = userEvent.setup();
    const onDeleteProfile = vi.fn();
    const { rerender } = renderScreen({ onDeleteProfile });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({ onDeleteProfile: undefined })}
      />,
    );

    const confirm = getDialogDeleteButton(dialog, "Amara");
    expect(confirm).toBeDisabled();

    fireEvent.click(confirm);

    expect(onDeleteProfile).not.toHaveBeenCalled();
  });

  it("closes the idle dialog when the candidate profile is removed", async () => {
    const user = userEvent.setup();
    const onDeleteProfile = vi.fn();
    const { rerender } = renderScreen({ onDeleteProfile });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    expect(await screen.findByRole("dialog")).toBeVisible();

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          onDeleteProfile,
          report: {
            ...defaultReport,
            profiles: [activeProfile, thirdProfile],
          },
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onDeleteProfile).not.toHaveBeenCalled();
  });

  it("disables dialog confirmation when the candidate profile is duplicated", async () => {
    const user = userEvent.setup();
    const onDeleteProfile = vi.fn();
    const { rerender } = renderScreen({ onDeleteProfile });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          onDeleteProfile,
          report: {
            ...defaultReport,
            profiles: [
              activeProfile,
              inactiveProfile,
              {
                ...inactiveProfile,
                displayName: "Amara copy",
              },
            ],
          },
        })}
      />,
    );

    const confirm = getDialogDeleteButton(dialog, "Amara");
    expect(confirm).toBeDisabled();

    fireEvent.click(confirm);

    expect(onDeleteProfile).not.toHaveBeenCalled();
  });

  it("uses the refreshed current host profile when confirming deletion", async () => {
    const user = userEvent.setup();
    const onDeleteProfile = vi.fn();
    const { rerender } = renderScreen({ onDeleteProfile });

    await user.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");
    const refreshedProfile: ManagedProfileSummary = {
      ...inactiveProfile,
      displayName: "Amara refreshed",
      supporting: "Updated by host before confirmation",
    };

    rerender(
      <ProfileSwitcherAndManagementScreen
        {...createProps({
          onDeleteProfile,
          report: {
            ...defaultReport,
            profiles: [activeProfile, refreshedProfile, thirdProfile],
          },
        })}
      />,
    );

    await user.click(getDialogDeleteButton(dialog, "Amara"));

    expect(onDeleteProfile).toHaveBeenCalledTimes(1);
    expect(onDeleteProfile).toHaveBeenCalledWith(refreshedProfile.profileId);
  });

  it("uses the synchronous in-flight guard to block immediate dismissal", async () => {
    const deferred = createDeferred();
    const onDeleteProfile = vi.fn(() => deferred.promise);

    renderScreen({ onDeleteProfile });

    fireEvent.click(getProfileActionButton("Amara", copy.deleteProfile));
    const dialog = await screen.findByRole("dialog");
    const cancel = within(dialog).getByRole("button", { name: copy.cancel });

    fireEvent.click(getDialogDeleteButton(dialog, "Amara"));
    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.click(cancel);

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onDeleteProfile).toHaveBeenCalledTimes(1);

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("ProfileSwitcherAndManagementScreen architecture boundaries", () => {
  it("keeps pending behaviour stable in StrictMode", async () => {
    const deferred = createDeferred();
    const onAddProfile = vi.fn(() => deferred.promise);

    render(
      <StrictMode>
        <ProfileSwitcherAndManagementScreen
          {...createProps({ onAddProfile })}
        />
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.addProfile }));
    fireEvent.click(screen.getByRole("button", { name: copy.addingProfile }));

    expect(onAddProfile).toHaveBeenCalledTimes(1);

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.addProfile })).toBeEnabled();
    });
  });

  it("recovers toast state in StrictMode after a callback rejection", async () => {
    render(
      <StrictMode>
        <ProfileSwitcherAndManagementScreen
          {...createProps({
            onAddProfile: vi.fn().mockRejectedValue(new Error("add failed")),
          })}
        />
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.addProfile }));

    expect(await screen.findByText(copy.addError)).toBeVisible();
  });

  it("does not call route callbacks on mount or rerender", () => {
    const props = createProps();
    const callbacks = [
      props.onBack,
      props.onAddProfile,
      props.onOpenSyncSettings,
      props.onSelectProfile,
      props.onEditProfile,
      props.onDeleteProfile,
      props.onRetryLoad,
    ];

    const { rerender } = render(<ProfileSwitcherAndManagementScreen {...props} />);

    rerender(<ProfileSwitcherAndManagementScreen {...props} isOffline />);

    for (const callback of callbacks) {
      expect(callback).not.toHaveBeenCalled();
    }
  });

  it("does not call browser storage, network, camera, or location APIs", () => {
    const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
    const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB");
    const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
    const originalGeo = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    const fetchSpy = vi.fn();
    const indexedDbOpen = vi.fn();
    const getUserMedia = vi.fn();
    const getCurrentPosition = vi.fn();
    const storageGet = vi.spyOn(Storage.prototype, "getItem");
    const storageSet = vi.spyOn(Storage.prototype, "setItem");

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchSpy,
    });
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: indexedDbOpen },
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    try {
      renderScreen();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageGet).not.toHaveBeenCalled();
      expect(storageSet).not.toHaveBeenCalled();
      expect(indexedDbOpen).not.toHaveBeenCalled();
      expect(getUserMedia).not.toHaveBeenCalled();
      expect(getCurrentPosition).not.toHaveBeenCalled();
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, "fetch", originalFetch);
      } else {
        delete (globalThis as { fetch?: unknown }).fetch;
      }

      if (originalIndexedDb) {
        Object.defineProperty(window, "indexedDB", originalIndexedDb);
      } else {
        delete (window as unknown as { indexedDB?: unknown }).indexedDB;
      }

      if (originalMediaDevices) {
        Object.defineProperty(navigator, "mediaDevices", originalMediaDevices);
      } else {
        delete (navigator as unknown as { mediaDevices?: unknown }).mediaDevices;
      }

      if (originalGeo) {
        Object.defineProperty(navigator, "geolocation", originalGeo);
      } else {
        delete (navigator as unknown as { geolocation?: unknown }).geolocation;
      }
    }
  });

  it("does not render anchors, iframe, file inputs, or bottom navigation", () => {
    const { container } = renderScreen();

    expect(container.querySelector("a")).not.toBeInTheDocument();
    expect(container.querySelector("iframe")).not.toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
    expect(container.querySelector("nav")).not.toBeInTheDocument();
  });

  it("does not render forced account, affiliate, marketplace, sponsored, or diagnosis wording", () => {
    const { container } = renderScreen();

    expect(container.textContent).not.toMatch(/sign in|account required|create account/i);
    expect(container.textContent).not.toMatch(/affiliate|marketplace|external seller|sponsored|diagnosis/i);
  });

  it("does not render disallowed styling terms or opaque IDs", () => {
    const { container } = renderScreen();

    expect(container.innerHTML.toLowerCase()).not.toMatch(/sage|green|blue/);
    expectOpaqueIdsNotRendered(container);
  });
});
