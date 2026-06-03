import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type OrderPaymentResultState =
  | "loading"
  | "ready"
  | "error";

export type OrderPaymentStatus =
  | "confirmed"
  | "pending"
  | "failed"
  | "cancelled";

export type OrderPaymentResultOperation =
  | "view-order"
  | "refresh-status"
  | "retry-payment"
  | "continue-shopping"
  | "back-review"
  | "retry-load"
  | null;

export type OrderPaymentResultPrimaryAction =
  | "view-order"
  | "refresh-status"
  | "retry-payment"
  | "continue-shopping";

export type OrderPaymentResultToastFooterMode =
  | "none"
  | "compact"
  | "expanded";

export interface OrderPaymentResultReport {
  checkoutSessionId: string;
  reviewId: string;
  paymentResultId: string;

  paymentStatus: OrderPaymentStatus;

  orderId?: string;
  orderReferenceLabel?: string;

  itemCount: number;
  totalLabel: string;

  providerLabel?: string;
  confirmedAtLabel?: string;

  deliverySummaryLabel?: string;
  estimatedDeliveryLabel?: string;

  hostStatusHelperLabel?: string;
}

export interface OrderPaymentResultActionSubmission {
  checkoutSessionId: string;
  reviewId: string;
  paymentResultId: string;
  orderId?: string;
}

export interface OrderConfirmationAndPaymentResultScreenProps {
  state?: OrderPaymentResultState;
  report?: OrderPaymentResultReport | null;

  isOffline?: boolean;

  canViewOrder?: boolean;
  canRefreshStatus?: boolean;
  canRetryPayment?: boolean;

  onViewOrder?: (
    orderId: string,
  ) => void | Promise<void>;

  onRefreshStatus?: (
    submission: OrderPaymentResultActionSubmission,
  ) => void | Promise<void>;

  onRetryPayment?: (
    submission: OrderPaymentResultActionSubmission,
  ) => void | Promise<void>;

  onContinueShopping: () =>
    void | Promise<void>;

  onBackToReview?: () =>
    void | Promise<void>;

  onRetryLoad?: () =>
    void | Promise<void>;
}

export function normaliseNonNegativeInteger(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

export function formatCartItemCount(
  value: number,
): string {
  const count =
    normaliseNonNegativeInteger(value);

  return `${count} ${
    count === 1 ? "item" : "items"
  }`;
}

function isReadableText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export function isKnownPaymentStatus(
  value: unknown,
): value is OrderPaymentStatus {
  return (
    value === "confirmed" ||
    value === "pending" ||
    value === "failed" ||
    value === "cancelled"
  );
}

export function getSafeOptionalDisplayText(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  if (!text) {
    return null;
  }

  const containsUnsafeUrlSyntax =
    /(?:https?:\/\/|\/\/|javascript:|data:|mailto:|tel:)/i.test(
      text,
    ) ||
    /\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#\\][^\s]*)/i.test(
      text,
    );

  return containsUnsafeUrlSyntax
    ? null
    : text;
}

export function hasRequiredPaymentResultMetadata(
  report: OrderPaymentResultReport,
): boolean {
  const safeTotalLabel =
    getSafeOptionalDisplayText(
      report.totalLabel,
    );

  const hasBaseMetadata =
    isReadableText(
      report.checkoutSessionId,
    ) &&
    isReadableText(report.reviewId) &&
    isReadableText(
      report.paymentResultId,
    ) &&
    isKnownPaymentStatus(
      report.paymentStatus,
    ) &&
    safeTotalLabel !== null &&
    normaliseNonNegativeInteger(
      report.itemCount,
    ) > 0;

  if (!hasBaseMetadata) {
    return false;
  }

  if (
    report.paymentStatus ===
    "confirmed"
  ) {
    return (
      isReadableText(report.orderId) &&
      getSafeOptionalDisplayText(
        report.orderReferenceLabel,
      ) !== null
    );
  }

  return true;
}

export function getPaymentResultActionSubmission(
  report: OrderPaymentResultReport,
): OrderPaymentResultActionSubmission {
  return {
    checkoutSessionId:
      report.checkoutSessionId,
    reviewId: report.reviewId,
    paymentResultId:
      report.paymentResultId,
    orderId:
      isReadableText(report.orderId)
        ? report.orderId
        : undefined,
  };
}

