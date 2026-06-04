import "@testing-library/jest-dom/vitest";
import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SecurePaymentGatewayHandoffScreen, {
  canOpenPreparedGateway,
  copy,
  formatCartItemCount,
  getGatewayButtonLabel,
  getSafeDestinationDisplayLabel,
  hasGatewayBlockReason,
  hasRequiredGatewayMetadata,
  isGatewaySessionExpired,
  normaliseNonNegativeInteger,
  type SecurePaymentGatewayHandoffReport,
  type SecurePaymentGatewayHandoffScreenProps,
} from "./secure-payment-gateway-handoff-screen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function reportWith(
  overrides: Partial<SecurePaymentGatewayHandoffReport> = {},
): SecurePaymentGatewayHandoffReport {
  return {
    checkoutSessionId: "checkout-1",
    reviewId: "review-1",
    paymentSessionId: "payment-session-secret-1",
    sessionStatus: "ready",
    blockReason: null,
    orderReferenceLabel: "Order DL-2048",
    itemCount: 3,
    totalLabel: "AED 190",
    providerLabel: "Secure payment partner",
    destinationDisplayLabel: "Hosted secure checkout",
    sessionExpiryLabel: "Complete payment within the prepared session window.",
    hostSecurityHelperLabel: "Verify the order reference before continuing.",
    ...overrides,
  };
}

function defaultCallbacks() {
  return {
    onBack: vi.fn(),
    onOpenPaymentGateway: vi.fn(),
    onRetryPrepare: vi.fn(),
  };
}

function renderScreen(
  overrides: Partial<SecurePaymentGatewayHandoffScreenProps> = {},
) {
  const callbacks = defaultCallbacks();
  const props: SecurePaymentGatewayHandoffScreenProps = {
    state: "ready",
    report: reportWith(),
    ...callbacks,
    ...overrides,
  };
  const view = render(<SecurePaymentGatewayHandoffScreen {...props} />);
  return { ...view, callbacks, props };
}

function gatewayButton() {
  return screen.getByRole("button", {
    name: new RegExp(
      [
        copy.continuePayment,
        copy.openingPayment,
        copy.reconnectToContinue,
        copy.paymentUnavailable,
        copy.reviewRequired,
      ].join("|"),
    ),
  });
}

function toastRegion() {
  return screen.getByTestId("toast-region");
}

