import "@testing-library/jest-dom/vitest";
import { type ComponentProps } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductDetailScreen, {
  copy,
  normaliseNonNegativeInteger,
  formatCartItemCount,
  isProductUnavailable,
} from "./product-detail-screen";
import type { ProductDetailReport } from "./product-detail-screen";

const baseReport: ProductDetailReport = {
  productId: "p-soft-cleanser",
  brand: "DermaLens",
  name: "Soft Balance Cleanser",
  categoryLabel: "Cleanser",
  description: "A gentle cleanser for the routine step.",
  priceLabel: "AED 79",
  availabilityState: "available",
  availabilityLabel: "Available now",
  firstPartyLabel: copy.soldDirectly,
  images: [
    { id: "front", url: "https://cdn.example.com/front.png", alt: "Soft Balance Cleanser front" },
    { id: "side", url: "https://cdn.example.com/side.png", alt: "Soft Balance Cleanser side" },
  ],
  routineFit: "Fits the cleansing step in your routine.",
  matchedStepLabels: ["Morning cleanse", "Evening cleanse"],
  timingLabels: ["Morning", "Evening"],
  variantGroups: [
    {
      id: "size",
      label: "Size",
      required: true,
      selectedOptionId: "50ml",
      options: [
        { id: "50ml", label: "50 ml", supporting: "Starter size", isAvailable: true },
        { id: "100ml", label: "100 ml", supporting: "Full size", availabilityLabel: "Unavailable", isAvailable: false },
      ],
    },
    {
      id: "formula",
      label: "Formula",
      required: false,
      selectedOptionId: "fragrance-free",
      options: [
        { id: "fragrance-free", label: "Fragrance free", isAvailable: true },
        { id: "classic", label: "Classic", isAvailable: true },
      ],
    },
  ],
  resolvedVariantId: "variant-50ml-fragrance-free",
  canAddToCart: true,
  cartLine: undefined,
  usageDirections: [
    { id: "use-1", title: "Apply", description: "Massage onto damp skin." },
    { id: "use-2", title: "Rinse", description: "Rinse thoroughly." },
  ],
  usageFrequencyLabel: "Daily",
  layeringNote: "Use before serum.",
  caution: "Avoid direct contact with eyes.",
  ingredientHighlights: [
    { id: "glycerin", name: "Glycerin", description: "Helps support hydration.", tone: "positive" },
    { id: "bha", name: "Betaine salicylate", description: "Use gradually.", tone: "attention" },
  ],
  fullIngredientList: ["Water", "Glycerin", "Betaine Salicylate"],
  badges: [
    { id: "vegan", label: "Vegan", tone: "peach" },
    { id: "ff", label: "Fragrance-free", tone: "neutral" },
  ],
  reviewSummary: {
    ratingLabel: "4.8 average rating",
    countLabel: "128 reviews",
    supporting: "Reviews are provided by DermaLens customers.",
  },
  cartSummary: { itemCount: 3, subtotalLabel: "AED 210" },
};

function reportWith(overrides: Partial<ProductDetailReport> = {}): ProductDetailReport {
  return { ...baseReport, ...overrides };
}

