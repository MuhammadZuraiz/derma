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
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { readFileSync } from "node:fs";

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

function renderScreen(
  overrides: Partial<HomeDashboardScreenProps> = {},
) {
  const props = createProps(overrides);

  return {
    ...render(<HomeDashboardScreen {...props} />),
    props,
  };
}

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>(
    (resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    },
  );

  return { promise, reject, resolve };
}

function expectOpaqueIdsNotRendered(container: HTMLElement) {
  for (const opaqueId of opaqueIds) {
    expect(container.textContent).not.toContain(opaqueId);
  }
}

function expectNoRouteCallbacksCalled(
  props: HomeDashboardScreenProps,
) {
  for (const callback of [
    props.onStartAnalysis,
    props.onChangeProfile,
    props.onOpenLatestReport,
    props.onOpenRoutine,
    props.onOpenGuestScanner,
    props.onOpenProgress,
    props.onOpenOrders,
    props.onOpenStore,
    props.onOpenRecentOrder,
    props.onRetryLoad,
  ]) {
    if (typeof callback === "function") {
      expect(callback).not.toHaveBeenCalled();
    }
  }
}

async function flushRejectedCallback() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HomeDashboardScreen runtime guards", () => {
  it("recognises only supported runtime states", () => {
    expect(isHomeDashboardState("loading")).toBe(true);
    expect(isHomeDashboardState("ready")).toBe(true);
    expect(isHomeDashboardState("empty")).toBe(true);
    expect(isHomeDashboardState("error")).toBe(true);
    expect(isHomeDashboardState("stale")).toBe(false);
    expect(isHomeDashboardState(null)).toBe(false);
  });

  it("fails closed when Ready context is missing or malformed", () => {
    const { rerender } = render(
      <HomeDashboardScreen
        {...createProps({
          report: null,
          state: "ready",
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      copy.errorHeading,
    );

    rerender(
      <HomeDashboardScreen
        {...createProps({
          report: {
            ...defaultReport,
            profile: {
              ...defaultReport.profile,
              profileId: " ",
            },
          },
          state: "ready",
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      copy.errorHeading,
    );
  });

  it.each([
    ["blank profile ID", { profileId: "" }],
    ["whitespace profile ID", { profileId: "   " }],
    ["blank display name", { displayName: "" }],
    ["whitespace display name", { displayName: "   " }],
  ])(
    "fails closed when required profile context has %s",
    (_label, malformedProfile) => {
      const report = {
        ...defaultReport,
        profile: {
          ...defaultReport.profile,
          ...malformedProfile,
        },
      };

      renderScreen({ report, state: "ready" });

      expect(hasUsableHomeDashboardReport(report)).toBe(false);
      expect(screen.getByRole("alert")).toHaveTextContent(
        copy.errorHeading,
      );
      expect(
        screen.queryByRole("button", {
          name: copy.startAnalysis,
        }),
      ).not.toBeInTheDocument();
    },
  );

  it("fails malformed Empty profile context closed without rendering a blank shell", () => {
    renderScreen({
      report: {
        ...defaultReport,
        profile: {
          ...defaultReport.profile,
          displayName: " ",
        },
      },
      state: "empty",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      copy.errorHeading,
    );
    expect(
      screen.queryByText(copy.emptyHeading),
    ).not.toBeInTheDocument();
  });

  it("keeps explicit Empty readable with usable profile context", () => {
    renderScreen({
      report: {
        profile: defaultReport.profile,
      },
      state: "empty",
    });

    expect(screen.getByText(copy.emptyHeading)).toBeVisible();
    expect(screen.getByText(copy.emptySupporting)).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: copy.startAnalysis,
      }),
    ).toBeVisible();
    expect(screen.getByText(copy.routineEmpty)).toBeVisible();
    expect(
      screen.getByText(copy.latestSnapshotEmpty),
    ).toBeVisible();
  });

  it("fails unknown runtime state closed into Error", () => {
    renderScreen({
      state: "mystery" as HomeDashboardState,
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      copy.errorHeading,
    );
  });
});

describe("HomeDashboardScreen simplified Ready hierarchy", () => {
  it("renders semantic main content with one h1 and profile context first", () => {
    const { container } = renderScreen();
    const main = screen.getByRole("main");
    const profileCard = screen.getByTestId("home-profile-card");
    const startCard = screen.getByTestId("home-start-card");

    expect(main).toBeVisible();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.homeHeading,
      }),
    ).toBeVisible();
    expect(profileCard.compareDocumentPosition(startCard)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByText("Welcome back, Maya")).toBeVisible();
    expect(screen.queryByText("  Maya  ")).not.toBeInTheDocument();
    expect(screen.getByText(defaultReport.profile.syncLabel)).toBeVisible();
    expect(screen.getByText(copy.localFirstHelper)).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: copy.changeProfile,
      }),
    ).toBeVisible();
  });

  it.each([
    ["undefined", undefined, null],
    ["empty string", "", null],
    ["whitespace string", "   ", null],
    ["null", null, "null"],
    ["number", 42, "42"],
    ["object", {}, "[object Object]"],
    ["array", [], null],
  ])(
    "falls back safely when optional greeting is %s",
    (_label, greetingLabel, rawText) => {
      const { container } = renderScreen({
        report: {
          ...defaultReport,
          greetingLabel:
            greetingLabel as unknown as HomeDashboardReport["greetingLabel"],
        },
      });

      expect(screen.getByText("Welcome back, Maya")).toBeVisible();
      if (rawText) {
        expect(container.textContent).not.toContain(rawText);
      }
      expect(container.querySelectorAll("h1")).toHaveLength(1);
      expect(
        screen.getByRole("button", {
          name: copy.startAnalysis,
        }),
      ).not.toBeDisabled();
      expectOpaqueIdsNotRendered(container);
    },
  );

  it("trims valid host-supplied greeting copy", () => {
    const { container } = renderScreen({
      report: {
        ...defaultReport,
        greetingLabel: "  Good to see you again  ",
      },
    });

    expect(
      screen.getByText("Good to see you again"),
    ).toBeVisible();
    expect(container.textContent).not.toContain(
      "  Good to see you again  ",
    );
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(
      screen.getByRole("button", {
        name: copy.startAnalysis,
      }),
    ).not.toBeDisabled();
  });

  it.each([
    ["empty string", ""],
    ["whitespace string", "   "],
    ["null", null],
    ["number", 42],
    ["object", {}],
    ["array", []],
  ])(
    "renders neutral profile storage fallback when sync label is %s",
    (_label, syncLabel) => {
      const { container } = renderScreen({
        report: {
          ...defaultReport,
          profile: {
            ...defaultReport.profile,
            syncLabel:
              syncLabel as unknown as HomeDashboardReport["profile"]["syncLabel"],
          },
        },
      });

      expect(
        screen.getByText(copy.profileSyncFallback),
      ).toBeVisible();
      expect(container.textContent).not.toContain("[object Object]");
      expect(
        screen.getByRole("button", {
          name: copy.startAnalysis,
        }),
      ).not.toBeDisabled();
    },
  );

  it("renders the simplified card order and keeps toast last", () => {
    renderScreen();

    const main = screen.getByRole("main");
    const profile = screen.getByTestId("home-profile-card");
    const start = screen.getByTestId("home-start-card");
    const routine = screen.getByTestId("home-routine-card");
    const journey = screen.getByTestId(
      "home-skin-journey-card",
    );
    const attention = screen.getByTestId("home-attention-card");
    const toast = screen.getByTestId("home-dashboard-toast");

    expect(
      screen.getByRole("heading", {
        name: copy.startCardTitle,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: copy.routineTitle,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: copy.skinJourneyTitle,
      }),
    ).toBeVisible();
    expect(profile.compareDocumentPosition(start)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(start.compareDocumentPosition(routine)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(routine.compareDocumentPosition(journey)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(journey.compareDocumentPosition(attention)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(attention.compareDocumentPosition(toast)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(main.lastElementChild?.lastElementChild).toBe(toast);
  });

  it("places the offline banner before actionable cards", () => {
    renderScreen({
      isOffline: true,
    });

    const offline = screen.getByRole("status", {
      name: "",
    });
    const start = screen.getByTestId("home-start-card");

    expect(offline).toHaveTextContent(copy.offline);
    expect(offline.compareDocumentPosition(start)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("does not render a persistent shortcut grid, bottom navigation, or shell markup", () => {
    const { container } = renderScreen();

    expect(container.querySelector("nav")).toBeNull();
    expect(
      screen.queryByRole("heading", {
        name: /quick actions/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open store" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open orders" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open scanner" }),
    ).not.toBeInTheDocument();
  });
});

describe("HomeDashboardScreen legacy shortcut compatibility", () => {
  it("accepts legacy Store, Orders, and Ingredient scanner callbacks without rendering controls", () => {
    const { props } = renderScreen();

    expect(
      screen.queryByRole("button", { name: /store/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /orders/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /ingredient scanner/i,
      }),
    ).not.toBeInTheDocument();
    expect(props.onOpenStore).not.toHaveBeenCalled();
    expect(props.onOpenOrders).not.toHaveBeenCalled();
    expect(props.onOpenGuestScanner).not.toHaveBeenCalled();
  });

  it("does not invoke legacy callbacks during mount or rerender", () => {
    const props = createProps();
    const { rerender } = render(
      <HomeDashboardScreen {...props} />,
    );

    expectNoRouteCallbacksCalled(props);

    rerender(
      <HomeDashboardScreen {...props} isOffline={true} />,
    );

    expect(props.onOpenStore).not.toHaveBeenCalled();
    expect(props.onOpenOrders).not.toHaveBeenCalled();
    expect(props.onOpenGuestScanner).not.toHaveBeenCalled();
  });
});

describe("HomeDashboardScreen primary facial scan CTA", () => {
  it("invokes only the existing start callback with the callback-only profile ID", () => {
    const onStartAnalysis = vi.fn();
    const onOpenRoutine = vi.fn();
    const { container } = renderScreen({
      onOpenRoutine,
      onStartAnalysis,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.startAnalysis,
      }),
    );

    expect(onStartAnalysis).toHaveBeenCalledTimes(1);
    expect(onStartAnalysis).toHaveBeenCalledWith(
      defaultReport.profile.profileId,
    );
    expect(onOpenRoutine).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain(
      defaultReport.profile.profileId,
    );
  });

  it("fails closed visibly when the start callback is missing", () => {
    renderScreen({
      onStartAnalysis:
        undefined as unknown as HomeDashboardScreenProps["onStartAnalysis"],
    });

    const button = screen.getByRole("button", {
      name: copy.startBlocked,
    });

    expect(button).toBeDisabled();
  });

  it("uses reconnect copy only when offline capability is the remaining blocker", () => {
    const { rerender } = renderScreen({
      isOffline: true,
    });

    expect(
      screen.getByRole("button", {
        name: copy.startOfflineBlocked,
      }),
    ).toBeDisabled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          canStartAnalysis: false,
          isOffline: true,
        })}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: copy.startBlocked,
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", {
        name: copy.startOfflineBlocked,
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps the facial scan callback enabled offline when the host allows it", () => {
    const onStartAnalysis = vi.fn();

    renderScreen({
      isOffline: true,
      isStartAnalysisAvailableOffline: true,
      onStartAnalysis,
    });

    const button = screen.getByRole("button", {
      name: copy.startAnalysis,
    });

    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onStartAnalysis).toHaveBeenCalledTimes(1);
  });

  it("shows scoped pending copy and rejects duplicate and conflicting forced activation", async () => {
    const pending = createDeferred();
    const onStartAnalysis = vi.fn(() => pending.promise);
    const onOpenRoutine = vi.fn();

    renderScreen({
      onOpenRoutine,
      onStartAnalysis,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.startAnalysis,
      }),
    );

    expect(onStartAnalysis).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", {
        name: copy.startingAnalysis,
      }),
    ).toBeDisabled();

    const pendingButton = screen.getByRole("button", {
      name: copy.startingAnalysis,
    });
    pendingButton.removeAttribute("disabled");
    fireEvent.click(pendingButton);

    const routineButton = screen.getByRole("button", {
      name: copy.openRoutine,
    });
    routineButton.removeAttribute("disabled");
    fireEvent.click(routineButton);

    expect(onStartAnalysis).toHaveBeenCalledTimes(1);
    expect(onOpenRoutine).not.toHaveBeenCalled();

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: copy.startAnalysis,
        }),
      ).not.toBeDisabled();
    });
  });

  it("converts facial scan rejection into a local toast", async () => {
    renderScreen({
      onStartAnalysis: vi
        .fn()
        .mockRejectedValue(new Error("no")),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.startAnalysis,
      }),
    );
    await flushRejectedCallback();

    expect(screen.getByTestId("home-dashboard-toast")).toHaveTextContent(
      copy.startError,
    );
  });
});

