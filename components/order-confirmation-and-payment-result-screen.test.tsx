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
import OrderConfirmationAndPaymentResultScreen, {
  copy,
  formatCartItemCount,
  getPaymentResultActionSubmission,
  getPrimaryActionKind,
  getPrimaryActionLabel,
  getSafeOptionalDisplayText,
  getStatusHeading,
  getStatusLabel,
  getStatusSupportingCopy,
  hasRequiredPaymentResultMetadata,
  isKnownPaymentStatus,
  normaliseNonNegativeInteger,
  type OrderConfirmationAndPaymentResultScreenProps,
  type OrderPaymentResultReport,
} from "./order-confirmation-and-payment-result-screen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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

const confirmedReport: OrderPaymentResultReport = {
  checkoutSessionId: "checkout-opaque-1",
  reviewId: "review-opaque-1",
  paymentResultId: "result-opaque-1",
  paymentStatus: "confirmed",
  orderId: "order-opaque-1",
  orderReferenceLabel: "DL-2048",
  itemCount: 2,
  totalLabel: "AED 180",
  providerLabel: "SecurePay",
  confirmedAtLabel: "3 June 2026, 10:45",
  deliverySummaryLabel: "Deliver to home address",
  estimatedDeliveryLabel: "Estimated delivery: 2–4 business days",
  hostStatusHelperLabel: "A receipt will be available in your order details.",
};

const pendingReport: OrderPaymentResultReport = {
  ...confirmedReport,
  paymentStatus: "pending",
  orderId: undefined,
  orderReferenceLabel: undefined,
  confirmedAtLabel: undefined,
  hostStatusHelperLabel: "Payment confirmation can take a few moments.",
};

const failedReport: OrderPaymentResultReport = {
  ...pendingReport,
  paymentStatus: "failed",
  hostStatusHelperLabel: "No order was placed from this attempt.",
};

const cancelledReport: OrderPaymentResultReport = {
  ...pendingReport,
  paymentStatus: "cancelled",
  hostStatusHelperLabel: "You left the secure payment page before completion.",
};

function reportWith(
  overrides: Partial<OrderPaymentResultReport> = {},
): OrderPaymentResultReport {
  return { ...confirmedReport, ...overrides };
}

function defaultProps(
  overrides: Partial<OrderConfirmationAndPaymentResultScreenProps> = {},
): OrderConfirmationAndPaymentResultScreenProps {
  return {
    state: "ready",
    report: confirmedReport,
    onViewOrder: vi.fn(),
    onRefreshStatus: vi.fn(),
    onRetryPayment: vi.fn(),
    onContinueShopping: vi.fn(),
    onBackToReview: vi.fn(),
    onRetryLoad: vi.fn(),
    ...overrides,
  };
}

