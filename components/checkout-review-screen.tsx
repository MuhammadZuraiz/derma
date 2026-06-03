import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type CheckoutReviewState =
  | "loading"
  | "ready"
  | "attention"
  | "empty"
  | "error";

export type CheckoutReviewOperation =
  | "back"
  | "edit-details"
  | "edit-cart"
  | "select-shipping"
  | "continue-payment"
  | "retry-load"
  | null;

export type CheckoutReviewPaymentBlockReason =
  | "select-shipping"
  | "review-cart"
  | "checkout-unavailable"
  | null;

export type CheckoutReviewItemAvailabilityState =
  | "available"
  | "attention"
  | "unavailable";

export interface ActiveShippingOptionContext {
  optionId: string;
}

export interface CheckoutReviewContact {
  fullName: string;
  email: string;
  phone: string;
}

export interface CheckoutReviewAddress {
  displayLines: string[];
  countryLabel: string;
}

export interface CheckoutReviewItem {
  cartItemId: string;
  productId: string;
  brand: string;
  name: string;
  imageUrl?: string;
  optionLabels: string[];
  quantity: number;
  unitPriceLabel?: string;
  lineTotalLabel?: string;
  availabilityState: CheckoutReviewItemAvailabilityState;
  availabilityLabel: string;
}

export interface CheckoutShippingOption {
  id: string;
  label: string;
  supporting?: string;
  priceLabel?: string;
  estimatedDeliveryLabel?: string;
  isAvailable: boolean;
}

export interface CheckoutReviewPricingSummary {
  itemCount: number;
  subtotalLabel?: string;
  shippingLabel?: string;
  taxLabel?: string;
  totalLabel: string;
  checkoutNotice?: string;
}

export interface CheckoutReviewAcknowledgement {
  required: boolean;
  label: string;
  supporting?: string;
}

export interface CheckoutReviewReport {
  checkoutSessionId: string;
  reviewId: string;
  contact: CheckoutReviewContact;
  address: CheckoutReviewAddress;
  items: CheckoutReviewItem[];
  shippingOptions: CheckoutShippingOption[];
  selectedShippingOptionId?: string;
  pricing: CheckoutReviewPricingSummary;
  canProceedToSecurePayment: boolean;
  paymentBlockReason?: CheckoutReviewPaymentBlockReason;
  acknowledgement?: CheckoutReviewAcknowledgement;
}

export interface CheckoutReviewSubmission {
  checkoutSessionId: string;
  reviewId: string;
  selectedShippingOptionId?: string;
  acknowledgementAccepted: boolean;
}

export interface CheckoutReviewScreenProps {
  state?: CheckoutReviewState;
  report?: CheckoutReviewReport | null;
  isOffline?: boolean;
  canOpenSecurePayment?: boolean;
  onBack: () => void | Promise<void>;
  onEditDetails: () => void | Promise<void>;
  onEditCart: () => void | Promise<void>;
  onSelectShippingOption?: (optionId: string) => void | Promise<void>;
  onContinueToSecurePayment: (
    submission: CheckoutReviewSubmission,
  ) => void | Promise<void>;
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

export function isCheckoutReviewItemUnavailable(
  item: CheckoutReviewItem,
): boolean {
  return item.availabilityState === "unavailable";
}

export function getSelectedShippingOption(
  report: CheckoutReviewReport,
): CheckoutShippingOption | null {
  return (
    report.shippingOptions.find(
      (option) => option.id === report.selectedShippingOptionId,
    ) ?? null
  );
}

export function needsShippingSelection(
  report: CheckoutReviewReport,
): boolean {
  const selectedOption =
    getSelectedShippingOption(report);

  return (
    report.shippingOptions.length > 0 &&
    (
      !selectedOption ||
      !selectedOption.isAvailable
    )
  );
}

export function hasSecurePaymentBlockReason(
  report: CheckoutReviewReport,
): boolean {
  return (
    report.paymentBlockReason !== null &&
    report.paymentBlockReason !== undefined
  );
}

function isNonWhitespaceString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasValidSecurePaymentContext(
  report: CheckoutReviewReport,
): boolean {
  return (
    isNonWhitespaceString(report.checkoutSessionId) &&
    isNonWhitespaceString(report.reviewId) &&
    isNonWhitespaceString(report.pricing.totalLabel)
  );
}

export function isCheckoutReviewState(
  value: unknown,
): value is CheckoutReviewState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "attention" ||
    value === "empty" ||
    value === "error"
  );
}

