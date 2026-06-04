import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CartScreen, {
  copy,
  type CartItem,
  type CartReport,
  type CartScreenProps,
} from "./cart-screen";

const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
const originalGeolocationDescriptor = Object.getOwnPropertyDescriptor(navigator, "geolocation");
const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");

function restoreDescriptor(target: object, property: PropertyKey, descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(target, property, descriptor);
  else Reflect.deleteProperty(target, property);
}

afterEach(() => {
  cleanup();
  restoreDescriptor(navigator, "mediaDevices", originalMediaDevicesDescriptor);
  restoreDescriptor(navigator, "geolocation", originalGeolocationDescriptor);
  restoreDescriptor(globalThis, "fetch", originalFetchDescriptor);
  vi.restoreAllMocks();
});

const cleanser: CartItem = {
  cartItemId: "line-cleanser",
  productId: "product-cleanser",
  brand: "DermaLens",
  name: "Soft Balance Cleanser",
  categoryLabel: "Cleanser",
  imageUrl: "/products/cleanser.png",
  optionLabels: ["50 ml", "Fragrance free"],
  unitPriceLabel: "AED 54",
  lineTotalLabel: "AED 108 line total",
  availabilityState: "available",
  availabilityLabel: "Available now",
  quantity: 2,
  canIncreaseQuantity: true,
  canDecreaseQuantity: true,
  canRemove: true,
};

const moisturiser: CartItem = {
  cartItemId: "line-moisturiser",
  productId: "product-moisturiser",
  brand: "DermaLens",
  name: "Barrier Comfort Cream",
  categoryLabel: "Moisturiser",
  imageUrl: "/products/moisturiser.png",
  optionLabels: [],
  unitPriceLabel: "AED 72",
  availabilityState: "available",
  availabilityLabel: "Available",
  quantity: 1,
  canIncreaseQuantity: true,
  canDecreaseQuantity: true,
  canRemove: true,
};

const attentionSerum: CartItem = {
  cartItemId: "line-serum",
  productId: "product-serum",
  brand: "DermaLens",
  name: "Even Tone Serum",
  categoryLabel: "Serum",
  optionLabels: ["30 ml"],
  unitPriceLabel: "AED 86",
  availabilityState: "attention",
  availabilityLabel: "Review selected option",
  quantity: 1,
  canIncreaseQuantity: true,
  canDecreaseQuantity: true,
  canRemove: true,
};

const unavailableSpf: CartItem = {
  cartItemId: "line-spf",
  productId: "product-spf",
  brand: "DermaLens",
  name: "Daily Comfort SPF",
  categoryLabel: "Sun care",
  optionLabels: [],
  availabilityState: "unavailable",
  availabilityLabel: "Unavailable in your region",
  quantity: 1,
  canIncreaseQuantity: false,
  canDecreaseQuantity: true,
  canRemove: true,
};

const baseReport: CartReport = {
  cartId: "cart-1",
  profileName: " Amara ",
  sourceLabel: "Morning and evening routine collection",
  items: [cleanser, moisturiser, attentionSerum, unavailableSpf],
  summary: {
    itemCount: 5,
    subtotalLabel: "AED 266",
    shippingLabel: "Calculated at checkout",
    taxLabel: "Included",
    totalLabel: "AED 266",
    checkoutNotice: "Final availability is confirmed at checkout.",
  },
};

const baseProps: CartScreenProps = {
  state: "ready",
  report: baseReport,
  onBack: vi.fn(),
  onProceedToCheckout: vi.fn(),
};

function reportWith(overrides: Partial<CartReport> = {}): CartReport {
  return { ...baseReport, ...overrides };
}

function itemWith(base: CartItem, overrides: Partial<CartItem>): CartItem {
  return { ...base, ...overrides };
}

