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
import { readFileSync } from "node:fs";

import ScanActionsSheet, {
  type ScanActionsSheetProps,
} from "./scan-actions-sheet";

const copy = {
  title: "Choose a scan",
  supporting:
    "Start a facial scan or scan an ingredient label.",
  facialLabel: "Start facial scan",
  ingredientLabel: "Scan ingredient label",
  cancel: "Cancel",
  facialBlocked: "Facial scan unavailable",
  ingredientBlocked: "Ingredient scanner unavailable",
  facialPending: "Opening facial scan...",
  ingredientPending: "Opening ingredient scanner...",
};

const recoveryToast =
  "We could not open that scan option. Please try again.";

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
    onClose: vi.fn(),
    onStartFacialScan: vi.fn(),
    onOpenIngredientScanner: vi.fn(),
  };
}

function createProps(
  overrides: Partial<ScanActionsSheetProps> = {},
) {
  return {
    isOpen: true,
    ...createCallbacks(),
    ...overrides,
  } satisfies ScanActionsSheetProps;
}

function renderSheet(
  overrides: Partial<ScanActionsSheetProps> = {},
) {
  const props = createProps(overrides);

  return {
    ...render(<ScanActionsSheet {...props} />),
    props,
  };
}

function renderStrictSheet(
  overrides: Partial<ScanActionsSheetProps> = {},
) {
  const props = createProps(overrides);

  return {
    ...render(
      <StrictMode>
        <ScanActionsSheet {...props} />
      </StrictMode>,
    ),
    props,
  };
}

function getDialog() {
  return screen.getByRole("dialog", {
    name: copy.title,
  });
}

function getButton(name: string | RegExp) {
  return screen.getByRole("button", { name });
}

function getSheetButtons() {
  return within(getDialog()).getAllByRole("button");
}

