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
import { afterEach, describe, expect, it, vi } from "vitest";

import HomeDashboardScreen, {
  copy,
  hasUsableHomeDashboardReport,
  isHomeDashboardState,
  type HomeDashboardReport,
  type HomeDashboardScreenProps,
  type HomeDashboardState,
} from "./home-dashboard-screen";

const opaqueIds = [
  "profile-secret-001",
  "report-secret-123",
  "routine-secret-456",
  "order-secret-789",
];

const defaultReport: HomeDashboardReport = {
  profile: {
    profileId: "profile-secret-001",
    displayName: "  Maya  ",
    syncState: "local-only",
    syncLabel: "Local profile saved on this device",
  },
  latestSnapshot: {
    reportId: "report-secret-123",
    capturedAtLabel: "Today at 8:15 AM",
    categoryLabel: "Balanced with visible dryness",
    comparisonLabel: "Calmer-looking than the previous scan",
    imageUrl: "/latest-snapshot.jpg",
    imageAlt: "Maya skincare snapshot",
    scoreLabel: "Host score label: 82",
    saveLabel: "Saved locally",
  },
  routine: {
    routineId: "routine-secret-456",
    title: "Barrier support routine",
    supporting: "A simple morning and evening rhythm.",
    updatedAtLabel: "Updated today",
    morningSummaryLabel: "Cleanser and SPF",
    eveningSummaryLabel: "Cleanser and moisturiser",
  },
  recentOrder: {
    orderId: "order-secret-789",
    orderReferenceLabel: "Order DL-2048",
    statusLabel: "Preparing for dispatch",
    supporting: "Two items from your routine",
  },
  environment: {
    uvLabel: "UV index supplied by host: 4",
    aqiLabel: "AQI supplied by host: 42",
    guidanceLabel: "Host guidance: consider SPF before heading out.",
    updatedAtLabel: "Updated 20 minutes ago",
  },
};

function createProps(
  overrides: Partial<HomeDashboardScreenProps> = {},
): HomeDashboardScreenProps {
  return {
    report: defaultReport,
    onStartAnalysis: vi.fn(),
    onChangeProfile: vi.fn(),
    onOpenLatestReport: vi.fn(),
    onOpenRoutine: vi.fn(),
    onOpenGuestScanner: vi.fn(),
    onOpenProgress: vi.fn(),
    onOpenOrders: vi.fn(),
    onOpenStore: vi.fn(),
    onOpenRecentOrder: vi.fn(),
    ...overrides,
  };
}

