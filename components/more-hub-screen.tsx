import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type MoreHubScreenState =
  | "loading"
  | "ready"
  | "error";

export type MoreHubScreenOperation =
  | "store"
  | "orders"
  | "ingredient-scanner"
  | "profiles"
  | "retry-load"
  | null;

export interface MoreHubScreenProps {
  state?: MoreHubScreenState;
  isOffline?: boolean;
  canOpenStore?: boolean;
  canOpenOrders?: boolean;
  canOpenIngredientScanner?: boolean;
  canOpenProfilesAndOptionalSync?: boolean;
  isStoreAvailableOffline?: boolean;
  isOrdersAvailableOffline?: boolean;
  isIngredientScannerAvailableOffline?: boolean;
  isProfilesAndOptionalSyncAvailableOffline?: boolean;
  onOpenStore?: () => void | Promise<void>;
  onOpenOrders?: () => void | Promise<void>;
  onOpenIngredientScanner?: () => void | Promise<void>;
  onOpenProfilesAndOptionalSync?: () => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

interface ToastNotice {
  message: string;
}

type ThemeStyle = CSSProperties &
  Record<`--dl-${string}`, string>;

type DestinationOperation = Exclude<
  MoreHubScreenOperation,
  "retry-load" | null
>;

type DestinationCard = {
  operation: DestinationOperation;
  title: string;
  supporting: string;
  pendingLabel: string;
  blockedLabel: string;
  reconnectLabel: string;
  icon: ReactNode;
};

const colors = {
  surface: "#fffaf7",
  surfaceSoft: "#fdf0ea",
  blush: "#f8dcd4",
  peach: "#f2bfae",
  sand: "#e9d2bd",
  bark: "#5c4a42",
  barkHover: "#493a34",
  textSecondary: "#806b61",
  borderSubtle: "rgba(92, 74, 66, 0.18)",
  shadowSoft: "rgba(92, 74, 66, 0.12)",
};

const themeStyle: ThemeStyle = {
  "--dl-surface": colors.surface,
  "--dl-surface-soft": colors.surfaceSoft,
  "--dl-blush": colors.blush,
  "--dl-peach": colors.peach,
  "--dl-sand": colors.sand,
  "--dl-bark": colors.bark,
  "--dl-bark-hover": colors.barkHover,
  "--dl-text-secondary": colors.textSecondary,
  "--dl-border-subtle": colors.borderSubtle,
  "--dl-shadow-soft": colors.shadowSoft,
};

const copy = {
  eyebrow: "DermaLens",
  heading: "More",
  supporting:
    "Find shopping, tools, profiles, and optional sync settings without crowding your home screen.",
  offline:
    "You appear to be offline. Supplied destinations remain readable. The host controls which routes stay available.",
  helperHeading: "Local-first by design",
  helper:
    "Your profiles remain useful without an account. Optional sync stays under profile settings and is never enabled automatically.",
  loadingHeading: "Preparing more options",
  loadingSupporting:
    "Your secondary destinations are being prepared.",
  errorHeading: "We could not load more options",
  errorSupporting:
    "Try loading your secondary destinations again.",
  toast:
    "We could not open that destination. Please try again.",
  retry: "Retry",
  retryPending: "Trying again...",
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

export function isMoreHubScreenState(
  value: unknown,
): value is MoreHubScreenState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "error"
  );
}

function StoreIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6.8 9.6h10.4l-.8 9.1a1.4 1.4 0 0 1-1.4 1.3H9a1.4 1.4 0 0 1-1.4-1.3l-.8-9.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 9.6V8a3 3 0 0 1 6 0v1.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 4.8h10A1.8 1.8 0 0 1 18.8 6.6v12.6l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V6.6A1.8 1.8 0 0 1 7 4.8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M8.8 9h6.4M8.8 12h6.4M8.8 15h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LabelIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6.2 5.5h8.2l3.4 3.4v9.6H6.2v-13Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14.4 5.5V9h3.4M8.8 12h6.4M8.8 15h4.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ProfilesIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 12.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.8 19.2a6.2 6.2 0 0 1 12.4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const destinationCards: DestinationCard[] = [
  {
    operation: "store",
    title: "Store",
    supporting:
      "Browse first-party skincare products and routine collections.",
    pendingLabel: "Opening Store...",
    blockedLabel: "Store unavailable",
    reconnectLabel: "Reconnect to open Store",
    icon: <StoreIcon />,
  },
  {
    operation: "orders",
    title: "Orders",
    supporting: "Review your DermaLens order history.",
    pendingLabel: "Opening Orders...",
    blockedLabel: "Orders unavailable",
    reconnectLabel: "Reconnect to open Orders",
    icon: <OrdersIcon />,
  },
  {
    operation: "ingredient-scanner",
    title: "Ingredient scanner",
    supporting:
      "Scan or enter an ingredient label for guidance.",
    pendingLabel: "Opening ingredient scanner...",
    blockedLabel: "Ingredient scanner unavailable",
    reconnectLabel:
      "Reconnect to open ingredient scanner",
    icon: <LabelIcon />,
  },
  {
    operation: "profiles",
    title: "Profiles and optional sync",
    supporting:
      "Manage local profiles and open optional sync settings from profile management.",
    pendingLabel: "Opening profiles...",
    blockedLabel: "Profiles unavailable",
    reconnectLabel: "Reconnect to manage profiles",
    icon: <ProfilesIcon />,
  },
];

