import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type AppPrimaryDestination =
  | "home"
  | "routine"
  | "progress"
  | "more";

export type AppBottomNavigationOperation =
  | "home"
  | "routine"
  | "scan"
  | "progress"
  | "more"
  | null;

export interface AppBottomNavigationProps {
  activeDestination: AppPrimaryDestination;
  isScanSheetOpen?: boolean;
  canOpenHome?: boolean;
  canOpenRoutine?: boolean;
  canOpenScan?: boolean;
  canOpenProgress?: boolean;
  canOpenMore?: boolean;
  scanTriggerRef?: Ref<HTMLButtonElement>;
  onOpenHome?: () => void | Promise<void>;
  onOpenRoutine?: () => void | Promise<void>;
  onOpenScan?: () => void | Promise<void>;
  onOpenProgress?: () => void | Promise<void>;
  onOpenMore?: () => void | Promise<void>;
}

interface ToastNotice {
  message: string;
}

export function isAppPrimaryDestination(
  value: unknown,
): value is AppPrimaryDestination {
  return (
    value === "home" ||
    value === "routine" ||
    value === "progress" ||
    value === "more"
  );
}

type ThemeStyle = CSSProperties &
  Record<`--dl-${string}`, string>;

type NavigationItem = {
  operation: Exclude<AppBottomNavigationOperation, null>;
  label: string;
  blockedLabel: string;
  pendingLabel: string;
  icon: ReactNode;
  destination?: AppPrimaryDestination;
  isScan?: boolean;
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
};

const copy = {
  toast:
    "We could not open that destination. Please try again.",
};

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4.5 11.2 12 5l7.5 6.2v7.3a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-7.3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 20v-5h5v5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RoutineIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 4.8h10A2.2 2.2 0 0 1 19.2 7v10A2.2 2.2 0 0 1 17 19.2H7A2.2 2.2 0 0 1 4.8 17V7A2.2 2.2 0 0 1 7 4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 9h8M8 12h5.5M8 15h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7.2 4.5H5.8a1.3 1.3 0 0 0-1.3 1.3v1.4M16.8 4.5h1.4a1.3 1.3 0 0 1 1.3 1.3v1.4M7.2 19.5H5.8a1.3 1.3 0 0 1-1.3-1.3v-1.4M16.8 19.5h1.4a1.3 1.3 0 0 0 1.3-1.3v-1.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M8 12h8M12 8v8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 17.5h14M7 17.5v-5.2M12 17.5V7M17 17.5v-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6.5 12h.01M12 12h.01M17.5 12h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

const navigationItems: NavigationItem[] = [
  {
    operation: "home",
    destination: "home",
    label: "Home",
    blockedLabel: "Home unavailable",
    pendingLabel: "Opening Home...",
    icon: <HomeIcon />,
  },
  {
    operation: "routine",
    destination: "routine",
    label: "Routine",
    blockedLabel: "Routine unavailable",
    pendingLabel: "Opening Routine...",
    icon: <RoutineIcon />,
  },
  {
    operation: "scan",
    label: "Scan",
    blockedLabel: "Scan unavailable",
    pendingLabel: "Opening Scan...",
    icon: <ScanIcon />,
    isScan: true,
  },
  {
    operation: "progress",
    destination: "progress",
    label: "Progress",
    blockedLabel: "Progress unavailable",
    pendingLabel: "Opening Progress...",
    icon: <ProgressIcon />,
  },
  {
    operation: "more",
    destination: "more",
    label: "More",
    blockedLabel: "More unavailable",
    pendingLabel: "Opening More...",
    icon: <MoreIcon />,
  },
];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

function getButtonTone({
  isCurrent,
  isEnabled,
  isPending,
  isScan,
}: {
  isCurrent: boolean;
  isEnabled: boolean;
  isPending: boolean;
  isScan: boolean;
}) {
  if (isScan) {
    return isEnabled
      ? "border-[var(--dl-bark)] bg-[var(--dl-bark)] text-white shadow-[0_12px_28px_rgba(92,74,66,0.24)] hover:bg-[var(--dl-bark-hover)]"
      : "border-[var(--dl-border-subtle)] bg-[var(--dl-sand)] text-[var(--dl-bark)] opacity-70";
  }

  if (isCurrent) {
    return "border-[var(--dl-peach)] bg-[var(--dl-blush)] font-extrabold text-[var(--dl-bark)] shadow-[inset_0_0_0_1px_var(--dl-peach)]";
  }

  if (isEnabled || isPending) {
    return "border-transparent bg-transparent text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)]";
  }

  return "border-transparent bg-transparent text-[var(--dl-text-secondary)] opacity-70";
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
      className="pointer-events-none mx-auto mb-3 flex min-h-[44px] w-full max-w-[560px] items-end justify-center px-3"
      data-testid="app-bottom-navigation-toast"
      role="status"
    >
      {notice ? (
        <div className="w-full rounded-[16px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-center text-sm font-semibold leading-5 text-[var(--dl-bark)] shadow-[0_10px_34px_rgba(92,74,66,0.14)] motion-reduce:transition-none">
          {notice}
        </div>
      ) : null}
    </div>
  );
}