function renderScreen(overrides: Partial<HomeDashboardScreenProps> = {}) {
  return render(<HomeDashboardScreen {...createProps(overrides)} />);
}

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function expectOpaqueIdsNotRendered(container: HTMLElement) {
  for (const opaqueId of opaqueIds) {
    expect(container.textContent).not.toContain(opaqueId);
  }
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HomeDashboardScreen core states", () => {
  it("recognises only supported runtime states", () => {
    expect(isHomeDashboardState("loading")).toBe(true);
    expect(isHomeDashboardState("ready")).toBe(true);
    expect(isHomeDashboardState("empty")).toBe(true);
    expect(isHomeDashboardState("error")).toBe(true);
    expect(isHomeDashboardState("stale")).toBe(false);
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
  });

  it("renders the ready heading and exactly one h1", () => {
    renderScreen();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.readyHeading,
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("uses a host-supplied greeting label without adding another h1", () => {
    renderScreen({
      report: {
        ...defaultReport,
        greetingLabel: "Welcome back, Maya",
      },
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome back, Maya" }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("fails closed to error when ready state has a missing report", () => {
    renderScreen({ report: null, state: "ready" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();
  });

  it.each([
    ["blank profile ID", { profileId: "" }],
    ["whitespace profile ID", { profileId: "   " }],
    ["blank display name", { displayName: "" }],
    ["whitespace display name", { displayName: "   " }],
  ])(
    "fails closed when required dashboard profile context has %s",
    (_label, malformedProfile) => {
      const onStartAnalysis = vi.fn();
      const report = {
        ...defaultReport,
        profile: {
          ...defaultReport.profile,
          ...malformedProfile,
        },
      };

      renderScreen({ onStartAnalysis, report, state: "ready" });

      expect(hasUsableHomeDashboardReport(report)).toBe(false);
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: copy.errorHeading,
        }),
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: copy.startAnalysis }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: copy.startBlocked }),
      ).not.toBeInTheDocument();
      expect(onStartAnalysis).not.toHaveBeenCalled();
    },
  );

  it("renders the empty dashboard state with readable first-scan copy", () => {
    renderScreen({ state: "empty" });

    expect(screen.getByText(copy.emptyHeading)).toBeVisible();
    expect(screen.getByText(copy.emptySupporting)).toBeVisible();
    expect(screen.getByRole("button", { name: copy.startAnalysis })).toBeVisible();
  });

  it("renders the error state and keeps retry outside the static alert", () => {
    renderScreen({ onRetryLoad: vi.fn(), report: null, state: "error" });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(copy.errorHeading);
    expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.retryLoad })).toBeVisible();
  });

  it("shows retry only when a retry callback is supplied", () => {
    const { rerender } = renderScreen({ report: null, state: "error" });

    expect(screen.queryByRole("button", { name: copy.retryLoad })).not.toBeInTheDocument();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          onRetryLoad: vi.fn(),
          report: null,
          state: "error",
        })}
      />,
    );

    expect(screen.getByRole("button", { name: copy.retryLoad })).toBeVisible();
  });

  it("prevents duplicate retry activation and shows a retry pending label", async () => {
    const deferred = createDeferred<void>();
    const onRetryLoad = vi.fn(() => deferred.promise);

    renderScreen({ onRetryLoad, report: null, state: "error" });

    fireEvent.click(screen.getByRole("button", { name: copy.retryLoad }));
    fireEvent.click(screen.getByRole("button", { name: copy.retryingLoad }));

    expect(onRetryLoad).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: copy.retryingLoad })).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.retryLoad })).toBeEnabled();
    });
  });

  it("turns retry rejection into a non-blocking toast", async () => {
    renderScreen({
      onRetryLoad: vi.fn().mockRejectedValue(new Error("retry failed")),
      report: null,
      state: "error",
    });

    fireEvent.click(screen.getByRole("button", { name: copy.retryLoad }));

    expect(await screen.findByText(copy.retryError)).toBeVisible();
  });

  it("fails closed to error for an unknown runtime state", () => {
    renderScreen({ state: "mystery" as HomeDashboardState });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();
  });
});

describe("HomeDashboardScreen profile and privacy", () => {
  it("renders the trimmed profile display name, sync label, and local-first helper", () => {
    renderScreen();

    expect(screen.getByText("Maya")).toBeVisible();
    expect(screen.queryByText("  Maya  ")).not.toBeInTheDocument();
    expect(screen.getByText(defaultReport.profile.syncLabel)).toBeVisible();
    expect(screen.getByText(copy.localFirstHelper)).toBeVisible();
  });

  it("does not render sign-in or account creation UI", () => {
    const { container } = renderScreen();

    expect(container.textContent).not.toMatch(/sign in|create account|account required/i);
  });

  it("invokes Change profile without rendering the opaque profile ID", () => {
    const onChangeProfile = vi.fn();
    const { container } = renderScreen({ onChangeProfile });

    fireEvent.click(screen.getByRole("button", { name: copy.changeProfile }));

    expect(onChangeProfile).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain(defaultReport.profile.profileId);
  });

  it("shows Change profile pending and rejection states", async () => {
    const deferred = createDeferred<void>();
    const onChangeProfile = vi
      .fn()
      .mockImplementationOnce(() => deferred.promise)
      .mockRejectedValueOnce(new Error("profile route blocked"));

    renderScreen({ onChangeProfile });

    fireEvent.click(screen.getByRole("button", { name: copy.changeProfile }));
    expect(screen.getByRole("button", { name: copy.changingProfile })).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.changeProfile })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: copy.changeProfile }));

    expect(await screen.findByText(copy.changeProfileBlocked)).toBeVisible();
  });
});