describe("HomeDashboardScreen routine card", () => {
  it("renders host routine labels and passes routine ID callback-only", () => {
    const onOpenRoutine = vi.fn();
    const { container } = renderScreen({ onOpenRoutine });

    expect(screen.getByText(defaultReport.routine!.title)).toBeVisible();
    expect(screen.getByText(defaultReport.routine!.supporting)).toBeVisible();
    expect(
      screen.getByText(defaultReport.routine!.morningSummaryLabel!),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openRoutine,
      }),
    );

    expect(onOpenRoutine).toHaveBeenCalledWith(
      defaultReport.routine!.routineId,
    );
    expect(container.textContent).not.toContain(
      defaultReport.routine!.routineId,
    );
  });

  it.each(["", "   "])(
    "keeps routine readable but blocks action when routineId is %j",
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
      const button = screen.getByRole("button", {
        name: copy.routineBlocked,
      });
      expect(button).toBeDisabled();
      button.removeAttribute("disabled");
      fireEvent.click(button);
      expect(onOpenRoutine).not.toHaveBeenCalled();
    },
  );

  it("handles missing callback, host block, and offline reconnect precedence", () => {
    const { rerender } = renderScreen({
      onOpenRoutine: undefined,
    });

    expect(
      screen.getByRole("button", {
        name: copy.routineBlocked,
      }),
    ).toBeDisabled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          canOpenRoutine: false,
          isOffline: true,
        })}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: copy.routineBlocked,
      }),
    ).toBeDisabled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          isOffline: true,
        })}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: copy.routineOfflineBlocked,
      }),
    ).toBeDisabled();
  });

  it("does not render a Store shortcut inside the routine card", () => {
    renderScreen();

    expect(
      within(screen.getByTestId("home-routine-card")).queryByRole(
        "button",
        { name: /store/i },
      ),
    ).not.toBeInTheDocument();
  });

  it("uses neutral routine fallbacks and omits malformed optional routine metadata without blocking route access", () => {
    renderScreen({
      report: {
        ...defaultReport,
        routine: {
          ...defaultReport.routine!,
          title: {} as unknown as string,
          supporting: [] as unknown as string,
          updatedAtLabel: 42 as unknown as string,
          morningSummaryLabel: "   ",
          eveningSummaryLabel: null as unknown as string,
        },
      },
    });

    const card = screen.getByTestId("home-routine-card");

    expect(
      screen.getByText(copy.routineTitleFallback),
    ).toBeVisible();
    expect(
      screen.getByText(copy.routineSupportingFallback),
    ).toBeVisible();
    expect(within(card).queryByText("Updated")).not.toBeInTheDocument();
    expect(within(card).queryByText("Morning")).not.toBeInTheDocument();
    expect(within(card).queryByText("Evening")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: copy.openRoutine,
      }),
    ).not.toBeDisabled();
  });
});

