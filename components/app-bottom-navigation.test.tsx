import {
  createRef,
  StrictMode,
} from "react";
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
import { readFileSync } from "node:fs";

import AppBottomNavigation, {
  isAppPrimaryDestination,
  type AppBottomNavigationProps,
  type AppPrimaryDestination,
} from "./app-bottom-navigation";

const labels = [
  "Home",
  "Routine",
  "Scan",
  "Progress",
  "More",
] as const;

const blockedLabels = {
  home: "Home unavailable",
  routine: "Routine unavailable",
  scan: "Scan unavailable",
  progress: "Progress unavailable",
  more: "More unavailable",
} as const;

const pendingLabels = {
  home: "Opening Home...",
  routine: "Opening Routine...",
  scan: "Opening Scan...",
  progress: "Opening Progress...",
  more: "Opening More...",
} as const;

const recoveryToast =
  "We could not open that destination. Please try again.";

type CallbackName =
  | "onOpenHome"
  | "onOpenRoutine"
  | "onOpenScan"
  | "onOpenProgress"
  | "onOpenMore";

type FlagName =
  | "canOpenHome"
  | "canOpenRoutine"
  | "canOpenScan"
  | "canOpenProgress"
  | "canOpenMore";

type Operation = keyof typeof blockedLabels;

const operationConfig: Array<{
  blockedLabel: string;
  callbackName: CallbackName;
  flagName: FlagName;
  label: string;
  operation: Operation;
  pendingLabel: string;
}> = [
  {
    operation: "home",
    label: "Home",
    blockedLabel: blockedLabels.home,
    pendingLabel: pendingLabels.home,
    callbackName: "onOpenHome",
    flagName: "canOpenHome",
  },
  {
    operation: "routine",
    label: "Routine",
    blockedLabel: blockedLabels.routine,
    pendingLabel: pendingLabels.routine,
    callbackName: "onOpenRoutine",
    flagName: "canOpenRoutine",
  },
  {
    operation: "scan",
    label: "Scan",
    blockedLabel: blockedLabels.scan,
    pendingLabel: pendingLabels.scan,
    callbackName: "onOpenScan",
    flagName: "canOpenScan",
  },
  {
    operation: "progress",
    label: "Progress",
    blockedLabel: blockedLabels.progress,
    pendingLabel: pendingLabels.progress,
    callbackName: "onOpenProgress",
    flagName: "canOpenProgress",
  },
  {
    operation: "more",
    label: "More",
    blockedLabel: blockedLabels.more,
    pendingLabel: pendingLabels.more,
    callbackName: "onOpenMore",
    flagName: "canOpenMore",
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
    onOpenHome: vi.fn(),
    onOpenRoutine: vi.fn(),
    onOpenScan: vi.fn(),
    onOpenProgress: vi.fn(),
    onOpenMore: vi.fn(),
  };
}

function createProps(
  overrides: Partial<AppBottomNavigationProps> = {},
) {
  return {
    activeDestination: "home" as AppPrimaryDestination,
    ...createCallbacks(),
    ...overrides,
  };
}

function renderNavigation(
  overrides: Partial<AppBottomNavigationProps> = {},
) {
  const props = createProps(overrides);

  return {
    ...render(<AppBottomNavigation {...props} />),
    props,
  };
}

function renderStrictNavigation(
  overrides: Partial<AppBottomNavigationProps> = {},
) {
  const props = createProps(overrides);

  return {
    ...render(
      <StrictMode>
        <AppBottomNavigation {...props} />
      </StrictMode>,
    ),
    props,
  };
}

function getPrimaryNav() {
  return screen.getByRole("navigation", {
    name: "Primary",
  });
}

function getAllNavigationButtons() {
  return within(getPrimaryNav()).getAllByRole("button");
}

function getButton(name: string | RegExp) {
  return screen.getByRole("button", { name });
}

