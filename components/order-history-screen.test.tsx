import "@testing-library/jest-dom/vitest";
import { StrictMode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  act,
} from "@testing-library/react";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import OrderHistoryScreen, {
  copy,
  hasUsableOrderHistoryReport,
  isOrderHistoryState,
  isOrderHistoryStatusTone,
  type OrderHistoryItem,
  type OrderHistoryReport,
  type OrderHistoryScreenProps,
} from "./order-history-screen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

const opaqueOrderIds = [
  "order-secret-history-001",
  "order-secret-history-002",
  "order-secret-history-003",
] as const;

const defaultReport: OrderHistoryReport = {
  orders: [
    {
      orderId: opaqueOrderIds[0],
      orderReferenceLabel: "DL-2026-001",
      statusLabel: "Host status: preparing items",
      placedAtLabel: "June 4, 2026",
      itemSummaryLabel: "3 host-supplied items",
      totalLabel: "$93.50",
      supporting:
        "The host supplied this order summary.",
      statusTone: "attention",
    },
    {
      orderId: opaqueOrderIds[1],
      orderReferenceLabel: "DL-2026-002",
      statusLabel: "Host status: order received",
      placedAtLabel: "May 20, 2026",
      itemSummaryLabel: "1 host-supplied item",
      totalLabel: "$18.00",
      supporting:
        "The host supplied this second summary.",
      statusTone: "neutral",
    },
  ],
  helperLabel:
    "Host-owned order list details stay supplied by the host.",
  privacyLabel:
    "This first-party order list does not require account creation.",
  hasMoreOrders: true,
};

function reportWith(
  overrides: Partial<OrderHistoryReport> = {},
): OrderHistoryReport {
  return {
    ...defaultReport,
    ...overrides,
  };
}

function defaultProps(
  overrides: Partial<OrderHistoryScreenProps> = {},
): OrderHistoryScreenProps {
  return {
    state: "ready",
    report: defaultReport,
    onBack: vi.fn(),
    onOpenOrder: vi.fn(),
    onLoadMore: vi.fn(),
    onRetryLoad: vi.fn(),
    ...overrides,
  };
}

function renderScreen(
  overrides: Partial<OrderHistoryScreenProps> = {},
) {
  const props = defaultProps(overrides);
  const view = render(
    <OrderHistoryScreen {...props} />,
  );
  return { ...view, props };
}

function sourceText() {
  return document.body.textContent ?? "";
}

function getOrderCards() {
  return screen.getAllByTestId(
    "order-history-card",
  );
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

function restoreDescriptor(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
  } else {
    delete (target as Record<PropertyKey, unknown>)[property];
  }
}

describe("OrderHistoryScreen runtime helpers", () => {
  it.each([
    "loading",
    "ready",
    "empty",
    "error",
  ])("recognises supported state %s", (state) => {
    expect(isOrderHistoryState(state)).toBe(true);
  });

  it.each([
    "idle",
    "",
    null,
    undefined,
    1,
    {},
  ])("rejects unsupported state %s", (state) => {
    expect(isOrderHistoryState(state)).toBe(false);
  });

  it.each([
    "neutral",
    "attention",
    "caution",
  ])("recognises supported tone %s", (tone) => {
    expect(isOrderHistoryStatusTone(tone)).toBe(true);
  });

  it.each([
    "positive",
    "",
    null,
    undefined,
    3,
    {},
  ])("rejects unsupported tone %s", (tone) => {
    expect(isOrderHistoryStatusTone(tone)).toBe(false);
  });

  it("accepts only reports with an order array", () => {
    expect(
      hasUsableOrderHistoryReport(
        reportWith({ orders: [] }),
      ),
    ).toBe(true);
    expect(hasUsableOrderHistoryReport(null)).toBe(false);
    expect(
      hasUsableOrderHistoryReport(
        undefined,
      ),
    ).toBe(false);
    expect(
      hasUsableOrderHistoryReport({
        orders: "bad",
      } as unknown as OrderHistoryReport),
    ).toBe(false);
  });

  it("fails ready null and malformed required context closed into Error", () => {
    renderScreen({
      report: null,
      state: "ready",
    });

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent(copy.errorHeading);

    cleanup();

    renderScreen({
      report: {
        orders: null,
      } as unknown as OrderHistoryReport,
      state: "ready",
    });

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent(copy.errorSupporting);
  });

  it("renders ready empty arrays and unknown states defensively", () => {
    renderScreen({
      report: reportWith({ orders: [] }),
      state: "ready",
    });

    expect(
      screen.getByText(copy.emptyHeading),
    ).toBeVisible();

    cleanup();

    renderScreen({
      state:
        "mystery" as unknown as OrderHistoryScreenProps["state"],
    });

    expect(
      screen.getByRole("alert"),
    ).toBeInTheDocument();
  });
});