export const copy = {
  contextLabel: "CHECKOUT REVIEW",
  back: "Back",
  backToDetails: "Back to details",
  secureCheckout: "Secure checkout",
  heading: "Review your order",
  supporting:
    "Confirm your delivery details and order summary before continuing to secure payment.",
  guestCheckout:
    "You can complete checkout without creating an account.",
  paymentNext: "Payment details are entered in the next secure step.",
  attention:
    "Some order details need your attention before you continue.",
  deliveryDetailsHeading: "Delivery details",
  contactDetailsHeading: "Contact details",
  editDetails: "Edit details",
  orderItemsHeading: "Your items",
  editCart: "Edit cart",
  productImageUnavailable: "Product image unavailable",
  selectedOptions: "Selected options",
  quantityLabel: "Quantity",
  productAvailable: "Available",
  productUnavailable: "Currently unavailable",
  shippingHeading: "Delivery option",
  shippingHelper: "Choose how you would like this order delivered.",
  updatingShipping: "Updating delivery option…",
  unavailableOption: "Unavailable",
  orderSummaryHeading: "Order summary",
  items: "Items",
  subtotal: "Subtotal",
  shipping: "Shipping",
  tax: "Tax",
  total: "Total",
  acknowledgementHeading: "Confirm your review",
  paymentHandoff:
    "You will continue to a secure payment step after reviewing this order.",
  continuePayment: "Continue to secure payment",
  openingPayment: "Opening secure payment…",
  selectShippingToContinue: "Select a delivery option to continue",
  reviewCartToContinue: "Review your cart to continue",
  confirmReviewToContinue: "Confirm review to continue",
  reconnectToContinue: "Reconnect to continue",
  paymentUnavailable: "Payment unavailable right now",
  emptyHeading: "Your cart is empty",
  emptySupporting:
    "Return to your cart and add the products you want before continuing.",
  errorHeading: "We could not display your order review",
  errorSupporting:
    "Try loading your order review again or return to your checkout details.",
  retry: "Try loading again",
  retrying: "Retrying…",
  backError:
    "We could not return to your checkout details. Please try again.",
  editDetailsError:
    "We could not open your delivery details. Please try again.",
  editCartError: "We could not open your cart. Please try again.",
  shippingError:
    "We could not update your delivery option. Please try again.",
  paymentError: "We could not open secure payment. Please try again.",
  retryError: "We could not reload your order review. Please try again.",
  loadingHeading: "Loading your order review…",
  loadingSupporting: "We are preparing your delivery and order summary.",
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

function LockIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
      <path d="M8.5 10V7.5a3.5 3.5 0 1 1 7 0V10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
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

function Spinner({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={`animate-spin motion-reduce:animate-none ${className}`} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity=".25" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function ToastRegion({
  aboveStickyFooter,
  message,
}: {
  aboveStickyFooter: boolean;
  message: string | null;
}) {
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

function TopBar({
  disabled,
  onBack,
}: {
  disabled: boolean;
  onBack: () => void;
}) {
  return (
    <div className="grid min-h-12 grid-cols-[44px_1fr_44px] items-center gap-2">
      <button
        aria-label={copy.back}
        className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={disabled}
        onClick={onBack}
        type="button"
      >
        <ArrowLeftIcon />
      </button>
      <p className="text-center font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </p>
      <span aria-label={copy.secureCheckout} className="flex h-11 w-11 items-center justify-center text-[var(--dl-bark)]" role="img">
        <LockIcon />
      </span>
    </div>
  );
}

function HeadingAndPaymentNote() {
  return (
    <>
      <h1 className="mt-4 font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">
        {copy.heading}
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
        {copy.supporting}
      </p>
      <div className="mt-4 rounded-xl bg-[var(--dl-parchment)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
        <p className="flex items-start gap-2">
          <InfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
          <span>{copy.guestCheckout}</span>
        </p>
        <p className="mt-2 pl-[26px]">{copy.paymentNext}</p>
      </div>
    </>
  );
}

function AttentionBanner() {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]" role="status">
      <WarningIcon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      <span>{copy.attention}</span>
    </div>
  );
}

function DeliveryDetailsCard({
  disabled,
  onEditDetails,
  report,
}: {
  disabled: boolean;
  onEditDetails: () => void;
  report: CheckoutReviewReport;
}) {
  return (
    <section aria-labelledby="delivery-details-heading" className="rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[18px] font-semibold leading-6 text-[var(--dl-text-primary)]" id="delivery-details-heading">
          {copy.deliveryDetailsHeading}
        </h2>
        <button className={`${focusRing} min-h-11 px-1 text-sm font-semibold text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onEditDetails} type="button">
          {copy.editDetails}
        </button>
      </div>
      <p className="mt-3 text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{report.contact.fullName}</p>
      {report.address.displayLines.map((line, index) => (
        <p className="text-sm leading-5 text-[var(--dl-text-secondary)]" key={`address-${index}`}>{line}</p>
      ))}
      <p className="text-sm leading-5 text-[var(--dl-text-secondary)]">{report.address.countryLabel}</p>
      <div className="mt-4 border-t border-[var(--dl-border-subtle)] pt-3">
        <h3 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{copy.contactDetailsHeading}</h3>
        <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">{report.contact.email}</p>
        <p className="text-sm leading-5 text-[var(--dl-text-secondary)]">{report.contact.phone}</p>
      </div>
    </section>
  );
}

function ReviewItemRow({ item }: { item: CheckoutReviewItem }) {
  const imageKey = `${item.cartItemId}:${item.imageUrl ?? ""}`;
  const [failedImageKeys, setFailedImageKeys] = useState<Record<string, boolean>>({});
  const imageUnavailable = !item.imageUrl || Boolean(failedImageKeys[imageKey]);
  const quantity = normaliseNonNegativeInteger(item.quantity);
  const unavailable = isCheckoutReviewItemUnavailable(item);
  const availabilityLabel =
    item.availabilityLabel.trim() ||
    (unavailable ? copy.productUnavailable : copy.productAvailable);

  return (
    <li className="flex gap-3 border-t border-[var(--dl-border-subtle)] py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--dl-surface-soft)] max-[374px]:h-16 max-[374px]:w-16">
        {imageUnavailable ? (
          <span className="px-1 text-center text-[11px] leading-4 text-[var(--dl-text-secondary)]">{copy.productImageUnavailable}</span>
        ) : (
          <img
            alt={`${item.brand} ${item.name}`}
            className="h-full w-full object-contain"
            draggable={false}
            key={imageKey}
            onError={() => setFailedImageKeys((current) => ({ ...current, [imageKey]: true }))}
            src={item.imageUrl}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.08em] text-[var(--dl-peach-strong)]">{item.brand}</p>
        <h3 className="mt-1 text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{item.name}</h3>
        {item.optionLabels.length > 0 ? (
          <div className="mt-2">
            <p className="text-[12px] font-semibold leading-4 text-[var(--dl-text-secondary)]">{copy.selectedOptions}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {item.optionLabels.map((option, index) => (
                <span className="rounded-full bg-[var(--dl-parchment)] px-2 py-1 text-[11px] leading-4 text-[var(--dl-bark)]" key={`${item.cartItemId}-option-${index}`}>{option}</span>
              ))}
            </div>
          </div>
        ) : null}
        <p aria-label={`${copy.quantityLabel} for ${item.name}: ${quantity}`} className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.quantityLabel}: {quantity}</p>
        <p className={`mt-1 text-sm font-semibold leading-5 ${unavailable || item.availabilityState === "attention" ? "text-[var(--dl-warning-text)]" : "text-[var(--dl-bark)]"}`}>{availabilityLabel}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
          {item.unitPriceLabel ? <span>{item.unitPriceLabel}</span> : null}
          {item.lineTotalLabel ? <span>{item.lineTotalLabel}</span> : null}
        </div>
      </div>
    </li>
  );
}

function OrderItemsCard({
  disabled,
  onEditCart,
  report,
}: {
  disabled: boolean;
  onEditCart: () => void;
  report: CheckoutReviewReport;
}) {
  return (
    <section aria-labelledby="review-items-heading" className="rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[18px] font-semibold leading-6 text-[var(--dl-text-primary)]" id="review-items-heading">{copy.orderItemsHeading}</h2>
        <button className={`${focusRing} min-h-11 px-1 text-sm font-semibold text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onEditCart} type="button">{copy.editCart}</button>
      </div>
      <ul className="mt-3">
        {report.items.map((item) => <ReviewItemRow item={item} key={item.cartItemId} />)}
      </ul>
    </section>
  );
}

function ShippingOptionsCard({
  activeShippingOptionContext,
  disabled,
  onSelect,
  report,
}: {
  activeShippingOptionContext: ActiveShippingOptionContext | null;
  disabled: boolean;
  onSelect?: (optionId: string) => void;
  report: CheckoutReviewReport;
}) {
  if (report.shippingOptions.length === 0) {
    return null;
  }

  return (
    <fieldset className="rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <legend className="px-1 text-[18px] font-semibold leading-6 text-[var(--dl-text-primary)]">{copy.shippingHeading}</legend>
      <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.shippingHelper}</p>
      <div className="mt-3 space-y-2">
        {report.shippingOptions.map((option) => {
          const optionPending = activeShippingOptionContext?.optionId === option.id;
          const optionDisabled = disabled || !onSelect || !option.isAvailable;

          return (
            <label className={`block rounded-xl border p-3 ${report.selectedShippingOptionId === option.id ? "border-[var(--dl-peach-strong)] bg-[var(--dl-blush)]" : "border-[var(--dl-border-subtle)] bg-[var(--dl-surface)]"} ${optionDisabled ? "cursor-not-allowed" : "cursor-pointer"}`} key={option.id}>
              <span className="flex items-start gap-3">
                <input checked={report.selectedShippingOptionId === option.id} className="mt-1 h-5 w-5 accent-[var(--dl-bark)]" disabled={optionDisabled} name="shipping-option" onChange={() => onSelect?.(option.id)} type="radio" value={option.id} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold leading-5 ${optionDisabled ? "text-[var(--dl-dusk)]" : "text-[var(--dl-text-primary)]"}`}>{option.label}</span>
                  {option.supporting ? <span className="mt-1 block text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{option.supporting}</span> : null}
                  <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
                    {option.priceLabel ? <span>{option.priceLabel}</span> : null}
                    {option.estimatedDeliveryLabel ? <span>{option.estimatedDeliveryLabel}</span> : null}
                  </span>
                  {!option.isAvailable ? <span className="mt-1 block text-[13px] font-semibold leading-[18px] text-[var(--dl-warning-text)]">{copy.unavailableOption}</span> : null}
                  {optionPending ? <span className="mt-1 flex items-center gap-2 text-[13px] font-semibold leading-[18px] text-[var(--dl-bark)]"><Spinner />{copy.updatingShipping}</span> : null}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) {
    return null;
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-sm leading-5">
      <dt className="text-[var(--dl-text-secondary)]">{label}</dt>
      <dd className="text-right font-semibold text-[var(--dl-text-primary)]">{value}</dd>
    </div>
  );
}

function PricingSummaryCard({ report }: { report: CheckoutReviewReport }) {
  return (
    <section aria-labelledby="pricing-summary-heading" className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-4">
      <h2 className="text-[18px] font-semibold leading-6 text-[var(--dl-text-primary)]" id="pricing-summary-heading">{copy.orderSummaryHeading}</h2>
      <dl aria-live="polite" className="mt-3 space-y-2">
        <SummaryRow label={copy.items} value={formatCartItemCount(report.pricing.itemCount)} />
        <SummaryRow label={copy.subtotal} value={report.pricing.subtotalLabel} />
        <SummaryRow label={copy.shipping} value={report.pricing.shippingLabel} />
        <SummaryRow label={copy.tax} value={report.pricing.taxLabel} />
        <SummaryRow label={copy.total} value={report.pricing.totalLabel} />
      </dl>
      {report.pricing.checkoutNotice ? <p className="mt-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{report.pricing.checkoutNotice}</p> : null}
    </section>
  );
}

function AcknowledgementCard({
  acknowledgementAccepted,
  disabled,
  onChange,
  report,
}: {
  acknowledgementAccepted: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  report: CheckoutReviewReport;
}) {
  if (!report.acknowledgement) {
    return null;
  }

  return (
    <section aria-labelledby="acknowledgement-heading" className="rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <h2 className="text-[16px] font-semibold leading-[22px] text-[var(--dl-text-primary)]" id="acknowledgement-heading">{copy.acknowledgementHeading}</h2>
      <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--dl-text-primary)] has-[:disabled]:cursor-not-allowed">
        <input checked={acknowledgementAccepted} className="mt-0.5 h-5 w-5 accent-[var(--dl-bark)]" disabled={disabled} onChange={(event) => onChange(event.currentTarget.checked)} type="checkbox" />
        <span>
          <span>{report.acknowledgement.label}</span>
          {report.acknowledgement.supporting ? <span className="mt-1 block text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{report.acknowledgement.supporting}</span> : null}
        </span>
      </label>
    </section>
  );
}

export function getSecurePaymentLabel({
  acknowledgementAccepted,
  activeOperation,
  canOpenSecurePayment,
  isOffline,
  report,
}: {
  acknowledgementAccepted: boolean;
  activeOperation: CheckoutReviewOperation;
  canOpenSecurePayment: boolean;
  isOffline: boolean;
  report: CheckoutReviewReport;
}): string {
  if (!hasValidSecurePaymentContext(report)) {
    return copy.paymentUnavailable;
  }

  if (activeOperation === "continue-payment") {
    return copy.openingPayment;
  }

  if (
    needsShippingSelection(report) ||
    report.paymentBlockReason === "select-shipping"
  ) {
    return copy.selectShippingToContinue;
  }

  if (report.paymentBlockReason === "review-cart") {
    return copy.reviewCartToContinue;
  }

  if (
    hasSecurePaymentBlockReason(report) ||
    !report.canProceedToSecurePayment
  ) {
    return copy.paymentUnavailable;
  }

  if (report.acknowledgement?.required && !acknowledgementAccepted) {
    return copy.confirmReviewToContinue;
  }

  if (!canOpenSecurePayment) {
    return isOffline ? copy.reconnectToContinue : copy.paymentUnavailable;
  }

  return copy.continuePayment;
}

function CheckoutReviewFooter({
  acknowledgementAccepted,
  activeOperation,
  canOpenSecurePayment,
  disabled,
  primaryDisabled,
  isOffline,
  labelOverride,
  onBack,
  onContinue,
  report,
  totalLabel,
}: {
  acknowledgementAccepted: boolean;
  activeOperation: CheckoutReviewOperation;
  canOpenSecurePayment: boolean;
  disabled: boolean;
  primaryDisabled: boolean;
  isOffline: boolean;
  labelOverride?: string;
  onBack: () => void;
  onContinue: () => void;
  report?: CheckoutReviewReport;
  totalLabel?: string;
}) {
  const label = labelOverride ?? (report ? getSecurePaymentLabel({ acknowledgementAccepted, activeOperation, canOpenSecurePayment, isOffline, report }) : copy.continuePayment);

  return (
    <footer className="sticky bottom-0 z-30 -mx-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[8px] sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-t-[20px] lg:border-x lg:px-4">
      {totalLabel?.trim() ? <p className="mb-2 text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{totalLabel}</p> : null}
      <button className={`${focusRing} flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`} disabled={primaryDisabled} onClick={onContinue} type="button">
        {activeOperation === "continue-payment" ? <Spinner /> : null}
        {label}
      </button>
      <button className={`${focusRing} mt-2 min-h-11 w-full rounded-full px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button">{copy.backToDetails}</button>
    </footer>
  );
}

function PaymentHandoffNote() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-[var(--dl-surface-soft)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <LockIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <span>{copy.paymentHandoff}</span>
    </p>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--dl-parchment)] motion-reduce:animate-none ${className}`} />;
}

function LoadingExperience({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-0 pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col">
        <TopBar disabled onBack={onBack} />
        <div aria-live="polite" role="status">
          <h1 className="mt-5 font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.loadingHeading}</h1>
          <p className="mt-2 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.loadingSupporting}</p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[58fr_42fr]">
          <div className="space-y-4">
            <SkeletonBlock className="h-40" />
            <SkeletonBlock className="h-64" />
          </div>
          <SkeletonBlock className="h-44" />
        </div>
        <div className="mt-auto pt-5">
          <CheckoutReviewFooter acknowledgementAccepted={false} activeOperation={null} canOpenSecurePayment={false} disabled primaryDisabled isOffline={false} labelOverride={copy.continuePayment} onBack={onBack} onContinue={() => undefined} />
        </div>
      </div>
    </div>
  );
}

function RecoveryExperience({
  disabled,
  kind,
  onBack,
  onEditCart,
  onRetry,
  retrying,
}: {
  disabled: boolean;
  kind: "empty" | "error";
  onBack: () => void;
  onEditCart: () => void;
  onRetry?: () => void;
  retrying: boolean;
}) {
  const empty = kind === "empty";
  return (
    <div className="min-h-[100dvh] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto w-full max-w-[720px]">
        <TopBar disabled={disabled} onBack={onBack} />
        <div className="mt-16 rounded-[20px] bg-[var(--dl-surface)] p-5 shadow-[0_4px_20px_rgba(92,74,66,0.08)]" role={empty ? undefined : "alert"}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--dl-error-surface)] text-[var(--dl-error-text)]">
            <WarningIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-[family-name:var(--dl-display)] text-[34px] leading-[38px] text-[var(--dl-text-primary)]">{empty ? copy.emptyHeading : copy.errorHeading}</h1>
          <p className="mt-2 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{empty ? copy.emptySupporting : copy.errorSupporting}</p>
        </div>
        <div className="mt-5 space-y-2">
          {empty ? (
            <button className={`${focusRing} min-h-[52px] w-full rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold text-white hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)]`} disabled={disabled} onClick={onEditCart} type="button">{copy.editCart}</button>
          ) : null}
          {!empty && onRetry ? (
            <button className={`${focusRing} flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold text-white hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)]`} disabled={disabled} onClick={onRetry} type="button">
              {retrying ? <Spinner /> : null}
              {retrying ? copy.retrying : copy.retry}
            </button>
          ) : null}
          {!empty ? <button className={`${focusRing} min-h-11 w-full rounded-full px-4 text-sm font-semibold text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button">{copy.backToDetails}</button> : null}
        </div>
      </div>
    </div>
  );
}

