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

import MoreHubScreen, {
  isMoreHubScreenState,
  type MoreHubScreenProps,
} from "./more-hub-screen";

const copy = {
  heading: "More",
  supporting:
    "Find shopping, tools, profiles, and optional sync settings without crowding your home screen.",
  offline:
    "You appear to be offline. Supplied destinations remain readable. The host controls which routes stay available.",
  helperHeading: "Local-first by design",
  helper:
    "Your profiles remain useful without an account. Optional sync stays under profile settings and is never enabled automatically.",
  loadingHeading: "Preparing more options",
  loadingSupporting:
    "Your secondary destinations are being prepared.",
  errorHeading: "We could not load more options",
  errorSupporting:
    "Try loading your secondary destinations again.",
  toast:
    "We could not open that destination. Please try again.",
  retry: "Retry",
  retryPending: "Trying again...",
};

type CallbackName =
  | "onOpenStore"
  | "onOpenOrders"
  | "onOpenIngredientScanner"
  | "onOpenProfilesAndOptionalSync";

type FlagName =
  | "canOpenStore"
  | "canOpenOrders"
  | "canOpenIngredientScanner"
  | "canOpenProfilesAndOptionalSync";

type OfflineFlagName =
  | "isStoreAvailableOffline"
  | "isOrdersAvailableOffline"
  | "isIngredientScannerAvailableOffline"
  | "isProfilesAndOptionalSyncAvailableOffline";

const routeConfig: Array<{
  blockedLabel: string;
  callbackName: CallbackName;
  flagName: FlagName;
  offlineFlagName: OfflineFlagName;
  operation: "store" | "orders" | "ingredient-scanner" | "profiles";
  pendingLabel: string;
  reconnectLabel: string;
  title: string;
}> = [
  {
    operation: "store",
    title: "Store",
    callbackName: "onOpenStore",
    flagName: "canOpenStore",
    offlineFlagName: "isStoreAvailableOffline",
    blockedLabel: "Store unavailable",
    reconnectLabel: "Reconnect to open Store",
    pendingLabel: "Opening Store...",
  },
  {
    operation: "orders",
    title: "Orders",
    callbackName: "onOpenOrders",
    flagName: "canOpenOrders",
    offlineFlagName: "isOrdersAvailableOffline",
    blockedLabel: "Orders unavailable",
    reconnectLabel: "Reconnect to open Orders",
    pendingLabel: "Opening Orders...",
  },
  {
    operation: "ingredient-scanner",
    title: "Ingredient scanner",
    callbackName: "onOpenIngredientScanner",
    flagName: "canOpenIngredientScanner",
    offlineFlagName:
      "isIngredientScannerAvailableOffline",
    blockedLabel: "Ingredient scanner unavailable",
    reconnectLabel:
      "Reconnect to open ingredient scanner",
    pendingLabel: "Opening ingredient scanner...",
  },
  {
    operation: "profiles",
    title: "Profiles and optional sync",
    callbackName: "onOpenProfilesAndOptionalSync",
    flagName: "canOpenProfilesAndOptionalSync",
    offlineFlagName:
      "isProfilesAndOptionalSyncAvailableOffline",
    blockedLabel: "Profiles unavailable",
    reconnectLabel: "Reconnect to manage profiles",
    pendingLabel: "Opening profiles...",
  },
];

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

function createCallbacks() {
  return {
    onOpenStore: vi.fn(),
    onOpenOrders: vi.fn(),
    onOpenIngredientScanner: vi.fn(),
    onOpenProfilesAndOptionalSync: vi.fn(),
    onRetryLoad: vi.fn(),
  };
}

function createProps(
  overrides: Partial<MoreHubScreenProps> = {},
) {
  return {
    ...createCallbacks(),
    ...overrides,
  } satisfies MoreHubScreenProps;
}

function renderHub(
  overrides: Partial<MoreHubScreenProps> = {},
) {
  const props = createProps(overrides);

  return {
    ...render(<MoreHubScreen {...props} />),
    props,
  };
}

function renderStrictHub(
  overrides: Partial<MoreHubScreenProps> = {},
) {
  const props = createProps(overrides);

  return {
    ...render(
      <StrictMode>
        <MoreHubScreen {...props} />
      </StrictMode>,
    ),
    props,
  };
}

function getRouteButton(
  operation: (typeof routeConfig)[number]["operation"],
) {
  return screen.getByTestId(`more-hub-${operation}-button`);
}

function queryRouteButton(
  operation: (typeof routeConfig)[number]["operation"],
) {
  return screen.queryByTestId(`more-hub-${operation}-button`);
}