describe("OrderHistoryScreen core rendering", () => {
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

  it("renders the ready heading, one h1, and first-party trust copy", () => {
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
      screen.getByTestId(
        "first-party-trust-card",
      ),
    ).toHaveTextContent(copy.trustCopy);
  });

  it("keeps mobile DOM order aligned with the order-review flow", () => {
    renderScreen({
      isLoadMoreAvailableOffline: true,
      isOffline: true,
    });

    expectTextOrder(
      copy.wordmark,
      copy.heading,
      copy.offline,
      copy.trustHeading,
      "DL-2026-001",
      copy.loadMoreDefault,
      defaultReport.helperLabel as string,
    );
  });

  it("renders informational offline banner while cards remain readable", () => {
    renderScreen({ isOffline: true });

    expect(
      screen
        .getByText(copy.offline)
        .closest('[role="status"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByText("DL-2026-001"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: `${copy.viewOrder}: DL-2026-001`,
      }),
    ).toBeEnabled();
  });

  it("does not render opaque order IDs", () => {
    renderScreen();
    const rendered = sourceText();

    for (const orderId of opaqueOrderIds) {
      expect(rendered).not.toContain(orderId);
    }
  });
});

describe("OrderHistoryScreen order list", () => {
  it("preserves received order without local reordering", () => {
    renderScreen({
      report: reportWith({
        orders: [
          {
            ...defaultReport.orders[0],
            orderReferenceLabel: "DL-2026-300",
          },
          {
            ...defaultReport.orders[1],
            orderReferenceLabel: "DL-2026-100",
          },
          {
            orderId: opaqueOrderIds[2],
            orderReferenceLabel: "DL-2026-200",
            statusLabel: "Host status: supplied third",
          },
        ],
      }),
    });

    expect(getOrderCards()).toHaveLength(3);
    expectTextOrder(
      "DL-2026-300",
      "DL-2026-100",
      "DL-2026-200",
    );
  });

  it("preserves malformed entries in position with neutral fallbacks", () => {
    renderScreen({
      report: reportWith({
        orders: [
          {
            ...defaultReport.orders[0],
            orderReferenceLabel: "Valid before",
          },
          null,
          undefined,
          "unexpected",
          42,
          {
            orderId: " ",
            orderReferenceLabel: 7,
            statusLabel: null,
            placedAtLabel: "Host placed label",
            itemSummaryLabel: "Host item summary",
            totalLabel: "$44.00",
            supporting: "Host supporting copy",
            statusTone: "unknown",
          },
          {
            ...defaultReport.orders[1],
            orderReferenceLabel: "Valid after",
          },
        ] as unknown as OrderHistoryItem[],
      }),
    });

    const cards = getOrderCards();
    expect(cards).toHaveLength(7);
    expect(cards[0]).toHaveTextContent(
      "Valid before",
    );
    expect(cards[1]).toHaveTextContent(
      copy.orderReferenceFallback,
    );
    expect(cards[1]).toHaveTextContent(
      copy.statusFallback,
    );
    expect(cards[1]).toHaveAttribute(
      "data-tone",
      "neutral",
    );
    expect(cards[5]).toHaveTextContent(
      "Host placed label",
    );
    expect(cards[5]).toHaveTextContent(
      "Host item summary",
    );
    expect(cards[5]).toHaveTextContent("$44.00");
    expect(cards[5]).toHaveTextContent(
      "Host supporting copy",
    );
    expect(cards[5]).toHaveAttribute(
      "data-tone",
      "neutral",
    );
    expect(cards[6]).toHaveTextContent(
      "Valid after",
    );
    expect(sourceText()).not.toContain(
      "unexpected",
    );
  });

  it("renders optional labels unchanged without deriving totals or status", () => {
    renderScreen({
      report: reportWith({
        orders: [
          {
            orderId: opaqueOrderIds[0],
            orderReferenceLabel: "DL-OPTIONAL",
            statusLabel: "Host status: supplied",
            placedAtLabel: "Host date",
            itemSummaryLabel: "Host item summary",
            totalLabel: "$1.00",
            supporting: "Host supporting",
            statusTone: "caution",
          },
          {
            orderId: opaqueOrderIds[1],
            orderReferenceLabel: "DL-SECOND",
            statusLabel: "Host status: supplied second",
            totalLabel: "$2.00",
          },
        ],
      }),
    });

    expect(getOrderCards()[0]).toHaveTextContent(
      "Host date",
    );
    expect(getOrderCards()[0]).toHaveTextContent(
      "Host item summary",
    );
    expect(getOrderCards()[0]).toHaveTextContent(
      "$1.00",
    );
    expect(getOrderCards()[0]).toHaveTextContent(
      "Host supporting",
    );
    expect(getOrderCards()[0]).toHaveAttribute(
      "data-tone",
      "caution",
    );
    expect(sourceText()).not.toContain("$3.00");
    expect(sourceText()).not.toContain("2 orders");
  });
});

