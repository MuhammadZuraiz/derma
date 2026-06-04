import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DermaLensStoreRoutineCollectionScreen, {
  copy,
  type DermaLensStoreRoutineCollectionScreenProps,
  type RoutineStoreCollectionReport,
  type RoutineStoreProduct,
} from "./dermalens-store-routine-collection-screen";

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

const cleanser: RoutineStoreProduct = {
  itemId: "item-cleanser",
  productId: "product-cleanser",
  brand: "DermaLens",
  name: "Soft Balance Cleanser",
  categoryLabel: "Cleanser",
  description: "A gentle cleanser for everyday use.",
  imageUrl: "/products/cleanser.png",
  priceLabel: "AED 54",
  availabilityLabel: "Available now",
  isAvailable: true,
  purchaseMode: "direct-add",
  periods: ["morning", "evening"],
  matchedStepLabels: ["Morning cleanse", "Evening cleanse"],
  cartQuantity: 0,
  canIncreaseQuantity: true,
  canDecreaseQuantity: false,
};

const moisturiser: RoutineStoreProduct = {
  itemId: "item-moisturiser",
  productId: "product-moisturiser",
  brand: "DermaLens",
  name: "Barrier Comfort Cream",
  categoryLabel: "Moisturiser",
  imageUrl: "/products/moisturiser.png",
  priceLabel: "AED 72",
  availabilityLabel: "Available",
  isAvailable: true,
  purchaseMode: "direct-add",
  periods: ["morning"],
  matchedStepLabels: ["Support your barrier"],
  cartQuantity: 2,
  canIncreaseQuantity: true,
  canDecreaseQuantity: true,
};

const serum: RoutineStoreProduct = {
  itemId: "item-serum",
  productId: "product-serum",
  brand: "DermaLens",
  name: "Even Tone Serum",
  categoryLabel: "Serum",
  description: "Choose the suitable variant in product details.",
  imageUrl: "/products/serum.png",
  availabilityLabel: "Available",
  isAvailable: true,
  purchaseMode: "details-required",
  periods: ["evening"],
  matchedStepLabels: ["Evening serum"],
  cartQuantity: 0,
  canIncreaseQuantity: false,
  canDecreaseQuantity: false,
};

const unavailableSpf: RoutineStoreProduct = {
  itemId: "item-spf",
  productId: "product-spf",
  brand: "DermaLens",
  name: "Daily Comfort SPF",
  categoryLabel: "Sun care",
  availabilityLabel: "Unavailable in your region",
  isAvailable: false,
  purchaseMode: "unavailable",
  periods: ["morning"],
  matchedStepLabels: ["Morning protection"],
  cartQuantity: 0,
  canIncreaseQuantity: false,
  canDecreaseQuantity: false,
};

const baseReport: RoutineStoreCollectionReport = {
  collectionId: "collection-1",
  profileName: " Amara ",
  generatedAtLabel: "3 June 2026 · 09:20",
  saveLabel: "Saved locally on this device",
  summary: "A focused first-party collection for your morning and evening steps.",
  products: [cleanser, moisturiser, serum, unavailableSpf],
  cartSummary: { itemCount: 2, subtotalLabel: "AED 144" },
};

const baseProps: DermaLensStoreRoutineCollectionScreenProps = {
  state: "ready",
  report: baseReport,
  onBack: vi.fn(),
  onOpenCart: vi.fn(),
};

function reportWith(overrides: Partial<RoutineStoreCollectionReport> = {}): RoutineStoreCollectionReport {
  return { ...baseReport, ...overrides };
}

