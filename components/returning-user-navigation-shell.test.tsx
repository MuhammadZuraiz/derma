import { StrictMode, useState } from "react";
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

import ReturningUserNavigationShell, {
  isScanSheetSourceDestination,
  type ReturningUserNavigationShellProps,
  type ScanSheetSourceDestination,
} from "./returning-user-navigation-shell";
import type { AppPrimaryDestination } from "./app-bottom-navigation";

const scanTitle = "Choose a scan";
const facialLabel = "Start facial scan";
const ingredientLabel = "Scan ingredient label";
const cancelLabel = "Cancel";
const recoveryToast =
  "We could not open that scan option. Please try again.";

const sourceDestinations = [
  "home",
  "routine",
  "progress",
  "more",
] as const satisfies readonly ScanSheetSourceDestination[];

function createDeferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<void>(
    (resolvePromise, rejectPromise) => {
      resolve = () => {
        resolvePromise();
      };
      reject = rejectPromise;
    },
  );

  return { promise, reject, resolve };
}

function createCallbacks() {
  return {
    onOpenHome: vi.fn(),
    onOpenRoutine: vi.fn(),
    onOpenProgress: vi.fn(),
    onOpenMore: vi.fn(),
    onStartFacialScan: vi.fn(),
    onOpenIngredientScanner: vi.fn(),
  };
}

function createProps(
  overrides: Partial<ReturningUserNavigationShellProps> = {},
) {
  return {
    activeDestination: "home" as AppPrimaryDestination,
    children: (
      <div data-testid="shell-child">
        <button type="button">Child action</button>
        <p>Eligible returning-user root content</p>
      </div>
    ),
    ...createCallbacks(),
    ...overrides,
  } satisfies ReturningUserNavigationShellProps;
}

function renderShell(
  overrides: Partial<ReturningUserNavigationShellProps> = {},
) {
  const props = createProps(overrides);

  return {
    ...render(<ReturningUserNavigationShell {...props} />),
    props,
  };
}

function renderStrictShell(
  overrides: Partial<ReturningUserNavigationShellProps> = {},
) {
  const props = createProps(overrides);

  return {
    ...render(
      <StrictMode>
        <ReturningUserNavigationShell {...props} />
      </StrictMode>,
    ),
    props,
  };
}

function getPrimaryNav() {
  return screen.getByRole("navigation", {
    hidden: true,
    name: "Primary",
  });
}

function getNavButton(name: string | RegExp) {
  return within(getPrimaryNav()).getByRole("button", {
    hidden: true,
    name,
  });
}

function getNavButtons() {
  return within(getPrimaryNav()).getAllByRole("button", {
    hidden: true,
  });
}

function getDialog() {
  return screen.getByRole("dialog", {
    name: scanTitle,
  });
}

function getBackground() {
  return screen.getByTestId(
    "returning-user-navigation-shell-background",
  );
}

function expectNoCallbacksCalled(
  props: ReturnType<typeof createProps>,
) {
  expect(props.onOpenHome).not.toHaveBeenCalled();
  expect(props.onOpenRoutine).not.toHaveBeenCalled();
  expect(props.onOpenProgress).not.toHaveBeenCalled();
  expect(props.onOpenMore).not.toHaveBeenCalled();
  expect(props.onStartFacialScan).not.toHaveBeenCalled();
  expect(props.onOpenIngredientScanner).not.toHaveBeenCalled();
}

async function openScanSheet() {
  fireEvent.click(getNavButton("Scan"));

  await screen.findByRole("dialog", {
    name: scanTitle,
  });
}

async function closeWithCancel() {
  fireEvent.click(
    screen.getByRole("button", {
      name: cancelLabel,
    }),
  );

  await waitFor(() => {
    expect(
      screen.queryByRole("dialog", {
        name: scanTitle,
      }),
    ).not.toBeInTheDocument();
  });
}