describe("HomeDashboardScreen start scan", () => {
  it("passes profileId to onStartAnalysis and does not call it on mount", () => {
    const onStartAnalysis = vi.fn();

    renderScreen({ onStartAnalysis });

    expect(onStartAnalysis).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: copy.startAnalysis }));

    expect(onStartAnalysis).toHaveBeenCalledTimes(1);
    expect(onStartAnalysis).toHaveBeenCalledWith(defaultReport.profile.profileId);
  });

  it("does not call route callbacks on rerender", () => {
    const props = createProps();
    const callbacks = [
      props.onStartAnalysis,
      props.onChangeProfile,
      props.onOpenLatestReport,
      props.onOpenRoutine,
      props.onOpenGuestScanner,
      props.onOpenProgress,
      props.onOpenOrders,
      props.onOpenStore,
      props.onOpenRecentOrder,
    ];

    const { rerender } = render(<HomeDashboardScreen {...props} />);

    rerender(<HomeDashboardScreen {...props} isOffline />);

    for (const callback of callbacks) {
      expect(callback).not.toHaveBeenCalled();
    }
  });

  it("shows an action-scoped pending label and disables conflicting controls", async () => {
    const deferred = createDeferred<void>();

    renderScreen({
      onStartAnalysis: vi.fn(() => deferred.promise),
    });

    fireEvent.click(screen.getByRole("button", { name: copy.startAnalysis }));

    expect(screen.getByRole("button", { name: copy.startingAnalysis })).toBeDisabled();
    expect(screen.queryByText(copy.openingStore)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.openStore })).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.startAnalysis })).toBeEnabled();
    });
  });

  it("prevents duplicate Start scan activation", () => {
    const deferred = createDeferred<void>();
    const onStartAnalysis = vi.fn(() => deferred.promise);

    renderScreen({ onStartAnalysis });

    fireEvent.click(screen.getByRole("button", { name: copy.startAnalysis }));
    fireEvent.click(screen.getByRole("button", { name: copy.startingAnalysis }));

    expect(onStartAnalysis).toHaveBeenCalledTimes(1);

    deferred.resolve(undefined);
  });

  it("keeps blocked Start scan visible, inert, and leaves local content visible", () => {
    const onStartAnalysis = vi.fn();

    renderScreen({ canStartAnalysis: false, onStartAnalysis });

    const button = screen.getByRole("button", { name: copy.startBlocked });
    expect(button).toBeDisabled();
    expect(screen.getByText(defaultReport.latestSnapshot!.categoryLabel)).toBeVisible();

    fireEvent.click(button);

    expect(onStartAnalysis).not.toHaveBeenCalled();
  });

  it("shows a toast when Start scan rejects", async () => {
    renderScreen({
      onStartAnalysis: vi.fn().mockRejectedValue(new Error("scan route rejected")),
    });

    fireEvent.click(screen.getByRole("button", { name: copy.startAnalysis }));

    expect(await screen.findByText(copy.startError)).toBeVisible();
  });
});