describe("HomeDashboardScreen Skin journey card", () => {
  it("renders snapshot image and host latest-report labels unchanged", () => {
    renderScreen();

    expect(
      screen.getByRole("img", {
        name: defaultReport.latestSnapshot!.imageAlt!,
      }),
    ).toHaveAttribute("src", "/latest-snapshot.jpg");
    expect(
      screen.getByText(defaultReport.latestSnapshot!.capturedAtLabel),
    ).toBeVisible();
    expect(
      screen.getByText(defaultReport.latestSnapshot!.categoryLabel),
    ).toBeVisible();
    expect(
      screen.getByText(defaultReport.latestSnapshot!.comparisonLabel!),
    ).toBeVisible();
    expect(
      screen.getByText(defaultReport.latestSnapshot!.scoreLabel!),
    ).toBeVisible();
  });

  it("uses placeholder for whitespace URL, failed image, and retries replacement URL", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        latestSnapshot: {
          ...defaultReport.latestSnapshot!,
          imageUrl: "   ",
        },
      },
    });

    expect(
      screen.getByText(copy.snapshotImagePlaceholder),
    ).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(<HomeDashboardScreen {...createProps()} />);
    fireEvent.error(
      screen.getByRole("img", {
        name: defaultReport.latestSnapshot!.imageAlt!,
      }),
    );
    expect(
      screen.getByText(copy.snapshotImagePlaceholder),
    ).toBeVisible();

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
      screen.getByRole("img", {
        name: defaultReport.latestSnapshot!.imageAlt!,
      }),
    ).toHaveAttribute("src", "/replacement-snapshot.jpg");
  });

  it.each([
    ["undefined", undefined],
    ["empty string", ""],
    ["whitespace string", "   "],
    ["null", null],
    ["number", 42],
    ["object", {}],
    ["array", []],
  ])(
    "uses fallback snapshot image alt when alt is %s",
    (_label, imageAlt) => {
      renderScreen({
        report: {
          ...defaultReport,
          latestSnapshot: {
            ...defaultReport.latestSnapshot!,
            imageAlt: imageAlt as unknown as string,
          },
        },
      });

      expect(
        screen.getByRole("img", {
          name: copy.snapshotImageAlt,
        }),
      ).toBeVisible();
    },
  );

  it("trims valid snapshot alt text", () => {
    renderScreen({
      report: {
        ...defaultReport,
        latestSnapshot: {
          ...defaultReport.latestSnapshot!,
          imageAlt: "  Maya refreshed snapshot  ",
        },
      },
    });

    expect(
      screen.getByRole("img", {
        name: "Maya refreshed snapshot",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("img", {
        name: "  Maya refreshed snapshot  ",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps latest summary readable while blank report ID disables report action", () => {
    const onOpenLatestReport = vi.fn();

    renderScreen({
      onOpenLatestReport,
      report: {
        ...defaultReport,
        latestSnapshot: {
          ...defaultReport.latestSnapshot!,
          reportId: " ",
        },
      },
    });

    expect(
      screen.getByText(defaultReport.latestSnapshot!.categoryLabel),
    ).toBeVisible();
    const button = screen.getByRole("button", {
      name: copy.latestReportBlocked,
    });
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onOpenLatestReport).not.toHaveBeenCalled();
  });

  it("opens latest report and progress through independent callbacks", async () => {
    const onOpenLatestReport = vi.fn();
    const onOpenProgress = vi.fn();

    renderScreen({ onOpenLatestReport, onOpenProgress });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openLatestReport,
      }),
    );

    expect(onOpenLatestReport).toHaveBeenCalledWith(
      defaultReport.latestSnapshot!.reportId,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: copy.openProgress,
        }),
      ).not.toBeDisabled();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openProgress,
      }),
    );

    expect(onOpenProgress).toHaveBeenCalledTimes(1);
  });

  it("allows report action and progress action to block independently", () => {
    const { rerender } = renderScreen({
      canOpenLatestReport: false,
    });

    expect(
      screen.getByRole("button", {
        name: copy.latestReportBlocked,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: copy.openProgress,
      }),
    ).not.toBeDisabled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          canOpenProgress: false,
        })}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: copy.openLatestReport,
      }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: copy.progressBlocked,
      }),
    ).toBeDisabled();
  });

  it("uses reconnect labels for report and progress only when offline is the remaining blocker", () => {
    const { rerender } = renderScreen({
      isOffline: true,
    });

    expect(
      screen.getByRole("button", {
        name: copy.latestReportOfflineBlocked,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: copy.progressOfflineBlocked,
      }),
    ).toBeDisabled();

    rerender(
      <HomeDashboardScreen
        {...createProps({
          canOpenProgress: false,
          isOffline: true,
        })}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: copy.progressBlocked,
      }),
    ).toBeDisabled();
  });

  it("uses neutral snapshot summary fallbacks and omits malformed optional snapshot metadata without blocking report access", () => {
    renderScreen({
      report: {
        ...defaultReport,
        latestSnapshot: {
          ...defaultReport.latestSnapshot!,
          capturedAtLabel: {} as unknown as string,
          categoryLabel: [] as unknown as string,
          comparisonLabel: 42 as unknown as string,
          scoreLabel: "   ",
          saveLabel: null as unknown as string,
        },
      },
    });

    const card = screen.getByTestId("home-skin-journey-card");

    expect(
      screen.getByText(copy.snapshotCapturedFallback),
    ).toBeVisible();
    expect(
      screen.getByText(copy.snapshotCategoryFallback),
    ).toBeVisible();
    expect(within(card).queryByText("Host label")).not.toBeInTheDocument();
    expect(within(card).queryByText("Host summary")).not.toBeInTheDocument();
    expect(within(card).queryByText("Saved")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: copy.openLatestReport,
      }),
    ).not.toBeDisabled();
  });

  it("trims usable host summary copy before rendering without changing route availability", () => {
    renderScreen({
      report: {
        ...defaultReport,
        latestSnapshot: {
          ...defaultReport.latestSnapshot!,
          categoryLabel: "  Host-trimmed summary  ",
        },
      },
    });

    expect(
      screen.getByText("Host-trimmed summary"),
    ).toBeVisible();
    expect(
      screen.queryByText("  Host-trimmed summary  "),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: copy.openLatestReport,
      }),
    ).not.toBeDisabled();
  });
});