export default function AppBottomNavigation({
  activeDestination,
  isScanSheetOpen = false,
  canOpenHome,
  canOpenRoutine,
  canOpenScan,
  canOpenProgress,
  canOpenMore,
  scanTriggerRef,
  onOpenHome,
  onOpenRoutine,
  onOpenScan,
  onOpenProgress,
  onOpenMore,
}: AppBottomNavigationProps) {
  const mountedRef = useRef(true);
  const inFlightRef =
    useRef<Exclude<AppBottomNavigationOperation, null> | null>(
      null,
    );
  const [activeOperation, setActiveOperation] =
    useState<AppBottomNavigationOperation>(null);
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

  const callbacks = {
    home: onOpenHome,
    routine: onOpenRoutine,
    scan: onOpenScan,
    progress: onOpenProgress,
    more: onOpenMore,
  } satisfies Record<
    Exclude<AppBottomNavigationOperation, null>,
    (() => void | Promise<void>) | undefined
  >;

  const hostFlags = {
    home: canOpenHome,
    routine: canOpenRoutine,
    scan: canOpenScan,
    progress: canOpenProgress,
    more: canOpenMore,
  } satisfies Record<
    Exclude<AppBottomNavigationOperation, null>,
    boolean | undefined
  >;

  const usableActiveDestination =
    isAppPrimaryDestination(activeDestination)
      ? activeDestination
      : null;

  const runNavigationOperation = useCallback(
    async (
      operation: Exclude<AppBottomNavigationOperation, null>,
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

  const isAnyOperationPending = activeOperation !== null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      data-testid="app-bottom-navigation-root"
      style={{
        ...themeStyle,
        fontFamily:
          "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif",
      }}
    >
      <ToastRegion notice={toastNotice?.message ?? null} />
      <nav
        aria-label="Primary"
        className="pointer-events-auto mx-auto w-full max-w-[560px] rounded-[24px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-2 pb-2 pt-3 text-[var(--dl-bark)] shadow-[0_-10px_34px_rgba(92,74,66,0.14)]"
        data-testid="app-bottom-navigation-surface"
      >
        <div className="grid grid-cols-5 items-end gap-1">
          {navigationItems.map((item) => {
            const callback = callbacks[item.operation];
            const isHostAvailable =
              hostFlags[item.operation] !== false &&
              typeof callback === "function";
            const isCurrent =
              item.destination !== undefined &&
              usableActiveDestination === item.destination;
            const isPending =
              activeOperation === item.operation;
            const isDisabled =
              !isHostAvailable || isAnyOperationPending;
            const label = isPending
              ? item.pendingLabel
              : isHostAvailable
                ? item.label
                : item.blockedLabel;

            return (
              <button
                key={item.operation}
                aria-current={
                  isCurrent ? "page" : undefined
                }
                aria-expanded={
                  item.isScan
                    ? isScanSheetOpen === true
                    : undefined
                }
                aria-haspopup={
                  item.isScan ? "dialog" : undefined
                }
                className={`${focusRing} flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-[18px] border px-1.5 py-2 text-center text-[0.68rem] font-bold leading-[0.86rem] transition-colors duration-150 motion-reduce:transition-none sm:text-xs ${getButtonTone(
                  {
                    isCurrent,
                    isEnabled: isHostAvailable,
                    isPending,
                    isScan: item.isScan === true,
                  },
                )} ${
                  item.isScan
                    ? "min-h-[64px] rounded-[22px]"
                    : ""
                }`}
                disabled={isDisabled}
                onClick={() => {
                  if (
                    !isHostAvailable ||
                    typeof callback !== "function" ||
                    activeOperation !== null ||
                    inFlightRef.current !== null
                  ) {
                    return;
                  }

                  void runNavigationOperation(
                    item.operation,
                    callback,
                  );
                }}
                ref={
                  item.isScan
                    ? scanTriggerRef
                    : undefined
                }
                type="button"
              >
                <span
                  className={
                    item.isScan
                      ? "flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
                      : "flex h-5 w-5 items-center justify-center"
                  }
                >
                  {item.icon}
                </span>
                <span className="max-w-full text-wrap">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