function renderScreen(
  overrides: Partial<OrderConfirmationAndPaymentResultScreenProps> = {},
) {
  const props = defaultProps(overrides);
  const view = render(
    <OrderConfirmationAndPaymentResultScreen {...props} />,
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

describe("defensive helpers", () => {
  it.each([
    [-1, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [Number.NEGATIVE_INFINITY, 0],
    [2.9, 2],
    [3, 3],
  ])("normalises %s to %s", (input, expected) => {
    expect(normaliseNonNegativeInteger(input)).toBe(expected);
  });

  it.each([
    [1, "1 item"],
    [2, "2 items"],
    [-1, "0 items"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatCartItemCount(input)).toBe(expected);
  });

  it.each(["confirmed", "pending", "failed", "cancelled"])(
    "accepts known payment status %s",
    (status) => {
      expect(isKnownPaymentStatus(status)).toBe(true);
    },
  );

  it.each(["unknown", "", null, undefined, 4, {}])(
    "rejects unknown runtime status %s",
    (status) => {
      expect(isKnownPaymentStatus(status)).toBe(false);
    },
  );

  it("trims safe optional display text", () => {
    expect(getSafeOptionalDisplayText("  SecurePay  ")).toBe("SecurePay");
  });

  it.each([
    "https://payments.example.com",
    "//payments.example.com",
    "javascript:alert(1)",
    "data:text/plain,test",
    "mailto:test@example.com",
    "tel:+971500000000",
    "   ",
  ])("omits unsafe optional label %s", (value) => {
    expect(getSafeOptionalDisplayText(value)).toBeNull();
  });

  it("omits non-string optional labels", () => {
    expect(getSafeOptionalDisplayText({ label: "SecurePay" })).toBeNull();
  });

  it("requires an order ID for confirmed metadata", () => {
    expect(
      hasRequiredPaymentResultMetadata(
        reportWith({ orderId: undefined }),
      ),
    ).toBe(false);
  });

  it("requires an order reference for confirmed metadata", () => {
    expect(
      hasRequiredPaymentResultMetadata(
        reportWith({ orderReferenceLabel: " " }),
      ),
    ).toBe(false);
  });

  it("does not require an order ID for pending metadata", () => {
    expect(hasRequiredPaymentResultMetadata(pendingReport)).toBe(true);
  });

  it.each([
    ["checkoutSessionId", ""],
    ["reviewId", " "],
    ["paymentResultId", null],
    ["totalLabel", 42],
  ])("rejects unreadable required metadata %s", (field, value) => {
    expect(
      hasRequiredPaymentResultMetadata({
        ...pendingReport,
        [field]: value,
      } as OrderPaymentResultReport),
    ).toBe(false);
  });

  it("rejects zero-item reports", () => {
    expect(
      hasRequiredPaymentResultMetadata(
        reportWith({ itemCount: 0 }),
      ),
    ).toBe(false);
  });

  it("builds an opaque submission without inventing an order ID", () => {
    expect(getPaymentResultActionSubmission(pendingReport)).toEqual({
      checkoutSessionId: pendingReport.checkoutSessionId,
      reviewId: pendingReport.reviewId,
      paymentResultId: pendingReport.paymentResultId,
      orderId: undefined,
    });
  });
});

describe("status helpers", () => {
  it.each([
    ["confirmed", copy.confirmedHeading, copy.confirmedSupporting, copy.confirmedStatus],
    ["pending", copy.pendingHeading, copy.pendingSupporting, copy.pendingStatus],
    ["failed", copy.failedHeading, copy.failedSupporting, copy.failedStatus],
    ["cancelled", copy.cancelledHeading, copy.cancelledSupporting, copy.cancelledStatus],
  ] as const)("maps %s status presentation", (status, heading, supporting, label) => {
    expect(getStatusHeading(status)).toBe(heading);
    expect(getStatusSupportingCopy(status)).toBe(supporting);
    expect(getStatusLabel(status)).toBe(label);
  });

  it.each([
    [confirmedReport, true, true, "view-order"],
    [confirmedReport, true, false, "continue-shopping"],
    [confirmedReport, false, true, "continue-shopping"],
    [pendingReport, true, true, "refresh-status"],
    [failedReport, true, true, "retry-payment"],
    [cancelledReport, true, true, "retry-payment"],
  ] as const)("selects primary action %s", (report, canViewOrder, hasAdapter, expected) => {
    expect(getPrimaryActionKind({ canViewOrder, hasViewOrderAdapter: hasAdapter, report })).toBe(expected);
  });

  it.each([
    ["view-order", false, true, true, false, copy.reconnectViewOrder],
    ["view-order", false, true, true, true, copy.orderUnavailable],
    ["refresh-status", true, false, true, false, copy.reconnectCheckStatus],
    ["refresh-status", true, false, true, true, copy.statusUnavailable],
    ["retry-payment", true, true, false, false, copy.reconnectRetry],
    ["retry-payment", true, true, false, true, copy.retryUnavailable],
  ] as const)("renders blocked label for %s", (kind, canViewOrder, canRefreshStatus, canRetryPayment, online, expected) => {
    expect(
      getPrimaryActionLabel({
        activeOperation: null,
        canRefreshStatus,
        canRetryPayment,
        canViewOrder,
        hasRefreshStatusAdapter: true,
        hasRetryPaymentAdapter: true,
        isOffline: !online,
        kind,
      }),
    ).toBe(expected);
  });
});

describe("core states", () => {
  it("renders loading heading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByRole("heading", { name: copy.loadingHeading })).toBeInTheDocument();
  });

  it("uses a polite loading live region without buttons", () => {
    renderScreen({ state: "loading", report: null });
    const loading = screen.getByText(copy.loadingSupporting).closest('[role="status"]');
    expect(loading).toHaveAttribute("aria-live", "polite");
    expect(within(loading as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders confirmed result", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: copy.confirmedHeading })).toBeInTheDocument();
    expect(screen.getByText(copy.confirmedSupporting)).toBeInTheDocument();
    expect(screen.getByText(copy.confirmedStatus)).toBeInTheDocument();
  });

  it.each([
    [pendingReport, copy.pendingHeading],
    [failedReport, copy.failedHeading],
    [cancelledReport, copy.cancelledHeading],
  ])("renders %s status outcome", (report, heading) => {
    renderScreen({ report });
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("falls back to error without a ready payload", () => {
    renderScreen({ report: null });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("falls back to error for invalid metadata", () => {
    renderScreen({ report: reportWith({ itemCount: 0 }) });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("falls back to error for an unknown runtime status", () => {
    renderScreen({
      report: {
        ...pendingReport,
        paymentStatus: "unknown" as never,
      },
    });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("renders a static error alert without buttons", () => {
    renderScreen({ state: "error", report: null });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(copy.errorHeading);
    expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders retry-load only when supplied", () => {
    const { rerender, props } = renderScreen({ state: "error", report: null, onRetryLoad: undefined });
    expect(screen.queryByRole("button", { name: copy.retryLoad })).not.toBeInTheDocument();
    rerender(<OrderConfirmationAndPaymentResultScreen {...props} onRetryLoad={vi.fn()} />);
    expect(screen.getByRole("button", { name: copy.retryLoad })).toBeInTheDocument();
  });
});

describe("confirmed result", () => {
  it("renders host labels safely", () => {
    renderScreen();
    expect(screen.getByText(confirmedReport.orderReferenceLabel as string)).toBeInTheDocument();
    expect(screen.getByText(confirmedReport.providerLabel as string)).toBeInTheDocument();
    expect(screen.getByText(confirmedReport.confirmedAtLabel as string)).toBeInTheDocument();
    expect(screen.getByText(confirmedReport.deliverySummaryLabel as string)).toBeInTheDocument();
    expect(screen.getByText(confirmedReport.estimatedDeliveryLabel as string)).toBeInTheDocument();
    expect(screen.getByText(confirmedReport.hostStatusHelperLabel as string)).toBeInTheDocument();
  });

  it("invokes View Order with orderId", () => {
    const onViewOrder = vi.fn();
    renderScreen({ onViewOrder });
    fireEvent.click(screen.getByRole("button", { name: copy.viewOrder }));
    expect(onViewOrder).toHaveBeenCalledWith(confirmedReport.orderId);
  });

  it("falls back to Continue Shopping without a view-order adapter", () => {
    renderScreen({ onViewOrder: undefined });
    expect(screen.getByRole("button", { name: copy.continueShopping })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.viewOrder })).not.toBeInTheDocument();
  });

  it("falls back to Continue Shopping when order route is blocked", () => {
    renderScreen({ canViewOrder: false });
    expect(screen.getByRole("button", { name: copy.continueShopping })).toBeInTheDocument();
  });

  it("shows toast when View Order rejects", async () => {
    renderScreen({ onViewOrder: vi.fn().mockRejectedValue(new Error("fail")) });
    fireEvent.click(screen.getByRole("button", { name: copy.viewOrder }));
    expect(await screen.findByText(copy.viewOrderError)).toBeInTheDocument();
  });

  it("does not use green confirmed styling", () => {
    renderScreen();
    expect(document.body.innerHTML.toLowerCase()).not.toContain("green");
  });
});

describe("pending result", () => {
  it("renders duplicate-payment warning as status", () => {
    renderScreen({ report: pendingReport });
    const warning = screen.getByText(copy.pendingSafety).closest('[role="status"]');
    expect(warning).toBeInTheDocument();
  });

  it("does not render payment retry", () => {
    renderScreen({ report: pendingReport });
    expect(screen.queryByRole("button", { name: copy.retryPayment })).not.toBeInTheDocument();
  });

  it("invokes status refresh with opaque context", () => {
    const onRefreshStatus = vi.fn();
    renderScreen({ report: pendingReport, onRefreshStatus });
    fireEvent.click(screen.getByRole("button", { name: copy.checkStatus }));
    expect(onRefreshStatus).toHaveBeenCalledWith(getPaymentResultActionSubmission(pendingReport));
  });

  it.each([
    [true, copy.reconnectCheckStatus],
    [false, copy.statusUnavailable],
  ])("renders blocked refresh label", (isOffline, label) => {
    renderScreen({ report: pendingReport, canRefreshStatus: false, isOffline });
    expect(screen.getByRole("button", { name: label })).toBeDisabled();
  });

  it("keeps pending summary visible after refresh rejection", async () => {
    renderScreen({ report: pendingReport, onRefreshStatus: vi.fn().mockRejectedValue(new Error("fail")) });
    fireEvent.click(screen.getByRole("button", { name: copy.checkStatus }));
    expect(await screen.findByText(copy.refreshStatusError)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: copy.pendingHeading })).toBeInTheDocument();
  });
});

describe("failed and cancelled results", () => {
  it.each([
    [failedReport, copy.failedHeading],
    [cancelledReport, copy.cancelledHeading],
  ])("renders retry route for %s", (report, heading) => {
    renderScreen({ report });
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.retryPayment })).toBeInTheDocument();
  });

  it("invokes retry-payment with opaque context", () => {
    const onRetryPayment = vi.fn();
    renderScreen({ report: failedReport, onRetryPayment });
    fireEvent.click(screen.getByRole("button", { name: copy.retryPayment }));
    expect(onRetryPayment).toHaveBeenCalledWith(getPaymentResultActionSubmission(failedReport));
  });

  it.each([
    [true, copy.reconnectRetry],
    [false, copy.retryUnavailable],
  ])("renders blocked retry label", (isOffline, label) => {
    renderScreen({ report: failedReport, canRetryPayment: false, isOffline });
    expect(screen.getByRole("button", { name: label })).toBeDisabled();
  });

  it.each([failedReport, cancelledReport])("renders optional Back to Review for corrective status", (report) => {
    renderScreen({ report });
    expect(screen.getAllByRole("button", { name: copy.backToReview }).length).toBeGreaterThan(0);
  });

  it("omits footer Back to Review for confirmed status", () => {
    renderScreen();
    expect(screen.getAllByRole("button", { name: copy.backToReview })).toHaveLength(1);
  });
});

describe("summary and safe visible copy", () => {
  it("renders normalised item count and unchanged total", () => {
    renderScreen({ report: reportWith({ itemCount: 2.9, totalLabel: "AED 180" }) });
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByText("AED 180")).toBeInTheDocument();
  });

  it.each([
    "checkout-opaque-1",
    "review-opaque-1",
    "result-opaque-1",
    "order-opaque-1",
  ])("never renders opaque ID %s", (id) => {
    renderScreen();
    expect(sourceText()).not.toContain(id);
  });

  it("omits optional raw URL label", () => {
    renderScreen({ report: reportWith({ providerLabel: "https://provider.example" }) });
    expect(sourceText()).not.toContain("https://provider.example");
  });

  it("omits empty optional labels", () => {
    renderScreen({ report: reportWith({ providerLabel: " ", deliverySummaryLabel: " ", estimatedDeliveryLabel: " " }) });
    expect(screen.queryByText(copy.provider)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.deliveryHeading)).not.toBeInTheDocument();
  });

  it("always renders payment-boundary note", () => {
    renderScreen({ report: failedReport });
    expect(screen.getByText(copy.paymentBoundary)).toBeInTheDocument();
  });
});

describe("async safety", () => {
  it.each([
    [confirmedReport, "onViewOrder", copy.viewOrder],
    [pendingReport, "onRefreshStatus", copy.checkStatus],
    [failedReport, "onRetryPayment", copy.retryPayment],
  ] as const)("prevents duplicate %s activation", async (report, callbackName, buttonName) => {
    const pending = deferred();
    const callback = vi.fn(() => pending.promise);
    const overrides = { report, [callbackName]: callback } as Partial<OrderConfirmationAndPaymentResultScreenProps>;
    renderScreen(overrides);
    const button = screen.getByRole("button", { name: buttonName });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(callback).toHaveBeenCalledTimes(1);
    pending.resolve();
  });

  it("prevents duplicate Continue Shopping activation", async () => {
    const pending = deferred();
    const onContinueShopping = vi.fn(() => pending.promise);
    renderScreen({ onViewOrder: undefined, onContinueShopping });
    const button = screen.getByRole("button", { name: copy.continueShopping });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onContinueShopping).toHaveBeenCalledTimes(1);
    pending.resolve();
  });

  it("prevents duplicate Back-to-Review activation", async () => {
    const pending = deferred();
    const onBackToReview = vi.fn(() => pending.promise);
    renderScreen({ report: failedReport, onBackToReview });
    const buttons = screen.getAllByRole("button", { name: copy.backToReview });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[0]);
    expect(onBackToReview).toHaveBeenCalledTimes(1);
    pending.resolve();
  });

  it("disables conflicting actions while pending", () => {
    const pending = deferred();
    renderScreen({ report: failedReport, onRetryPayment: vi.fn(() => pending.promise) });
    fireEvent.click(screen.getByRole("button", { name: copy.retryPayment }));
    expect(screen.getByRole("button", { name: copy.preparingRetry })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.continueShopping })).toBeDisabled();
    pending.resolve();
  });

  it("renders pending feedback under StrictMode", () => {
    const pending = deferred();
    render(
      <StrictMode>
        <OrderConfirmationAndPaymentResultScreen
          {...defaultProps({ report: pendingReport, onRefreshStatus: vi.fn(() => pending.promise) })}
        />
      </StrictMode>,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.checkStatus }));
    expect(screen.getByRole("button", { name: copy.checkingStatus })).toBeDisabled();
    pending.resolve();
  });

  it("renders toast recovery under StrictMode", async () => {
    render(
      <StrictMode>
        <OrderConfirmationAndPaymentResultScreen
          {...defaultProps({ report: pendingReport, onRefreshStatus: vi.fn().mockRejectedValue(new Error("fail")) })}
        />
      </StrictMode>,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.checkStatus }));
    expect(await screen.findByText(copy.refreshStatusError)).toBeInTheDocument();
  });
});