async function flushRejectedCallback() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function RouteUnmountHarness({
  option,
  pending,
}: {
  option: "facial" | "ingredient";
  pending: ReturnType<typeof createDeferred>;
}) {
  const [showShell, setShowShell] = useState(true);

  if (!showShell) {
    return (
      <div data-testid="focused-flow">
        Focused flow
      </div>
    );
  }

  return (
    <ReturningUserNavigationShell
      activeDestination="home"
      onOpenHome={vi.fn()}
      onOpenIngredientScanner={
        option === "ingredient"
          ? () => {
              setShowShell(false);
              return pending.promise;
            }
          : vi.fn()
      }
      onOpenMore={vi.fn()}
      onOpenProgress={vi.fn()}
      onOpenRoutine={vi.fn()}
      onStartFacialScan={
        option === "facial"
          ? () => {
              setShowShell(false);
              return pending.promise;
            }
          : vi.fn()
      }
    >
      <div>Home root</div>
    </ReturningUserNavigationShell>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("ReturningUserNavigationShell runtime source helper", () => {
  it("recognises only supported Scan-sheet source destinations", () => {
    expect(isScanSheetSourceDestination("home")).toBe(true);
    expect(isScanSheetSourceDestination("routine")).toBe(true);
    expect(isScanSheetSourceDestination("progress")).toBe(true);
    expect(isScanSheetSourceDestination("more")).toBe(true);
    expect(isScanSheetSourceDestination("scan")).toBe(false);
    expect(isScanSheetSourceDestination("dashboard")).toBe(false);
    expect(isScanSheetSourceDestination("")).toBe(false);
    expect(isScanSheetSourceDestination(null)).toBe(false);
    expect(isScanSheetSourceDestination({})).toBe(false);
  });
});

describe("ReturningUserNavigationShell core composition", () => {
  it("renders children inside the background wrapper with one primary nav and no closed dialog", () => {
    const { props } = renderShell();
    const background = getBackground();

    expect(background).toContainElement(
      screen.getByTestId("shell-child"),
    );
    expect(
      screen.getAllByRole("navigation", {
        hidden: true,
        name: "Primary",
      }),
    ).toHaveLength(1);
    expect(getNavButtons()).toHaveLength(5);
    expect(
      screen.queryByRole("dialog", {
        name: scanTitle,
      }),
    ).not.toBeInTheDocument();
    expect(background.className).toContain(
      "env(safe-area-inset-bottom)",
    );
    expect(background.className).toContain("8.5rem");
    expectNoCallbacksCalled(props);
  });

  it("does not invoke callbacks or steal focus during mount or rerender", () => {
    render(
      <button type="button">External focus target</button>,
    );
    const external = screen.getByRole("button", {
      name: "External focus target",
    });
    external.focus();
    const props = createProps();
    const { rerender } = render(
      <ReturningUserNavigationShell {...props} />,
    );

    expectNoCallbacksCalled(props);
    expect(external).toHaveFocus();

    rerender(
      <ReturningUserNavigationShell
        {...props}
        activeDestination="progress"
      />,
    );

    expectNoCallbacksCalled(props);
    expect(external).toHaveFocus();
  });
});

describe("ReturningUserNavigationShell root callback pass-through", () => {
  it.each([
    ["Home", "onOpenHome"],
    ["Routine", "onOpenRoutine"],
    ["Progress", "onOpenProgress"],
    ["More", "onOpenMore"],
  ] as const)(
    "passes through the %s root callback without mutating active destination",
    async (label, callbackName) => {
      const { props } = renderShell();

      fireEvent.click(getNavButton(label));

      expect(props[callbackName]).toHaveBeenCalledTimes(1);
      for (const otherCallback of [
        "onOpenHome",
        "onOpenRoutine",
        "onOpenProgress",
        "onOpenMore",
      ] as const) {
        if (otherCallback !== callbackName) {
          expect(props[otherCallback]).not.toHaveBeenCalled();
        }
      }

      await waitFor(() => {
        expect(getNavButton("Home")).toHaveAttribute(
          "aria-current",
          "page",
        );
      });
    },
  );
});

describe("ReturningUserNavigationShell Scan opening", () => {
  it("opens one sheet only after explicit centre Scan activation", async () => {
    const { props } = renderShell();

    await openScanSheet();

    expect(
      screen.getAllByRole("dialog", {
        name: scanTitle,
      }),
    ).toHaveLength(1);
    expect(props.onStartFacialScan).not.toHaveBeenCalled();
    expect(props.onOpenIngredientScanner).not.toHaveBeenCalled();
    expect(props.onOpenHome).not.toHaveBeenCalled();
    expect(props.onOpenRoutine).not.toHaveBeenCalled();
    expect(props.onOpenProgress).not.toHaveBeenCalled();
    expect(props.onOpenMore).not.toHaveBeenCalled();
    expect(getNavButton("Scan")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      within(getDialog()).getAllByRole("button"),
    ).toHaveLength(3);
    expect(
      screen.getByRole("button", {
        name: facialLabel,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: ingredientLabel,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: cancelLabel,
      }),
    ).toBeVisible();
  });

  it("rejects repeated forced Scan activation before rerender without duplicating sheets", async () => {
    renderShell();
    const scan = getNavButton("Scan");

    fireEvent.click(scan);
    scan.removeAttribute("disabled");
    fireEvent.click(scan);

    await screen.findByRole("dialog", {
      name: scanTitle,
    });

    expect(
      screen.getAllByRole("dialog", {
        name: scanTitle,
      }),
    ).toHaveLength(1);
  });

  it("keeps Scan visible but blocked for invalid runtime active destination", () => {
    renderShell({
      activeDestination:
        "dashboard" as AppPrimaryDestination,
    });

    const scan = getNavButton("Scan unavailable");

    expect(scan).toBeDisabled();
    scan.removeAttribute("disabled");
    fireEvent.click(scan);
    expect(
      screen.queryByRole("dialog", {
        name: scanTitle,
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps Scan visible but blocked when the host withholds Scan availability", () => {
    renderShell({
      canOpenScan: false,
    });

    const scan = getNavButton("Scan unavailable");

    expect(scan).toBeDisabled();
    scan.removeAttribute("disabled");
    fireEvent.click(scan);
    expect(
      screen.queryByRole("dialog", {
        name: scanTitle,
      }),
    ).not.toBeInTheDocument();
  });
});

describe("ReturningUserNavigationShell modal isolation", () => {
  it("isolates background content while keeping the sheet outside the inert wrapper", async () => {
    renderShell();

    await openScanSheet();

    const background = getBackground();
    const dialog = getDialog();

    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveAttribute("inert");
    expect(background).not.toContainElement(dialog);
    expect(dialog).not.toHaveAttribute("aria-hidden");
    expect(dialog).not.toHaveAttribute("inert");

    await closeWithCancel();

    expect(background).not.toHaveAttribute("aria-hidden");
    expect(background).not.toHaveAttribute("inert");
  });
});

describe("ReturningUserNavigationShell dismissal and focus restoration", () => {
  it("closes with idle Cancel and restores focus to the Scan trigger", async () => {
    const { props } = renderShell();

    await openScanSheet();
    await closeWithCancel();

    await waitFor(() => {
      expect(getNavButton("Scan")).toHaveFocus();
    });
    expect(getNavButton("Scan")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expectNoCallbacksCalled(props);
  });

  it("closes with idle Escape and restores focus to the Scan trigger", async () => {
    const { props } = renderShell();

    await openScanSheet();
    fireEvent.keyDown(getDialog(), { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", {
          name: scanTitle,
        }),
      ).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(getNavButton("Scan")).toHaveFocus();
    });
    expect(getBackground()).not.toHaveAttribute("inert");
    expectNoCallbacksCalled(props);
  });

  it("does not focus a disabled Scan trigger after dismissal", async () => {
    const props = createProps();
    const { rerender } = render(
      <ReturningUserNavigationShell {...props} />,
    );

    await openScanSheet();

    rerender(
      <ReturningUserNavigationShell
        {...props}
        canOpenScan={false}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: cancelLabel,
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", {
          name: scanTitle,
        }),
      ).not.toBeInTheDocument();
    });

    const scan = getNavButton("Scan unavailable");
    expect(scan).toBeDisabled();
    expect(scan).not.toHaveFocus();
  });
});