describe("OrderHistoryScreen duplicate IDs", () => {
  it("keeps duplicate cards readable while disabling trust-critical actions", () => {
    const onOpenOrder = vi.fn();
    renderScreen({
      onOpenOrder,
      report: reportWith({
        orders: [
          {
            orderId: "order-duplicate",
            orderReferenceLabel: "June duplicate",
            statusLabel: "June date",
          },
          {
            orderId: "order-duplicate",
            orderReferenceLabel: "July duplicate",
            statusLabel: "July date",
          },
          {
            orderId: opaqueOrderIds[2],
            orderReferenceLabel: "August unique",
            statusLabel: "August date",
          },
        ],
      }),
    });

    const cards = getOrderCards();
    expect(cards).toHaveLength(3);
    expectTextOrder(
      "June duplicate",
      "July duplicate",
      "August unique",
    );

    for (const label of [
      "June duplicate",
      "July duplicate",
    ]) {
      const button = within(
        screen.getByText(label).closest("li") as HTMLElement,
      ).getByRole("button", {
        name: `${copy.orderBlocked}: ${label}`,
      });
      expect(button).toBeDisabled();
    }

    expect(
      screen.getByRole("button", {
        name: `${copy.viewOrder}: August unique`,
      }),
    ).toBeEnabled();

    const duplicateButton = within(cards[0]).getByRole(
      "button",
    );
    duplicateButton.removeAttribute("disabled");
    fireEvent.click(duplicateButton);

    expect(onOpenOrder).not.toHaveBeenCalled();
    expect(sourceText()).not.toContain("order-duplicate");
  });
});

describe("OrderHistoryScreen open-order action", () => {
  it("uses contextual labels and passes only the callback-owned order ID", () => {
    const onOpenOrder = vi.fn();
    renderScreen({ onOpenOrder });

    fireEvent.click(
      screen.getByRole("button", {
        name: `${copy.viewOrder}: DL-2026-001`,
      }),
    );

    expect(onOpenOrder).toHaveBeenCalledWith(
      opaqueOrderIds[0],
    );
    expect(onOpenOrder).toHaveBeenCalledTimes(1);
    expect(sourceText()).not.toContain(
      opaqueOrderIds[0],
    );
  });

  it("adds the visible order reference exactly once to enabled, blocked, and pending accessible names", async () => {
    renderScreen();

    expect(
      screen.getByRole("button", {
        name: `${copy.viewOrder}: DL-2026-001`,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", {
        name:
          `${copy.viewOrder}: DL-2026-001: DL-2026-001`,
      }),
    ).not.toBeInTheDocument();

    cleanup();
    renderScreen({ canOpenOrders: false });

    expect(
      screen.getByRole("button", {
        name: `${copy.orderBlocked}: DL-2026-001`,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", {
        name:
          `${copy.orderBlocked}: DL-2026-001: DL-2026-001`,
      }),
    ).not.toBeInTheDocument();

    cleanup();
    const pending = deferred();
    const onOpenOrder = vi.fn(
      () => pending.promise,
    );
    renderScreen({ onOpenOrder });

    fireEvent.click(
      screen.getByRole("button", {
        name: `${copy.viewOrder}: DL-2026-001`,
      }),
    );

    expect(
      screen.getByRole("button", {
        name: `${copy.openOrderPending}: DL-2026-001`,
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", {
        name:
          `${copy.openOrderPending}: DL-2026-001: DL-2026-001`,
      }),
    ).not.toBeInTheDocument();

    pending.resolve();
    await act(async () => {
      await pending.promise;
    });
  });

  it("shows pending label, prevents duplicates, and disables conflicting controls", () => {
    const pending = deferred();
    const onOpenOrder = vi.fn(
      () => pending.promise,
    );
    renderScreen({ onOpenOrder });

    fireEvent.click(
      screen.getByRole("button", {
        name: `${copy.viewOrder}: DL-2026-001`,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: `${copy.openOrderPending}: DL-2026-001`,
      }),
    );

    expect(onOpenOrder).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", {
        name: copy.back,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: copy.loadMoreBlocked,
      }),
    ).toBeDisabled();
    pending.resolve();
  });

  it.each([
    {
      name: "global block",
      props: { canOpenOrders: false },
      buttonName:
        `${copy.orderBlocked}: DL-2026-001`,
    },
    {
      name: "callback absent",
      props: { onOpenOrder: undefined },
      buttonName:
        `${copy.orderBlocked}: DL-2026-001`,
    },
    {
      name: "per-order block",
      props: {
        report: reportWith({
          orders: [
            {
              ...defaultReport.orders[0],
              canOpenOrder: false,
            },
          ],
        }),
      },
      buttonName:
        `${copy.orderBlocked}: DL-2026-001`,
    },
    {
      name: "malformed ID",
      props: {
        report: reportWith({
          orders: [
            {
              ...defaultReport.orders[0],
              orderId: "",
            },
          ],
        }),
      },
      buttonName:
        `${copy.orderBlocked}: DL-2026-001`,
    },
  ])("keeps $name visible and guarded", ({ props, buttonName }) => {
    const onOpenOrder = vi.fn();
    renderScreen({
      onOpenOrder,
      ...props,
    });

    const button = screen.getByRole("button", {
      name: buttonName,
    });
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onOpenOrder).not.toHaveBeenCalled();
  });

  it("shows rejection toast without local route mutation", async () => {
    renderScreen({
      onOpenOrder: vi.fn().mockRejectedValue(
        new Error("fail"),
      ),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: `${copy.viewOrder}: DL-2026-001`,
      }),
    );

    expect(
      await screen.findByText(copy.openOrderError),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.heading,
      }),
    ).toBeVisible();
  });
});

