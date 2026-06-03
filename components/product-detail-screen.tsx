import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type ProductDetailState = "loading" | "ready" | "error";

export type ProductDetailToastFooterMode = "none" | "compact" | "expanded";

export type ProductDetailOperation =
  | "back"
  | "open-cart"
  | "select-option"
  | "add-to-cart"
  | "increase-quantity"
  | "decrease-quantity"
  | "open-reviews"
  | "retry-load"
  | null;

export type ProductAvailabilityState = "available" | "attention" | "unavailable";
export type ProductBadgeTone = "neutral" | "peach" | "warning";
export type IngredientHighlightTone = "neutral" | "positive" | "attention";

export interface ProductDetailImage {
  id: string;
  url?: string;
  alt: string;
}

export interface ProductDetailBadge {
  id: string;
  label: string;
  tone?: ProductBadgeTone;
}

export interface ProductDetailVariantOption {
  id: string;
  label: string;
  supporting?: string;
  availabilityLabel?: string;
  isAvailable: boolean;
}

export interface ProductDetailVariantGroup {
  id: string;
  label: string;
  required: boolean;
  selectedOptionId?: string;
  options: ProductDetailVariantOption[];
}

export interface ProductIngredientHighlight {
  id: string;
  name: string;
  description?: string;
  tone?: IngredientHighlightTone;
}

export interface ProductUsageDirection {
  id: string;
  title: string;
  description: string;
}

export interface ProductReviewSummary {
  ratingLabel?: string;
  countLabel?: string;
  supporting?: string;
}

export interface ProductDetailCartLine {
  cartItemId: string;
  quantity: number;
  canIncreaseQuantity: boolean;
  canDecreaseQuantity: boolean;
}

export interface ProductDetailCartSummary {
  itemCount: number;
  subtotalLabel?: string;
}

export interface ProductDetailReport {
  productId: string;
  brand: string;
  name: string;
  categoryLabel: string;
  description?: string;
  priceLabel?: string;
  availabilityState: ProductAvailabilityState;
  availabilityLabel: string;
  firstPartyLabel?: string;
  images: ProductDetailImage[];
  routineFit?: string;
  matchedStepLabels: string[];
  timingLabels: string[];
  variantGroups: ProductDetailVariantGroup[];
  resolvedVariantId?: string;
  canAddToCart: boolean;
  addToCartBlockReason?: "select-options" | "unavailable";
  cartLine?: ProductDetailCartLine;
  usageDirections: ProductUsageDirection[];
  usageFrequencyLabel?: string;
  layeringNote?: string;
  caution?: string;
  ingredientHighlights: ProductIngredientHighlight[];
  fullIngredientList: string[];
  badges: ProductDetailBadge[];
  reviewSummary?: ProductReviewSummary;
  cartSummary: ProductDetailCartSummary;
}

