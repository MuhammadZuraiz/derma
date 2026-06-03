import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type SecurePaymentGatewayHandoffState =
  | "loading"
  | "ready"
  | "expired"
  | "error";

export type SecurePaymentGatewayHandoffOperation =
  | "back"
  | "open-gateway"
  | "retry-prepare"
  | null;

export type PaymentGatewaySessionStatus =
  | "ready"
  | "blocked"
  | "expired";

export type PaymentGatewayBlockReason =
  | "review-required"
  | "payment-unavailable"
  | null;

export interface SecurePaymentGatewayHandoffReport {
  checkoutSessionId: string;
  reviewId: string;
  paymentSessionId: string;

  sessionStatus: PaymentGatewaySessionStatus;
  blockReason?: PaymentGatewayBlockReason;

  orderReferenceLabel?: string;

  itemCount: number;
  totalLabel: string;

  providerLabel: string;
  destinationDisplayLabel?: string;

  sessionExpiryLabel?: string;
  hostSecurityHelperLabel?: string;
}

export interface OpenPaymentGatewaySubmission {
  checkoutSessionId: string;
  reviewId: string;
  paymentSessionId: string;
}

export interface SecurePaymentGatewayHandoffScreenProps {
  state?: SecurePaymentGatewayHandoffState;
  report?: SecurePaymentGatewayHandoffReport | null;
  isOffline?: boolean;
  canOpenPaymentGateway?: boolean;
  onBack: () => void | Promise<void>;
  onOpenPaymentGateway: (
    submission: OpenPaymentGatewaySubmission,
  ) => void | Promise<void>;
  onRetryPrepare?: () => void | Promise<void>;
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

export function isGatewaySessionExpired(
  report: SecurePaymentGatewayHandoffReport,
): boolean {
  return report.sessionStatus === "expired";
}

export function hasGatewayBlockReason(
  report: SecurePaymentGatewayHandoffReport,
): boolean {
  return report.blockReason !== null && report.blockReason !== undefined;
}

function isReadableText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasRequiredGatewayMetadata(
  report: SecurePaymentGatewayHandoffReport,
): boolean {
  return [
    report.checkoutSessionId,
    report.reviewId,
    report.paymentSessionId,
    report.totalLabel,
    report.providerLabel,
  ].every(isReadableText);
}

export function getSafeDestinationDisplayLabel(value?: string): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const label = value.trim();

  if (!label) {
    return null;
  }