describe("HomeDashboardScreen latest snapshot", () => {
  it("renders host snapshot labels unchanged", () => {
    renderScreen();

    expect(screen.getByText(defaultReport.latestSnapshot!.capturedAtLabel)).toBeVisible();
    expect(screen.getByText(defaultReport.latestSnapshot!.categoryLabel)).toBeVisible();
    expect(screen.getByText(defaultReport.latestSnapshot!.comparisonLabel!)).toBeVisible();
    expect(screen.getByText(defaultReport.latestSnapshot!.scoreLabel!)).toBeVisible();
    expect(screen.getByText(defaultReport.latestSnapshot!.saveLabel!)).toBeVisible();
  });

  it("passes reportId to onOpenLatestReport and omits it from rendered text", () => {
    const onOpenLatestReport = vi.fn();
    const { container } = renderScreen({ onOpenLatestReport });

    fireEvent.click(screen.getByRole("button", { name: copy.openLatestReport }));

    expect(onOpenLatestReport).toHaveBeenCalledWith(defaultReport.latestSnapshot!.reportId);
    expect(container.textContent).not.toContain(defaultReport.latestSnapshot!.reportId);
  });

  it.each(["", "   "])(
    "keeps latest snapshot readable but blocks latest-report route when reportId is %j",
    (reportId) => {
      const onOpenLatestReport = vi.fn();

      renderScreen({
        onOpenLatestReport,
        report: {
          ...defaultReport,
          latestSnapshot: {
            ...defaultReport.latestSnapshot!,
            reportId,
          },
        },
      });

      expect(screen.getByText(defaultReport.latestSnapshot!.capturedAtLabel)).toBeVisible();
      expect(screen.getByText(defaultReport.latestSnapshot!.categoryLabel)).toBeVisible();

      const button = screen.getByRole("button", {
        name: copy.latestReportBlocked,
      });
      expect(button).toBeDisabled();

      fireEvent.click(button);

      expect(onOpenLatestReport).not.toHaveBeenCalled();
    },
  );

  it("renders a safe image alt fallback when host alt is blank", () => {
    renderScreen({
      report: {
        ...defaultReport,
        latestSnapshot: {
          ...defaultReport.latestSnapshot!,
          imageAlt: "   ",
        },
      },
    });

    expect(screen.getByRole("img", { name: copy.snapshotImageAlt })).toBeVisible();
  });

  it("renders a supplied snapshot image alt", () => {
    renderScreen();

    expect(
      screen.getByRole("img", { name: defaultReport.latestSnapshot!.imageAlt! }),
    ).toBeVisible();
  });

  it("renders a readable placeholder when snapshot image URL is missing", () => {
    renderScreen({
      report: {
        ...defaultReport,
        latestSnapshot: {
          ...defaultReport.latestSnapshot!,
          imageUrl: undefined,
        },
      },
    });

    expect(screen.getByText(copy.snapshotImagePlaceholder)).toBeVisible();
  });

  it("treats a whitespace-only snapshot image URL as absent", () => {
    renderScreen({
      report: {
        ...defaultReport,
        latestSnapshot: {
          ...defaultReport.latestSnapshot!,
          imageUrl: "   ",
        },
      },
    });

    expect(screen.getByText(copy.snapshotImagePlaceholder)).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders a readable placeholder after snapshot image failure", () => {
    renderScreen();

    fireEvent.error(screen.getByRole("img", { name: defaultReport.latestSnapshot!.imageAlt! }));

    expect(screen.getByText(copy.snapshotImagePlaceholder)).toBeVisible();
  });

  it("retries rendering when the host supplies a replacement snapshot image URL", () => {
    const { rerender } = renderScreen();

    fireEvent.error(screen.getByRole("img", { name: defaultReport.latestSnapshot!.imageAlt! }));
    expect(screen.getByText(copy.snapshotImagePlaceholder)).toBeVisible();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          report: {
            ...defaultReport,
            latestSnapshot: {
              ...defaultReport.latestSnapshot!,
              imageUrl: "/replacement-snapshot.jpg",
            },
          },
        })}
      />,
    );

    expect(
      screen.getByRole("img", { name: defaultReport.latestSnapshot!.imageAlt! }),
    ).toHaveAttribute("src", "/replacement-snapshot.jpg");
  });

  it("renders a readable empty replacement when latest snapshot is absent", () => {
    renderScreen({
      report: {
        ...defaultReport,
        latestSnapshot: undefined,
      },
    });

    expect(screen.getByText(copy.latestSnapshotEmpty)).toBeVisible();
    expect(screen.getByText(copy.latestSnapshotEmptySupporting)).toBeVisible();
  });

  it("keeps blocked latest-report action visible and inert", () => {
    const onOpenLatestReport = vi.fn();

    renderScreen({ canOpenLatestReport: false, onOpenLatestReport });

    const button = screen.getByRole("button", { name: copy.latestReportBlocked });
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onOpenLatestReport).not.toHaveBeenCalled();
  });

  it("shows a toast when latest-report route rejects", async () => {
    renderScreen({
      onOpenLatestReport: vi.fn().mockRejectedValue(new Error("report route rejected")),
    });

    fireEvent.click(screen.getByRole("button", { name: copy.openLatestReport }));

    expect(await screen.findByText(copy.latestReportError)).toBeVisible();
  });
});