function expectNoCallbackCalled(
  props: ReturnType<typeof createProps>,
) {
  for (const callbackName of [
    "onOpenHome",
    "onOpenRoutine",
    "onOpenScan",
    "onOpenProgress",
    "onOpenMore",
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

describe("AppBottomNavigation runtime helper", () => {
  it("recognises supported primary destinations only", () => {
    expect(isAppPrimaryDestination("home")).toBe(true);
    expect(isAppPrimaryDestination("routine")).toBe(true);
    expect(isAppPrimaryDestination("progress")).toBe(true);
    expect(isAppPrimaryDestination("more")).toBe(true);
    expect(isAppPrimaryDestination("scan")).toBe(false);
    expect(isAppPrimaryDestination("dashboard")).toBe(false);
    expect(isAppPrimaryDestination(null)).toBe(false);
  });

  it("renders no current page for an invalid runtime active destination", () => {
    renderNavigation({
      activeDestination:
        "unexpected" as AppPrimaryDestination,
    });

    expect(
      getAllNavigationButtons().filter(
        (button) =>
          button.getAttribute("aria-current") === "page",
      ),
    ).toHaveLength(0);
  });
});

describe("AppBottomNavigation core rendering", () => {
  it("renders one semantic primary nav with exactly five visible buttons", () => {
    const { container } = renderNavigation();
    const nav = getPrimaryNav();

    expect(nav).toBeVisible();
    expect(
      container.querySelectorAll('nav[aria-label="Primary"]'),
    ).toHaveLength(1);
    expect(within(nav).getAllByRole("button")).toHaveLength(
      5,
    );

    for (const label of labels) {
      expect(getButton(label)).toBeVisible();
    }
  });

  it("does not invoke callbacks during mount or rerender", () => {
    const props = createProps();
    const { rerender } = render(
      <AppBottomNavigation {...props} />,
    );

    expectNoCallbackCalled(props);

    rerender(
      <AppBottomNavigation
        {...props}
        activeDestination="progress"
      />,
    );

    expectNoCallbackCalled(props);
  });

  it("keeps inline icons decorative and renders no anchors", () => {
    const { container } = renderNavigation();

    for (const icon of container.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }

    expect(container.querySelector("a")).toBeNull();
  });

  it("does not duplicate navigation markup", () => {
    const { container } = renderNavigation();

    expect(container.querySelectorAll("nav")).toHaveLength(1);
    expect(getAllNavigationButtons()).toHaveLength(5);
  });
});

describe("AppBottomNavigation current destination", () => {
  it.each([
    ["home", "Home"],
    ["routine", "Routine"],
    ["progress", "Progress"],
    ["more", "More"],
  ] as const)(
    "marks %s as the only current page",
    (destination, label) => {
      renderNavigation({
        activeDestination: destination,
      });

      const currentButtons = getAllNavigationButtons().filter(
        (button) =>
          button.getAttribute("aria-current") === "page",
      );

      expect(currentButtons).toHaveLength(1);
      expect(currentButtons[0]).toBe(
        getButton(label),
      );
    },
  );

  it("never marks Scan as the current page", () => {
    renderNavigation({
      activeDestination: "home",
    });

    expect(getButton("Scan")).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("AppBottomNavigation Scan semantics", () => {
  it("exposes dialog popup state on Scan", () => {
    const { rerender, props } = renderNavigation();
    const scan = getButton("Scan");

    expect(scan).toHaveAttribute("aria-haspopup", "dialog");
    expect(scan).toHaveAttribute("aria-expanded", "false");

    rerender(
      <AppBottomNavigation
        {...props}
        isScanSheetOpen={true}
      />,
    );

    expect(getButton("Scan")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("invokes only the Scan callback when Scan is clicked", () => {
    const { props } = renderNavigation();

    fireEvent.click(getButton("Scan"));

    expect(props.onOpenScan).toHaveBeenCalledTimes(1);
    expect(props.onOpenHome).not.toHaveBeenCalled();
    expect(props.onOpenRoutine).not.toHaveBeenCalled();
    expect(props.onOpenProgress).not.toHaveBeenCalled();
    expect(props.onOpenMore).not.toHaveBeenCalled();
  });
});

describe("AppBottomNavigation Scan trigger ref bridge", () => {
  it("passes an object ref only to the visible Scan trigger", () => {
    const scanTriggerRef = createRef<HTMLButtonElement>();

    renderNavigation({
      scanTriggerRef,
    });

    const scan = getButton("Scan");

    expect(scanTriggerRef.current).toBe(scan);
    expect(scanTriggerRef.current).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
    expect(scanTriggerRef.current).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(scanTriggerRef.current).not.toBe(getButton("Home"));
    expect(scanTriggerRef.current).not.toBe(
      getButton("Routine"),
    );
    expect(scanTriggerRef.current).not.toBe(
      getButton("Progress"),
    );
    expect(scanTriggerRef.current).not.toBe(getButton("More"));
  });

  it("keeps the Scan trigger ref stable across popup-state refresh", () => {
    const scanTriggerRef = createRef<HTMLButtonElement>();
    const { props, rerender } = renderNavigation({
      scanTriggerRef,
    });
    const scan = getButton("Scan");

    expect(scanTriggerRef.current).toBe(scan);

    rerender(
      <AppBottomNavigation
        {...props}
        isScanSheetOpen={true}
        scanTriggerRef={scanTriggerRef}
      />,
    );

    expect(scanTriggerRef.current).toBe(scan);
    expect(scanTriggerRef.current).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("supports a callback ref for the Scan trigger", () => {
    const scanTriggerRef = vi.fn();

    renderNavigation({
      scanTriggerRef,
    });

    expect(scanTriggerRef).toHaveBeenCalledWith(
      getButton("Scan"),
    );
  });

  it("exposes the disabled Scan trigger through the ref", () => {
    const scanTriggerRef = createRef<HTMLButtonElement>();

    renderNavigation({
      canOpenScan: false,
      scanTriggerRef,
    });

    const scan = getButton(blockedLabels.scan);

    expect(scan).toBeDisabled();
    expect(scanTriggerRef.current).toBe(scan);
  });

  it("does not move focus when the Scan trigger ref mounts or refreshes", () => {
    const externalButton = document.createElement("button");
    externalButton.textContent = "External focus target";
    document.body.appendChild(externalButton);

    try {
      externalButton.focus();
      const scanTriggerRef = createRef<HTMLButtonElement>();
      const { props, rerender } = renderNavigation({
        scanTriggerRef,
      });

      expect(externalButton).toHaveFocus();

      rerender(
        <AppBottomNavigation
          {...props}
          isScanSheetOpen={true}
          scanTriggerRef={scanTriggerRef}
        />,
      );

      expect(externalButton).toHaveFocus();
    } finally {
      externalButton.remove();
    }
  });

  it("keeps Scan callback behavior unchanged when the ref prop is supplied", () => {
    const scanTriggerRef = createRef<HTMLButtonElement>();
    const { props } = renderNavigation({
      scanTriggerRef,
    });
    const scan = getButton("Scan");

    fireEvent.click(scan);

    expect(props.onOpenScan).toHaveBeenCalledTimes(1);
    expect(props.onOpenHome).not.toHaveBeenCalled();
    expect(props.onOpenRoutine).not.toHaveBeenCalled();
    expect(props.onOpenProgress).not.toHaveBeenCalled();
    expect(props.onOpenMore).not.toHaveBeenCalled();
    expect(scanTriggerRef.current).toBe(scan);
  });
});

describe("AppBottomNavigation explicit callbacks", () => {
  it.each(operationConfig)(
    "invokes only the matching callback for $label",
    ({ callbackName, label }) => {
      const { props } = renderNavigation();

      fireEvent.click(getButton(label));

      expect(props[callbackName]).toHaveBeenCalledTimes(1);

      for (const config of operationConfig) {
        if (config.callbackName !== callbackName) {
          expect(props[config.callbackName]).not.toHaveBeenCalled();
        }
      }
    },
  );
});

describe("AppBottomNavigation missing callbacks", () => {
  it.each(operationConfig)(
    "fails closed when $label callback is missing",
    ({ blockedLabel, callbackName }) => {
      const { props } = renderNavigation({
        [callbackName]: undefined,
      });

      const button = getButton(blockedLabel);

      expect(button).toBeDisabled();

      button.removeAttribute("disabled");
      fireEvent.click(button);

      expectNoCallbackCalled(props);
    },
  );
});

describe("AppBottomNavigation host blocks", () => {
  it.each(operationConfig)(
    "keeps $label visible and blocked when host flag is false",
    ({ blockedLabel, callbackName, flagName }) => {
      const { props } = renderNavigation({
        [flagName]: false,
      });

      const button = getButton(blockedLabel);

      expect(button).toBeDisabled();

      button.removeAttribute("disabled");
      fireEvent.click(button);

      expect(props[callbackName]).not.toHaveBeenCalled();
    },
  );
});

describe("AppBottomNavigation pending operation", () => {
  it.each([
    {
      callbackName: "onOpenRoutine" as const,
      label: "Routine",
      pendingLabel: pendingLabels.routine,
    },
    {
      callbackName: "onOpenScan" as const,
      label: "Scan",
      pendingLabel: pendingLabels.scan,
    },
  ])(
    "guards duplicate and conflicting activation for $label",
    async ({ callbackName, label, pendingLabel }) => {
      const pending = createDeferred();
      const callback = vi.fn(() => pending.promise);
      const homeCallback = vi.fn();
      renderNavigation({
        [callbackName]: callback,
        onOpenHome: homeCallback,
      });

      fireEvent.click(getButton(label));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(getButton(pendingLabel)).toBeDisabled();

      for (const button of getAllNavigationButtons()) {
        expect(button).toBeDisabled();
      }

      const pendingButton = getButton(pendingLabel);
      pendingButton.removeAttribute("disabled");
      fireEvent.click(pendingButton);
      expect(callback).toHaveBeenCalledTimes(1);

      const homeButton = getButton("Home");
      homeButton.removeAttribute("disabled");
      fireEvent.click(homeButton);
      expect(homeCallback).not.toHaveBeenCalled();

      await act(async () => {
        pending.resolve();
        await pending.promise;
      });

      await waitFor(() => {
        expect(getButton(label)).not.toBeDisabled();
      });

      expect(getButton("Home")).toHaveAttribute(
        "aria-current",
        "page",
      );
    },
  );
});

describe("AppBottomNavigation rejection recovery", () => {
  it.each([
    {
      callbackName: "onOpenRoutine" as const,
      label: "Routine",
    },
    {
      callbackName: "onOpenScan" as const,
      label: "Scan",
    },
  ])(
    "shows a polite local recovery toast for $label rejection",
    async ({ callbackName, label }) => {
      vi.useFakeTimers();
      const callback = vi
        .fn()
        .mockRejectedValue(new Error("no"));
      renderNavigation({
        [callbackName]: callback,
      });

      const button = getButton(label);
      button.focus();
      await act(async () => {
        fireEvent.click(button);
      });
      await flushRejectedCallback();

      expect(
        screen.getByTestId("app-bottom-navigation-toast"),
      ).toHaveTextContent(recoveryToast);

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "polite");
      expect(toast).toHaveTextContent(recoveryToast);
      expect(button).not.toBeDisabled();
      expect(document.activeElement).toBe(button);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(
        screen.getByTestId("app-bottom-navigation-toast"),
      ).toHaveTextContent("");
    },
  );

  it("cleans up the toast timer on unmount", async () => {
    vi.useFakeTimers();
    const { unmount } = renderNavigation({
      onOpenHome: vi
        .fn()
        .mockRejectedValue(new Error("no")),
    });

    await act(async () => {
      fireEvent.click(getButton("Home"));
    });
    await flushRejectedCallback();

    expect(screen.getByRole("status")).toHaveTextContent(
      recoveryToast,
    );

    unmount();

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });

  it("restarts the dismissal window when an identical recovery toast replaces an existing toast", async () => {
    vi.useFakeTimers();
    const callback = vi.fn(() => {
      throw new Error("fail");
    });

    renderNavigation({
      onOpenHome: callback,
    });

    await act(async () => {
      fireEvent.click(getButton("Home"));
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      recoveryToast,
    );

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    await act(async () => {
      fireEvent.click(getButton("Home"));
    });

    expect(callback).toHaveBeenCalledTimes(2);

    expect(screen.getByRole("status")).toHaveTextContent(
      recoveryToast,
    );

    expect(screen.getAllByText(recoveryToast)).toHaveLength(
      1,
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      recoveryToast,
    );

    act(() => {
      vi.advanceTimersByTime(4400);
    });

    expect(
      screen.getByTestId("app-bottom-navigation-toast"),
    ).toHaveTextContent("");
  });
});

describe("AppBottomNavigation StrictMode behavior", () => {
  it("does not call callbacks during StrictMode mount", () => {
    const { props } = renderStrictNavigation();

    expectNoCallbackCalled(props);
  });

  it("keeps pending duplicate guard effective under StrictMode", async () => {
    const pending = createDeferred();
    const callback = vi.fn(() => pending.promise);
    renderStrictNavigation({
      onOpenRoutine: callback,
    });

    fireEvent.click(getButton("Routine"));
    const pendingButton = getButton(pendingLabels.routine);
    pendingButton.removeAttribute("disabled");
    fireEvent.click(pendingButton);

    expect(callback).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
  });

  it("renders one readable toast for a rejected StrictMode callback", async () => {
    renderStrictNavigation({
      onOpenMore: vi
        .fn()
        .mockRejectedValue(new Error("no")),
    });

    await act(async () => {
      fireEvent.click(getButton("More"));
    });
    await flushRejectedCallback();

    expect(screen.getAllByText(recoveryToast)).toHaveLength(
      1,
    );
  });

  it("does not update state after unmount during a pending callback", async () => {
    const pending = createDeferred();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { unmount } = renderStrictNavigation({
      onOpenProgress: vi.fn(() => pending.promise),
    });

    fireEvent.click(getButton("Progress"));
    unmount();

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("AppBottomNavigation visual contract", () => {
  it("includes fixed bottom positioning, width constraint, focus rings, reduced-motion, and safe-area treatment", () => {
    renderNavigation();

    const root = screen.getByTestId(
      "app-bottom-navigation-root",
    );
    const surface = screen.getByTestId(
      "app-bottom-navigation-surface",
    );

    expect(root.className).toContain("fixed");
    expect(root.className).toContain("bottom-0");
    expect(root.className).toContain(
      "env(safe-area-inset-bottom)",
    );
    expect(surface.className).toContain("mx-auto");
    expect(surface.className).toContain("max-w-[560px]");
    expect(surface.className).toContain("rounded-[24px]");

    for (const button of getAllNavigationButtons()) {
      expect(button.className).toContain("min-h-[56px]");
      expect(button.className).toContain(
        "focus-visible:outline",
      );
      expect(button.className).toContain(
        "motion-reduce:transition-none",
      );
    }

    expect(getButton("Scan").className).toContain(
      "min-h-[64px]",
    );
  });
});

describe("AppBottomNavigation architecture boundaries", () => {
  it("keeps the production component presentation-only", () => {
    const source = readFileSync(
      "components/app-bottom-navigation.tsx",
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
      "<a",
      "querySelector",
      "getElementById",
      "document.activeElement",
      ".focus(",
      "ScanActionsSheet",
      "ReturningUserNavigationShell",
      "MoreHubScreen",
      "app/",
      "components/home-dashboard-screen",
      "analytics",
      "affiliate",
      "marketplace",
      "external seller",
      "sponsored",
    ];

    for (const pattern of forbidden) {
      expect(source).not.toContain(pattern);
    }

    expect(source).not.toMatch(/\bsage\b/i);
    expect(source).not.toMatch(/\bgreen\b/i);
    expect(source).not.toMatch(/\bblue\b/i);
    expect(source).not.toMatch(/<a(?:\s|>)/i);
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("window.clearTimeout");
    expect(source).toContain("aria-expanded");
    expect(source).toContain("aria-current");
  });
});