describe("OrderHistoryScreen load-more action", () => {
  it("is hidden when no load-more context exists", () => {
    renderScreen({
      onLoadMore: undefined,
      report: reportWith({
        hasMoreOrders: false,
        loadMoreLabel: undefined,
      }),
    });

    expect(
      screen.queryByRole("button", {
        name: copy.loadMoreDefault,
      }),
    ).not.toBeInTheDocument();
  });

  it("uses default and host-supplied labels", () => {
    renderScreen({
      report: reportWith({
        hasMoreOrders: true,
      }),
    });
    expect(
      screen.getByRole("button", {
        name: copy.loadMoreDefault,
      }),
    ).toBeVisible();

    cleanup();

    renderScreen({
      report: reportWith({
        loadMoreLabel: "Host load older orders",
      }),
    });
    expect(
      screen.getByRole("button", {
        name: "Host load older orders",
      }),
    ).toBeVisible();
  });

  it("invokes callback, prevents duplicates, shows success, and waits for refreshed host data", async () => {
    const pending = deferred();
    const onLoadMore = vi.fn(
      () => pending.promise,
    );
    renderScreen({ onLoadMore });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.loadMoreDefault,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.loadMorePending,
      }),
    );

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(getOrderCards()).toHaveLength(2);

    pending.resolve();

    expect(
      await screen.findByText(
        copy.loadMoreSuccess,
      ),
    ).toBeVisible();
    expect(getOrderCards()).toHaveLength(2);
  });

  it("uses reconnect copy only when offline is the remaining block", () => {
    renderScreen({
      isOffline: true,
      isLoadMoreAvailableOffline: false,
    });

    expect(
      screen.getByRole("button", {
        name: copy.loadMoreReconnect,
      }),
    ).toBeDisabled();
  });

  it("lets general host block beat reconnect copy", () => {
    renderScreen({
      canLoadMore: false,
      isOffline: true,
      isLoadMoreAvailableOffline: false,
    });

    expect(
      screen.getByRole("button", {
        name: copy.loadMoreBlocked,
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", {
        name: copy.loadMoreReconnect,
      }),
    ).not.toBeInTheDocument();
  });

  it.each([
    { canLoadMore: false },
    { onLoadMore: undefined },
    {
      isOffline: true,
      isLoadMoreAvailableOffline: false,
    },
  ])("guards forced load-more activation %s", (props) => {
    const onLoadMore = vi.fn();
    renderScreen({
      onLoadMore,
      ...props,
    });

    const button = screen.getByRole("button", {
      name:
        props.isOffline
          ? copy.loadMoreReconnect
          : copy.loadMoreBlocked,
    });
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("shows rejection toast", async () => {
    renderScreen({
      onLoadMore: vi.fn().mockRejectedValue(
        new Error("fail"),
      ),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.loadMoreDefault,
      }),
    );

    expect(
      await screen.findByText(copy.loadMoreError),
    ).toBeVisible();
  });
});