describe("HomeDashboardScreen routine", () => {
  it("renders host routine labels, passes routineId, and omits the opaque ID", () => {
    const onOpenRoutine = vi.fn();
    const { container } = renderScreen({ onOpenRoutine });

    expect(screen.getByText(defaultReport.routine!.title)).toBeVisible();
    expect(screen.getByText(defaultReport.routine!.supporting)).toBeVisible();
    expect(screen.getByText(defaultReport.routine!.morningSummaryLabel!)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: copy.openRoutine }));

    expect(onOpenRoutine).toHaveBeenCalledWith(defaultReport.routine!.routineId);
    expect(container.textContent).not.toContain(defaultReport.routine!.routineId);
  });

  it.each(["", "   "])(
    "keeps routine readable but blocks routine route when routineId is %j",
    (routineId) => {
      const onOpenRoutine = vi.fn();

      renderScreen({
        onOpenRoutine,
        report: {
          ...defaultReport,
          routine: {
            ...defaultReport.routine!,
            routineId,
          },
        },
      });

      expect(screen.getByText(defaultReport.routine!.title)).toBeVisible();
      expect(screen.getByText(defaultReport.routine!.supporting)).toBeVisible();

      const button = screen.getByRole("button", {
        name: copy.routineBlocked,
      });
      expect(button).toBeDisabled();

      fireEvent.click(button);

      expect(onOpenRoutine).not.toHaveBeenCalled();
    },
  );

  it("renders a readable empty replacement when routine is absent", () => {
    renderScreen({
      report: {
        ...defaultReport,
        routine: undefined,
      },
    });

    expect(screen.getByText(copy.routineEmpty)).toBeVisible();
    expect(screen.getByText(copy.routineEmptySupporting)).toBeVisible();
  });

  it("keeps blocked routine action visible and reports rejection through toast", async () => {
    const onOpenRoutine = vi.fn();
    const { rerender } = renderScreen({
      canOpenRoutine: false,
      onOpenRoutine,
    });

    const blockedButton = screen.getByRole("button", { name: copy.routineBlocked });
    expect(blockedButton).toBeDisabled();
    fireEvent.click(blockedButton);
    expect(onOpenRoutine).not.toHaveBeenCalled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          onOpenRoutine: vi.fn().mockRejectedValue(new Error("routine rejected")),
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.openRoutine }));

    expect(await screen.findByText(copy.routineError)).toBeVisible();
  });
});

