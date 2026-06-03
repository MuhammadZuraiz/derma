import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type RoutineStoreCollectionState =
  | "loading"
  | "ready"
  | "limited-availability"
  | "empty"
  | "error";

export type RoutineStoreFilter = "all" | "morning" | "evening";

export type RoutineStorePurchaseMode =
  | "direct-add"
  | "details-required"
  | "unavailable";

export type RoutineStoreOperation =
  | "back"
  | "open-cart"
  | "open-product"
  | "increase-quantity"
  | "decrease-quantity"
  | "retry-load"
  | null;

export interface ActiveCollectionItemContext {
  itemId: string;
  productId: string;
}

export interface RoutineStoreProduct {
  itemId: string;
  productId: string;
  brand: string;
  name: string;
  categoryLabel: string;
  description?: string;
  imageUrl?: string;
  priceLabel?: string;
  availabilityLabel: string;
  isAvailable: boolean;
  purchaseMode: RoutineStorePurchaseMode;
  periods: Array<"morning" | "evening">;
  matchedStepLabels: string[];
  cartQuantity: number;
  canIncreaseQuantity: boolean;
  canDecreaseQuantity: boolean;
}

export function normaliseNonNegativeInteger(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.trunc(value),
  );
}

export function formatCartItemCount(
  value: number,
): string {
  const count =
    normaliseNonNegativeInteger(value);

  return `${count} ${
    count === 1
      ? "item"
      : "items"
  }`;
}

export function isRoutineStoreProductUnavailable(
  product: RoutineStoreProduct,
): boolean {
  return (
    !product.isAvailable ||
    product.purchaseMode ===
      "unavailable"
  );
}

export interface RoutineStoreCartSummary {
  itemCount: number;
  subtotalLabel?: string;
}

export interface RoutineStoreCollectionReport {
  collectionId: string;
  profileName: string;
  generatedAtLabel: string;
  saveLabel: string;
  summary: string;
  products: RoutineStoreProduct[];
  cartSummary: RoutineStoreCartSummary;
}

export interface DermaLensStoreRoutineCollectionScreenProps {
  state?: RoutineStoreCollectionState;
  report?: RoutineStoreCollectionReport | null;
  initialFilter?: RoutineStoreFilter;
  isOffline?: boolean;
  canModifyCart?: boolean;
  canOpenCart?: boolean;
  onBack: () => void | Promise<void>;
  onOpenCart: () => void | Promise<void>;
  onOpenProduct?: (productId: string) => void | Promise<void>;
  onIncreaseCartQuantity?: (productId: string) => void | Promise<void>;
  onDecreaseCartQuantity?: (productId: string) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export const copy = {
  contextLabel: "ROUTINE STORE",
  back: "Back",
  backToRoutine: "Back to routine",
  cart: "Cart",
  viewCart: "View cart",
  openingCart: "Opening cart…",
  reconnectToCart: "Reconnect to view cart",
  cartUnavailable: "Cart unavailable right now",
  cartEmpty: "Your cart is empty",
  profilePrefix: "Matched to",
  savedOnDevice: "Saved on this device",
  loadingHeading: "Loading your routine products…",
  loadingSupporting:
    "We are preparing the DermaLens products matched to your routine.",
  heading: "Products matched to your routine",
  supporting:
    "Browse DermaLens products selected for your routine steps. Purchasing is optional, and your routine remains usable with suitable products you already own.",
  storeBoundary: "All products shown here are sold directly by DermaLens.",
  limitedAvailability:
    "Some matched products are not currently available in your region. Your routine remains usable.",
  allProducts: "All products",
  morning: "Morning",
  evening: "Evening",
  collectionSummaryHeading: "Routine collection",
  productsLabel: "products",
  availableLabel: "available",
  matchedTo: "Matched to",
  periodsLabel: "Routine timing",
  firstPartyProduct: "DermaLens first-party product",
  productImageUnavailable: "Product image unavailable",
  productAvailable: "Available",
  productUnavailable: "Currently unavailable",
  addToCart: "Add to cart",
  addingToCart: "Adding…",
  chooseOptions: "Choose options",
  openingProduct: "Opening product…",
  viewDetails: "View details",
  inCart: "In cart",
  quantityLabel: "Quantity",
  increaseQuantity: "Increase quantity",
  decreaseQuantity: "Decrease quantity",
  updatingQuantity: "Updating…",
  noAllProducts: "No routine-matched products are currently available.",
  noMorningProducts:
    "No matched morning products are available in this collection.",
  noEveningProducts:
    "No matched evening products are available in this collection.",
  storeTrust:
    "Purchasing is optional. You can continue using your routine without adding anything to your cart.",
  emptyHeading: "No routine products are available yet",
  emptySupporting:
    "Return to your routine or try loading this collection again.",
  errorHeading: "We could not display your routine products",
  errorSupporting:
    "Try loading the collection again or return to your routine.",
  retry: "Try loading again",
  retrying: "Retrying…",
  backError: "We could not return to your routine. Please try again.",
  cartError: "We could not open your cart. Please try again.",
  productError: "We could not open this product. Please try again.",
  increaseError:
    "We could not add this product to your cart. Please try again.",
  decreaseError:
    "We could not update this cart quantity. Please try again.",
  retryError: "We could not reload this collection. Please try again.",
} as const;

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
  "--dl-ui": fonts.ui,
  "--dl-display": fonts.display,
  "--dl-metadata": fonts.metadata,
} as CSSProperties;