function renderScreen(overrides: Partial<DermaLensStoreRoutineCollectionScreenProps> = {}) {
  const props: DermaLensStoreRoutineCollectionScreenProps = {
    ...baseProps,
    onBack: vi.fn(),
    onOpenCart: vi.fn(),
    ...overrides,
  };
  const result = render(<DermaLensStoreRoutineCollectionScreen {...props} />);
  return { ...result, props };
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function item(itemId: string) {
  return screen.getByTestId(`collection-item-${itemId}`);
}

function allFilter() { return screen.getByRole("button", { name: copy.allProducts }); }
function morningFilter() { return screen.getByRole("button", { name: copy.morning }); }
function eveningFilter() { return screen.getByRole("button", { name: copy.evening }); }

function reportWithProducts(products: RoutineStoreProduct[], cartSummary = baseReport.cartSummary) {
  return reportWith({ products, cartSummary });
}

function addToCartName(product: RoutineStoreProduct) { return `${copy.addToCart}: ${product.name}`; }
function addingToCartName(product: RoutineStoreProduct) { return `${copy.addingToCart} ${product.name}`; }
function chooseOptionsName(product: RoutineStoreProduct) { return `${copy.chooseOptions}: ${product.name}`; }
function openingProductName(product: RoutineStoreProduct) { return `${copy.openingProduct} ${product.name}`; }
function viewDetailsName(product: RoutineStoreProduct) { return `${copy.viewDetails}: ${product.name}`; }
function increaseQuantityName(product: RoutineStoreProduct) { return `${copy.increaseQuantity}: ${product.name}`; }
function decreaseQuantityName(product: RoutineStoreProduct) { return `${copy.decreaseQuantity}: ${product.name}`; }
function quantityName(product: RoutineStoreProduct, quantity: number) { return `${copy.quantityLabel} for ${product.name}: ${quantity}`; }
function quantityControlsName(product: RoutineStoreProduct) { return `${product.name} quantity controls`; }

describe("DermaLensStoreRoutineCollectionScreen", () => {
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

  it("renders disabled View cart in loading footer", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByRole("button", { name: copy.viewCart })).toBeDisabled();
  });

  it("does not show cart unavailable copy while loading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.queryByRole("button", { name: copy.cartUnavailable })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.reconnectToCart })).not.toBeInTheDocument();
  });

  it("renders ready heading", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
  });

  it("falls back to error when usable state has missing report", () => {
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

  it("renders no fake products in empty state", () => {
    renderScreen({ state: "empty", report: null });
    expect(screen.queryByTestId("product-collection")).not.toBeInTheDocument();
  });

  it("renders error heading", () => {
    renderScreen({ state: "error", report: null });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("uses alert semantics for error state", () => {
    renderScreen({ state: "error", report: null });
    expect(screen.getByRole("alert")).toContainElement(screen.getByRole("heading", { name: copy.errorHeading }));
  });

  it("keeps buttons outside the error alert region", () => {
    renderScreen({ state: "error", report: null, onRetryLoad: vi.fn() });
    expect(within(screen.getByRole("alert")).queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders Retry only when supplied", () => {
    const { rerender, props } = renderScreen({ state: "error", report: null });
    expect(screen.queryByRole("button", { name: copy.retry })).not.toBeInTheDocument();
    rerender(<DermaLensStoreRoutineCollectionScreen {...props} onRetryLoad={vi.fn()} />);
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

  it("disables Retry while pending", () => {
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
    fireEvent.click(button); fireEvent.click(button);
    expect(onRetryLoad).toHaveBeenCalledTimes(1);
  });

  it("shows toast after Retry rejection", async () => {
    renderScreen({ state: "error", report: null, onRetryLoad: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
  });

  it("renders trimmed profile name", () => {
    renderScreen();
    expect(screen.getByText("Amara")).toBeInTheDocument();
  });

  it("uses question mark for blank profile name", () => {
    renderScreen({ report: reportWith({ profileName: "  " }) });
    expect(screen.getAllByText("?").length).toBeGreaterThan(0);
  });

  it("renders generated label", () => {
    renderScreen();
    expect(screen.getByText(baseReport.generatedAtLabel)).toBeInTheDocument();
  });

  it("renders save label", () => {
    renderScreen();
    expect(screen.getByText(baseReport.saveLabel)).toBeInTheDocument();
  });

  it("falls back to device save copy", () => {
    renderScreen({ report: reportWith({ saveLabel: " " }) });
    expect(screen.getByText(copy.savedOnDevice)).toBeInTheDocument();
  });

  it("renders collection summary", () => {
    renderScreen();
    expect(screen.getByText(baseReport.summary)).toBeInTheDocument();
  });

  it("renders total product count", () => {
    renderScreen();
    expect(screen.getByText(`4 ${copy.productsLabel}`)).toBeInTheDocument();
  });

  it("renders supplied availability count from item booleans", () => {
    renderScreen();
    expect(screen.getByText(`3 ${copy.availableLabel}`)).toBeInTheDocument();
  });

  it("renders host cart item count", () => {
    renderScreen();
    expect(screen.getByText("2 items in cart")).toBeInTheDocument();
  });

  it("announces the top cart count in the button accessible name", () => {
    renderScreen();
    expect(screen.getByRole("button", { name: "Cart: 2 items in cart" })).toBeInTheDocument();
  });

  it("uses singular wording in the top cart button accessible name", () => {
    renderScreen({ report: reportWith({ cartSummary: { itemCount: 1 } }) });
    expect(screen.getByRole("button", { name: "Cart: 1 item in cart" })).toBeInTheDocument();
  });

  it("hides the visual top cart badge from assistive technology", () => {
    renderScreen();
    const cartButton = screen.getByRole("button", { name: "Cart: 2 items in cart" });
    expect(within(cartButton).getByText("2")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders readable collection-summary cart copy instead of the old Cart suffix", () => {
    renderScreen();
    expect(screen.getByText("2 items in cart")).toBeInTheDocument();
    expect(screen.queryByText("2 Cart")).not.toBeInTheDocument();
  });

  it("normalises a negative cart-summary count to zero", () => {
    renderScreen({ report: reportWith({ cartSummary: { itemCount: -2 } }) });
    expect(screen.queryByRole("button", { name: /Cart:/ })).not.toBeInTheDocument();
    expect(screen.getByText(copy.cartEmpty)).toBeInTheDocument();
  });

  it("normalises a NaN cart-summary count to zero", () => {
    renderScreen({ report: reportWith({ cartSummary: { itemCount: Number.NaN } }) });
    expect(screen.queryByRole("button", { name: /Cart:/ })).not.toBeInTheDocument();
    expect(screen.getByText(copy.cartEmpty)).toBeInTheDocument();
  });

  it("normalises a positive-infinity cart-summary count to zero", () => {
    renderScreen({ report: reportWith({ cartSummary: { itemCount: Number.POSITIVE_INFINITY } }) });
    expect(screen.queryByRole("button", { name: /Cart:/ })).not.toBeInTheDocument();
    expect(screen.getByText(copy.cartEmpty)).toBeInTheDocument();
  });

  it("disables the footer cart route for an invalid cart-summary count", () => {
    renderScreen({ report: reportWith({ cartSummary: { itemCount: Number.NaN } }) });
    expect(screen.getByRole("button", { name: copy.viewCart })).toBeDisabled();
  });

  it("renders host subtotal unchanged", () => {
    renderScreen();
    expect(screen.getByText("2 items · AED 144")).toBeInTheDocument();
  });

  it("does not calculate subtotal", () => {
    renderScreen({ report: reportWith({ cartSummary: { itemCount: 2, subtotalLabel: "Custom host subtotal" } }) });
    expect(screen.getByText("2 items · Custom host subtotal")).toBeInTheDocument();
  });

  it("selects all products by default", () => {
    renderScreen();
    expect(allFilter()).toHaveAttribute("aria-pressed", "true");
  });

  it("supports Morning initial filter", () => {
    renderScreen({ initialFilter: "morning" });
    expect(morningFilter()).toHaveAttribute("aria-pressed", "true");
  });

  it("supports Evening initial filter", () => {
    renderScreen({ initialFilter: "evening" });
    expect(eveningFilter()).toHaveAttribute("aria-pressed", "true");
  });

  it("filter buttons expose aria-pressed", () => {
    renderScreen();
    expect(allFilter()).toHaveAttribute("aria-pressed");
    expect(morningFilter()).toHaveAttribute("aria-pressed");
    expect(eveningFilter()).toHaveAttribute("aria-pressed");
  });

  it("filters Morning products", () => {
    renderScreen(); fireEvent.click(morningFilter());
    expect(screen.getByText(cleanser.name)).toBeInTheDocument();
    expect(screen.queryByText(serum.name)).not.toBeInTheDocument();
  });

  it("filters Evening products", () => {
    renderScreen(); fireEvent.click(eveningFilter());
    expect(screen.getByText(serum.name)).toBeInTheDocument();
    expect(screen.queryByText(moisturiser.name)).not.toBeInTheDocument();
  });

  it("preserves order while filtering", () => {
    renderScreen(); fireEvent.click(morningFilter());
    const collection = screen.getByTestId("product-collection");
    expect(collection.children[0]).toHaveTextContent(cleanser.name);
    expect(collection.children[1]).toHaveTextContent(moisturiser.name);
    expect(collection.children[2]).toHaveTextContent(unavailableSpf.name);
  });

  it("filter switching does not invoke host", () => {
    const onBack = vi.fn(); const onOpenCart = vi.fn();
    renderScreen({ onBack, onOpenCart }); fireEvent.click(eveningFilter());
    expect(onBack).not.toHaveBeenCalled(); expect(onOpenCart).not.toHaveBeenCalled();
  });

  it("disables filters during pending operation", () => {
    const pending = deferred();
    renderScreen({ onOpenCart: () => pending.promise });
    fireEvent.click(screen.getByRole("button", { name: copy.viewCart }));
    expect(allFilter()).toBeDisabled(); expect(morningFilter()).toBeDisabled();
  });

  it("updates filter when initialFilter changes", () => {
    const { rerender, props } = renderScreen();
    rerender(<DermaLensStoreRoutineCollectionScreen {...props} initialFilter="evening" />);
    expect(eveningFilter()).toHaveAttribute("aria-pressed", "true");
  });

  it("renders all-products empty copy", () => {
    renderScreen({ report: reportWithProducts([]) });
    expect(screen.getByText(copy.noAllProducts)).toBeInTheDocument();
  });

  it("renders morning empty copy", () => {
    renderScreen({ report: reportWithProducts([serum]), initialFilter: "morning" });
    expect(screen.getByText(copy.noMorningProducts)).toBeInTheDocument();
  });

  it("renders evening empty copy", () => {
    renderScreen({ report: reportWithProducts([moisturiser]), initialFilter: "evening" });
    expect(screen.getByText(copy.noEveningProducts)).toBeInTheDocument();
  });

  it("preserves product ordering", () => {
    renderScreen(); const collection = screen.getByTestId("product-collection");
    expect(collection.children[0]).toHaveTextContent(cleanser.name);
    expect(collection.children[1]).toHaveTextContent(moisturiser.name);
    expect(collection.children[2]).toHaveTextContent(serum.name);
  });

  it("renders brand", () => { renderScreen(); expect(within(item(cleanser.itemId)).getByText(cleanser.brand)).toBeInTheDocument(); });
  it("renders product name", () => { renderScreen(); expect(screen.getByText(cleanser.name)).toBeInTheDocument(); });
  it("renders category", () => { renderScreen(); expect(screen.getByText(cleanser.categoryLabel)).toBeInTheDocument(); });
  it("renders optional description only when supplied", () => { renderScreen(); expect(screen.getByText(cleanser.description as string)).toBeInTheDocument(); expect(within(item(moisturiser.itemId)).queryByText(cleanser.description as string)).not.toBeInTheDocument(); });
  it("renders optional price only when supplied", () => { renderScreen(); expect(screen.getByText(cleanser.priceLabel as string)).toBeInTheDocument(); expect(within(item(unavailableSpf.itemId)).queryByText("AED")).not.toBeInTheDocument(); });
  it("preserves host availability label", () => { renderScreen(); expect(screen.getByText(unavailableSpf.availabilityLabel)).toBeInTheDocument(); });
  it("falls back to available copy for blank host label", () => { renderScreen({ report: reportWithProducts([{ ...cleanser, availabilityLabel: " " }]) }); expect(screen.getByText(copy.productAvailable)).toBeInTheDocument(); });
  it("falls back to unavailable copy for blank host label", () => { renderScreen({ report: reportWithProducts([{ ...unavailableSpf, availabilityLabel: " " }]) }); expect(screen.getByText(copy.productUnavailable)).toBeInTheDocument(); });
  it("treats unavailable purchase mode as unavailable even when isAvailable is true", () => {
    renderScreen({ report: reportWithProducts([{ ...cleanser, purchaseMode: "unavailable", isAvailable: true, availabilityLabel: " " }]) });
    expect(screen.getByText(copy.productUnavailable)).toBeInTheDocument();
  });

  it("excludes unavailable-mode products from the available-product count", () => {
    renderScreen({ report: reportWithProducts([{ ...cleanser, purchaseMode: "unavailable", isAvailable: true, availabilityLabel: " " }]) });
    expect(screen.getByText(`0 ${copy.availableLabel}`)).toBeInTheDocument();
  });
  it("styles unavailable products with warning text", () => { renderScreen(); expect(screen.getByText(unavailableSpf.availabilityLabel)).toHaveClass("text-[var(--dl-warning-text)]"); });

  it("preserves matched step ordering", () => {
    renderScreen(); const card = item(cleanser.itemId);
    const labels = within(card).getAllByText(/Morning cleanse|Evening cleanse/);
    expect(labels[0]).toHaveTextContent("Morning cleanse"); expect(labels[1]).toHaveTextContent("Evening cleanse");
  });

  it("preserves period ordering", () => {
    renderScreen(); const card = item(cleanser.itemId); const labels = within(card).getAllByText(/Morning|Evening/);
    expect(labels[0]).toHaveTextContent(copy.morning); expect(labels[1]).toHaveTextContent(copy.evening);
  });

  it("renders first-party product label", () => { renderScreen(); expect(screen.getAllByText(copy.firstPartyProduct).length).toBeGreaterThan(0); });
  it("renders host product image URL", () => { renderScreen(); expect(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`)).toHaveAttribute("src", cleanser.imageUrl); });
  it("uses meaningful product alt", () => { renderScreen(); expect(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`)).toBeInTheDocument(); });

  it("renders image placeholder after image failure", () => {
    renderScreen(); fireEvent.error(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`));
    expect(screen.getByTestId(`product-image-placeholder-${cleanser.itemId}`)).toHaveTextContent(copy.productImageUnavailable);
  });

  it("image failure keeps product actions usable", () => {
    renderScreen({ onIncreaseCartQuantity: vi.fn() }); fireEvent.error(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`));
    expect(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) })).toBeEnabled();
  });

  it("resets product image failure when URL changes", () => {
    const { props, rerender } = renderScreen(); fireEvent.error(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`));
    const updated = { ...cleanser, imageUrl: "/products/cleanser-v2.png" };
    rerender(<DermaLensStoreRoutineCollectionScreen {...props} report={reportWithProducts([updated])} />);
    expect(screen.getByAltText(`${updated.brand} ${updated.name}`)).toHaveAttribute("src", updated.imageUrl);
  });

  it("renders Add to cart for zero quantity direct add", () => { renderScreen({ onIncreaseCartQuantity: vi.fn() }); expect(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) })).toBeInTheDocument(); });
  it("renders Add to cart only with callback", () => { renderScreen(); expect(within(item(cleanser.itemId)).queryByRole("button", { name: addToCartName(cleanser) })).not.toBeInTheDocument(); });

  it("invokes increase callback from Add to cart", () => {
    const onIncreaseCartQuantity = vi.fn(); renderScreen({ onIncreaseCartQuantity });
    fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) }));
    expect(onIncreaseCartQuantity).toHaveBeenCalledWith(cleanser.productId);
  });

  it("disables Add to cart when modification blocked", () => { renderScreen({ canModifyCart: false, onIncreaseCartQuantity: vi.fn() }); expect(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) })).toBeDisabled(); });
  it("disables Add to cart when host blocks increase", () => { renderScreen({ report: reportWithProducts([{ ...cleanser, canIncreaseQuantity: false }]), onIncreaseCartQuantity: vi.fn() }); expect(screen.getByRole("button", { name: addToCartName(cleanser) })).toBeDisabled(); });
  it("disables Add to cart when product unavailable", () => { renderScreen({ report: reportWithProducts([{ ...cleanser, isAvailable: false }]), onIncreaseCartQuantity: vi.fn() }); expect(screen.getByRole("button", { name: addToCartName(cleanser) })).toBeDisabled(); });

  it("shows adding pending label only on activated item", () => {
    const pending = deferred(); const second = { ...cleanser, itemId: "item-cleanser-2", name: "Second Cleanser" };
    renderScreen({ report: reportWithProducts([cleanser, second]), onIncreaseCartQuantity: () => pending.promise });
    fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) }));
    expect(within(item(cleanser.itemId)).getByRole("button", { name: addingToCartName(cleanser) })).toBeInTheDocument();
    expect(within(item(second.itemId)).getByRole("button", { name: addToCartName(second) })).toBeInTheDocument();
  });

  it("prevents duplicate Add to cart", () => {
    const pending = deferred(); const onIncreaseCartQuantity = vi.fn(() => pending.promise);
    renderScreen({ onIncreaseCartQuantity }); const button = within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) });
    fireEvent.click(button); fireEvent.click(button); expect(onIncreaseCartQuantity).toHaveBeenCalledTimes(1);
  });

  it("shows Add to cart rejection toast", async () => {
    renderScreen({ onIncreaseCartQuantity: () => Promise.reject(new Error("no")) });
    fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) }));
    expect(await screen.findByText(copy.increaseError)).toBeInTheDocument();
  });

  it("renders In cart for positive quantity", () => { renderScreen(); expect(within(item(moisturiser.itemId)).getByText(copy.inCart)).toBeInTheDocument(); });
  it("renders visible quantity", () => { renderScreen(); expect(within(item(moisturiser.itemId)).getByLabelText(quantityName(moisturiser, 2))).toHaveTextContent("2"); });
  it("exposes the current quantity through an accessible label", () => { renderScreen(); expect(within(item(moisturiser.itemId)).getByLabelText(quantityName(moisturiser, 2))).toHaveTextContent("2"); });
  it("announces quantity changes politely", () => { renderScreen(); expect(within(item(moisturiser.itemId)).getByLabelText(quantityName(moisturiser, 2))).toHaveAttribute("aria-live", "polite"); });
  it("normalises a negative direct-add quantity to zero", () => { renderScreen({ report: reportWithProducts([{ ...cleanser, cartQuantity: -1 }]), onIncreaseCartQuantity: vi.fn() }); expect(screen.getByRole("button", { name: addToCartName(cleanser) })).toBeInTheDocument(); });
  it("normalises a NaN direct-add quantity to zero", () => { renderScreen({ report: reportWithProducts([{ ...cleanser, cartQuantity: Number.NaN }]), onIncreaseCartQuantity: vi.fn() }); expect(screen.getByRole("button", { name: addToCartName(cleanser) })).toBeInTheDocument(); });
  it("normalises a positive-infinity direct-add quantity to zero", () => { renderScreen({ report: reportWithProducts([{ ...cleanser, cartQuantity: Number.POSITIVE_INFINITY }]), onIncreaseCartQuantity: vi.fn() }); expect(screen.getByRole("button", { name: addToCartName(cleanser) })).toBeInTheDocument(); });
  it("truncates a positive decimal quantity safely", () => { renderScreen({ report: reportWithProducts([{ ...moisturiser, cartQuantity: 2.9 }]) }); expect(screen.getByLabelText(quantityName(moisturiser, 2))).toHaveTextContent("2"); });
  it("renders accessible quantity buttons", () => { renderScreen({ onIncreaseCartQuantity: vi.fn(), onDecreaseCartQuantity: vi.fn() }); const card = item(moisturiser.itemId); expect(within(card).getByRole("button", { name: increaseQuantityName(moisturiser) })).toBeInTheDocument(); expect(within(card).getByRole("button", { name: decreaseQuantityName(moisturiser) })).toBeInTheDocument(); });

  it("invokes quantity increase", () => {
    const onIncreaseCartQuantity = vi.fn(); renderScreen({ onIncreaseCartQuantity });
    fireEvent.click(within(item(moisturiser.itemId)).getByRole("button", { name: increaseQuantityName(moisturiser) }));
    expect(onIncreaseCartQuantity).toHaveBeenCalledWith(moisturiser.productId);
  });

  it("invokes quantity decrease", () => {
    const onDecreaseCartQuantity = vi.fn(); renderScreen({ onDecreaseCartQuantity });
    fireEvent.click(within(item(moisturiser.itemId)).getByRole("button", { name: decreaseQuantityName(moisturiser) }));
    expect(onDecreaseCartQuantity).toHaveBeenCalledWith(moisturiser.productId);
  });

  it("respects canIncreaseQuantity", () => { renderScreen({ report: reportWithProducts([{ ...moisturiser, canIncreaseQuantity: false }]), onIncreaseCartQuantity: vi.fn() }); expect(screen.getByRole("button", { name: increaseQuantityName(moisturiser) })).toBeDisabled(); });
  it("respects canDecreaseQuantity", () => { renderScreen({ report: reportWithProducts([{ ...moisturiser, canDecreaseQuantity: false }]), onDecreaseCartQuantity: vi.fn() }); expect(screen.getByRole("button", { name: decreaseQuantityName(moisturiser) })).toBeDisabled(); });

  it("shows updating label only on activated quantity item", () => {
    const pending = deferred(); const second = { ...moisturiser, itemId: "item-moisturiser-2", name: "Second Cream" };
    renderScreen({ report: reportWithProducts([moisturiser, second]), onIncreaseCartQuantity: () => pending.promise });
    fireEvent.click(within(item(moisturiser.itemId)).getByRole("button", { name: increaseQuantityName(moisturiser) }));
    expect(within(item(moisturiser.itemId)).getByText(copy.updatingQuantity)).toBeInTheDocument();
    expect(within(item(second.itemId)).queryByText(copy.updatingQuantity)).not.toBeInTheDocument();
  });

  it("prevents duplicate quantity update", () => {
    const pending = deferred(); const onIncreaseCartQuantity = vi.fn(() => pending.promise);
    renderScreen({ onIncreaseCartQuantity }); const button = within(item(moisturiser.itemId)).getByRole("button", { name: increaseQuantityName(moisturiser) });
    fireEvent.click(button); fireEvent.click(button); expect(onIncreaseCartQuantity).toHaveBeenCalledTimes(1);
  });

  it("shows quantity increase rejection toast", async () => {
    renderScreen({ onIncreaseCartQuantity: () => Promise.reject(new Error("no")) }); fireEvent.click(within(item(moisturiser.itemId)).getByRole("button", { name: increaseQuantityName(moisturiser) })); expect(await screen.findByText(copy.increaseError)).toBeInTheDocument();
  });

  it("shows quantity decrease rejection toast", async () => {
    renderScreen({ onDecreaseCartQuantity: () => Promise.reject(new Error("no")) }); fireEvent.click(within(item(moisturiser.itemId)).getByRole("button", { name: decreaseQuantityName(moisturiser) })); expect(await screen.findByText(copy.decreaseError)).toBeInTheDocument();
  });

  it("renders Choose options for details required product", () => { renderScreen({ onOpenProduct: vi.fn() }); expect(within(item(serum.itemId)).getByRole("button", { name: chooseOptionsName(serum) })).toBeInTheDocument(); });
  it("invokes product route for Choose options", () => { const onOpenProduct = vi.fn(); renderScreen({ onOpenProduct }); fireEvent.click(within(item(serum.itemId)).getByRole("button", { name: chooseOptionsName(serum) })); expect(onOpenProduct).toHaveBeenCalledWith(serum.productId); });
  it("shows Choose options pending copy only on activated item", () => { const pending = deferred(); renderScreen({ onOpenProduct: () => pending.promise }); fireEvent.click(within(item(serum.itemId)).getByRole("button", { name: chooseOptionsName(serum) })); expect(within(item(serum.itemId)).getByRole("button", { name: openingProductName(serum) })).toBeInTheDocument(); expect(within(item(cleanser.itemId)).getByRole("button", { name: viewDetailsName(cleanser) })).toBeInTheDocument(); });
  it("renders View details for direct add", () => { renderScreen({ onOpenProduct: vi.fn() }); expect(within(item(cleanser.itemId)).getByRole("button", { name: viewDetailsName(cleanser) })).toBeInTheDocument(); });
  it("renders View details for unavailable product", () => { renderScreen({ onOpenProduct: vi.fn() }); expect(within(item(unavailableSpf.itemId)).getByRole("button", { name: viewDetailsName(unavailableSpf) })).toBeInTheDocument(); });
  it("invokes View details callback", () => { const onOpenProduct = vi.fn(); renderScreen({ onOpenProduct }); fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: viewDetailsName(cleanser) })); expect(onOpenProduct).toHaveBeenCalledWith(cleanser.productId); });

  it("shows product route rejection toast", async () => {
    renderScreen({ onOpenProduct: () => Promise.reject(new Error("no")) }); fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: viewDetailsName(cleanser) })); expect(await screen.findByText(copy.productError)).toBeInTheDocument();
  });

  it("scopes reused product route pending state by collection item", () => {
    const pending = deferred(); const reused = { ...cleanser, itemId: "item-reused", name: "Reused Cleanser" };
    renderScreen({ report: reportWithProducts([cleanser, reused]), onOpenProduct: () => pending.promise });
    fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: viewDetailsName(cleanser) }));
    expect(within(item(cleanser.itemId)).getByRole("button", { name: openingProductName(cleanser) })).toBeInTheDocument();
    expect(within(item(reused.itemId)).getByRole("button", { name: viewDetailsName(reused) })).toBeInTheDocument();
  });

  it("labels direct-add actions with the product name", () => {
    renderScreen({ onIncreaseCartQuantity: vi.fn() });
    expect(within(item(cleanser.itemId)).getByRole("button", { name: "Add to cart: Soft Balance Cleanser" })).toBeInTheDocument();
  });

  it("labels details-required actions with the product name", () => {
    renderScreen({ onOpenProduct: vi.fn() });
    expect(within(item(serum.itemId)).getByRole("button", { name: "Choose options: Even Tone Serum" })).toBeInTheDocument();
  });

  it("labels unavailable-product detail routes with the product name", () => {
    renderScreen({ onOpenProduct: vi.fn() });
    expect(within(item(unavailableSpf.itemId)).getByRole("button", { name: "View details: Daily Comfort SPF" })).toBeInTheDocument();
  });

  it("labels quantity decrement with the product name", () => {
    renderScreen({ onDecreaseCartQuantity: vi.fn() });
    expect(within(item(moisturiser.itemId)).getByRole("button", { name: "Decrease quantity: Barrier Comfort Cream" })).toBeInTheDocument();
  });

  it("labels quantity increment with the product name", () => {
    renderScreen({ onIncreaseCartQuantity: vi.fn() });
    expect(within(item(moisturiser.itemId)).getByRole("button", { name: "Increase quantity: Barrier Comfort Cream" })).toBeInTheDocument();
  });

  it("labels quantity value with the product name", () => {
    renderScreen();
    expect(within(item(moisturiser.itemId)).getByLabelText("Quantity for Barrier Comfort Cream: 2")).toHaveTextContent("2");
  });

  it("renders quantity controls as an accessible group", () => {
    renderScreen();
    expect(within(item(moisturiser.itemId)).getByRole("group")).toBeInTheDocument();
  });

  it("labels the quantity-control group with the product name", () => {
    renderScreen();
    expect(within(item(moisturiser.itemId)).getByRole("group", { name: quantityControlsName(moisturiser) })).toBeInTheDocument();
  });

  it("changes only the activated product route accessible name while opening", () => {
    const pending = deferred();
    const reused = { ...cleanser, itemId: "item-cleanser-reused" };
    renderScreen({ report: reportWithProducts([cleanser, reused]), onOpenProduct: () => pending.promise });
    fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: viewDetailsName(cleanser) }));
    expect(within(item(cleanser.itemId)).getByRole("button", { name: "Opening product… Soft Balance Cleanser" })).toBeInTheDocument();
    expect(within(item(reused.itemId)).getByRole("button", { name: "View details: Soft Balance Cleanser" })).toBeInTheDocument();
  });

  it("scopes reused product IDs to the exact activated collection item", () => {
    const pending = deferred();
    const reused = { ...cleanser, itemId: "item-cleanser-second" };
    renderScreen({ report: reportWithProducts([cleanser, reused]), onOpenProduct: () => pending.promise });
    fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: viewDetailsName(cleanser) }));
    expect(within(item(cleanser.itemId)).getByRole("button", { name: openingProductName(cleanser) })).toBeInTheDocument();
    expect(within(item(reused.itemId)).getByRole("button", { name: viewDetailsName(reused) })).toBeInTheDocument();
  });

  it("truncates positive decimal cart-summary counts safely", () => {
    renderScreen({ report: reportWith({ cartSummary: { itemCount: 2.9 } }) });
    expect(screen.getAllByText("2 items in cart").length).toBeGreaterThan(0);
  });

  it("renders store boundary", () => { renderScreen(); expect(screen.getByText(copy.storeBoundary)).toBeInTheDocument(); });
  it("renders purchasing optional note", () => { renderScreen(); expect(screen.getAllByText(copy.storeTrust).length).toBeGreaterThan(0); });
  it("keeps unavailable product visible", () => { renderScreen(); expect(screen.getByText(unavailableSpf.name)).toBeInTheDocument(); });
  it("keeps available products in limited state", () => { renderScreen({ state: "limited-availability" }); expect(screen.getByText(cleanser.name)).toBeInTheDocument(); });
  it("keeps collection visible offline", () => { renderScreen({ isOffline: true }); expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument(); });
  it("offline alone does not block quantity actions", () => { renderScreen({ isOffline: true, onIncreaseCartQuantity: vi.fn() }); expect(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) })).toBeEnabled(); });
  it("offline blocked modification disables quantity actions", () => { renderScreen({ isOffline: true, canModifyCart: false, onIncreaseCartQuantity: vi.fn() }); expect(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) })).toBeDisabled(); });
  it("offline alone does not block cart route", () => { renderScreen({ isOffline: true, canOpenCart: true }); expect(screen.getByRole("button", { name: copy.viewCart })).toBeEnabled(); });
  it("shows reconnect label for offline blocked cart", () => { renderScreen({ isOffline: true, canOpenCart: false }); expect(screen.getByRole("button", { name: copy.reconnectToCart })).toBeDisabled(); });
  it("shows unavailable label for online blocked cart", () => { renderScreen({ canOpenCart: false }); expect(screen.getByRole("button", { name: copy.cartUnavailable })).toBeDisabled(); });

  it("renders top cart button only with cart items", () => {
    const { props, rerender } = renderScreen(); expect(screen.getByRole("button", { name: "Cart: 2 items in cart" })).toBeInTheDocument();
    rerender(<DermaLensStoreRoutineCollectionScreen {...props} report={reportWith({ cartSummary: { itemCount: 0 } })} />);
    expect(screen.queryByRole("button", { name: /Cart:/ })).not.toBeInTheDocument();
  });

  it("renders host count badge", () => { renderScreen(); const cartButton = screen.getByRole("button", { name: "Cart: 2 items in cart" }); expect(within(cartButton).getByText("2")).toHaveTextContent("2"); });
  it("renders empty cart copy", () => { renderScreen({ report: reportWith({ cartSummary: { itemCount: 0 } }) }); expect(screen.getByText(copy.cartEmpty)).toBeInTheDocument(); });
  it("renders footer host item count", () => { renderScreen(); expect(screen.getByText("2 items · AED 144")).toBeInTheDocument(); });
  it("renders footer host subtotal", () => { renderScreen(); expect(screen.getByText(/AED 144/)).toBeInTheDocument(); });
  it("disables View cart when empty", () => { renderScreen({ report: reportWith({ cartSummary: { itemCount: 0 } }) }); expect(screen.getByRole("button", { name: copy.viewCart })).toBeDisabled(); });

  it("invokes View cart", () => { const onOpenCart = vi.fn(); renderScreen({ onOpenCart }); fireEvent.click(screen.getByRole("button", { name: copy.viewCart })); expect(onOpenCart).toHaveBeenCalledTimes(1); });
  it("renders View cart pending label", () => { const pending = deferred(); renderScreen({ onOpenCart: () => pending.promise }); fireEvent.click(screen.getByRole("button", { name: copy.viewCart })); expect(screen.getByRole("button", { name: copy.openingCart })).toBeDisabled(); });
  it("prevents duplicate View cart", () => { const pending = deferred(); const onOpenCart = vi.fn(() => pending.promise); renderScreen({ onOpenCart }); const button = screen.getByRole("button", { name: copy.viewCart }); fireEvent.click(button); fireEvent.click(button); expect(onOpenCart).toHaveBeenCalledTimes(1); });
  it("shows View cart rejection toast", async () => { renderScreen({ onOpenCart: () => Promise.reject(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.viewCart })); expect(await screen.findByText(copy.cartError)).toBeInTheDocument(); });
  it("invokes Back to routine", () => { const onBack = vi.fn(); renderScreen({ onBack }); fireEvent.click(screen.getByRole("button", { name: copy.backToRoutine })); expect(onBack).toHaveBeenCalledTimes(1); });
  it("shows Back rejection toast", async () => { renderScreen({ onBack: () => Promise.reject(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.backToRoutine })); expect(await screen.findByText(copy.backError)).toBeInTheDocument(); });

  it("pending cart disables conflicting controls", () => {
    const pending = deferred(); renderScreen({ onOpenCart: () => pending.promise, onOpenProduct: vi.fn(), onIncreaseCartQuantity: vi.fn() }); fireEvent.click(screen.getByRole("button", { name: copy.viewCart })); expect(screen.getByRole("button", { name: copy.backToRoutine })).toBeDisabled(); expect(allFilter()).toBeDisabled(); expect(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) })).toBeDisabled();
  });

  it("positions cart rejection toast above sticky footer", async () => { renderScreen({ onOpenCart: () => Promise.reject(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.viewCart })); expect(await screen.findByText(copy.cartError)).toBeInTheDocument(); expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_150px)]"); });
  it("positions quantity rejection toast above sticky footer", async () => { renderScreen({ onIncreaseCartQuantity: () => Promise.reject(new Error("no")) }); fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) })); expect(await screen.findByText(copy.increaseError)).toBeInTheDocument(); expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_150px)]"); });
  it("positions Retry rejection toast at bottom safe area", async () => { renderScreen({ state: "error", report: null, onRetryLoad: () => Promise.reject(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.retry })); expect(await screen.findByText(copy.retryError)).toBeInTheDocument(); expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[max(24px,env(safe-area-inset-bottom))]"); });
  it("positions empty Back rejection toast at bottom safe area", async () => { renderScreen({ state: "empty", report: null, onBack: () => Promise.reject(new Error("no")) }); fireEvent.click(screen.getByRole("button", { name: copy.backToRoutine })); expect(await screen.findByText(copy.backError)).toBeInTheDocument(); expect(screen.getByTestId("toast-region")).toHaveClass("bottom-[max(24px,env(safe-area-inset-bottom))]"); });

  it("renders no external anchor", () => { const { container } = renderScreen({ onOpenProduct: vi.fn() }); expect(container.querySelector("a")).toBeNull(); });
  it("copy excludes affiliate wording", () => { expect(Object.values(copy).join(" ").toLowerCase()).not.toContain("affiliate"); });
  it("copy excludes external-seller wording", () => { expect(Object.values(copy).join(" ").toLowerCase()).not.toContain("external seller"); });
  it("copy excludes marketplace wording", () => { expect(Object.values(copy).join(" ").toLowerCase()).not.toContain("marketplace"); });
  it("renders no file input", () => { const { container } = renderScreen(); expect(container.querySelector('input[type="file"]')).toBeNull(); });
  it("renders no live video", () => { const { container } = renderScreen(); expect(container.querySelector("video")).toBeNull(); });

  it("does not call camera API", () => {
    const getUserMedia = vi.fn(); Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } }); renderScreen(); expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("does not request geolocation", () => {
    const getCurrentPosition = vi.fn(); Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } }); renderScreen(); expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("does not call ecommerce API", () => {
    const fetchMock = vi.fn(); Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock }); renderScreen(); expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call checkout API", () => {
    const fetchMock = vi.fn(); Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock }); renderScreen(); expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call fetch", () => {
    const fetchMock = vi.fn(); Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock }); renderScreen(); expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not mutate cart internally", async () => {
    renderScreen({ onIncreaseCartQuantity: vi.fn() });
    fireEvent.click(within(item(cleanser.itemId)).getByRole("button", { name: addToCartName(cleanser) }));
    expect(await within(item(cleanser.itemId)).findByRole("button", { name: addToCartName(cleanser) })).toBeInTheDocument();
    expect(within(item(cleanser.itemId)).queryByText(copy.inCart)).not.toBeInTheDocument();
  });

  it("does not sort products", () => {
    renderScreen({ report: reportWithProducts([serum, cleanser]) }); const collection = screen.getByTestId("product-collection"); expect(collection.children[0]).toHaveTextContent(serum.name); expect(collection.children[1]).toHaveTextContent(cleanser.name);
  });

  it("does not match products", () => { renderScreen({ report: reportWithProducts([]) }); expect(screen.getByText(copy.noAllProducts)).toBeInTheDocument(); });
  it("does not generate recommendations", () => { renderScreen({ report: reportWithProducts([]) }); expect(screen.queryByText(cleanser.name)).not.toBeInTheDocument(); });
  it("renders no bottom navigation", () => { const { container } = renderScreen(); expect(container.querySelector("nav")).toBeNull(); });

  it("restores browser API descriptors after relevant tests", () => {
    expect(Object.getOwnPropertyDescriptor(navigator, "mediaDevices")).toEqual(originalMediaDevicesDescriptor);
    expect(Object.getOwnPropertyDescriptor(navigator, "geolocation")).toEqual(originalGeolocationDescriptor);
    expect(Object.getOwnPropertyDescriptor(globalThis, "fetch")).toEqual(originalFetchDescriptor);
  });
});