function ReadyExperience({
  acknowledgementAccepted,
  activeOperation,
  activeShippingOptionContext,
  canOpenSecurePayment,
  disabled,
  isOffline,
  onAcknowledgementChange,
  onBack,
  onContinue,
  onEditCart,
  onEditDetails,
  onSelectShippingOption,
  report,
  state,
}: {
  acknowledgementAccepted: boolean;
  activeOperation: CheckoutReviewOperation;
  activeShippingOptionContext: ActiveShippingOptionContext | null;
  canOpenSecurePayment: boolean;
  disabled: boolean;
  isOffline: boolean;
  onAcknowledgementChange: (checked: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
  onEditCart: () => void;
  onEditDetails: () => void;
  onSelectShippingOption?: (optionId: string) => void;
  report: CheckoutReviewReport;
  state: CheckoutReviewState;
}) {
  const requiredAcknowledgementMissing = Boolean(report.acknowledgement?.required && !acknowledgementAccepted);
  const paymentDisabled =
    disabled ||
    !hasValidSecurePaymentContext(report) ||
    !report.canProceedToSecurePayment ||
    hasSecurePaymentBlockReason(report) ||
    !canOpenSecurePayment ||
    needsShippingSelection(report) ||
    requiredAcknowledgementMissing;

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-0 pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col">
        <TopBar disabled={disabled} onBack={onBack} />
        <HeadingAndPaymentNote />
        {state === "attention" ? <AttentionBanner /> : null}
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:gap-12">
          <div className="space-y-4 lg:col-start-1 lg:row-start-1">
            <DeliveryDetailsCard disabled={disabled} onEditDetails={onEditDetails} report={report} />
            <OrderItemsCard disabled={disabled} onEditCart={onEditCart} report={report} />
            <ShippingOptionsCard activeShippingOptionContext={activeShippingOptionContext} disabled={disabled} onSelect={onSelectShippingOption} report={report} />
          </div>
          <div className="space-y-4 lg:col-start-2 lg:row-start-1">
            <PricingSummaryCard report={report} />
            <AcknowledgementCard acknowledgementAccepted={acknowledgementAccepted} disabled={disabled} onChange={onAcknowledgementChange} report={report} />
            <PaymentHandoffNote />
          </div>
        </div>
        <div className="mt-auto pt-5 lg:ml-auto lg:w-[42%] lg:pl-6">
          <CheckoutReviewFooter acknowledgementAccepted={acknowledgementAccepted} activeOperation={activeOperation} canOpenSecurePayment={canOpenSecurePayment} disabled={disabled} primaryDisabled={paymentDisabled} isOffline={isOffline} onBack={onBack} onContinue={onContinue} report={report} totalLabel={report.pricing.totalLabel} />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutReviewScreen({
  canOpenSecurePayment = true,
  isOffline = false,
  onBack,
  onContinueToSecurePayment,
  onEditCart,
  onEditDetails,
  onRetryLoad,
  onSelectShippingOption,
  report = null,
  state = "loading",
}: CheckoutReviewScreenProps) {
  const runtimeState: CheckoutReviewState =
    isCheckoutReviewState(state) ? state : "error";
  const effectiveState: CheckoutReviewState =
    (runtimeState === "ready" || runtimeState === "attention") && report === null
      ? "error"
      : (runtimeState === "ready" || runtimeState === "attention") && report !== null && report.items.length === 0
        ? "empty"
        : runtimeState;
  const hasRenderableReview =
    (effectiveState === "ready" || effectiveState === "attention") &&
    report !== null;
  const hasStickyFooter = effectiveState === "loading" || hasRenderableReview;

  const mountedRef = useRef(false);
  const inFlightRef = useRef<CheckoutReviewOperation>(null);
  const [activeOperation, setActiveOperation] = useState<CheckoutReviewOperation>(null);
  const [activeShippingOptionContext, setActiveShippingOptionContext] = useState<ActiveShippingOptionContext | null>(null);
  const [acknowledgementAccepted, setAcknowledgementAccepted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const operationPending = activeOperation !== null;
  const acknowledgementSignature =
    report?.acknowledgement
      ? [
          report.acknowledgement.required,
          report.acknowledgement.label,
          report.acknowledgement.supporting ?? "",
        ].join(":")
      : "";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setAcknowledgementAccepted(false);
  }, [
    report?.reviewId,
    acknowledgementSignature,
  ]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const runOperation = useCallback(async ({
    errorMessage,
    operation,
    task,
  }: {
    errorMessage: string;
    operation: Exclude<CheckoutReviewOperation, null>;
    task: () => void | Promise<void>;
  }) => {
    if (inFlightRef.current !== null) return false;
    inFlightRef.current = operation;
    setActiveOperation(operation);
    setToastMessage(null);
    try {
      await task();
      return true;
    } catch {
      if (mountedRef.current) setToastMessage(errorMessage);
      return false;
    } finally {
      inFlightRef.current = null;
      if (mountedRef.current) {
        setActiveOperation(null);
        setActiveShippingOptionContext(null);
      }
    }
  }, []);

  const handleBack = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) return;
    void runOperation({ errorMessage: copy.backError, operation: "back", task: onBack });
  }, [onBack, operationPending, runOperation]);

  const handleEditDetails = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) return;
    void runOperation({ errorMessage: copy.editDetailsError, operation: "edit-details", task: onEditDetails });
  }, [onEditDetails, operationPending, runOperation]);

  const handleEditCart = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) return;
    void runOperation({ errorMessage: copy.editCartError, operation: "edit-cart", task: onEditCart });
  }, [onEditCart, operationPending, runOperation]);

  const handleSelectShippingOption = useCallback((optionId: string) => {
    if (!hasRenderableReview || !report || !onSelectShippingOption || operationPending || inFlightRef.current !== null) return;
    const option = report.shippingOptions.find((candidate) => candidate.id === optionId);
    if (!option || !option.isAvailable || report.selectedShippingOptionId === optionId) return;
    setActiveShippingOptionContext({ optionId });
    void runOperation({ errorMessage: copy.shippingError, operation: "select-shipping", task: () => onSelectShippingOption(optionId) });
  }, [hasRenderableReview, onSelectShippingOption, operationPending, report, runOperation]);

  const handleContinueToSecurePayment = useCallback(() => {
    if (!hasRenderableReview || !report || operationPending || inFlightRef.current !== null) return;
    if (
      !hasValidSecurePaymentContext(report) ||
      !report.canProceedToSecurePayment ||
      hasSecurePaymentBlockReason(report) ||
      !canOpenSecurePayment ||
      needsShippingSelection(report) ||
      (
        report.acknowledgement?.required &&
        !acknowledgementAccepted
      )
    ) return;
    void runOperation({
      errorMessage: copy.paymentError,
      operation: "continue-payment",
      task: () => onContinueToSecurePayment({ checkoutSessionId: report.checkoutSessionId, reviewId: report.reviewId, selectedShippingOptionId: report.selectedShippingOptionId, acknowledgementAccepted: Boolean(report.acknowledgement && acknowledgementAccepted) }),
    });
  }, [acknowledgementAccepted, canOpenSecurePayment, hasRenderableReview, onContinueToSecurePayment, operationPending, report, runOperation]);

  const handleRetry = useCallback(() => {
    if (!onRetryLoad || operationPending || inFlightRef.current !== null) return;
    void runOperation({ errorMessage: copy.retryError, operation: "retry-load", task: onRetryLoad });
  }, [onRetryLoad, operationPending, runOperation]);

  let experience: ReactNode;
  if (effectiveState === "loading") {
    experience = <LoadingExperience onBack={handleBack} />;
  } else if (effectiveState === "empty") {
    experience = <RecoveryExperience disabled={operationPending} kind="empty" onBack={handleBack} onEditCart={handleEditCart} retrying={false} />;
  } else if (effectiveState === "error" || !report) {
    experience = <RecoveryExperience disabled={operationPending} kind="error" onBack={handleBack} onEditCart={handleEditCart} onRetry={onRetryLoad ? handleRetry : undefined} retrying={activeOperation === "retry-load"} />;
  } else {
    experience = <ReadyExperience acknowledgementAccepted={acknowledgementAccepted} activeOperation={activeOperation} activeShippingOptionContext={activeShippingOptionContext} canOpenSecurePayment={canOpenSecurePayment} disabled={operationPending} isOffline={isOffline} onAcknowledgementChange={setAcknowledgementAccepted} onBack={handleBack} onContinue={handleContinueToSecurePayment} onEditCart={handleEditCart} onEditDetails={handleEditDetails} onSelectShippingOption={onSelectShippingOption ? handleSelectShippingOption : undefined} report={report} state={effectiveState} />;
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]" style={themeStyle}>
      {experience}
      <ToastRegion aboveStickyFooter={hasStickyFooter} message={toastMessage} />
    </main>
  );
}
