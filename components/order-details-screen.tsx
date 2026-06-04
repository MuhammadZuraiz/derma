"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type OrderDetailsState =
  | "loading"
  | "ready"
  | "empty"
  | "error";

export type OrderDetailsOperation =
  | "back"
  | "open-support"
  | "download-receipt"
  | "retry-load"
  | null;

export type OrderStatusTone =
  | "neutral"
  | "attention"
  | "caution";

export interface OrderDetailsLineItem {
  lineItemId: string;
  productName: string;
  quantityLabel: string;
  variantLabel?: string;
  unitPriceLabel?: string;
  lineTotalLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface OrderDeliveryAddressSummary {
  recipientName: string;
  addressLines: string[];
  contactLabel?: string;
}

export interface OrderShippingUpdate {
  updateId: string;
  statusLabel: string;
  timestampLabel: string;
  supporting?: string;
  tone?: OrderStatusTone;
}

export interface OrderReceiptSummary {
  subtotalLabel?: string;
  shippingLabel?: string;
  taxLabel?: string;
  totalLabel: string;
  currencyLabel?: string;
  receiptLabel?: string;
}

export interface OrderDetailsReport {
  orderId: string;
  orderReferenceLabel: string;
  statusLabel: string;
  statusSupporting?: string;
  statusTone?: OrderStatusTone;
  placedAtLabel?: string;
  items: OrderDetailsLineItem[];
  deliveryAddress?: OrderDeliveryAddressSummary;
  shippingUpdates?: OrderShippingUpdate[];
  receipt?: OrderReceiptSummary;
  helperLabel?: string;
  privacyLabel?: string;
}

export interface OrderDetailsScreenProps {
  state?: OrderDetailsState;
  report?: OrderDetailsReport | null;
  isOffline?: boolean;
  canGoBack?: boolean;
  canOpenSupport?: boolean;
  canDownloadReceipt?: boolean;
  isReceiptDownloadAvailableOffline?: boolean;
  onBack: () => void | Promise<void>;
  onOpenSupport?: (
    orderId: string,
  ) => void | Promise<void>;
  onDownloadReceipt?: (
    orderId: string,
  ) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export function isOrderDetailsState(
  value: unknown,
): value is OrderDetailsState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "empty" ||
    value === "error"
  );
}