describe("ReturningUserNavigationShell sheet success routing", () => {
  it.each(sourceDestinations)(
    "passes frozen %s source to facial scan and closes on success",
    async (source) => {
      const { props } = renderShell({
        activeDestination: source,
      });

      await openScanSheet();
      fireEvent.click(
        screen.getByRole("button", {
          name: facialLabel,
        }),
      );

      expect(props.onStartFacialScan).toHaveBeenCalledWith(
        source,
      );
      expect(
        props.onOpenIngredientScanner,
      ).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", {
            name: scanTitle,
          }),
        ).not.toBeInTheDocument();
      });
      expect(getBackground()).not.toHaveAttribute("inert");
      expect(getNavButton("Scan")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await waitFor(() => {
        expect(getNavButton("Scan")).toHaveFocus();
      });
    },
  );

  it.each(sourceDestinations)(
    "passes frozen %s source to ingredient scanner and closes on success",
    async (source) => {
      const { props } = renderShell({
        activeDestination: source,
      });

      await openScanSheet();
      fireEvent.click(
        screen.getByRole("button", {
          name: ingredientLabel,
        }),
      );

      expect(
        props.onOpenIngredientScanner,
      ).toHaveBeenCalledWith(source);
      expect(props.onStartFacialScan).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", {
            name: scanTitle,
          }),
        ).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(getNavButton("Scan")).toHaveFocus();
      });
    },
  );

  it("preserves the frozen source when active destination refreshes while the sheet is open", async () => {
    const props = createProps({
      activeDestination: "home",
    });
    const { rerender } = render(
      <ReturningUserNavigationShell {...props} />,
    );

    await openScanSheet();

    rerender(
      <ReturningUserNavigationShell
        {...props}
        activeDestination="progress"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: facialLabel,
      }),
    );

    expect(props.onStartFacialScan).toHaveBeenCalledWith(
      "home",
    );
  });
});