function getRouteButtons() {
  return routeConfig.map((config) =>
    getRouteButton(config.operation),
  );
}

function getRouteTitles() {
  return getRouteButtons().map((button) =>
    within(button)
      .getByText(
        /^(Store|Orders|Ingredient scanner|Profiles and optional sync)$/,
      )
      .textContent?.trim(),
  );
}

function expectNoCallbacksCalled(
  props: ReturnType<typeof createProps>,
) {
  for (const callbackName of [
    "onOpenStore",
    "onOpenOrders",
    "onOpenIngredientScanner",
    "onOpenProfilesAndOptionalSync",
    "onRetryLoad",
  ] as const) {
    const callback = props[callbackName];

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

describe("MoreHubScreen runtime state helper", () => {
  it("recognises supported states only", () => {
    expect(isMoreHubScreenState("loading")).toBe(true);
    expect(isMoreHubScreenState("ready")).toBe(true);
    expect(isMoreHubScreenState("error")).toBe(true);
    expect(isMoreHubScreenState("empty")).toBe(false);
    expect(isMoreHubScreenState("dashboard")).toBe(false);
    expect(isMoreHubScreenState(null)).toBe(false);
  });

  it("defaults omitted state to Ready", () => {
    renderHub({
      state: undefined,
    });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.heading,
      }),
    ).toBeVisible();
    expect(getRouteButtons()).toHaveLength(4);
  });

  it("fails malformed runtime state closed into Error", () => {
    renderHub({
      state: "wat" as MoreHubScreenProps["state"],
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      copy.errorHeading,
    );
    expect(queryRouteButton("store")).not.toBeInTheDocument();
  });
});

describe("MoreHubScreen core Ready rendering", () => {
  it("renders semantic main content with one h1 and supporting copy", () => {
    const { container } = renderHub();

    expect(screen.getByRole("main")).toBeVisible();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.heading,
      }),
    ).toBeVisible();
    expect(screen.getByText(copy.supporting)).toBeVisible();
  });

  it("renders grouped headings and exactly four route buttons in locked order", () => {
    renderHub();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Shopping",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Tools",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Profiles and privacy",
      }),
    ).toBeVisible();

    expect(getRouteButtons()).toHaveLength(4);
    expect(getRouteTitles()).toEqual([
      "Store",
      "Orders",
      "Ingredient scanner",
      "Profiles and optional sync",
    ]);
  });

  it("renders destination supporting copy and local-first helper copy", () => {
    renderHub();

    expect(
      screen.getByText(
        "Browse first-party skincare products and routine collections.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Review your DermaLens order history."),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Scan or enter an ingredient label for guidance.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Manage local profiles and open optional sync settings from profile management.",
      ),
    ).toBeVisible();
    expect(screen.getByText(copy.helperHeading)).toBeVisible();
    expect(screen.getByText(copy.helper)).toBeVisible();
  });

  it("renders no Back button, anchors, or navigation markup", () => {
    const { container } = renderHub();

    expect(
      screen.queryByRole("button", { name: /back/i }),
    ).not.toBeInTheDocument();
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("nav")).toBeNull();
  });

  it("keeps inline SVG icons decorative", () => {
    const { container } = renderHub();

    for (const icon of container.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });
});

describe("MoreHubScreen explicit callbacks", () => {
  it.each(routeConfig)(
    "invokes only the matching callback for $title",
    ({ callbackName, operation }) => {
      const { props } = renderHub();

      fireEvent.click(getRouteButton(operation));

      expect(props[callbackName]).toHaveBeenCalledTimes(1);

      for (const config of routeConfig) {
        if (config.callbackName !== callbackName) {
          expect(
            props[config.callbackName],
          ).not.toHaveBeenCalled();
        }
      }
      expect(props.onRetryLoad).not.toHaveBeenCalled();
    },
  );

  it("does not call callbacks during mount or rerender", () => {
    const props = createProps();
    const { rerender } = render(
      <MoreHubScreen {...props} />,
    );

    expectNoCallbacksCalled(props);

    rerender(
      <MoreHubScreen {...props} isOffline={true} />,
    );

    expectNoCallbacksCalled(props);
  });

  it("does not expose a direct account-sync callback surface", () => {
    renderHub();

    expect(
      screen.queryByRole("button", {
        name: /account sync/i,
      }),
    ).not.toBeInTheDocument();
  });
});