export interface ProductDetailScreenProps {
  state?: ProductDetailState;
  report?: ProductDetailReport | null;
  initialSelectedImageId?: string;
  isOffline?: boolean;
  canModifyCart?: boolean;
  canOpenCart?: boolean;
  onBack: () => void | Promise<void>;
  onOpenCart?: () => void | Promise<void>;
  onSelectVariantOption?: (groupId: string, optionId: string) => void | Promise<void>;
  onAddToCart?: (productId: string, resolvedVariantId?: string) => void | Promise<void>;
  onIncreaseCartLineQuantity?: (cartItemId: string) => void | Promise<void>;
  onDecreaseCartLineQuantity?: (cartItemId: string) => void | Promise<void>;
  onOpenReviews?: () => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export interface ActiveVariantOptionContext {
  groupId: string;
  optionId: string;
}

export const colors = {
  page: "#FAF7F2",
  surface: "#FFFFFF",
  surfaceSoft: "#F5F0E8",
  parchment: "#EDE6D9",
  blush: "#F2D9CC",
  blushStrong: "#E8C4B0",
  peach: "#E8A98A",
  peachStrong: "#D4866A",
  sand: "#C9B8A4",
  stone: "#A89585",
  dusk: "#8C7B72",
  bark: "#5C4A42",
  barkHover: "#493A34",
  textPrimary: "#3A2E28",
  textSecondary: "#6B5650",
  borderSubtle: "#E4D8CE",
  warningText: "#7A5700",
  warningSurface: "#FDF5E4",
  errorText: "#A33D2A",
  errorSurface: "#FBEEE6",
} as const;

export const fonts = {
  display: '"DM Serif Display", Georgia, serif',
  ui: '"DM Sans", system-ui, sans-serif',
  metadata: '"Space Mono", monospace',
} as const;

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

export const copy = {
  contextLabel: "PRODUCT DETAIL",
  back: "Back",
  cart: "Cart",
  viewCart: "View cart",
  openingCart: "Opening cart…",
  reconnectToCart: "Reconnect to view cart",
  cartUnavailable: "Cart unavailable right now",
  soldDirectly: "Sold directly by DermaLens.",
  loadingHeading: "Loading product details…",
  loadingSupporting: "We are preparing the product information.",
  productImageUnavailable: "Product image unavailable",
  productAvailable: "Available",
  productUnavailable: "Currently unavailable",
  whyThisFits: "Why this fits your routine",
  matchedTo: "Matched to",
  routineTiming: "Routine timing",
  variantsHeading: "Choose your options",
  required: "Required",
  updatingOption: "Updating option…",
  usageHeading: "How to use",
  frequency: "Frequency",
  layeringNote: "Layering note",
  caution: "Caution",
  ingredientsHeading: "Key ingredients",
  fullIngredientsHeading: "Full ingredient list",
  noIngredientHighlights: "No key ingredient highlights are available.",
  noFullIngredients: "No full ingredient list is available.",
  badgesHeading: "Product details",
  reviewsHeading: "Customer reviews",
  readReviews: "Read reviews",
  openingReviews: "Opening reviews…",
  purchaseOptional:
    "Purchasing is optional. You can use a suitable product you already own if it fits your routine.",
  addToCart: "Add to cart",
  addingToCart: "Adding to cart…",
  selectOptionsToContinue: "Select options to continue",
  reconnectToAdd: "Reconnect to add to cart",
  cartUpdateUnavailable: "Cart update unavailable right now",
  inCart: "In cart",
  quantityLabel: "Quantity",
  increaseQuantity: "Increase quantity",
  decreaseQuantity: "Decrease quantity",
  updatingQuantity: "Updating…",
  errorHeading: "We could not display this product",
  errorSupporting: "Try loading the product again or return to the previous screen.",
  retry: "Try loading again",
  retrying: "Retrying…",
  backError: "We could not return to the previous screen. Please try again.",
  cartError: "We could not open your cart. Please try again.",
  optionError: "We could not update this option. Please try again.",
  addError: "We could not add this product to your cart. Please try again.",
  increaseError: "We could not update this quantity. Please try again.",
  decreaseError: "We could not update this quantity. Please try again.",
  reviewsError: "We could not open the reviews. Please try again.",
  retryError: "We could not reload this product. Please try again.",
} as const;

const themeStyle = {
  "--dl-page": colors.page,
  "--dl-surface": colors.surface,
  "--dl-surface-soft": colors.surfaceSoft,
  "--dl-parchment": colors.parchment,
  "--dl-blush": colors.blush,
  "--dl-blush-strong": colors.blushStrong,
  "--dl-peach": colors.peach,
  "--dl-peach-strong": colors.peachStrong,
  "--dl-sand": colors.sand,
  "--dl-stone": colors.stone,
  "--dl-dusk": colors.dusk,
  "--dl-bark": colors.bark,
  "--dl-bark-hover": colors.barkHover,
  "--dl-text-primary": colors.textPrimary,
  "--dl-text-secondary": colors.textSecondary,
  "--dl-border-subtle": colors.borderSubtle,
  "--dl-warning-text": colors.warningText,
  "--dl-warning-surface": colors.warningSurface,
  "--dl-error-text": colors.errorText,
  "--dl-error-surface": colors.errorSurface,
  "--dl-display": fonts.display,
  "--dl-ui": fonts.ui,
  "--dl-metadata": fonts.metadata,
} as CSSProperties;

export function normaliseNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

export function formatCartItemCount(value: number): string {
  const count = normaliseNonNegativeInteger(value);
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function isProductUnavailable(report: ProductDetailReport): boolean {
  return report.availabilityState === "unavailable" || report.addToCartBlockReason === "unavailable";
}

function getAvailabilityLabel(report: ProductDetailReport): string {
  const unavailable = isProductUnavailable(report);
  return report.availabilityLabel.trim() || (unavailable ? copy.productUnavailable : copy.productAvailable);
}

function getAddToCartLabel({
  activeOperation,
  canModifyCart,
  isOffline,
  report,
}: {
  activeOperation: ProductDetailOperation;
  canModifyCart: boolean;
  isOffline: boolean;
  report: ProductDetailReport;
}): string {
  if (activeOperation === "add-to-cart") return copy.addingToCart;
  if (isProductUnavailable(report)) return report.availabilityLabel.trim() || copy.productUnavailable;
  if (report.addToCartBlockReason === "select-options" || !report.canAddToCart) {
    return copy.selectOptionsToContinue;
  }
  if (!canModifyCart) return isOffline ? copy.reconnectToAdd : copy.cartUpdateUnavailable;
  return copy.addToCart;
}

function getCartButtonLabel({
  activeOperation,
  canOpenCart,
  isOffline,
}: {
  activeOperation: ProductDetailOperation;
  canOpenCart: boolean;
  isOffline: boolean;
}): string {
  if (activeOperation === "open-cart") return copy.openingCart;
  if (!canOpenCart) return isOffline ? copy.reconnectToCart : copy.cartUnavailable;
  return copy.viewCart;
}

function classNames(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(" ");
}

function useMountedRef() {
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return mountedRef;
}

function ToastRegion({
  footerMode,
  message,
}: {
  footerMode: ProductDetailToastFooterMode;
  message: string | null;
}) {
  const positionClass =
    footerMode === "expanded"
      ? "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_280px)]"
      : footerMode === "compact"
        ? "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_190px)]"
        : "bottom-[max(24px,env(safe-area-inset-bottom))]";

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 z-50 mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${positionClass} ${
        message ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      data-testid="toast-region"
      role="status"
      style={themeStyle}
    >
      {message ?? ""}
    </div>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`${className} animate-spin motion-reduce:animate-none`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M6 7h14l-1.4 8.2a2 2 0 0 1-2 1.7H9a2 2 0 0 1-2-1.6L5 4H3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <circle cx="9" cy="20" r="1" fill="currentColor" />
      <circle cx="17" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 flex-none text-[var(--dl-peach-strong)]" fill="none" viewBox="0 0 24 24">
      <path d="M12 3l7 3v5c0 4.6-2.9 8.4-7 10-4.1-1.6-7-5.4-7-10V6l7-3z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function TopBar({
  canOpenCart = true,
  cartCount,
  disabled,
  hasProduct,
  onBack,
  onOpenCart,
}: {
  canOpenCart?: boolean;
  cartCount: number;
  disabled: boolean;
  hasProduct: boolean;
  onBack: () => void;
  onOpenCart?: () => void;
}) {
  const showCart = hasProduct && cartCount > 0 && Boolean(onOpenCart);
  return (
    <div className="grid min-h-12 grid-cols-[44px_1fr_44px] items-center gap-2">
      <button
        aria-label={copy.back}
        className={classNames("flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]", focusRing)}
        disabled={disabled}
        onClick={onBack}
        type="button"
      >
        <ArrowLeftIcon />
      </button>
      <div className="text-center font-[family-name:var(--dl-metadata)] text-[11px] uppercase leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </div>
      {showCart ? (
        <button
          aria-label={`${copy.cart}: ${formatCartItemCount(cartCount)} in cart`}
          className={classNames("relative flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]", focusRing)}
          disabled={disabled || !canOpenCart}
          onClick={onOpenCart}
          type="button"
        >
          <CartIcon />
          <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--dl-bark)] px-1 text-center text-[11px] font-semibold leading-5 text-white">
            {cartCount}
          </span>
        </button>
      ) : (
        <div aria-hidden="true" className="h-11 w-11" />
      )}
    </div>
  );
}