describe("ReturningUserNavigationShell sheet rejection behavior", () => {
  it.each([
    [
      facialLabel,
      "onStartFacialScan",
    ],
    [
      ingredientLabel,
      "onOpenIngredientScanner",
    ],
  ] as const)(
    "lets %s rejection remain sheet-owned",
    async (label, callbackName) => {
      const callback = vi
        .fn()
        .mockRejectedValue(new Error("fail"));
      renderShell({
        [callbackName]: callback,
      });

      await openScanSheet();
      fireEvent.click(
        screen.getByRole("button", {
          name: label,
        }),
      );
      await flushRejectedCallback();

      expect(getDialog()).toBeInTheDocument();
      expect(getNavButton("Scan")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(screen.getAllByText(recoveryToast)).toHaveLength(
        1,
      );
      expect(getBackground()).toHaveAttribute("inert");
      expect(getBackground()).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    },
  );
});

describe("ReturningUserNavigationShell sheet availability", () => {
  it("keeps facial scan blocked while ingredient scanner stays enabled", async () => {
    renderShell({
      canStartFacialScan: false,
    });

    await openScanSheet();

    expect(
      screen.getByRole("button", {
        name: "Facial scan unavailable",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: ingredientLabel,
      }),
    ).not.toBeDisabled();
  });

  it("keeps ingredient scanner blocked while facial scan stays enabled", async () => {
    renderShell({
      canOpenIngredientScanner: false,
    });

    await openScanSheet();

    expect(
      screen.getByRole("button", {
        name: "Ingredient scanner unavailable",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: facialLabel,
      }),
    ).not.toBeDisabled();
  });

  it("fails closed visibly when sheet callbacks are missing", async () => {
    renderShell({
      onOpenIngredientScanner: undefined,
      onStartFacialScan: undefined,
    });

    await openScanSheet();

    expect(
      screen.getByRole("button", {
        name: "Facial scan unavailable",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Ingredient scanner unavailable",
      }),
    ).toBeDisabled();
  });
});

describe("ReturningUserNavigationShell root navigation while sheet is open", () => {
  it("keeps bottom navigation rendered inside the inert background without invoking root callbacks", async () => {
    const { props } = renderShell();

    await openScanSheet();

    expect(getBackground()).toContainElement(getPrimaryNav());
    expect(getBackground()).toHaveAttribute("inert");
    expect(props.onOpenHome).not.toHaveBeenCalled();
    expect(props.onOpenRoutine).not.toHaveBeenCalled();
    expect(props.onOpenProgress).not.toHaveBeenCalled();
    expect(props.onOpenMore).not.toHaveBeenCalled();
  });
});

describe("ReturningUserNavigationShell StrictMode behavior", () => {
  it("does not call callbacks during StrictMode mount", () => {
    const { props } = renderStrictShell();

    expectNoCallbacksCalled(props);
  });

  it("opens one sheet after explicit Scan activation and restores focus after Cancel", async () => {
    renderStrictShell();

    await openScanSheet();

    expect(
      screen.getAllByRole("dialog", {
        name: scanTitle,
      }),
    ).toHaveLength(1);

    await closeWithCancel();

    await waitFor(() => {
      expect(getNavButton("Scan")).toHaveFocus();
    });
  });

  it("renders one readable sheet-local toast for rejected sheet callback", async () => {
    renderStrictShell({
      onOpenIngredientScanner: vi
        .fn()
        .mockRejectedValue(new Error("fail")),
    });

    await openScanSheet();
    fireEvent.click(
      screen.getByRole("button", {
        name: ingredientLabel,
      }),
    );
    await flushRejectedCallback();

    expect(screen.getAllByText(recoveryToast)).toHaveLength(
      1,
    );
    expect(getDialog()).toBeInTheDocument();
  });

  it("does not trigger state-update warnings after unmount during a pending sheet callback", async () => {
    const pending = createDeferred();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { unmount } = renderStrictShell({
      onStartFacialScan: vi.fn(() => pending.promise),
    });

    await openScanSheet();
    fireEvent.click(
      screen.getByRole("button", {
        name: facialLabel,
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

describe("ReturningUserNavigationShell route-transition unmount behavior", () => {
  it.each([
    ["facial", facialLabel],
    ["ingredient", ingredientLabel],
  ] as const)(
    "does not update state or restore focus after %s callback unmounts the shell",
    async (option, label) => {
      const pending = createDeferred();
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <RouteUnmountHarness
          option={option}
          pending={pending}
        />,
      );

      await openScanSheet();
      fireEvent.click(
        screen.getByRole("button", {
          name: label,
        }),
      );

      expect(
        await screen.findByTestId("focused-flow"),
      ).toHaveTextContent("Focused flow");
      expect(
        screen.queryByTestId("app-bottom-navigation-root"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", {
          hidden: true,
          name: "Primary",
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("dialog", {
          name: scanTitle,
        }),
      ).not.toBeInTheDocument();

      const focusSpy = vi.spyOn(
        HTMLElement.prototype,
        "focus",
      );

      await act(async () => {
        pending.resolve();
        await pending.promise;
      });

      expect(screen.getByTestId("focused-flow")).toHaveTextContent(
        "Focused flow",
      );
      expect(
        screen.queryByTestId("app-bottom-navigation-root"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("dialog", {
          name: scanTitle,
        }),
      ).not.toBeInTheDocument();
      expect(focusSpy).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    },
  );
});

describe("ReturningUserNavigationShell visual and layout contract", () => {
  it("keeps shell layout spacing, one fixed navigation, and sheet outside the background wrapper", async () => {
    renderShell();

    const root = screen.getByTestId(
      "returning-user-navigation-shell-root",
    );
    const background = getBackground();

    expect(root).toBeVisible();
    expect(background.className).toContain(
      "env(safe-area-inset-bottom)",
    );
    expect(background.className).toContain("8.5rem");
    expect(
      screen.getByTestId("app-bottom-navigation-root").className,
    ).toContain("fixed");
    expect(
      screen.getAllByRole("navigation", {
        hidden: true,
        name: "Primary",
      }),
    ).toHaveLength(1);

    await openScanSheet();

    expect(background).not.toContainElement(getDialog());
    expect(
      screen.getAllByRole("navigation", {
        hidden: true,
        name: "Primary",
      }),
    ).toHaveLength(1);
  });
});

describe("ReturningUserNavigationShell architecture boundaries", () => {
  it("keeps the standalone shell presentation-only", () => {
    const source = readFileSync(
      "components/returning-user-navigation-shell.tsx",
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
      "querySelector",
      "getElementById",
      "document.activeElement",
      "setTimeout",
      "setInterval",
      "MoreHubScreen",
      "HomeDashboardScreen",
      "RoutineRecommendationsScreen",
      "ProgressTrackingScreen",
      "app/",
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
    expect(source).not.toMatch(/\bsage\b/i);
    expect(source).not.toMatch(/\bgreen\b/i);
    expect(source).not.toMatch(/\bblue\b/i);
    expect(source).toContain("aria-hidden");
    expect(source).toContain("inert");
    expect(source).toContain("mountedRef");
    expect(source).toContain(
      "scanSheetOpenRef.current = false",
    );
    expect(source).toContain("scanTriggerRef");
    expect(source).toContain(".focus()");
    expect(source).toContain("AppBottomNavigation");
    expect(source).toContain("ScanActionsSheet");
    expect(source).toContain(
      "env(safe-area-inset-bottom)",
    );
  });
});