export function isOrderStatusTone(
  value: unknown,
): value is OrderStatusTone {
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

export function hasUsableOrderDetailsReport(
  report:
    | OrderDetailsReport
    | null
    | undefined,
): report is OrderDetailsReport {
  return (
    report !== null &&
    report !== undefined &&
    isNonWhitespaceString(report.orderId) &&
    isNonWhitespaceString(
      report.orderReferenceLabel,
    ) &&
    isNonWhitespaceString(report.statusLabel) &&
    Array.isArray(report.items)
  );
}

export const copy = {
  wordmark: "DermaLens",
  back: "Back",
  backBlocked: "Back unavailable",
  backPending: "Going back...",
  contextLabel: "FIRST-PARTY ORDER",
  heading: "Order details",
  supporting:
    "Review your first-party DermaLens order information and host-supplied delivery updates.",
  trustHeading: "First-party order",
  trustCopy:
    "Order status, shipping updates, receipt labels, and support availability are supplied by the host.",
  loadingHeading: "Preparing order details",
  loadingSupporting:
    "Your first-party order information is being prepared.",
  errorHeading:
    "We could not load order details",
  errorSupporting:
    "Try loading the order information again.",
  offlineCopy:
    "You appear to be offline. Supplied order details remain readable. The host controls which actions remain available.",
  orderReference: "Order reference",
  statusHeading: "Status",
  placedAt: "Placed",
  itemsHeading: "Order items",
  unnamedProduct: "Unnamed product",
  quantityUnavailable: "Quantity unavailable",
  itemImageUnavailable:
    "Item image unavailable",
  itemImageAlt: "DermaLens order item",
  emptyItemsHeading:
    "No order items available yet",
  emptyItemsSupporting:
    "The host did not supply order-item details for this order.",
  deliveryHeading: "Delivery address",
  recipientUnavailable:
    "Recipient unavailable",
  addressUnavailable:
    "Address details unavailable",
  shippingHeading: "Shipping updates",
  noShippingUpdates:
    "No shipping updates supplied yet.",
  updateUnavailable: "Update unavailable",
  timeUnavailable: "Time unavailable",
  receiptHeading: "Receipt summary",
  subtotal: "Subtotal",
  shipping: "Shipping",
  tax: "Tax",
  total: "Total",
  currency: "Currency",
  receipt: "Receipt",
  totalUnavailable: "Total unavailable",
  helperFallback:
    "Order details stay host-owned. Use Back if any displayed information needs correction.",
  privacyFallback:
    "DermaLens keeps this screen first-party and does not request account creation here.",
  supportHeading:
    "Need help with this order?",
  openSupport: "Open support",
  supportPending: "Opening support...",
  supportBlocked:
    "Support unavailable right now",
  downloadReceipt: "Download receipt",
  receiptPending: "Preparing receipt...",
  receiptBlocked:
    "Receipt download unavailable right now",
  receiptReconnect:
    "Reconnect to download receipt",
  retryLoad: "Try again",
  retryPending: "Trying again...",
  backError:
    "We could not go back. Please try again.",
  supportError:
    "We could not open order support. Please try again.",
  receiptError:
    "We could not prepare the receipt download. Please try again.",
  retryError:
    "We could not reload order details. Please try again.",
  receiptSuccess:
    "Receipt download request completed.",
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

function getUniqueUsableLineItemIds(
  items: unknown[],
): ReadonlySet<string> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const safeItem = getRecord(item);

    if (
      !isNonWhitespaceString(
        safeItem.lineItemId,
      )
    ) {
      continue;
    }

    counts.set(
      safeItem.lineItemId,
      (
        counts.get(safeItem.lineItemId) ??
        0
      ) + 1,
    );
  }

  const uniqueIds = new Set<string>();

  for (const [lineItemId, count] of counts) {
    if (count === 1) {
      uniqueIds.add(lineItemId);
    }
  }

  return uniqueIds;
}