function expectNoCallbackCalled(
  props: ReturnType<typeof createProps>,
) {
  expect(props.onClose).not.toHaveBeenCalled();
  if (typeof props.onStartFacialScan === "function") {
    expect(props.onStartFacialScan).not.toHaveBeenCalled();
  }
  if (
    typeof props.onOpenIngredientScanner === "function"
  ) {
    expect(
      props.onOpenIngredientScanner,
    ).not.toHaveBeenCalled();
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

describe("ScanActionsSheet closed state", () => {
  it("renders no dialog or overlay when closed", () => {
    const { container } = renderSheet({
      isOpen: false,
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("scan-actions-sheet-overlay"),
    ).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("fails closed for malformed runtime open values", () => {
    renderSheet({
      isOpen: "yes" as unknown as boolean,
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not call callbacks during closed mount or rerender", () => {
    const props = createProps({
      isOpen: false,
    });
    const { rerender } = render(
      <ScanActionsSheet {...props} />,
    );

    expectNoCallbackCalled(props);

    rerender(<ScanActionsSheet {...props} />);

    expectNoCallbackCalled(props);
  });

  it("does not move focus while closed", () => {
    render(
      <button type="button">Outside trigger</button>,
    );
    const trigger = screen.getByRole("button", {
      name: "Outside trigger",
    });
    trigger.focus();

    renderSheet({
      isOpen: false,
    });

    expect(document.activeElement).toBe(trigger);
  });
});

describe("ScanActionsSheet core open rendering", () => {
  it("renders one accessible modal dialog with associated supporting copy", () => {
    const { container } = renderSheet();
    const dialog = getDialog();

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      "scan-actions-sheet-title",
    );
    expect(dialog).toHaveAttribute(
      "aria-describedby",
      "scan-actions-sheet-supporting",
    );
    expect(dialog).toHaveAttribute("tabindex", "-1");
    expect(
      screen.getByText(copy.supporting),
    ).toHaveAttribute(
      "id",
      "scan-actions-sheet-supporting",
    );
    expect(container.querySelectorAll('[role="dialog"]')).toHaveLength(
      1,
    );
  });

  it("renders the visible heading and exactly three sheet buttons", () => {
    renderSheet();

    expect(
      screen.getByRole("heading", {
        name: copy.title,
      }),
    ).toBeVisible();
    expect(getButton(copy.facialLabel)).toBeVisible();
    expect(getButton(copy.ingredientLabel)).toBeVisible();
    expect(getButton(copy.cancel)).toBeVisible();
    expect(getSheetButtons()).toHaveLength(3);
  });

  it("renders decorative inline icons and no anchors", () => {
    const { container } = renderSheet();

    for (const icon of container.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }

    expect(container.querySelector("a")).toBeNull();
  });
});

describe("ScanActionsSheet explicit callbacks", () => {
  it("invokes only the facial callback from the facial action", () => {
    const { props } = renderSheet();

    fireEvent.click(getButton(copy.facialLabel));

    expect(props.onStartFacialScan).toHaveBeenCalledTimes(1);
    expect(props.onOpenIngredientScanner).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("invokes only the ingredient callback from the ingredient action", () => {
    const { props } = renderSheet();

    fireEvent.click(getButton(copy.ingredientLabel));

    expect(props.onOpenIngredientScanner).toHaveBeenCalledTimes(1);
    expect(props.onStartFacialScan).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("does not call callbacks during open mount or rerender", () => {
    const props = createProps();
    const { rerender } = render(
      <ScanActionsSheet {...props} />,
    );

    expectNoCallbackCalled(props);

    rerender(<ScanActionsSheet {...props} />);

    expectNoCallbackCalled(props);
  });
});

describe("ScanActionsSheet independent availability", () => {
  it("blocks facial action while ingredient scanner stays enabled", () => {
    const { props } = renderSheet({
      canStartFacialScan: false,
    });

    const facial = getButton(copy.facialBlocked);
    const ingredient = getButton(copy.ingredientLabel);

    expect(facial).toBeDisabled();
    expect(ingredient).not.toBeDisabled();

    facial.removeAttribute("disabled");
    fireEvent.click(facial);

    expect(props.onStartFacialScan).not.toHaveBeenCalled();
  });

  it("blocks ingredient scanner while facial action stays enabled", () => {
    const { props } = renderSheet({
      canOpenIngredientScanner: false,
    });

    const ingredient = getButton(copy.ingredientBlocked);
    const facial = getButton(copy.facialLabel);

    expect(ingredient).toBeDisabled();
    expect(facial).not.toBeDisabled();

    ingredient.removeAttribute("disabled");
    fireEvent.click(ingredient);

    expect(props.onOpenIngredientScanner).not.toHaveBeenCalled();
  });

  it("keeps both blocked actions visible while Cancel remains enabled", () => {
    renderSheet({
      canStartFacialScan: false,
      canOpenIngredientScanner: false,
    });

    expect(getButton(copy.facialBlocked)).toBeDisabled();
    expect(getButton(copy.ingredientBlocked)).toBeDisabled();
    expect(getButton(copy.cancel)).not.toBeDisabled();
  });

  it("fails closed when route callbacks are missing", () => {
    const { props } = renderSheet({
      onStartFacialScan: undefined,
      onOpenIngredientScanner: undefined,
    });

    const facial = getButton(copy.facialBlocked);
    const ingredient = getButton(copy.ingredientBlocked);

    expect(facial).toBeDisabled();
    expect(ingredient).toBeDisabled();

    facial.removeAttribute("disabled");
    ingredient.removeAttribute("disabled");
    fireEvent.click(facial);
    fireEvent.click(ingredient);

    expectNoCallbackCalled(props);
  });

  it("guards forced activation when host flags are false", () => {
    const { props } = renderSheet({
      canStartFacialScan: false,
      canOpenIngredientScanner: false,
    });

    const facial = getButton(copy.facialBlocked);
    const ingredient = getButton(copy.ingredientBlocked);

    facial.removeAttribute("disabled");
    ingredient.removeAttribute("disabled");
    fireEvent.click(facial);
    fireEvent.click(ingredient);

    expect(props.onStartFacialScan).not.toHaveBeenCalled();
    expect(props.onOpenIngredientScanner).not.toHaveBeenCalled();
  });
});

describe("ScanActionsSheet pending operation", () => {
  it.each([
    {
      label: copy.facialLabel,
      pendingLabel: copy.facialPending,
      callbackName: "onStartFacialScan" as const,
      conflictingLabel: copy.ingredientLabel,
      conflictingCallbackName:
        "onOpenIngredientScanner" as const,
    },
    {
      label: copy.ingredientLabel,
      pendingLabel: copy.ingredientPending,
      callbackName: "onOpenIngredientScanner" as const,
      conflictingLabel: copy.facialLabel,
      conflictingCallbackName: "onStartFacialScan" as const,
    },
  ])(
    "guards pending state for $label",
    async ({
      label,
      pendingLabel,
      callbackName,
      conflictingLabel,
      conflictingCallbackName,
    }) => {
      const pending = createDeferred();
      const callback = vi.fn(() => pending.promise);
      const conflictingCallback = vi.fn();
      const onClose = vi.fn();
      renderSheet({
        [callbackName]: callback,
        [conflictingCallbackName]: conflictingCallback,
        onClose,
      });

      await act(async () => {
        fireEvent.click(getButton(label));
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(getButton(pendingLabel)).toBeDisabled();
      expect(getButton(copy.cancel)).toBeDisabled();
      expect(getButton(conflictingLabel)).toBeDisabled();

      const pendingButton = getButton(pendingLabel);
      pendingButton.removeAttribute("disabled");
      fireEvent.click(pendingButton);

      const conflictingButton = getButton(conflictingLabel);
      conflictingButton.removeAttribute("disabled");
      fireEvent.click(conflictingButton);

      const cancelButton = getButton(copy.cancel);
      cancelButton.removeAttribute("disabled");
      fireEvent.click(cancelButton);
      fireEvent.keyDown(getDialog(), { key: "Escape" });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(conflictingCallback).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();

      await act(async () => {
        pending.resolve();
        await pending.promise;
      });

      await waitFor(() => {
        expect(getButton(label)).not.toBeDisabled();
      });
      expect(getDialog()).toBeInTheDocument();
    },
  );
});

describe("ScanActionsSheet Cancel and Escape", () => {
  it("invokes close only from idle Cancel", () => {
    const { props } = renderSheet();

    fireEvent.click(getButton(copy.cancel));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onStartFacialScan).not.toHaveBeenCalled();
    expect(props.onOpenIngredientScanner).not.toHaveBeenCalled();
  });

  it("invokes close only from idle Escape", () => {
    const { props } = renderSheet();

    fireEvent.keyDown(getDialog(), { key: "Escape" });

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onStartFacialScan).not.toHaveBeenCalled();
    expect(props.onOpenIngredientScanner).not.toHaveBeenCalled();
  });

  it("does not close from overlay click", () => {
    const { props } = renderSheet();

    fireEvent.click(
      screen.getByTestId("scan-actions-sheet-overlay"),
    );

    expect(props.onClose).not.toHaveBeenCalled();
  });
});

describe("ScanActionsSheet focus management", () => {
  it("focuses the first enabled facial action when opened", async () => {
    renderSheet();

    await waitFor(() => {
      expect(document.activeElement).toBe(
        getButton(copy.facialLabel),
      );
    });
  });

  it("focuses ingredient scanner when the facial action is blocked", async () => {
    renderSheet({
      canStartFacialScan: false,
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(
        getButton(copy.ingredientLabel),
      );
    });
  });

  it("focuses Cancel when both actions are blocked", async () => {
    renderSheet({
      canStartFacialScan: false,
      canOpenIngredientScanner: false,
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(
        getButton(copy.cancel),
      );
    });
  });

  it("traps idle Tab and Shift+Tab inside the sheet", async () => {
    const user = userEvent.setup();
    renderSheet();

    getButton(copy.cancel).focus();
    await user.tab();
    expect(document.activeElement).toBe(
      getButton(copy.facialLabel),
    );

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(
      getButton(copy.cancel),
    );
  });

  it.each([
    {
      label: copy.facialLabel,
      callbackName: "onStartFacialScan" as const,
    },
    {
      label: copy.ingredientLabel,
      callbackName: "onOpenIngredientScanner" as const,
    },
  ])(
    "anchors focus on the dialog panel while $label is pending",
    async ({ label, callbackName }) => {
      const user = userEvent.setup();
      const pending = createDeferred();
      renderSheet({
        [callbackName]: vi.fn(() => pending.promise),
      });

      fireEvent.click(getButton(label));

      await waitFor(() => {
        expect(document.activeElement).toBe(getDialog());
      });

      await user.tab();
      expect(document.activeElement).toBe(getDialog());

      await user.tab({ shift: true });
      expect(document.activeElement).toBe(getDialog());

      await act(async () => {
        pending.resolve();
        await pending.promise;
      });

      await waitFor(() => {
        expect(document.activeElement).toBe(
          getButton(label),
        );
      });
    },
  );

  it("gives the pending dialog focus anchor a visible focus treatment", async () => {
    const pending = createDeferred();
    renderSheet({
      onStartFacialScan: vi.fn(() => pending.promise),
    });

    fireEvent.click(getButton(copy.facialLabel));

    await waitFor(() => {
      expect(document.activeElement).toBe(getDialog());
    });

    expect(getDialog().className).toContain(
      "focus-visible:outline",
    );

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
  });

  it("routes Tab and Shift+Tab from the dialog fallback into enabled controls", () => {
    renderSheet();

    const dialog = getDialog();

    dialog.focus();
    fireEvent.keyDown(dialog, {
      key: "Tab",
    });

    expect(getButton(copy.facialLabel)).toHaveFocus();

    dialog.focus();
    fireEvent.keyDown(dialog, {
      key: "Tab",
      shiftKey: true,
    });

    expect(getButton(copy.cancel)).toHaveFocus();
  });

  it("moves focus to ingredient scanner when the focused facial action becomes blocked", async () => {
    const props = createProps();
    const { rerender } = render(
      <ScanActionsSheet {...props} />,
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(
        getButton(copy.facialLabel),
      );
    });

    rerender(
      <ScanActionsSheet
        {...props}
        canStartFacialScan={false}
      />,
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(
        getButton(copy.ingredientLabel),
      );
    });
  });

  it("moves focus to Cancel when both scan actions become blocked", async () => {
    const props = createProps();
    const { rerender } = render(
      <ScanActionsSheet {...props} />,
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(
        getButton(copy.facialLabel),
      );
    });

    rerender(
      <ScanActionsSheet
        {...props}
        canOpenIngredientScanner={false}
        canStartFacialScan={false}
      />,
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(
        getButton(copy.cancel),
      );
    });
  });

  it("does not steal focus when showing a toast", async () => {
    renderSheet({
      onStartFacialScan: vi
        .fn()
        .mockRejectedValue(new Error("fail")),
    });

    const button = getButton(copy.facialLabel);
    button.focus();

    await act(async () => {
      fireEvent.click(button);
    });
    await flushRejectedCallback();

    expect(screen.getByRole("status")).toHaveTextContent(
      recoveryToast,
    );
    expect(document.activeElement).toBe(button);
  });

  it("does not move focus while closed", () => {
    render(
      <button type="button">Outside trigger</button>,
    );
    const trigger = screen.getByRole("button", {
      name: "Outside trigger",
    });
    trigger.focus();

    renderSheet({
      isOpen: false,
    });

    expect(document.activeElement).toBe(trigger);
  });
});

describe("ScanActionsSheet rejection recovery", () => {
  it.each([
    {
      label: copy.facialLabel,
      callbackName: "onStartFacialScan" as const,
    },
    {
      label: copy.ingredientLabel,
      callbackName: "onOpenIngredientScanner" as const,
    },
  ])(
    "shows a polite sheet-owned toast for $label rejection",
    async ({ label, callbackName }) => {
      vi.useFakeTimers();
      const callback = vi
        .fn()
        .mockRejectedValue(new Error("fail"));
      renderSheet({
        [callbackName]: callback,
      });

      const button = getButton(label);
      button.focus();

      await act(async () => {
        fireEvent.click(button);
      });
      await flushRejectedCallback();

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "polite");
      expect(toast).toHaveTextContent(recoveryToast);
      expect(button).not.toBeDisabled();
      expect(document.activeElement).toBe(button);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(
        screen.getByTestId("scan-actions-sheet-toast"),
      ).toHaveTextContent("");
    },
  );

  it("cleans up the toast timer on unmount", async () => {
    vi.useFakeTimers();
    const { unmount } = renderSheet({
      onStartFacialScan: vi
        .fn()
        .mockRejectedValue(new Error("fail")),
    });

    await act(async () => {
      fireEvent.click(getButton(copy.facialLabel));
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

    renderSheet({
      onStartFacialScan: callback,
    });

    await act(async () => {
      fireEvent.click(getButton(copy.facialLabel));
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      recoveryToast,
    );

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    await act(async () => {
      fireEvent.click(getButton(copy.facialLabel));
    });

    expect(callback).toHaveBeenCalledTimes(2);
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
      screen.getByTestId("scan-actions-sheet-toast"),
    ).toHaveTextContent("");
  });
});

describe("ScanActionsSheet StrictMode behavior", () => {
  it("does not call callbacks during StrictMode mount", () => {
    const { props } = renderStrictSheet();

    expectNoCallbackCalled(props);
  });

  it("keeps focus setup stable under StrictMode", async () => {
    renderStrictSheet();

    await waitFor(() => {
      expect(document.activeElement).toBe(
        getButton(copy.facialLabel),
      );
    });
  });

  it("keeps the pending duplicate guard effective under StrictMode", async () => {
    const pending = createDeferred();
    const callback = vi.fn(() => pending.promise);
    renderStrictSheet({
      onOpenIngredientScanner: callback,
    });

    fireEvent.click(getButton(copy.ingredientLabel));
    const pendingButton = getButton(copy.ingredientPending);
    pendingButton.removeAttribute("disabled");
    fireEvent.click(pendingButton);

    expect(callback).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
  });

  it("renders one readable toast for a rejected StrictMode callback", async () => {
    renderStrictSheet({
      onOpenIngredientScanner: vi
        .fn()
        .mockRejectedValue(new Error("fail")),
    });

    await act(async () => {
      fireEvent.click(getButton(copy.ingredientLabel));
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
    const { unmount } = renderStrictSheet({
      onStartFacialScan: vi.fn(() => pending.promise),
    });

    fireEvent.click(getButton(copy.facialLabel));
    unmount();

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("ScanActionsSheet visual contract", () => {
  it("includes fixed overlay, bottom sheet, safe area, focus rings, reduced motion, and touch targets", () => {
    const { container } = renderSheet();
    const overlay = screen.getByTestId(
      "scan-actions-sheet-overlay",
    );
    const panel = screen.getByTestId(
      "scan-actions-sheet-panel",
    );

    expect(overlay.className).toContain("fixed");
    expect(overlay.className).toContain("inset-0");
    expect(overlay.className).toContain("items-end");
    expect(panel.className).toContain("max-w-[560px]");
    expect(panel.className).toContain("rounded-t-[28px]");
    expect(panel.className).toContain(
      "env(safe-area-inset-bottom)",
    );
    expect(panel.className).toContain(
      "motion-reduce:transition-none",
    );

    for (const button of getSheetButtons()) {
      expect(button.className).toMatch(/min-h-\[(48|56)px\]/);
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

describe("ScanActionsSheet architecture boundaries", () => {
  it("keeps the production component presentation-only", () => {
    const source = readFileSync(
      "components/scan-actions-sheet.tsx",
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

    expect(source).not.toMatch(/<a(?:\s|>)/i);
    expect(source).not.toMatch(/\bcamera\b/i);
    expect(source).not.toMatch(/\bpicker\b/i);
    expect(source).not.toMatch(/\bocr\b/i);
    expect(source).not.toMatch(/\banalysis\b/i);
    expect(source).not.toMatch(/\bsage\b/i);
    expect(source).not.toMatch(/\bgreen\b/i);
    expect(source).not.toMatch(/\bblue\b/i);
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("window.clearTimeout");
    expect(source).toContain("aria-labelledby");
    expect(source).toContain("aria-describedby");
    expect(source).toContain("aria-modal");
  });
});