type IconProps = { className?: string };

function ArrowLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m14.5 6-6 6 6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CartIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 5h2l1.4 8.1a2 2 0 0 0 2 1.7h6.9a2 2 0 0 0 1.9-1.4L20 8H7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="10" cy="19" r="1.3" fill="currentColor" />
      <circle cx="17" cy="19" r="1.3" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 3.5 19 6v5.5c0 4-2.7 7.4-7 9-4.3-1.6-7-5-7-9V6l7-2.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function WarningIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 4 21 20H3L12 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M12 9v5m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function InfoIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.5v5m0-8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function MinusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function Spinner({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={`animate-spin motion-reduce:animate-none ${className}`} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity=".25" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function ToastRegion({ aboveStickyFooter, message }: { aboveStickyFooter: boolean; message: string | null }) {
  const positionClass = aboveStickyFooter
    ? "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_150px)]"
    : "bottom-[max(24px,env(safe-area-inset-bottom))]";

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 z-50 mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${positionClass} ${message ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      data-testid="toast-region"
      role="status"
      style={themeStyle}
    >
      {message ?? ""}
    </div>
  );
}

function displayName(name: string): string {
  return name.trim() || "?";
}

function ProfileInitial({ profileName }: { profileName: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] font-[family-name:var(--dl-display)] text-xl text-[var(--dl-bark)]">
      {displayName(profileName).charAt(0).toUpperCase()}
    </span>
  );
}

function StoreTopBar({ cartCount, cartDisabled = false, disabled, onBack, onOpenCart, showCart }: { cartCount: number; cartDisabled?: boolean; disabled: boolean; onBack: () => void; onOpenCart: () => void; showCart: boolean }) {
  return (
    <div className="grid min-h-12 grid-cols-[44px_1fr_44px] items-center gap-2">
      <button aria-label={copy.back} className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button"><ArrowLeftIcon /></button>
      <p className="text-center font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">{copy.contextLabel}</p>
      {showCart ? (
        <button aria-label={`${copy.cart}: ${formatCartItemCount(cartCount)} in cart`} className={`${focusRing} relative flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled || cartDisabled} onClick={onOpenCart} type="button">
          <CartIcon />
          <span aria-hidden="true" className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--dl-peach-strong)] px-1 text-[10px] font-bold leading-4 text-white">{cartCount}</span>
        </button>
      ) : <span aria-hidden="true" className="block h-11 w-11" />}
    </div>
  );
}

function ProfileCollectionRow({ report }: { report: RoutineStoreCollectionReport }) {
  const saveLabel = report.saveLabel.trim() || copy.savedOnDevice;
  return (
    <div className="mt-3 flex min-w-0 items-center gap-2.5">
      <ProfileInitial profileName={report.profileName} />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-4 text-[var(--dl-text-secondary)]">{copy.profilePrefix}</p>
        <p className="truncate text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{displayName(report.profileName)}</p>
        <p className="truncate text-xs leading-4 text-[var(--dl-text-secondary)]">{report.generatedAtLabel}</p>
      </div>
      <p className="flex max-w-[160px] items-center gap-1 text-right text-xs leading-4 text-[var(--dl-text-secondary)]"><ShieldIcon className="h-4 w-4 shrink-0 text-[var(--dl-peach-strong)]" /><span>{saveLabel}</span></p>
    </div>
  );
}

function StoreBoundaryNote() {
  return <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-parchment)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]"><ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" /><span>{copy.storeBoundary}</span></p>;
}

function LimitedAvailabilityBanner() {
  return <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]" role="status"><WarningIcon className="mt-0.5 h-5 w-5 shrink-0" /><p>{copy.limitedAvailability}</p></div>;
}

const filterOptions: Array<{ id: RoutineStoreFilter; label: string }> = [
  { id: "all", label: copy.allProducts },
  { id: "morning", label: copy.morning },
  { id: "evening", label: copy.evening },
];

function PeriodFilter({ disabled, onSelect, selectedFilter }: { disabled: boolean; onSelect: (filter: RoutineStoreFilter) => void; selectedFilter: RoutineStoreFilter }) {
  return (
    <div aria-label="Routine store filter" className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-[var(--dl-parchment)] p-1.5" role="group">
      {filterOptions.map(({ id, label }) => {
        const selected = id === selectedFilter;
        return <button aria-pressed={selected} className={`${focusRing} min-h-11 rounded-xl px-2 text-xs font-semibold leading-4 transition-colors disabled:cursor-not-allowed motion-reduce:transition-none sm:text-sm sm:leading-5 ${selected ? "bg-[var(--dl-bark)] text-[var(--dl-page)]" : "text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)]"}`} disabled={disabled} key={id} onClick={() => onSelect(id)} type="button">{label}</button>;
      })}
    </div>
  );
}

function CollectionSummaryCard({ report }: { report: RoutineStoreCollectionReport }) {
  const cartItemCount = normaliseNonNegativeInteger(report.cartSummary.itemCount);
  const availableCount = report.products.filter(
    (product) => !isRoutineStoreProductUnavailable(product),
  ).length;

  return (
    <section className="mt-3 rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-4">
      <h2 className="font-[family-name:var(--dl-display)] text-[26px] font-normal leading-8 text-[var(--dl-text-primary)]">{copy.collectionSummaryHeading}</h2>
      <p className="mt-1.5 text-sm leading-5 text-[var(--dl-text-secondary)]">{report.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold leading-4 text-[var(--dl-bark)]">
        <span className="rounded-full bg-[var(--dl-surface)] px-2.5 py-1">{report.products.length} {copy.productsLabel}</span>
        <span className="rounded-full bg-[var(--dl-surface)] px-2.5 py-1">{availableCount} {copy.availableLabel}</span>
        {cartItemCount > 0 ? <span className="rounded-full bg-[var(--dl-surface)] px-2.5 py-1">{formatCartItemCount(cartItemCount)} in cart</span> : null}
      </div>
    </section>
  );
}

function ProductImage({ product }: { product: RoutineStoreProduct }) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => setHasError(false), [product.imageUrl]);
  if (!product.imageUrl || hasError) {
    return <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-xl bg-[var(--dl-parchment)] p-2 text-center text-[11px] leading-4 text-[var(--dl-text-secondary)] max-[374px]:h-[72px] max-[374px]:w-[72px]" data-testid={`product-image-placeholder-${product.itemId}`}>{copy.productImageUnavailable}</div>;
  }
  return <img alt={`${product.brand} ${product.name}`} className="h-[88px] w-[88px] shrink-0 rounded-xl bg-[var(--dl-surface-soft)] object-contain p-1 max-[374px]:h-[72px] max-[374px]:w-[72px]" draggable={false} onError={() => setHasError(true)} src={product.imageUrl} />;
}

function ProductActionButton({ ariaLabel, children, disabled, onClick }: { ariaLabel?: string; children: ReactNode; disabled: boolean; onClick: () => void }) {
  return <button aria-label={ariaLabel} className={`${focusRing} flex min-h-11 items-center justify-center rounded-full border border-[var(--dl-bark)] px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function ProductCard({ activeItemContext, activeOperation, canModifyCart, disabled, onDecreaseQuantity, onIncreaseQuantity, onOpenProduct, product }: { activeItemContext: ActiveCollectionItemContext | null; activeOperation: RoutineStoreOperation; canModifyCart: boolean; disabled: boolean; onDecreaseQuantity?: (itemId: string, productId: string) => void; onIncreaseQuantity?: (itemId: string, productId: string) => void; onOpenProduct?: (itemId: string, productId: string) => void; product: RoutineStoreProduct }) {
  const exactItem = activeItemContext?.itemId === product.itemId && activeItemContext.productId === product.productId;
  const openingProduct = exactItem && activeOperation === "open-product";
  const increasing = exactItem && activeOperation === "increase-quantity";
  const decreasing = exactItem && activeOperation === "decrease-quantity";
  const updatingQuantity = increasing || decreasing;
  const unavailable = isRoutineStoreProductUnavailable(product);
  const availabilityLabel = product.availabilityLabel.trim() || (unavailable ? copy.productUnavailable : copy.productAvailable);
  const quantity = normaliseNonNegativeInteger(product.cartQuantity);
  const mutationBlocked = disabled || !canModifyCart || unavailable;
  const addToCartAccessibleLabel = `${copy.addToCart}: ${product.name}`;
  const addingToCartAccessibleLabel = `${copy.addingToCart} ${product.name}`;
  const chooseOptionsAccessibleLabel = `${copy.chooseOptions}: ${product.name}`;
  const openingProductAccessibleLabel = `${copy.openingProduct} ${product.name}`;
  const viewDetailsAccessibleLabel = `${copy.viewDetails}: ${product.name}`;
  const increaseQuantityAccessibleLabel = `${copy.increaseQuantity}: ${product.name}`;
  const decreaseQuantityAccessibleLabel = `${copy.decreaseQuantity}: ${product.name}`;
  const quantityAccessibleLabel = `${copy.quantityLabel} for ${product.name}: ${quantity}`;

  return (
    <article className="rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4" data-testid={`collection-item-${product.itemId}`}>
      <div className="flex gap-3">
        <ProductImage product={product} />
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-4 text-[var(--dl-text-secondary)]">{product.brand}</p>
          <h2 className="text-base font-semibold leading-[22px] text-[var(--dl-text-primary)]">{product.name}</h2>
          <p className="mt-0.5 text-xs font-semibold leading-4 text-[var(--dl-dusk)]">{product.categoryLabel}</p>
          {product.priceLabel ? <p className="mt-1 text-sm font-semibold leading-5 text-[var(--dl-bark)]">{product.priceLabel}</p> : null}
          <p className={`mt-1 text-xs leading-4 ${unavailable ? "text-[var(--dl-warning-text)]" : "text-[var(--dl-text-secondary)]"}`}>{availabilityLabel}</p>
        </div>
      </div>
      {product.description ? <p className="mt-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{product.description}</p> : null}
      <div className="mt-3 space-y-2">
        <div><p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-[var(--dl-dusk)]">{copy.matchedTo}</p><div className="mt-1 flex flex-wrap gap-1.5">{product.matchedStepLabels.map((label, index) => <span className="rounded-full bg-[var(--dl-surface-soft)] px-2 py-1 text-xs leading-4 text-[var(--dl-bark)]" key={`${label}-${index}`}>{label}</span>)}</div></div>
        <div><p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-[var(--dl-dusk)]">{copy.periodsLabel}</p><div className="mt-1 flex flex-wrap gap-1.5">{product.periods.map((period, index) => <span className="rounded-full bg-[var(--dl-parchment)] px-2 py-1 text-xs leading-4 text-[var(--dl-bark)]" key={`${period}-${index}`}>{period === "morning" ? copy.morning : copy.evening}</span>)}</div></div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs leading-4 text-[var(--dl-text-secondary)]"><ShieldIcon className="h-4 w-4 text-[var(--dl-peach-strong)]" />{copy.firstPartyProduct}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {product.purchaseMode === "direct-add" && quantity === 0 && onIncreaseQuantity ? (
          <ProductActionButton ariaLabel={increasing ? addingToCartAccessibleLabel : addToCartAccessibleLabel} disabled={mutationBlocked || !product.canIncreaseQuantity} onClick={() => onIncreaseQuantity(product.itemId, product.productId)}>{increasing ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" />{copy.addingToCart}</span> : copy.addToCart}</ProductActionButton>
        ) : null}
        {product.purchaseMode === "direct-add" && quantity > 0 ? (
          <div className="flex flex-wrap items-center gap-2" data-testid={`quantity-controls-${product.itemId}`}>
            <span className="text-sm font-semibold leading-5 text-[var(--dl-bark)]">{copy.inCart}</span>
            <div aria-label={`${product.name} quantity controls`} className="flex items-center gap-1 rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-1" role="group">
              <button aria-label={decreaseQuantityAccessibleLabel} className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={mutationBlocked || !product.canDecreaseQuantity || !onDecreaseQuantity} onClick={() => onDecreaseQuantity?.(product.itemId, product.productId)} type="button"><MinusIcon /></button>
              <span aria-label={quantityAccessibleLabel} aria-live="polite" className="min-w-8 text-center text-sm font-semibold text-[var(--dl-text-primary)]">{quantity}</span>
              <button aria-label={increaseQuantityAccessibleLabel} className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={mutationBlocked || !product.canIncreaseQuantity || !onIncreaseQuantity} onClick={() => onIncreaseQuantity?.(product.itemId, product.productId)} type="button"><PlusIcon /></button>
            </div>
            {updatingQuantity ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold leading-4 text-[var(--dl-bark)]"><Spinner className="h-4 w-4" />{copy.updatingQuantity}</span> : null}
          </div>
        ) : null}
        {product.purchaseMode === "details-required" && product.isAvailable && onOpenProduct ? <ProductActionButton ariaLabel={openingProduct ? openingProductAccessibleLabel : chooseOptionsAccessibleLabel} disabled={disabled} onClick={() => onOpenProduct(product.itemId, product.productId)}>{openingProduct ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" />{copy.openingProduct}</span> : copy.chooseOptions}</ProductActionButton> : null}
        {onOpenProduct && (product.purchaseMode === "direct-add" || unavailable) ? <button aria-label={openingProduct ? openingProductAccessibleLabel : viewDetailsAccessibleLabel} className={`${focusRing} min-h-11 rounded-sm px-1 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline underline-offset-4 disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={() => onOpenProduct(product.itemId, product.productId)} type="button">{openingProduct ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" />{copy.openingProduct}</span> : copy.viewDetails}</button> : null}
      </div>
    </article>
  );
}

function EmptyFilterState({ filter }: { filter: RoutineStoreFilter }) {
  const text = filter === "morning" ? copy.noMorningProducts : filter === "evening" ? copy.noEveningProducts : copy.noAllProducts;
  return <p className="rounded-xl bg-[var(--dl-surface-soft)] p-4 text-sm leading-5 text-[var(--dl-text-secondary)]">{text}</p>;
}

function StoreTrustNote() {
  return <p className="mt-4 flex items-start gap-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]"><ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" /><span>{copy.storeTrust}</span></p>;
}

function getCartButtonLabel({ activeOperation, canOpenCart, isOffline }: { activeOperation: RoutineStoreOperation; canOpenCart: boolean; isOffline: boolean }): string {
  if (activeOperation === "open-cart") return copy.openingCart;
  if (!canOpenCart) return isOffline ? copy.reconnectToCart : copy.cartUnavailable;
  return copy.viewCart;
}

function CartFooter({ activeOperation, canOpenCart, disabled, isOffline, onBack, onOpenCart, report, viewCartLabelOverride }: { activeOperation: RoutineStoreOperation; canOpenCart: boolean; disabled: boolean; isOffline: boolean; onBack: () => void; onOpenCart: () => void; report: RoutineStoreCollectionReport | null; viewCartLabelOverride?: string }) {
  const itemCount = normaliseNonNegativeInteger(report?.cartSummary.itemCount ?? 0);
  const subtotal = report?.cartSummary.subtotalLabel?.trim();
  const opening = activeOperation === "open-cart";
  return (
    <footer className="sticky bottom-0 z-20 -mx-6 mt-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-sm max-[374px]:-mx-5 max-[374px]:px-5">
      <p className="mb-2 text-center text-xs font-semibold leading-4 text-[var(--dl-text-secondary)]">{itemCount > 0 ? `${formatCartItemCount(itemCount)}${subtotal ? ` · ${subtotal}` : ""}` : copy.cartEmpty}</p>
      <button className={`${focusRing} flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`} disabled={disabled || itemCount === 0 || !canOpenCart} onClick={onOpenCart} type="button">{opening ? <Spinner className="mr-2 h-4 w-4" /> : null}{viewCartLabelOverride ?? getCartButtonLabel({ activeOperation, canOpenCart, isOffline })}</button>
      <button className={`${focusRing} mt-1.5 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button">{copy.backToRoutine}</button>
    </footer>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--dl-parchment)] motion-reduce:animate-none ${className}`} />;
}

function LoadingExperience({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
  return <><StoreTopBar cartCount={0} disabled={disabled} onBack={onBack} onOpenCart={() => undefined} showCart={false} /><div aria-live="polite" role="status"><div className="mt-3 flex gap-2.5"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-36" /></div></div><h1 className="mt-5 font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.loadingHeading}</h1><p className="mt-2 max-w-[420px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.loadingSupporting}</p></div><Skeleton className="mt-4 h-14 w-full" /><div className="mt-3 space-y-3"><Skeleton className="h-56 w-full" /><Skeleton className="h-56 w-full" /><Skeleton className="h-56 w-full" /></div><CartFooter activeOperation={null} canOpenCart={false} disabled isOffline={false} onBack={onBack} onOpenCart={() => undefined} report={null} viewCartLabelOverride={copy.viewCart} /></>;
}

function RecoveryExperience({ activeOperation, disabled, kind, onBack, onRetry }: { activeOperation: RoutineStoreOperation; disabled: boolean; kind: "empty" | "error"; onBack: () => void; onRetry?: () => void }) {
  const error = kind === "error";
  const retrying = activeOperation === "retry-load";
  return <><StoreTopBar cartCount={0} disabled={disabled} onBack={onBack} onOpenCart={() => undefined} showCart={false} /><div role={error ? "alert" : undefined}><div className="mx-auto mt-12 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-peach-strong)]">{error ? <WarningIcon className="h-9 w-9" /> : <InfoIcon className="h-9 w-9" />}</div><h1 className="mt-5 text-center font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{error ? copy.errorHeading : copy.emptyHeading}</h1><p className="mx-auto mt-2 max-w-[420px] text-center text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{error ? copy.errorSupporting : copy.emptySupporting}</p></div><div className="mx-auto mt-6 max-w-[440px]">{onRetry ? <button className={`${focusRing} flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`} disabled={disabled} onClick={onRetry} type="button">{retrying ? <Spinner className="mr-2 h-4 w-4" /> : null}{retrying ? copy.retrying : copy.retry}</button> : null}<button className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button">{copy.backToRoutine}</button></div></>;
}

function ReadyExperience({ activeItemContext, activeOperation, canModifyCart, canOpenCart, disabled, effectiveState, isOffline, onBack, onDecreaseQuantity, onIncreaseQuantity, onOpenCart, onOpenProduct, report, selectedFilter, setSelectedFilter }: { activeItemContext: ActiveCollectionItemContext | null; activeOperation: RoutineStoreOperation; canModifyCart: boolean; canOpenCart: boolean; disabled: boolean; effectiveState: "ready" | "limited-availability"; isOffline: boolean; onBack: () => void; onDecreaseQuantity?: (itemId: string, productId: string) => void; onIncreaseQuantity?: (itemId: string, productId: string) => void; onOpenCart: () => void; onOpenProduct?: (itemId: string, productId: string) => void; report: RoutineStoreCollectionReport; selectedFilter: RoutineStoreFilter; setSelectedFilter: (filter: RoutineStoreFilter) => void }) {
  const cartItemCount = normaliseNonNegativeInteger(report.cartSummary.itemCount);
  const visibleProducts = selectedFilter === "all" ? report.products : report.products.filter((product) => product.periods.includes(selectedFilter));
  return <div className="lg:grid lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] lg:gap-12"><div><StoreTopBar cartCount={cartItemCount} cartDisabled={!canOpenCart} disabled={disabled} onBack={onBack} onOpenCart={onOpenCart} showCart={cartItemCount > 0} /><ProfileCollectionRow report={report} /><h1 className="mt-[18px] font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.heading}</h1><p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.supporting}</p><StoreBoundaryNote />{effectiveState === "limited-availability" ? <LimitedAvailabilityBanner /> : null}<PeriodFilter disabled={disabled} onSelect={setSelectedFilter} selectedFilter={selectedFilter} /><CollectionSummaryCard report={report} /><div className="hidden lg:block"><StoreTrustNote /></div></div><div className="lg:pt-3"><div className="mt-4 space-y-3 lg:mt-0" data-testid="product-collection">{visibleProducts.length > 0 ? visibleProducts.map((product) => <ProductCard activeItemContext={activeItemContext} activeOperation={activeOperation} canModifyCart={canModifyCart} disabled={disabled} key={product.itemId} onDecreaseQuantity={onDecreaseQuantity} onIncreaseQuantity={onIncreaseQuantity} onOpenProduct={onOpenProduct} product={product} />) : <EmptyFilterState filter={selectedFilter} />}</div><div className="lg:hidden"><StoreTrustNote /></div><CartFooter activeOperation={activeOperation} canOpenCart={canOpenCart} disabled={disabled} isOffline={isOffline} onBack={onBack} onOpenCart={onOpenCart} report={report} /></div></div>;
}

export default function DermaLensStoreRoutineCollectionScreen({ state = "loading", report = null, initialFilter = "all", isOffline = false, canModifyCart = true, canOpenCart = true, onBack, onOpenCart, onOpenProduct, onIncreaseCartQuantity, onDecreaseCartQuantity, onRetryLoad }: DermaLensStoreRoutineCollectionScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<RoutineStoreFilter>(initialFilter);
  const [activeOperation, setActiveOperation] = useState<RoutineStoreOperation>(null);
  const [activeItemContext, setActiveItemContext] = useState<ActiveCollectionItemContext | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef<RoutineStoreOperation>(null);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  useEffect(() => setSelectedFilter(initialFilter), [initialFilter]);
  useEffect(() => { if (!toastMessage) return; const id = window.setTimeout(() => setToastMessage(null), 5000); return () => window.clearTimeout(id); }, [toastMessage]);

  const effectiveState: RoutineStoreCollectionState = (state === "ready" || state === "limited-availability") && report === null ? "error" : state;
  const hasRenderableCollection = (effectiveState === "ready" || effectiveState === "limited-availability") && report !== null;
  const hasStickyFooter = effectiveState === "loading" || hasRenderableCollection;
  const operationPending = activeOperation !== null;

  const runOperation = useCallback(async (operation: Exclude<RoutineStoreOperation, null>, callback: () => void | Promise<void>, errorMessage: string, context: ActiveCollectionItemContext | null = null) => {
    if (inFlightRef.current !== null) return;
    inFlightRef.current = operation;
    setActiveOperation(operation);
    setActiveItemContext(context);
    setToastMessage(null);
    try { await callback(); }
    catch { if (mountedRef.current) setToastMessage(errorMessage); }
    finally { inFlightRef.current = null; if (mountedRef.current) { setActiveOperation(null); setActiveItemContext(null); } }
  }, []);

  const handleBack = useCallback(() => { if (operationPending || inFlightRef.current !== null) return; void runOperation("back", onBack, copy.backError); }, [onBack, operationPending, runOperation]);
  const handleOpenCart = useCallback(() => { if (operationPending || inFlightRef.current !== null || !canOpenCart || !report || normaliseNonNegativeInteger(report.cartSummary.itemCount) === 0) return; void runOperation("open-cart", onOpenCart, copy.cartError); }, [canOpenCart, onOpenCart, operationPending, report, runOperation]);
  const handleOpenProduct = useCallback((itemId: string, productId: string) => { if (!onOpenProduct || operationPending || inFlightRef.current !== null) return; void runOperation("open-product", () => onOpenProduct(productId), copy.productError, { itemId, productId }); }, [onOpenProduct, operationPending, runOperation]);
  const handleIncrease = useCallback((itemId: string, productId: string) => { if (!onIncreaseCartQuantity || operationPending || inFlightRef.current !== null || !canModifyCart) return; void runOperation("increase-quantity", () => onIncreaseCartQuantity(productId), copy.increaseError, { itemId, productId }); }, [canModifyCart, onIncreaseCartQuantity, operationPending, runOperation]);
  const handleDecrease = useCallback((itemId: string, productId: string) => { if (!onDecreaseCartQuantity || operationPending || inFlightRef.current !== null || !canModifyCart) return; void runOperation("decrease-quantity", () => onDecreaseCartQuantity(productId), copy.decreaseError, { itemId, productId }); }, [canModifyCart, onDecreaseCartQuantity, operationPending, runOperation]);
  const handleRetry = useCallback(() => { if (!onRetryLoad || operationPending || inFlightRef.current !== null) return; void runOperation("retry-load", onRetryLoad, copy.retryError); }, [onRetryLoad, operationPending, runOperation]);

  return (
    <main className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]" style={themeStyle}>
      <div className="mx-auto min-h-[100dvh] max-w-[760px] px-6 pb-6 pt-[max(20px,env(safe-area-inset-top))] max-[374px]:px-5 lg:max-w-[1180px]">
        {effectiveState === "loading" ? <LoadingExperience disabled={operationPending} onBack={handleBack} /> : null}
        {effectiveState === "empty" ? <RecoveryExperience activeOperation={activeOperation} disabled={operationPending} kind="empty" onBack={handleBack} onRetry={onRetryLoad ? handleRetry : undefined} /> : null}
        {effectiveState === "error" ? <RecoveryExperience activeOperation={activeOperation} disabled={operationPending} kind="error" onBack={handleBack} onRetry={onRetryLoad ? handleRetry : undefined} /> : null}
        {hasRenderableCollection && report ? <ReadyExperience activeItemContext={activeItemContext} activeOperation={activeOperation} canModifyCart={canModifyCart} canOpenCart={canOpenCart} disabled={operationPending} effectiveState={effectiveState as "ready" | "limited-availability"} isOffline={isOffline} onBack={handleBack} onDecreaseQuantity={onDecreaseCartQuantity ? handleDecrease : undefined} onIncreaseQuantity={onIncreaseCartQuantity ? handleIncrease : undefined} onOpenCart={handleOpenCart} onOpenProduct={onOpenProduct ? handleOpenProduct : undefined} report={report} selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} /> : null}
      </div>
      <ToastRegion aboveStickyFooter={hasStickyFooter} message={toastMessage} />
    </main>
  );
}