describe("explicit user activation", () => {
  it.each([
    confirmedReport,
    pendingReport,
    failedReport,
    cancelledReport,
  ])("does not invoke callbacks while rendering %s", (report) => {
    const props = defaultProps({ report });
    render(<OrderConfirmationAndPaymentResultScreen {...props} />);
    expect(props.onViewOrder).not.toHaveBeenCalled();
    expect(props.onRefreshStatus).not.toHaveBeenCalled();
    expect(props.onRetryPayment).not.toHaveBeenCalled();
    expect(props.onContinueShopping).not.toHaveBeenCalled();
    expect(props.onBackToReview).not.toHaveBeenCalled();
  });

  it("does not invoke callbacks after rerender", () => {
    const { rerender, props } = renderScreen({ report: pendingReport });
    rerender(<OrderConfirmationAndPaymentResultScreen {...props} report={confirmedReport} />);
    expect(props.onRefreshStatus).not.toHaveBeenCalled();
    expect(props.onViewOrder).not.toHaveBeenCalled();
  });

  it("does not invoke callbacks during loading-to-ready transition", () => {
    const props = defaultProps({ state: "loading", report: null });
    const { rerender } = render(<OrderConfirmationAndPaymentResultScreen {...props} />);
    rerender(<OrderConfirmationAndPaymentResultScreen {...props} state="ready" report={pendingReport} />);
    expect(props.onRefreshStatus).not.toHaveBeenCalled();
  });

  it("does not add visibility or focus refresh listeners", () => {
    const documentSpy = vi.spyOn(document, "addEventListener");
    const windowSpy = vi.spyOn(window, "addEventListener");
    renderScreen({ report: pendingReport });
    expect(documentSpy.mock.calls.some(([type]) => type === "visibilitychange")).toBe(false);
    expect(windowSpy.mock.calls.some(([type]) => type === "focus")).toBe(false);
  });
});