describe("HomeDashboardScreen conditional attention priority", () => {
  it("renders recent order as the only attention card when supplied", () => {
    renderScreen({ showEnvironmentalModule: true });

    expect(screen.getByTestId("home-attention-card")).toHaveTextContent(
      copy.recentOrderTitle,
    );
    expect(
      screen.getByText(defaultReport.recentOrder!.orderReferenceLabel),
    ).toBeVisible();
    expect(
      screen.queryByText(defaultReport.environment!.uvLabel!),
    ).not.toBeInTheDocument();
  });

  it("renders environmental card when no order exists and UV or AQI is usable", () => {
    renderScreen({
      report: {
        ...defaultReport,
        recentOrder: undefined,
      },
      showEnvironmentalModule: true,
    });

    expect(screen.getByTestId("home-attention-card")).toHaveTextContent(
      copy.environmentTitle,
    );
    expect(
      screen.getByText(defaultReport.environment!.uvLabel!),
    ).toBeVisible();
  });

  it.each([
    {},
    { guidanceLabel: "Host guidance only" },
    { updatedAtLabel: "Updated recently" },
    {
      guidanceLabel: "Host guidance only",
      updatedAtLabel: "Updated recently",
    },
    {
      uvLabel: "   ",
      aqiLabel: "   ",
      guidanceLabel: "Host guidance only",
    },
  ])(
    "omits attention region for environment payload without usable values %#",
    (environment) => {
      renderScreen({
        report: {
          ...defaultReport,
          environment,
          recentOrder: undefined,
        },
        showEnvironmentalModule: true,
      });

      expect(
        screen.queryByTestId("home-attention-card"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Host guidance only"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Updated recently"),
      ).not.toBeInTheDocument();
    },
  );

  it("keeps order card readable but disables details when order ID is blank", () => {
    const onOpenRecentOrder = vi.fn();

    renderScreen({
      onOpenRecentOrder,
      report: {
        ...defaultReport,
        recentOrder: {
          ...defaultReport.recentOrder!,
          orderId: " ",
        },
      },
    });

    expect(
      screen.getByText(defaultReport.recentOrder!.orderReferenceLabel),
    ).toBeVisible();
    const button = screen.getByRole("button", {
      name: copy.recentOrderBlocked,
    });
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onOpenRecentOrder).not.toHaveBeenCalled();
  });

  it("uses neutral active-order fallbacks and omits malformed optional supporting copy without blocking order route access", () => {
    renderScreen({
      report: {
        ...defaultReport,
        recentOrder: {
          ...defaultReport.recentOrder!,
          orderReferenceLabel: {} as unknown as string,
          statusLabel: [] as unknown as string,
          supporting: 42 as unknown as string,
        },
      },
    });

    const card = screen.getByTestId("home-attention-card");

    expect(
      screen.getByText(copy.recentOrderReferenceFallback),
    ).toBeVisible();
    expect(
      screen.getByText(copy.recentOrderStatusFallback),
    ).toBeVisible();
    expect(card.textContent).not.toContain("42");
    expect(card.textContent).not.toContain("[object Object]");
    expect(
      screen.getByRole("button", {
        name: copy.openRecentOrder,
      }),
    ).not.toBeDisabled();
  });

  it("opens order details only through the matching callback", () => {
    const onOpenRecentOrder = vi.fn();
    const onOpenLatestReport = vi.fn();

    renderScreen({ onOpenLatestReport, onOpenRecentOrder });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openRecentOrder,
      }),
    );

    expect(onOpenRecentOrder).toHaveBeenCalledWith(
      defaultReport.recentOrder!.orderId,
    );
    expect(onOpenLatestReport).not.toHaveBeenCalled();
  });

  it("keeps environmental card readable while omitting malformed optional metadata", () => {
    renderScreen({
      report: {
        ...defaultReport,
        environment: {
          uvLabel: "  UV supplied by host: 5  ",
          guidanceLabel: {} as unknown as string,
          updatedAtLabel: "   ",
        },
        recentOrder: undefined,
      },
      showEnvironmentalModule: true,
    });

    const card = screen.getByTestId("home-attention-card");

    expect(screen.getByText("UV supplied by host: 5")).toBeVisible();
    expect(within(card).queryByText("Guidance")).not.toBeInTheDocument();
    expect(within(card).queryByText("Updated")).not.toBeInTheDocument();
    expect(card.textContent).not.toContain("[object Object]");
  });
});