describe("SecurePaymentGatewayHandoffScreen", () => {
  describe("defensive helpers", () => {
    it("normalises negative item counts to zero", () => {
      expect(normaliseNonNegativeInteger(-3)).toBe(0);
    });

    it("normalises NaN item counts to zero", () => {
      expect(normaliseNonNegativeInteger(Number.NaN)).toBe(0);
    });

    it("normalises positive infinity item counts to zero", () => {
      expect(normaliseNonNegativeInteger(Number.POSITIVE_INFINITY)).toBe(0);
    });

    it("truncates positive decimal item counts", () => {
      expect(normaliseNonNegativeInteger(2.9)).toBe(2);
    });

    it("formats singular item counts", () => {
      expect(formatCartItemCount(1)).toBe("1 item");
    });

    it("formats plural item counts", () => {
      expect(formatCartItemCount(2)).toBe("2 items");
    });

    it("recognises expired gateway sessions", () => {
      expect(isGatewaySessionExpired(reportWith({ sessionStatus: "expired" }))).toBe(true);
    });

    it("recognises gateway block reasons", () => {
      expect(hasGatewayBlockReason(reportWith({ blockReason: "review-required" }))).toBe(true);
    });

    it("permits a prepared gateway only for usable reports", () => {
      expect(canOpenPreparedGateway({ canOpenPaymentGateway: true, report: reportWith() })).toBe(true);
      expect(canOpenPreparedGateway({ canOpenPaymentGateway: false, report: reportWith() })).toBe(false);
      expect(canOpenPreparedGateway({ canOpenPaymentGateway: true, report: reportWith({ sessionStatus: "blocked" }) })).toBe(false);
    });


    it("requires readable gateway metadata", () => {
      expect(hasRequiredGatewayMetadata(reportWith())).toBe(true);
      expect(hasRequiredGatewayMetadata(reportWith({ paymentSessionId: "   " }))).toBe(false);
    });

    it("omits destination values with raw URL syntax", () => {
      expect(getSafeDestinationDisplayLabel("payments.example.com")).toBe("payments.example.com");
      expect(getSafeDestinationDisplayLabel("https://payments.example.com")).toBeNull();
    });

    it("blocks prepared gateway opening when the normalised item count is zero", () => {
      expect(canOpenPreparedGateway({ canOpenPaymentGateway: true, report: reportWith({ itemCount: 0 }) })).toBe(false);
      expect(canOpenPreparedGateway({ canOpenPaymentGateway: true, report: reportWith({ itemCount: Number.NaN }) })).toBe(false);
    });

    it("rejects malformed runtime metadata safely", () => {
      expect(
        hasRequiredGatewayMetadata(
          reportWith({ paymentSessionId: null as never }),
        ),
      ).toBe(false);
      expect(
        hasRequiredGatewayMetadata(
          reportWith({ providerLabel: 42 as never }),
        ),
      ).toBe(false);
    });

    it("omits malformed destination labels and trims safe display text", () => {
      expect(
        getSafeDestinationDisplayLabel({ label: "unsafe" } as never),
      ).toBeNull();
      expect(
        getSafeDestinationDisplayLabel("  payments.example.com  "),
      ).toBe("payments.example.com");
      expect(
        getSafeDestinationDisplayLabel("payments.example.com\\checkout"),
      ).toBeNull();
    });

    it("fails closed when the CTA helper receives unreadable metadata", () => {
      expect(
        getGatewayButtonLabel({
          activeOperation: null,
          canOpenPaymentGateway: true,
          isOffline: false,
          report: reportWith({ providerLabel: null as never }),
        }),
      ).toBe(copy.paymentUnavailable);
    });
  });

  describe("core states", () => {
    it("renders the loading heading", () => {
      renderScreen({ state: "loading", report: null });
      expect(screen.getByRole("heading", { name: copy.loadingHeading })).toBeInTheDocument();
    });

    it("uses polite static-only loading semantics", () => {
      renderScreen({ state: "loading", report: null });
      const region = screen.getByRole("heading", { name: copy.loadingHeading }).closest('[role="status"]');
      expect(region).toHaveAttribute("aria-live", "polite");
    });

    it("keeps buttons outside the loading live region", () => {
      renderScreen({ state: "loading", report: null });
      const region = screen.getByRole("heading", { name: copy.loadingHeading }).closest('[role="status"]');
      expect(region).not.toBeNull();
      expect(within(region as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders a disabled loading footer CTA", () => {
      renderScreen({ state: "loading", report: null });
      expect(screen.getByRole("button", { name: copy.continuePayment })).toBeDisabled();
    });

    it("renders the ready heading", () => {
      renderScreen();
      expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
    });

    it("falls back to error when ready payload is missing", () => {
      renderScreen({ state: "ready", report: null });
      expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
    });


    it.each([
      ["paymentSessionId", { paymentSessionId: "   " }],
      ["checkoutSessionId", { checkoutSessionId: "   " }],
      ["reviewId", { reviewId: "   " }],
      ["providerLabel", { providerLabel: "   " }],
      ["totalLabel", { totalLabel: "   " }],
    ] as const)("falls back to error when %s is blank", (_field, overrides) => {
      renderScreen({ report: reportWith(overrides) });
      expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
    });


    it("falls back to error safely when runtime metadata is null", () => {
      renderScreen({
        report: reportWith({ paymentSessionId: null as never }),
      });
      expect(
        screen.getByRole("heading", { name: copy.errorHeading }),
      ).toBeInTheDocument();
    });

    it("falls back to error safely when provider metadata is not a string", () => {
      renderScreen({ report: reportWith({ providerLabel: 42 as never }) });
      expect(
        screen.getByRole("heading", { name: copy.errorHeading }),
      ).toBeInTheDocument();
    });

    it("keeps the loading-state top-bar Back button enabled", () => {
      renderScreen({ state: "loading", report: null });
      expect(screen.getByRole("button", { name: copy.back })).toBeEnabled();
    });

    it("invokes Back from the loading-state top bar", () => {
      const onBack = vi.fn();
      renderScreen({ state: "loading", report: null, onBack });
      fireEvent.click(screen.getByRole("button", { name: copy.back }));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("disables both loading-state Back controls while Back is pending", () => {
      const request = deferred();
      renderScreen({
        state: "loading",
        report: null,
        onBack: vi.fn(() => request.promise),
      });

      fireEvent.click(screen.getByRole("button", { name: copy.back }));

      expect(screen.getByRole("button", { name: copy.back })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: copy.backToReview }),
      ).toBeDisabled();
    });

    it("prevents duplicate loading-state Back activation", () => {
      const request = deferred();
      const onBack = vi.fn(() => request.promise);
      renderScreen({ state: "loading", report: null, onBack });

      const topBack = screen.getByRole("button", { name: copy.back });
      fireEvent.click(topBack);
      fireEvent.click(topBack);
      fireEvent.click(
        screen.getByRole("button", { name: copy.backToReview }),
      );

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("shows loading-state Back rejection toast above the sticky footer", async () => {
      renderScreen({
        state: "loading",
        report: null,
        onBack: vi.fn(() => Promise.reject(new Error("no"))),
      });

      fireEvent.click(screen.getByRole("button", { name: copy.back }));

      expect(await screen.findByText(copy.backError)).toBeInTheDocument();
      expect(toastRegion()).toHaveClass(
        "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_145px)]",
      );
    });

    it("falls back to expired when a ready payload has an expired session", () => {
      renderScreen({ report: reportWith({ sessionStatus: "expired" }) });
      expect(screen.getByRole("heading", { name: copy.expiredHeading })).toBeInTheDocument();
    });

    it("renders the expired heading", () => {
      renderScreen({ state: "expired" });
      expect(screen.getByRole("heading", { name: copy.expiredHeading })).toBeInTheDocument();
    });

    it("renders no sticky footer in expired state", () => {
      renderScreen({ state: "expired" });
      expect(screen.queryByRole("button", { name: copy.continuePayment })).not.toBeInTheDocument();
    });

    it("renders the error heading", () => {
      renderScreen({ state: "error", report: null });
      expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
    });

    it("keeps buttons outside the error alert", () => {
      renderScreen({ state: "error", report: null });
      const alert = screen.getByRole("alert");
      expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders retry only when supplied", () => {
      renderScreen({ state: "error", report: null, onRetryPrepare: undefined });
      expect(screen.queryByRole("button", { name: copy.retry })).not.toBeInTheDocument();
    });

    it("shows retry pending copy", () => {
      const request = deferred();
      renderScreen({ state: "error", report: null, onRetryPrepare: vi.fn(() => request.promise) });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(screen.getByRole("button", { name: copy.retrying })).toBeDisabled();
    });

    it("prevents duplicate retry activation", () => {
      const request = deferred();
      const onRetryPrepare = vi.fn(() => request.promise);
      renderScreen({ state: "error", report: null, onRetryPrepare });
      const button = screen.getByRole("button", { name: copy.retry });
      fireEvent.click(button);
      fireEvent.click(screen.getByRole("button", { name: copy.retrying }));
      expect(onRetryPrepare).toHaveBeenCalledTimes(1);
    });

    it("shows retry rejection toast", async () => {
      renderScreen({ state: "error", report: null, onRetryPrepare: vi.fn(() => Promise.reject(new Error("no"))) });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
    });
  });

  describe("trust and gateway content", () => {
    it("renders supporting copy", () => {
      renderScreen();
      expect(screen.getByText(copy.supporting)).toBeInTheDocument();
    });

    it("renders the no-card-details security note", () => {
      renderScreen();
      expect(screen.getByText(copy.noCardDetailsHere)).toBeInTheDocument();
    });

    it("renders return-after-payment copy", () => {
      renderScreen();
      expect(screen.getByText(copy.returnAfterPayment)).toBeInTheDocument();
    });

    it("renders external-handoff note", () => {
      renderScreen();
      expect(screen.getByText(copy.externalHandoff)).toBeInTheDocument();
    });

    it("renders order reference only when supplied", () => {
      const { rerender, props } = renderScreen();
      expect(screen.getByText("Order DL-2048")).toBeInTheDocument();
      rerender(<SecurePaymentGatewayHandoffScreen {...props} report={reportWith({ orderReferenceLabel: undefined })} />);
      expect(screen.queryByText("Order DL-2048")).not.toBeInTheDocument();
    });

    it("renders provider label unchanged", () => {
      renderScreen();
      expect(screen.getByText("Secure payment partner")).toBeInTheDocument();
    });

    it("renders destination display label only when supplied", () => {
      const { rerender, props } = renderScreen();
      expect(screen.getByText("Hosted secure checkout")).toBeInTheDocument();
      rerender(<SecurePaymentGatewayHandoffScreen {...props} report={reportWith({ destinationDisplayLabel: undefined })} />);
      expect(screen.queryByText("Hosted secure checkout")).not.toBeInTheDocument();
    });


    it("renders a safe destination display label as plain text", () => {
      renderScreen({ report: reportWith({ destinationDisplayLabel: "payments.example.com" }) });
      expect(screen.getByText("payments.example.com")).toBeInTheDocument();
      expect(document.querySelector("a")).toBeNull();
    });

    it.each([
      "https://payments.example.com",
      "//payments.example.com",
      "payments.example.com/checkout",
      "payments.example.com?session=secret",
    ])("omits unsafe destination display value %s", (destinationDisplayLabel) => {
      renderScreen({ report: reportWith({ destinationDisplayLabel }) });
      expect(screen.queryByText(destinationDisplayLabel)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.paymentPage)).not.toBeInTheDocument();
    });


    it("omits a non-string runtime destination label safely", () => {
      renderScreen({
        report: reportWith({ destinationDisplayLabel: 42 as never }),
      });
      expect(screen.queryByText(copy.paymentPage)).not.toBeInTheDocument();
    });

    it("renders a safe destination label with surrounding whitespace trimmed", () => {
      renderScreen({
        report: reportWith({
          destinationDisplayLabel: "  payments.example.com  ",
        }),
      });
      expect(screen.getByText("payments.example.com")).toBeInTheDocument();
    });

    it("omits a destination display label containing a backslash path", () => {
      renderScreen({
        report: reportWith({
          destinationDisplayLabel: "payments.example.com\\checkout",
        }),
      });
      expect(screen.queryByText(copy.paymentPage)).not.toBeInTheDocument();
    });

    it("renders session-expiry label only when supplied", () => {
      const { rerender, props } = renderScreen();
      expect(screen.getByText("Complete payment within the prepared session window.")).toBeInTheDocument();
      rerender(<SecurePaymentGatewayHandoffScreen {...props} report={reportWith({ sessionExpiryLabel: undefined })} />);
      expect(screen.queryByText("Complete payment within the prepared session window.")).not.toBeInTheDocument();
    });

    it("renders host security helper only when supplied", () => {
      const { rerender, props } = renderScreen();
      expect(screen.getByText("Verify the order reference before continuing.")).toBeInTheDocument();
      rerender(<SecurePaymentGatewayHandoffScreen {...props} report={reportWith({ hostSecurityHelperLabel: undefined })} />);
      expect(screen.queryByText("Verify the order reference before continuing.")).not.toBeInTheDocument();
    });

    it("renders no provider logo image", () => {
      renderScreen();
      expect(screen.queryByRole("img", { name: /provider/i })).not.toBeInTheDocument();
    });

    it("renders no raw gateway URL", () => {
      renderScreen();
      expect(document.body.textContent).not.toContain("https://");
    });

    it("renders a secure checkout label for the top lock", () => {
      renderScreen();
      expect(screen.getByRole("img", { name: copy.secureCheckout })).toBeInTheDocument();
    });
  });

  describe("summary", () => {
    it("renders item count", () => {
      renderScreen();
      expect(screen.getByText("3 items")).toBeInTheDocument();
    });

    it("normalises a negative item count", () => {
      renderScreen({ report: reportWith({ itemCount: -2 }) });
      expect(screen.getByText("0 items")).toBeInTheDocument();
    });

    it("normalises NaN item count", () => {
      renderScreen({ report: reportWith({ itemCount: Number.NaN }) });
      expect(screen.getByText("0 items")).toBeInTheDocument();
    });

    it("normalises infinity item count", () => {
      renderScreen({ report: reportWith({ itemCount: Number.POSITIVE_INFINITY }) });
      expect(screen.getByText("0 items")).toBeInTheDocument();
    });

    it("truncates decimal item count", () => {
      renderScreen({ report: reportWith({ itemCount: 2.9 }) });
      expect(screen.getByText("2 items")).toBeInTheDocument();
    });

    it("renders total label unchanged", () => {
      renderScreen({ report: reportWith({ totalLabel: "AED 190.00 including tax" }) });
      expect(screen.getAllByText("AED 190.00 including tax").length).toBeGreaterThan(0);
    });

    it("does not derive a total", () => {
      renderScreen({ report: reportWith({ totalLabel: "Host total label" }) });
      expect(screen.getAllByText("Host total label").length).toBeGreaterThan(0);
    });
  });

  describe("gateway action", () => {
    it("invokes callback with host session identifiers", () => {
      const onOpenPaymentGateway = vi.fn();
      renderScreen({ onOpenPaymentGateway });
      fireEvent.click(gatewayButton());
      expect(onOpenPaymentGateway).toHaveBeenCalledWith({
        checkoutSessionId: "checkout-1",
        reviewId: "review-1",
        paymentSessionId: "payment-session-secret-1",
      });
    });

    it("submits but never renders the payment-session ID", () => {
      renderScreen();
      expect(screen.queryByText("payment-session-secret-1")).not.toBeInTheDocument();
    });

    it("shows pending gateway label", () => {
      const request = deferred();
      renderScreen({ onOpenPaymentGateway: vi.fn(() => request.promise) });
      fireEvent.click(gatewayButton());
      expect(screen.getByRole("button", { name: copy.openingPayment })).toBeDisabled();
    });

    it("prevents duplicate gateway activation", () => {
      const request = deferred();
      const onOpenPaymentGateway = vi.fn(() => request.promise);
      renderScreen({ onOpenPaymentGateway });
      fireEvent.click(gatewayButton());
      fireEvent.click(screen.getByRole("button", { name: copy.openingPayment }));
      expect(onOpenPaymentGateway).toHaveBeenCalledTimes(1);
    });

    it("shows gateway rejection toast", async () => {
      renderScreen({ onOpenPaymentGateway: vi.fn(() => Promise.reject(new Error("no"))) });
      fireEvent.click(gatewayButton());
      expect(await screen.findByText(copy.gatewayError)).toBeInTheDocument();
    });

    it("keeps prepared summary after gateway rejection", async () => {
      renderScreen({ onOpenPaymentGateway: vi.fn(() => Promise.reject(new Error("no"))) });
      fireEvent.click(gatewayButton());
      expect(await screen.findByText(copy.gatewayError)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: copy.orderSummary })).toBeInTheDocument();
    });

    it("disables CTA for blocked session", () => {
      renderScreen({ report: reportWith({ sessionStatus: "blocked" }) });
      expect(gatewayButton()).toBeDisabled();
    });

    it("shows review-required block label", () => {
      renderScreen({ report: reportWith({ blockReason: "review-required" }) });
      expect(screen.getByRole("button", { name: copy.reviewRequired })).toBeDisabled();
    });

    it("shows payment-unavailable block label", () => {
      renderScreen({ report: reportWith({ blockReason: "payment-unavailable" }) });
      expect(screen.getByRole("button", { name: copy.paymentUnavailable })).toBeDisabled();
    });

    it("keeps offline gateway available when host permits it", () => {
      renderScreen({ isOffline: true, canOpenPaymentGateway: true });
      expect(screen.getByRole("button", { name: copy.continuePayment })).toBeEnabled();
    });

    it("shows reconnect label for offline blocked route", () => {
      renderScreen({ isOffline: true, canOpenPaymentGateway: false });
      expect(screen.getByRole("button", { name: copy.reconnectToContinue })).toBeDisabled();
    });

    it("shows unavailable label for online blocked route", () => {
      renderScreen({ canOpenPaymentGateway: false });
      expect(screen.getByRole("button", { name: copy.paymentUnavailable })).toBeDisabled();
    });


    it("renders review-required label and blocks opening for zero items", () => {
      const onOpenPaymentGateway = vi.fn();
      renderScreen({ report: reportWith({ itemCount: 0 }), onOpenPaymentGateway });
      expect(screen.getByText("0 items")).toBeInTheDocument();
      const button = screen.getByRole("button", { name: copy.reviewRequired });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onOpenPaymentGateway).not.toHaveBeenCalled();
    });

    it.each([
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])("blocks gateway opening after invalid item-count normalisation for %s", (itemCount) => {
      renderScreen({ report: reportWith({ itemCount }) });
      expect(screen.getByRole("button", { name: copy.reviewRequired })).toBeDisabled();
    });

    it("fails closed for an unknown non-null runtime block reason", () => {
      const onOpenPaymentGateway = vi.fn();
      renderScreen({
        onOpenPaymentGateway,
        report: reportWith({ blockReason: "runtime-hold" as never }),
      });
      const button = screen.getByRole("button", { name: copy.paymentUnavailable });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onOpenPaymentGateway).not.toHaveBeenCalled();
    });

    it("keeps Back to order review enabled while gateway is blocked", () => {
      renderScreen({ canOpenPaymentGateway: false });
      expect(screen.getByRole("button", { name: copy.backToReview })).toBeEnabled();
    });

    it("disables Back during pending gateway callback", () => {
      const request = deferred();
      renderScreen({ onOpenPaymentGateway: vi.fn(() => request.promise) });
      fireEvent.click(gatewayButton());
      expect(screen.getByRole("button", { name: copy.backToReview })).toBeDisabled();
      expect(screen.getByRole("button", { name: copy.back })).toBeDisabled();
    });

    it("uses expected gateway labels", () => {
      expect(getGatewayButtonLabel({ activeOperation: null, canOpenPaymentGateway: true, isOffline: false, report: reportWith() })).toBe(copy.continuePayment);
      expect(getGatewayButtonLabel({ activeOperation: "open-gateway", canOpenPaymentGateway: true, isOffline: false, report: reportWith() })).toBe(copy.openingPayment);
    });


    it("fails closed for an unknown runtime session status", () => {
      const onOpenPaymentGateway = vi.fn();
      renderScreen({
        onOpenPaymentGateway,
        report: reportWith({ sessionStatus: "runtime-unknown" as never }),
      });

      const button = screen.getByRole("button", {
        name: copy.paymentUnavailable,
      });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onOpenPaymentGateway).not.toHaveBeenCalled();
    });

    it("shows pending gateway feedback under StrictMode", () => {
      const request = deferred();
      render(
        <StrictMode>
          <SecurePaymentGatewayHandoffScreen
            onBack={vi.fn()}
            onOpenPaymentGateway={vi.fn(() => request.promise)}
            report={reportWith()}
            state="ready"
          />
        </StrictMode>,
      );

      fireEvent.click(gatewayButton());
      expect(
        screen.getByRole("button", { name: copy.openingPayment }),
      ).toBeDisabled();
    });

    it("shows gateway rejection toast under StrictMode", async () => {
      render(
        <StrictMode>
          <SecurePaymentGatewayHandoffScreen
            onBack={vi.fn()}
            onOpenPaymentGateway={vi.fn(() =>
              Promise.reject(new Error("no")),
            )}
            report={reportWith()}
            state="ready"
          />
        </StrictMode>,
      );

      fireEvent.click(gatewayButton());
      expect(await screen.findByText(copy.gatewayError)).toBeInTheDocument();
    });
  });

  describe("explicit user activation", () => {
    it("does not invoke gateway callback while rendering ready state", () => {
      const onOpenPaymentGateway = vi.fn();
      renderScreen({ onOpenPaymentGateway });
      expect(onOpenPaymentGateway).not.toHaveBeenCalled();
    });

    it("does not invoke gateway callback after ready rerender", () => {
      const onOpenPaymentGateway = vi.fn();
      const { rerender, props } = renderScreen({ onOpenPaymentGateway });
      rerender(<SecurePaymentGatewayHandoffScreen {...props} report={reportWith({ totalLabel: "AED 191" })} />);
      expect(onOpenPaymentGateway).not.toHaveBeenCalled();
    });

    it("does not invoke gateway callback after loading-to-ready transition", () => {
      const onOpenPaymentGateway = vi.fn();
      const { rerender, props } = renderScreen({ state: "loading", report: null, onOpenPaymentGateway });
      rerender(<SecurePaymentGatewayHandoffScreen {...props} state="ready" report={reportWith()} />);
      expect(onOpenPaymentGateway).not.toHaveBeenCalled();
    });

    it("does not invoke gateway callback after retry resolves", async () => {
      const request = deferred();
      const onOpenPaymentGateway = vi.fn();
      renderScreen({ state: "error", report: null, onRetryPrepare: vi.fn(() => request.promise), onOpenPaymentGateway });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      request.resolve();
      await Promise.resolve();
      expect(onOpenPaymentGateway).not.toHaveBeenCalled();
    });

    it("does not call window.open", () => {
      const spy = vi.spyOn(window, "open").mockImplementation(() => null);
      renderScreen();
      fireEvent.click(gatewayButton());
      expect(spy).not.toHaveBeenCalled();
    });

    it("does not mutate window location while rendering", () => {
      const before = window.location.href;
      renderScreen();
      expect(window.location.href).toBe(before);
    });

    it("does not mutate window location when CTA is clicked", () => {
      const before = window.location.href;
      renderScreen();
      fireEvent.click(gatewayButton());
      expect(window.location.href).toBe(before);
    });
  });

  describe("navigation and toast", () => {
    it("invokes Back callback", () => {
      const onBack = vi.fn();
      renderScreen({ onBack });
      fireEvent.click(screen.getByRole("button", { name: copy.back }));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("shows Back rejection toast", async () => {
      renderScreen({ onBack: vi.fn(() => Promise.reject(new Error("no"))) });
      fireEvent.click(screen.getByRole("button", { name: copy.back }));
      expect(await screen.findByText(copy.backError)).toBeInTheDocument();
    });

    it("positions ready callback rejection toast above sticky footer", async () => {
      renderScreen({ onOpenPaymentGateway: vi.fn(() => Promise.reject(new Error("no"))) });
      fireEvent.click(gatewayButton());
      expect(await screen.findByText(copy.gatewayError)).toBeInTheDocument();
      expect(toastRegion()).toHaveClass("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_145px)]");
    });

    it("positions error retry rejection toast at bottom safe area", async () => {
      renderScreen({ state: "error", report: null, onRetryPrepare: vi.fn(() => Promise.reject(new Error("no"))) });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
      expect(toastRegion()).toHaveClass("bottom-[max(24px,env(safe-area-inset-bottom))]");
    });

    it("positions expired retry rejection toast at bottom safe area", async () => {
      renderScreen({ state: "expired", onRetryPrepare: vi.fn(() => Promise.reject(new Error("no"))) });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
      expect(toastRegion()).toHaveClass("bottom-[max(24px,env(safe-area-inset-bottom))]");
    });
  });

  describe("architecture boundary", () => {
    it("defines no raw gateway URL prop in rendered behavior", () => {
      renderScreen();
      expect(document.body.textContent).not.toContain("gatewayUrl");
    });

    it("renders no external anchor", () => {
      renderScreen();
      expect(document.querySelector("a")).toBeNull();
    });

    it("renders no payment iframe", () => {
      renderScreen();
      expect(document.querySelector("iframe")).toBeNull();
    });

    it("renders no card-number input", () => {
      renderScreen();
      expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    });

    it("renders no CVV input", () => {
      renderScreen();
      expect(screen.queryByLabelText(/cvv/i)).not.toBeInTheDocument();
    });

    it("renders no expiry input", () => {
      renderScreen();
      expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument();
    });

    it("renders no bank-account input", () => {
      renderScreen();
      expect(screen.queryByLabelText(/bank account/i)).not.toBeInTheDocument();
    });

    it("renders no provider payment button", () => {
      renderScreen();
      expect(screen.queryByRole("button", { name: /apple pay|google pay|provider/i })).not.toBeInTheDocument();
    });

    it("renders no scripts", () => {
      renderScreen();
      expect(document.querySelector("script")).toBeNull();
    });

    it("performs no direct fetch", () => {
      const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue(new Response());
      renderScreen();
      fireEvent.click(gatewayButton());
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("performs no local-storage write", () => {
      const storageSpy = vi.spyOn(Storage.prototype, "setItem");
      renderScreen();
      fireEvent.click(gatewayButton());
      expect(storageSpy).not.toHaveBeenCalled();
    });

    it("performs no session-storage write", () => {
      const storageSpy = vi.spyOn(Storage.prototype, "setItem");
      renderScreen();
      fireEvent.click(gatewayButton());
      expect(storageSpy).not.toHaveBeenCalled();
    });

    it("performs no IndexedDB write", () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(window, "indexedDB");
      const open = vi.fn();
      Object.defineProperty(window, "indexedDB", { configurable: true, value: { open } });
      try {
        renderScreen();
        fireEvent.click(gatewayButton());
        expect(open).not.toHaveBeenCalled();
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(window, "indexedDB", originalDescriptor);
        } else {
          delete (window as unknown as Record<string, unknown>).indexedDB;
        }
      }
    });

    it("performs no geolocation or camera request and restores descriptors", () => {
      const mediaDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
      const geoDescriptor = Object.getOwnPropertyDescriptor(navigator, "geolocation");
      const getUserMedia = vi.fn();
      const getCurrentPosition = vi.fn();
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
      Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
      try {
        renderScreen();
        fireEvent.click(gatewayButton());
        expect(getUserMedia).not.toHaveBeenCalled();
        expect(getCurrentPosition).not.toHaveBeenCalled();
      } finally {
        if (mediaDescriptor) {
          Object.defineProperty(navigator, "mediaDevices", mediaDescriptor);
        } else {
          delete (navigator as unknown as Record<string, unknown>).mediaDevices;
        }
        if (geoDescriptor) {
          Object.defineProperty(navigator, "geolocation", geoDescriptor);
        } else {
          delete (navigator as unknown as Record<string, unknown>).geolocation;
        }
      }
    });

    it("renders no file input", () => {
      renderScreen();
      expect(document.querySelector('input[type="file"]')).toBeNull();
    });

    it("renders no countdown timer", () => {
      const intervalSpy = vi.spyOn(window, "setInterval");
      renderScreen();
      expect(intervalSpy).not.toHaveBeenCalled();
    });

    it("renders no account creation or required sign-in", () => {
      renderScreen();
      expect(document.body.textContent?.toLowerCase()).not.toContain("create account");
      expect(document.body.textContent?.toLowerCase()).not.toContain("sign in required");
    });

    it("renders no promo-code input", () => {
      renderScreen();
      expect(screen.queryByLabelText(/promo/i)).not.toBeInTheDocument();
    });

    it("contains no direct window.location.assign call", () => {
      expect(SecurePaymentGatewayHandoffScreen.toString()).not.toContain("location.assign");
    });

    it("contains no direct window.location.replace call", () => {
      expect(SecurePaymentGatewayHandoffScreen.toString()).not.toContain("location.replace");
    });

    it("renders no bottom navigation", () => {
      renderScreen();
      expect(document.querySelector("nav")).toBeNull();
    });

    it("contains no restricted marketplace wording", () => {
      renderScreen();
      const text = document.body.textContent?.toLowerCase() ?? "";
      expect(text).not.toContain("affiliate");
      expect(text).not.toContain("marketplace");
      expect(text).not.toContain("sponsored");
    });
  });
});
