import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CheckoutReviewScreen, {
  copy,
  formatCartItemCount,
  getSelectedShippingOption,
  hasSecurePaymentBlockReason,
  hasValidSecurePaymentContext,
  isCheckoutReviewItemUnavailable,
  isCheckoutReviewState,
  needsShippingSelection,
  normaliseNonNegativeInteger,
  type CheckoutReviewItem,
  type CheckoutReviewReport,
  type CheckoutReviewScreenProps,
} from "./checkout-review-screen";

afterEach(() => {
  cleanup();
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

const itemA: CheckoutReviewItem = {
  cartItemId: "cart-1",
  productId: "product-cleanser",
  brand: "DermaLens",
  name: "Soft Balance Cleanser",
  imageUrl: "/cleanser.png",
  optionLabels: ["150 ml", "Fragrance free"],
  quantity: 2,
  unitPriceLabel: "AED 48",
  lineTotalLabel: "AED 96",
  availabilityState: "available",
  availabilityLabel: "Available now",
};

const itemB: CheckoutReviewItem = {
  cartItemId: "cart-2",
  productId: "product-spf",
  brand: "DermaLens",
  name: "Daily Comfort SPF",
  imageUrl: "/spf.png",
  optionLabels: ["50 ml"],
  quantity: 1,
  unitPriceLabel: "AED 79",
  lineTotalLabel: "AED 79",
  availabilityState: "attention",
  availabilityLabel: "Review availability",
};

function reportWith(
  overrides: Partial<CheckoutReviewReport> = {},
): CheckoutReviewReport {
  return {
    checkoutSessionId: "checkout-1",
    reviewId: "review-1",
    contact: {
      fullName: "Amara Noor",
      email: "amara@example.com",
      phone: "+971 50 123 4567",
    },
    address: {
      displayLines: ["Apartment 8", "Al Reem Island", "Abu Dhabi"],
      countryLabel: "United Arab Emirates",
    },
    items: [itemA, itemB],
    shippingOptions: [
      {
        id: "standard",
        label: "Standard delivery",
        supporting: "Reliable delivery for your routine products.",
        priceLabel: "AED 15",
        estimatedDeliveryLabel: "Arrives in 2–4 days",
        isAvailable: true,
      },
      {
        id: "express",
        label: "Express delivery",
        supporting: "Faster dispatch where supported.",
        priceLabel: "AED 30",
        estimatedDeliveryLabel: "Arrives tomorrow",
        isAvailable: true,
      },
      {
        id: "pickup",
        label: "Store pickup",
        supporting: "Not currently offered for this order.",
        isAvailable: false,
      },
    ],
    selectedShippingOptionId: "standard",
    pricing: {
      itemCount: 3,
      subtotalLabel: "AED 175",
      shippingLabel: "AED 15",
      taxLabel: "Included",
      totalLabel: "AED 190",
      checkoutNotice: "Final charges are confirmed before payment.",
    },
    canProceedToSecurePayment: true,
    paymentBlockReason: null,
    ...overrides,
  };
}

function defaultCallbacks() {
  return {
    onBack: vi.fn(),
    onContinueToSecurePayment: vi.fn(),
    onEditCart: vi.fn(),
    onEditDetails: vi.fn(),
    onRetryLoad: vi.fn(),
    onSelectShippingOption: vi.fn(),
  };
}

function renderScreen(
  overrides: Partial<CheckoutReviewScreenProps> = {},
) {
  const callbacks = defaultCallbacks();
  const props: CheckoutReviewScreenProps = {
    state: "ready",
    report: reportWith(),
    ...callbacks,
    ...overrides,
  };
  const view = render(<CheckoutReviewScreen {...props} />);
  return { ...view, callbacks, props };
}

function securePaymentButton() {
  return screen.getByRole("button", {
    name: new RegExp(
      [
        copy.continuePayment,
        copy.openingPayment,
        copy.selectShippingToContinue,
        copy.reviewCartToContinue,
        copy.confirmReviewToContinue,
        copy.reconnectToContinue,
        copy.paymentUnavailable,
      ].join("|"),
    ),
  });
}

function toastRegion() {
  return screen.getByTestId("toast-region");
}

describe("CheckoutReviewScreen", () => {
  describe("core states", () => {
    it("renders the loading heading", () => {
      renderScreen({ state: "loading", report: null });
      expect(screen.getByRole("heading", { name: copy.loadingHeading })).toBeInTheDocument();
    });

    it("uses polite static-only loading semantics", () => {
      renderScreen({ state: "loading", report: null });
      const heading = screen.getByRole("heading", { name: copy.loadingHeading });
      const region = heading.closest('[role="status"]');
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

    it("falls back to empty when the ready payload has no items", () => {
      renderScreen({ report: reportWith({ items: [] }) });
      expect(screen.getByRole("heading", { name: copy.emptyHeading })).toBeInTheDocument();
    });

    it("renders the attention banner", () => {
      renderScreen({ state: "attention" });
      expect(screen.getByText(copy.attention)).toBeInTheDocument();
    });

    it("uses role status for the attention banner", () => {
      renderScreen({ state: "attention" });
      expect(screen.getByText(copy.attention).closest('[role="status"]')).toBeInTheDocument();
    });

    it("renders empty state heading", () => {
      renderScreen({ state: "empty", report: null });
      expect(screen.getByRole("heading", { name: copy.emptyHeading })).toBeInTheDocument();
    });

    it("renders no fake pricing in empty state", () => {
      renderScreen({ state: "empty", report: null });
      expect(screen.queryByText(copy.orderSummaryHeading)).not.toBeInTheDocument();
    });

    it("renders no sticky footer in empty state", () => {
      renderScreen({ state: "empty", report: null });
      expect(screen.queryByRole("button", { name: copy.continuePayment })).not.toBeInTheDocument();
    });

    it("renders error state heading", () => {
      renderScreen({ state: "error", report: null });
      expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
    });

    it("keeps buttons outside the error alert", () => {
      renderScreen({ state: "error", report: null });
      expect(within(screen.getByRole("alert")).queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows Retry only when supplied", () => {
      renderScreen({ state: "error", report: null, onRetryLoad: undefined });
      expect(screen.queryByRole("button", { name: copy.retry })).not.toBeInTheDocument();
    });

    it("shows pending Retry label", () => {
      const request = deferred();
      renderScreen({ state: "error", report: null, onRetryLoad: () => request.promise });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(screen.getByRole("button", { name: copy.retrying })).toBeDisabled();
    });

    it("prevents duplicate Retry activation", () => {
      const request = deferred();
      const onRetryLoad = vi.fn(() => request.promise);
      renderScreen({ state: "error", report: null, onRetryLoad });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      fireEvent.click(screen.getByRole("button", { name: copy.retrying }));
      expect(onRetryLoad).toHaveBeenCalledTimes(1);
    });

    it("shows a Retry failure toast", async () => {
      renderScreen({ state: "error", report: null, onRetryLoad: vi.fn().mockRejectedValue(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
    });
  });

  describe("guest and payment separation", () => {
    it("renders guest-checkout copy", () => { renderScreen(); expect(screen.getByText(copy.guestCheckout)).toBeInTheDocument(); });
    it("renders payment-next copy", () => { renderScreen(); expect(screen.getByText(copy.paymentNext)).toBeInTheDocument(); });
    it("renders payment-handoff copy", () => { renderScreen(); expect(screen.getByText(copy.paymentHandoff)).toBeInTheDocument(); });
    it("renders no card-number field", () => { renderScreen(); expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument(); });
    it("renders no CVV field", () => { renderScreen(); expect(screen.queryByLabelText(/cvv/i)).not.toBeInTheDocument(); });
    it("renders no expiry field", () => { renderScreen(); expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument(); });
    it("renders no payment iframe", () => { renderScreen(); expect(document.querySelector("iframe")).not.toBeInTheDocument(); });
    it("renders no payment-provider buttons", () => { renderScreen(); expect(screen.queryByRole("button", { name: /apple pay|google pay/i })).not.toBeInTheDocument(); });
    it("renders no external anchors", () => { renderScreen(); expect(document.querySelector("a")).not.toBeInTheDocument(); });
  });

  describe("delivery details", () => {
    it("renders the recipient name unchanged", () => { renderScreen(); expect(screen.getByText("Amara Noor")).toBeInTheDocument(); });
    it("preserves address display-line order", () => {
      renderScreen();
      const text = document.body.textContent ?? "";
      expect(text.indexOf("Apartment 8")).toBeLessThan(text.indexOf("Al Reem Island"));
      expect(text.indexOf("Al Reem Island")).toBeLessThan(text.indexOf("Abu Dhabi"));
    });
    it("renders country label", () => { renderScreen(); expect(screen.getByText("United Arab Emirates")).toBeInTheDocument(); });
    it("renders email", () => { renderScreen(); expect(screen.getByText("amara@example.com")).toBeInTheDocument(); });
    it("renders phone", () => { renderScreen(); expect(screen.getByText("+971 50 123 4567")).toBeInTheDocument(); });
    it("invokes Edit Details callback", () => {
      const onEditDetails = vi.fn(); renderScreen({ onEditDetails }); fireEvent.click(screen.getByRole("button", { name: copy.editDetails })); expect(onEditDetails).toHaveBeenCalledTimes(1);
    });
    it("shows Edit Details rejection toast", async () => {
      renderScreen({ onEditDetails: vi.fn().mockRejectedValue(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.editDetails })); expect(await screen.findByText(copy.editDetailsError)).toBeInTheDocument();
    });
  });

  describe("order items", () => {
    it("preserves host item order", () => {
      renderScreen(); const text = document.body.textContent ?? ""; expect(text.indexOf(itemA.name)).toBeLessThan(text.indexOf(itemB.name));
    });
    it("renders product brand", () => { renderScreen(); expect(screen.getAllByText("DermaLens").length).toBeGreaterThan(0); });
    it("renders product name", () => { renderScreen(); expect(screen.getByText(itemA.name)).toBeInTheDocument(); });
    it("preserves option-label order", () => { renderScreen(); const text = document.body.textContent ?? ""; expect(text.indexOf("150 ml")).toBeLessThan(text.indexOf("Fragrance free")); });
    it("normalises negative quantity", () => { renderScreen({ report: reportWith({ items: [{ ...itemA, quantity: -3 }] }) }); expect(screen.getByLabelText(`Quantity for ${itemA.name}: 0`)).toBeInTheDocument(); });
    it("normalises NaN quantity", () => { renderScreen({ report: reportWith({ items: [{ ...itemA, quantity: Number.NaN }] }) }); expect(screen.getByLabelText(`Quantity for ${itemA.name}: 0`)).toBeInTheDocument(); });
    it("normalises infinite quantity", () => { renderScreen({ report: reportWith({ items: [{ ...itemA, quantity: Number.POSITIVE_INFINITY }] }) }); expect(screen.getByLabelText(`Quantity for ${itemA.name}: 0`)).toBeInTheDocument(); });
    it("truncates decimal quantity", () => { renderScreen({ report: reportWith({ items: [{ ...itemA, quantity: 2.9 }] }) }); expect(screen.getByLabelText(`Quantity for ${itemA.name}: 2`)).toBeInTheDocument(); });
    it("includes product context in the quantity accessible label", () => { renderScreen({ report: reportWith({ items: [itemA] }) }); expect(screen.getByLabelText(`Quantity for ${itemA.name}: 2`)).toBeInTheDocument(); });
    it("renders unit-price label unchanged", () => { renderScreen(); expect(screen.getByText("AED 48")).toBeInTheDocument(); });
    it("renders line-total label unchanged", () => { renderScreen(); expect(screen.getByText("AED 96")).toBeInTheDocument(); });
    it("renders host availability label unchanged", () => { renderScreen(); expect(screen.getByText("Available now")).toBeInTheDocument(); });
    it("falls back to available copy", () => { renderScreen({ report: reportWith({ items: [{ ...itemA, availabilityLabel: "" }] }) }); expect(screen.getByText(copy.productAvailable)).toBeInTheDocument(); });
    it("falls back to unavailable copy", () => { renderScreen({ report: reportWith({ items: [{ ...itemA, availabilityLabel: "", availabilityState: "unavailable" }] }) }); expect(screen.getByText(copy.productUnavailable)).toBeInTheDocument(); });
    it("keeps unavailable item visible", () => { renderScreen({ report: reportWith({ items: [{ ...itemA, availabilityState: "unavailable" }] }) }); expect(screen.getByText(itemA.name)).toBeInTheDocument(); });
    it("renders host image URL", () => { renderScreen(); expect(screen.getByAltText(`${itemA.brand} ${itemA.name}`)).toHaveAttribute("src", itemA.imageUrl); });
    it("renders placeholder for missing image", () => { renderScreen({ report: reportWith({ items: [{ ...itemA, imageUrl: undefined }] }) }); expect(screen.getByText(copy.productImageUnavailable)).toBeInTheDocument(); });
    it("renders placeholder after failed image", () => { renderScreen(); fireEvent.error(screen.getByAltText(`${itemA.brand} ${itemA.name}`)); expect(screen.getByText(copy.productImageUnavailable)).toBeInTheDocument(); });
    it("retries replacement image URL", () => {
      const { rerender, props } = renderScreen({ report: reportWith({ items: [itemA] }) });
      fireEvent.error(screen.getByAltText(`${itemA.brand} ${itemA.name}`));
      rerender(<CheckoutReviewScreen {...props} report={reportWith({ items: [{ ...itemA, imageUrl: "/cleanser-new.png" }] })} />);
      expect(screen.getByAltText(`${itemA.brand} ${itemA.name}`)).toHaveAttribute("src", "/cleanser-new.png");
    });
    it("invokes Edit Cart callback", () => { const onEditCart = vi.fn(); renderScreen({ onEditCart }); fireEvent.click(screen.getByRole("button", { name: copy.editCart })); expect(onEditCart).toHaveBeenCalledTimes(1); });
    it("shows Edit Cart rejection toast", async () => { renderScreen({ onEditCart: vi.fn().mockRejectedValue(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.editCart })); expect(await screen.findByText(copy.editCartError)).toBeInTheDocument(); });
  });

  describe("shipping options", () => {
    it("omits shipping section when options are absent", () => { renderScreen({ report: reportWith({ shippingOptions: [], selectedShippingOptionId: undefined }) }); expect(screen.queryByText(copy.shippingHeading)).not.toBeInTheDocument(); });
    it("preserves shipping-option order", () => { renderScreen(); const text = document.body.textContent ?? ""; expect(text.indexOf("Standard delivery")).toBeLessThan(text.indexOf("Express delivery")); });
    it("uses host selected radio state", () => { renderScreen(); expect(screen.getByRole("radio", { name: /Standard delivery/i })).toBeChecked(); });
    it("keeps unavailable option visible", () => { renderScreen(); expect(screen.getByText("Store pickup")).toBeInTheDocument(); });
    it("disables unavailable option", () => { renderScreen(); expect(screen.getByRole("radio", { name: /Store pickup/i })).toBeDisabled(); });
    it("invokes selected shipping callback", () => { const onSelectShippingOption = vi.fn(); renderScreen({ onSelectShippingOption }); fireEvent.click(screen.getByRole("radio", { name: /Express delivery/i })); expect(onSelectShippingOption).toHaveBeenCalledWith("express"); });
    it("does not change checked state locally", () => { renderScreen(); fireEvent.click(screen.getByRole("radio", { name: /Express delivery/i })); expect(screen.getByRole("radio", { name: /Standard delivery/i })).toBeChecked(); expect(screen.getByRole("radio", { name: /Express delivery/i })).not.toBeChecked(); });
    it("guards already-selected option", () => { const onSelectShippingOption = vi.fn(); renderScreen({ onSelectShippingOption }); fireEvent.click(screen.getByRole("radio", { name: /Standard delivery/i })); expect(onSelectShippingOption).not.toHaveBeenCalled(); });
    it("guards programmatic unavailable selection", () => { const onSelectShippingOption = vi.fn(); renderScreen({ onSelectShippingOption }); fireEvent.change(screen.getByRole("radio", { name: /Store pickup/i })); expect(onSelectShippingOption).not.toHaveBeenCalled(); });
    it("shows pending label only in selected option", () => { const request = deferred(); renderScreen({ onSelectShippingOption: () => request.promise }); fireEvent.click(screen.getByRole("radio", { name: /Express delivery/i })); expect(screen.getByText(copy.updatingShipping)).toBeInTheDocument(); expect(screen.getByText(copy.updatingShipping).closest("label")).toHaveTextContent("Express delivery"); });
    it("disables conflicting controls during shipping update", () => { const request = deferred(); renderScreen({ onSelectShippingOption: () => request.promise }); fireEvent.click(screen.getByRole("radio", { name: /Express delivery/i })); expect(screen.getByRole("button", { name: copy.editDetails })).toBeDisabled(); });
    it("prevents duplicate shipping activation", () => { const request = deferred(); const onSelectShippingOption = vi.fn(() => request.promise); renderScreen({ onSelectShippingOption }); fireEvent.click(screen.getByRole("radio", { name: /Express delivery/i })); fireEvent.click(screen.getByRole("radio", { name: /Express delivery/i })); expect(onSelectShippingOption).toHaveBeenCalledTimes(1); });
    it("shows shipping rejection toast", async () => { renderScreen({ onSelectShippingOption: vi.fn().mockRejectedValue(new Error("no")) }); fireEvent.click(screen.getByRole("radio", { name: /Express delivery/i })); expect(await screen.findByText(copy.shippingError)).toBeInTheDocument(); });
  });

  describe("pricing summary", () => {
    it("normalises invalid item counts", () => { renderScreen({ report: reportWith({ pricing: { ...reportWith().pricing, itemCount: Number.NaN } }) }); expect(screen.getByText("0 items")).toBeInTheDocument(); });
    it("renders subtotal unchanged", () => { renderScreen(); expect(screen.getByText("AED 175")).toBeInTheDocument(); });
    it("renders shipping unchanged", () => { renderScreen(); expect(screen.getAllByText("AED 15").length).toBeGreaterThan(0); });
    it("renders tax unchanged", () => { renderScreen(); expect(screen.getByText("Included")).toBeInTheDocument(); });
    it("renders total unchanged", () => { renderScreen(); expect(screen.getAllByText("AED 190").length).toBeGreaterThan(0); });
    it("omits optional pricing rows", () => { renderScreen({ report: reportWith({ pricing: { itemCount: 1, totalLabel: "AED 48" } }) }); expect(screen.queryByText(copy.subtotal)).not.toBeInTheDocument(); expect(screen.queryByText(copy.shipping)).not.toBeInTheDocument(); expect(screen.queryByText(copy.tax)).not.toBeInTheDocument(); });
    it("renders checkout notice", () => { renderScreen(); expect(screen.getByText("Final charges are confirmed before payment.")).toBeInTheDocument(); });
    it("uses polite live values wrapper", () => { renderScreen(); expect(screen.getByText("AED 175").closest('[aria-live="polite"]')).toBeInTheDocument(); });
    it("preserves supplied pricing strings without calculation", () => { renderScreen({ report: reportWith({ pricing: { itemCount: 3, totalLabel: "Host total", subtotalLabel: "Host subtotal", shippingLabel: "Host shipping", taxLabel: "Host tax" } }) }); expect(screen.getAllByText("Host total").length).toBeGreaterThan(0); expect(screen.getByText("Host shipping")).toBeInTheDocument(); });
  });

  describe("acknowledgement", () => {
    const acknowledgement = { required: true, label: "I reviewed my order.", supporting: "Confirm before payment." };
    it("omits acknowledgement unless supplied", () => { renderScreen(); expect(screen.queryByText(copy.acknowledgementHeading)).not.toBeInTheDocument(); });
    it("uses a native checkbox", () => { renderScreen({ report: reportWith({ acknowledgement }) }); expect(screen.getByRole("checkbox", { name: /I reviewed my order/i })).toBeInTheDocument(); });
    it("renders supporting copy", () => { renderScreen({ report: reportWith({ acknowledgement }) }); expect(screen.getByText("Confirm before payment.")).toBeInTheDocument(); });
    it("does not block for unchecked optional acknowledgement", () => { renderScreen({ report: reportWith({ acknowledgement: { ...acknowledgement, required: false } }) }); expect(securePaymentButton()).toBeEnabled(); });
    it("blocks required unchecked acknowledgement", () => { renderScreen({ report: reportWith({ acknowledgement }) }); expect(screen.getByRole("button", { name: copy.confirmReviewToContinue })).toBeDisabled(); });
    it("enables payment after required acknowledgement", () => { renderScreen({ report: reportWith({ acknowledgement }) }); fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed my order/i })); expect(screen.getByRole("button", { name: copy.continuePayment })).toBeEnabled(); });
    it("resets acknowledgement when review ID changes", () => { const { rerender, props } = renderScreen({ report: reportWith({ acknowledgement }) }); fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed my order/i })); rerender(<CheckoutReviewScreen {...props} report={reportWith({ acknowledgement, reviewId: "review-2" })} />); expect(screen.getByRole("checkbox", { name: /I reviewed my order/i })).not.toBeChecked(); });
    it("resets acknowledgement when its copy changes with the same review ID", () => {
      const { rerender, props } = renderScreen({ report: reportWith({ acknowledgement }) });
      fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed my order/i }));
      expect(screen.getByRole("checkbox", { name: /I reviewed my order/i })).toBeChecked();
      rerender(<CheckoutReviewScreen {...props} report={reportWith({ acknowledgement: { ...acknowledgement, label: "I reviewed the updated order." } })} />);
      expect(screen.getByRole("checkbox", { name: /I reviewed the updated order/i })).not.toBeChecked();
    });
  });

  describe("secure payment route", () => {
    it("invokes payment callback with session and review IDs", () => { const onContinueToSecurePayment = vi.fn(); renderScreen({ onContinueToSecurePayment }); fireEvent.click(screen.getByRole("button", { name: copy.continuePayment })); expect(onContinueToSecurePayment).toHaveBeenCalledWith({ checkoutSessionId: "checkout-1", reviewId: "review-1", selectedShippingOptionId: "standard", acknowledgementAccepted: false }); });
    it("shows payment pending label", () => { const request = deferred(); renderScreen({ onContinueToSecurePayment: () => request.promise }); fireEvent.click(screen.getByRole("button", { name: copy.continuePayment })); expect(screen.getByRole("button", { name: copy.openingPayment })).toBeDisabled(); });
    it("prevents duplicate payment activation", () => { const request = deferred(); const onContinueToSecurePayment = vi.fn(() => request.promise); renderScreen({ onContinueToSecurePayment }); fireEvent.click(screen.getByRole("button", { name: copy.continuePayment })); fireEvent.click(screen.getByRole("button", { name: copy.openingPayment })); expect(onContinueToSecurePayment).toHaveBeenCalledTimes(1); });
    it("shows payment rejection toast", async () => { renderScreen({ onContinueToSecurePayment: vi.fn().mockRejectedValue(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.continuePayment })); expect(await screen.findByText(copy.paymentError)).toBeInTheDocument(); });
    it("blocks missing shipping selection", () => { renderScreen({ report: reportWith({ selectedShippingOptionId: undefined }) }); expect(screen.getByRole("button", { name: copy.selectShippingToContinue })).toBeDisabled(); });
    it("blocks cart-review state", () => { renderScreen({ report: reportWith({ paymentBlockReason: "review-cart", canProceedToSecurePayment: false }) }); expect(screen.getByRole("button", { name: copy.reviewCartToContinue })).toBeDisabled(); });
    it("does not block offline route when host permits", () => { renderScreen({ isOffline: true }); expect(screen.getByRole("button", { name: copy.continuePayment })).toBeEnabled(); });
    it("shows reconnect label for offline blocked route", () => { renderScreen({ isOffline: true, canOpenSecurePayment: false }); expect(screen.getByRole("button", { name: copy.reconnectToContinue })).toBeDisabled(); });
    it("shows unavailable label for online blocked route", () => { renderScreen({ canOpenSecurePayment: false }); expect(screen.getByRole("button", { name: copy.paymentUnavailable })).toBeDisabled(); });
    it("respects host business eligibility", () => { renderScreen({ report: reportWith({ canProceedToSecurePayment: false }) }); expect(screen.getByRole("button", { name: copy.paymentUnavailable })).toBeDisabled(); });
    it("blocks review-cart reason even when host payment eligibility is true", () => {
      const onContinueToSecurePayment = vi.fn();
      renderScreen({ report: reportWith({ canProceedToSecurePayment: true, paymentBlockReason: "review-cart" }), onContinueToSecurePayment });
      const button = screen.getByRole("button", { name: copy.reviewCartToContinue });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onContinueToSecurePayment).not.toHaveBeenCalled();
    });
    it("blocks select-shipping reason even when an available option is selected", () => {
      const onContinueToSecurePayment = vi.fn();
      renderScreen({ report: reportWith({ canProceedToSecurePayment: true, paymentBlockReason: "select-shipping", selectedShippingOptionId: "standard" }), onContinueToSecurePayment });
      const button = screen.getByRole("button", { name: copy.selectShippingToContinue });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onContinueToSecurePayment).not.toHaveBeenCalled();
    });
    it("renders unavailable payment copy and blocks routing for checkout-unavailable reason", () => {
      const onContinueToSecurePayment = vi.fn();
      renderScreen({ report: reportWith({ canProceedToSecurePayment: true, paymentBlockReason: "checkout-unavailable" }), onContinueToSecurePayment });
      const button = screen.getByRole("button", { name: copy.paymentUnavailable });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onContinueToSecurePayment).not.toHaveBeenCalled();
    });
    it("renders unavailable payment copy when host eligibility is false without an explicit reason", () => {
      renderScreen({ report: reportWith({ canProceedToSecurePayment: false, paymentBlockReason: null }) });
      expect(screen.getByRole("button", { name: copy.paymentUnavailable })).toBeDisabled();
    });
    it("blocks an unavailable selected shipping option", () => {
      renderScreen({ report: reportWith({ selectedShippingOptionId: "pickup" }) });
      expect(screen.getByRole("button", { name: copy.selectShippingToContinue })).toBeDisabled();
    });
    it("does not invoke payment callback while an authoritative payment block reason exists", () => {
      const onContinueToSecurePayment = vi.fn();
      renderScreen({ report: reportWith({ paymentBlockReason: "review-cart" }), onContinueToSecurePayment });
      fireEvent.click(screen.getByRole("button", { name: copy.reviewCartToContinue }));
      expect(onContinueToSecurePayment).not.toHaveBeenCalled();
    });
    it("keeps Back to details enabled when shipping selection is missing", () => {
      renderScreen({ report: reportWith({ selectedShippingOptionId: undefined }) });
      expect(screen.getByRole("button", { name: copy.backToDetails })).toBeEnabled();
    });
    it("keeps Back to details enabled when required acknowledgement is unchecked", () => {
      renderScreen({ report: reportWith({ acknowledgement: { required: true, label: "I reviewed my order." } }) });
      expect(screen.getByRole("button", { name: copy.backToDetails })).toBeEnabled();
    });
    it("keeps Back to details enabled when the payment route is unavailable", () => {
      renderScreen({ canOpenSecurePayment: false });
      expect(screen.getByRole("button", { name: copy.backToDetails })).toBeEnabled();
    });
    it("disables Back to details while an async callback is pending", () => {
      const request = deferred();
      renderScreen({ onContinueToSecurePayment: () => request.promise });
      fireEvent.click(screen.getByRole("button", { name: copy.continuePayment }));
      expect(screen.getByRole("button", { name: copy.backToDetails })).toBeDisabled();
    });
  });

  describe("navigation and toast", () => {
    it("invokes Back callback", () => { const onBack = vi.fn(); renderScreen({ onBack }); fireEvent.click(screen.getByRole("button", { name: copy.back })); expect(onBack).toHaveBeenCalledTimes(1); });
    it("shows Back rejection toast", async () => { renderScreen({ onBack: vi.fn().mockRejectedValue(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.back })); expect(await screen.findByText(copy.backError)).toBeInTheDocument(); });
    it("positions ready rejection toast above footer", async () => { renderScreen({ onEditDetails: vi.fn().mockRejectedValue(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.editDetails })); await screen.findByText(copy.editDetailsError); expect(toastRegion()).toHaveClass("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_150px)]"); });
    it("positions error retry toast at safe bottom", async () => { renderScreen({ state: "error", report: null, onRetryLoad: vi.fn().mockRejectedValue(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.retry })); await screen.findByText(copy.retryError); expect(toastRegion()).toHaveClass("bottom-[max(24px,env(safe-area-inset-bottom))]"); });
  });

  describe("defensive helpers", () => {
    it("normalises negative integers", () => expect(normaliseNonNegativeInteger(-2)).toBe(0));
    it("truncates decimals", () => expect(normaliseNonNegativeInteger(2.9)).toBe(2));
    it("formats singular cart count", () => expect(formatCartItemCount(1)).toBe("1 item"));
    it("detects unavailable items", () => expect(isCheckoutReviewItemUnavailable({ ...itemA, availabilityState: "unavailable" })).toBe(true));
    it("gets host selected shipping option", () => expect(getSelectedShippingOption(reportWith())?.id).toBe("standard"));
    it("detects missing shipping selection", () => expect(needsShippingSelection(reportWith({ selectedShippingOptionId: undefined }))).toBe(true));
    it("detects unavailable selected shipping option", () => expect(needsShippingSelection(reportWith({ selectedShippingOptionId: "pickup" }))).toBe(true));
    it("detects authoritative payment block reasons", () => expect(hasSecurePaymentBlockReason(reportWith({ paymentBlockReason: "checkout-unavailable" }))).toBe(true));
  });

  describe("architecture boundary", () => {
    it("contains no account creation, sign-in requirement, promo UI, or bottom navigation", () => {
      renderScreen();
      const text = (document.body.textContent ?? "").toLowerCase();
      expect(text).not.toContain("create account to continue");
      expect(text).not.toContain("sign in required");
      expect(text).not.toContain("promo code");
      expect(document.querySelector("nav")).not.toBeInTheDocument();
    });

    it("contains no payment fields or external redirect controls", () => {
      renderScreen();
      expect(document.querySelector('input[name*="card" i], input[name*="cvv" i], input[name*="expiry" i], iframe, a')).not.toBeInTheDocument();
    });

    it("contains no file input", () => { renderScreen(); expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument(); });

    it("does not invoke camera, geolocation, fetch, storage, or IndexedDB APIs", () => {
      const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
      const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");
      const originalFetch = Object.getOwnPropertyDescriptor(window, "fetch");
      const mediaDevices = { getUserMedia: vi.fn() };
      const geolocation = { getCurrentPosition: vi.fn() };
      const fetchSpy = vi.fn();
      const storageSpy = vi.spyOn(Storage.prototype, "setItem");
      const indexedDbSpy = vi.fn();
      const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB");
      try {
        Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: mediaDevices });
        Object.defineProperty(navigator, "geolocation", { configurable: true, value: geolocation });
        Object.defineProperty(window, "fetch", { configurable: true, value: fetchSpy });
        Object.defineProperty(window, "indexedDB", { configurable: true, value: { open: indexedDbSpy } });
        renderScreen();
        expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
        expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(storageSpy).not.toHaveBeenCalled();
        expect(indexedDbSpy).not.toHaveBeenCalled();
      } finally {
        storageSpy.mockRestore();
        if (originalMediaDevices) Object.defineProperty(navigator, "mediaDevices", originalMediaDevices); else delete (navigator as unknown as Record<string, unknown>).mediaDevices;
        if (originalGeolocation) Object.defineProperty(navigator, "geolocation", originalGeolocation); else delete (navigator as unknown as Record<string, unknown>).geolocation;
        if (originalFetch) Object.defineProperty(window, "fetch", originalFetch); else delete (window as unknown as Record<string, unknown>).fetch;
        if (originalIndexedDb) Object.defineProperty(window, "indexedDB", originalIndexedDb); else delete (window as unknown as Record<string, unknown>).indexedDB;
      }
    });

    it("restores mocked browser descriptors", () => {
      expect(() => Object.getOwnPropertyDescriptor(navigator, "mediaDevices")).not.toThrow();
      expect(() => Object.getOwnPropertyDescriptor(navigator, "geolocation")).not.toThrow();
    });
  });

  describe("focused fail-closed regressions", () => {
    it("preserves the mobile-first DOM and reading order", () => {
      renderScreen({
        report: reportWith({
          acknowledgement: {
            required: true,
            label: "I reviewed my order.",
          },
        }),
      });

      const text = document.body.textContent ?? "";
      const expectedOrder = [
        copy.heading,
        copy.deliveryDetailsHeading,
        copy.orderItemsHeading,
        copy.shippingHeading,
        copy.orderSummaryHeading,
        copy.acknowledgementHeading,
        copy.paymentHandoff,
      ];

      expectedOrder.reduce((previousIndex, value) => {
        const currentIndex = text.indexOf(value);
        expect(currentIndex).toBeGreaterThan(previousIndex);
        return currentIndex;
      }, -1);
    });

    it("renders only one h1 in the ready experience", () => {
      renderScreen();
      expect(document.querySelectorAll("h1")).toHaveLength(1);
    });

    it("fails closed for an unknown runtime payment-block reason", () => {
      const onContinueToSecurePayment = vi.fn();
      const report = {
        ...reportWith(),
        paymentBlockReason: "unexpected",
      } as unknown as CheckoutReviewReport;

      renderScreen({ report, onContinueToSecurePayment });

      const button = screen.getByRole("button", {
        name: copy.paymentUnavailable,
      });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onContinueToSecurePayment).not.toHaveBeenCalled();
    });

    it.each<[string, Partial<CheckoutReviewReport>]>([
      ["empty checkoutSessionId", { checkoutSessionId: "" }],
      ["whitespace checkoutSessionId", { checkoutSessionId: "   " }],
      ["empty reviewId", { reviewId: "" }],
      ["whitespace reviewId", { reviewId: "   " }],
      [
        "empty pricing.totalLabel",
        { pricing: { ...reportWith().pricing, totalLabel: "" } },
      ],
      [
        "whitespace pricing.totalLabel",
        { pricing: { ...reportWith().pricing, totalLabel: "   " } },
      ],
    ])("fails closed for %s", (_caseName, overrides) => {
      const onContinueToSecurePayment = vi.fn();
      renderScreen({
        report: reportWith(overrides),
        onContinueToSecurePayment,
      });

      const button = screen.getByRole("button", {
        name: copy.paymentUnavailable,
      });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onContinueToSecurePayment).not.toHaveBeenCalled();
    });

    it("falls back to the existing error experience for an unknown runtime state", () => {
      renderScreen({
        state: "unexpected" as unknown as CheckoutReviewScreenProps["state"],
      });
      expect(
        screen.getByRole("heading", { name: copy.errorHeading }),
      ).toBeInTheDocument();
    });

    it("validates the required secure-payment route context", () => {
      expect(hasValidSecurePaymentContext(reportWith())).toBe(true);
      expect(
        hasValidSecurePaymentContext(reportWith({ reviewId: "   " })),
      ).toBe(false);
    });

    it("recognises only supported checkout-review states", () => {
      expect(isCheckoutReviewState("ready")).toBe(true);
      expect(isCheckoutReviewState("unexpected")).toBe(false);
    });

    it("submits opaque identifiers without rendering them", () => {
      const onContinueToSecurePayment = vi.fn();
      renderScreen({ onContinueToSecurePayment });
      expect(document.body.textContent).not.toContain("checkout-1");
      expect(document.body.textContent).not.toContain("review-1");
      fireEvent.click(
        screen.getByRole("button", { name: copy.continuePayment }),
      );
      expect(onContinueToSecurePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          checkoutSessionId: "checkout-1",
          reviewId: "review-1",
        }),
      );
    });
  });

  describe("additional contract regressions", () => {
    it("keeps unavailable-payment wording out of the loading footer", () => {
      renderScreen({ state: "loading", report: null });
      expect(screen.queryByText(copy.paymentUnavailable)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.reconnectToContinue)).not.toBeInTheDocument();
    });

    it("uses role alert for the error state", () => {
      renderScreen({ state: "error", report: null });
      expect(screen.getByRole("alert")).toHaveTextContent(copy.errorHeading);
    });

    it("invokes the Retry callback", () => {
      const onRetryLoad = vi.fn();
      renderScreen({ state: "error", report: null, onRetryLoad });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(onRetryLoad).toHaveBeenCalledTimes(1);
    });

    it("renders the secure-checkout accessible lock label", () => {
      renderScreen();
      expect(screen.getByRole("img", { name: copy.secureCheckout })).toBeInTheDocument();
    });

    it("renders unavailable-option copy for disabled shipping", () => {
      renderScreen();
      expect(screen.getByText(copy.unavailableOption)).toBeInTheDocument();
    });

    it("does not require shipping selection when no shipping options exist", () => {
      expect(needsShippingSelection(reportWith({ shippingOptions: [], selectedShippingOptionId: undefined }))).toBe(false);
    });

    it("keeps shipping radio selection host controlled after callback resolution", async () => {
      const onSelectShippingOption = vi.fn();
      renderScreen({ onSelectShippingOption });
      fireEvent.click(screen.getByRole("radio", { name: /Express delivery/i }));
      expect(screen.getByRole("radio", { name: /Standard delivery/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /Express delivery/i })).not.toBeChecked();
    });


    it("submits acknowledgementAccepted false after acknowledgement data is removed", () => {
      const acknowledgement = { required: false, label: "I reviewed my order." };
      const onContinueToSecurePayment = vi.fn();
      const { rerender, props } = renderScreen({ report: reportWith({ acknowledgement }), onContinueToSecurePayment });
      fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed my order/i }));
      rerender(<CheckoutReviewScreen {...props} onContinueToSecurePayment={onContinueToSecurePayment} report={reportWith({ acknowledgement: undefined })} />);
      fireEvent.click(screen.getByRole("button", { name: copy.continuePayment }));
      expect(onContinueToSecurePayment).toHaveBeenCalledWith(expect.objectContaining({ acknowledgementAccepted: false }));
    });

    it("includes accepted acknowledgement in payment submission", () => {
      const acknowledgement = { required: true, label: "I reviewed my order." };
      const onContinueToSecurePayment = vi.fn();
      renderScreen({ report: reportWith({ acknowledgement }), onContinueToSecurePayment });
      fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed my order/i }));
      fireEvent.click(screen.getByRole("button", { name: copy.continuePayment }));
      expect(onContinueToSecurePayment).toHaveBeenCalledWith(expect.objectContaining({ acknowledgementAccepted: true }));
    });

    it("omits selected shipping option when host has none and none are required", () => {
      const onContinueToSecurePayment = vi.fn();
      renderScreen({ report: reportWith({ shippingOptions: [], selectedShippingOptionId: undefined }), onContinueToSecurePayment });
      fireEvent.click(screen.getByRole("button", { name: copy.continuePayment }));
      expect(onContinueToSecurePayment).toHaveBeenCalledWith(expect.objectContaining({ selectedShippingOptionId: undefined }));
    });

    it("blocks payment callback when host business eligibility is false", () => {
      const onContinueToSecurePayment = vi.fn();
      renderScreen({ report: reportWith({ canProceedToSecurePayment: false }), onContinueToSecurePayment });
      fireEvent.click(screen.getByRole("button", { name: copy.paymentUnavailable }));
      expect(onContinueToSecurePayment).not.toHaveBeenCalled();
    });

    it("disables Back while payment routing is pending", () => {
      const request = deferred();
      renderScreen({ onContinueToSecurePayment: () => request.promise });
      fireEvent.click(screen.getByRole("button", { name: copy.continuePayment }));
      expect(screen.getByRole("button", { name: copy.back })).toBeDisabled();
    });

    it("disables Edit Cart while payment routing is pending", () => {
      const request = deferred();
      renderScreen({ onContinueToSecurePayment: () => request.promise });
      fireEvent.click(screen.getByRole("button", { name: copy.continuePayment }));
      expect(screen.getByRole("button", { name: copy.editCart })).toBeDisabled();
    });

    it("disables acknowledgement while payment routing is pending", () => {
      const request = deferred();
      const acknowledgement = { required: false, label: "I reviewed my order." };
      renderScreen({ report: reportWith({ acknowledgement }), onContinueToSecurePayment: () => request.promise });
      fireEvent.click(screen.getByRole("button", { name: copy.continuePayment }));
      expect(screen.getByRole("checkbox", { name: /I reviewed my order/i })).toBeDisabled();
    });

    it("keeps the review visible while offline", () => {
      renderScreen({ isOffline: true });
      expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
      expect(screen.getByText(itemA.name)).toBeInTheDocument();
    });

    it("normalises negative pricing counts to zero", () => {
      renderScreen({ report: reportWith({ pricing: { ...reportWith().pricing, itemCount: -9 } }) });
      expect(screen.getByText("0 items")).toBeInTheDocument();
    });

    it("normalises infinite pricing counts to zero", () => {
      renderScreen({ report: reportWith({ pricing: { ...reportWith().pricing, itemCount: Number.POSITIVE_INFINITY } }) });
      expect(screen.getByText("0 items")).toBeInTheDocument();
    });

    it("truncates decimal pricing counts", () => {
      renderScreen({ report: reportWith({ pricing: { ...reportWith().pricing, itemCount: 2.9 } }) });
      expect(screen.getByText("2 items")).toBeInTheDocument();
    });

    it("formats plural cart counts", () => {
      expect(formatCartItemCount(2)).toBe("2 items");
    });

    it("normalises NaN helper input", () => {
      expect(normaliseNonNegativeInteger(Number.NaN)).toBe(0);
    });

    it("returns null for an unknown selected shipping option", () => {
      expect(getSelectedShippingOption(reportWith({ selectedShippingOptionId: "missing" }))).toBeNull();
    });

    it("uses warning text for attention item availability", () => {
      renderScreen();
      expect(screen.getByText("Review availability")).toHaveClass("text-[var(--dl-warning-text)]");
    });

    it("uses warning text for unavailable item availability", () => {
      renderScreen({ report: reportWith({ items: [{ ...itemA, availabilityState: "unavailable" }] }) });
      expect(screen.getByText("Available now")).toHaveClass("text-[var(--dl-warning-text)]");
    });

    it("contains no affiliate, seller, or marketplace wording", () => {
      renderScreen();
      const text = (document.body.textContent ?? "").toLowerCase();
      expect(text).not.toContain("affiliate");
      expect(text).not.toContain("seller");
      expect(text).not.toContain("marketplace");
    });

    it("contains no checkout step indicator", () => {
      renderScreen();
      expect(document.body.textContent).not.toMatch(/step\s+\d+\s+of\s+\d+/i);
    });

    it("does not render a promo-code input", () => {
      renderScreen();
      expect(screen.queryByLabelText(/promo/i)).not.toBeInTheDocument();
    });
  });

});