describe("MoreHubScreen independent host availability", () => {
  it.each(routeConfig)(
    "fails closed when $title host flag is false",
    ({
      blockedLabel,
      callbackName,
      flagName,
      operation,
    }) => {
      const { props } = renderHub({
        [flagName]: false,
      });
      const button = getRouteButton(operation);

      expect(within(button).getByText(blockedLabel)).toBeVisible();
      expect(button).toBeDisabled();

      button.removeAttribute("disabled");
      fireEvent.click(button);

      expect(props[callbackName]).not.toHaveBeenCalled();
    },
  );

  it.each(routeConfig)(
    "fails closed when $title callback is missing",
    ({ blockedLabel, callbackName, operation }) => {
      const { props } = renderHub({
        [callbackName]: undefined,
      });
      const button = getRouteButton(operation);

      expect(within(button).getByText(blockedLabel)).toBeVisible();
      expect(button).toBeDisabled();

      button.removeAttribute("disabled");
      fireEvent.click(button);

      expectNoCallbacksCalled(props);
    },
  );

  it("keeps unrelated routes enabled when one route is blocked", () => {
    renderHub({
      canOpenStore: false,
    });

    expect(getRouteButton("store")).toBeDisabled();
    expect(getRouteButton("orders")).not.toBeDisabled();
    expect(
      getRouteButton("ingredient-scanner"),
    ).not.toBeDisabled();
    expect(getRouteButton("profiles")).not.toBeDisabled();
    expect(getRouteTitles()).toEqual([
      "Store",
      "Orders",
      "Ingredient scanner",
      "Profiles and optional sync",
    ]);
  });
});

describe("MoreHubScreen offline availability", () => {
  it.each(routeConfig)(
    "uses reconnect copy when $title is offline and not available offline",
    ({ callbackName, operation, reconnectLabel }) => {
      const { props } = renderHub({
        isOffline: true,
      });
      const button = getRouteButton(operation);

      expect(within(button).getByText(reconnectLabel)).toBeVisible();
      expect(button).toBeDisabled();

      button.removeAttribute("disabled");
      fireEvent.click(button);

      expect(props[callbackName]).not.toHaveBeenCalled();
    },
  );

  it("keeps a host-permitted offline route enabled", () => {
    const { props } = renderHub({
      isOffline: true,
      isStoreAvailableOffline: true,
    });

    const button = getRouteButton("store");

    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(props.onOpenStore).toHaveBeenCalledTimes(1);
  });

  it("lets a general host block beat reconnect copy", () => {
    renderHub({
      canOpenStore: false,
      isOffline: true,
      isStoreAvailableOffline: false,
    });

    const button = getRouteButton("store");

    expect(
      within(button).getByText("Store unavailable"),
    ).toBeVisible();
    expect(
      within(button).queryByText("Reconnect to open Store"),
    ).not.toBeInTheDocument();
  });
});

describe("MoreHubScreen pending behavior", () => {
  it.each([
    {
      callbackName: "onOpenStore" as const,
      operation: "store" as const,
      pendingLabel: "Opening Store...",
    },
    {
      callbackName: "onOpenProfilesAndOptionalSync" as const,
      operation: "profiles" as const,
      pendingLabel: "Opening profiles...",
    },
  ])(
    "guards duplicate and conflicting activation for $operation",
    async ({ callbackName, operation, pendingLabel }) => {
      const pending = createDeferred();
      const callback = vi.fn(() => pending.promise);
      const ordersCallback = vi.fn();
      renderHub({
        [callbackName]: callback,
        onOpenOrders: ordersCallback,
      });

      fireEvent.click(getRouteButton(operation));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        within(getRouteButton(operation)).getByText(
          pendingLabel,
        ),
      ).toBeVisible();

      for (const button of getRouteButtons()) {
        expect(button).toBeDisabled();
      }

      const pendingButton = getRouteButton(operation);
      pendingButton.removeAttribute("disabled");
      fireEvent.click(pendingButton);
      expect(callback).toHaveBeenCalledTimes(1);

      const conflictingButton = getRouteButton("orders");
      conflictingButton.removeAttribute("disabled");
      fireEvent.click(conflictingButton);
      expect(ordersCallback).not.toHaveBeenCalled();

      await act(async () => {
        pending.resolve();
        await pending.promise;
      });

      await waitFor(() => {
        expect(getRouteButton(operation)).not.toBeDisabled();
      });
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: copy.heading,
        }),
      ).toBeVisible();
    },
  );
});