describe("HomeDashboardScreen quick actions", () => {
  it("invokes the scanner callback", () => {
    const onOpenGuestScanner = vi.fn();

    renderScreen({ onOpenGuestScanner });

    fireEvent.click(screen.getByRole("button", { name: copy.openScanner }));

    expect(onOpenGuestScanner).toHaveBeenCalledTimes(1);
  });

  it("keeps scanner visible but blocked when offline scanning is unsupported", () => {
    const onOpenGuestScanner = vi.fn();

    renderScreen({
      isGuestScannerAvailableOffline: false,
      isOffline: true,
      onOpenGuestScanner,
    });

    const button = screen.getByRole("button", { name: copy.scannerOfflineBlocked });
    expect(button).toBeDisabled();
    expect(screen.getByText(copy.scannerTitle)).toBeVisible();

    fireEvent.click(button);

    expect(onOpenGuestScanner).not.toHaveBeenCalled();
  });

  it("shows scanner rejection toast", async () => {
    renderScreen({
      onOpenGuestScanner: vi.fn().mockRejectedValue(new Error("scanner rejected")),
    });

    fireEvent.click(screen.getByRole("button", { name: copy.openScanner }));

    expect(await screen.findByText(copy.scannerError)).toBeVisible();
  });

  it("handles progress callback, blocked state, and rejection toast", async () => {
    const onOpenProgress = vi.fn();
    const { rerender } = renderScreen({ onOpenProgress });

    fireEvent.click(screen.getByRole("button", { name: copy.openProgress }));
    expect(onOpenProgress).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.openProgress })).toBeEnabled();
    });

    rerender(
      <HomeDashboardScreen
        {...createProps({
          canOpenProgress: false,
          onOpenProgress,
        })}
      />,
    );
    expect(screen.getByRole("button", { name: copy.progressBlocked })).toBeDisabled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          onOpenProgress: vi.fn().mockRejectedValue(new Error("progress rejected")),
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.openProgress }));

    expect(await screen.findByText(copy.progressError)).toBeVisible();
  });

  it("handles orders callback, blocked state, and rejection toast", async () => {
    const onOpenOrders = vi.fn();
    const { rerender } = renderScreen({ onOpenOrders });

    fireEvent.click(screen.getByRole("button", { name: copy.openOrders }));
    expect(onOpenOrders).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.openOrders })).toBeEnabled();
    });

    rerender(
      <HomeDashboardScreen
        {...createProps({
          canOpenOrders: false,
          onOpenOrders,
        })}
      />,
    );
    expect(screen.getByRole("button", { name: copy.ordersBlocked })).toBeDisabled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          onOpenOrders: vi.fn().mockRejectedValue(new Error("orders rejected")),
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.openOrders }));

    expect(await screen.findByText(copy.ordersError)).toBeVisible();
  });

  it("handles store callback, blocked state, and rejection toast", async () => {
    const onOpenStore = vi.fn();
    const { rerender } = renderScreen({ onOpenStore });

    fireEvent.click(screen.getByRole("button", { name: copy.openStore }));
    expect(onOpenStore).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.openStore })).toBeEnabled();
    });

    rerender(
      <HomeDashboardScreen
        {...createProps({
          canOpenStore: false,
          onOpenStore,
        })}
      />,
    );
    expect(screen.getByRole("button", { name: copy.storeBlocked })).toBeDisabled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          onOpenStore: vi.fn().mockRejectedValue(new Error("store rejected")),
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.openStore }));

    expect(await screen.findByText(copy.storeError)).toBeVisible();
  });
});

describe("HomeDashboardScreen recent order", () => {
  it("omits the recent order card when no recent order is supplied", () => {
    renderScreen({
      report: {
        ...defaultReport,
        recentOrder: undefined,
      },
    });

    expect(screen.queryByText(copy.recentOrderTitle)).not.toBeInTheDocument();
  });

  it("renders safe host order labels, passes orderId, and omits the opaque ID", () => {
    const onOpenRecentOrder = vi.fn();
    const { container } = renderScreen({ onOpenRecentOrder });

    expect(screen.getByText(defaultReport.recentOrder!.orderReferenceLabel)).toBeVisible();
    expect(screen.getByText(defaultReport.recentOrder!.statusLabel)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: copy.openRecentOrder }));

    expect(onOpenRecentOrder).toHaveBeenCalledWith(defaultReport.recentOrder!.orderId);
    expect(container.textContent).not.toContain(defaultReport.recentOrder!.orderId);
  });

  it.each(["", "   "])(
    "keeps recent order readable but blocks order route when orderId is %j",
    (orderId) => {
      const onOpenRecentOrder = vi.fn();

      renderScreen({
        onOpenRecentOrder,
        report: {
          ...defaultReport,
          recentOrder: {
            ...defaultReport.recentOrder!,
            orderId,
          },
        },
      });

      expect(screen.getByText(defaultReport.recentOrder!.orderReferenceLabel)).toBeVisible();
      expect(screen.getByText(defaultReport.recentOrder!.statusLabel)).toBeVisible();

      const button = screen.getByRole("button", {
        name: copy.recentOrderBlocked,
      });
      expect(button).toBeDisabled();

      fireEvent.click(button);

      expect(onOpenRecentOrder).not.toHaveBeenCalled();
    },
  );

  it("keeps blocked order details visible and reports rejection through toast", async () => {
    const onOpenRecentOrder = vi.fn();
    const { rerender } = renderScreen({
      canOpenRecentOrder: false,
      onOpenRecentOrder,
    });

    const blockedButton = screen.getByRole("button", {
      name: copy.recentOrderBlocked,
    });
    expect(blockedButton).toBeDisabled();
    fireEvent.click(blockedButton);
    expect(onOpenRecentOrder).not.toHaveBeenCalled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          onOpenRecentOrder: vi.fn().mockRejectedValue(new Error("order rejected")),
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.openRecentOrder }));

    expect(await screen.findByText(copy.recentOrderError)).toBeVisible();
  });
});

