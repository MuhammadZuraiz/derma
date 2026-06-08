import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type ScanActionsSheetOperation =
  | "facial-scan"
  | "ingredient-scanner"
  | null;

export interface ScanActionsSheetProps {
  isOpen: boolean;
  canStartFacialScan?: boolean;
  canOpenIngredientScanner?: boolean;
  onClose: () => void;
  onStartFacialScan?: () => void | Promise<void>;
  onOpenIngredientScanner?: () => void | Promise<void>;
}

interface ToastNotice {
  message: string;
}

type ThemeStyle = CSSProperties &
  Record<`--dl-${string}`, string>;

type ScanAction = {
  operation: Exclude<ScanActionsSheetOperation, null>;
  label: string;
  blockedLabel: string;
  pendingLabel: string;
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
  overlay: "rgba(45, 34, 29, 0.42)",
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
  "--dl-overlay": colors.overlay,
  "--dl-border-subtle": colors.borderSubtle,
};

const copy = {
  title: "Choose a scan",
  supporting: "Start a facial scan or scan an ingredient label.",
  facialLabel: "Start facial scan",
  ingredientLabel: "Scan ingredient label",
  cancel: "Cancel",
  facialBlocked: "Facial scan unavailable",
  ingredientBlocked: "Ingredient scanner unavailable",
  facialPending: "Opening facial scan...",
  ingredientPending: "Opening ingredient scanner...",
  toast:
    "We could not open that scan option. Please try again.",
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

function FaceFrameIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7.2 5.2H6.1a.9.9 0 0 0-.9.9v1.1M16.8 5.2h1.1a.9.9 0 0 1 .9.9v1.1M7.2 18.8H6.1a.9.9 0 0 1-.9-.9v-1.1M16.8 18.8h1.1a.9.9 0 0 0 .9-.9v-1.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 10.2h.01M15 10.2h.01M9.4 14.6c1.4.9 3.8.9 5.2 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LabelLinesIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7.2 4.8h9.6a1.4 1.4 0 0 1 1.4 1.4v11.6a1.4 1.4 0 0 1-1.4 1.4H7.2a1.4 1.4 0 0 1-1.4-1.4V6.2a1.4 1.4 0 0 1 1.4-1.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.8 9h6.4M8.8 12h6.4M8.8 15h4.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const scanActions: ScanAction[] = [
  {
    operation: "facial-scan",
    label: copy.facialLabel,
    blockedLabel: copy.facialBlocked,
    pendingLabel: copy.facialPending,
    icon: <FaceFrameIcon />,
  },
  {
    operation: "ingredient-scanner",
    label: copy.ingredientLabel,
    blockedLabel: copy.ingredientBlocked,
    pendingLabel: copy.ingredientPending,
    icon: <LabelLinesIcon />,
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
      className="mt-4 flex min-h-[44px] items-end justify-center"
      data-testid="scan-actions-sheet-toast"
      role="status"
    >
      {notice ? (
        <div className="w-full rounded-[16px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-4 py-3 text-center text-sm font-semibold leading-5 text-[var(--dl-bark)] shadow-[0_10px_28px_rgba(92,74,66,0.12)] motion-reduce:transition-none">
          {notice}
        </div>
      ) : null}
    </div>
  );
}

export default function ScanActionsSheet({
  isOpen,
  canStartFacialScan,
  canOpenIngredientScanner,
  onClose,
  onStartFacialScan,
  onOpenIngredientScanner,
}: ScanActionsSheetProps) {
  const mountedRef = useRef(true);
  const inFlightRef =
    useRef<Exclude<ScanActionsSheetOperation, null> | null>(
      null,
    );
  const lastActivatedActionRef =
    useRef<
      Exclude<ScanActionsSheetOperation, null> | null
    >(null);
  const previousActiveOperationRef =
    useRef<ScanActionsSheetOperation>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const facialButtonRef =
    useRef<HTMLButtonElement | null>(null);
  const ingredientButtonRef =
    useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef =
    useRef<HTMLButtonElement | null>(null);
  const [activeOperation, setActiveOperation] =
    useState<ScanActionsSheetOperation>(null);
  const [toastNotice, setToastNotice] =
    useState<ToastNotice | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isFacialHostAvailable =
    canStartFacialScan !== false &&
    typeof onStartFacialScan === "function";
  const isIngredientHostAvailable =
    canOpenIngredientScanner !== false &&
    typeof onOpenIngredientScanner === "function";
  const isFacialAvailable =
    isFacialHostAvailable && activeOperation === null;
  const isIngredientAvailable =
    isIngredientHostAvailable &&
    activeOperation === null;

  const focusFirstAvailableControl = useCallback(() => {
    const preferredOperation =
      lastActivatedActionRef.current;

    if (
      preferredOperation === "facial-scan" &&
      isFacialHostAvailable
    ) {
      facialButtonRef.current?.focus();
      return;
    }

    if (
      preferredOperation === "ingredient-scanner" &&
      isIngredientHostAvailable
    ) {
      ingredientButtonRef.current?.focus();
      return;
    }

    if (isFacialHostAvailable) {
      facialButtonRef.current?.focus();
      return;
    }

    if (isIngredientHostAvailable) {
      ingredientButtonRef.current?.focus();
      return;
    }

    cancelButtonRef.current?.focus();
  }, [
    isFacialHostAvailable,
    isIngredientHostAvailable,
  ]);

  useEffect(() => {
    if (isOpen !== true || !toastNotice) {
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
  }, [isOpen, toastNotice]);

  useEffect(() => {
    if (isOpen !== true) {
      previousActiveOperationRef.current = null;
      lastActivatedActionRef.current = null;

      if (toastNotice !== null && mountedRef.current) {
        setToastNotice(null);
      }

      return;
    }

    const previousOperation =
      previousActiveOperationRef.current;
    previousActiveOperationRef.current = activeOperation;

    if (activeOperation !== null) {
      dialogRef.current?.focus();
      return;
    }

    if (previousOperation !== null) {
      focusFirstAvailableControl();
      return;
    }

    const activeElement = document.activeElement;
    const dialog = dialogRef.current;
    const isEnabledSheetButton =
      activeElement instanceof HTMLButtonElement &&
      dialog?.contains(activeElement) === true &&
      activeElement.disabled === false;

    if (isEnabledSheetButton) {
      return;
    }

    focusFirstAvailableControl();
  }, [
    activeOperation,
    focusFirstAvailableControl,
    isOpen,
    toastNotice,
  ]);

  const runSheetOperation = useCallback(
    async (
      operation: Exclude<ScanActionsSheetOperation, null>,
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

  const handleClose = useCallback(() => {
    if (
      activeOperation !== null ||
      inFlightRef.current !== null
    ) {
      return;
    }

    onClose();
  }, [activeOperation, onClose]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const enabledButtons = Array.from(
        dialogRef.current?.querySelectorAll(
          "button:not([disabled])",
        ) ?? [],
      ) as HTMLButtonElement[];

      if (enabledButtons.length === 0) {
        event.preventDefault();
        return;
      }

      const firstButton = enabledButtons[0];
      const lastButton =
        enabledButtons[enabledButtons.length - 1];
      const currentTarget = document.activeElement;

      if (currentTarget === dialogRef.current) {
        event.preventDefault();

        if (event.shiftKey) {
          lastButton.focus();
        } else {
          firstButton.focus();
        }

        return;
      }

      if (event.shiftKey && currentTarget === firstButton) {
        event.preventDefault();
        lastButton.focus();
        return;
      }

      if (!event.shiftKey && currentTarget === lastButton) {
        event.preventDefault();
        firstButton.focus();
      }
    },
    [handleClose],
  );

  if (isOpen !== true) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--dl-overlay)] px-3 pb-0"
      data-testid="scan-actions-sheet-overlay"
      style={{
        ...themeStyle,
        fontFamily:
          "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        aria-describedby="scan-actions-sheet-supporting"
        aria-labelledby="scan-actions-sheet-title"
        aria-modal="true"
        className={`${focusRing} w-full max-w-[560px] rounded-t-[28px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 text-[var(--dl-bark)] shadow-[0_-18px_48px_rgba(45,34,29,0.22)] motion-reduce:transition-none`}
        data-testid="scan-actions-sheet-panel"
        onClick={(event) => {
          event.stopPropagation();
        }}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-5">
          <p className="mb-2 font-mono text-[0.68rem] font-bold uppercase text-[var(--dl-text-secondary)]">
            DermaLens
          </p>
          <h2
            className="font-serif text-2xl font-semibold leading-8 text-[var(--dl-bark)]"
            id="scan-actions-sheet-title"
          >
            {copy.title}
          </h2>
          <p
            className="mt-2 text-sm font-medium leading-6 text-[var(--dl-text-secondary)]"
            id="scan-actions-sheet-supporting"
          >
            {copy.supporting}
          </p>
        </div>

        <div className="grid gap-3">
          {scanActions.map((action) => {
            const callback =
              action.operation === "facial-scan"
                ? onStartFacialScan
                : onOpenIngredientScanner;
            const isHostAvailable =
              action.operation === "facial-scan"
                ? isFacialHostAvailable
                : isIngredientHostAvailable;
            const isAvailable =
              action.operation === "facial-scan"
                ? isFacialAvailable
                : isIngredientAvailable;
            const isPending =
              activeOperation === action.operation;
            const label = isPending
              ? action.pendingLabel
              : isHostAvailable
                ? action.label
                : action.blockedLabel;
            const isPrimary =
              action.operation === "facial-scan";

            return (
              <button
                key={action.operation}
                className={`${focusRing} flex min-h-[56px] w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left text-sm font-extrabold leading-5 transition-colors duration-150 motion-reduce:transition-none ${
                  isPrimary
                    ? "border-[var(--dl-bark)] bg-[var(--dl-bark)] text-white shadow-[0_14px_30px_rgba(92,74,66,0.22)] hover:bg-[var(--dl-bark-hover)]"
                    : "border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] text-[var(--dl-bark)] hover:bg-[var(--dl-blush)]"
                } ${
                  isAvailable || isPending
                    ? ""
                    : "opacity-70"
                }`}
                disabled={
                  !isAvailable || activeOperation !== null
                }
                onClick={() => {
                  if (
                    !isAvailable ||
                    typeof callback !== "function" ||
                    activeOperation !== null ||
                    inFlightRef.current !== null
                  ) {
                    return;
                  }

                  lastActivatedActionRef.current =
                    action.operation;

                  void runSheetOperation(
                    action.operation,
                    callback,
                  );
                }}
                ref={
                  action.operation === "facial-scan"
                    ? facialButtonRef
                    : ingredientButtonRef
                }
                type="button"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isPrimary
                        ? "bg-white/15"
                        : "bg-[var(--dl-blush)]"
                    }`}
                  >
                    {action.icon}
                  </span>
                  <span>{label}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 5.5 15.5 12 9 18.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>

        <button
          className={`${focusRing} mt-3 min-h-[48px] w-full rounded-[16px] border border-transparent px-4 py-3 text-center text-sm font-extrabold leading-5 text-[var(--dl-bark)] transition-colors duration-150 hover:bg-[var(--dl-surface-soft)] motion-reduce:transition-none disabled:opacity-70`}
          disabled={activeOperation !== null}
          onClick={handleClose}
          ref={cancelButtonRef}
          type="button"
        >
          {copy.cancel}
        </button>

        <ToastRegion notice={toastNotice?.message ?? null} />
      </div>
    </div>
  );
}
