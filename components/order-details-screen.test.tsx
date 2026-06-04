import "@testing-library/jest-dom/vitest";
import { StrictMode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import OrderDetailsScreen, {
  copy,
  hasUsableOrderDetailsReport,
  isOrderDetailsState,
  isOrderStatusTone,
  type OrderDetailsReport,
  type OrderDetailsScreenProps,
} from "./order-details-screen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

const defaultReport: OrderDetailsReport = {
  orderId: "order-secret-001",
  orderReferenceLabel: "DL-2026-001",
  statusLabel: "Host status: being prepared",
  statusSupporting:
    "The host supplied this order-status note.",
  statusTone: "attention",
  placedAtLabel: "June 4, 2026",
  items: [
    {
      lineItemId: "line-secret-001",
      productName: "Gentle Foaming Cleanser",
      quantityLabel: "Host quantity: 1",
      variantLabel: "200 ml",
      unitPriceLabel: "$18.00",
      lineTotalLabel: "$18.00",
      imageUrl: "https://example.test/cleanser.jpg",
      imageAlt: "Cleanser bottle",
    },
    {
      lineItemId: "line-secret-002",
      productName: "Invisible Shield SPF 50",
      quantityLabel: "Host quantity: 2",
      variantLabel: "50 ml",
      unitPriceLabel: "$32.00",
      lineTotalLabel: "$64.00",
      imageUrl: "https://example.test/spf.jpg",
      imageAlt: "SPF tube",
    },
  ],
  deliveryAddress: {
    recipientName: "Alex Taylor",
    addressLines: [
      "42 Test Street",
      "Unit 7",
      "Dubai",
    ],
    contactLabel: "SMS updates enabled",
  },
  shippingUpdates: [
    {
      updateId: "update-secret-001",
      statusLabel: "Order received by DermaLens",
      timestampLabel: "June 4, 2026, 10:30",
      supporting:
        "The host supplied this shipping update.",
      tone: "neutral",
    },
    {
      updateId: "update-secret-002",
      statusLabel: "Preparing order items",
      timestampLabel: "June 4, 2026, 12:15",
      supporting:
        "The host supplied this preparation note.",
      tone: "attention",
    },
  ],
  receipt: {
    subtotalLabel: "$82.00",
    shippingLabel: "Free",
    taxLabel: "$8.20",
    totalLabel: "$90.20",
    currencyLabel: "USD",
    receiptLabel: "Receipt available from host",
  },
  helperLabel:
    "Host-owned logistics and receipt details stay unchanged here.",
  privacyLabel:
    "No sign-in is required on this first-party order detail screen.",
};

function reportWith(
  overrides: Partial<OrderDetailsReport> = {},
): OrderDetailsReport {
  return {
    ...defaultReport,
    ...overrides,
  };
}

function defaultProps(
  overrides: Partial<OrderDetailsScreenProps> = {},
): OrderDetailsScreenProps {
  return {
    state: "ready",
    report: defaultReport,
    onBack: vi.fn(),
    onOpenSupport: vi.fn(),
    onDownloadReceipt: vi.fn(),
    onRetryLoad: vi.fn(),
    ...overrides,
  };
}

function renderScreen(
  overrides: Partial<OrderDetailsScreenProps> = {},
) {
  const props = defaultProps(overrides);
  const view = render(
    <OrderDetailsScreen {...props} />,
  );
  return { ...view, props };
}

function sourceText() {
  return document.body.textContent ?? "";
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

function getLineItemCards() {
  return screen.getAllByTestId(
    "order-line-item-card",
  );
}

function getUpdateCards() {
  return screen.getAllByTestId(
    "shipping-update-card",
  );
}

describe("runtime helpers", () => {
  it.each([
    "loading",
    "ready",
    "empty",
    "error",
  ])("recognises supported state %s", (state) => {
    expect(isOrderDetailsState(state)).toBe(true);
  });

  it.each([
    "idle",
    "",
    null,
    undefined,
    1,
    {},
  ])("rejects unsupported state %s", (state) => {
    expect(isOrderDetailsState(state)).toBe(false);
  });

  it.each([
    "neutral",
    "attention",
    "caution",
  ])("recognises supported tone %s", (tone) => {
    expect(isOrderStatusTone(tone)).toBe(true);
  });

  it.each([
    "positive",
    "",
    null,
    undefined,
    3,
    {},
  ])("rejects unsupported tone %s", (tone) => {
    expect(isOrderStatusTone(tone)).toBe(false);
  });

  it("accepts a usable report with an empty item array", () => {
    expect(
      hasUsableOrderDetailsReport(
        reportWith({ items: [] }),
      ),
    ).toBe(true);
  });

  it.each([
    [null, "null report"],
    [
      undefined,
      "undefined report",
    ],
    [
      reportWith({ orderId: "" }),
      "blank order ID",
    ],
    [
      reportWith({ orderId: "   " }),
      "whitespace order ID",
    ],
    [
      reportWith({
        orderReferenceLabel: "",
      }),
      "blank order reference",
    ],
    [
      reportWith({ statusLabel: "" }),
      "blank status label",
    ],
    [
      {
        ...defaultReport,
        items: "not an array",
      } as unknown as OrderDetailsReport,
      "malformed items",
    ],
  ])("rejects %s", (report, _reason) => {
    expect(
      hasUsableOrderDetailsReport(report),
    ).toBe(false);
  });
});

describe("core rendering", () => {
  it("renders loading heading", () => {
    renderScreen({
      state: "loading",
      report: null,
    });

    expect(
      screen.getByRole("heading", {
        name: copy.loadingHeading,
      }),
    ).toBeInTheDocument();
  });

  it("uses polite static-only loading semantics with Back outside the region", () => {
    renderScreen({
      state: "loading",
      report: null,
    });

    const status = screen
      .getByText(copy.loadingSupporting)
      .closest('[role="status"]');

    expect(status).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(
      within(status as HTMLElement).queryByRole(
        "button",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: copy.back,
      }),
    ).toBeInTheDocument();
  });

  it("renders ready heading and exactly one h1", () => {
    renderScreen();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.heading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        level: 1,
      }),
    ).toHaveLength(1);
  });

  it("renders first-party trust copy and host labels unchanged", () => {
    renderScreen();

    expect(
      screen.getByText(copy.supporting),
    ).toBeInTheDocument();
    expect(
      screen.getByText(copy.trustCopy),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        defaultReport.orderReferenceLabel,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(defaultReport.statusLabel),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${copy.placedAt}: ${defaultReport.placedAtLabel}`,
      ),
    ).toBeInTheDocument();
  });

  it("keeps the mobile DOM reading order", () => {
    renderScreen();
    const text = sourceText();
    const expectedOrder = [
      copy.wordmark,
      copy.heading,
      copy.trustCopy,
      defaultReport.orderReferenceLabel,
      copy.itemsHeading,
      copy.deliveryHeading,
      copy.shippingHeading,
      copy.receiptHeading,
      copy.supportHeading,
    ];
    const positions = expectedOrder.map((value) =>
      text.indexOf(value),
    );

    expect(
      positions.every((position) => position >= 0),
    ).toBe(true);
    expect(positions).toEqual(
      [...positions].sort((a, b) => a - b),
    );
  });

  it("renders informational offline banner", () => {
    renderScreen({ isOffline: true });

    const banner = screen
      .getByText(copy.offlineCopy)
      .closest('[role="status"]');
    expect(banner).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("fails closed to error for ready null, blank IDs, and unknown state", () => {
    const { rerender, props } =
      renderScreen({
        report: null,
      });

    expect(
      screen.getByRole("heading", {
        name: copy.errorHeading,
      }),
    ).toBeInTheDocument();

    rerender(
      <OrderDetailsScreen
        {...props}
        report={reportWith({ orderId: " " })}
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: copy.errorHeading,
      }),
    ).toBeInTheDocument();

    rerender(
      <OrderDetailsScreen
        {...props}
        state={"unknown" as never}
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: copy.errorHeading,
      }),
    ).toBeInTheDocument();
  });

  it.each([
    "order-secret-001",
    "line-secret-001",
    "line-secret-002",
    "update-secret-001",
    "update-secret-002",
  ])("does not render opaque ID %s", (id) => {
    renderScreen();

    expect(sourceText()).not.toContain(id);
  });

  it("ignores payment and URL identifiers outside the contract", () => {
    renderScreen({
      report: {
        ...defaultReport,
        paymentSessionId: "payment-secret",
        gatewaySessionId: "gateway-secret",
        transactionId: "transaction-secret",
        trackingUrl: "https://tracking.example",
        receiptUrl: "https://receipt.example",
      } as unknown as OrderDetailsReport,
    });

    expect(sourceText()).not.toContain(
      "payment-secret",
    );
    expect(sourceText()).not.toContain(
      "gateway-secret",
    );
    expect(sourceText()).not.toContain(
      "transaction-secret",
    );
    expect(sourceText()).not.toContain(
      "https://tracking.example",
    );
    expect(sourceText()).not.toContain(
      "https://receipt.example",
    );
  });
});

describe("line items", () => {
  it("preserves host order without sorting or filtering", () => {
    renderScreen();
    const cards = getLineItemCards();

    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent(
      "Gentle Foaming Cleanser",
    );
    expect(cards[1]).toHaveTextContent(
      "Invisible Shield SPF 50",
    );
  });

  it("preserves malformed entries in position with neutral fallbacks", () => {
    renderScreen({
      report: reportWith({
        items: [
          defaultReport.items[0],
          null,
          undefined,
          "unexpected",
          42,
          {
            lineItemId: "line-secret-after",
            productName: "Valid after",
            quantityLabel: "Host quantity: 1",
          },
        ] as unknown as OrderDetailsReport["items"],
      }),
    });

    const cards = getLineItemCards();

    expect(cards).toHaveLength(6);
    expect(cards[0]).toHaveTextContent(
      "Gentle Foaming Cleanser",
    );
    expect(cards[1]).toHaveTextContent(
      copy.unnamedProduct,
    );
    expect(cards[1]).toHaveTextContent(
      copy.quantityUnavailable,
    );
    expect(cards[4]).toHaveAttribute(
      "data-tone",
      "neutral",
    );
    expect(cards[5]).toHaveTextContent(
      "Valid after",
    );
    expect(sourceText()).not.toContain(
      "unexpected",
    );
    expect(sourceText()).not.toContain("42");
    expect(sourceText()).not.toContain(
      "line-secret-after",
    );
  });

  it("renders optional line labels only when usable", () => {
    renderScreen({
      report: reportWith({
        items: [
          {
            lineItemId: "line-secret-a",
            productName: "Optional labels",
            quantityLabel: "Host quantity",
            variantLabel: "  ",
            unitPriceLabel: "$10",
            lineTotalLabel: "$10",
          },
        ],
      }),
    });

    expect(
      screen.queryByText("Variant"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("$10")).toBeInTheDocument();
    expect(sourceText()).not.toContain(
      "line-secret-a",
    );
  });

  it("does not derive values from item labels", () => {
    renderScreen({
      report: reportWith({
        items: [
          {
            lineItemId: "line-secret-a",
            productName: "Arbitrary item",
            quantityLabel: "Host says several",
            unitPriceLabel: "$4.00",
            lineTotalLabel: "$11.00",
          },
        ],
        receipt: {
          totalLabel: "$99.00",
        },
      }),
    });

    expect(
      screen.getByText("Host says several"),
    ).toBeInTheDocument();
    expect(screen.getByText("$11.00")).toBeInTheDocument();
    expect(screen.getByText("$99.00")).toBeInTheDocument();
  });
});

describe("item images", () => {
  it("renders supplied URL and supplied alt text", () => {
    renderScreen();

    const image = screen.getByAltText(
      "Cleanser bottle",
    );
    expect(image).toHaveAttribute(
      "src",
      "https://example.test/cleanser.jpg",
    );
  });

  it("uses a safe alt fallback", () => {
    renderScreen({
      report: reportWith({
        items: [
          {
            ...defaultReport.items[0],
            imageAlt: " ",
          },
        ],
      }),
    });

    expect(
      screen.getByAltText(copy.itemImageAlt),
    ).toBeInTheDocument();
  });

  it.each([
    undefined,
    " ",
  ])("renders placeholder for missing URL %s", (imageUrl) => {
    renderScreen({
      report: reportWith({
        items: [
          {
            ...defaultReport.items[0],
            imageUrl,
          },
        ],
      }),
    });

    expect(
      screen.getByText(copy.itemImageUnavailable),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img"),
    ).not.toBeInTheDocument();
  });

  it("renders a local placeholder after image load failure without hiding the card", () => {
    renderScreen();
    fireEvent.error(
      screen.getByAltText("Cleanser bottle"),
    );

    expect(
      screen.getByText(copy.itemImageUnavailable),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Gentle Foaming Cleanser"),
    ).toBeInTheDocument();
  });

  it("tracks multiple failed previews independently across rerender", () => {
    const { rerender, props } = renderScreen();
    fireEvent.error(
      screen.getByAltText("Cleanser bottle"),
    );
    fireEvent.error(screen.getByAltText("SPF tube"));

    expect(
      screen.getAllByText(copy.itemImageUnavailable),
    ).toHaveLength(2);

    rerender(
      <OrderDetailsScreen
        {...props}
        isOffline
      />,
    );
    expect(
      screen.getAllByText(copy.itemImageUnavailable),
    ).toHaveLength(2);
  });

  it("allows a replacement URL to try again while another failed card stays local", () => {
    const { rerender, props } = renderScreen();
    fireEvent.error(
      screen.getByAltText("Cleanser bottle"),
    );
    fireEvent.error(screen.getByAltText("SPF tube"));

    rerender(
      <OrderDetailsScreen
        {...props}
        report={reportWith({
          items: [
            {
              ...defaultReport.items[0],
              imageUrl:
                "https://example.test/cleanser-new.jpg",
            },
            defaultReport.items[1],
          ],
        })}
      />,
    );

    expect(
      screen.getByAltText("Cleanser bottle"),
    ).toHaveAttribute(
      "src",
      "https://example.test/cleanser-new.jpg",
    );
    expect(
      screen.getAllByText(copy.itemImageUnavailable),
    ).toHaveLength(1);
  });

  it("isolates same-URL malformed cards by received position", () => {
    renderScreen({
      report: reportWith({
        items: [
          {
            lineItemId: "",
            productName: "Malformed A",
            quantityLabel: "Host quantity A",
            imageUrl: "https://example.test/shared.jpg",
            imageAlt: "Malformed A image",
          },
          {
            lineItemId: " ",
            productName: "Malformed B",
            quantityLabel: "Host quantity B",
            imageUrl: "https://example.test/shared.jpg",
            imageAlt: "Malformed B image",
          },
        ],
      }),
    });

    fireEvent.error(
      screen.getByAltText("Malformed A image"),
    );

    expect(
      screen.getAllByText(copy.itemImageUnavailable),
    ).toHaveLength(1);
    expect(
      screen.getByAltText("Malformed B image"),
    ).toBeInTheDocument();
  });

  it("isolates same-URL duplicated IDs by received position", () => {
    renderScreen({
      report: reportWith({
        items: [
          {
            lineItemId: "duplicate-id",
            productName: "Duplicate A",
            quantityLabel: "Host quantity A",
            imageUrl: "https://example.test/shared.jpg",
            imageAlt: "Duplicate A image",
          },
          {
            lineItemId: "duplicate-id",
            productName: "Duplicate B",
            quantityLabel: "Host quantity B",
            imageUrl: "https://example.test/shared.jpg",
            imageAlt: "Duplicate B image",
          },
        ],
      }),
    });

    fireEvent.error(
      screen.getByAltText("Duplicate A image"),
    );

    expect(
      screen.getAllByText(copy.itemImageUnavailable),
    ).toHaveLength(1);
    expect(
      screen.getByAltText("Duplicate B image"),
    ).toBeInTheDocument();
    expect(sourceText()).not.toContain(
      "duplicate-id",
    );
  });
});

describe("delivery address", () => {
  it("omits delivery address when absent", () => {
    renderScreen({
      report: reportWith({
        deliveryAddress: undefined,
      }),
    });

    expect(
      screen.queryByText(copy.deliveryHeading),
    ).not.toBeInTheDocument();
  });

  it("renders host recipient, address lines, and contact label in order", () => {
    renderScreen();
    const text = sourceText();

    expect(screen.getByText("Alex Taylor")).toBeInTheDocument();
    expect(text.indexOf("42 Test Street")).toBeLessThan(
      text.indexOf("Unit 7"),
    );
    expect(text.indexOf("Unit 7")).toBeLessThan(
      text.indexOf("Dubai"),
    );
    expect(
      screen.getByText("SMS updates enabled"),
    ).toBeInTheDocument();
  });

  it("uses safe delivery-address fallbacks", () => {
    renderScreen({
      report: reportWith({
        deliveryAddress: {
          recipientName: 42,
          addressLines: "bad",
          contactLabel: " ",
        } as unknown as OrderDetailsReport["deliveryAddress"],
      }),
    });

    expect(
      screen.getByText(copy.recipientUnavailable),
    ).toBeInTheDocument();
    expect(
      screen.getByText(copy.addressUnavailable),
    ).toBeInTheDocument();
  });

  it("omits whitespace address lines without reordering usable lines", () => {
    renderScreen({
      report: reportWith({
        deliveryAddress: {
          recipientName: "Maya Taylor",
          addressLines: [
            "Line one",
            " ",
            "Line two",
          ],
        },
      }),
    });
    const text = sourceText();

    expect(text.indexOf("Line one")).toBeLessThan(
      text.indexOf("Line two"),
    );
    expect(
      screen.queryByText(/^ $/),
    ).not.toBeInTheDocument();
  });
});

describe("shipping updates", () => {
  it.each([
    undefined,
    [],
    "bad",
  ])("renders no-update copy for %s", (shippingUpdates) => {
    renderScreen({
      report: reportWith({
        shippingUpdates:
          shippingUpdates as OrderDetailsReport["shippingUpdates"],
      }),
    });

    expect(
      screen.getByText(copy.noShippingUpdates),
    ).toBeInTheDocument();
  });

  it("preserves host update order without timestamp sorting", () => {
    renderScreen({
      report: reportWith({
        shippingUpdates: [
          {
            updateId: "update-late",
            statusLabel: "Later label first",
            timestampLabel: "June 9",
          },
          {
            updateId: "update-early",
            statusLabel: "Earlier label second",
            timestampLabel: "June 1",
          },
        ],
      }),
    });

    const cards = getUpdateCards();
    expect(cards[0]).toHaveTextContent(
      "Later label first",
    );
    expect(cards[1]).toHaveTextContent(
      "Earlier label second",
    );
    expect(sourceText()).not.toContain(
      "update-late",
    );
    expect(sourceText()).not.toContain(
      "update-early",
    );
  });

  it("preserves malformed entries with neutral fallback rows", () => {
    renderScreen({
      report: reportWith({
        shippingUpdates: [
          null,
          "bad",
          42,
          {
            updateId: "update-valid",
            statusLabel: "Host update",
            timestampLabel: "Host time",
            supporting: "Host supporting copy",
            tone: "unknown" as never,
          },
        ] as unknown as OrderDetailsReport["shippingUpdates"],
      }),
    });

    const cards = getUpdateCards();
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveTextContent(
      copy.updateUnavailable,
    );
    expect(cards[0]).toHaveTextContent(
      copy.timeUnavailable,
    );
    expect(cards[3]).toHaveAttribute(
      "data-tone",
      "neutral",
    );
    expect(cards[3]).toHaveTextContent(
      "Host supporting copy",
    );
    expect(sourceText()).not.toContain(
      "update-valid",
    );
  });

  it("renders supplied status tones without colour-only communication", () => {
    renderScreen();
    const cards = getUpdateCards();

    expect(cards[0]).toHaveAttribute(
      "data-tone",
      "neutral",
    );
    expect(cards[1]).toHaveAttribute(
      "data-tone",
      "attention",
    );
  });
});

describe("receipt summary", () => {
  it("omits receipt card when absent", () => {
    renderScreen({
      report: reportWith({ receipt: undefined }),
    });

    expect(
      screen.queryByText(copy.receiptHeading),
    ).not.toBeInTheDocument();
  });

  it("renders host receipt labels unchanged", () => {
    renderScreen();

    expect(screen.getByText("$82.00")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("$8.20")).toBeInTheDocument();
    expect(screen.getByText("$90.20")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
    expect(
      screen.getByText("Receipt available from host"),
    ).toBeInTheDocument();
  });

  it("uses a safe total fallback and does not derive values from items", () => {
    renderScreen({
      report: reportWith({
        receipt: {
          subtotalLabel: "$1",
          shippingLabel: "$2",
          taxLabel: "$3",
          totalLabel: "" as never,
        },
      }),
    });

    expect(
      screen.getByText(copy.totalUnavailable),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("$6"),
    ).not.toBeInTheDocument();
  });
});

describe("Back action", () => {
  it("requires explicit activation and does not run on render or rerender", () => {
    const onBack = vi.fn();
    const { rerender, props } = renderScreen({
      onBack,
    });

    expect(onBack).not.toHaveBeenCalled();

    rerender(
      <OrderDetailsScreen
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

  it("shows pending label, duplicate protection, and disables conflicting controls", () => {
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
    expect(
      screen.getByRole("button", {
        name: copy.backPending,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: copy.supportBlocked,
      }),
    ).toBeDisabled();
    pending.resolve();
  });

  it("keeps blocked Back visible and guards forced activation", () => {
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

  it("shows a toast after Back rejection", async () => {
    renderScreen({
      onBack: vi.fn().mockRejectedValue(
        new Error("fail"),
      ),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.back,
      }),
    );

    expect(
      await screen.findByText(copy.backError),
    ).toBeInTheDocument();
  });
});

describe("Support action", () => {
  it("passes only callback-owned order ID", () => {
    const onOpenSupport = vi.fn();
    renderScreen({ onOpenSupport });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openSupport,
      }),
    );

    expect(onOpenSupport).toHaveBeenCalledWith(
      defaultReport.orderId,
    );
    expect(onOpenSupport).toHaveBeenCalledTimes(1);
  });

  it("shows pending label and duplicate protection", () => {
    const pending = deferred();
    const onOpenSupport = vi.fn(
      () => pending.promise,
    );
    renderScreen({ onOpenSupport });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openSupport,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.supportPending,
      }),
    );

    expect(onOpenSupport).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", {
        name: copy.supportPending,
      }),
    ).toBeDisabled();
    pending.resolve();
  });

  it.each([
    {
      canOpenSupport: false,
      onOpenSupport: vi.fn(),
    },
    {
      canOpenSupport: true,
      onOpenSupport: undefined,
    },
  ])("renders blocked support and guards forced click", (overrides) => {
    const callback = overrides.onOpenSupport;
    renderScreen(overrides);

    const button = screen.getByRole("button", {
      name: copy.supportBlocked,
    });
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(callback).not.toHaveBeenCalled();
  });

  it("does not invoke support with malformed required report", () => {
    const onOpenSupport = vi.fn();
    renderScreen({
      report: reportWith({ orderId: "" }),
      onOpenSupport,
    });

    expect(
      screen.queryByRole("button", {
        name: copy.openSupport,
      }),
    ).not.toBeInTheDocument();
    expect(onOpenSupport).not.toHaveBeenCalled();
  });

  it("shows a toast after support rejection without external navigation", async () => {
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);
    renderScreen({
      onOpenSupport: vi.fn().mockRejectedValue(
        new Error("fail"),
      ),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openSupport,
      }),
    );

    expect(
      await screen.findByText(copy.supportError),
    ).toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
  });
});

describe("Receipt download action", () => {
  it("passes only callback-owned order ID", () => {
    const onDownloadReceipt = vi.fn();
    renderScreen({ onDownloadReceipt });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.downloadReceipt,
      }),
    );

    expect(onDownloadReceipt).toHaveBeenCalledWith(
      defaultReport.orderId,
    );
    expect(onDownloadReceipt).toHaveBeenCalledTimes(1);
  });

  it("shows pending label, duplicate protection, and success toast", async () => {
    const pending = deferred();
    const onDownloadReceipt = vi.fn(
      () => pending.promise,
    );
    renderScreen({ onDownloadReceipt });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.downloadReceipt,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: copy.receiptPending,
      }),
    );

    expect(onDownloadReceipt).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", {
        name: copy.receiptPending,
      }),
    ).toBeDisabled();
    pending.resolve();
    expect(
      await screen.findByText(copy.receiptSuccess),
    ).toBeInTheDocument();
  });

  it.each([
    {
      label: copy.receiptBlocked,
      overrides: {
        canDownloadReceipt: false,
      },
    },
    {
      label: copy.receiptBlocked,
      overrides: {
        onDownloadReceipt: undefined,
      },
    },
    {
      label: copy.receiptBlocked,
      overrides: {
        report: reportWith({
          receipt: undefined,
        }),
      },
    },
    {
      label: copy.receiptReconnect,
      overrides: {
        isOffline: true,
        isReceiptDownloadAvailableOffline:
          false,
      },
    },
  ])("renders guarded receipt block: $label", ({ label, overrides }) => {
    const onDownloadReceipt = vi.fn();
    renderScreen({
      onDownloadReceipt,
      ...overrides,
    });

    const button = screen.getByRole("button", {
      name: label,
    });
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onDownloadReceipt).not.toHaveBeenCalled();
  });

  it("lets general host block beat reconnect copy", () => {
    renderScreen({
      isOffline: true,
      canDownloadReceipt: false,
    });

    expect(
      screen.getByRole("button", {
        name: copy.receiptBlocked,
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", {
        name: copy.receiptReconnect,
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps receipt action visible when callback exists and receipt is absent", () => {
    renderScreen({
      report: reportWith({ receipt: undefined }),
      onDownloadReceipt: vi.fn(),
    });

    expect(
      screen.getByRole("button", {
        name: copy.receiptBlocked,
      }),
    ).toBeInTheDocument();
  });

  it("shows rejection toast and does not mutate the report", async () => {
    const report = reportWith();
    const snapshot = JSON.stringify(report);
    renderScreen({
      report,
      onDownloadReceipt: vi.fn().mockRejectedValue(
        new Error("fail"),
      ),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.downloadReceipt,
      }),
    );

    expect(
      await screen.findByText(copy.receiptError),
    ).toBeInTheDocument();
    expect(JSON.stringify(report)).toBe(snapshot);
  });
});

describe("Retry action", () => {
  it("renders retry only when supplied", () => {
    const { rerender, props } = renderScreen({
      state: "error",
      report: null,
      onRetryLoad: undefined,
    });

    expect(
      screen.queryByRole("button", {
        name: copy.retryLoad,
      }),
    ).not.toBeInTheDocument();

    rerender(
      <OrderDetailsScreen
        {...props}
        onRetryLoad={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: copy.retryLoad,
      }),
    ).toBeInTheDocument();
  });

  it("shows pending label, duplicate protection, and rejection toast", async () => {
    const onRetryLoad = vi
      .fn()
      .mockRejectedValue(new Error("fail"));
    renderScreen({
      state: "error",
      report: null,
      onRetryLoad,
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
    expect(
      await screen.findByText(copy.retryError),
    ).toBeInTheDocument();
  });
});

describe("empty item states", () => {
  it.each([
    {
      state: "empty" as const,
      report: reportWith({ items: [] }),
    },
    {
      state: "ready" as const,
      report: reportWith({ items: [] }),
    },
  ])("renders readable empty-items card for $state", (props) => {
    renderScreen(props);

    expect(
      screen.getByText(copy.emptyItemsHeading),
    ).toBeInTheDocument();
    expect(
      screen.getByText(copy.emptyItemsSupporting),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("alert"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("empty-order-items-card"),
    ).toHaveClass("bg-[var(--dl-surface-soft)]");
    expect(
      screen.getByRole("button", {
        name: copy.back,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: copy.openSupport,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(copy.receiptHeading),
    ).toBeInTheDocument();
  });
});

describe("async and StrictMode safety", () => {
  it("shows pending behavior under StrictMode", () => {
    const pending = deferred();
    const onOpenSupport = vi.fn(
      () => pending.promise,
    );

    render(
      <StrictMode>
        <OrderDetailsScreen
          {...defaultProps({
            onOpenSupport,
          })}
        />
      </StrictMode>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.openSupport,
      }),
    );

    expect(
      screen.getByRole("button", {
        name: copy.supportPending,
      }),
    ).toBeDisabled();
    pending.resolve();
  });

  it("shows toast recovery under StrictMode", async () => {
    render(
      <StrictMode>
        <OrderDetailsScreen
          {...defaultProps({
            onOpenSupport: vi
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
        name: copy.openSupport,
      }),
    );

    expect(
      await screen.findByText(copy.supportError),
    ).toBeInTheDocument();
  });

  it("does not call callbacks during rerender", () => {
    const props = defaultProps();
    const { rerender } = render(
      <OrderDetailsScreen {...props} />,
    );

    rerender(
      <OrderDetailsScreen
        {...props}
        isOffline
      />,
    );

    expect(props.onBack).not.toHaveBeenCalled();
    expect(props.onOpenSupport).not.toHaveBeenCalled();
    expect(props.onDownloadReceipt).not.toHaveBeenCalled();
    expect(props.onRetryLoad).not.toHaveBeenCalled();
  });
});

describe("architecture boundaries", () => {
  it("does not call fetch, storage, IndexedDB, cookies, or browser navigation", () => {
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
    const indexedDbDescriptor =
      Object.getOwnPropertyDescriptor(
        window,
        "indexedDB",
      );
    const originalCookie = document.cookie;
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);
    const beforeHref = window.location.href;

    vi.stubGlobal("fetch", fetchSpy);
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: indexedDbOpen },
    });

    try {
      renderScreen();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageSet).not.toHaveBeenCalled();
      expect(storageGet).not.toHaveBeenCalled();
      expect(indexedDbOpen).not.toHaveBeenCalled();
      expect(document.cookie).toBe(originalCookie);
      expect(window.location.href).toBe(beforeHref);
      expect(openSpy).not.toHaveBeenCalled();
    } finally {
      restoreDescriptor(
        window,
        "indexedDB",
        indexedDbDescriptor,
      );
    }
  });

  it("does not access geolocation, camera, picker, or FileReader APIs", () => {
    const mediaDescriptor =
      Object.getOwnPropertyDescriptor(
        navigator,
        "mediaDevices",
      );
    const geoDescriptor =
      Object.getOwnPropertyDescriptor(
        navigator,
        "geolocation",
      );
    const fileReaderDescriptor =
      Object.getOwnPropertyDescriptor(
        globalThis,
        "FileReader",
      );
    const getUserMedia = vi.fn();
    const getCurrentPosition = vi.fn();
    const FileReaderSpy = vi.fn();

    try {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: { getUserMedia },
      });
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: { getCurrentPosition },
      });
      Object.defineProperty(globalThis, "FileReader", {
        configurable: true,
        value: FileReaderSpy,
      });

      renderScreen();

      expect(getUserMedia).not.toHaveBeenCalled();
      expect(getCurrentPosition).not.toHaveBeenCalled();
      expect(FileReaderSpy).not.toHaveBeenCalled();
      expect(
        document.querySelector('input[type="file"]'),
      ).not.toBeInTheDocument();
    } finally {
      restoreDescriptor(
        navigator,
        "mediaDevices",
        mediaDescriptor,
      );
      restoreDescriptor(
        navigator,
        "geolocation",
        geoDescriptor,
      );
      restoreDescriptor(
        globalThis,
        "FileReader",
        fileReaderDescriptor,
      );
    }
  });

  it("renders no anchors, iframes, inputs, bottom navigation, or external seller copy", () => {
    renderScreen();
    const html = document.body.innerHTML.toLowerCase();
    const text = sourceText().toLowerCase();

    expect(document.querySelector("a")).not.toBeInTheDocument();
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
    expect(document.querySelector("input")).not.toBeInTheDocument();
    expect(document.querySelector("nav")).not.toBeInTheDocument();
    expect(text).not.toContain("affiliate");
    expect(text).not.toContain("marketplace");
    expect(text).not.toContain("external seller");
    expect(text).not.toContain("sponsored");
    expect(text).not.toContain("payment provider");
    expect(text).not.toContain("tracking is live");
    expect(text).not.toContain("guaranteed");
    expect(html).not.toContain("sage");
    expect(html).not.toContain("green");
    expect(html).not.toContain("blue");
  });

  it("does not infer delivery, delay, status, or receipt outcomes", () => {
    renderScreen();
    const text = sourceText().toLowerCase();

    expect(text).not.toContain("on time");
    expect(text).not.toContain("delayed");
    expect(text).not.toContain("has shipped");
    expect(text).not.toContain("downloaded");
    expect(text).not.toContain("ticket was created");
  });
});