describe("navigation and toast positioning", () => {
  it("invokes Continue Shopping", () => {
    const onContinueShopping = vi.fn();
    renderScreen({ onContinueShopping });
    fireEvent.click(screen.getByRole("button", { name: copy.continueShopping }));
    expect(onContinueShopping).toHaveBeenCalledTimes(1);
  });

  it("invokes Back to Review", () => {
    const onBackToReview = vi.fn();
    renderScreen({ onBackToReview });
    fireEvent.click(screen.getByRole("button", { name: copy.backToReview }));
    expect(onBackToReview).toHaveBeenCalledTimes(1);
  });

  it("invokes Retry Load", () => {
    const onRetryLoad = vi.fn();
    renderScreen({ state: "error", report: null, onRetryLoad });
    fireEvent.click(screen.getByRole("button", { name: copy.retryLoad }));
    expect(onRetryLoad).toHaveBeenCalledTimes(1);
  });

  it("positions confirmed rejection toast above compact footer", async () => {
    renderScreen({ onViewOrder: vi.fn().mockRejectedValue(new Error("fail")) });
    fireEvent.click(screen.getByRole("button", { name: copy.viewOrder }));
    await screen.findByText(copy.viewOrderError);
    expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_180px)]");
  });

  it("positions failed rejection toast above expanded footer", async () => {
    renderScreen({ report: failedReport, onRetryPayment: vi.fn().mockRejectedValue(new Error("fail")) });
    fireEvent.click(screen.getByRole("button", { name: copy.retryPayment }));
    await screen.findByText(copy.retryPaymentError);
    expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_225px)]");
  });

  it("positions error-state rejection toast at bottom safe area", async () => {
    renderScreen({ state: "error", report: null, onRetryLoad: vi.fn().mockRejectedValue(new Error("fail")) });
    fireEvent.click(screen.getByRole("button", { name: copy.retryLoad }));
    await screen.findByText(copy.retryLoadError);
    expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[max(24px,env(safe-area-inset-bottom))]");
  });
});



