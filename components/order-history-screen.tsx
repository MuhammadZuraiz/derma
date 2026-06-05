"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type OrderHistoryState =
  | "loading"
  | "ready"
  | "empty"
  | "error";

export type OrderHistoryOperation =
  | "back"
  | "open-order"
  | "load-more"
  | "retry-load"
  | null;

export type OrderHistoryStatusTone =
  | "neutral"
  | "attention"
  | "caution";

export interface OrderHistoryItem {
  orderId: string;
  orderReferenceLabel: string;
  statusLabel: string;
  placedAtLabel?: string;
  itemSummaryLabel?: string;
  totalLabel?: string;
  supporting?: string;
  statusTone?: OrderHistoryStatusTone;
  canOpenOrder?: boolean;
}

export interface OrderHistoryReport {
  orders: OrderHistoryItem[];
  helperLabel?: string;
  privacyLabel?: string;
  loadMoreLabel?: string;
  hasMoreOrders?: boolean;
}

export interface OrderHistoryScreenProps {
  state?: OrderHistoryState;
  report?: OrderHistoryReport | null;
  isOffline?: boolean;
  canGoBack?: boolean;
  canOpenOrders?: boolean;
  canLoadMore?: boolean;
  isLoadMoreAvailableOffline?: boolean;
  onBack: () => void | Promise<void>;
  onOpenOrder?: (
    orderId: string,
  ) => void | Promise<void>;
  onLoadMore?: () => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export function isOrderHistoryState(
  value: unknown,
): value is OrderHistoryState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "empty" ||
    value === "error"
  );
}

export function isOrderHistoryStatusTone(
  value: unknown,
): value is OrderHistoryStatusTone {
  return (
    value === "neutral" ||
    value === "attention" ||
    value === "caution"
  );
}

function isNonWhitespaceString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function getRecord(
  value: unknown,
): Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object"
  )
    ? value as Record<string, unknown>
    : {};
}

export function hasUsableOrderHistoryReport(
  report:
    | OrderHistoryReport
    | null
    | undefined,
): report is OrderHistoryReport {
  return (
    report !== null &&
    report !== undefined &&
    Array.isArray(report.orders)
  );
}

export const copy = {
  wordmark: "DermaLens",
  contextLabel: "FIRST-PARTY ORDERS",
  back: "Back",
  backBlocked: "Back unavailable",
  backPending: "Going back...",
  heading: "Your orders",
  supporting:
    "Review your first-party DermaLens orders and open a detailed view when you need more information.",
  trustHeading: "First-party orders",
  trustCopy:
    "Order references, status labels, and availability are supplied by the host.",
  loadingHeading: "Preparing your orders",
  loadingSupporting:
    "Your first-party order history is being prepared.",
  errorHeading: "We could not load your orders",
  errorSupporting:
    "Try loading the order history again.",
  emptyHeading: "No orders available yet",
  emptySupporting:
    "Your first-party DermaLens orders will appear here when the host supplies them.",
  offline:
    "You appear to be offline. Supplied order history remains readable. The host controls which actions remain available.",
  orderReferenceFallback:
    "Order reference unavailable",
  statusFallback: "Status unavailable",
  placedAt: "Placed",
  orderSummary: "Order summary",
  orderTotal: "Order total",
  viewOrder: "View order details",
  openOrderPending: "Opening order...",
  orderBlocked:
    "Order details unavailable right now",
  loadMoreDefault: "Load more orders",
  loadMorePending:
    "Loading more orders...",
  loadMoreBlocked:
    "More orders unavailable right now",
  loadMoreReconnect:
    "Reconnect to load more orders",
  retryLoad: "Try again",
  retryPending: "Trying again...",
  helperFallback:
    "Order history stays host-owned. Use order details when the host makes a specific order route available.",
  privacyFallback:
    "DermaLens keeps this first-party order list readable without requesting account creation here.",
  backError:
    "We could not go back. Please try again.",
  openOrderError:
    "We could not open the order details. Please try again.",
  loadMoreError:
    "We could not load more orders. Please try again.",
  retryError:
    "We could not reload order history. Please try again.",
  loadMoreSuccess:
    "More-order request completed.",
} as const;