function ToastRegion({
  notice,
}: {
  notice: string | null;
}) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="mt-5 flex min-h-[44px] items-end"
      data-testid="more-hub-toast"
      role="status"
    >
      {notice ? (
        <div className="w-full rounded-[16px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-4 py-3 text-sm font-semibold leading-5 text-[var(--dl-bark)] shadow-[0_10px_28px_var(--dl-shadow-soft)] motion-reduce:transition-none">
          {notice}
        </div>
      ) : null}
    </div>
  );
}

function OfflineBanner() {
  return (
    <div
      aria-live="polite"
      className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--dl-bark)]"
      data-testid="more-hub-offline-banner"
      role="status"
    >
      {copy.offline}
    </div>
  );
}

function getEffectiveState(
  state: MoreHubScreenProps["state"],
) {
  if (state === undefined) {
    return "ready";
  }

  return isMoreHubScreenState(state) ? state : "error";
}

function getDestinationGroup(
  operation: DestinationOperation,
) {
  if (operation === "store" || operation === "orders") {
    return "Shopping";
  }

  if (operation === "ingredient-scanner") {
    return "Tools";
  }

  return "Profiles and privacy";
}

function getButtonTone({
  isEnabled,
  isPending,
}: {
  isEnabled: boolean;
  isPending: boolean;
}) {
  if (isEnabled || isPending) {
    return "border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] text-[var(--dl-bark)] shadow-[0_10px_28px_var(--dl-shadow-soft)] hover:bg-[var(--dl-surface-soft)]";
  }

  return "border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] text-[var(--dl-text-secondary)] opacity-80";
}