describe("MoreHubScreen rejection toast", () => {
  it.each([
    {
      callbackName: "onOpenStore" as const,
      operation: "store" as const,
    },
    {
      callbackName: "onOpenIngredientScanner" as const,
      operation: "ingredient-scanner" as const,
    },
  ])(
    "shows a polite local toast for $operation rejection",
    async ({ callbackName, operation }) => {
      vi.useFakeTimers();
      renderHub({
        [callbackName]: vi
          .fn()
          .mockRejectedValue(new Error("fail")),
      });

      const button = getRouteButton(operation);
      button.focus();

      await act(async () => {
        fireEvent.click(button);
      });
      await flushRejectedCallback();

      const toast = screen.getByTestId("more-hub-toast");
      expect(toast).toHaveAttribute("aria-live", "polite");
      expect(toast).toHaveTextContent(copy.toast);
      expect(button).not.toBeDisabled();
      expect(document.activeElement).toBe(button);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(toast).toHaveTextContent("");
    },
  );

  it("cleans up the toast timer on unmount", async () => {
    vi.useFakeTimers();
    const { unmount } = renderHub({
      onOpenStore: vi
        .fn()
        .mockRejectedValue(new Error("fail")),
    });

    await act(async () => {
      fireEvent.click(getRouteButton("store"));
    });
    await flushRejectedCallback();

    expect(screen.getByTestId("more-hub-toast")).toHaveTextContent(
      copy.toast,
    );

    unmount();

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });

  it("restarts the dismissal window when identical toast copy replaces an existing toast", async () => {
    vi.useFakeTimers();
    const callback = vi.fn(() => {
      throw new Error("fail");
    });

    renderHub({
      onOpenStore: callback,
    });

    await act(async () => {
      fireEvent.click(getRouteButton("store"));
    });

    expect(screen.getByTestId("more-hub-toast")).toHaveTextContent(
      copy.toast,
    );

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    await act(async () => {
      fireEvent.click(getRouteButton("store"));
    });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText(copy.toast)).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByTestId("more-hub-toast")).toHaveTextContent(
      copy.toast,
    );

    act(() => {
      vi.advanceTimersByTime(4400);
    });

    expect(screen.getByTestId("more-hub-toast")).toHaveTextContent(
      "",
    );
  });
});

describe("MoreHubScreen loading state", () => {
  it("renders static polite Loading status without route cards", () => {
    const { props, container } = renderHub({
      state: "loading",
    });

    const loading = screen.getByTestId("more-hub-loading");

    expect(loading).toHaveAttribute("role", "status");
    expect(loading).toHaveAttribute("aria-live", "polite");
    expect(loading).toHaveTextContent(copy.loadingHeading);
    expect(loading).toHaveTextContent(copy.loadingSupporting);
    expect(queryRouteButton("store")).not.toBeInTheDocument();
    expect(screen.getByTestId("more-hub-toast")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /back/i }),
    ).not.toBeInTheDocument();
    expect(container.querySelector("nav")).toBeNull();
    expectNoCallbacksCalled(props);
  });
});

describe("MoreHubScreen Error and Retry", () => {
  it("renders static alert copy and no Retry when callback is missing", () => {
    const { container } = renderHub({
      onRetryLoad: undefined,
      state: "error",
    });

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent(copy.errorHeading);
    expect(alert).toHaveTextContent(copy.errorSupporting);
    expect(
      screen.queryByRole("button", { name: copy.retry }),
    ).not.toBeInTheDocument();
    expect(queryRouteButton("store")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /back/i }),
    ).not.toBeInTheDocument();
    expect(container.querySelector("nav")).toBeNull();
  });

  it("keeps Retry outside the alert and guards duplicate activation", async () => {
    const pending = createDeferred();
    const retry = vi.fn(() => pending.promise);
    renderHub({
      onRetryLoad: retry,
      state: "error",
    });

    const alert = screen.getByRole("alert");
    const retryButton = screen.getByRole("button", {
      name: copy.retry,
    });

    expect(alert).not.toContainElement(retryButton);

    fireEvent.click(retryButton);

    expect(retry).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", {
        name: copy.retryPending,
      }),
    ).toBeDisabled();

    const pendingButton = screen.getByRole("button", {
      name: copy.retryPending,
    });
    pendingButton.removeAttribute("disabled");
    fireEvent.click(pendingButton);
    expect(retry).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: copy.retry }),
      ).not.toBeDisabled();
    });
  });

  it("turns Retry rejection into the local toast", async () => {
    renderHub({
      onRetryLoad: vi
        .fn()
        .mockRejectedValue(new Error("fail")),
      state: "error",
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: copy.retry }),
      );
    });
    await flushRejectedCallback();

    expect(screen.getByTestId("more-hub-toast")).toHaveTextContent(
      copy.toast,
    );
  });
});