const colors = {
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

const fonts = {
  display:
    '"DM Serif Display", Georgia, serif',
  ui:
    '"DM Sans", system-ui, sans-serif',
  metadata:
    '"Space Mono", monospace',
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
  "--dl-ui": fonts.ui,
  "--dl-display": fonts.display,
  "--dl-metadata": fonts.metadata,
} as CSSProperties;

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

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

function BoxIcon({
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
        d="M4.5 8.5 12 4l7.5 4.5v7.8L12 20.5 4.5 16.3V8.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4.8 8.7 12 13l7.2-4.3M12 13v7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function displayString(
  value: unknown,
): string | null {
  return isNonWhitespaceString(value)
    ? value.trim()
    : null;
}

function getUniqueUsableOrderIds(
  orders: unknown[],
): ReadonlySet<string> {
  const counts = new Map<string, number>();

  for (const item of orders) {
    const safeOrder = getRecord(item);

    if (
      !isNonWhitespaceString(
        safeOrder.orderId,
      )
    ) {
      continue;
    }

    counts.set(
      safeOrder.orderId,
      (
        counts.get(safeOrder.orderId) ??
        0
      ) + 1,
    );
  }

  const uniqueIds = new Set<string>();

  for (const [orderId, count] of counts) {
    if (count === 1) {
      uniqueIds.add(orderId);
    }
  }

  return uniqueIds;
}

function getToneClasses(
  tone: OrderHistoryStatusTone,
): string {
  if (tone === "attention") {
    return "border-[var(--dl-blush-strong)] bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]";
  }

  if (tone === "caution") {
    return "border-[var(--dl-peach-strong)] bg-[var(--dl-error-surface)] text-[var(--dl-error-text)]";
  }

  return "border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] text-[var(--dl-bark)]";
}

function Shell({
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

function TopBar({
  activeOperation,
  canGoBack,
  onBack,
}: {
  activeOperation: OrderHistoryOperation;
  canGoBack: boolean;
  onBack: () => void;
}) {
  const isPending = activeOperation === "back";
  const isBlocked =
    !canGoBack || activeOperation !== null;
  const label = isPending
    ? copy.backPending
    : canGoBack
      ? copy.back
      : copy.backBlocked;

  return (
    <div className="grid min-h-12 grid-cols-[minmax(88px,1fr)_auto_minmax(88px,1fr)] items-center gap-3">
      <button
        aria-label={label}
        className={`${focusRing} flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold leading-5 text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={isBlocked}
        onClick={onBack}
        type="button"
      >
        {isPending ? (
          <Spinner />
        ) : (
          <ArrowLeftIcon />
        )}
        <span className="sr-only">{label}</span>
      </button>
      <p className="text-center font-[family-name:var(--dl-display)] text-[22px] leading-7 text-[var(--dl-bark)]">
        {copy.wordmark}
      </p>
      <p className="text-right font-[family-name:var(--dl-metadata)] text-[10px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </p>
    </div>
  );
}

function ToastRegion({
  notice,
}: {
  notice: string | null;
}) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 bottom-[max(24px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${
        notice
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0"
      }`}
      data-testid="toast-region"
      role="status"
      style={themeStyle}
    >
      {notice ?? ""}
    </div>
  );
}

function LoadingExperience({
  activeOperation,
  canGoBack,
  onBack,
}: {
  activeOperation: OrderHistoryOperation;
  canGoBack: boolean;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[980px] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <TopBar
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={onBack}
      />
      <div
        aria-live="polite"
        className="mt-8"
        role="status"
      >
        <h1 className="font-[family-name:var(--dl-display)] text-[38px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[34px]">
          {copy.loadingHeading}
        </h1>
        <p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
          {copy.loadingSupporting}
        </p>
      </div>
      <div
        aria-hidden="true"
        className="mt-8 space-y-4"
      >
        <div className="h-32 animate-pulse rounded-[18px] bg-[var(--dl-parchment)] motion-reduce:animate-none" />
        <div className="h-28 animate-pulse rounded-[18px] bg-[var(--dl-parchment)] motion-reduce:animate-none" />
        <div className="h-28 animate-pulse rounded-[18px] bg-[var(--dl-parchment)] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

function ErrorExperience({
  activeOperation,
  canGoBack,
  onBack,
  onRetry,
}: {
  activeOperation: OrderHistoryOperation;
  canGoBack: boolean;
  onBack: () => void;
  onRetry?: () => void;
}) {
  const operationPending =
    activeOperation !== null;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[760px] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <TopBar
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={onBack}
      />
      <div className="flex flex-1 flex-col justify-center py-10">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--dl-error-surface)] text-[var(--dl-error-text)]">
          <BoxIcon className="h-9 w-9" />
        </div>
        <div className="mt-5" role="alert">
          <h1 className="font-[family-name:var(--dl-display)] text-[38px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[34px]">
            {copy.errorHeading}
          </h1>
          <p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
            {copy.errorSupporting}
          </p>
        </div>
        {onRetry ? (
          <button
            className={`${focusRing} mt-6 flex min-h-[52px] max-w-[360px] items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
            disabled={operationPending}
            onClick={onRetry}
            type="button"
          >
            {activeOperation ===
            "retry-load" ? (
              <Spinner />
            ) : null}
            {activeOperation ===
            "retry-load"
              ? copy.retryPending
              : copy.retryLoad}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OfflineBanner({
  isOffline,
}: {
  isOffline: boolean;
}) {
  if (!isOffline) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="mt-5 rounded-[16px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)]"
      role="status"
    >
      {copy.offline}
    </div>
  );
}

function TrustCard() {
  return (
    <section
      className="mt-5 rounded-[16px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-4 py-3"
      data-testid="first-party-trust-card"
    >
      <h2 className="text-[17px] font-semibold leading-6 text-[var(--dl-bark)]">
        {copy.trustHeading}
      </h2>
      <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {copy.trustCopy}
      </p>
    </section>
  );
}

function EmptyOrdersCard() {
  return (
    <section
      className="rounded-[18px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-4 text-[var(--dl-bark)]"
      data-testid="empty-order-history-card"
    >
      <h2 className="text-[20px] font-semibold leading-7">
        {copy.emptyHeading}
      </h2>
      <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {copy.emptySupporting}
      </p>
    </section>
  );
}

function OrderCard({
  activeOperation,
  activeTargetOrderId,
  canOpenOrders,
  item,
  onOpenOrder,
  uniqueUsableOrderIds,
}: {
  activeOperation: OrderHistoryOperation;
  activeTargetOrderId: string | null;
  canOpenOrders: boolean;
  item: unknown;
  onOpenOrder: (orderId: string) => void;
  uniqueUsableOrderIds: ReadonlySet<string>;
}) {
  const safeOrder = getRecord(item);
  const orderId = displayString(
    safeOrder.orderId,
  );
  const referenceLabel =
    displayString(
      safeOrder.orderReferenceLabel,
    ) ?? copy.orderReferenceFallback;
  const statusLabel =
    displayString(
      safeOrder.statusLabel,
    ) ?? copy.statusFallback;
  const placedAtLabel = displayString(
    safeOrder.placedAtLabel,
  );
  const itemSummaryLabel = displayString(
    safeOrder.itemSummaryLabel,
  );
  const totalLabel = displayString(
    safeOrder.totalLabel,
  );
  const supporting = displayString(
    safeOrder.supporting,
  );
  const tone = isOrderHistoryStatusTone(
    safeOrder.statusTone,
  )
    ? safeOrder.statusTone
    : "neutral";
  const hasUniqueUsableOrderId =
    orderId !== null &&
    uniqueUsableOrderIds.has(orderId);
  const isPending =
    activeOperation === "open-order" &&
    activeTargetOrderId === orderId;
  const operationPending =
    activeOperation !== null;
  const isOpenEnabled =
    canOpenOrders &&
    safeOrder.canOpenOrder !== false &&
    hasUniqueUsableOrderId &&
    !operationPending;
  const visibleButtonLabel = isPending
    ? copy.openOrderPending
    : isOpenEnabled
      ? copy.viewOrder
      : copy.orderBlocked;
  const accessibleButtonLabel =
    `${visibleButtonLabel}: ${referenceLabel}`;

  return (
    <li
      className={`rounded-[18px] border p-4 ${getToneClasses(tone)}`}
      data-testid="order-history-card"
      data-tone={tone}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
            {copy.trustHeading}
          </p>
          <h2 className="mt-1 text-[20px] font-semibold leading-7 text-[var(--dl-text-primary)]">
            {referenceLabel}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-[var(--dl-bark)]">
            {statusLabel}
          </p>
          {placedAtLabel ? (
            <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
              {copy.placedAt}: {placedAtLabel}
            </p>
          ) : null}
          {itemSummaryLabel ? (
            <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
              {copy.orderSummary}: {itemSummaryLabel}
            </p>
          ) : null}
          {totalLabel ? (
            <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
              {copy.orderTotal}: {totalLabel}
            </p>
          ) : null}
          {supporting ? (
            <p className="mt-3 text-sm leading-5 text-[var(--dl-text-secondary)]">
              {supporting}
            </p>
          ) : null}
        </div>
        <button
          aria-label={accessibleButtonLabel}
          className={`${focusRing} flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--dl-bark)] px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)]`}
          disabled={!isOpenEnabled}
          onClick={() => {
            if (!isOpenEnabled || orderId === null) {
              return;
            }

            onOpenOrder(orderId);
          }}
          type="button"
        >
          {isPending ? <Spinner /> : null}
          {visibleButtonLabel}
        </button>
      </div>
    </li>
  );
}

function OrderList({
  activeOperation,
  activeTargetOrderId,
  canOpenOrders,
  onOpenOrder,
  orders,
}: {
  activeOperation: OrderHistoryOperation;
  activeTargetOrderId: string | null;
  canOpenOrders: boolean;
  onOpenOrder: (orderId: string) => void;
  orders: unknown[];
}) {
  if (orders.length === 0) {
    return <EmptyOrdersCard />;
  }

  const uniqueUsableOrderIds =
    getUniqueUsableOrderIds(orders);

  return (
    <ol className="space-y-4">
      {orders.map((order, index) => (
        <OrderCard
          activeOperation={activeOperation}
          activeTargetOrderId={
            activeTargetOrderId
          }
          canOpenOrders={canOpenOrders}
          item={order}
          key={`order-history-${index}`}
          onOpenOrder={onOpenOrder}
          uniqueUsableOrderIds={
            uniqueUsableOrderIds
          }
        />
      ))}
    </ol>
  );
}

function HelperCard({
  helperLabel,
  privacyLabel,
}: {
  helperLabel?: string;
  privacyLabel?: string;
}) {
  return (
    <section className="rounded-[18px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-4">
      <h2 className="text-[17px] font-semibold leading-6 text-[var(--dl-bark)]">
        {copy.trustHeading}
      </h2>
      <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {displayString(helperLabel) ??
          copy.helperFallback}
      </p>
      <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {displayString(privacyLabel) ??
          copy.privacyFallback}
      </p>
    </section>
  );
}

function LoadMoreAction({
  activeOperation,
  canLoadMore,
  isBlockedByOffline,
  isEnabled,
  label,
  onLoadMore,
  visible,
}: {
  activeOperation: OrderHistoryOperation;
  canLoadMore: boolean;
  isBlockedByOffline: boolean;
  isEnabled: boolean;
  label: string;
  onLoadMore: () => void;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  const buttonLabel =
    activeOperation === "load-more"
      ? copy.loadMorePending
      : isEnabled
        ? label
        : !canLoadMore
          ? copy.loadMoreBlocked
          : isBlockedByOffline
            ? copy.loadMoreReconnect
            : copy.loadMoreBlocked;

  return (
    <div className="pt-1">
      <button
        className={`${focusRing} flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] sm:max-w-[360px]`}
        disabled={!isEnabled}
        onClick={onLoadMore}
        type="button"
      >
        {activeOperation ===
        "load-more" ? (
          <Spinner />
        ) : null}
        {buttonLabel}
      </button>
    </div>
  );
}

function ReadyExperience({
  activeOperation,
  activeTargetOrderId,
  canGoBack,
  canLoadMore,
  canOpenOrders,
  isLoadMoreBlockedByOffline,
  isLoadMoreEnabled,
  isOffline,
  loadMoreLabel,
  loadMoreVisible,
  onBack,
  onLoadMore,
  onOpenOrder,
  report,
  showEmptyOrders,
}: {
  activeOperation: OrderHistoryOperation;
  activeTargetOrderId: string | null;
  canGoBack: boolean;
  canLoadMore: boolean;
  canOpenOrders: boolean;
  isLoadMoreBlockedByOffline: boolean;
  isLoadMoreEnabled: boolean;
  isOffline: boolean;
  loadMoreLabel: string;
  loadMoreVisible: boolean;
  onBack: () => void;
  onLoadMore: () => void;
  onOpenOrder: (orderId: string) => void;
  report: OrderHistoryReport | null;
  showEmptyOrders: boolean;
}) {
  const orders = showEmptyOrders
    ? []
    : report?.orders ?? [];

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[1040px] px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <TopBar
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={onBack}
      />
      <header className="mt-7">
        <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
          {copy.contextLabel}
        </p>
        <h1 className="mt-2 font-[family-name:var(--dl-display)] text-[42px] leading-[44px] text-[var(--dl-text-primary)] max-[374px]:text-[36px]">
          {copy.heading}
        </h1>
        <p className="mt-3 max-w-[620px] text-[15px] leading-[23px] text-[var(--dl-text-secondary)]">
          {copy.supporting}
        </p>
      </header>
      <OfflineBanner isOffline={isOffline} />
      <TrustCard />
      <div className="mt-6 space-y-5">
        <OrderList
          activeOperation={activeOperation}
          activeTargetOrderId={
            activeTargetOrderId
          }
          canOpenOrders={canOpenOrders}
          onOpenOrder={onOpenOrder}
          orders={orders}
        />
        <LoadMoreAction
          activeOperation={activeOperation}
          canLoadMore={canLoadMore}
          isBlockedByOffline={
            isLoadMoreBlockedByOffline
          }
          isEnabled={isLoadMoreEnabled}
          label={loadMoreLabel}
          onLoadMore={onLoadMore}
          visible={loadMoreVisible}
        />
        <HelperCard
          helperLabel={report?.helperLabel}
          privacyLabel={report?.privacyLabel}
        />
      </div>
    </div>
  );
}

export default function OrderHistoryScreen({
  state = "loading",
  report = null,
  isOffline = false,
  canGoBack = true,
  canOpenOrders = true,
  canLoadMore = true,
  isLoadMoreAvailableOffline = false,
  onBack,
  onOpenOrder,
  onLoadMore,
  onRetryLoad,
}: OrderHistoryScreenProps) {
  const mountedRef = useRef(true);
  const inFlightRef = useRef<
    Exclude<OrderHistoryOperation, null> | null
  >(null);
  const [
    activeOperation,
    setActiveOperation,
  ] =
    useState<OrderHistoryOperation>(
      null,
    );
  const [
    activeTargetOrderId,
    setActiveTargetOrderId,
  ] = useState<string | null>(null);
  const [toastNotice, setToastNotice] =
    useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastNotice) {
      return;
    }

    const timeout = window.setTimeout(
      () => {
        if (mountedRef.current) {
          setToastNotice(null);
        }
      },
      5000,
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toastNotice]);

  const runtimeState = isOrderHistoryState(
    state,
  )
    ? state
    : "error";
  const hasUsableReport =
    hasUsableOrderHistoryReport(report);
  const effectiveState =
    runtimeState === "ready" &&
    !hasUsableReport
      ? "error"
      : runtimeState;
  const readyReport =
    hasUsableReport ? report : null;

  const loadMoreLabel =
    displayString(readyReport?.loadMoreLabel) ??
    copy.loadMoreDefault;
  const loadMoreVisible =
    readyReport?.hasMoreOrders === true ||
    displayString(
      readyReport?.loadMoreLabel,
    ) !== null ||
    Boolean(onLoadMore);
  const loadMoreBlockedByOffline =
    canLoadMore &&
    Boolean(onLoadMore) &&
    isOffline &&
    !isLoadMoreAvailableOffline;
  const loadMoreEnabled =
    canLoadMore &&
    Boolean(onLoadMore) &&
    (
      !isOffline ||
      isLoadMoreAvailableOffline
    ) &&
    activeOperation === null;
  const openOrdersGloballyEnabled =
    canOpenOrders &&
    Boolean(onOpenOrder) &&
    activeOperation === null;

  const runOperation = useCallback(
    async (
      operation: Exclude<
        OrderHistoryOperation,
        null
      >,
      callback: () => void | Promise<void>,
      failureNotice: string,
      successNotice?: string,
      targetOrderId?: string,
    ) => {
      if (inFlightRef.current !== null) {
        return;
      }

      inFlightRef.current = operation;

      if (mountedRef.current) {
        setActiveOperation(operation);
        setActiveTargetOrderId(
          targetOrderId ?? null,
        );
        setToastNotice(null);
      }

      try {
        await callback();

        if (
          successNotice &&
          mountedRef.current
        ) {
          setToastNotice(successNotice);
        }
      } catch {
        if (mountedRef.current) {
          setToastNotice(failureNotice);
        }
      } finally {
        inFlightRef.current = null;

        if (mountedRef.current) {
          setActiveOperation(null);
          setActiveTargetOrderId(null);
        }
      }
    },
    [],
  );

  const handleBack = useCallback(() => {
    if (
      !canGoBack ||
      activeOperation !== null ||
      inFlightRef.current !== null
    ) {
      return;
    }

    void runOperation(
      "back",
      onBack,
      copy.backError,
    );
  }, [
    activeOperation,
    canGoBack,
    onBack,
    runOperation,
  ]);

  const handleOpenOrder = useCallback(
    (orderId: string) => {
      if (
        !onOpenOrder ||
        !canOpenOrders ||
        activeOperation !== null ||
        inFlightRef.current !== null ||
        !isNonWhitespaceString(orderId)
      ) {
        return;
      }

      const orders = readyReport?.orders ?? [];
      const uniqueUsableOrderIds =
        getUniqueUsableOrderIds(orders);

      if (
        !uniqueUsableOrderIds.has(orderId)
      ) {
        return;
      }

      void runOperation(
        "open-order",
        () => onOpenOrder(orderId),
        copy.openOrderError,
        undefined,
        orderId,
      );
    },
    [
      activeOperation,
      canOpenOrders,
      onOpenOrder,
      readyReport,
      runOperation,
    ],
  );

  const handleLoadMore =
    useCallback(() => {
      if (
        !loadMoreEnabled ||
        !onLoadMore ||
        activeOperation !== null ||
        inFlightRef.current !== null
      ) {
        return;
      }

      void runOperation(
        "load-more",
        onLoadMore,
        copy.loadMoreError,
        copy.loadMoreSuccess,
      );
    }, [
      activeOperation,
      loadMoreEnabled,
      onLoadMore,
      runOperation,
    ]);

  const handleRetryLoad = useCallback(() => {
    if (
      !onRetryLoad ||
      activeOperation !== null ||
      inFlightRef.current !== null
    ) {
      return;
    }

    void runOperation(
      "retry-load",
      onRetryLoad,
      copy.retryError,
    );
  }, [
    activeOperation,
    onRetryLoad,
    runOperation,
  ]);

  return (
    <Shell>
      {effectiveState === "loading" ? (
        <LoadingExperience
          activeOperation={
            activeOperation
          }
          canGoBack={canGoBack}
          onBack={handleBack}
        />
      ) : null}
      {effectiveState === "ready" ||
      effectiveState === "empty" ? (
        <ReadyExperience
          activeOperation={
            activeOperation
          }
          activeTargetOrderId={
            activeTargetOrderId
          }
          canGoBack={canGoBack}
          canLoadMore={
            canLoadMore && Boolean(onLoadMore)
          }
          canOpenOrders={
            openOrdersGloballyEnabled
          }
          isLoadMoreBlockedByOffline={
            loadMoreBlockedByOffline
          }
          isLoadMoreEnabled={
            loadMoreEnabled
          }
          isOffline={isOffline}
          loadMoreLabel={loadMoreLabel}
          loadMoreVisible={
            loadMoreVisible
          }
          onBack={handleBack}
          onLoadMore={handleLoadMore}
          onOpenOrder={handleOpenOrder}
          report={readyReport}
          showEmptyOrders={
            effectiveState === "empty"
          }
        />
      ) : null}
      {effectiveState === "error" ? (
        <ErrorExperience
          activeOperation={
            activeOperation
          }
          canGoBack={canGoBack}
          onBack={handleBack}
          onRetry={
            onRetryLoad
              ? handleRetryLoad
              : undefined
          }
        />
      ) : null}
      <ToastRegion notice={toastNotice} />
    </Shell>
  );
}