function LoadingExperience({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
  return (
    <div className="min-h-dvh bg-[var(--dl-page)] px-6 pb-32 pt-[max(24px,env(safe-area-inset-top))] text-[var(--dl-text-primary)] max-[374px]:px-5" style={themeStyle}>
      <div className="mx-auto max-w-[760px]">
        <TopBar cartCount={0} disabled={disabled} hasProduct={false} onBack={onBack} />
        <div aria-live="polite" className="mt-8" role="status">
          <h1 className="font-[family-name:var(--dl-display)] text-[34px] leading-[38px] text-[var(--dl-text-primary)] max-[374px]:text-[31px] max-[374px]:leading-[35px]">
            {copy.loadingHeading}
          </h1>
          <p className="mt-2 max-w-md text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.loadingSupporting}</p>
        </div>
        <div className="mt-6 h-[300px] animate-pulse rounded-[20px] bg-[var(--dl-parchment)] max-[374px]:h-[250px] md:h-[360px]" />
        <div className="mt-6 space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--dl-surface-soft)]" />
          <div className="h-32 animate-pulse rounded-2xl bg-[var(--dl-surface-soft)]" />
          <div className="h-32 animate-pulse rounded-2xl bg-[var(--dl-surface-soft)]" />
        </div>
      </div>
      <PurchaseFooter
        addLabelOverride={copy.addToCart}
        disabled
        hasProduct={false}
        operation={null}
      />
    </div>
  );
}

function ErrorExperience({
  activeOperation,
  disabled,
  onBack,
  onRetry,
}: {
  activeOperation: ProductDetailOperation;
  disabled: boolean;
  onBack: () => void;
  onRetry?: () => void;
}) {
  const isRetrying = activeOperation === "retry-load";
  return (
    <div className="min-h-dvh bg-[var(--dl-page)] px-6 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] text-[var(--dl-text-primary)] max-[374px]:px-5" style={themeStyle}>
      <div className="mx-auto max-w-[560px]">
        <TopBar cartCount={0} disabled={disabled} hasProduct={false} onBack={onBack} />
        <div className="mt-12 rounded-[24px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-6 shadow-[0_4px_20px_rgba(92,74,66,0.08)]">
          <div role="alert">
            <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--dl-error-surface)] text-[var(--dl-error-text)]">!</div>
            <h1 className="mt-5 font-[family-name:var(--dl-display)] text-[34px] leading-[38px] text-[var(--dl-text-primary)] max-[374px]:text-[31px] max-[374px]:leading-[35px]">
              {copy.errorHeading}
            </h1>
            <p className="mt-2 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.errorSupporting}</p>
          </div>
          <div className="mt-6 space-y-3">
            {onRetry ? (
              <button
                className={classNames("flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--dl-bark)] px-5 text-sm font-semibold text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)]", focusRing)}
                disabled={disabled}
                onClick={onRetry}
                type="button"
              >
                {isRetrying ? <Spinner className="mr-2 h-4 w-4" /> : null}
                {isRetrying ? copy.retrying : copy.retry}
              </button>
            ) : null}
            <button
              className={classNames("min-h-11 w-full rounded-full px-5 text-sm font-semibold text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]", focusRing)}
              disabled={disabled}
              onClick={onBack}
              type="button"
            >
              {copy.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductGallery({
  disabled,
  initialSelectedImageId,
  report,
}: {
  disabled: boolean;
  initialSelectedImageId?: string;
  report: ProductDetailReport;
}) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(initialSelectedImageId ?? null);
  const [selectedImageError, setSelectedImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedImageId((current) => {
      if (current && report.images.some((image) => image.id === current)) return current;
      if (initialSelectedImageId && report.images.some((image) => image.id === initialSelectedImageId)) return initialSelectedImageId;
      return report.images[0]?.id ?? null;
    });
  }, [initialSelectedImageId, report.productId, report.images]);

  const selectedImage = report.images.find((image) => image.id === selectedImageId) ?? report.images[0] ?? null;

  useEffect(() => {
    setSelectedImageError(false);
  }, [report.productId, selectedImage?.id, selectedImage?.url]);

  const hasSelectedImage = Boolean(selectedImage?.url) && !selectedImageError;

  return (
    <section aria-label="Product image gallery" className="lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-parchment)]">
        {selectedImage && hasSelectedImage ? (
          <img
            key={`${report.productId}:${selectedImage.id}:${selectedImage.url}`}
            alt={selectedImage.alt}
            className="h-[300px] w-full object-contain max-[374px]:h-[250px] md:h-[360px] lg:h-[500px]"
            draggable={false}
            onError={() => setSelectedImageError(true)}
            src={selectedImage.url}
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm font-semibold text-[var(--dl-text-secondary)] max-[374px]:h-[250px] md:h-[360px] lg:h-[500px]">
            {copy.productImageUnavailable}
          </div>
        )}
      </div>
      {report.images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Product images">
          {report.images.map((image) => {
            const thumbnailErrorKey = `${report.productId}:${image.id}:${image.url ?? ""}`;
            const thumbnailError = thumbnailErrors[thumbnailErrorKey] || !image.url;
            const pressed = image.id === selectedImage?.id;
            return (
              <button
                aria-label={`Show image: ${image.alt}`}
                aria-pressed={pressed}
                className={classNames(
                  "h-16 w-16 flex-none overflow-hidden rounded-xl border bg-[var(--dl-parchment)] text-[10px] font-semibold leading-3 text-[var(--dl-text-secondary)] disabled:cursor-not-allowed max-[374px]:h-14 max-[374px]:w-14",
                  pressed ? "border-[var(--dl-bark)] ring-2 ring-[var(--dl-blush)]" : "border-[var(--dl-border-subtle)]",
                  focusRing,
                )}
                disabled={disabled}
                key={thumbnailErrorKey}
                onClick={() => setSelectedImageId(image.id)}
                type="button"
              >
                {thumbnailError ? (
                  <span className="flex h-full items-center justify-center px-1 text-center">{copy.productImageUnavailable}</span>
                ) : (
                  <img
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain"
                    draggable={false}
                    onError={() =>
                      setThumbnailErrors((current) => ({
                        ...current,
                        [thumbnailErrorKey]: true,
                      }))
                    }
                    src={image.url}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function ProductIdentity({ report }: { report: ProductDetailReport }) {
  const unavailable = isProductUnavailable(report);
  const warning = report.availabilityState === "attention" || unavailable;
  const availabilityLabel = getAvailabilityLabel(report);
  return (
    <section>
      <div className="font-[family-name:var(--dl-metadata)] text-xs uppercase leading-4 tracking-[0.1em] text-[var(--dl-peach-strong)]">{report.brand}</div>
      <h1 className="mt-2 font-[family-name:var(--dl-display)] text-[34px] leading-[38px] text-[var(--dl-text-primary)] max-[374px]:text-[31px] max-[374px]:leading-[35px]">
        {report.name}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--dl-parchment)] px-3 py-1 text-xs font-semibold text-[var(--dl-bark)]">{report.categoryLabel}</span>
        {report.priceLabel ? <span className="text-sm font-semibold text-[var(--dl-text-primary)]">{report.priceLabel}</span> : null}
        <span className={classNames("text-sm font-semibold", warning ? "text-[var(--dl-warning-text)]" : "text-[var(--dl-text-secondary)]")}>{availabilityLabel}</span>
      </div>
      {report.description ? <p className="mt-3 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{report.description}</p> : null}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--dl-parchment)] p-3 text-[13px] leading-[18px] text-[var(--dl-bark)]">
        <ShieldIcon />
        <div>
          <div>{copy.soldDirectly}</div>
          {report.firstPartyLabel?.trim() &&
          report.firstPartyLabel.trim() !== copy.soldDirectly ? (
            <div className="mt-1 text-[var(--dl-text-secondary)]">
              {report.firstPartyLabel.trim()}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RoutineFitCard({ report }: { report: ProductDetailReport }) {
  const hasContent = Boolean(report.routineFit) || report.matchedStepLabels.length > 0 || report.timingLabels.length > 0;
  if (!hasContent) return null;
  return (
    <section className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-4">
      <h2 className="text-base font-semibold leading-6 text-[var(--dl-text-primary)]">{copy.whyThisFits}</h2>
      {report.routineFit ? <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">{report.routineFit}</p> : null}
      {report.matchedStepLabels.length > 0 ? (
        <div className="mt-3">
          <div className="text-xs font-semibold text-[var(--dl-text-secondary)]">{copy.matchedTo}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.matchedStepLabels.map((label) => (
              <span className="rounded-full bg-[var(--dl-surface)] px-3 py-1 text-xs font-semibold text-[var(--dl-bark)]" key={label}>{label}</span>
            ))}
          </div>
        </div>
      ) : null}
      {report.timingLabels.length > 0 ? (
        <div className="mt-3">
          <div className="text-xs font-semibold text-[var(--dl-text-secondary)]">{copy.routineTiming}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.timingLabels.map((label) => (
              <span className="rounded-full bg-[var(--dl-surface)] px-3 py-1 text-xs font-semibold text-[var(--dl-bark)]" key={label}>{label}</span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function VariantSelection({
  activeContext,
  disabled,
  onSelect,
  report,
}: {
  activeContext: ActiveVariantOptionContext | null;
  disabled: boolean;
  onSelect?: (groupId: string, optionId: string) => void;
  report: ProductDetailReport;
}) {
  if (report.variantGroups.length === 0) return null;
  return (
    <section className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <h2 className="text-base font-semibold leading-6 text-[var(--dl-text-primary)]">{copy.variantsHeading}</h2>
      <div className="mt-4 space-y-5">
        {report.variantGroups.map((group) => {
          const isUpdating = activeContext?.groupId === group.id;
          return (
            <fieldset className="space-y-2" key={group.id}>
              <legend className="text-sm font-semibold text-[var(--dl-text-primary)]">
                {group.label} {group.required ? <span className="text-[var(--dl-text-secondary)]">· {copy.required}</span> : null}
              </legend>
              {isUpdating ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--dl-bark)]">
                  <Spinner /> {copy.updatingOption}
                </div>
              ) : null}
              <div aria-label={group.label} className="grid gap-2" role="radiogroup">
                {group.options.map((option) => {
                  const checked = group.selectedOptionId === option.id;
                  const optionDisabled =
                    disabled || !onSelect || !option.isAvailable;
                  return (
                    <label
                      className={classNames(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm",
                        checked ? "border-[var(--dl-bark)] bg-[var(--dl-blush)]" : "border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)]",
                        optionDisabled && "cursor-not-allowed text-[var(--dl-dusk)]",
                      )}
                      key={option.id}
                    >
                      <input
                        checked={checked}
                        className="mt-1 accent-[var(--dl-bark)]"
                        disabled={optionDisabled}
                        name={`variant-${group.id}`}
                        onChange={() => onSelect?.(group.id, option.id)}
                        type="radio"
                        value={option.id}
                      />
                      <span>
                        <span
                          className={classNames(
                            "block font-semibold",
                            optionDisabled
                              ? "text-[var(--dl-dusk)]"
                              : "text-[var(--dl-text-primary)]",
                          )}
                        >
                          {option.label}
                        </span>
                        {option.supporting ? (
                          <span
                            className={classNames(
                              "block text-[13px] leading-[18px]",
                              optionDisabled
                                ? "text-[var(--dl-dusk)]"
                                : "text-[var(--dl-text-secondary)]",
                            )}
                          >
                            {option.supporting}
                          </span>
                        ) : null}
                        {option.availabilityLabel ? <span className="block text-[13px] leading-[18px] text-[var(--dl-warning-text)]">{option.availabilityLabel}</span> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}

function UsageCard({ report }: { report: ProductDetailReport }) {
  const hasUsage = report.usageDirections.length > 0 || report.usageFrequencyLabel || report.layeringNote || report.caution;
  if (!hasUsage) return null;
  return (
    <section className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <h2 className="text-base font-semibold leading-6 text-[var(--dl-text-primary)]">{copy.usageHeading}</h2>
      <div className="mt-3 space-y-3">
        {report.usageDirections.map((direction) => (
          <div key={direction.id}>
            <div className="text-sm font-semibold text-[var(--dl-text-primary)]">{direction.title}</div>
            <p className="text-sm leading-5 text-[var(--dl-text-secondary)]">{direction.description}</p>
          </div>
        ))}
        {report.usageFrequencyLabel ? <InfoRow label={copy.frequency} value={report.usageFrequencyLabel} /> : null}
        {report.layeringNote ? <InfoRow label={copy.layeringNote} value={report.layeringNote} /> : null}
        {report.caution ? <div className="rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]"><strong>{copy.caution}: </strong>{report.caution}</div> : null}
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--dl-surface-soft)] p-3 text-sm leading-5">
      <span className="font-semibold text-[var(--dl-text-primary)]">{label}: </span>
      <span className="text-[var(--dl-text-secondary)]">{value}</span>
    </div>
  );
}

function IngredientsCard({ report }: { report: ProductDetailReport }) {
  return (
    <section className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <h2 className="text-base font-semibold leading-6 text-[var(--dl-text-primary)]">{copy.ingredientsHeading}</h2>
      {report.ingredientHighlights.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {report.ingredientHighlights.map((ingredient) => (
            <div className={classNames("rounded-xl p-3 text-sm leading-5", ingredient.tone === "positive" ? "bg-[var(--dl-blush)] text-[var(--dl-bark)]" : ingredient.tone === "attention" ? "bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]" : "bg-[var(--dl-parchment)] text-[var(--dl-bark)]")} key={ingredient.id}>
              <div className="font-semibold">{ingredient.name}</div>
              {ingredient.description ? <p>{ingredient.description}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.noIngredientHighlights}</p>
      )}
      <details className="mt-4 rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--dl-bark)]">{copy.fullIngredientsHeading}</summary>
        {report.fullIngredientList.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
            {report.fullIngredientList.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.noFullIngredients}</p>
        )}
      </details>
    </section>
  );
}

function BadgesCard({ badges }: { badges: ProductDetailBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <section className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <h2 className="text-base font-semibold leading-6 text-[var(--dl-text-primary)]">{copy.badgesHeading}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span className={classNames("rounded-full px-3 py-1 text-xs font-semibold", badge.tone === "peach" ? "bg-[var(--dl-blush)] text-[var(--dl-bark)]" : badge.tone === "warning" ? "bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]" : "bg-[var(--dl-parchment)] text-[var(--dl-bark)]")} key={badge.id}>{badge.label}</span>
        ))}
      </div>
    </section>
  );
}

function ReviewsCard({
  activeOperation,
  disabled,
  onOpenReviews,
  reviewSummary,
}: {
  activeOperation: ProductDetailOperation;
  disabled: boolean;
  onOpenReviews?: () => void;
  reviewSummary?: ProductReviewSummary;
}) {
  if (!reviewSummary) return null;
  const isOpening = activeOperation === "open-reviews";
  return (
    <section className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <h2 className="text-base font-semibold leading-6 text-[var(--dl-text-primary)]">{copy.reviewsHeading}</h2>
      <div className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {reviewSummary.ratingLabel ? <p>{reviewSummary.ratingLabel}</p> : null}
        {reviewSummary.countLabel ? <p>{reviewSummary.countLabel}</p> : null}
        {reviewSummary.supporting ? <p>{reviewSummary.supporting}</p> : null}
      </div>
      {onOpenReviews ? (
        <button
          className={classNames("mt-4 flex min-h-11 items-center justify-center rounded-full border border-[var(--dl-bark)] px-5 text-sm font-semibold text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)]", focusRing)}
          disabled={disabled}
          onClick={onOpenReviews}
          type="button"
        >
          {isOpening ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {isOpening ? copy.openingReviews : copy.readReviews}
        </button>
      ) : null}
    </section>
  );
}

function PurchaseFooter({
  addLabelOverride,
  canModifyCart = false,
  canOpenCart = false,
  disabled,
  hasProduct,
  isOffline = false,
  onAddToCart,
  onDecrease,
  onIncrease,
  onOpenCart,
  operation,
  priceLabel,
  report,
}: {
  addLabelOverride?: string;
  canModifyCart?: boolean;
  canOpenCart?: boolean;
  disabled: boolean;
  hasProduct: boolean;
  isOffline?: boolean;
  onAddToCart?: () => void;
  onDecrease?: () => void;
  onIncrease?: () => void;
  onOpenCart?: () => void;
  operation: ProductDetailOperation;
  priceLabel?: string;
  report?: ProductDetailReport;
}) {
  const quantity = report ? normaliseNonNegativeInteger(report.cartLine?.quantity ?? 0) : 0;
  const cartCount = report ? normaliseNonNegativeInteger(report.cartSummary.itemCount) : 0;
  const showCart = hasProduct && cartCount > 0 && onOpenCart;
  const addLabel = addLabelOverride ?? (report ? getAddToCartLabel({ activeOperation: operation, canModifyCart, isOffline, report }) : copy.addToCart);
  const addDisabled =
    disabled ||
    !report ||
    !onAddToCart ||
    !canModifyCart ||
    isProductUnavailable(report) ||
    !report.canAddToCart ||
    Boolean(report.addToCartBlockReason);

  return (
    <footer className="sticky bottom-0 z-30 mt-8 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 py-4 pb-[max(20px,env(safe-area-inset-bottom))] backdrop-blur max-[374px]:px-5" style={themeStyle}>
      <div className="mx-auto flex max-w-[760px] flex-col gap-3 lg:max-w-[1180px]">
        {priceLabel?.trim() ? (
          <div className="text-sm font-semibold text-[var(--dl-text-primary)]">
            {priceLabel}
          </div>
        ) : null}
        {quantity > 0 && report?.cartLine ? (
          <div className="rounded-2xl bg-[var(--dl-surface)] p-3">
            <div className="mb-2 text-sm font-semibold text-[var(--dl-text-primary)]">{copy.inCart}</div>
            <div aria-label={`${report.name} quantity controls`} className="flex items-center justify-between gap-2" role="group">
              <button
                aria-label={`${copy.decreaseQuantity}: ${report.name}`}
                className={classNames("h-11 w-11 rounded-full border border-[var(--dl-border-subtle)] text-lg font-semibold text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]", focusRing)}
                disabled={disabled || !canModifyCart || !report.cartLine.canDecreaseQuantity || !onDecrease}
                onClick={onDecrease}
                type="button"
              >−</button>
              <span aria-label={`${copy.quantityLabel} for ${report.name}: ${quantity}`} aria-live="polite" className="min-w-8 text-center text-sm font-semibold text-[var(--dl-text-primary)]">{quantity}</span>
              <button
                aria-label={`${copy.increaseQuantity}: ${report.name}`}
                className={classNames("h-11 w-11 rounded-full border border-[var(--dl-border-subtle)] text-lg font-semibold text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]", focusRing)}
                disabled={disabled || !canModifyCart || !report.cartLine.canIncreaseQuantity || !onIncrease || isProductUnavailable(report)}
                onClick={onIncrease}
                type="button"
              >+</button>
            </div>
            {operation === "increase-quantity" || operation === "decrease-quantity" ? (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--dl-bark)]"><Spinner />{copy.updatingQuantity}</div>
            ) : null}
          </div>
        ) : (
          <button
            className={classNames("flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold text-white shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]", focusRing)}
            disabled={addDisabled}
            onClick={onAddToCart}
            type="button"
          >
            {operation === "add-to-cart" ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {addLabel}
          </button>
        )}
        {showCart ? (
          <button
            className={classNames("min-h-11 rounded-full border border-[var(--dl-bark)] px-5 text-sm font-semibold text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)]", focusRing)}
            disabled={disabled || !canOpenCart}
            onClick={onOpenCart}
            type="button"
          >
            {operation === "open-cart" ? copy.openingCart : getCartButtonLabel({ activeOperation: operation, canOpenCart, isOffline })}
          </button>
        ) : null}
      </div>
    </footer>
  );
}

function ReadyExperience({
  activeOperation,
  activeVariantContext,
  canModifyCart,
  canOpenCart,
  disabled,
  initialSelectedImageId,
  isOffline,
  onAddToCart,
  onBack,
  onDecrease,
  onIncrease,
  onOpenCart,
  onOpenReviews,
  onSelectVariantOption,
  report,
}: {
  activeOperation: ProductDetailOperation;
  activeVariantContext: ActiveVariantOptionContext | null;
  canModifyCart: boolean;
  canOpenCart: boolean;
  disabled: boolean;
  initialSelectedImageId?: string;
  isOffline: boolean;
  onAddToCart?: () => void;
  onBack: () => void;
  onDecrease?: () => void;
  onIncrease?: () => void;
  onOpenCart?: () => void;
  onOpenReviews?: () => void;
  onSelectVariantOption?: (groupId: string, optionId: string) => void;
  report: ProductDetailReport;
}) {
  const cartCount = normaliseNonNegativeInteger(report.cartSummary.itemCount);
  return (
    <div className="min-h-dvh bg-[var(--dl-page)] px-6 pb-0 pt-[max(24px,env(safe-area-inset-top))] text-[var(--dl-text-primary)] max-[374px]:px-5" style={themeStyle}>
      <div className="mx-auto max-w-[760px] pb-6 lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:gap-12">
        <div className="lg:col-start-2">
          <TopBar
            canOpenCart={canOpenCart}
            cartCount={cartCount}
            disabled={disabled}
            hasProduct
            onBack={onBack}
            onOpenCart={onOpenCart}
          />
        </div>
        <div className="mt-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <ProductGallery disabled={disabled} initialSelectedImageId={initialSelectedImageId} report={report} />
          <div className="mt-3 flex items-start gap-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]"><ShieldIcon />{copy.purchaseOptional}</div>
        </div>
        <main className="mt-6 space-y-4 lg:col-start-2 lg:mt-6">
          <ProductIdentity report={report} />
          <RoutineFitCard report={report} />
          <VariantSelection activeContext={activeVariantContext} disabled={disabled} onSelect={onSelectVariantOption} report={report} />
          <UsageCard report={report} />
          <IngredientsCard report={report} />
          <BadgesCard badges={report.badges} />
          <ReviewsCard activeOperation={activeOperation} disabled={disabled} onOpenReviews={onOpenReviews} reviewSummary={report.reviewSummary} />
        </main>
      </div>
      <PurchaseFooter
        canModifyCart={canModifyCart}
        canOpenCart={canOpenCart}
        disabled={disabled}
        hasProduct
        isOffline={isOffline}
        onAddToCart={onAddToCart}
        onDecrease={onDecrease}
        onIncrease={onIncrease}
        onOpenCart={onOpenCart}
        operation={activeOperation}
        priceLabel={report.priceLabel || report.name}
        report={report}
      />
    </div>
  );
}

export default function ProductDetailScreen({
  state = "loading",
  report = null,
  initialSelectedImageId,
  isOffline = false,
  canModifyCart = true,
  canOpenCart = true,
  onBack,
  onOpenCart,
  onSelectVariantOption,
  onAddToCart,
  onIncreaseCartLineQuantity,
  onDecreaseCartLineQuantity,
  onOpenReviews,
  onRetryLoad,
}: ProductDetailScreenProps) {
  const effectiveState: ProductDetailState = state === "ready" && report === null ? "error" : state;
  const hasRenderableProduct = effectiveState === "ready" && report !== null;
  const mountedRef = useMountedRef();
  const inFlightRef = useRef<ProductDetailOperation>(null);
  const [activeOperation, setActiveOperation] = useState<ProductDetailOperation>(null);
  const [activeVariantContext, setActiveVariantContext] = useState<ActiveVariantOptionContext | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const operationPending = activeOperation !== null;
  const hasStickyFooter = effectiveState === "loading" || hasRenderableProduct;
  const hasExpandedPurchaseFooter =
    hasRenderableProduct &&
    Boolean(report?.cartLine) &&
    normaliseNonNegativeInteger(report?.cartLine?.quantity ?? 0) > 0;
  const toastFooterMode: ProductDetailToastFooterMode = !hasStickyFooter
    ? "none"
    : hasExpandedPurchaseFooter
      ? "expanded"
      : "compact";

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const runOperation = useCallback(
    async (operation: ProductDetailOperation, callback: (() => void | Promise<void>) | undefined, errorMessage: string) => {
      if (!callback || inFlightRef.current !== null) return;
      inFlightRef.current = operation;
      setActiveOperation(operation);
      setToastMessage(null);
      try {
        await callback();
      } catch {
        if (mountedRef.current) showToast(errorMessage);
      } finally {
        if (mountedRef.current) {
          setActiveOperation(null);
          setActiveVariantContext(null);
        }
        inFlightRef.current = null;
      }
    },
    [mountedRef, showToast],
  );

  const handleBack = () => runOperation("back", onBack, copy.backError);
  const handleOpenCart = () => {
    if (!hasRenderableProduct || !onOpenCart || normaliseNonNegativeInteger(report.cartSummary.itemCount) <= 0 || !canOpenCart) return;
    return runOperation("open-cart", onOpenCart, copy.cartError);
  };
  const handleSelectVariantOption = (groupId: string, optionId: string) => {
    if (
      !hasRenderableProduct ||
      !onSelectVariantOption ||
      operationPending ||
      inFlightRef.current !== null
    ) {
      return;
    }

    const group = report.variantGroups.find(
      (candidate) => candidate.id === groupId,
    );

    const option = group?.options.find(
      (candidate) => candidate.id === optionId,
    );

    if (
      !group ||
      !option ||
      !option.isAvailable ||
      group.selectedOptionId === optionId
    ) {
      return;
    }

    setActiveVariantContext({ groupId, optionId });
    return runOperation("select-option", () => onSelectVariantOption(groupId, optionId), copy.optionError);
  };
  const handleAddToCart = () => {
    if (!hasRenderableProduct || !onAddToCart || !canModifyCart || isProductUnavailable(report) || !report.canAddToCart || report.addToCartBlockReason) return;
    return runOperation("add-to-cart", () => onAddToCart(report.productId, report.resolvedVariantId), copy.addError);
  };
  const handleIncrease = () => {
    if (!hasRenderableProduct || !report.cartLine || !onIncreaseCartLineQuantity || !canModifyCart || !report.cartLine.canIncreaseQuantity || isProductUnavailable(report)) return;
    return runOperation("increase-quantity", () => onIncreaseCartLineQuantity(report.cartLine!.cartItemId), copy.increaseError);
  };
  const handleDecrease = () => {
    if (!hasRenderableProduct || !report.cartLine || !onDecreaseCartLineQuantity || !canModifyCart || !report.cartLine.canDecreaseQuantity) return;
    return runOperation("decrease-quantity", () => onDecreaseCartLineQuantity(report.cartLine!.cartItemId), copy.decreaseError);
  };
  const handleOpenReviews = () => runOperation("open-reviews", onOpenReviews, copy.reviewsError);
  const handleRetry = () => runOperation("retry-load", onRetryLoad, copy.retryError);

  let content: ReactNode;
  if (effectiveState === "loading") {
    content = <LoadingExperience disabled={operationPending} onBack={handleBack} />;
  } else if (hasRenderableProduct) {
    content = (
      <ReadyExperience
        activeOperation={activeOperation}
        activeVariantContext={activeVariantContext}
        canModifyCart={canModifyCart}
        canOpenCart={canOpenCart}
        disabled={operationPending}
        initialSelectedImageId={initialSelectedImageId}
        isOffline={isOffline}
        onAddToCart={onAddToCart ? handleAddToCart : undefined}
        onBack={handleBack}
        onDecrease={onDecreaseCartLineQuantity ? handleDecrease : undefined}
        onIncrease={onIncreaseCartLineQuantity ? handleIncrease : undefined}
        onOpenCart={onOpenCart ? handleOpenCart : undefined}
        onOpenReviews={onOpenReviews ? handleOpenReviews : undefined}
        onSelectVariantOption={onSelectVariantOption ? handleSelectVariantOption : undefined}
        report={report}
      />
    );
  } else {
    content = <ErrorExperience activeOperation={activeOperation} disabled={operationPending} onBack={handleBack} onRetry={onRetryLoad ? handleRetry : undefined} />;
  }

  return (
    <>
      {content}
      <ToastRegion footerMode={toastFooterMode} message={toastMessage} />
    </>
  );
}