function renderScreen(props: Partial<ComponentProps<typeof ProductDetailScreen>> = {}) {
  const allProps: ComponentProps<typeof ProductDetailScreen> = {
    state: "ready",
    report: baseReport,
    onBack: vi.fn(),
    onOpenCart: vi.fn(),
    onSelectVariantOption: vi.fn(),
    onAddToCart: vi.fn(),
    onIncreaseCartLineQuantity: vi.fn(),
    onDecreaseCartLineQuantity: vi.fn(),
    onOpenReviews: vi.fn(),
    onRetryLoad: vi.fn(),
    ...props,
  };
  return { ...render(<ProductDetailScreen {...allProps} />), props: allProps };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ProductDetailScreen", () => {
  it("renders loading state with static polite status and disabled Add to cart footer", () => {
    renderScreen({ state: "loading", report: null });
    const status = screen.getByText(copy.loadingHeading).closest<HTMLElement>('[role="status"]');
    expect(status).not.toBeNull();
    expect(within(status!).getByText(copy.loadingHeading)).toBeInTheDocument();
    expect(within(status!).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.addToCart })).toBeDisabled();
    expect(screen.queryByText(copy.productUnavailable)).not.toBeInTheDocument();
  });

  it("renders error state with static alert and retry recovery", () => {
    const retry = vi.fn();
    renderScreen({ state: "error", report: null, onRetryLoad: retry });
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText(copy.errorHeading)).toBeInTheDocument();
    expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("falls back to error when ready state has no product", () => {
    renderScreen({ state: "ready", report: null });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("renders identity, first-party boundary, and optional purchase note", () => {
    renderScreen();
    expect(screen.getByText(baseReport.brand)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: baseReport.name })).toBeInTheDocument();
    expect(screen.getByText(baseReport.categoryLabel)).toBeInTheDocument();
    expect(screen.getAllByText(baseReport.priceLabel!)).toHaveLength(2);
    expect(screen.getByText(baseReport.availabilityLabel)).toBeInTheDocument();
    expect(screen.getAllByText(copy.soldDirectly)).toHaveLength(1);
    expect(screen.getByText(copy.purchaseOptional)).toBeInTheDocument();
    expect(screen.queryByText(/seller/i)).not.toBeInTheDocument();
  });

  it("uses availability fallbacks", () => {
    const { rerender, props } = renderScreen({ report: reportWith({ availabilityLabel: "", availabilityState: "available" }) });
    expect(screen.getByText(copy.productAvailable)).toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} report={reportWith({ availabilityLabel: "", availabilityState: "unavailable", addToCartBlockReason: "unavailable" })} />);
    expect(screen.getAllByText(copy.productUnavailable).length).toBeGreaterThan(0);
  });

  it("renders first host image and switches thumbnails locally", () => {
    const host = vi.fn();
    renderScreen({ onSelectVariantOption: host });
    expect(screen.getByAltText("Soft Balance Cleanser front")).toBeInTheDocument();
    const side = screen.getByRole("button", { name: "Show image: Soft Balance Cleanser side" });
    expect(side).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(side);
    expect(screen.getByAltText("Soft Balance Cleanser side")).toBeInTheDocument();
    expect(side).toHaveAttribute("aria-pressed", "true");
    expect(host).not.toHaveBeenCalled();
  });

  it("respects valid and invalid initial selected image IDs", () => {
    const { rerender, props } = renderScreen({ initialSelectedImageId: "side" });
    expect(screen.getByAltText("Soft Balance Cleanser side")).toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} initialSelectedImageId="missing" />);
    expect(screen.getByAltText("Soft Balance Cleanser side")).toBeInTheDocument();
  });

  it("renders image placeholder on missing or failed selected image and remounts for a new product", () => {
    const { rerender, props } = renderScreen();
    const img = screen.getByAltText("Soft Balance Cleanser front");
    fireEvent.error(img);
    expect(screen.getByText(copy.productImageUnavailable)).toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} report={reportWith({ productId: "p-2" })} />);
    expect(screen.getByAltText("Soft Balance Cleanser front")).toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} report={reportWith({ images: [{ id: "front", alt: "No URL" }] })} />);
    expect(screen.getByText(copy.productImageUnavailable)).toBeInTheDocument();
  });

  it("omits thumbnail row for a single image", () => {
    renderScreen({ report: reportWith({ images: [baseReport.images[0]] }) });
    expect(screen.queryByRole("button", { name: /Show image:/ })).not.toBeInTheDocument();
  });

  it("renders routine fit content in host order and omits empty card", () => {
    const { rerender, props } = renderScreen();
    expect(screen.getByText(copy.whyThisFits)).toBeInTheDocument();
    expect(screen.getByText("Morning cleanse")).toBeInTheDocument();
    expect(screen.getByText("Evening cleanse")).toBeInTheDocument();
    expect(screen.getByText("Morning")).toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} report={reportWith({ routineFit: undefined, matchedStepLabels: [], timingLabels: [] })} />);
    expect(screen.queryByText(copy.whyThisFits)).not.toBeInTheDocument();
  });

  it("renders native variant groups and invokes host without local mutation", () => {
    const select = vi.fn(() => new Promise<void>(() => undefined));
    renderScreen({ onSelectVariantOption: select });
    expect(screen.getByRole("radiogroup", { name: "Size" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /50 ml/ })).toBeChecked();
    const unavailable = screen.getByRole("radio", { name: /100 ml/ });
    expect(unavailable).toBeDisabled();
    const classic = screen.getByRole("radio", { name: /Classic/ });
    fireEvent.click(classic);
    expect(select).toHaveBeenCalledWith("formula", "classic");
    expect(classic).not.toBeChecked();
    expect(screen.getByText(copy.updatingOption)).toBeInTheDocument();
  });

  it("shows toast on option rejection", async () => {
    renderScreen({ onSelectVariantOption: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("radio", { name: /Classic/ }));
    expect(await screen.findByText(copy.optionError)).toBeInTheDocument();
  });

  it("renders usage, ingredients, full ingredient accordion, and badges", () => {
    renderScreen();
    expect(screen.getByText(copy.usageHeading)).toBeInTheDocument();
    expect(screen.getByText("Apply")).toBeInTheDocument();
    expect(screen.getByText("Rinse")).toBeInTheDocument();
    expect(screen.getByText(/Daily/)).toBeInTheDocument();
    expect(screen.getByText(/Use before serum/)).toBeInTheDocument();
    expect(screen.getByText(/Avoid direct contact/)).toBeInTheDocument();
    expect(screen.getByText(copy.ingredientsHeading)).toBeInTheDocument();
    expect(screen.getAllByText("Glycerin").length).toBeGreaterThan(0);
    expect(screen.getByText("Betaine salicylate")).toBeInTheDocument();
    expect(screen.getByText(copy.fullIngredientsHeading)).toBeInTheDocument();
    fireEvent.click(screen.getByText(copy.fullIngredientsHeading));
    expect(screen.getByText("Water")).toBeInTheDocument();
    expect(screen.getByText("Vegan")).toBeInTheDocument();
  });

  it("renders empty ingredient and badge states", () => {
    renderScreen({ report: reportWith({ ingredientHighlights: [], fullIngredientList: [], badges: [] }) });
    expect(screen.getByText(copy.noIngredientHighlights)).toBeInTheDocument();
    fireEvent.click(screen.getByText(copy.fullIngredientsHeading));
    expect(screen.getByText(copy.noFullIngredients)).toBeInTheDocument();
    expect(screen.queryByText(copy.badgesHeading)).not.toBeInTheDocument();
  });

  it("renders reviews and handles pending/rejection", async () => {
    const reviews = vi.fn().mockRejectedValue(new Error("no"));
    renderScreen({ onOpenReviews: reviews });
    expect(screen.getByText(copy.reviewsHeading)).toBeInTheDocument();
    expect(screen.getByText("4.8 average rating")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.readReviews }));
    expect(await screen.findByText(copy.reviewsError)).toBeInTheDocument();
  });

  it("omits review action and card when absent", () => {
    renderScreen({ report: reportWith({ reviewSummary: undefined }), onOpenReviews: undefined });
    expect(screen.queryByText(copy.reviewsHeading)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.readReviews })).not.toBeInTheDocument();
  });

  it("adds product to cart with resolved variant ID", () => {
    const add = vi.fn();
    renderScreen({ onAddToCart: add });
    fireEvent.click(screen.getByRole("button", { name: copy.addToCart }));
    expect(add).toHaveBeenCalledWith(baseReport.productId, baseReport.resolvedVariantId);
  });

  it("prevents duplicate add activation and shows pending label", () => {
    const add = vi.fn(() => new Promise<void>(() => undefined));
    renderScreen({ onAddToCart: add });
    const button = screen.getByRole("button", { name: copy.addToCart });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(add).toHaveBeenCalledTimes(1);
    expect(screen.getByText(copy.addingToCart)).toBeInTheDocument();
  });

  it("shows add rejection toast", async () => {
    renderScreen({ onAddToCart: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.addToCart }));
    expect(await screen.findByText(copy.addError)).toBeInTheDocument();
  });

  it("renders blocked add labels", () => {
    const { rerender, props } = renderScreen({ report: reportWith({ canAddToCart: false, addToCartBlockReason: "select-options" }) });
    expect(screen.getByRole("button", { name: copy.selectOptionsToContinue })).toBeDisabled();
    rerender(<ProductDetailScreen {...props} report={reportWith({ availabilityState: "unavailable", addToCartBlockReason: "unavailable" })} />);
    expect(screen.getByRole("button", { name: baseReport.availabilityLabel })).toBeDisabled();
    rerender(<ProductDetailScreen {...props} canModifyCart={false} isOffline report={baseReport} />);
    expect(screen.getByRole("button", { name: copy.reconnectToAdd })).toBeDisabled();
    rerender(<ProductDetailScreen {...props} canModifyCart={false} isOffline={false} report={baseReport} />);
    expect(screen.getByRole("button", { name: copy.cartUpdateUnavailable })).toBeDisabled();
  });

  it("renders existing cart line quantity controls with product-specific labels", () => {
    renderScreen({ report: reportWith({ cartLine: { cartItemId: "line-1", quantity: 2, canIncreaseQuantity: true, canDecreaseQuantity: true } }) });
    expect(screen.getByText(copy.inCart)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: `${baseReport.name} quantity controls` })).toBeInTheDocument();
    expect(screen.getByLabelText(`${copy.quantityLabel} for ${baseReport.name}: 2`)).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("button", { name: `${copy.increaseQuantity}: ${baseReport.name}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${copy.decreaseQuantity}: ${baseReport.name}` })).toBeInTheDocument();
  });

  it("invokes quantity callbacks with cartItemId", () => {
    const increase = vi.fn();
    const decrease = vi.fn();
    renderScreen({
      onIncreaseCartLineQuantity: increase,
      onDecreaseCartLineQuantity: decrease,
      report: reportWith({ cartLine: { cartItemId: "line-1", quantity: 2, canIncreaseQuantity: true, canDecreaseQuantity: true } }),
    });
    fireEvent.click(screen.getByRole("button", { name: `${copy.increaseQuantity}: ${baseReport.name}` }));
    expect(increase).toHaveBeenCalledWith("line-1");
    cleanup();
    renderScreen({
      onIncreaseCartLineQuantity: increase,
      onDecreaseCartLineQuantity: decrease,
      report: reportWith({ cartLine: { cartItemId: "line-1", quantity: 2, canIncreaseQuantity: true, canDecreaseQuantity: true } }),
    });
    fireEvent.click(screen.getByRole("button", { name: `${copy.decreaseQuantity}: ${baseReport.name}` }));
    expect(decrease).toHaveBeenCalledWith("line-1");
  });

  it("normalises quantities", () => {
    const { rerender, props } = renderScreen({ report: reportWith({ cartLine: { cartItemId: "line-1", quantity: -2, canIncreaseQuantity: true, canDecreaseQuantity: true } }) });
    expect(screen.getByRole("button", { name: copy.addToCart })).toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} report={reportWith({ cartLine: { cartItemId: "line-1", quantity: Number.NaN, canIncreaseQuantity: true, canDecreaseQuantity: true } })} />);
    expect(screen.getByRole("button", { name: copy.addToCart })).toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} report={reportWith({ cartLine: { cartItemId: "line-1", quantity: Number.POSITIVE_INFINITY, canIncreaseQuantity: true, canDecreaseQuantity: true } })} />);
    expect(screen.getByRole("button", { name: copy.addToCart })).toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} report={reportWith({ cartLine: { cartItemId: "line-1", quantity: 2.9, canIncreaseQuantity: true, canDecreaseQuantity: true } })} />);
    expect(screen.getByLabelText(`${copy.quantityLabel} for ${baseReport.name}: 2`)).toBeInTheDocument();
  });

  it("shows quantity pending and rejection toast", async () => {
    const increase = vi.fn().mockRejectedValue(new Error("no"));
    renderScreen({
      onIncreaseCartLineQuantity: increase,
      report: reportWith({ cartLine: { cartItemId: "line-1", quantity: 2, canIncreaseQuantity: true, canDecreaseQuantity: true } }),
    });
    fireEvent.click(screen.getByRole("button", { name: `${copy.increaseQuantity}: ${baseReport.name}` }));
    expect(await screen.findByText(copy.increaseError)).toBeInTheDocument();
  });

  it("renders cart route with normalised count and accessible badge", () => {
    renderScreen();
    const button = screen.getByRole("button", { name: "Cart: 3 items in cart" });
    expect(button).toBeInTheDocument();
    expect(within(button).getByText("3")).toHaveAttribute("aria-hidden", "true");
  });

  it("normalises cart counts for visibility and labels", () => {
    const { rerender, props } = renderScreen({ report: reportWith({ cartSummary: { itemCount: -1 } }) });
    expect(screen.queryByRole("button", { name: /Cart:/ })).not.toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} report={reportWith({ cartSummary: { itemCount: Number.POSITIVE_INFINITY } })} />);
    expect(screen.queryByRole("button", { name: /Cart:/ })).not.toBeInTheDocument();
    rerender(<ProductDetailScreen {...props} report={reportWith({ cartSummary: { itemCount: 2.9 } })} />);
    expect(screen.getByRole("button", { name: "Cart: 2 items in cart" })).toBeInTheDocument();
  });

  it("opens cart and shows route labels", async () => {
    const openCart = vi.fn().mockRejectedValue(new Error("no"));
    renderScreen({ onOpenCart: openCart });
    fireEvent.click(screen.getByRole("button", { name: copy.viewCart }));
    expect(await screen.findByText(copy.cartError)).toBeInTheDocument();
  });

  it("renders cart blocked labels", () => {
    const { rerender, props } = renderScreen({ canOpenCart: false, isOffline: true });
    expect(screen.getByRole("button", { name: copy.reconnectToCart })).toBeDisabled();
    rerender(<ProductDetailScreen {...props} canOpenCart={false} isOffline={false} />);
    expect(screen.getByRole("button", { name: copy.cartUnavailable })).toBeDisabled();
  });

  it("back invokes callback and rejection shows toast", async () => {
    const back = vi.fn().mockRejectedValue(new Error("no"));
    renderScreen({ onBack: back });
    fireEvent.click(screen.getByRole("button", { name: copy.back }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(copy.backError)).toBeInTheDocument();
  });

  it("ready callback rejection toast appears above sticky footer and error retry uses bottom safe area", async () => {
    renderScreen({ onAddToCart: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.addToCart }));
    const readyToast = await screen.findByTestId("toast-region");
    expect(readyToast.className).toContain("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_190px)]");
    cleanup();
    renderScreen({ state: "error", report: null, onRetryLoad: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    const errorToast = await screen.findByTestId("toast-region");
    expect(errorToast.className).toContain("bottom-[max(24px,env(safe-area-inset-bottom))]");
  });



  it("disables Add to cart when the optional add adapter is missing", () => {
    renderScreen({ onAddToCart: undefined });
    expect(screen.getByRole("button", { name: copy.addToCart })).toBeDisabled();
  });

  it("disables missing optional quantity adapters", () => {
    const cartLine = {
      cartItemId: "line-1",
      quantity: 2,
      canIncreaseQuantity: true,
      canDecreaseQuantity: true,
    };
    const { rerender, props } = renderScreen({
      onIncreaseCartLineQuantity: undefined,
      report: reportWith({ cartLine }),
    });
    expect(
      screen.getByRole("button", {
        name: `${copy.increaseQuantity}: ${baseReport.name}`,
      }),
    ).toBeDisabled();

    rerender(
      <ProductDetailScreen
        {...props}
        onDecreaseCartLineQuantity={undefined}
        onIncreaseCartLineQuantity={vi.fn()}
        report={reportWith({ cartLine })}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: `${copy.decreaseQuantity}: ${baseReport.name}`,
      }),
    ).toBeDisabled();
  });

  it("disables the blocked top-bar cart route and does not invoke its host callback", () => {
    const openCart = vi.fn();
    renderScreen({ canOpenCart: false, onOpenCart: openCart });
    const button = screen.getByRole("button", {
      name: "Cart: 3 items in cart",
    });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(openCart).not.toHaveBeenCalled();
  });

  it("resets thumbnail placeholders for replacement URLs and new products", () => {
    const { rerender, props } = renderScreen();
    const sideButton = screen.getByRole("button", {
      name: "Show image: Soft Balance Cleanser side",
    });
    const firstThumbnail = sideButton.querySelector("img");
    expect(firstThumbnail).not.toBeNull();
    fireEvent.error(firstThumbnail!);
    expect(within(sideButton).getByText(copy.productImageUnavailable)).toBeInTheDocument();

    const replacementUrl = "https://cdn.example.com/side-v2.png";
    rerender(
      <ProductDetailScreen
        {...props}
        report={reportWith({
          images: [
            baseReport.images[0],
            { ...baseReport.images[1], url: replacementUrl },
          ],
        })}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Show image: Soft Balance Cleanser side" })
        .querySelector(`img[src="${replacementUrl}"]`),
    ).not.toBeNull();

    const newProductUrl = "https://cdn.example.com/other-side.png";
    rerender(
      <ProductDetailScreen
        {...props}
        report={reportWith({
          productId: "p-other",
          images: [
            baseReport.images[0],
            { ...baseReport.images[1], url: newProductUrl },
          ],
        })}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Show image: Soft Balance Cleanser side" })
        .querySelector(`img[src="${newProductUrl}"]`),
    ).not.toBeNull();
  });

  it("positions add rejection toasts above compact purchase footers", async () => {
    renderScreen({ onAddToCart: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.addToCart }));
    expect((await screen.findByTestId("toast-region")).className).toContain(
      "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_190px)]",
    );
  });

  it("positions quantity rejection toasts above expanded purchase footers", async () => {
    renderScreen({
      onIncreaseCartLineQuantity: vi.fn().mockRejectedValue(new Error("no")),
      report: reportWith({
        cartLine: {
          cartItemId: "line-1",
          quantity: 2,
          canIncreaseQuantity: true,
          canDecreaseQuantity: true,
        },
      }),
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: `${copy.increaseQuantity}: ${baseReport.name}`,
      }),
    );
    expect((await screen.findByTestId("toast-region")).className).toContain(
      "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_280px)]",
    );
  });

  it("positions retry rejection toasts at the safe-area bottom", async () => {
    renderScreen({
      onRetryLoad: vi.fn().mockRejectedValue(new Error("no")),
      report: null,
      state: "error",
    });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect((await screen.findByTestId("toast-region")).className).toContain(
      "bottom-[max(24px,env(safe-area-inset-bottom))]",
    );
  });

  it("guards unavailable and already-selected variant option changes programmatically", () => {
    const select = vi.fn();
    renderScreen({ onSelectVariantOption: select });
    fireEvent.change(screen.getByRole("radio", { name: /100 ml/ }), {
      target: { checked: true },
    });
    fireEvent.change(screen.getByRole("radio", { name: /50 ml/ }), {
      target: { checked: true },
    });
    expect(select).not.toHaveBeenCalled();
  });

  it("uses readable disabled styling for unavailable variant option titles", () => {
    renderScreen();
    const unavailableOption = screen.getByText("100 ml");
    expect(unavailableOption.className).toContain("text-[var(--dl-dusk)]");
  });

  it("renders the fixed first-party boundary once when the optional label matches it", () => {
    renderScreen({ report: reportWith({ firstPartyLabel: copy.soldDirectly }) });
    expect(screen.getAllByText(copy.soldDirectly)).toHaveLength(1);
  });

  it("renders a loading footer with one Add to cart label and no fake price summary", () => {
    renderScreen({ report: null, state: "loading" });
    expect(screen.getAllByText(copy.addToCart)).toHaveLength(1);
    expect(screen.getByRole("button", { name: copy.addToCart })).toBeDisabled();
  });

  it("exports defensive helpers", () => {
    expect(normaliseNonNegativeInteger(-1)).toBe(0);
    expect(formatCartItemCount(1.9)).toBe("1 item");
    expect(isProductUnavailable(reportWith({ availabilityState: "unavailable" }))).toBe(true);
  });

  it("does not render forbidden architecture surfaces and restores browser descriptors", () => {
    const mediaSpy = vi.fn();
    const geoSpy = vi.fn();
    const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "mediaDevices",
    );
    const originalGeolocationDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "geolocation",
    );

    try {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: { getUserMedia: mediaSpy },
      });
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: { getCurrentPosition: geoSpy },
      });
      renderScreen();
      expect(document.querySelector("a")).toBeNull();
      expect(document.querySelector('input[type="file"]')).toBeNull();
      expect(document.querySelector("video")).toBeNull();
      expect(document.body.textContent).not.toMatch(
        /affiliate|marketplace|sponsored|promo|prescription|diagnosis/i,
      );
      expect(mediaSpy).not.toHaveBeenCalled();
      expect(geoSpy).not.toHaveBeenCalled();
    } finally {
      if (originalMediaDevicesDescriptor) {
        Object.defineProperty(
          navigator,
          "mediaDevices",
          originalMediaDevicesDescriptor,
        );
      } else {
        Reflect.deleteProperty(navigator, "mediaDevices");
      }

      if (originalGeolocationDescriptor) {
        Object.defineProperty(
          navigator,
          "geolocation",
          originalGeolocationDescriptor,
        );
      } else {
        Reflect.deleteProperty(navigator, "geolocation");
      }
    }

    expect(Object.getOwnPropertyDescriptor(navigator, "mediaDevices")).toEqual(
      originalMediaDevicesDescriptor,
    );
    expect(Object.getOwnPropertyDescriptor(navigator, "geolocation")).toEqual(
      originalGeolocationDescriptor,
    );
  });

  it("does not call fetch", () => {
    const fetchSpy = vi
      .spyOn(globalThis as typeof globalThis & { fetch: typeof fetch }, "fetch")
      .mockImplementation(vi.fn());
    renderScreen();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
