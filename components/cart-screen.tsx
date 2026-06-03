import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type CartScreenState =
  | "loading"
  | "ready"
  | "limited-availability"
  | "empty"
  | "error";

export type CartOperation =
  | "back"
  | "checkout"
  | "open-product"
  | "increase-quantity"
  | "decrease-quantity"
  | "remove-item"
  | "retry-load"
  | null;

export interface ActiveCartItemContext {
  cartItemId: string;
  productId: string;
}

export type CartItemAvailabilityState =
  | "available"
  | "attention"
  | "unavailable";

export interface CartItem {
  cartItemId: string;
  productId: string;
  brand: string;
  name: string;
  categoryLabel: string;
  imageUrl?: string;
  optionLabels: string[];
  unitPriceLabel?: string;
  lineTotalLabel?: string;
  availabilityState: CartItemAvailabilityState;
  availabilityLabel: string;
  quantity: number;
  canIncreaseQuantity: boolean;
  canDecreaseQuantity: boolean;
  canRemove: boolean;
}

export interface CartSummary {
  itemCount: number;
  subtotalLabel?: string;
  shippingLabel?: string;
  taxLabel?: string;
  totalLabel?: string;
  checkoutNotice?: string;
}

export interface CartReport {
  cartId: string;
  profileName?: string;
  sourceLabel?: string;
  items: CartItem[];
  summary: CartSummary;
}

export interface CartScreenProps {
  state?: CartScreenState;
  report?: CartReport | null;
  isOffline?: boolean;
  canModifyCart?: boolean;
  canProceedToCheckout?: boolean;
  onBack: () => void | Promise<void>;
  onProceedToCheckout: () => void | Promise<void>;
  onOpenProduct?: (productId: string) => void | Promise<void>;
  onIncreaseQuantity?: (cartItemId: string) => void | Promise<void>;
  onDecreaseQuantity?: (cartItemId: string) => void | Promise<void>;
  onRemoveItem?: (cartItemId: string) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export function normaliseNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

export function formatCartItemCount(value: number): string {
  const count = normaliseNonNegativeInteger(value);
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function isCartItemUnavailable(item: CartItem): boolean {
  return item.availabilityState === "unavailable";
}

export const copy = {
  contextLabel: "YOUR CART",
  back: "Back",
  continueShopping: "Continue shopping",
  heading: "Review your cart",
  supporting:
    "Confirm your selected DermaLens products before continuing to checkout.",
  firstPartyBoundary:
    "All items in this cart are sold directly by DermaLens.",
  limitedAvailability:
    "Some items need your attention before checkout. Review the highlighted products below.",
  loadingHeading: "Loading your cart…",
  loadingSupporting:
    "We are preparing your selected DermaLens products.",
  cartFor: "Routine cart for",
  productImageUnavailable: "Product image unavailable",
  productAvailable: "Available",
  productUnavailable: "Currently unavailable",
  selectedOptions: "Selected options",
  quantityLabel: "Quantity",
  increaseQuantity: "Increase quantity",
  decreaseQuantity: "Decrease quantity",
  updatingQuantity: "Updating…",
  viewDetails: "View details",
  openingProduct: "Opening product…",
  removeItem: "Remove item",
  removingItem: "Removing…",
  quantityNeedsAttention: "Review this item before checkout.",
  orderSummary: "Order summary",
  subtotal: "Subtotal",
  shipping: "Shipping",
  tax: "Tax",
  total: "Total",
  itemCount: "Items",
  purchaseOptional:
    "Purchasing is optional. You can continue following your routine with suitable products you already own.",
  checkout: "Continue to checkout",
  openingCheckout: "Opening checkout…",
  reconnectToCheckout: "Reconnect to checkout",
  checkoutUnavailable: "Checkout unavailable right now",
  reviewOrder: "Review your order",
  emptyHeading: "Your cart is empty",
  emptySupporting:
    "Browse your routine products and add only the items you want.",
  errorHeading: "We could not display your cart",
  errorSupporting:
    "Try loading your cart again or return to the routine store.",
  retry: "Try loading again",
  retrying: "Retrying…",
  backError:
    "We could not return to the routine store. Please try again.",
  checkoutError: "We could not open checkout. Please try again.",
  productError: "We could not open this product. Please try again.",
  increaseError:
    "We could not update this item quantity. Please try again.",
  decreaseError:
    "We could not update this item quantity. Please try again.",
  removeError: "We could not remove this item. Please try again.",
  retryError: "We could not reload your cart. Please try again.",
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

function TrashIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 7h14m-8-3h2m-6 3 .7 12h8.6L17 7m-7 3v6m4-6v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
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

function CartTopBar({ count, disabled, onBack }: { count: number; disabled: boolean; onBack: () => void }) {
  const safeCount = normaliseNonNegativeInteger(count);
  return (
    <div className="grid min-h-12 grid-cols-[44px_1fr_44px] items-center gap-2">
      <button aria-label={copy.back} className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button">
        <ArrowLeftIcon />
      </button>
      <p className="text-center font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">{copy.contextLabel}</p>
      {safeCount > 0 ? (
        <span aria-label={`${formatCartItemCount(safeCount)} in cart`} className="flex h-8 min-w-8 items-center justify-center justify-self-end rounded-full bg-[var(--dl-peach-strong)] px-2 text-xs font-bold leading-4 text-white">
          {safeCount}
        </span>
      ) : <span aria-hidden="true" className="block h-11 w-11" />}
    </div>
  );
}

function displayName(name: string | undefined): string {
  return name?.trim() || "?";
}

function CartContextRow({ report }: { report: CartReport }) {
  const profileName = displayName(report.profileName);
  return (
    <div className="mt-3 flex min-w-0 items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] font-[family-name:var(--dl-display)] text-xl text-[var(--dl-bark)]">{profileName.charAt(0).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-4 text-[var(--dl-text-secondary)]">{copy.cartFor}</p>
        <p className="truncate text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{profileName}</p>
        {report.sourceLabel ? <p className="truncate text-xs leading-4 text-[var(--dl-text-secondary)]">{report.sourceLabel}</p> : null}
      </div>
    </div>
  );
}

function PageHeading() {
  return (
    <>
      <h1 className="mt-[18px] font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.heading}</h1>
      <p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.supporting}</p>
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-parchment)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
        <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
        <span>{copy.firstPartyBoundary}</span>
      </p>
    </>
  );
}

function LimitedAvailabilityBanner() {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]" role="status">
      <WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{copy.limitedAvailability}</p>
    </div>
  );
}