function getToneClasses(
  tone: OrderStatusTone,
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
  activeOperation: OrderDetailsOperation;
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
  message,
}: {
  message: string | null;
}) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 bottom-[max(24px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${
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

function LoadingExperience({
  activeOperation,
  canGoBack,
  onBack,
}: {
  activeOperation: OrderDetailsOperation;
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
        className="mt-8 grid gap-4 md:grid-cols-2"
      >
        <div className="h-32 animate-pulse rounded-[18px] bg-[var(--dl-parchment)] motion-reduce:animate-none" />
        <div className="h-40 animate-pulse rounded-[18px] bg-[var(--dl-parchment)] motion-reduce:animate-none" />
        <div className="h-28 animate-pulse rounded-[18px] bg-[var(--dl-parchment)] motion-reduce:animate-none md:col-span-2" />
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
  activeOperation: OrderDetailsOperation;
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
      {copy.offlineCopy}
    </div>
  );
}

function StatusCard({
  report,
}: {
  report: OrderDetailsReport | null;
}) {
  if (!report) {
    return null;
  }

  const tone = isOrderStatusTone(
    report.statusTone,
  )
    ? report.statusTone
    : "neutral";
  const supporting = displayString(
    report.statusSupporting,
  );
  const placedAt = displayString(
    report.placedAtLabel,
  );

  return (
    <section
      aria-labelledby="order-status-heading"
      className={`rounded-[18px] border p-4 ${getToneClasses(tone)}`}
      data-tone={tone}
    >
      <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.orderReference}
      </p>
      <p className="mt-1 text-[19px] font-semibold leading-6 text-[var(--dl-text-primary)]">
        {report.orderReferenceLabel}
      </p>
      <h2
        className="mt-4 text-[17px] font-semibold leading-6 text-[var(--dl-text-primary)]"
        id="order-status-heading"
      >
        {copy.statusHeading}
      </h2>
      <p className="mt-1 text-sm leading-5 text-[var(--dl-bark)]">
        {report.statusLabel}
      </p>
      {supporting ? (
        <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
          {supporting}
        </p>
      ) : null}
      {placedAt ? (
        <p className="mt-3 font-[family-name:var(--dl-metadata)] text-[12px] leading-5 text-[var(--dl-dusk)]">
          {copy.placedAt}: {placedAt}
        </p>
      ) : null}
    </section>
  );
}

function ItemImage({
  imageAlt,
  imageKey,
  imageUrl,
  isFailed,
  onFailure,
}: {
  imageAlt: string;
  imageKey: string | null;
  imageUrl: string | null;
  isFailed: boolean;
  onFailure: (imageKey: string) => void;
}) {
  if (!imageUrl || !imageKey || isFailed) {
    return (
      <div className="flex aspect-square w-20 shrink-0 items-center justify-center rounded-[14px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-2 text-center text-xs leading-4 text-[var(--dl-text-secondary)] sm:w-24">
        {copy.itemImageUnavailable}
      </div>
    );
  }

  return (
    <img
      alt={imageAlt}
      className="aspect-square w-20 shrink-0 rounded-[14px] border border-[var(--dl-parchment)] object-cover sm:w-24"
      onError={() => onFailure(imageKey)}
      src={imageUrl}
    />
  );
}

function LineItemCard({
  failedImageKeys,
  item,
  listIndex,
  onImageFailure,
  uniqueUsableLineItemIds,
}: {
  failedImageKeys: ReadonlySet<string>;
  item: unknown;
  listIndex: number;
  onImageFailure: (imageKey: string) => void;
  uniqueUsableLineItemIds: ReadonlySet<string>;
}) {
  const safeItem = getRecord(item);
  const productName =
    displayString(safeItem.productName) ??
    copy.unnamedProduct;
  const quantityLabel =
    displayString(safeItem.quantityLabel) ??
    copy.quantityUnavailable;
  const variantLabel = displayString(
    safeItem.variantLabel,
  );
  const unitPriceLabel = displayString(
    safeItem.unitPriceLabel,
  );
  const lineTotalLabel = displayString(
    safeItem.lineTotalLabel,
  );
  const lineItemId = displayString(
    safeItem.lineItemId,
  );
  const imageUrl = displayString(
    safeItem.imageUrl,
  );
  const imageAlt =
    displayString(safeItem.imageAlt) ??
    copy.itemImageAlt;
  const hasUniqueUsableLineItemId =
    lineItemId !== null &&
    uniqueUsableLineItemIds.has(lineItemId);
  const imageIdentity =
    hasUniqueUsableLineItemId &&
    lineItemId !== null
      ? lineItemId
      : `position-${listIndex}`;
  const imageKey = imageUrl
    ? `${imageIdentity}:${imageUrl}`
    : null;
  const imageFailed =
    imageKey !== null &&
    failedImageKeys.has(imageKey);

  return (
    <li
      className="rounded-[18px] border border-[var(--dl-parchment)] bg-[var(--dl-surface)] p-4"
      data-testid="order-line-item-card"
      data-tone="neutral"
    >
      <div className="flex gap-4">
        <ItemImage
          imageAlt={imageAlt}
          imageKey={imageKey}
          imageUrl={imageUrl}
          isFailed={imageFailed}
          onFailure={onImageFailure}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-6 text-[var(--dl-text-primary)]">
            {productName}
          </h3>
          <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
            {quantityLabel}
          </p>
          {variantLabel ? (
            <p className="mt-2 text-sm leading-5 text-[var(--dl-bark)]">
              {variantLabel}
            </p>
          ) : null}
          <dl className="mt-3 grid gap-1 text-sm leading-5">
            {unitPriceLabel ? (
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--dl-text-secondary)]">
                  Unit price
                </dt>
                <dd className="text-right text-[var(--dl-text-primary)]">
                  {unitPriceLabel}
                </dd>
              </div>
            ) : null}
            {lineTotalLabel ? (
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--dl-text-secondary)]">
                  Line total
                </dt>
                <dd className="text-right font-semibold text-[var(--dl-text-primary)]">
                  {lineTotalLabel}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </li>
  );
}