describe("MoreHubScreen offline banner", () => {
  it("renders informational polite copy and keeps cards readable", () => {
    renderHub({
      canOpenStore: false,
      isOffline: true,
      isOrdersAvailableOffline: true,
    });

    const banner = screen.getByTestId(
      "more-hub-offline-banner",
    );

    expect(banner).toHaveAttribute("role", "status");
    expect(banner).toHaveAttribute("aria-live", "polite");
    expect(banner).toHaveTextContent(copy.offline);
    expect(getRouteButtons()).toHaveLength(4);
    expect(getRouteButton("orders")).not.toBeDisabled();
    expect(getRouteButton("store")).toBeDisabled();
  });

  it("does not call callbacks automatically while offline", () => {
    const { props } = renderHub({
      isOffline: true,
      isStoreAvailableOffline: true,
    });

    expectNoCallbacksCalled(props);
  });
});

describe("MoreHubScreen StrictMode behavior", () => {
  it("does not call callbacks during StrictMode mount", () => {
    const { props } = renderStrictHub();

    expectNoCallbacksCalled(props);
  });

  it("keeps duplicate pending guard effective under StrictMode", async () => {
    const pending = createDeferred();
    const callback = vi.fn(() => pending.promise);
    renderStrictHub({
      onOpenProfilesAndOptionalSync: callback,
    });

    fireEvent.click(getRouteButton("profiles"));
    const pendingButton = getRouteButton("profiles");
    pendingButton.removeAttribute("disabled");
    fireEvent.click(pendingButton);

    expect(callback).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
  });

  it("renders one readable toast after StrictMode rejection", async () => {
    renderStrictHub({
      onOpenOrders: vi
        .fn()
        .mockRejectedValue(new Error("fail")),
    });

    await act(async () => {
      fireEvent.click(getRouteButton("orders"));
    });
    await flushRejectedCallback();

    expect(screen.getAllByText(copy.toast)).toHaveLength(1);
  });

  it("does not update state after unmount during pending callback", async () => {
    const pending = createDeferred();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { unmount } = renderStrictHub({
      onOpenStore: vi.fn(() => pending.promise),
    });

    fireEvent.click(getRouteButton("store"));
    unmount();

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("MoreHubScreen visual contract", () => {
  it("uses warm variables, mobile spacing, rounded cards, focus rings, reduced motion, and no bar markup", () => {
    const { container } = renderHub();
    const main = screen.getByTestId("more-hub-main");

    expect(main).toHaveStyle({
      "--dl-surface": "#fffaf7",
      "--dl-peach": "#f2bfae",
      "--dl-blush": "#f8dcd4",
      "--dl-sand": "#e9d2bd",
      "--dl-bark": "#5c4a42",
    });
    expect(main.className).toContain("px-4");
    expect(main.className).not.toContain("fixed");

    for (const button of getRouteButtons()) {
      expect(button.className).toContain("min-h-[72px]");
      expect(button.className).toContain("rounded-[20px]");
      expect(button.className).toContain(
        "focus-visible:outline",
      );
      expect(button.className).toContain(
        "motion-reduce:transition-none",
      );
    }

    expect(container.querySelector("nav")).toBeNull();
  });
});

describe("MoreHubScreen architecture boundaries", () => {
  it("keeps the production component presentation-only", () => {
    const source = readFileSync(
      "components/more-hub-screen.tsx",
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
      "ReturningUserNavigationShell",
      "AccountAndOptionalSyncScreen",
      "app/",
      "components/home-dashboard-screen",
      "analytics",
      "affiliate",
      "marketplace",
      "external seller",
      "sponsored",
    ];

    for (const pattern of forbidden) {
      if (pattern === "history.") {
        expect(
          source.replace(
            "Review your DermaLens order history.",
            "",
          ),
        ).not.toContain(pattern);
        continue;
      }

      expect(source).not.toContain(pattern);
    }

    expect(source).not.toMatch(/<a(?:\s|>)/i);
    expect(source).not.toMatch(/<nav(?:\s|>)/i);
    expect(source).not.toMatch(/\bcamera\b/i);
    expect(source).not.toMatch(/\bpicker\b/i);
    expect(source).not.toMatch(/\bocr\b/i);
    expect(source).not.toMatch(/\banalysis\b/i);
    expect(source).not.toMatch(/\bsage\b/i);
    expect(source).not.toMatch(/\bgreen\b/i);
    expect(source).not.toMatch(/\bblue\b/i);
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("window.clearTimeout");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('role="alert"');
    expect(source).toContain('role="status"');
  });
});