describe("HomeDashboardScreen environmental feature flag", () => {
  it("hides environmental content by default", () => {
    renderScreen();

    expect(screen.queryByText(copy.environmentTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(defaultReport.environment!.uvLabel!)).not.toBeInTheDocument();
  });

  it("stays hidden when the flag is false even if payload is supplied", () => {
    renderScreen({ showEnvironmentalModule: false });

    expect(screen.queryByText(defaultReport.environment!.aqiLabel!)).not.toBeInTheDocument();
  });

  it("renders host UV and AQI labels unchanged when the flag is true", () => {
    renderScreen({ showEnvironmentalModule: true });

    expect(screen.getByText(defaultReport.environment!.uvLabel!)).toBeVisible();
    expect(screen.getByText(defaultReport.environment!.aqiLabel!)).toBeVisible();
    expect(screen.getByText(defaultReport.environment!.guidanceLabel!)).toBeVisible();
  });

  it("renders readable environmental unavailable status without blocking Start scan", () => {
    const onStartAnalysis = vi.fn();

    renderScreen({
      onStartAnalysis,
      report: {
        ...defaultReport,
        environment: {},
      },
      showEnvironmentalModule: true,
    });

    expect(screen.getByText(copy.environmentUnavailable).closest('[role="status"]')).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: copy.startAnalysis }));

    expect(onStartAnalysis).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{}],
    [{ guidanceLabel: "Host guidance only" }],
    [{ updatedAtLabel: "Updated recently" }],
    [
      {
        guidanceLabel: "Host guidance only",
        updatedAtLabel: "Updated recently",
      },
    ],
    [
      {
        uvLabel: "   ",
        aqiLabel: "   ",
        guidanceLabel: "Host guidance only",
      },
    ],
  ])(
    "renders environmental unavailable status when measurements are missing for payload %#",
    (environment) => {
      renderScreen({
        report: {
          ...defaultReport,
          environment,
        },
        showEnvironmentalModule: true,
      });

      expect(screen.getByText(copy.environmentUnavailable).closest('[role="status"]')).toBeVisible();
      expect(screen.queryByText("Host guidance only")).not.toBeInTheDocument();
      expect(screen.queryByText("Updated recently")).not.toBeInTheDocument();
    },
  );

  it("treats a UV label alone as available environmental data", () => {
    renderScreen({
      report: {
        ...defaultReport,
        environment: {
          uvLabel: "UV supplied by host: 4",
        },
      },
      showEnvironmentalModule: true,
    });

    expect(screen.getByText("UV supplied by host: 4")).toBeVisible();
    expect(screen.queryByText(copy.environmentUnavailable)).not.toBeInTheDocument();
  });

  it("treats an AQI label alone as available environmental data", () => {
    renderScreen({
      report: {
        ...defaultReport,
        environment: {
          aqiLabel: "AQI supplied by host: 42",
        },
      },
      showEnvironmentalModule: true,
    });

    expect(screen.getByText("AQI supplied by host: 42")).toBeVisible();
    expect(screen.queryByText(copy.environmentUnavailable)).not.toBeInTheDocument();
  });

  it("does not request environmental data from browser APIs", () => {
    const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    const geolocation = { getCurrentPosition: vi.fn(), watchPosition: vi.fn() };
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: geolocation,
    });
    const fetchSpy = vi.fn();
    const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchSpy,
    });

    try {
      renderScreen({ showEnvironmentalModule: true });

      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(geolocation.watchPosition).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      if (originalGeolocation) {
        Object.defineProperty(navigator, "geolocation", originalGeolocation);
      } else {
        Reflect.deleteProperty(navigator, "geolocation");
      }

      if (originalFetch) {
        Object.defineProperty(globalThis, "fetch", originalFetch);
      } else {
        Reflect.deleteProperty(globalThis, "fetch");
      }
    }
  });
});