function renderScreen(overrides: Partial<CartScreenProps> = {}) {
  const props: CartScreenProps = {
    ...baseProps,
    onBack: vi.fn(),
    onProceedToCheckout: vi.fn(),
    ...overrides,
  };
  const result = render(<CartScreen {...props} />);
  return { ...result, props };
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function line(cartItemId: string) {
  return screen.getByTestId(`cart-item-${cartItemId}`);
}

function increaseName(item: CartItem) { return `${copy.increaseQuantity}: ${item.name}`; }
function decreaseName(item: CartItem) { return `${copy.decreaseQuantity}: ${item.name}`; }
function quantityName(item: CartItem, quantity: number) { return `${copy.quantityLabel} for ${item.name}: ${quantity}`; }
function detailsName(item: CartItem) { return `${copy.viewDetails}: ${item.name}`; }
function openingProductName(item: CartItem) { return `${copy.openingProduct} ${item.name}`; }
function removeName(item: CartItem) { return `${copy.removeItem}: ${item.name}`; }
function removingName(item: CartItem) { return `${copy.removingItem} ${item.name}`; }

function sourceText(): string {
  return `${copy.heading} ${copy.supporting} ${copy.firstPartyBoundary} ${copy.purchaseOptional}`;
}

describe("CartScreen", () => {
  describe("core states", () => {
    it("renders loading heading", () => {
      renderScreen({ state: "loading", report: null });
      expect(screen.getByRole("heading", { name: copy.loadingHeading })).toBeInTheDocument();
    });

    it("uses polite status semantics for loading", () => {
      renderScreen({ state: "loading", report: null });
      expect(screen.getByText(copy.loadingHeading).closest('[role="status"]')).toHaveAttribute("aria-live", "polite");
    });

    it("keeps buttons outside the loading live region", () => {
      renderScreen({ state: "loading", report: null });
      const status = screen.getByText(copy.loadingHeading).closest('[role="status"]');
      expect(status).not.toBeNull();
      expect(within(status as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders disabled Continue to checkout in loading footer", () => {
      renderScreen({ state: "loading", report: null });
      expect(screen.getByRole("button", { name: copy.checkout })).toBeDisabled();
    });

    it("does not show unavailable checkout copy while loading", () => {
      renderScreen({ state: "loading", report: null });
      expect(screen.queryByRole("button", { name: copy.checkoutUnavailable })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: copy.reconnectToCheckout })).not.toBeInTheDocument();
    });

    it("renders ready heading", () => {
      renderScreen();
      expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
    });

    it("falls back to error when ready state has no report", () => {
      renderScreen({ state: "ready", report: null });
      expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
    });

    it("renders limited availability banner", () => {
      renderScreen({ state: "limited-availability" });
      expect(screen.getByText(copy.limitedAvailability)).toBeInTheDocument();
    });

    it("marks limited availability banner as status", () => {
      renderScreen({ state: "limited-availability" });
      expect(screen.getByText(copy.limitedAvailability).closest('[role="status"]')).toBeInTheDocument();
    });

    it("renders empty heading", () => {
      renderScreen({ state: "empty", report: null });
      expect(screen.getByRole("heading", { name: copy.emptyHeading })).toBeInTheDocument();
    });

    it("renders no fake cart items in empty state", () => {
      renderScreen({ state: "empty", report: null });
      expect(screen.queryByTestId("cart-item-list")).not.toBeInTheDocument();
    });

    it("renders no sticky footer in empty state", () => {
      renderScreen({ state: "empty", report: null });
      expect(screen.queryByRole("button", { name: copy.checkout })).not.toBeInTheDocument();
    });

    it("renders error heading", () => {
      renderScreen({ state: "error", report: null });
      expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
    });

    it("uses alert semantics for error state", () => {
      renderScreen({ state: "error", report: null });
      expect(screen.getByRole("alert")).toContainElement(screen.getByRole("heading", { name: copy.errorHeading }));
    });

    it("keeps buttons outside error alert", () => {
      renderScreen({ state: "error", report: null, onRetryLoad: vi.fn() });
      expect(within(screen.getByRole("alert")).queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders Retry only when supplied", () => {
      const { rerender, props } = renderScreen({ state: "error", report: null });
      expect(screen.queryByRole("button", { name: copy.retry })).not.toBeInTheDocument();
      rerender(<CartScreen {...props} onRetryLoad={vi.fn()} />);
      expect(screen.getByRole("button", { name: copy.retry })).toBeInTheDocument();
    });

    it("invokes Retry", () => {
      const onRetryLoad = vi.fn();
      renderScreen({ state: "error", report: null, onRetryLoad });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(onRetryLoad).toHaveBeenCalledTimes(1);
    });

    it("renders Retry pending label", () => {
      const pending = deferred();
      renderScreen({ state: "error", report: null, onRetryLoad: () => pending.promise });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(screen.getByRole("button", { name: copy.retrying })).toBeDisabled();
    });

    it("prevents duplicate Retry", () => {
      const pending = deferred();
      const onRetryLoad = vi.fn(() => pending.promise);
      renderScreen({ state: "error", report: null, onRetryLoad });
      const button = screen.getByRole("button", { name: copy.retry });
      fireEvent.click(button);
      fireEvent.click(button);
      expect(onRetryLoad).toHaveBeenCalledTimes(1);
    });

    it("shows toast after Retry rejection", async () => {
      renderScreen({ state: "error", report: null, onRetryLoad: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
    });
  });

  describe("cart ordering and metadata", () => {
    it("preserves cart item ordering", () => {
      renderScreen();
      expect(screen.getAllByRole("heading", { level: 2 }).slice(0, 4).map((node) => node.textContent)).toEqual([
        cleanser.name,
        moisturiser.name,
        attentionSerum.name,
        unavailableSpf.name,
      ]);
    });

    it("renders product brand", () => {
      renderScreen();
      expect(screen.getAllByText(cleanser.brand).length).toBeGreaterThan(0);
    });

    it("renders product name", () => {
      renderScreen();
      expect(screen.getByText(cleanser.name)).toBeInTheDocument();
    });

    it("renders category", () => {
      renderScreen();
      expect(screen.getByText(cleanser.categoryLabel)).toBeInTheDocument();
    });

    it("renders unit price label unchanged", () => {
      renderScreen();
      expect(screen.getByText(cleanser.unitPriceLabel as string)).toBeInTheDocument();
    });

    it("renders line total label unchanged", () => {
      renderScreen();
      expect(screen.getByText(cleanser.lineTotalLabel as string)).toBeInTheDocument();
    });

    it("preserves host availability label", () => {
      renderScreen();
      expect(screen.getByText(unavailableSpf.availabilityLabel)).toBeInTheDocument();
    });

    it("falls back to Available for blank available label", () => {
      renderScreen({ report: reportWith({ items: [itemWith(cleanser, { availabilityLabel: "" })] }) });
      expect(screen.getByText(copy.productAvailable)).toBeInTheDocument();
    });

    it("falls back to Currently unavailable for blank unavailable label", () => {
      renderScreen({ report: reportWith({ items: [itemWith(unavailableSpf, { availabilityLabel: "" })] }) });
      expect(screen.getByText(copy.productUnavailable)).toBeInTheDocument();
    });

    it("keeps unavailable item visible", () => {
      renderScreen();
      expect(screen.getByText(unavailableSpf.name)).toBeInTheDocument();
    });

    it("uses warning text for attention availability", () => {
      renderScreen();
      expect(screen.getByText(attentionSerum.availabilityLabel)).toHaveClass("text-[var(--dl-warning-text)]");
    });

    it("preserves selected option ordering", () => {
      renderScreen();
      const card = line(cleanser.cartItemId);
      const text = card.textContent ?? "";
      expect(text.indexOf("50 ml")).toBeLessThan(text.indexOf("Fragrance free"));
    });

    it("omits selected options section when empty", () => {
      renderScreen({ report: reportWith({ items: [moisturiser] }) });
      expect(screen.queryByText(copy.selectedOptions)).not.toBeInTheDocument();
    });

    it("renders profile name trimmed", () => {
      renderScreen();
      expect(screen.getByText("Amara")).toBeInTheDocument();
    });

    it("renders source label unchanged", () => {
      renderScreen();
      expect(screen.getByText(baseReport.sourceLabel as string)).toBeInTheDocument();
    });

    it("renders accessible top cart count badge", () => {
      renderScreen();
      expect(screen.getByLabelText("5 items in cart")).toHaveTextContent("5");
    });

    it("uses singular top cart count badge wording", () => {
      renderScreen({ report: reportWith({ summary: { ...baseReport.summary, itemCount: 1 } }) });
      expect(screen.getByLabelText("1 item in cart")).toHaveTextContent("1");
    });
  });

  describe("product images", () => {
    it("renders host image URL", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }) });
      expect(screen.getByRole("img", { name: `${cleanser.brand} ${cleanser.name}` })).toHaveAttribute("src", cleanser.imageUrl);
    });

    it("uses meaningful image alt", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }) });
      expect(screen.getByRole("img", { name: `${cleanser.brand} ${cleanser.name}` })).toBeInTheDocument();
    });

    it("renders readable placeholder after image failure", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }) });
      fireEvent.error(screen.getByRole("img", { name: `${cleanser.brand} ${cleanser.name}` }));
      expect(screen.getByText(copy.productImageUnavailable)).toBeInTheDocument();
    });

    it("does not hide actions after image failure", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }), onOpenProduct: vi.fn() });
      fireEvent.error(screen.getByRole("img", { name: `${cleanser.brand} ${cleanser.name}` }));
      expect(screen.getByRole("button", { name: detailsName(cleanser) })).toBeInTheDocument();
    });

    it("resets image error when URL changes", () => {
      const { rerender, props } = renderScreen({ report: reportWith({ items: [cleanser] }) });
      fireEvent.error(screen.getByRole("img", { name: `${cleanser.brand} ${cleanser.name}` }));
      const changed = itemWith(cleanser, { imageUrl: "/products/new-cleanser.png" });
      rerender(<CartScreen {...props} report={reportWith({ items: [changed] })} />);
      expect(screen.getByRole("img", { name: `${changed.brand} ${changed.name}` })).toHaveAttribute("src", changed.imageUrl);
    });
  });

  describe("quantity handling", () => {
    it("renders valid quantity", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }) });
      expect(screen.getByLabelText(quantityName(cleanser, 2))).toHaveTextContent("2");
    });

    it("uses labelled quantity group", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }) });
      expect(screen.getByRole("group", { name: `${cleanser.name} quantity controls` })).toBeInTheDocument();
    });

    it("exposes product-specific decrease label", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }) });
      expect(screen.getByRole("button", { name: decreaseName(cleanser) })).toBeInTheDocument();
    });

    it("exposes product-specific increase label", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }) });
      expect(screen.getByRole("button", { name: increaseName(cleanser) })).toBeInTheDocument();
    });

    it("uses polite live quantity label", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }) });
      expect(screen.getByLabelText(quantityName(cleanser, 2))).toHaveAttribute("aria-live", "polite");
    });

    it("invokes increase with cartItemId", () => {
      const onIncreaseQuantity = vi.fn();
      renderScreen({ report: reportWith({ items: [cleanser] }), onIncreaseQuantity });
      fireEvent.click(screen.getByRole("button", { name: increaseName(cleanser) }));
      expect(onIncreaseQuantity).toHaveBeenCalledWith(cleanser.cartItemId);
    });

    it("invokes decrease with cartItemId", () => {
      const onDecreaseQuantity = vi.fn();
      renderScreen({ report: reportWith({ items: [cleanser] }), onDecreaseQuantity });
      fireEvent.click(screen.getByRole("button", { name: decreaseName(cleanser) }));
      expect(onDecreaseQuantity).toHaveBeenCalledWith(cleanser.cartItemId);
    });

    it("respects increase host flag", () => {
      const item = itemWith(cleanser, { canIncreaseQuantity: false });
      renderScreen({ report: reportWith({ items: [item] }), onIncreaseQuantity: vi.fn() });
      expect(screen.getByRole("button", { name: increaseName(item) })).toBeDisabled();
    });

    it("respects decrease host flag", () => {
      const item = itemWith(cleanser, { canDecreaseQuantity: false });
      renderScreen({ report: reportWith({ items: [item] }), onDecreaseQuantity: vi.fn() });
      expect(screen.getByRole("button", { name: decreaseName(item) })).toBeDisabled();
    });

    it("disables quantity actions when modification blocked", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }), canModifyCart: false, onIncreaseQuantity: vi.fn(), onDecreaseQuantity: vi.fn() });
      expect(screen.getByRole("button", { name: increaseName(cleanser) })).toBeDisabled();
      expect(screen.getByRole("button", { name: decreaseName(cleanser) })).toBeDisabled();
    });

    it("disables increase for unavailable item", () => {
      const item = itemWith(unavailableSpf, { canIncreaseQuantity: true });
      renderScreen({ report: reportWith({ items: [item] }), onIncreaseQuantity: vi.fn() });
      expect(screen.getByRole("button", { name: increaseName(item) })).toBeDisabled();
    });

    it("allows unavailable item decrease when host permits", () => {
      renderScreen({ report: reportWith({ items: [unavailableSpf] }), onDecreaseQuantity: vi.fn() });
      expect(screen.getByRole("button", { name: decreaseName(unavailableSpf) })).toBeEnabled();
    });

    it.each([
      ["negative", -3, 0],
      ["NaN", Number.NaN, 0],
      ["positive infinity", Number.POSITIVE_INFINITY, 0],
      ["decimal", 2.9, 2],
    ])("normalises %s quantity", (_name, quantity, expected) => {
      const item = itemWith(cleanser, { quantity });
      renderScreen({ report: reportWith({ items: [item] }) });
      expect(screen.getByLabelText(quantityName(item, expected))).toHaveTextContent(String(expected));
    });

    it("shows review warning for zero quantity", () => {
      const item = itemWith(cleanser, { quantity: 0 });
      renderScreen({ report: reportWith({ items: [item] }) });
      expect(screen.getByText(copy.quantityNeedsAttention)).toBeInTheDocument();
    });

    it("disables decrement for zero quantity", () => {
      const item = itemWith(cleanser, { quantity: 0 });
      renderScreen({ report: reportWith({ items: [item] }), onDecreaseQuantity: vi.fn() });
      expect(screen.getByRole("button", { name: decreaseName(item) })).toBeDisabled();
    });

    it("shows Updating only on exact line", () => {
      const pending = deferred();
      renderScreen({ report: reportWith({ items: [cleanser, moisturiser] }), onIncreaseQuantity: () => pending.promise });
      fireEvent.click(screen.getByRole("button", { name: increaseName(cleanser) }));
      expect(within(line(cleanser.cartItemId)).getByText(copy.updatingQuantity)).toBeInTheDocument();
      expect(within(line(moisturiser.cartItemId)).queryByText(copy.updatingQuantity)).not.toBeInTheDocument();
    });

    it("scopes reused product IDs to exact line", () => {
      const variant = itemWith(moisturiser, { cartItemId: "line-cleanser-variant", productId: cleanser.productId, name: "Soft Balance Cleanser Travel" });
      const pending = deferred();
      renderScreen({ report: reportWith({ items: [cleanser, variant] }), onIncreaseQuantity: () => pending.promise });
      fireEvent.click(screen.getByRole("button", { name: increaseName(cleanser) }));
      expect(within(line(cleanser.cartItemId)).getByText(copy.updatingQuantity)).toBeInTheDocument();
      expect(within(line(variant.cartItemId)).queryByText(copy.updatingQuantity)).not.toBeInTheDocument();
    });

    it("prevents duplicate quantity activation", () => {
      const pending = deferred();
      const onIncreaseQuantity = vi.fn(() => pending.promise);
      renderScreen({ report: reportWith({ items: [cleanser] }), onIncreaseQuantity });
      const button = screen.getByRole("button", { name: increaseName(cleanser) });
      fireEvent.click(button);
      fireEvent.click(button);
      expect(onIncreaseQuantity).toHaveBeenCalledTimes(1);
    });

    it("shows toast on quantity rejection", async () => {
      renderScreen({ report: reportWith({ items: [cleanser] }), onIncreaseQuantity: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: increaseName(cleanser) }));
      expect(await screen.findByText(copy.increaseError)).toBeInTheDocument();
    });
  });

  describe("product details", () => {
    it("renders View Details only when callback exists", () => {
      const { rerender, props } = renderScreen({ report: reportWith({ items: [cleanser] }) });
      expect(screen.queryByRole("button", { name: detailsName(cleanser) })).not.toBeInTheDocument();
      rerender(<CartScreen {...props} onOpenProduct={vi.fn()} report={reportWith({ items: [cleanser] })} />);
      expect(screen.getByRole("button", { name: detailsName(cleanser) })).toBeInTheDocument();
    });

    it("exposes product-specific details name", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }), onOpenProduct: vi.fn() });
      expect(screen.getByRole("button", { name: detailsName(cleanser) })).toBeInTheDocument();
    });

    it("invokes product callback with productId", () => {
      const onOpenProduct = vi.fn();
      renderScreen({ report: reportWith({ items: [cleanser] }), onOpenProduct });
      fireEvent.click(screen.getByRole("button", { name: detailsName(cleanser) }));
      expect(onOpenProduct).toHaveBeenCalledWith(cleanser.productId);
    });

    it("shows opening product only on activated line", () => {
      const pending = deferred();
      renderScreen({ report: reportWith({ items: [cleanser, moisturiser] }), onOpenProduct: () => pending.promise });
      fireEvent.click(screen.getByRole("button", { name: detailsName(cleanser) }));
      expect(within(line(cleanser.cartItemId)).getByRole("button", { name: openingProductName(cleanser) })).toBeInTheDocument();
      expect(within(line(moisturiser.cartItemId)).getByRole("button", { name: detailsName(moisturiser) })).toBeInTheDocument();
    });

    it("shows toast on product route rejection", async () => {
      renderScreen({ report: reportWith({ items: [cleanser] }), onOpenProduct: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: detailsName(cleanser) }));
      expect(await screen.findByText(copy.productError)).toBeInTheDocument();
    });
  });

  describe("removal", () => {
    it("renders Remove only when callback exists and line permits", () => {
      const { rerender, props } = renderScreen({ report: reportWith({ items: [cleanser] }) });
      expect(screen.queryByRole("button", { name: removeName(cleanser) })).not.toBeInTheDocument();
      rerender(<CartScreen {...props} onRemoveItem={vi.fn()} report={reportWith({ items: [cleanser] })} />);
      expect(screen.getByRole("button", { name: removeName(cleanser) })).toBeInTheDocument();
      const locked = itemWith(cleanser, { canRemove: false });
      rerender(<CartScreen {...props} onRemoveItem={vi.fn()} report={reportWith({ items: [locked] })} />);
      expect(screen.queryByRole("button", { name: removeName(locked) })).not.toBeInTheDocument();
    });

    it("exposes product-specific remove name", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }), onRemoveItem: vi.fn() });
      expect(screen.getByRole("button", { name: removeName(cleanser) })).toBeInTheDocument();
    });

    it("invokes remove with cartItemId", () => {
      const onRemoveItem = vi.fn();
      renderScreen({ report: reportWith({ items: [cleanser] }), onRemoveItem });
      fireEvent.click(screen.getByRole("button", { name: removeName(cleanser) }));
      expect(onRemoveItem).toHaveBeenCalledWith(cleanser.cartItemId);
    });

    it("shows remove pending only on exact line", () => {
      const pending = deferred();
      renderScreen({ report: reportWith({ items: [cleanser, moisturiser] }), onRemoveItem: () => pending.promise });
      fireEvent.click(screen.getByRole("button", { name: removeName(cleanser) }));
      expect(within(line(cleanser.cartItemId)).getByRole("button", { name: removingName(cleanser) })).toBeDisabled();
      expect(within(line(moisturiser.cartItemId)).getByRole("button", { name: removeName(moisturiser) })).toBeDisabled();
    });

    it("disables remove during pending request", () => {
      const pending = deferred();
      renderScreen({ report: reportWith({ items: [cleanser] }), onRemoveItem: () => pending.promise });
      fireEvent.click(screen.getByRole("button", { name: removeName(cleanser) }));
      expect(screen.getByRole("button", { name: removingName(cleanser) })).toBeDisabled();
    });

    it("prevents duplicate removal", () => {
      const pending = deferred();
      const onRemoveItem = vi.fn(() => pending.promise);
      renderScreen({ report: reportWith({ items: [cleanser] }), onRemoveItem });
      const button = screen.getByRole("button", { name: removeName(cleanser) });
      fireEvent.click(button);
      fireEvent.click(button);
      expect(onRemoveItem).toHaveBeenCalledTimes(1);
    });

    it("shows toast on remove rejection", async () => {
      renderScreen({ report: reportWith({ items: [cleanser] }), onRemoveItem: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: removeName(cleanser) }));
      expect(await screen.findByText(copy.removeError)).toBeInTheDocument();
    });

    it("keeps unavailable item removable", () => {
      renderScreen({ report: reportWith({ items: [unavailableSpf] }), onRemoveItem: vi.fn() });
      expect(screen.getByRole("button", { name: removeName(unavailableSpf) })).toBeEnabled();
    });
  });

  describe("order summary", () => {
    it("renders order summary heading", () => {
      renderScreen();
      expect(screen.getByRole("heading", { name: copy.orderSummary })).toBeInTheDocument();
    });

    it.each([
      ["negative", -2, "0 items"],
      ["NaN", Number.NaN, "0 items"],
      ["positive infinity", Number.POSITIVE_INFINITY, "0 items"],
      ["decimal", 2.9, "2 items"],
    ])("normalises %s summary count", (_name, itemCount, expected) => {
      renderScreen({ report: reportWith({ summary: { ...baseReport.summary, itemCount } }) });
      expect(within(screen.getByTestId("order-summary-values")).getByText(expected)).toBeInTheDocument();
    });

    it.each([
      [copy.subtotal, baseReport.summary.subtotalLabel],
      [copy.shipping, baseReport.summary.shippingLabel],
      [copy.tax, baseReport.summary.taxLabel],
      [copy.total, baseReport.summary.totalLabel],
    ])("renders %s label unchanged", (label, value) => {
      renderScreen();
      const row = screen.getByText(label).parentElement;
      expect(row).toHaveTextContent(value as string);
    });

    it("omits missing optional commerce rows", () => {
      renderScreen({ report: reportWith({ summary: { itemCount: 1 } }) });
      expect(screen.queryByText(copy.subtotal)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.shipping)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.tax)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.total)).not.toBeInTheDocument();
    });

    it("renders checkout notice unchanged", () => {
      renderScreen();
      expect(screen.getByText(baseReport.summary.checkoutNotice as string)).toBeInTheDocument();
    });

    it("uses polite live region for summary values", () => {
      renderScreen();
      expect(screen.getByTestId("order-summary-values")).toHaveAttribute("aria-live", "polite");
    });

    it("does not calculate pricing", () => {
      renderScreen();
      expect(screen.getAllByText(baseReport.summary.totalLabel as string).length).toBeGreaterThan(0);
      expect(screen.getByText(cleanser.lineTotalLabel as string)).toBeInTheDocument();
    });
  });

  describe("checkout and navigation", () => {
    it("invokes checkout", () => {
      const onProceedToCheckout = vi.fn();
      renderScreen({ onProceedToCheckout });
      fireEvent.click(screen.getByRole("button", { name: copy.checkout }));
      expect(onProceedToCheckout).toHaveBeenCalledTimes(1);
    });

    it("renders checkout pending label", () => {
      const pending = deferred();
      renderScreen({ onProceedToCheckout: () => pending.promise });
      fireEvent.click(screen.getByRole("button", { name: copy.checkout }));
      expect(screen.getByRole("button", { name: copy.openingCheckout })).toBeDisabled();
    });

    it("prevents duplicate checkout", () => {
      const pending = deferred();
      const onProceedToCheckout = vi.fn(() => pending.promise);
      renderScreen({ onProceedToCheckout });
      const button = screen.getByRole("button", { name: copy.checkout });
      fireEvent.click(button);
      fireEvent.click(button);
      expect(onProceedToCheckout).toHaveBeenCalledTimes(1);
    });

    it("shows toast on checkout rejection", async () => {
      renderScreen({ onProceedToCheckout: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: copy.checkout }));
      expect(await screen.findByText(copy.checkoutError)).toBeInTheDocument();
    });

    it("disables checkout when normalised count is zero", () => {
      renderScreen({ report: reportWith({ summary: { ...baseReport.summary, itemCount: Number.NaN } }) });
      expect(screen.getByRole("button", { name: copy.checkout })).toBeDisabled();
    });

    it("offline alone does not block checkout", () => {
      renderScreen({ isOffline: true, canProceedToCheckout: true });
      expect(screen.getByRole("button", { name: copy.checkout })).toBeEnabled();
    });

    it("shows reconnect label when offline checkout blocked", () => {
      renderScreen({ isOffline: true, canProceedToCheckout: false });
      expect(screen.getByRole("button", { name: copy.reconnectToCheckout })).toBeDisabled();
    });

    it("shows unavailable label when online checkout blocked", () => {
      renderScreen({ isOffline: false, canProceedToCheckout: false });
      expect(screen.getByRole("button", { name: copy.checkoutUnavailable })).toBeDisabled();
    });

    it("invokes Back from Continue Shopping", () => {
      const onBack = vi.fn();
      renderScreen({ onBack });
      fireEvent.click(screen.getByRole("button", { name: copy.continueShopping }));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("invokes top Back", () => {
      const onBack = vi.fn();
      renderScreen({ onBack });
      fireEvent.click(screen.getByRole("button", { name: copy.back }));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("shows toast on Back rejection", async () => {
      renderScreen({ onBack: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: copy.back }));
      expect(await screen.findByText(copy.backError)).toBeInTheDocument();
    });

    it("disables conflicting controls during checkout", () => {
      const pending = deferred();
      renderScreen({ onProceedToCheckout: () => pending.promise, onIncreaseQuantity: vi.fn() });
      fireEvent.click(screen.getByRole("button", { name: copy.checkout }));
      expect(screen.getByRole("button", { name: copy.back })).toBeDisabled();
      expect(screen.getByRole("button", { name: increaseName(cleanser) })).toBeDisabled();
    });
  });

  describe("toast positioning", () => {
    it("positions ready checkout rejection above sticky footer", async () => {
      renderScreen({ onProceedToCheckout: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: copy.checkout }));
      await screen.findByText(copy.checkoutError);
      expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_150px)]");
    });

    it("positions ready quantity rejection above sticky footer", async () => {
      renderScreen({ onIncreaseQuantity: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: increaseName(cleanser) }));
      await screen.findByText(copy.increaseError);
      expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_150px)]");
    });

    it("positions error Retry toast at bottom safe area", async () => {
      renderScreen({ state: "error", report: null, onRetryLoad: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: copy.retry }));
      await screen.findByText(copy.retryError);
      expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[max(24px,env(safe-area-inset-bottom))]");
    });

    it("positions empty Continue Shopping toast at bottom safe area", async () => {
      renderScreen({ state: "empty", report: null, onBack: () => Promise.reject(new Error("no")) });
      fireEvent.click(screen.getByRole("button", { name: copy.continueShopping }));
      await screen.findByText(copy.backError);
      expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[max(24px,env(safe-area-inset-bottom))]");
    });
  });

  describe("architecture boundary", () => {
    it("renders no promo-code input", () => {
      renderScreen();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("renders no external anchor", () => {
      renderScreen();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it.each([
      ["affiliate", /affiliate/i],
      ["external seller", /external seller/i],
      ["marketplace", /marketplace/i],
      ["sponsored", /sponsored/i],
      ["prescription", /prescription/i],
      ["treatment plan", /treatment plan/i],
      ["cure", /\bcure\b/i],
      ["diagnosis", /diagnosis/i],
    ])("excludes %s wording", (_label, pattern) => {
      expect(sourceText()).not.toMatch(pattern);
    });

    it("renders no file input", () => {
      const { container } = renderScreen();
      expect(container.querySelector('input[type="file"]')).toBeNull();
    });

    it("renders no live video", () => {
      const { container } = renderScreen();
      expect(container.querySelector("video")).toBeNull();
    });

    it("does not call camera API", () => {
      const getUserMedia = vi.fn();
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
      renderScreen();
      expect(getUserMedia).not.toHaveBeenCalled();
    });

    it("does not request geolocation", () => {
      const getCurrentPosition = vi.fn();
      Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
      renderScreen();
      expect(getCurrentPosition).not.toHaveBeenCalled();
    });

    it("does not call fetch", () => {
      const fetch = vi.fn();
      Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetch });
      renderScreen();
      expect(fetch).not.toHaveBeenCalled();
    });

    it("does not mutate cart quantity internally", () => {
      renderScreen({ report: reportWith({ items: [cleanser] }), onIncreaseQuantity: vi.fn() });
      fireEvent.click(screen.getByRole("button", { name: increaseName(cleanser) }));
      expect(screen.getByLabelText(quantityName(cleanser, 2))).toHaveTextContent("2");
    });

    it("does not calculate subtotal", () => {
      renderScreen();
      expect(screen.getAllByText(baseReport.summary.subtotalLabel as string).length).toBeGreaterThan(0);
    });

    it("does not calculate shipping", () => {
      renderScreen();
      expect(screen.getByText(baseReport.summary.shippingLabel as string)).toBeInTheDocument();
    });

    it("does not calculate tax", () => {
      renderScreen();
      expect(screen.getByText(baseReport.summary.taxLabel as string)).toBeInTheDocument();
    });

    it("does not calculate total", () => {
      renderScreen();
      expect(screen.getAllByText(baseReport.summary.totalLabel as string).length).toBeGreaterThan(0);
    });

    it("preserves host item order without sorting", () => {
      renderScreen({ report: reportWith({ items: [unavailableSpf, cleanser] }) });
      const list = screen.getByTestId("cart-item-list");
      expect(list.children[0]).toHaveAttribute("data-testid", `cart-item-${unavailableSpf.cartItemId}`);
      expect(list.children[1]).toHaveAttribute("data-testid", `cart-item-${cleanser.cartItemId}`);
    });

    it("renders no bottom navigation", () => {
      const { container } = renderScreen();
      expect(container.querySelector("nav")).toBeNull();
    });

    it("restores mocked browser descriptors after relevant tests", () => {
      expect(Object.getOwnPropertyDescriptor(navigator, "mediaDevices")).toEqual(originalMediaDevicesDescriptor);
      expect(Object.getOwnPropertyDescriptor(navigator, "geolocation")).toEqual(originalGeolocationDescriptor);
      expect(Object.getOwnPropertyDescriptor(globalThis, "fetch")).toEqual(originalFetchDescriptor);
    });
  });
});