describe("HomeDashboardScreen Loading, Empty, Error, and Offline", () => {
  it("renders calm polite Loading status without route actions or nav", () => {
    const { container, props } = renderScreen({
      report: null,
      state: "loading",
    });

    const status = screen
      .getByText(copy.loadingHeading)
      .closest('[role="status"]') as HTMLElement | null;
    expect(status).not.toBeNull();
    if (!status) {
      throw new Error("Loading status region missing");
    }
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(copy.loadingHeading);
    expect(status).toHaveTextContent(copy.loadingSupporting);
    expect(within(status).queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector("nav")).toBeNull();
    expectNoRouteCallbacksCalled(props);
  });

  it("renders Error alert with guarded Retry outside alert", async () => {
    const pending = createDeferred();
    const onRetryLoad = vi.fn(() => pending.promise);

    renderScreen({
      onRetryLoad,
      report: null,
      state: "error",
    });

    const alert = screen.getByRole("alert");
    const retry = screen.getByRole("button", {
      name: copy.retryLoad,
    });

    expect(alert).toHaveTextContent(copy.errorHeading);
    expect(alert).not.toContainElement(retry);

    fireEvent.click(retry);
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.retryingLoad,
      }),
    );
    expect(onRetryLoad).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: copy.retryLoad,
        }),
      ).not.toBeDisabled();
    });
  });

  it("renders offline banner with cards readable and host-permitted offline actions enabled", () => {
    renderScreen({
      isOffline: true,
      isProgressAvailableOffline: true,
      isStartAnalysisAvailableOffline: true,
    });

    expect(
      screen.getByText(copy.offline).closest('[role="status"]'),
    ).toBeVisible();
    expect(screen.getByText(defaultReport.routine!.title)).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: copy.startAnalysis,
      }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: copy.openProgress,
      }),
    ).not.toBeDisabled();
  });
});