describe("HomeDashboardScreen async safety and architecture boundaries", () => {
  it("keeps offline status informational while content remains visible", () => {
    renderScreen({ isOffline: true });

    const status = screen.getByRole("status", { name: "" });
    expect(status).toHaveTextContent(copy.offline);
    expect(screen.getByText(defaultReport.latestSnapshot!.categoryLabel)).toBeVisible();
    expect(screen.getByText(defaultReport.routine!.title)).toBeVisible();
    expect(screen.getByText(defaultReport.recentOrder!.orderReferenceLabel)).toBeVisible();
  });

  it("keeps StrictMode pending behaviour stable", async () => {
    const deferred = createDeferred<void>();
    const onStartAnalysis = vi.fn(() => deferred.promise);

    render(
      <StrictMode>
        <HomeDashboardScreen {...createProps({ onStartAnalysis })} />
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.startAnalysis }));

    expect(onStartAnalysis).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: copy.startingAnalysis })).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.startAnalysis })).toBeEnabled();
    });
  });

  it("keeps StrictMode toast recovery stable", async () => {
    render(
      <StrictMode>
        <HomeDashboardScreen
          {...createProps({
            onOpenStore: vi.fn().mockRejectedValue(new Error("strict rejection")),
          })}
        />
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.openStore }));

    expect(await screen.findByText(copy.storeError)).toBeVisible();
  });

  it("auto-dismisses callback rejection toast", async () => {
    vi.useFakeTimers();

    renderScreen({
      onOpenStore: vi.fn().mockRejectedValue(new Error("store rejected")),
    });

    fireEvent.click(screen.getByRole("button", { name: copy.openStore }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(copy.storeError)).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText(copy.storeError)).not.toBeInTheDocument();
  });

  it("does not call fetch, storage, IndexedDB, camera, or geolocation APIs", () => {
    const fetchSpy = vi.fn();
    const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchSpy,
    });

    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const indexedDbOpen = vi.fn();
    const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB");
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: indexedDbOpen },
    });

    const getUserMedia = vi.fn();
    const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    const geolocation = { getCurrentPosition: vi.fn(), watchPosition: vi.fn() };
    const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: geolocation,
    });

    try {
      renderScreen({ showEnvironmentalModule: true });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(localStorageSpy).not.toHaveBeenCalled();
      expect(indexedDbOpen).not.toHaveBeenCalled();
      expect(getUserMedia).not.toHaveBeenCalled();
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(geolocation.watchPosition).not.toHaveBeenCalled();
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, "fetch", originalFetch);
      } else {
        Reflect.deleteProperty(globalThis, "fetch");
      }

      if (originalIndexedDb) {
        Object.defineProperty(window, "indexedDB", originalIndexedDb);
      } else {
        Reflect.deleteProperty(window, "indexedDB");
      }

      if (originalMediaDevices) {
        Object.defineProperty(navigator, "mediaDevices", originalMediaDevices);
      } else {
        Reflect.deleteProperty(navigator, "mediaDevices");
      }

      if (originalGeolocation) {
        Object.defineProperty(navigator, "geolocation", originalGeolocation);
      } else {
        Reflect.deleteProperty(navigator, "geolocation");
      }
    }
  });

  it("does not render anchors, iframes, file inputs, or bottom navigation", () => {
    const { container } = renderScreen();

    expect(container.querySelector("a")).not.toBeInTheDocument();
    expect(container.querySelector("iframe")).not.toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
    expect(container.querySelector("nav")).not.toBeInTheDocument();
  });

  it("does not render account, commercial-pressure, clinical, or off-palette wording", () => {
    const { container } = renderScreen();
    const html = container.innerHTML;

    expect(html).not.toMatch(/create account|required sign-in|affiliate|marketplace|external seller|sponsored|diagnosis/i);
    expect(html).not.toMatch(/sage|green|blue/i);
  });

  it("never renders opaque IDs in user-visible text", () => {
    const { container } = renderScreen({ showEnvironmentalModule: true });

    expectOpaqueIdsNotRendered(container);
  });
});