export default function MoreHubScreen({
  state,
  isOffline = false,
  canOpenStore,
  canOpenOrders,
  canOpenIngredientScanner,
  canOpenProfilesAndOptionalSync,
  isStoreAvailableOffline,
  isOrdersAvailableOffline,
  isIngredientScannerAvailableOffline,
  isProfilesAndOptionalSyncAvailableOffline,
  onOpenStore,
  onOpenOrders,
  onOpenIngredientScanner,
  onOpenProfilesAndOptionalSync,
  onRetryLoad,
}: MoreHubScreenProps) {
  const mountedRef = useRef(true);
  const inFlightRef =
    useRef<Exclude<MoreHubScreenOperation, null> | null>(
      null,
    );
  const [activeOperation, setActiveOperation] =
    useState<MoreHubScreenOperation>(null);
  const [toastNotice, setToastNotice] =
    useState<ToastNotice | null>(null);

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

    const timeout = window.setTimeout(() => {
      if (mountedRef.current) {
        setToastNotice(null);
      }
    }, 5000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toastNotice]);

  const effectiveState = getEffectiveState(state);
  const isAnyOperationPending = activeOperation !== null;

  const callbacks = {
    store: onOpenStore,
    orders: onOpenOrders,
    "ingredient-scanner": onOpenIngredientScanner,
    profiles: onOpenProfilesAndOptionalSync,
  } satisfies Record<
    DestinationOperation,
    (() => void | Promise<void>) | undefined
  >;

  const hostFlags = {
    store: canOpenStore,
    orders: canOpenOrders,
    "ingredient-scanner": canOpenIngredientScanner,
    profiles: canOpenProfilesAndOptionalSync,
  } satisfies Record<DestinationOperation, boolean | undefined>;

  const offlineFlags = {
    store: isStoreAvailableOffline,
    orders: isOrdersAvailableOffline,
    "ingredient-scanner":
      isIngredientScannerAvailableOffline,
    profiles: isProfilesAndOptionalSyncAvailableOffline,
  } satisfies Record<DestinationOperation, boolean | undefined>;

  const runHubOperation = useCallback(
    async (
      operation: Exclude<MoreHubScreenOperation, null>,
      callback: () => void | Promise<void>,
    ) => {
      if (inFlightRef.current !== null) {
        return;
      }

      inFlightRef.current = operation;

      if (mountedRef.current) {
        setActiveOperation(operation);
        setToastNotice(null);
      }

      try {
        await callback();
      } catch {
        if (mountedRef.current) {
          setToastNotice({
            message: copy.toast,
          });
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

  const runRetry = useCallback(() => {
    if (
      typeof onRetryLoad !== "function" ||
      activeOperation !== null ||
      inFlightRef.current !== null
    ) {
      return;
    }

    void runHubOperation("retry-load", onRetryLoad);
  }, [activeOperation, onRetryLoad, runHubOperation]);

  return (
    <main
      className="min-h-screen bg-[var(--dl-surface)] px-4 py-6 text-[var(--dl-bark)]"
      data-testid="more-hub-main"
      style={{
        ...themeStyle,
        fontFamily:
          "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif",
      }}
    >
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
        <header className="space-y-3">
          <p className="font-mono text-[0.68rem] font-bold uppercase text-[var(--dl-text-secondary)]">
            {copy.eyebrow}
          </p>
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-semibold leading-10 text-[var(--dl-bark)]">
              {copy.heading}
            </h1>
            <p className="text-base font-medium leading-7 text-[var(--dl-text-secondary)]">
              {copy.supporting}
            </p>
          </div>
        </header>

        {isOffline ? <OfflineBanner /> : null}

        {effectiveState === "loading" ? (
          <section
            aria-live="polite"
            className="rounded-[22px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-5 py-6"
            data-testid="more-hub-loading"
            role="status"
          >
            <h2 className="text-xl font-extrabold leading-7 text-[var(--dl-bark)]">
              {copy.loadingHeading}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--dl-text-secondary)]">
              {copy.loadingSupporting}
            </p>
          </section>
        ) : null}

        {effectiveState === "error" ? (
          <section>
            <div
              className="rounded-[22px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-5 py-6"
              data-testid="more-hub-error"
              role="alert"
            >
              <h2 className="text-xl font-extrabold leading-7 text-[var(--dl-bark)]">
                {copy.errorHeading}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--dl-text-secondary)]">
                {copy.errorSupporting}
              </p>
            </div>
            {typeof onRetryLoad === "function" ? (
              <button
                className={`${focusRing} mt-4 min-h-[56px] w-full rounded-[18px] border border-[var(--dl-bark)] bg-[var(--dl-bark)] px-4 py-3 text-sm font-extrabold leading-5 text-white shadow-[0_10px_28px_var(--dl-shadow-soft)] transition-colors duration-150 hover:bg-[var(--dl-bark-hover)] motion-reduce:transition-none disabled:opacity-70`}
                disabled={isAnyOperationPending}
                onClick={runRetry}
                type="button"
              >
                {activeOperation === "retry-load"
                  ? copy.retryPending
                  : copy.retry}
              </button>
            ) : null}
          </section>
        ) : null}

        {effectiveState === "ready" ? (
          <>
            {["Shopping", "Tools", "Profiles and privacy"].map(
              (group) => (
                <section
                  className="space-y-3"
                  data-testid={`more-hub-group-${group}`}
                  key={group}
                >
                  <h2 className="text-lg font-extrabold leading-7 text-[var(--dl-bark)]">
                    {group}
                  </h2>
                  <div className="grid gap-3">
                    {destinationCards
                      .filter(
                        (card) =>
                          getDestinationGroup(
                            card.operation,
                          ) === group,
                      )
                      .map((card) => {
                        const callback =
                          callbacks[card.operation];
                        const isHostAvailable =
                          hostFlags[card.operation] !== false &&
                          typeof callback === "function";
                        const isOfflineBlocked =
                          isHostAvailable &&
                          isOffline &&
                          offlineFlags[card.operation] !== true;
                        const isAvailable =
                          isHostAvailable &&
                          !isOfflineBlocked &&
                          activeOperation === null;
                        const isPending =
                          activeOperation === card.operation;
                        const statusLabel = isPending
                          ? card.pendingLabel
                          : !isHostAvailable
                            ? card.blockedLabel
                            : isOfflineBlocked
                              ? card.reconnectLabel
                              : "Open";

                        return (
                          <button
                            className={`${focusRing} min-h-[72px] w-full rounded-[20px] border px-4 py-4 text-left transition-colors duration-150 motion-reduce:transition-none ${getButtonTone(
                              {
                                isEnabled: isAvailable,
                                isPending,
                              },
                            )}`}
                            data-testid={`more-hub-${card.operation}-button`}
                            disabled={
                              !isAvailable ||
                              activeOperation !== null
                            }
                            key={card.operation}
                            onClick={() => {
                              if (
                                !isAvailable ||
                                typeof callback !== "function" ||
                                activeOperation !== null ||
                                inFlightRef.current !== null
                              ) {
                                return;
                              }

                              void runHubOperation(
                                card.operation,
                                callback,
                              );
                            }}
                            type="button"
                          >
                            <span className="flex gap-3">
                              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--dl-blush)] text-[var(--dl-bark)]">
                                {card.icon}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-base font-extrabold leading-6 text-[var(--dl-bark)]">
                                  {card.title}
                                </span>
                                <span className="mt-1 block text-sm font-semibold leading-6 text-[var(--dl-text-secondary)]">
                                  {card.supporting}
                                </span>
                                <span className="mt-3 inline-flex rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-3 py-1 text-xs font-extrabold leading-5 text-[var(--dl-bark)]">
                                  {statusLabel}
                                </span>
                              </span>
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </section>
              ),
            )}

            <section className="rounded-[22px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-5 py-5">
              <h2 className="text-lg font-extrabold leading-7 text-[var(--dl-bark)]">
                {copy.helperHeading}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--dl-text-secondary)]">
                {copy.helper}
              </p>
            </section>
          </>
        ) : null}

        <ToastRegion notice={toastNotice?.message ?? null} />
      </div>
    </main>
  );
}