describe("HomeDashboardScreen pending and rejection behavior", () => {
  it("disables all visible actions during representative pending operation", async () => {
    const pending = createDeferred();

    renderScreen({
      onOpenProgress: vi.fn(() => pending.promise),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openProgress,
      }),
    );

    expect(
      screen.getByRole("button", {
        name: copy.openingProgress,
      }),
    ).toBeDisabled();

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: copy.openProgress,
        }),
      ).not.toBeDisabled();
    });
  });

  it("shows rejection toast, does not steal focus, and auto-dismisses", async () => {
    vi.useFakeTimers();
    renderScreen({
      onOpenRoutine: vi
        .fn()
        .mockRejectedValue(new Error("no")),
    });

    const button = screen.getByRole("button", {
      name: copy.openRoutine,
    });
    button.focus();

    fireEvent.click(button);
    await flushRejectedCallback();

    expect(screen.getByTestId("home-dashboard-toast")).toHaveTextContent(
      copy.routineError,
    );
    expect(document.activeElement).toBe(button);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId("home-dashboard-toast")).toHaveTextContent(
      "",
    );
  });

  it("cleans up toast timer on unmount", async () => {
    vi.useFakeTimers();
    const { unmount } = renderScreen({
      onOpenRoutine: vi
        .fn()
        .mockRejectedValue(new Error("no")),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openRoutine,
      }),
    );
    await flushRejectedCallback();

    expect(screen.getByTestId("home-dashboard-toast")).toHaveTextContent(
      copy.routineError,
    );

    unmount();

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });

  it("restarts dismissal window for identical replacement toast", async () => {
    vi.useFakeTimers();
    const onOpenRoutine = vi.fn(() => {
      throw new Error("no");
    });

    renderScreen({ onOpenRoutine });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: copy.openRoutine,
        }),
      );
    });

    expect(screen.getByTestId("home-dashboard-toast")).toHaveTextContent(
      copy.routineError,
    );

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: copy.openRoutine,
        }),
      );
    });

    expect(onOpenRoutine).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText(copy.routineError)).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByTestId("home-dashboard-toast")).toHaveTextContent(
      copy.routineError,
    );

    act(() => {
      vi.advanceTimersByTime(4400);
    });

    expect(screen.getByTestId("home-dashboard-toast")).toHaveTextContent(
      "",
    );
  });
});