describe("OrderHistoryScreen empty states", () => {
  it("lets explicit Empty override stale order entries", () => {
    renderScreen({
      state: "empty",
      report: defaultReport,
    });

    expect(
      screen.getByText(copy.emptyHeading),
    ).toBeVisible();
    expect(
      screen.queryByText("DL-2026-001"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: copy.back,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: copy.loadMoreDefault,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("alert"),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      state: "empty" as const,
      report: defaultReport,
    },
    {
      state: "ready" as const,
      report: reportWith({ orders: [] }),
    },
  ])("renders neutral empty order card for $state", (props) => {
    renderScreen(props);

    const card = screen.getByTestId(
      "empty-order-history-card",
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
    expect(card).toHaveTextContent(
      copy.emptySupporting,
    );
  });
});

describe("OrderHistoryScreen Back and Retry", () => {
  it("runs Back only on explicit activation and not during rerender", () => {
    const onBack = vi.fn();
    const { rerender, props } = renderScreen({
      onBack,
    });

    expect(onBack).not.toHaveBeenCalled();

    rerender(
      <OrderHistoryScreen
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
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows Back pending label, duplicate protection, and rejection toast", async () => {
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
    pending.reject(new Error("fail"));

    expect(
      await screen.findByText(copy.backError),
    ).toBeVisible();
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

    const pending = deferred();
    const onRetryLoad = vi.fn(
      () => pending.promise,
    );
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
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.retryPending,
      }),
    );

    expect(onRetryLoad).toHaveBeenCalledTimes(1);
    pending.reject(new Error("fail"));

    expect(
      await screen.findByText(copy.retryError),
    ).toBeVisible();
  });
});

describe("OrderHistoryScreen async safety and architecture boundaries", () => {
  it("keeps StrictMode pending behavior stable", () => {
    const pending = deferred();
    const onLoadMore = vi.fn(
      () => pending.promise,
    );

    render(
      <StrictMode>
        <OrderHistoryScreen
          {...defaultProps({ onLoadMore })}
        />
      </StrictMode>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.loadMoreDefault,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.loadMorePending,
      }),
    );

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    pending.resolve();
  });

  it("recovers from StrictMode callback rejection with a toast", async () => {
    render(
      <StrictMode>
        <OrderHistoryScreen
          {...defaultProps({
            onOpenOrder: vi
              .fn()
              .mockRejectedValue(
                new Error("fail"),
              ),
          })}
        />
      </StrictMode>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: `${copy.viewOrder}: DL-2026-001`,
      }),
    );

    expect(
      await screen.findByText(copy.openOrderError),
    ).toBeVisible();
  });

  it("auto-dismisses callback toasts", async () => {
    vi.useFakeTimers();
    renderScreen({
      onLoadMore: vi.fn().mockRejectedValue(
        new Error("fail"),
      ),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.loadMoreDefault,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText(copy.loadMoreError),
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
    ];
    const { rerender, props } = renderScreen({
      onBack: callbacks[0],
      onOpenOrder: callbacks[1],
      onLoadMore: callbacks[2],
      onRetryLoad: callbacks[3],
    });

    rerender(
      <OrderHistoryScreen
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
          name: `${copy.viewOrder}: DL-2026-001`,
        }),
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: copy.loadMoreReconnect,
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
    expect(rendered).not.toContain("trackingUrl");
    expect(rendered).not.toContain("receiptUrl");
    expect(rendered).not.toContain("paymentSessionId");
    expect(rendered).not.toContain("gatewaySessionId");
    expect(rendered).not.toContain("transactionId");
    expect(rendered).not.toContain("payment-");
    expect(rendered).not.toContain("gateway-");
    expect(rendered).not.toContain("marketplace");
    expect(rendered).not.toContain("external seller");
    expect(rendered).not.toContain("sponsored");
    expect(rendered).not.toContain("affiliate");
    expect(rendered).not.toContain("shipped");
    expect(rendered).not.toContain("guaranteed");
    expect(markup).not.toContain("sage");
    expect(markup).not.toContain("green");
    expect(markup).not.toContain("blue");

    for (const orderId of opaqueOrderIds) {
      expect(rendered).not.toContain(orderId);
    }
  });
});