function OrderItemsSection({
  failedImageKeys,
  items,
  onImageFailure,
}: {
  failedImageKeys: ReadonlySet<string>;
  items: unknown[];
  onImageFailure: (imageKey: string) => void;
}) {
  const uniqueUsableLineItemIds =
    getUniqueUsableLineItemIds(items);

  return (
    <section
      aria-labelledby="order-items-heading"
      className="space-y-3"
    >
      <h2
        className="text-[22px] font-semibold leading-7 text-[var(--dl-text-primary)]"
        id="order-items-heading"
      >
        {copy.itemsHeading}
      </h2>
      {items.length === 0 ? (
        <div
          className="rounded-[18px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-4"
          data-testid="empty-order-items-card"
        >
          <h3 className="text-[17px] font-semibold leading-6 text-[var(--dl-bark)]">
            {copy.emptyItemsHeading}
          </h3>
          <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
            {copy.emptyItemsSupporting}
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <LineItemCard
              failedImageKeys={failedImageKeys}
              item={item}
              key={`order-item-${index}`}
              listIndex={index}
              onImageFailure={onImageFailure}
              uniqueUsableLineItemIds={
                uniqueUsableLineItemIds
              }
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function DeliveryAddressCard({
  deliveryAddress,
}: {
  deliveryAddress: unknown;
}) {
  if (deliveryAddress === undefined) {
    return null;
  }

  const safeAddress = getRecord(deliveryAddress);
  const recipientName =
    displayString(safeAddress.recipientName) ??
    copy.recipientUnavailable;
  const addressLines: string[] = [];

  if (Array.isArray(safeAddress.addressLines)) {
    for (const line of safeAddress.addressLines) {
      const safeLine = displayString(line);

      if (safeLine) {
        addressLines.push(safeLine);
      }
    }
  }

  const contactLabel = displayString(
    safeAddress.contactLabel,
  );

  return (
    <section
      aria-labelledby="delivery-address-heading"
      className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4"
    >
      <h2
        className="text-[20px] font-semibold leading-7 text-[var(--dl-text-primary)]"
        id="delivery-address-heading"
      >
        {copy.deliveryHeading}
      </h2>
      <p className="mt-3 font-semibold leading-6 text-[var(--dl-text-primary)]">
        {recipientName}
      </p>
      {addressLines.length > 0 ? (
        <div className="mt-2 space-y-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
          {addressLines.map((line, index) => (
            <p key={`address-line-${index}`}>
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
          {copy.addressUnavailable}
        </p>
      )}
      {contactLabel ? (
        <p className="mt-3 text-sm leading-5 text-[var(--dl-bark)]">
          {contactLabel}
        </p>
      ) : null}
    </section>
  );
}

function ShippingUpdatesTimeline({
  shippingUpdates,
}: {
  shippingUpdates: unknown;
}) {
  const hasUpdateArray = Array.isArray(
    shippingUpdates,
  );
  const updates = hasUpdateArray
    ? shippingUpdates
    : [];

  return (
    <section
      aria-labelledby="shipping-updates-heading"
      className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4"
    >
      <h2
        className="text-[20px] font-semibold leading-7 text-[var(--dl-text-primary)]"
        id="shipping-updates-heading"
      >
        {copy.shippingHeading}
      </h2>
      {updates.length === 0 ? (
        <p className="mt-3 text-sm leading-5 text-[var(--dl-text-secondary)]">
          {copy.noShippingUpdates}
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {updates.map((update, index) => {
            const safeUpdate = getRecord(update);
            const statusLabel =
              displayString(
                safeUpdate.statusLabel,
              ) ?? copy.updateUnavailable;
            const timestampLabel =
              displayString(
                safeUpdate.timestampLabel,
              ) ?? copy.timeUnavailable;
            const supporting = displayString(
              safeUpdate.supporting,
            );
            const tone = isOrderStatusTone(
              safeUpdate.tone,
            )
              ? safeUpdate.tone
              : "neutral";

            return (
              <li
                className={`rounded-[14px] border px-3 py-3 ${getToneClasses(tone)}`}
                data-testid="shipping-update-card"
                data-tone={tone}
                key={`shipping-update-${index}`}
              >
                <p className="font-semibold leading-6 text-[var(--dl-text-primary)]">
                  {statusLabel}
                </p>
                <p className="mt-1 font-[family-name:var(--dl-metadata)] text-[12px] leading-5 text-[var(--dl-dusk)]">
                  {timestampLabel}
                </p>
                {supporting ? (
                  <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
                    {supporting}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function ReceiptSummaryCard({
  receipt,
}: {
  receipt: unknown;
}) {
  if (receipt === undefined) {
    return null;
  }

  const safeReceipt = getRecord(receipt);
  const receiptSubtotalLabel = displayString(
    safeReceipt.subtotalLabel,
  );
  const receiptShippingLabel = displayString(
    safeReceipt.shippingLabel,
  );
  const receiptTaxLabel = displayString(
    safeReceipt.taxLabel,
  );
  const receiptTotalLabel =
    displayString(safeReceipt.totalLabel) ??
    copy.totalUnavailable;
  const receiptCurrencyLabel = displayString(
    safeReceipt.currencyLabel,
  );
  const receiptLabel = displayString(
    safeReceipt.receiptLabel,
  );

  return (
    <section
      aria-labelledby="receipt-summary-heading"
      className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4"
    >
      <h2
        className="text-[20px] font-semibold leading-7 text-[var(--dl-text-primary)]"
        id="receipt-summary-heading"
      >
        {copy.receiptHeading}
      </h2>
      <dl className="mt-3 space-y-2 text-sm leading-5">
        {receiptSubtotalLabel ? (
          <SummaryRow
            label={copy.subtotal}
            value={receiptSubtotalLabel}
          />
        ) : null}
        {receiptShippingLabel ? (
          <SummaryRow
            label={copy.shipping}
            value={receiptShippingLabel}
          />
        ) : null}
        {receiptTaxLabel ? (
          <SummaryRow
            label={copy.tax}
            value={receiptTaxLabel}
          />
        ) : null}
        <SummaryRow
          label={copy.total}
          value={receiptTotalLabel}
        />
        {receiptCurrencyLabel ? (
          <SummaryRow
            label={copy.currency}
            value={receiptCurrencyLabel}
          />
        ) : null}
        {receiptLabel ? (
          <SummaryRow
            label={copy.receipt}
            value={receiptLabel}
          />
        ) : null}
      </dl>
    </section>
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
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--dl-text-secondary)]">
        {label}
      </dt>
      <dd className="text-right font-semibold text-[var(--dl-text-primary)]">
        {value}
      </dd>
    </div>
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

function ActionPanel({
  activeOperation,
  canDownloadReceipt,
  canOpenSupport,
  isDownloadBlockedByOffline,
  isSupportEnabled,
  onDownloadReceipt,
  onOpenSupport,
  receiptActionVisible,
}: {
  activeOperation: OrderDetailsOperation;
  canDownloadReceipt: boolean;
  canOpenSupport: boolean;
  isDownloadBlockedByOffline: boolean;
  isSupportEnabled: boolean;
  onDownloadReceipt: () => void;
  onOpenSupport: () => void;
  receiptActionVisible: boolean;
}) {
  const operationPending =
    activeOperation !== null;
  const supportLabel =
    activeOperation === "open-support"
      ? copy.supportPending
      : isSupportEnabled
        ? copy.openSupport
        : copy.supportBlocked;
  const receiptLabel =
    activeOperation === "download-receipt"
      ? copy.receiptPending
      : canDownloadReceipt
        ? copy.downloadReceipt
        : isDownloadBlockedByOffline
          ? copy.receiptReconnect
          : copy.receiptBlocked;

  return (
    <section
      aria-labelledby="order-actions-heading"
      className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4"
    >
      <h2
        className="text-[20px] font-semibold leading-7 text-[var(--dl-text-primary)]"
        id="order-actions-heading"
      >
        {copy.supportHeading}
      </h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          className={`${focusRing} flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
          disabled={
            !isSupportEnabled ||
            operationPending
          }
          onClick={onOpenSupport}
          type="button"
        >
          {activeOperation ===
          "open-support" ? (
            <Spinner />
          ) : null}
          {supportLabel}
        </button>
        {receiptActionVisible ? (
          <button
            className={`${focusRing} flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full border border-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)]`}
            disabled={
              !canDownloadReceipt ||
              operationPending
            }
            onClick={onDownloadReceipt}
            type="button"
          >
            {activeOperation ===
            "download-receipt" ? (
              <Spinner />
            ) : null}
            {receiptLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ReadyExperience({
  activeOperation,
  canDownloadReceipt,
  canGoBack,
  canOpenSupport,
  failedImageKeys,
  isDownloadBlockedByOffline,
  isOffline,
  isSupportEnabled,
  onBack,
  onDownloadReceipt,
  onImageFailure,
  onOpenSupport,
  receiptActionVisible,
  report,
}: {
  activeOperation: OrderDetailsOperation;
  canDownloadReceipt: boolean;
  canGoBack: boolean;
  canOpenSupport: boolean;
  failedImageKeys: ReadonlySet<string>;
  isDownloadBlockedByOffline: boolean;
  isOffline: boolean;
  isSupportEnabled: boolean;
  onBack: () => void;
  onDownloadReceipt: () => void;
  onImageFailure: (imageKey: string) => void;
  onOpenSupport: () => void;
  receiptActionVisible: boolean;
  report: OrderDetailsReport | null;
}) {
  const items = report?.items ?? [];

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[1100px] px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <TopBar
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={onBack}
      />
      <header className="mt-7">
        <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
          {copy.trustHeading}
        </p>
        <h1 className="mt-2 font-[family-name:var(--dl-display)] text-[42px] leading-[44px] text-[var(--dl-text-primary)] max-[374px]:text-[36px]">
          {copy.heading}
        </h1>
        <p className="mt-3 max-w-[620px] text-[15px] leading-[23px] text-[var(--dl-text-secondary)]">
          {copy.supporting}
        </p>
      </header>
      <OfflineBanner isOffline={isOffline} />
      <p className="mt-5 rounded-[16px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)]">
        {copy.trustCopy}
      </p>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <StatusCard report={report} />
          <OrderItemsSection
            failedImageKeys={
              failedImageKeys
            }
            items={items}
            onImageFailure={
              onImageFailure
            }
          />
        </div>
        <div className="space-y-5">
          <DeliveryAddressCard
            deliveryAddress={
              report?.deliveryAddress
            }
          />
          <ShippingUpdatesTimeline
            shippingUpdates={
              report?.shippingUpdates
            }
          />
          <ReceiptSummaryCard
            receipt={report?.receipt}
          />
          <HelperCard
            helperLabel={
              report?.helperLabel
            }
            privacyLabel={
              report?.privacyLabel
            }
          />
          <ActionPanel
            activeOperation={
              activeOperation
            }
            canDownloadReceipt={
              canDownloadReceipt
            }
            canOpenSupport={
              canOpenSupport
            }
            isDownloadBlockedByOffline={
              isDownloadBlockedByOffline
            }
            isSupportEnabled={
              isSupportEnabled
            }
            onDownloadReceipt={
              onDownloadReceipt
            }
            onOpenSupport={
              onOpenSupport
            }
            receiptActionVisible={
              receiptActionVisible
            }
          />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailsScreen({
  state = "loading",
  report = null,
  isOffline = false,
  canGoBack = true,
  canOpenSupport = true,
  canDownloadReceipt = true,
  isReceiptDownloadAvailableOffline = false,
  onBack,
  onOpenSupport,
  onDownloadReceipt,
  onRetryLoad,
}: OrderDetailsScreenProps) {
  const mountedRef = useRef(true);
  const inFlightRef = useRef<
    Exclude<OrderDetailsOperation, null> | null
  >(null);
  const [
    activeOperation,
    setActiveOperation,
  ] =
    useState<OrderDetailsOperation>(
      null,
    );
  const [toastMessage, setToastMessage] =
    useState<string | null>(null);
  const [
    failedImageKeys,
    setFailedImageKeys,
  ] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

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

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toastMessage]);

  const recordFailedImageKey =
    useCallback((imageKey: string) => {
      setFailedImageKeys((current) => {
        if (current.has(imageKey)) {
          return current;
        }

        const next = new Set(current);
        next.add(imageKey);
        return next;
      });
    }, []);

  const runtimeState = isOrderDetailsState(
    state,
  )
    ? state
    : "error";
  const hasUsableReport =
    hasUsableOrderDetailsReport(report);
  const effectiveState =
    runtimeState === "ready" &&
    !hasUsableReport
      ? "error"
      : runtimeState;
  const readyReport =
    hasUsableReport ? report : null;
  const receiptExists =
    readyReport?.receipt !== undefined &&
    readyReport.receipt !== null;
  const supportEnabled =
    readyReport !== null &&
    canOpenSupport &&
    Boolean(onOpenSupport) &&
    activeOperation === null;
  const receiptBlockedByOffline =
    readyReport !== null &&
    receiptExists &&
    canDownloadReceipt &&
    Boolean(onDownloadReceipt) &&
    isOffline &&
    !isReceiptDownloadAvailableOffline;
  const receiptDownloadEnabled =
    readyReport !== null &&
    receiptExists &&
    canDownloadReceipt &&
    Boolean(onDownloadReceipt) &&
    (
      !isOffline ||
      isReceiptDownloadAvailableOffline
    ) &&
    activeOperation === null;
  const receiptActionVisible =
    receiptExists ||
    Boolean(onDownloadReceipt);

  const runOperation = useCallback(
    async (
      operation: Exclude<
        OrderDetailsOperation,
        null
      >,
      callback: () => void | Promise<void>,
      failureMessage: string,
      successMessage?: string,
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

        if (
          successMessage &&
          mountedRef.current
        ) {
          setToastMessage(successMessage);
        }
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

  const handleOpenSupport =
    useCallback(() => {
      if (
        !supportEnabled ||
        readyReport === null ||
        !isNonWhitespaceString(
          readyReport.orderId,
        ) ||
        !onOpenSupport ||
        activeOperation !== null ||
        inFlightRef.current !== null
      ) {
        return;
      }

      void runOperation(
        "open-support",
        () => onOpenSupport(readyReport.orderId),
        copy.supportError,
      );
    }, [
      activeOperation,
      onOpenSupport,
      readyReport,
      runOperation,
      supportEnabled,
    ]);

  const handleDownloadReceipt =
    useCallback(() => {
      if (
        !receiptDownloadEnabled ||
        readyReport === null ||
        !isNonWhitespaceString(
          readyReport.orderId,
        ) ||
        !onDownloadReceipt ||
        activeOperation !== null ||
        inFlightRef.current !== null
      ) {
        return;
      }

      void runOperation(
        "download-receipt",
        () =>
          onDownloadReceipt(
            readyReport.orderId,
          ),
        copy.receiptError,
        copy.receiptSuccess,
      );
    }, [
      activeOperation,
      onDownloadReceipt,
      readyReport,
      receiptDownloadEnabled,
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
          canDownloadReceipt={
            receiptDownloadEnabled
          }
          canGoBack={canGoBack}
          canOpenSupport={canOpenSupport}
          failedImageKeys={
            failedImageKeys
          }
          isDownloadBlockedByOffline={
            receiptBlockedByOffline
          }
          isOffline={isOffline}
          isSupportEnabled={
            supportEnabled
          }
          onBack={handleBack}
          onDownloadReceipt={
            handleDownloadReceipt
          }
          onImageFailure={
            recordFailedImageKey
          }
          onOpenSupport={
            handleOpenSupport
          }
          receiptActionVisible={
            receiptActionVisible
          }
          report={readyReport}
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
      <ToastRegion message={toastMessage} />
    </Shell>
  );
}