function ProductImage({ item }: { item: CartItem }) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => setHasError(false), [item.imageUrl]);

  if (!item.imageUrl || hasError) {
    return (
      <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-xl bg-[var(--dl-parchment)] p-2 text-center text-[11px] leading-4 text-[var(--dl-text-secondary)] max-[374px]:h-[72px] max-[374px]:w-[72px]" data-testid={`cart-image-placeholder-${item.cartItemId}`}>
        {copy.productImageUnavailable}
      </div>
    );
  }

  return (
    <img
      alt={`${item.brand} ${item.name}`}
      className="h-[88px] w-[88px] shrink-0 rounded-xl bg-[var(--dl-surface-soft)] object-contain p-1 max-[374px]:h-[72px] max-[374px]:w-[72px]"
      draggable={false}
      onError={() => setHasError(true)}
      src={item.imageUrl}
    />
  );
}

function CartItemCard({ activeItemContext, activeOperation, canModifyCart, disabled, item, onDecrease, onIncrease, onOpenProduct, onRemove }: {
  activeItemContext: ActiveCartItemContext | null;
  activeOperation: CartOperation;
  canModifyCart: boolean;
  disabled: boolean;
  item: CartItem;
  onDecrease?: (cartItemId: string, productId: string) => void;
  onIncrease?: (cartItemId: string, productId: string) => void;
  onOpenProduct?: (cartItemId: string, productId: string) => void;
  onRemove?: (cartItemId: string, productId: string) => void;
}) {
  const quantity = normaliseNonNegativeInteger(item.quantity);
  const unavailable = isCartItemUnavailable(item);
  const availabilityLabel = item.availabilityLabel.trim() || (unavailable ? copy.productUnavailable : copy.productAvailable);
  const exactItem = activeItemContext?.cartItemId === item.cartItemId && activeItemContext.productId === item.productId;
  const updating = exactItem && (activeOperation === "increase-quantity" || activeOperation === "decrease-quantity");
  const openingProduct = exactItem && activeOperation === "open-product";
  const removing = exactItem && activeOperation === "remove-item";
  const warningAvailability = unavailable || item.availabilityState === "attention";

  return (
    <article className="rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4" data-testid={`cart-item-${item.cartItemId}`}>
      <div className="flex items-start gap-3">
        <ProductImage item={item} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--dl-peach-strong)]">{item.brand}</p>
          <h2 className="mt-0.5 text-[16px] font-semibold leading-[22px] text-[var(--dl-text-primary)]">{item.name}</h2>
          <p className="mt-0.5 text-xs leading-4 text-[var(--dl-text-secondary)]">{item.categoryLabel}</p>
          {item.unitPriceLabel ? <p className="mt-1 text-sm font-semibold leading-5 text-[var(--dl-bark)]">{item.unitPriceLabel}</p> : null}
          {item.lineTotalLabel ? <p className="mt-0.5 text-xs leading-4 text-[var(--dl-text-secondary)]">{item.lineTotalLabel}</p> : null}
          <p className={`mt-1.5 text-xs font-semibold leading-4 ${warningAvailability ? "text-[var(--dl-warning-text)]" : "text-[var(--dl-bark)]"}`}>{availabilityLabel}</p>
        </div>
      </div>

      {item.optionLabels.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold leading-4 text-[var(--dl-text-secondary)]">{copy.selectedOptions}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.optionLabels.map((option, index) => <span className="rounded-full bg-[var(--dl-parchment)] px-2.5 py-1 text-xs leading-4 text-[var(--dl-bark)]" key={`${item.cartItemId}-option-${index}`}>{option}</span>)}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dl-border-subtle)] pt-3">
        <div aria-label={`${item.name} quantity controls`} className="flex items-center gap-2" role="group">
          <button aria-label={`${copy.decreaseQuantity}: ${item.name}`} className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full border border-[var(--dl-border-subtle)] text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled || !canModifyCart || !onDecrease || !item.canDecreaseQuantity || quantity === 0} onClick={() => onDecrease?.(item.cartItemId, item.productId)} type="button"><MinusIcon /></button>
          <span aria-label={`${copy.quantityLabel} for ${item.name}: ${quantity}`} aria-live="polite" className="min-w-8 text-center text-sm font-semibold text-[var(--dl-text-primary)]">{quantity}</span>
          <button aria-label={`${copy.increaseQuantity}: ${item.name}`} className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full border border-[var(--dl-border-subtle)] text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled || !canModifyCart || !onIncrease || unavailable || !item.canIncreaseQuantity} onClick={() => onIncrease?.(item.cartItemId, item.productId)} type="button"><PlusIcon /></button>
        </div>
        {updating ? <p className="flex items-center gap-1.5 text-sm font-semibold leading-5 text-[var(--dl-bark)]"><Spinner className="h-4 w-4" />{copy.updatingQuantity}</p> : null}
      </div>

      {quantity === 0 ? <p className="mt-2 rounded-lg bg-[var(--dl-warning-surface)] px-3 py-2 text-xs leading-4 text-[var(--dl-warning-text)]">{copy.quantityNeedsAttention}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {onOpenProduct ? (
          <button aria-label={openingProduct ? `${copy.openingProduct} ${item.name}` : `${copy.viewDetails}: ${item.name}`} className={`${focusRing} flex min-h-11 items-center justify-center rounded-full border border-[var(--dl-bark)] px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={() => onOpenProduct(item.cartItemId, item.productId)} type="button">
            {openingProduct ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {openingProduct ? copy.openingProduct : copy.viewDetails}
          </button>
        ) : null}
        {onRemove && item.canRemove ? (
          <button aria-label={removing ? `${copy.removingItem} ${item.name}` : `${copy.removeItem}: ${item.name}`} className={`${focusRing} flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold leading-5 text-[var(--dl-error-text)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled || !canModifyCart} onClick={() => onRemove(item.cartItemId, item.productId)} type="button">
            {removing ? <Spinner className="mr-2 h-4 w-4" /> : <TrashIcon className="mr-2 h-4 w-4" />}
            {removing ? copy.removingItem : copy.removeItem}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-[var(--dl-border-subtle)] py-2 first:border-t-0 first:pt-0 last:pb-0">
      <dt className="text-sm leading-5 text-[var(--dl-text-secondary)]">{label}</dt>
      <dd className="text-right text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{value}</dd>
    </div>
  );
}

function OrderSummaryCard({ report }: { report: CartReport }) {
  const count = normaliseNonNegativeInteger(report.summary.itemCount);
  return (
    <section className="mt-4 rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-4">
      <h2 className="font-[family-name:var(--dl-display)] text-[26px] leading-8 text-[var(--dl-text-primary)]">{copy.orderSummary}</h2>
      <dl aria-live="polite" className="mt-3" data-testid="order-summary-values">
        <SummaryRow label={copy.itemCount} value={formatCartItemCount(count)} />
        {report.summary.subtotalLabel ? <SummaryRow label={copy.subtotal} value={report.summary.subtotalLabel} /> : null}
        {report.summary.shippingLabel ? <SummaryRow label={copy.shipping} value={report.summary.shippingLabel} /> : null}
        {report.summary.taxLabel ? <SummaryRow label={copy.tax} value={report.summary.taxLabel} /> : null}
        {report.summary.totalLabel ? <SummaryRow label={copy.total} value={report.summary.totalLabel} /> : null}
      </dl>
      {report.summary.checkoutNotice ? <p className="mt-3 rounded-xl bg-[var(--dl-surface)] px-3 py-2 text-xs leading-4 text-[var(--dl-text-secondary)]">{report.summary.checkoutNotice}</p> : null}
    </section>
  );
}

function PurchaseOptionalNote() {
  return (
    <p className="mt-3 flex items-start gap-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <span>{copy.purchaseOptional}</span>
    </p>
  );
}

function getCheckoutLabel({ activeOperation, canProceedToCheckout, isOffline }: { activeOperation: CartOperation; canProceedToCheckout: boolean; isOffline: boolean }): string {
  if (activeOperation === "checkout") return copy.openingCheckout;
  if (!canProceedToCheckout) return isOffline ? copy.reconnectToCheckout : copy.checkoutUnavailable;
  return copy.checkout;
}

function CartFooter({ activeOperation, canProceedToCheckout, disabled, isOffline, itemCount, onBack, onCheckout, checkoutLabelOverride, totalLabelOverride }: {
  activeOperation: CartOperation;
  canProceedToCheckout: boolean;
  disabled: boolean;
  isOffline: boolean;
  itemCount: number;
  onBack: () => void;
  onCheckout: () => void;
  checkoutLabelOverride?: string;
  totalLabelOverride?: string;
}) {
  const safeCount = normaliseNonNegativeInteger(itemCount);
  const checkoutDisabled = disabled || safeCount === 0 || !canProceedToCheckout;
  return (
    <footer className="sticky bottom-0 z-20 -mx-6 mt-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[8px] max-[374px]:-mx-5 max-[374px]:px-5">
      <p className="text-center text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{totalLabelOverride ?? copy.reviewOrder}</p>
      <button className={`${focusRing} mt-2 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`} disabled={checkoutDisabled} onClick={onCheckout} type="button">
        {activeOperation === "checkout" ? <Spinner className="mr-2 h-4 w-4" /> : null}
        {checkoutLabelOverride ?? getCheckoutLabel({ activeOperation, canProceedToCheckout, isOffline })}
      </button>
      <button className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button">{copy.continueShopping}</button>
    </footer>
  );
}

function LoadingExperience({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
  return (
    <>
      <CartTopBar count={0} disabled={disabled} onBack={onBack} />
      <div aria-live="polite" role="status">
        <h1 className="mt-8 font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.loadingHeading}</h1>
        <p className="mt-2 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.loadingSupporting}</p>
      </div>
      <div className="mt-5 space-y-3" aria-hidden="true">
        {[0, 1, 2].map((value) => <div className="h-[178px] rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)]" key={value} />)}
        <div className="h-[156px] rounded-[18px] bg-[var(--dl-blush)]" />
      </div>
      <CartFooter activeOperation={null} canProceedToCheckout={false} checkoutLabelOverride={copy.checkout} disabled isOffline={false} itemCount={0} onBack={onBack} onCheckout={() => undefined} totalLabelOverride={copy.reviewOrder} />
    </>
  );
}

function RecoveryExperience({ activeOperation, disabled, kind, onBack, onRetry }: { activeOperation: CartOperation; disabled: boolean; kind: "empty" | "error"; onBack: () => void; onRetry?: () => void }) {
  const error = kind === "error";
  const retrying = activeOperation === "retry-load";
  return (
    <>
      <CartTopBar count={0} disabled={disabled} onBack={onBack} />
      <div role={error ? "alert" : undefined}>
        <div className="mx-auto mt-12 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-peach-strong)]">{error ? <WarningIcon className="h-9 w-9" /> : <InfoIcon className="h-9 w-9" />}</div>
        <h1 className="mt-5 text-center font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{error ? copy.errorHeading : copy.emptyHeading}</h1>
        <p className="mx-auto mt-2 max-w-[420px] text-center text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{error ? copy.errorSupporting : copy.emptySupporting}</p>
      </div>
      <div className="mx-auto mt-6 max-w-[440px]">
        {onRetry ? <button className={`${focusRing} flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`} disabled={disabled} onClick={onRetry} type="button">{retrying ? <Spinner className="mr-2 h-4 w-4" /> : null}{retrying ? copy.retrying : copy.retry}</button> : null}
        <button className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button">{copy.continueShopping}</button>
      </div>
    </>
  );
}

function ReadyExperience({ activeItemContext, activeOperation, canModifyCart, canProceedToCheckout, disabled, effectiveState, isOffline, onBack, onCheckout, onDecrease, onIncrease, onOpenProduct, onRemove, report }: {
  activeItemContext: ActiveCartItemContext | null;
  activeOperation: CartOperation;
  canModifyCart: boolean;
  canProceedToCheckout: boolean;
  disabled: boolean;
  effectiveState: "ready" | "limited-availability";
  isOffline: boolean;
  onBack: () => void;
  onCheckout: () => void;
  onDecrease?: (cartItemId: string, productId: string) => void;
  onIncrease?: (cartItemId: string, productId: string) => void;
  onOpenProduct?: (cartItemId: string, productId: string) => void;
  onRemove?: (cartItemId: string, productId: string) => void;
  report: CartReport;
}) {
  const count = normaliseNonNegativeInteger(report.summary.itemCount);
  const footerTotal = report.summary.totalLabel || report.summary.subtotalLabel || copy.reviewOrder;
  return (
    <>
      <CartTopBar count={count} disabled={disabled} onBack={onBack} />
      <CartContextRow report={report} />
      <div className="lg:grid lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] lg:gap-x-12">
        <div className="lg:col-start-2 lg:row-start-1">
          <PageHeading />
          {effectiveState === "limited-availability" ? <LimitedAvailabilityBanner /> : null}
        </div>
        <div className="mt-4 space-y-3 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:mt-[18px]" data-testid="cart-item-list">
          {report.items.map((item) => <CartItemCard activeItemContext={activeItemContext} activeOperation={activeOperation} canModifyCart={canModifyCart} disabled={disabled} item={item} key={item.cartItemId} onDecrease={onDecrease} onIncrease={onIncrease} onOpenProduct={onOpenProduct} onRemove={onRemove} />)}
        </div>
        <div className="lg:col-start-2 lg:row-start-2">
          <OrderSummaryCard report={report} />
          <PurchaseOptionalNote />
          <CartFooter activeOperation={activeOperation} canProceedToCheckout={canProceedToCheckout} disabled={disabled} isOffline={isOffline} itemCount={count} onBack={onBack} onCheckout={onCheckout} totalLabelOverride={footerTotal} />
        </div>
      </div>
    </>
  );
}

export default function CartScreen({
  state = "loading",
  report = null,
  isOffline = false,
  canModifyCart = true,
  canProceedToCheckout = true,
  onBack,
  onProceedToCheckout,
  onOpenProduct,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onRetryLoad,
}: CartScreenProps) {
  const [activeOperation, setActiveOperation] = useState<CartOperation>(null);
  const [activeItemContext, setActiveItemContext] = useState<ActiveCartItemContext | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef<CartOperation>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  const effectiveState: CartScreenState =
    (state === "ready" || state === "limited-availability") && report === null
      ? "error"
      : state;

  const hasRenderableCart =
    (effectiveState === "ready" || effectiveState === "limited-availability") && report !== null;

  const hasStickyFooter = effectiveState === "loading" || hasRenderableCart;
  const operationPending = activeOperation !== null;

  const runOperation = useCallback(async (
    operation: Exclude<CartOperation, null>,
    callback: () => void | Promise<void>,
    errorMessage: string,
    context: ActiveCartItemContext | null = null,
  ) => {
    if (inFlightRef.current !== null) return;
    inFlightRef.current = operation;
    setActiveOperation(operation);
    setActiveItemContext(context);
    setToastMessage(null);
    try {
      await callback();
    } catch {
      if (mountedRef.current) setToastMessage(errorMessage);
    } finally {
      inFlightRef.current = null;
      if (mountedRef.current) {
        setActiveOperation(null);
        setActiveItemContext(null);
      }
    }
  }, []);

  const handleBack = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) return;
    void runOperation("back", onBack, copy.backError);
  }, [onBack, operationPending, runOperation]);

  const handleCheckout = useCallback(() => {
    const count = report ? normaliseNonNegativeInteger(report.summary.itemCount) : 0;
    if (operationPending || inFlightRef.current !== null || !canProceedToCheckout || count === 0) return;
    void runOperation("checkout", onProceedToCheckout, copy.checkoutError);
  }, [canProceedToCheckout, onProceedToCheckout, operationPending, report, runOperation]);

  const handleOpenProduct = useCallback((cartItemId: string, productId: string) => {
    if (!onOpenProduct || operationPending || inFlightRef.current !== null) return;
    void runOperation("open-product", () => onOpenProduct(productId), copy.productError, { cartItemId, productId });
  }, [onOpenProduct, operationPending, runOperation]);

  const handleIncrease = useCallback((cartItemId: string, productId: string) => {
    if (!onIncreaseQuantity || operationPending || inFlightRef.current !== null || !canModifyCart) return;
    void runOperation("increase-quantity", () => onIncreaseQuantity(cartItemId), copy.increaseError, { cartItemId, productId });
  }, [canModifyCart, onIncreaseQuantity, operationPending, runOperation]);

  const handleDecrease = useCallback((cartItemId: string, productId: string) => {
    if (!onDecreaseQuantity || operationPending || inFlightRef.current !== null || !canModifyCart) return;
    void runOperation("decrease-quantity", () => onDecreaseQuantity(cartItemId), copy.decreaseError, { cartItemId, productId });
  }, [canModifyCart, onDecreaseQuantity, operationPending, runOperation]);

  const handleRemove = useCallback((cartItemId: string, productId: string) => {
    if (!onRemoveItem || operationPending || inFlightRef.current !== null || !canModifyCart) return;
    void runOperation("remove-item", () => onRemoveItem(cartItemId), copy.removeError, { cartItemId, productId });
  }, [canModifyCart, onRemoveItem, operationPending, runOperation]);

  const handleRetry = useCallback(() => {
    if (!onRetryLoad || operationPending || inFlightRef.current !== null) return;
    void runOperation("retry-load", onRetryLoad, copy.retryError);
  }, [onRetryLoad, operationPending, runOperation]);

  return (
    <main className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]" style={themeStyle}>
      <div className="mx-auto min-h-[100dvh] max-w-[760px] px-6 pb-6 pt-[max(20px,env(safe-area-inset-top))] max-[374px]:px-5 lg:max-w-[1180px]">
        {effectiveState === "loading" ? <LoadingExperience disabled={operationPending} onBack={handleBack} /> : null}
        {effectiveState === "empty" ? <RecoveryExperience activeOperation={activeOperation} disabled={operationPending} kind="empty" onBack={handleBack} onRetry={onRetryLoad ? handleRetry : undefined} /> : null}
        {effectiveState === "error" ? <RecoveryExperience activeOperation={activeOperation} disabled={operationPending} kind="error" onBack={handleBack} onRetry={onRetryLoad ? handleRetry : undefined} /> : null}
        {hasRenderableCart && report ? <ReadyExperience activeItemContext={activeItemContext} activeOperation={activeOperation} canModifyCart={canModifyCart} canProceedToCheckout={canProceedToCheckout} disabled={operationPending} effectiveState={effectiveState as "ready" | "limited-availability"} isOffline={isOffline} onBack={handleBack} onCheckout={handleCheckout} onDecrease={onDecreaseQuantity ? handleDecrease : undefined} onIncrease={onIncreaseQuantity ? handleIncrease : undefined} onOpenProduct={onOpenProduct ? handleOpenProduct : undefined} onRemove={onRemoveItem ? handleRemove : undefined} report={report} /> : null}
      </div>
      <ToastRegion aboveStickyFooter={hasStickyFooter} message={toastMessage} />
    </main>
  );
}