describe("HomeDashboardScreen StrictMode behavior", () => {
  it("does not call callbacks during StrictMode mount or rerender", () => {
    const props = createProps();
    const { rerender } = render(
      <StrictMode>
        <HomeDashboardScreen {...props} />
      </StrictMode>,
    );

    expectNoRouteCallbacksCalled(props);

    rerender(
      <StrictMode>
        <HomeDashboardScreen {...props} isOffline />
      </StrictMode>,
    );

    expectNoRouteCallbacksCalled(props);
  });

  it("keeps duplicate guard effective under StrictMode", async () => {
    const pending = createDeferred();
    const onStartAnalysis = vi.fn(() => pending.promise);

    render(
      <StrictMode>
        <HomeDashboardScreen
          {...createProps({ onStartAnalysis })}
        />
      </StrictMode>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.startAnalysis,
      }),
    );
    const pendingButton = screen.getByRole("button", {
      name: copy.startingAnalysis,
    });
    pendingButton.removeAttribute("disabled");
    fireEvent.click(pendingButton);

    expect(onStartAnalysis).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
  });

  it("renders one toast after StrictMode rejection", async () => {
    render(
      <StrictMode>
        <HomeDashboardScreen
          {...createProps({
            onOpenProgress: vi
              .fn()
              .mockRejectedValue(new Error("no")),
          })}
        />
      </StrictMode>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openProgress,
      }),
    );
    await flushRejectedCallback();

    expect(screen.getAllByText(copy.progressError)).toHaveLength(1);
  });

  it("does not update state after unmount during pending callback", async () => {
    const pending = createDeferred();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { unmount } = render(
      <StrictMode>
        <HomeDashboardScreen
          {...createProps({
            onOpenProgress: vi.fn(() => pending.promise),
          })}
        />
      </StrictMode>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openProgress,
      }),
    );
    unmount();

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("HomeDashboardScreen visual and architecture contract", () => {
  it("uses warm palette, mobile spacing, dominant primary CTA, rounded cards, focus rings, and no bar markup", () => {
    const { container } = renderScreen();
    const main = screen.getByTestId("home-dashboard-main");
    const startButton = screen.getByRole("button", {
      name: copy.startAnalysis,
    });

    expect(main).toHaveStyle({
      "--dl-page": "#FAF7F2",
      "--dl-peach": "#E8A98A",
      "--dl-blush": "#F2D9CC",
      "--dl-sand": "#C9B8A4",
      "--dl-bark": "#5C4A42",
    });
    expect(main.className).toContain("px-4");
    expect(startButton.className).toContain("min-h-[64px]");
    expect(startButton.className).toContain(
      "focus-visible:outline",
    );
    expect(startButton.className).toContain(
      "motion-reduce:transition-none",
    );
    expect(screen.getByTestId("home-start-card").className).toContain(
      "rounded-[24px]",
    );
    expect(container.querySelector("nav")).toBeNull();
  });

  it("does not render anchors, iframes, file inputs, or opaque IDs", () => {
    const { container } = renderScreen({
      showEnvironmentalModule: true,
    });

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expectOpaqueIdsNotRendered(container);
  });

  it("keeps the production source within presentation boundaries", () => {
    const source = readFileSync(
      "components/home-dashboard-screen.tsx",
      "utf8",
    );
    const forbidden = [
      "fetch(",
      "localStorage",
      "sessionStorage",
      "indexedDB",
      "document.cookie",
      "navigator.geolocation",
      "navigator.mediaDevices",
      "getUserMedia",
      "FileReader",
      "window.location",
      "location.href",
      "history.",
      "useRouter",
      "next/navigation",
      "react-router",
      "http://",
      "https://",
      'input type="file"',
      "accept=",
      "capture=",
      "iframe",
      "AppBottomNavigation",
      "ScanActionsSheet",
      "MoreHubScreen",
      "ReturningUserNavigationShell",
      "analytics",
      "affiliate",
      "marketplace",
      "external seller",
      "sponsored",
    ];

    for (const pattern of forbidden) {
      expect(source).not.toContain(pattern);
    }

    expect(source).not.toMatch(/<a(?:\s|>)/i);
    expect(source).not.toMatch(/<nav(?:\s|>)/i);
    expect(source).not.toMatch(/\bsage\b/i);
    expect(source).not.toMatch(/\bgreen\b/i);
    expect(source).not.toMatch(/\bblue\b/i);
    expect(source).not.toMatch(/\bcamera\b/i);
    expect(source).not.toMatch(/\bpicker\b/i);
    expect(source).not.toMatch(/\bcalculate\b/i);
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("window.clearTimeout");
    expect(source).toMatch(/onStartAnalysis|canStartAnalysis|start-analysis/);
  });
});