  const containsRawUrlSyntax =
    /^(?:https?:\/\/|\/\/|javascript:|data:|mailto:|tel:)/i.test(label) ||
    /[/?#\\]/.test(label);

  return containsRawUrlSyntax ? null : label;
}

export function canOpenPreparedGateway({
  canOpenPaymentGateway,
  report,
}: {
  canOpenPaymentGateway: boolean;
  report: SecurePaymentGatewayHandoffReport;
}): boolean {
  return (
    canOpenPaymentGateway &&
    report.sessionStatus === "ready" &&
    !hasGatewayBlockReason(report) &&
    hasRequiredGatewayMetadata(report) &&
    normaliseNonNegativeInteger(report.itemCount) > 0
  );
}

export const copy = {
  contextLabel: "SECURE PAYMENT",
  back: "Back",
  backToReview: "Back to order review",
  secureCheckout: "Secure checkout",
  heading: "Continue to secure payment",
  supporting:
    "You are about to leave DermaLens to complete payment through a secure payment page.",
  noCardDetailsHere:
    "DermaLens will never ask you to enter card details on this screen.",
  returnAfterPayment:
    "After payment, return to DermaLens to view your order status.",
  externalHandoff:
    "Your payment details will be entered on the secure payment page, not inside DermaLens.",
  orderSummary: "Order summary",
  orderReference: "Order reference",
  items: "Items",
  total: "Total",
  paymentProvider: "Secure payment provider",
  paymentPage: "Payment page",
  continuePayment: "Continue to secure payment",
  openingPayment: "Opening secure payment…",
  reconnectToContinue: "Reconnect to continue",
  paymentUnavailable: "Payment unavailable right now",
  reviewRequired: "Review your order to continue",
  loadingHeading: "Preparing secure payment…",
  loadingSupporting:
    "We are preparing a secure payment session for your order.",
  expiredHeading: "Your payment session expired",
  expiredSupporting:
    "Prepare a new secure payment session to continue with this order.",
  errorHeading: "We could not prepare secure payment",
  errorSupporting:
    "Try preparing secure payment again or return to your order review.",
  retry: "Prepare secure payment again",
  retrying: "Preparing secure payment…",
  backError:
    "We could not return to your order review. Please try again.",
  gatewayError: "We could not open secure payment. Please try again.",
  retryError: "We could not prepare secure payment. Please try again.",
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

function ShieldLockIcon({ className = "h-7 w-7" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 32 32">
      <path d="M16 3.8 26 7.5v7.4c0 6.2-3.8 10.6-10 13.3C9.8 25.5 6 21.1 6 14.9V7.5L16 3.8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <rect height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="9" x="11.5" y="14" />
      <path d="M13.5 14v-1.5a2.5 2.5 0 0 1 5 0V14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
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
    ? "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_145px)]"
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

function TopBar({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
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

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--dl-parchment)] motion-reduce:animate-none ${className}`} />;
}

function TrustIllustration() {
  return (
    <div aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[var(--dl-parchment)] text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.05)]">
      <ShieldLockIcon className="h-12 w-12" />
    </div>
  );
}

function SecurityCard() {
  return (
    <section className="rounded-[18px] bg-[var(--dl-blush)] p-4 text-sm leading-5 text-[var(--dl-text-secondary)]">
      <div className="flex items-start gap-3">
        <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--dl-peach-strong)]" />
        <div>
          <p className="font-semibold text-[var(--dl-text-primary)]">{copy.noCardDetailsHere}</p>
          <p className="mt-2">{copy.returnAfterPayment}</p>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-sm leading-5">
      <dt className="text-[var(--dl-text-secondary)]">{label}</dt>
      <dd className="text-right font-semibold text-[var(--dl-text-primary)]">{value}</dd>
    </div>
  );
}

function CompactOrderSummary({ report }: { report: SecurePaymentGatewayHandoffReport }) {
  return (
    <section aria-labelledby="payment-order-summary-heading" className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-4">
      <h2 className="text-[18px] font-semibold leading-6 text-[var(--dl-text-primary)]" id="payment-order-summary-heading">
        {copy.orderSummary}
      </h2>
      <dl className="mt-3 space-y-2">
        {report.orderReferenceLabel?.trim() ? <SummaryRow label={copy.orderReference} value={report.orderReferenceLabel} /> : null}
        <SummaryRow label={copy.items} value={formatCartItemCount(report.itemCount)} />
        <SummaryRow label={copy.total} value={report.totalLabel} />
      </dl>
    </section>
  );
}

function GatewayCard({ report }: { report: SecurePaymentGatewayHandoffReport }) {
  const safeDestinationLabel = getSafeDestinationDisplayLabel(
    report.destinationDisplayLabel,
  );

  return (
    <section aria-labelledby="payment-gateway-heading" className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <h2 className="text-[18px] font-semibold leading-6 text-[var(--dl-text-primary)]" id="payment-gateway-heading">
        {copy.paymentProvider}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{report.providerLabel}</p>
      {safeDestinationLabel ? (
        <div className="mt-3 border-t border-[var(--dl-border-subtle)] pt-3">
          <p className="text-[12px] font-semibold leading-4 text-[var(--dl-text-secondary)]">{copy.paymentPage}</p>
          <p className="mt-1 text-sm leading-5 text-[var(--dl-text-primary)]">{safeDestinationLabel}</p>
        </div>
      ) : null}
      {report.sessionExpiryLabel?.trim() ? <p className="mt-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{report.sessionExpiryLabel}</p> : null}
      {report.hostSecurityHelperLabel?.trim() ? <p className="mt-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{report.hostSecurityHelperLabel}</p> : null}
    </section>
  );
}

function ExternalHandoffNote() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-[var(--dl-surface-soft)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <LockIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <span>{copy.externalHandoff}</span>
    </p>
  );
}

export function getGatewayButtonLabel({
  activeOperation,
  canOpenPaymentGateway,
  isOffline,
  report,
}: {
  activeOperation: SecurePaymentGatewayHandoffOperation;
  canOpenPaymentGateway: boolean;
  isOffline: boolean;
  report: SecurePaymentGatewayHandoffReport;
}): string {
  if (activeOperation === "open-gateway") {
    return copy.openingPayment;
  }

  if (report.sessionStatus === "expired") {
    return copy.retry;
  }

  if (!hasRequiredGatewayMetadata(report)) {
    return copy.paymentUnavailable;
  }

  if (report.blockReason === "review-required") {
    return copy.reviewRequired;
  }

  if (report.blockReason === "payment-unavailable" || report.sessionStatus === "blocked") {
    return copy.paymentUnavailable;
  }

  if (normaliseNonNegativeInteger(report.itemCount) === 0) {
    return copy.reviewRequired;
  }

  if (hasGatewayBlockReason(report)) {
    return copy.paymentUnavailable;
  }

  if (report.sessionStatus !== "ready") {
    return copy.paymentUnavailable;
  }

  if (!canOpenPaymentGateway) {
    return isOffline ? copy.reconnectToContinue : copy.paymentUnavailable;
  }

  return copy.continuePayment;
}

function HandoffFooter({
  activeOperation,
  canOpenPaymentGateway,
  disabled,
  isOffline,
  labelOverride,
  onBack,
  onOpenGateway,
  report,
  totalLabel,
}: {
  activeOperation: SecurePaymentGatewayHandoffOperation;
  canOpenPaymentGateway: boolean;
  disabled: boolean;
  isOffline: boolean;
  labelOverride?: string;
  onBack: () => void;
  onOpenGateway: () => void;
  report?: SecurePaymentGatewayHandoffReport;
  totalLabel?: string;
}) {
  const label = labelOverride ?? (report ? getGatewayButtonLabel({ activeOperation, canOpenPaymentGateway, isOffline, report }) : copy.continuePayment);

  return (
    <footer className="sticky bottom-0 z-30 -mx-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[8px] sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-t-[20px] lg:border-x lg:px-4">
      {totalLabel?.trim() ? <p className="mb-2 text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{totalLabel}</p> : null}
      <button
        className={`${focusRing} flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
        disabled={disabled}
        onClick={onOpenGateway}
        type="button"
      >
        {activeOperation === "open-gateway" ? <Spinner /> : null}
        {label}
      </button>
      <button
        className={`${focusRing} mt-2 min-h-11 w-full rounded-full px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={activeOperation !== null}
        onClick={onBack}
        type="button"
      >
        {copy.backToReview}
      </button>
    </footer>
  );
}

function LoadingExperience({
  activeOperation,
  onBack,
}: {
  activeOperation: SecurePaymentGatewayHandoffOperation;
  onBack: () => void;
}) {
  const operationPending = activeOperation !== null;

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-0 pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col">
        <TopBar disabled={operationPending} onBack={onBack} />
        <div aria-live="polite" role="status">
          <h1 className="mt-5 font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">
            {copy.loadingHeading}
          </h1>
          <p className="mt-2 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.loadingSupporting}</p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[56fr_44fr]">
          <div className="space-y-4">
            <SkeletonBlock className="h-32" />
            <SkeletonBlock className="h-36" />
          </div>
          <div className="space-y-4">
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-36" />
          </div>
        </div>
        <div className="mt-auto pt-5">
          <HandoffFooter
            activeOperation={activeOperation}
            canOpenPaymentGateway={false}
            disabled
            isOffline={false}
            labelOverride={copy.continuePayment}
            onBack={onBack}
            onOpenGateway={() => undefined}
          />
        </div>
      </div>
    </div>
  );
}

function ReadyExperience({
  activeOperation,
  canOpenPaymentGateway,
  isOffline,
  onBack,
  onOpenGateway,
  report,
}: {
  activeOperation: SecurePaymentGatewayHandoffOperation;
  canOpenPaymentGateway: boolean;
  isOffline: boolean;
  onBack: () => void;
  onOpenGateway: () => void;
  report: SecurePaymentGatewayHandoffReport;
}) {
  const operationPending = activeOperation !== null;
  const primaryDisabled = operationPending || !canOpenPreparedGateway({ canOpenPaymentGateway, report });

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-0 pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col">
        <TopBar disabled={operationPending} onBack={onBack} />
        <div className="mt-6 grid gap-6 lg:grid-cols-[56fr_44fr] lg:gap-10">
          <div>
            <TrustIllustration />
            <h1 className="mt-5 max-w-[520px] font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">
              {copy.heading}
            </h1>
            <p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.supporting}</p>
            <div className="mt-5">
              <SecurityCard />
            </div>
            <div className="mt-4">
              <ExternalHandoffNote />
            </div>
          </div>
          <div className="space-y-4">
            <CompactOrderSummary report={report} />
            <GatewayCard report={report} />
          </div>
        </div>
        <div className="mt-auto pt-5">
          <HandoffFooter
            activeOperation={activeOperation}
            canOpenPaymentGateway={canOpenPaymentGateway}
            disabled={primaryDisabled}
            isOffline={isOffline}
            onBack={onBack}
            onOpenGateway={onOpenGateway}
            report={report}
            totalLabel={report.totalLabel}
          />
        </div>
      </div>
    </div>
  );
}

function RecoveryExperience({
  activeOperation,
  kind,
  onBack,
  onRetryPrepare,
  report,
}: {
  activeOperation: SecurePaymentGatewayHandoffOperation;
  kind: "expired" | "error";
  onBack: () => void;
  onRetryPrepare?: () => void;
  report?: SecurePaymentGatewayHandoffReport | null;
}) {
  const operationPending = activeOperation !== null;
  const heading = kind === "expired" ? copy.expiredHeading : copy.errorHeading;
  const supporting = kind === "expired" ? copy.expiredSupporting : copy.errorSupporting;

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col">
        <TopBar disabled={operationPending} onBack={onBack} />
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]">
            <WarningIcon className="h-9 w-9" />
          </div>
          {kind === "error" ? (
            <div className="mt-5" role="alert">
              <h1 className="font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{heading}</h1>
              <p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{supporting}</p>
            </div>
          ) : (
            <div className="mt-5">
              <h1 className="font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{heading}</h1>
              <p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{supporting}</p>
            </div>
          )}
          {kind === "expired" && report ? (
            <div className="mt-5 max-w-[520px]">
              <CompactOrderSummary report={report} />
            </div>
          ) : null}
          <div className="mt-6 flex max-w-[420px] flex-col gap-2">
            {onRetryPrepare ? (
              <button
                className={`${focusRing} flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
                disabled={operationPending}
                onClick={onRetryPrepare}
                type="button"
              >
                {activeOperation === "retry-prepare" ? <Spinner /> : null}
                {activeOperation === "retry-prepare" ? copy.retrying : copy.retry}
              </button>
            ) : null}
            <button
              className={`${focusRing} min-h-11 rounded-full px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
              disabled={operationPending}
              onClick={onBack}
              type="button"
            >
              {copy.backToReview}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]" style={themeStyle}>
      {children}
    </main>
  );
}

export default function SecurePaymentGatewayHandoffScreen({
  state = "loading",
  report = null,
  isOffline = false,
  canOpenPaymentGateway = true,
  onBack,
  onOpenPaymentGateway,
  onRetryPrepare,
}: SecurePaymentGatewayHandoffScreenProps) {
  const mountedRef = useRef(true);
  const inFlightRef = useRef<Exclude<SecurePaymentGatewayHandoffOperation, null> | null>(null);
  const [activeOperation, setActiveOperation] = useState<SecurePaymentGatewayHandoffOperation>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

    const timeout = window.setTimeout(() => {
      if (mountedRef.current) {
        setToastMessage(null);
      }
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const effectiveState: SecurePaymentGatewayHandoffState =
    state === "ready" && report === null
      ? "error"
      : state === "ready" && report !== null && isGatewaySessionExpired(report)
        ? "expired"
        : state === "ready" && report !== null && !hasRequiredGatewayMetadata(report)
          ? "error"
          : state;

  const hasRenderableHandoff = effectiveState === "ready" && report !== null;
  const operationPending = activeOperation !== null;
  const hasStickyFooter = effectiveState === "loading" || hasRenderableHandoff;

  const runOperation = useCallback(
    async (
      operation: Exclude<SecurePaymentGatewayHandoffOperation, null>,
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

  const handleBack = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) {
      return;
    }

    void runOperation("back", onBack, copy.backError);
  }, [onBack, operationPending, runOperation]);

  const handleRetryPrepare = useCallback(() => {
    if (!onRetryPrepare || operationPending || inFlightRef.current !== null) {
      return;
    }

    void runOperation("retry-prepare", onRetryPrepare, copy.retryError);
  }, [onRetryPrepare, operationPending, runOperation]);

  const handleOpenGateway = useCallback(() => {
    if (
      !hasRenderableHandoff ||
      !report ||
      !canOpenPreparedGateway({ canOpenPaymentGateway, report }) ||
      operationPending ||
      inFlightRef.current !== null
    ) {
      return;
    }

    void runOperation(
      "open-gateway",
      () =>
        onOpenPaymentGateway({
          checkoutSessionId: report.checkoutSessionId,
          reviewId: report.reviewId,
          paymentSessionId: report.paymentSessionId,
        }),
      copy.gatewayError,
    );
  }, [canOpenPaymentGateway, hasRenderableHandoff, onOpenPaymentGateway, operationPending, report, runOperation]);

  return (
    <AppShell>
      {effectiveState === "loading" ? (
        <LoadingExperience activeOperation={activeOperation} onBack={handleBack} />
      ) : null}
      {hasRenderableHandoff && report ? (
        <ReadyExperience
          activeOperation={activeOperation}
          canOpenPaymentGateway={canOpenPaymentGateway}
          isOffline={isOffline}
          onBack={handleBack}
          onOpenGateway={handleOpenGateway}
          report={report}
        />
      ) : null}
      {effectiveState === "expired" ? (
        <RecoveryExperience
          activeOperation={activeOperation}
          kind="expired"
          onBack={handleBack}
          onRetryPrepare={onRetryPrepare ? handleRetryPrepare : undefined}
          report={report}
        />
      ) : null}
      {effectiveState === "error" ? (
        <RecoveryExperience
          activeOperation={activeOperation}
          kind="error"
          onBack={handleBack}
          onRetryPrepare={onRetryPrepare ? handleRetryPrepare : undefined}
        />
      ) : null}
      <ToastRegion aboveStickyFooter={hasStickyFooter} message={toastMessage} />
    </AppShell>
  );
}