describe("additional contract coverage", () => {
  it("falls back to error when confirmed report is missing an order ID", () => {
    renderScreen({ report: reportWith({ orderId: undefined }) });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("falls back to error when confirmed report is missing an order reference", () => {
    renderScreen({ report: reportWith({ orderReferenceLabel: undefined }) });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("omits a host status note containing a raw URL", () => {
    renderScreen({ report: reportWith({ hostStatusHelperLabel: "https://status.example" }) });
    expect(sourceText()).not.toContain("https://status.example");
    expect(screen.queryByText(copy.hostStatusNote)).not.toBeInTheDocument();
  });

  it("omits the delivery card when both delivery labels are absent", () => {
    renderScreen({ report: reportWith({ deliverySummaryLabel: undefined, estimatedDeliveryLabel: undefined }) });
    expect(screen.queryByText(copy.deliveryHeading)).not.toBeInTheDocument();
  });

  it("shows retry-load pending feedback", () => {
    const pending = deferred();
    renderScreen({ state: "error", report: null, onRetryLoad: vi.fn(() => pending.promise) });
    fireEvent.click(screen.getByRole("button", { name: copy.retryLoad }));
    expect(screen.getByRole("button", { name: copy.retryingLoad })).toBeDisabled();
    pending.resolve();
  });

  it("shows retry-load rejection feedback", async () => {
    renderScreen({ state: "error", report: null, onRetryLoad: vi.fn().mockRejectedValue(new Error("fail")) });
    fireEvent.click(screen.getByRole("button", { name: copy.retryLoad }));
    expect(await screen.findByText(copy.retryLoadError)).toBeInTheDocument();
  });

  it("restores controls after a refresh rejection", async () => {
    renderScreen({ report: pendingReport, onRefreshStatus: vi.fn().mockRejectedValue(new Error("fail")) });
    fireEvent.click(screen.getByRole("button", { name: copy.checkStatus }));
    expect(await screen.findByText(copy.refreshStatusError)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.checkStatus })).toBeEnabled();
  });

  it("does not invoke callbacks when the host status changes", () => {
    const props = defaultProps({ report: pendingReport });
    const { rerender } = render(<OrderConfirmationAndPaymentResultScreen {...props} />);
    rerender(<OrderConfirmationAndPaymentResultScreen {...props} report={failedReport} />);
    expect(props.onRefreshStatus).not.toHaveBeenCalled();
    expect(props.onRetryPayment).not.toHaveBeenCalled();
  });

  it("renders no external anchors", () => {
    renderScreen();
    expect(document.querySelector("a")).not.toBeInTheDocument();
  });

  it("renders no payment, bank-account, file, or wallet inputs", () => {
    renderScreen();
    expect(document.querySelector("input")).not.toBeInTheDocument();
    expect(sourceText()).not.toContain("Apple Pay");
    expect(sourceText()).not.toContain("Google Pay");
  });

  it("does not call fetch", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    try {
      renderScreen();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("does not write to local or session storage", () => {
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    renderScreen();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it("does not redirect or mutate location on render", () => {
    const before = window.location.href;
    renderScreen({ report: pendingReport });
    expect(window.location.href).toBe(before);
  });

  it("renders no promo-code UI, fake steps, or bottom navigation", () => {
    renderScreen();
    const text = sourceText().toLowerCase();
    expect(text).not.toContain("promo code");
    expect(text).not.toContain("step 1");
    expect(document.querySelector("nav")).not.toBeInTheDocument();
  });
});

describe("architecture boundary", () => {
  it("does not expose raw gateway URL props or rendered URLs", () => {
    renderScreen({ report: reportWith({ providerLabel: "https://raw.example" }) });
    expect(sourceText()).not.toContain("https://raw.example");
    expect(document.querySelector("a")).not.toBeInTheDocument();
  });

  it("does not call window.open or mutate location", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderScreen({ report: pendingReport });
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("renders no payment fields, iframe, file input, or video", () => {
    renderScreen();
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument();
    expect(document.querySelector("video")).not.toBeInTheDocument();
    expect(document.querySelector("input")).not.toBeInTheDocument();
  });

  it("does not use polling or browser refresh listeners", () => {
    const intervalSpy = vi.spyOn(window, "setInterval");
    const documentSpy = vi.spyOn(document, "addEventListener");
    const windowSpy = vi.spyOn(window, "addEventListener");
    renderScreen({ report: pendingReport });
    expect(intervalSpy).not.toHaveBeenCalled();
    expect(documentSpy.mock.calls.some(([type]) => type === "visibilitychange")).toBe(false);
    expect(windowSpy.mock.calls.some(([type]) => type === "focus")).toBe(false);
  });

  it("does not access camera or geolocation and restores descriptors", () => {
    const mediaDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
    const geoDescriptor = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    const getUserMedia = vi.fn();
    const getCurrentPosition = vi.fn();

    try {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: { getUserMedia },
      });
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: { getCurrentPosition },
      });
      renderScreen();
      expect(getUserMedia).not.toHaveBeenCalled();
      expect(getCurrentPosition).not.toHaveBeenCalled();
    } finally {
      restoreDescriptor(navigator, "mediaDevices", mediaDescriptor);
      restoreDescriptor(navigator, "geolocation", geoDescriptor);
    }

    expect(Object.getOwnPropertyDescriptor(navigator, "mediaDevices")).toEqual(mediaDescriptor);
    expect(Object.getOwnPropertyDescriptor(navigator, "geolocation")).toEqual(geoDescriptor);
  });

  it("contains no restricted account, commerce, or navigation copy", () => {
    renderScreen();
    const text = sourceText().toLowerCase();
    expect(text).not.toContain("promo code");
    expect(text).not.toContain("affiliate");
    expect(text).not.toContain("marketplace");
    expect(text).not.toContain("sign in required");
    expect(text).not.toContain("account required");
    expect(document.querySelector("nav")).not.toBeInTheDocument();
  });
});


describe("refined footer pending feedback and visible-label safety", () => {
  it("scopes Continue Shopping pending feedback to the secondary control", () => {
    const pending = deferred();
    renderScreen({
      onContinueShopping: vi.fn(() => pending.promise),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: copy.continueShopping,
      }),
    );

    expect(
      screen.getByRole("button", {
        name: copy.returningToStore,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: copy.viewOrder,
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", {
        name: copy.returningToStore,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: copy.openingOrder,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen
        .getByRole("button", {
          name: copy.viewOrder,
        })
        .querySelector("svg"),
    ).not.toBeInTheDocument();

    pending.resolve();
  });

  it("scopes Back to Review pending feedback to the activated footer control", () => {
    const pending = deferred();
    renderScreen({
      report: failedReport,
      onBackToReview: vi.fn(() => pending.promise),
    });

    const backButtons = screen.getAllByRole("button", {
      name: copy.backToReview,
    });

    fireEvent.click(backButtons[backButtons.length - 1]);

    expect(
      screen.getAllByRole("button", {
        name: copy.openingReview,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", {
        name: copy.retryPayment,
      }),
    ).toBeDisabled();
    expect(
      screen
        .getByRole("button", {
          name: copy.retryPayment,
        })
        .querySelector("svg"),
    ).not.toBeInTheDocument();

    pending.resolve();
  });

  it("fails closed with a readable status label when the refresh adapter is missing", () => {
    renderScreen({
      report: pendingReport,
      onRefreshStatus: undefined,
    });

    expect(
      screen.getByRole("button", {
        name: copy.statusUnavailable,
      }),
    ).toBeDisabled();
  });

  it("fails closed with a readable retry label when the payment-retry adapter is missing", () => {
    renderScreen({
      report: failedReport,
      onRetryPayment: undefined,
    });

    expect(
      screen.getByRole("button", {
        name: copy.retryUnavailable,
      }),
    ).toBeDisabled();
  });

  it("allows safe plain-domain display text", () => {
    renderScreen({
      report: reportWith({
        providerLabel: "payments.example.com",
      }),
    });

    expect(
      screen.getByText("payments.example.com"),
    ).toBeInTheDocument();
  });

  it.each([
    "View details at https://payments.example.com/session/secret",
    "payments.example.com/session/secret",
    "payments.example.com?token=secret",
    "payments.example.com#result",
    "payments.example.com\\session\\secret",
  ])("omits unsafe optional display text %s", (unsafeLabel) => {
    renderScreen({
      report: reportWith({
        hostStatusHelperLabel: unsafeLabel,
      }),
    });

    expect(sourceText()).not.toContain(unsafeLabel);
  });

  it("rejects an unsafe confirmed order-reference label", () => {
    renderScreen({
      report: reportWith({
        orderReferenceLabel:
          "payments.example.com/session/secret",
      }),
    });

    expect(
      screen.getByRole("heading", {
        name: copy.errorHeading,
      }),
    ).toBeInTheDocument();
  });

  it("rejects an unsafe total label", () => {
    renderScreen({
      report: reportWith({
        totalLabel:
          "payments.example.com?token=secret",
      }),
    });

    expect(
      screen.getByRole("heading", {
        name: copy.errorHeading,
      }),
    ).toBeInTheDocument();
  });

  it("renders a safe total label after trimming surrounding whitespace", () => {
    renderScreen({
      report: reportWith({
        totalLabel: "  AED 180  ",
      }),
    });

    expect(screen.getByText("AED 180")).toBeInTheDocument();
    expect(sourceText()).not.toContain("  AED 180  ");
  });

  it("returns action-scoped labels from the exported helper", () => {
    expect(
      getPrimaryActionLabel({
        activeOperation: "continue-shopping",
        canRefreshStatus: true,
        canRetryPayment: true,
        canViewOrder: true,
        hasRefreshStatusAdapter: true,
        hasRetryPaymentAdapter: true,
        isOffline: false,
        kind: "view-order",
      }),
    ).toBe(copy.viewOrder);

    expect(
      getPrimaryActionLabel({
        activeOperation: "continue-shopping",
        canRefreshStatus: true,
        canRetryPayment: true,
        canViewOrder: true,
        hasRefreshStatusAdapter: true,
        hasRetryPaymentAdapter: true,
        isOffline: false,
        kind: "continue-shopping",
      }),
    ).toBe(copy.returningToStore);
  });
});