export const copy = {
  contextLabel: "ORDER STATUS",
  secureCheckout: "Secure checkout",
  backToReview: "Back to order review",
  loadingHeading:
    "Checking your payment status…",
  loadingSupporting:
    "We are confirming the latest result for your DermaLens order.",
  confirmedHeading: "Order confirmed",
  confirmedSupporting:
    "Your payment was confirmed and your DermaLens order has been placed.",
  pendingHeading:
    "Payment confirmation pending",
  pendingSupporting:
    "We are still confirming the payment result.",
  pendingSafety:
    "Avoid submitting another payment while this result is pending.",
  failedHeading:
    "Payment was not completed",
  failedSupporting:
    "Your payment was not confirmed. You can review the order or prepare a new secure payment attempt.",
  cancelledHeading: "Payment was cancelled",
  cancelledSupporting:
    "The secure payment step was cancelled. You can return to the order review or try again.",
  statusHeading: "Payment status",
  confirmedStatus: "Confirmed",
  pendingStatus: "Pending confirmation",
  failedStatus: "Not completed",
  cancelledStatus: "Cancelled",
  orderSummary: "Order summary",
  orderReference: "Order reference",
  items: "Items",
  total: "Total",
  provider: "Payment provider",
  confirmedAt: "Confirmed at",
  deliveryHeading: "Delivery information",
  delivery: "Delivery",
  estimatedDelivery: "Estimated delivery",
  hostStatusNote: "Status note",
  paymentBoundary:
    "Payment details were handled on the secure payment page. DermaLens does not request card details here.",
  viewOrder: "View order details",
  openingOrder: "Opening order…",
  checkStatus: "Check payment status",
  checkingStatus: "Checking payment status…",
  retryPayment: "Try payment again",
  preparingRetry: "Preparing payment retry…",
  continueShopping: "Continue shopping",
  returningToStore: "Returning to store…",
  openingReview: "Opening order review…",
  reconnectViewOrder:
    "Reconnect to view order",
  orderUnavailable:
    "Order details unavailable right now",
  reconnectCheckStatus:
    "Reconnect to check status",
  statusUnavailable:
    "Status check unavailable right now",
  reconnectRetry:
    "Reconnect to try payment again",
  retryUnavailable:
    "Payment retry unavailable right now",
  errorHeading:
    "We could not display your payment result",
  errorSupporting:
    "Try loading the latest status again or continue shopping.",
  retryLoad: "Try loading again",
  retryingLoad: "Loading latest status…",
  viewOrderError:
    "We could not open your order. Please try again.",
  refreshStatusError:
    "We could not refresh your payment status. Please try again.",
  retryPaymentError:
    "We could not prepare another payment attempt. Please try again.",
  continueShoppingError:
    "We could not return to the store. Please try again.",
  backToReviewError:
    "We could not return to the order review. Please try again.",
  retryLoadError:
    "We could not reload your payment result. Please try again.",
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
  display:
    '"DM Serif Display", Georgia, serif',
  ui:
    '"DM Sans", system-ui, sans-serif',
  metadata:
    '"Space Mono", monospace',
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

type IconProps = {
  className?: string;
};

function ArrowLeftIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m14.5 6-6 6 6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function LockIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="14"
        x="5"
        y="10"
      />
      <path
        d="M8.5 10V7.5a3.5 3.5 0 1 1 7 0V10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CheckIcon({
  className = "h-7 w-7",
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m5.5 12.5 4 4 9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ClockIcon({
  className = "h-7 w-7",
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function WarningIcon({
  className = "h-7 w-7",
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 4 21 20H3L12 4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 9v5m0 3h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseIcon({
  className = "h-7 w-7",
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m7 7 10 10M17 7 7 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Spinner({
  className = "h-4 w-4",
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`animate-spin motion-reduce:animate-none ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        opacity=".25"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-[var(--dl-parchment)] motion-reduce:animate-none ${className}`}
    />
  );
}

function ToastRegion({
  footerMode,
  message,
}: {
  footerMode:
    OrderPaymentResultToastFooterMode;
  message: string | null;
}) {
  const positionClass =
    footerMode === "expanded"
      ? "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_225px)]"
      : footerMode === "compact"
        ? "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_180px)]"
        : "bottom-[max(24px,env(safe-area-inset-bottom))]";

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 z-50 mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${positionClass} ${
        message
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0"
      }`}
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
  onBackToReview,
}: {
  disabled: boolean;
  onBackToReview?: () => void;
}) {
  return (
    <div className="grid min-h-12 grid-cols-[44px_1fr_44px] items-center gap-2">
      {onBackToReview ? (
        <button
          aria-label={copy.backToReview}
          className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={disabled}
          onClick={onBackToReview}
          type="button"
        >
          <ArrowLeftIcon />
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      <p className="text-center font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </p>
      <span
        aria-label={copy.secureCheckout}
        className="flex h-11 w-11 items-center justify-center text-[var(--dl-bark)]"
        role="img"
      >
        <LockIcon />
      </span>
    </div>
  );
}

export function getStatusHeading(
  status: OrderPaymentStatus,
): string {
  switch (status) {
    case "confirmed":
      return copy.confirmedHeading;
    case "pending":
      return copy.pendingHeading;
    case "failed":
      return copy.failedHeading;
    case "cancelled":
      return copy.cancelledHeading;
  }
}

export function getStatusSupportingCopy(
  status: OrderPaymentStatus,
): string {
  switch (status) {
    case "confirmed":
      return copy.confirmedSupporting;
    case "pending":
      return copy.pendingSupporting;
    case "failed":
      return copy.failedSupporting;
    case "cancelled":
      return copy.cancelledSupporting;
  }
}

export function getStatusLabel(
  status: OrderPaymentStatus,
): string {
  switch (status) {
    case "confirmed":
      return copy.confirmedStatus;
    case "pending":
      return copy.pendingStatus;
    case "failed":
      return copy.failedStatus;
    case "cancelled":
      return copy.cancelledStatus;
  }
}

function StatusIllustration({
  status,
}: {
  status: OrderPaymentStatus;
}) {
  const surfaceClass =
    status === "confirmed"
      ? "bg-[var(--dl-blush)] text-[var(--dl-bark)]"
      : status === "pending"
        ? "bg-[var(--dl-parchment)] text-[var(--dl-warning-text)]"
        : status === "failed"
          ? "bg-[var(--dl-error-surface)] text-[var(--dl-error-text)]"
          : "bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]";

  return (
    <div
      aria-hidden="true"
      className={`flex h-24 w-24 items-center justify-center rounded-[28px] shadow-[0_4px_20px_rgba(92,74,66,0.05)] ${surfaceClass}`}
    >
      {status === "confirmed" ? (
        <CheckIcon className="h-12 w-12" />
      ) : null}
      {status === "pending" ? (
        <ClockIcon className="h-12 w-12" />
      ) : null}
      {status === "failed" ? (
        <WarningIcon className="h-12 w-12" />
      ) : null}
      {status === "cancelled" ? (
        <CloseIcon className="h-12 w-12" />
      ) : null}
    </div>
  );
}

function StatusHeader({
  report,
}: {
  report: OrderPaymentResultReport;
}) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      role="status"
    >
      <h1 className="mt-5 max-w-[560px] font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">
        {getStatusHeading(
          report.paymentStatus,
        )}
      </h1>
      <p className="mt-2 max-w-[580px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
        {getStatusSupportingCopy(
          report.paymentStatus,
        )}
      </p>
    </div>
  );
}

function PendingSafetyNote() {
  return (
    <div
      className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]"
      role="status"
    >
      <WarningIcon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      <p>{copy.pendingSafety}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-sm leading-5">
      <dt className="text-[var(--dl-text-secondary)]">
        {label}
      </dt>
      <dd className="text-right font-semibold text-[var(--dl-text-primary)]">
        {value}
      </dd>
    </div>
  );
}

function PaymentStatusCard({
  report,
}: {
  report: OrderPaymentResultReport;
}) {
  return (
    <section
      aria-labelledby="result-status-heading"
      className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-4"
    >
      <h2
        className="text-[18px] font-semibold leading-6 text-[var(--dl-text-primary)]"
        id="result-status-heading"
      >
        {copy.statusHeading}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">
        {getStatusLabel(report.paymentStatus)}
      </p>
    </section>
  );
}

function CompactOrderSummary({
  report,
}: {
  report: OrderPaymentResultReport;
}) {
  const orderReference =
    getSafeOptionalDisplayText(
      report.orderReferenceLabel,
    );
  const provider =
    getSafeOptionalDisplayText(
      report.providerLabel,
    );
  const confirmedAt =
    report.paymentStatus === "confirmed"
      ? getSafeOptionalDisplayText(
          report.confirmedAtLabel,
        )
      : null;
  const total =
    getSafeOptionalDisplayText(
      report.totalLabel,
    );

  return (
    <section
      aria-labelledby="result-order-summary-heading"
      className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4"
    >
      <h2
        className="text-[18px] font-semibold leading-6 text-[var(--dl-text-primary)]"
        id="result-order-summary-heading"
      >
        {copy.orderSummary}
      </h2>
      <dl className="mt-3 space-y-2">
        {orderReference ? (
          <SummaryRow
            label={copy.orderReference}
            value={orderReference}
          />
        ) : null}
        <SummaryRow
          label={copy.items}
          value={formatCartItemCount(
            report.itemCount,
          )}
        />
        {total ? (
          <SummaryRow
            label={copy.total}
            value={total}
          />
        ) : null}
        {provider ? (
          <SummaryRow
            label={copy.provider}
            value={provider}
          />
        ) : null}
        {confirmedAt ? (
          <SummaryRow
            label={copy.confirmedAt}
            value={confirmedAt}
          />
        ) : null}
      </dl>
    </section>
  );
}

function DeliveryCard({
  report,
}: {
  report: OrderPaymentResultReport;
}) {
  const deliverySummary =
    getSafeOptionalDisplayText(
      report.deliverySummaryLabel,
    );
  const estimatedDelivery =
    getSafeOptionalDisplayText(
      report.estimatedDeliveryLabel,
    );

  if (!deliverySummary && !estimatedDelivery) {
    return null;
  }

  return (
    <section
      aria-labelledby="result-delivery-heading"
      className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4"
    >
      <h2
        className="text-[18px] font-semibold leading-6 text-[var(--dl-text-primary)]"
        id="result-delivery-heading"
      >
        {copy.deliveryHeading}
      </h2>
      <dl className="mt-3 space-y-2">
        {deliverySummary ? (
          <SummaryRow
            label={copy.delivery}
            value={deliverySummary}
          />
        ) : null}
        {estimatedDelivery ? (
          <SummaryRow
            label={copy.estimatedDelivery}
            value={estimatedDelivery}
          />
        ) : null}
      </dl>
    </section>
  );
}

function HostStatusNote({
  label,
}: {
  label: unknown;
}) {
  const safeLabel =
    getSafeOptionalDisplayText(label);

  if (!safeLabel) {
    return null;
  }

  return (
    <section className="rounded-xl bg-[var(--dl-parchment)] p-3 text-sm leading-5 text-[var(--dl-text-secondary)]">
      <h2 className="font-semibold text-[var(--dl-text-primary)]">
        {copy.hostStatusNote}
      </h2>
      <p className="mt-1">{safeLabel}</p>
    </section>
  );
}

function PaymentBoundaryNote() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-[var(--dl-blush)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <LockIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <span>{copy.paymentBoundary}</span>
    </p>
  );
}

export function getPrimaryActionKind({
  canViewOrder,
  hasViewOrderAdapter,
  report,
}: {
  canViewOrder: boolean;
  hasViewOrderAdapter: boolean;
  report: OrderPaymentResultReport;
}): OrderPaymentResultPrimaryAction {
  if (
    report.paymentStatus ===
    "confirmed"
  ) {
    return (
      canViewOrder &&
      hasViewOrderAdapter &&
      isReadableText(report.orderId)
    )
      ? "view-order"
      : "continue-shopping";
  }

  if (
    report.paymentStatus ===
    "pending"
  ) {
    return "refresh-status";
  }

  return "retry-payment";
}

export function getPrimaryActionLabel({
  activeOperation,
  canRefreshStatus,
  canRetryPayment,
  canViewOrder,
  hasRefreshStatusAdapter,
  hasRetryPaymentAdapter,
  isOffline,
  kind,
}: {
  activeOperation:
    OrderPaymentResultOperation;
  canRefreshStatus: boolean;
  canRetryPayment: boolean;
  canViewOrder: boolean;
  hasRefreshStatusAdapter: boolean;
  hasRetryPaymentAdapter: boolean;
  isOffline: boolean;
  kind:
    OrderPaymentResultPrimaryAction;
}): string {
  if (activeOperation === kind) {
    if (kind === "view-order") {
      return copy.openingOrder;
    }

    if (kind === "refresh-status") {
      return copy.checkingStatus;
    }

    if (kind === "retry-payment") {
      return copy.preparingRetry;
    }

    return copy.returningToStore;
  }

  if (
    kind === "refresh-status" &&
    !hasRefreshStatusAdapter
  ) {
    return copy.statusUnavailable;
  }

  if (
    kind === "retry-payment" &&
    !hasRetryPaymentAdapter
  ) {
    return copy.retryUnavailable;
  }

  if (kind === "view-order") {
    return canViewOrder
      ? copy.viewOrder
      : isOffline
        ? copy.reconnectViewOrder
        : copy.orderUnavailable;
  }

  if (kind === "refresh-status") {
    return canRefreshStatus
      ? copy.checkStatus
      : isOffline
        ? copy.reconnectCheckStatus
        : copy.statusUnavailable;
  }

  if (kind === "retry-payment") {
    return canRetryPayment
      ? copy.retryPayment
      : isOffline
        ? copy.reconnectRetry
        : copy.retryUnavailable;
  }

  return copy.continueShopping;
}

function ResultFooter({
  activeOperation,
  canRefreshStatus,
  canRetryPayment,
  canViewOrder,
  disabled,
  hasRefreshStatusAdapter,
  hasRetryPaymentAdapter,
  isOffline,
  labelOverride,
  onBackToReview,
  onContinueShopping,
  onPrimaryAction,
  primaryActionKind,
}: {
  activeOperation:
    OrderPaymentResultOperation;
  canRefreshStatus: boolean;
  canRetryPayment: boolean;
  canViewOrder: boolean;
  disabled: boolean;
  hasRefreshStatusAdapter: boolean;
  hasRetryPaymentAdapter: boolean;
  isOffline: boolean;
  labelOverride?: string;
  onBackToReview?: () => void;
  onContinueShopping?: () => void;
  onPrimaryAction: () => void;
  primaryActionKind:
    OrderPaymentResultPrimaryAction;
}) {
  const label =
    labelOverride ??
    getPrimaryActionLabel({
      activeOperation,
      canRefreshStatus,
      canRetryPayment,
      canViewOrder,
      hasRefreshStatusAdapter,
      hasRetryPaymentAdapter,
      isOffline,
      kind: primaryActionKind,
    });

  const operationPending =
    activeOperation !== null;

  const primaryPending =
    activeOperation ===
    primaryActionKind;

  return (
    <footer className="sticky bottom-0 z-30 -mx-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[8px] sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-t-[20px] lg:border-x lg:px-4">
      <button
        className={`${focusRing} flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
        disabled={disabled}
        onClick={onPrimaryAction}
        type="button"
      >
        {primaryPending ? <Spinner /> : null}
        {label}
      </button>
      {primaryActionKind !==
        "continue-shopping" &&
      onContinueShopping ? (
        <button
          className={`${focusRing} mt-2 min-h-11 w-full rounded-full px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={operationPending}
          onClick={onContinueShopping}
          type="button"
        >
          {activeOperation ===
          "continue-shopping"
            ? copy.returningToStore
            : copy.continueShopping}
        </button>
      ) : null}
      {onBackToReview ? (
        <button
          className={`${focusRing} mt-1 min-h-11 w-full rounded-full px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={operationPending}
          onClick={onBackToReview}
          type="button"
        >
          {activeOperation === "back-review"
            ? copy.openingReview
            : copy.backToReview}
        </button>
      ) : null}
    </footer>
  );
}

function LoadingExperience({
  activeOperation,
  onBackToReview,
  onContinueShopping,
}: {
  activeOperation:
    OrderPaymentResultOperation;
  onBackToReview?: () => void;
  onContinueShopping: () => void;
}) {
  const operationPending =
    activeOperation !== null;

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-0 pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col">
        <TopBar
          disabled={operationPending}
          onBackToReview={onBackToReview}
        />
        <div
          aria-live="polite"
          className="mt-6"
          role="status"
        >
          <h1 className="font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">
            {copy.loadingHeading}
          </h1>
          <p className="mt-2 max-w-[580px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
            {copy.loadingSupporting}
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SkeletonBlock className="h-32" />
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-28 md:col-span-2" />
        </div>
        <div className="mt-auto pt-5">
          <ResultFooter
            activeOperation={activeOperation}
            canRefreshStatus={false}
            canRetryPayment={false}
            canViewOrder={false}
            disabled
            hasRefreshStatusAdapter={false}
            hasRetryPaymentAdapter={false}
            isOffline={false}
            labelOverride={copy.checkingStatus}
            onContinueShopping={onContinueShopping}
            onPrimaryAction={() => undefined}
            primaryActionKind="refresh-status"
          />
        </div>
      </div>
    </div>
  );
}

function ReadyExperience({
  activeOperation,
  canRefreshStatus,
  canRetryPayment,
  canViewOrder,
  hasRefreshStatusAdapter,
  hasRetryPaymentAdapter,
  isOffline,
  onBackToReview,
  onContinueShopping,
  onPrimaryAction,
  primaryActionDisabled,
  primaryActionKind,
  report,
}: {
  activeOperation:
    OrderPaymentResultOperation;
  canRefreshStatus: boolean;
  canRetryPayment: boolean;
  canViewOrder: boolean;
  hasRefreshStatusAdapter: boolean;
  hasRetryPaymentAdapter: boolean;
  isOffline: boolean;
  onBackToReview?: () => void;
  onContinueShopping: () => void;
  onPrimaryAction: () => void;
  primaryActionDisabled: boolean;
  primaryActionKind:
    OrderPaymentResultPrimaryAction;
  report: OrderPaymentResultReport;
}) {
  const operationPending =
    activeOperation !== null;

  const correctiveBack =
    (report.paymentStatus === "failed" ||
      report.paymentStatus ===
        "cancelled") &&
    onBackToReview
      ? onBackToReview
      : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-0 pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col">
        <TopBar
          disabled={operationPending}
          onBackToReview={onBackToReview}
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[56fr_44fr] lg:gap-10">
          <div>
            <StatusIllustration
              status={report.paymentStatus}
            />
            <StatusHeader report={report} />
            {report.paymentStatus ===
            "pending" ? (
              <PendingSafetyNote />
            ) : null}
            <div className="mt-4">
              <PaymentBoundaryNote />
            </div>
          </div>
          <div className="space-y-4">
            <PaymentStatusCard
              report={report}
            />
            <CompactOrderSummary
              report={report}
            />
            <DeliveryCard report={report} />
            <HostStatusNote
              label={
                report.hostStatusHelperLabel
              }
            />
          </div>
        </div>
        <div className="mt-auto pt-5">
          <ResultFooter
            activeOperation={activeOperation}
            canRefreshStatus={
              canRefreshStatus
            }
            canRetryPayment={
              canRetryPayment
            }
            canViewOrder={canViewOrder}
            disabled={primaryActionDisabled}
            hasRefreshStatusAdapter={
              hasRefreshStatusAdapter
            }
            hasRetryPaymentAdapter={
              hasRetryPaymentAdapter
            }
            isOffline={isOffline}
            onBackToReview={correctiveBack}
            onContinueShopping={
              onContinueShopping
            }
            onPrimaryAction={onPrimaryAction}
            primaryActionKind={
              primaryActionKind
            }
          />
        </div>
      </div>
    </div>
  );
}

function ErrorExperience({
  activeOperation,
  onBackToReview,
  onContinueShopping,
  onRetryLoad,
}: {
  activeOperation:
    OrderPaymentResultOperation;
  onBackToReview?: () => void;
  onContinueShopping: () => void;
  onRetryLoad?: () => void;
}) {
  const operationPending =
    activeOperation !== null;

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col">
        <TopBar
          disabled={operationPending}
          onBackToReview={onBackToReview}
        />
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--dl-error-surface)] text-[var(--dl-error-text)]">
            <WarningIcon className="h-9 w-9" />
          </div>
          <div className="mt-5" role="alert">
            <h1 className="font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">
              {copy.errorHeading}
            </h1>
            <p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
              {copy.errorSupporting}
            </p>
          </div>
          <div className="mt-6 flex max-w-[420px] flex-col gap-2">
            {onRetryLoad ? (
              <button
                className={`${focusRing} flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
                disabled={operationPending}
                onClick={onRetryLoad}
                type="button"
              >
                {activeOperation ===
                "retry-load" ? (
                  <Spinner />
                ) : null}
                {activeOperation ===
                "retry-load"
                  ? copy.retryingLoad
                  : copy.retryLoad}
              </button>
            ) : null}
            <button
              className={`${focusRing} min-h-11 rounded-full px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
              disabled={operationPending}
              onClick={onContinueShopping}
              type="button"
            >
              {activeOperation ===
              "continue-shopping"
                ? copy.returningToStore
                : copy.continueShopping}
            </button>
            {onBackToReview ? (
              <button
                className={`${focusRing} min-h-11 rounded-full px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
                disabled={operationPending}
                onClick={onBackToReview}
                type="button"
              >
                {activeOperation ===
                "back-review"
                  ? copy.openingReview
                  : copy.backToReview}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main
      className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]"
      style={themeStyle}
    >
      {children}
    </main>
  );
}

export default function OrderConfirmationAndPaymentResultScreen({
  state = "loading",
  report = null,
  isOffline = false,
  canViewOrder = true,
  canRefreshStatus = true,
  canRetryPayment = true,
  onViewOrder,
  onRefreshStatus,
  onRetryPayment,
  onContinueShopping,
  onBackToReview,
  onRetryLoad,
}: OrderConfirmationAndPaymentResultScreenProps) {
  const mountedRef = useRef(true);
  const inFlightRef = useRef<
    Exclude<
      OrderPaymentResultOperation,
      null
    > | null
  >(null);
  const [
    activeOperation,
    setActiveOperation,
  ] =
    useState<OrderPaymentResultOperation>(
      null,
    );
  const [toastMessage, setToastMessage] =
    useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(
      () => {
        if (mountedRef.current) {
          setToastMessage(null);
        }
      },
      5000,
    );

    return () =>
      window.clearTimeout(timeout);
  }, [toastMessage]);

  const effectiveState:
    OrderPaymentResultState =
    state === "ready" &&
    (
      report === null ||
      !hasRequiredPaymentResultMetadata(
        report,
      )
    )
      ? "error"
      : state;

  const hasRenderableResult =
    effectiveState === "ready" &&
    report !== null;

  const operationPending =
    activeOperation !== null;

  const hasStickyFooter =
    effectiveState === "loading" ||
    hasRenderableResult;

  const hasExpandedFooter =
    hasRenderableResult &&
    (report.paymentStatus === "failed" ||
      report.paymentStatus ===
        "cancelled") &&
    Boolean(onBackToReview);

  const toastFooterMode:
    OrderPaymentResultToastFooterMode =
    !hasStickyFooter
      ? "none"
      : hasExpandedFooter
        ? "expanded"
        : "compact";

  const runOperation = useCallback(
    async (
      operation: Exclude<
        OrderPaymentResultOperation,
        null
      >,
      callback: () => void | Promise<void>,
      failureMessage: string,
    ) => {
      if (inFlightRef.current !== null) {
        return;
      }

      inFlightRef.current = operation;
      if (mountedRef.current) {
        setActiveOperation(operation);
        setToastMessage(null);
      }

      try {
        await callback();
      } catch {
        if (mountedRef.current) {
          setToastMessage(failureMessage);
        }
      } finally {
        inFlightRef.current = null;
        if (mountedRef.current) {
          setActiveOperation(null);
        }
      }
    },
    [],
  );

  const handleContinueShopping =
    useCallback(() => {
      if (
        operationPending ||
        inFlightRef.current !== null
      ) {
        return;
      }

      void runOperation(
        "continue-shopping",
        onContinueShopping,
        copy.continueShoppingError,
      );
    }, [
      onContinueShopping,
      operationPending,
      runOperation,
    ]);

  const handleBackToReview =
    useCallback(() => {
      if (
        !onBackToReview ||
        operationPending ||
        inFlightRef.current !== null
      ) {
        return;
      }

      void runOperation(
        "back-review",
        onBackToReview,
        copy.backToReviewError,
      );
    }, [
      onBackToReview,
      operationPending,
      runOperation,
    ]);

  const handleRetryLoad =
    useCallback(() => {
      if (
        !onRetryLoad ||
        operationPending ||
        inFlightRef.current !== null
      ) {
        return;
      }

      void runOperation(
        "retry-load",
        onRetryLoad,
        copy.retryLoadError,
      );
    }, [
      onRetryLoad,
      operationPending,
      runOperation,
    ]);

  const handlePrimaryAction =
    useCallback(() => {
      if (
        !hasRenderableResult ||
        !report ||
        operationPending ||
        inFlightRef.current !== null
      ) {
        return;
      }

      const kind = getPrimaryActionKind({
        canViewOrder,
        hasViewOrderAdapter:
          Boolean(onViewOrder),
        report,
      });

      if (kind === "view-order") {
        if (
          !canViewOrder ||
          !onViewOrder ||
          !isReadableText(report.orderId)
        ) {
          return;
        }

        void runOperation(
          "view-order",
          () => onViewOrder(report.orderId as string),
          copy.viewOrderError,
        );
        return;
      }

      if (kind === "refresh-status") {
        if (
          !canRefreshStatus ||
          !onRefreshStatus
        ) {
          return;
        }

        void runOperation(
          "refresh-status",
          () =>
            onRefreshStatus(
              getPaymentResultActionSubmission(
                report,
              ),
            ),
          copy.refreshStatusError,
        );
        return;
      }

      if (kind === "retry-payment") {
        if (
          !canRetryPayment ||
          !onRetryPayment
        ) {
          return;
        }

        void runOperation(
          "retry-payment",
          () =>
            onRetryPayment(
              getPaymentResultActionSubmission(
                report,
              ),
            ),
          copy.retryPaymentError,
        );
        return;
      }

      void runOperation(
        "continue-shopping",
        onContinueShopping,
        copy.continueShoppingError,
      );
    }, [
      canRefreshStatus,
      canRetryPayment,
      canViewOrder,
      hasRenderableResult,
      onContinueShopping,
      onRefreshStatus,
      onRetryPayment,
      onViewOrder,
      operationPending,
      report,
      runOperation,
    ]);

  let primaryActionDisabled = false;

  if (hasRenderableResult && report) {
    const primaryActionKind =
      getPrimaryActionKind({
        canViewOrder,
        hasViewOrderAdapter:
          Boolean(onViewOrder),
        report,
      });

    primaryActionDisabled =
      operationPending ||
      (primaryActionKind === "view-order" &&
        (!canViewOrder ||
          !onViewOrder ||
          !isReadableText(report.orderId))) ||
      (primaryActionKind ===
        "refresh-status" &&
        (!canRefreshStatus ||
          !onRefreshStatus)) ||
      (primaryActionKind ===
        "retry-payment" &&
        (!canRetryPayment ||
          !onRetryPayment));
  }

  return (
    <AppShell>
      {effectiveState === "loading" ? (
        <LoadingExperience
          activeOperation={activeOperation}
          onBackToReview={
            onBackToReview
              ? handleBackToReview
              : undefined
          }
          onContinueShopping={
            handleContinueShopping
          }
        />
      ) : null}
      {hasRenderableResult && report ? (
        <ReadyExperience
          activeOperation={activeOperation}
          canRefreshStatus={
            canRefreshStatus
          }
          canRetryPayment={canRetryPayment}
          canViewOrder={canViewOrder}
          hasRefreshStatusAdapter={
            Boolean(onRefreshStatus)
          }
          hasRetryPaymentAdapter={
            Boolean(onRetryPayment)
          }
          isOffline={isOffline}
          onBackToReview={
            onBackToReview
              ? handleBackToReview
              : undefined
          }
          onContinueShopping={
            handleContinueShopping
          }
          onPrimaryAction={
            handlePrimaryAction
          }
          primaryActionDisabled={
            primaryActionDisabled
          }
          primaryActionKind={
            getPrimaryActionKind({
              canViewOrder,
              hasViewOrderAdapter:
                Boolean(onViewOrder),
              report,
            })
          }
          report={report}
        />
      ) : null}
      {effectiveState === "error" ? (
        <ErrorExperience
          activeOperation={activeOperation}
          onBackToReview={
            onBackToReview
              ? handleBackToReview
              : undefined
          }
          onContinueShopping={
            handleContinueShopping
          }
          onRetryLoad={
            onRetryLoad
              ? handleRetryLoad
              : undefined
          }
        />
      ) : null}
      <ToastRegion
        footerMode={toastFooterMode}
        message={toastMessage}
      />
    </AppShell>
  );
}
