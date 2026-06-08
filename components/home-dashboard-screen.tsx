import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type HomeDashboardState =
  | "loading"
  | "ready"
  | "empty"
  | "error";

export type HomeDashboardOperation =
  | "start-analysis"
  | "change-profile"
  | "open-latest-report"
  | "open-routine"
  | "open-scanner"
  | "open-progress"
  | "open-orders"
  | "open-store"
  | "open-recent-order"
  | "retry-load"
  | null;

export type DashboardProfileSyncState =
  | "local-only"
  | "synced"
  | "sync-pending"
  | "sync-error";

export interface DashboardProfileSummary {
  profileId: string;
  displayName: string;
  syncState: DashboardProfileSyncState;
  syncLabel: string;
}

export interface DashboardLatestSnapshot {
  reportId: string;
  capturedAtLabel: string;
  categoryLabel: string;
  comparisonLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
  scoreLabel?: string;
  saveLabel?: string;
}

export interface DashboardRoutineSummary {
  routineId: string;
  title: string;
  supporting: string;
  updatedAtLabel?: string;
  morningSummaryLabel?: string;
  eveningSummaryLabel?: string;
}

export interface DashboardRecentOrder {
  orderId: string;
  orderReferenceLabel: string;
  statusLabel: string;
  supporting?: string;
}

export interface DashboardEnvironmentalSummary {
  uvLabel?: string;
  aqiLabel?: string;
  guidanceLabel?: string;
  updatedAtLabel?: string;
}

export interface HomeDashboardReport {
  profile: DashboardProfileSummary;
  greetingLabel?: string;
  latestSnapshot?: DashboardLatestSnapshot;
  routine?: DashboardRoutineSummary;
  recentOrder?: DashboardRecentOrder;
  environment?: DashboardEnvironmentalSummary;
}

export interface HomeDashboardScreenProps {
  state?: HomeDashboardState;
  report?: HomeDashboardReport | null;
  isOffline?: boolean;
  showEnvironmentalModule?: boolean;
  canStartAnalysis?: boolean;
  isStartAnalysisAvailableOffline?: boolean;
  canChangeProfile?: boolean;
  canOpenLatestReport?: boolean;
  isLatestReportAvailableOffline?: boolean;
  canOpenRoutine?: boolean;
  isRoutineAvailableOffline?: boolean;
  canOpenGuestScanner?: boolean;
  isGuestScannerAvailableOffline?: boolean;
  canOpenProgress?: boolean;
  isProgressAvailableOffline?: boolean;
  canOpenOrders?: boolean;
  canOpenStore?: boolean;
  canOpenRecentOrder?: boolean;
  isRecentOrderAvailableOffline?: boolean;
  onStartAnalysis: (
    profileId: string,
  ) => void | Promise<void>;
  onChangeProfile: () => void | Promise<void>;
  onOpenLatestReport?: (
    reportId: string,
  ) => void | Promise<void>;
  onOpenRoutine?: (
    routineId: string,
  ) => void | Promise<void>;
  onOpenGuestScanner: () => void | Promise<void>;
  onOpenProgress?: () => void | Promise<void>;
  onOpenOrders?: () => void | Promise<void>;
  onOpenStore: () => void | Promise<void>;
  onOpenRecentOrder?: (
    orderId: string,
  ) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

interface ToastNotice {
  message: string;
}

type ThemeStyle = CSSProperties &
  Record<`--dl-${string}`, string>;

type VisibleOperation = Exclude<
  HomeDashboardOperation,
  | "open-scanner"
  | "open-orders"
  | "open-store"
  | null
>;

export const copy = {
  wordmark: "DermaLens",
  homeHeading: "Your skincare home",
  welcomePrefix: "Welcome back,",
  changeProfile: "Change profile",
  changingProfile: "Changing profile...",
  changeProfileBlocked: "Profile switching unavailable",
  changeProfileError:
    "We could not open profile switching. Please try again.",
  loadingHeading: "Preparing your dashboard",
  loadingSupporting: "Your skincare home base is being prepared.",
  emptyHeading: "Your dashboard is ready",
  emptySupporting:
    "Start your first facial scan to build a skincare snapshot and routine.",
  errorHeading: "We could not load your dashboard",
  errorSupporting:
    "Your locally supplied content is protected. Try loading the dashboard again.",
  retryLoad: "Try again",
  retryingLoad: "Trying again...",
  retryError:
    "We could not reload the dashboard. Please try again.",
  offline:
    "You appear to be offline. Locally supplied dashboard details remain visible.",
  profileContext: "ACTIVE PROFILE",
  localFirstHelper:
    "Your profile stays local unless you choose to sync it.",
  profileSyncFallback: "Profile storage status unavailable",
  startCardTitle: "Start facial scan",
  startCardSupporting:
    "Capture a fresh image to review visible skin concerns and update your routine guidance.",
  startAnalysis: "Start facial scan",
  startingAnalysis: "Starting facial scan...",
  startBlocked: "Facial scan unavailable",
  startOfflineBlocked: "Reconnect to start facial scan",
  startError:
    "We could not start a facial scan. Please try again.",
  routineTitle: "Today's routine",
  routineTitleFallback: "Routine summary unavailable",
  routineSupportingFallback: "Routine details unavailable",
  routineEmpty: "No routine available yet.",
  routineEmptySupporting:
    "Your host-supplied routine will appear here after guidance is ready.",
  openRoutine: "Open routine",
  openingRoutine: "Opening routine...",
  routineBlocked: "Routine unavailable",
  routineOfflineBlocked: "Reconnect to open routine",
  routineError: "We could not open your routine. Please try again.",
  skinJourneyTitle: "Skin journey",
  latestSnapshotEmpty: "No skin snapshot yet.",
  latestSnapshotEmptySupporting:
    "Start a facial scan when you are ready to review visible skin changes.",
  openLatestReport: "Open latest report",
  openingLatestReport: "Opening latest report...",
  latestReportBlocked: "Latest report unavailable",
  latestReportOfflineBlocked:
    "Reconnect to open latest report",
  latestReportError:
    "We could not open the latest report. Please try again.",
  snapshotImageAlt: "Latest skincare snapshot",
  snapshotCapturedFallback: "Capture time unavailable",
  snapshotCategoryFallback: "Latest summary unavailable",
  snapshotImagePlaceholder: "Snapshot image unavailable",
  openProgress: "View progress",
  openingProgress: "Opening progress...",
  progressBlocked: "Progress unavailable",
  progressOfflineBlocked: "Reconnect to view progress",
  progressError: "We could not open progress. Please try again.",
  progressSupporting:
    "Review host-supplied skincare journey updates.",
  recentOrderTitle: "Order update",
  recentOrderReferenceFallback: "Order reference unavailable",
  recentOrderStatusFallback: "Order status unavailable",
  openRecentOrder: "View order details",
  openingRecentOrder: "Opening order details...",
  recentOrderBlocked: "Order details unavailable",
  recentOrderOfflineBlocked:
    "Reconnect to view order details",
  recentOrderError:
    "We could not open order details. Please try again.",
  environmentTitle: "UV and air quality",
  toastNoticeLabel: "Dashboard notice",
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
  display: 'var(--font-dm-serif-display), Georgia, serif',
  ui: 'var(--font-dm-sans), system-ui, sans-serif',
  metadata: 'var(--font-space-mono), monospace',
} as const;

const themeStyle: ThemeStyle = {
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
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

function isNonWhitespaceString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function getSafeDisplayText(
  value: unknown,
  fallback: string,
) {
  return isNonWhitespaceString(value)
    ? value.trim()
    : fallback;
}

function getOptionalDisplayText(value: unknown) {
  return isNonWhitespaceString(value)
    ? value.trim()
    : null;
}

export function isHomeDashboardState(
  value: unknown,
): value is HomeDashboardState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "empty" ||
    value === "error"
  );
}

export function hasUsableHomeDashboardReport(
  report: HomeDashboardReport | null | undefined,
): report is HomeDashboardReport {
  return (
    isNonWhitespaceString(report?.profile?.profileId) &&
    isNonWhitespaceString(report?.profile?.displayName)
  );
}

function hasUsableLatestSnapshotRoute(
  snapshot: DashboardLatestSnapshot | undefined,
): snapshot is DashboardLatestSnapshot & { reportId: string } {
  return isNonWhitespaceString(snapshot?.reportId);
}

function hasUsableRoutineRoute(
  routine: DashboardRoutineSummary | undefined,
): routine is DashboardRoutineSummary & { routineId: string } {
  return isNonWhitespaceString(routine?.routineId);
}

function hasUsableRecentOrderRoute(
  recentOrder: DashboardRecentOrder | undefined,
): recentOrder is DashboardRecentOrder & { orderId: string } {
  return isNonWhitespaceString(recentOrder?.orderId);
}

function hasSnapshotImageUrl(
  snapshot: DashboardLatestSnapshot | undefined,
): snapshot is DashboardLatestSnapshot & { imageUrl: string } {
  return isNonWhitespaceString(snapshot?.imageUrl);
}

function getProfileName(report: HomeDashboardReport) {
  return report.profile.displayName.trim();
}

function getSnapshotImageAlt(
  snapshot: DashboardLatestSnapshot,
) {
  return getSafeDisplayText(
    snapshot.imageAlt,
    copy.snapshotImageAlt,
  );
}

function hasEnvironmentalMeasurements(
  environment: DashboardEnvironmentalSummary | undefined,
) {
  return (
    isNonWhitespaceString(environment?.uvLabel) ||
    isNonWhitespaceString(environment?.aqiLabel)
  );
}

function getActionAvailability({
  canOpen,
  callback,
  hasRouteContext = true,
  isAvailableOffline = false,
  isOffline,
}: {
  canOpen: boolean;
  callback: unknown;
  hasRouteContext?: boolean;
  isAvailableOffline?: boolean;
  isOffline: boolean;
}) {
  const isGenerallyBlocked =
    canOpen !== true ||
    typeof callback !== "function" ||
    hasRouteContext !== true;
  const isOfflineBlocked =
    !isGenerallyBlocked &&
    isOffline &&
    isAvailableOffline !== true;

  return {
    isAvailable: !isGenerallyBlocked && !isOfflineBlocked,
    isGenerallyBlocked,
    isOfflineBlocked,
  };
}

function SectionCard({
  children,
  className = "",
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-[0_18px_60px_rgba(92,74,66,0.08)] ${className}`}
      data-testid={testId}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[0.72rem] font-semibold uppercase text-[var(--dl-dusk)]"
      style={{ fontFamily: fonts.metadata }}
    >
      {children}
    </p>
  );
}

function DashboardButton({
  activeOperation,
  blockedLabel,
  className = "",
  label,
  minHeight = "min-h-[44px]",
  onClick,
  operation,
  pendingLabel,
  unavailableLabel,
}: {
  activeOperation: HomeDashboardOperation;
  blockedLabel: string;
  className?: string;
  label: string;
  minHeight?: string;
  onClick: () => void;
  operation: VisibleOperation;
  pendingLabel: string;
  unavailableLabel: string | null;
}) {
  const isPending = activeOperation === operation;
  const hasConflictingOperation =
    activeOperation !== null && !isPending;
  const isUnavailable = unavailableLabel !== null;
  const isDisabled =
    isUnavailable || isPending || hasConflictingOperation;
  const visibleLabel = isPending
    ? pendingLabel
    : isUnavailable
      ? unavailableLabel
      : label;

  return (
    <button
      className={`${focusRing} ${minHeight} rounded-full px-4 py-2 text-sm font-bold motion-safe:transition motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      disabled={isDisabled}
      onClick={() => {
        if (isDisabled) {
          return;
        }

        onClick();
      }}
      type="button"
    >
      {visibleLabel}
    </button>
  );
}

function SecondaryButton(
  props: Omit<Parameters<typeof DashboardButton>[0], "className">,
) {
  return (
    <DashboardButton
      {...props}
      className="border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)]"
    />
  );
}

function PrimaryButton(
  props: Omit<
    Parameters<typeof DashboardButton>[0],
    "className" | "minHeight"
  >,
) {
  return (
    <DashboardButton
      {...props}
      className="bg-[var(--dl-bark)] text-white shadow-[0_12px_32px_rgba(92,74,66,0.2)] hover:bg-[var(--dl-bark-hover)]"
      minHeight="min-h-[64px]"
    />
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex min-h-[150px] items-center justify-center rounded-[18px] border border-dashed border-[var(--dl-sand)] bg-[var(--dl-surface-soft)] px-4 text-center text-sm font-semibold text-[var(--dl-text-secondary)]">
      {label}
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
      aria-label={copy.toastNoticeLabel}
      aria-live="polite"
      className="min-h-[44px]"
      data-testid="home-dashboard-toast"
      role="status"
    >
      {notice ? (
        <div className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-bark)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_44px_rgba(58,46,40,0.22)] motion-reduce:transition-none">
          {notice}
        </div>
      ) : null}
    </div>
  );
}

export default function HomeDashboardScreen({
  state = "ready",
  report = null,
  isOffline = false,
  showEnvironmentalModule = false,
  canStartAnalysis = true,
  isStartAnalysisAvailableOffline = false,
  canChangeProfile = true,
  canOpenLatestReport = true,
  isLatestReportAvailableOffline = false,
  canOpenRoutine = true,
  isRoutineAvailableOffline = false,
  canOpenProgress = true,
  isProgressAvailableOffline = false,
  canOpenRecentOrder = true,
  isRecentOrderAvailableOffline = false,
  onStartAnalysis,
  onChangeProfile,
  onOpenLatestReport,
  onOpenRoutine,
  onOpenProgress,
  onOpenRecentOrder,
  onRetryLoad,
}: HomeDashboardScreenProps) {
  const mountedRef = useRef(true);
  const inFlightRef = useRef<HomeDashboardOperation>(null);
  const [activeOperation, setActiveOperation] =
    useState<HomeDashboardOperation>(null);
  const [toastNotice, setToastNotice] =
    useState<ToastNotice | null>(null);
  const [failedImageKey, setFailedImageKey] =
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

    const timeout = window.setTimeout(() => {
      if (mountedRef.current) {
        setToastNotice(null);
      }
    }, 5000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toastNotice]);

  const runOperation = useCallback(
    async (
      operation: Exclude<HomeDashboardOperation, null>,
      callback: () => void | Promise<void>,
      errorNotice: string,
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
            message: errorNotice,
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

  const resolvedState = isHomeDashboardState(state)
    ? state
    : "error";
  const hasUsableReport =
    hasUsableHomeDashboardReport(report);
  const shouldShowError =
    resolvedState === "error" ||
    ((resolvedState === "ready" ||
      resolvedState === "empty") &&
      !hasUsableReport);

  const shell = (children: ReactNode) => (
    <main
      className="min-h-screen bg-[var(--dl-page)] px-4 py-5 text-[var(--dl-text-primary)] sm:px-6 lg:px-8"
      data-testid="home-dashboard-main"
      style={{ ...themeStyle, fontFamily: fonts.ui }}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <header className="min-h-[44px]">
          <div
            className="text-xl text-[var(--dl-bark)]"
            style={{ fontFamily: fonts.display }}
          >
            {copy.wordmark}
          </div>
        </header>
        {children}
        <ToastRegion notice={toastNotice?.message ?? null} />
      </div>
    </main>
  );

  if (resolvedState === "loading") {
    return shell(
      <section
        aria-live="polite"
        className="rounded-[28px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-6"
        role="status"
      >
        <Eyebrow>{copy.profileContext}</Eyebrow>
        <h1
          className="mt-4 text-4xl text-[var(--dl-text-primary)]"
          style={{ fontFamily: fonts.display }}
        >
          {copy.loadingHeading}
        </h1>
        <p className="mt-3 max-w-xl text-base text-[var(--dl-text-secondary)]">
          {copy.loadingSupporting}
        </p>
      </section>,
    );
  }

  if (shouldShowError) {
    return shell(
      <>
        <section
          className="rounded-[28px] border border-[var(--dl-error-text)] bg-[var(--dl-error-surface)] p-6 text-[var(--dl-error-text)]"
          role="alert"
        >
          <h1
            className="text-4xl"
            style={{ fontFamily: fonts.display }}
          >
            {copy.errorHeading}
          </h1>
          <p className="mt-3 max-w-xl text-sm font-semibold">
            {copy.errorSupporting}
          </p>
        </section>
        {typeof onRetryLoad === "function" ? (
          <div>
            <SecondaryButton
              activeOperation={activeOperation}
              blockedLabel={copy.retryLoad}
              label={copy.retryLoad}
              onClick={() => {
                if (
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
              }}
              operation="retry-load"
              pendingLabel={copy.retryingLoad}
              unavailableLabel={null}
            />
          </div>
        ) : null}
      </>,
    );
  }

  const safeReport = report as HomeDashboardReport;
  const profileName = getProfileName(safeReport);
  const profileGreeting = getSafeDisplayText(
    safeReport.greetingLabel,
    `${copy.welcomePrefix} ${profileName}`,
  );
  const isEmptyState = resolvedState === "empty";
  const snapshot = isEmptyState
    ? undefined
    : safeReport.latestSnapshot;
  const routine = isEmptyState ? undefined : safeReport.routine;
  const recentOrder = isEmptyState
    ? undefined
    : safeReport.recentOrder;
  const environment = isEmptyState
    ? undefined
    : safeReport.environment;
  const profileSyncLabel = getSafeDisplayText(
    safeReport.profile.syncLabel,
    copy.profileSyncFallback,
  );
  const routineTitleLabel = routine
    ? getSafeDisplayText(
        routine.title,
        copy.routineTitleFallback,
      )
    : null;
  const routineSupportingLabel = routine
    ? getSafeDisplayText(
        routine.supporting,
        copy.routineSupportingFallback,
      )
    : null;
  const routineUpdatedLabel = getOptionalDisplayText(
    routine?.updatedAtLabel,
  );
  const routineMorningLabel = getOptionalDisplayText(
    routine?.morningSummaryLabel,
  );
  const routineEveningLabel = getOptionalDisplayText(
    routine?.eveningSummaryLabel,
  );
  const snapshotCapturedLabel = snapshot
    ? getSafeDisplayText(
        snapshot.capturedAtLabel,
        copy.snapshotCapturedFallback,
      )
    : null;
  const snapshotCategoryLabel = snapshot
    ? getSafeDisplayText(
        snapshot.categoryLabel,
        copy.snapshotCategoryFallback,
      )
    : null;
  const snapshotScoreLabel = getOptionalDisplayText(
    snapshot?.scoreLabel,
  );
  const snapshotComparisonLabel = getOptionalDisplayText(
    snapshot?.comparisonLabel,
  );
  const snapshotSaveLabel = getOptionalDisplayText(
    snapshot?.saveLabel,
  );
  const recentOrderReferenceLabel = recentOrder
    ? getSafeDisplayText(
        recentOrder.orderReferenceLabel,
        copy.recentOrderReferenceFallback,
      )
    : null;
  const recentOrderStatusLabel = recentOrder
    ? getSafeDisplayText(
        recentOrder.statusLabel,
        copy.recentOrderStatusFallback,
      )
    : null;
  const recentOrderSupportingLabel = getOptionalDisplayText(
    recentOrder?.supporting,
  );
  const environmentUvLabel = getOptionalDisplayText(
    environment?.uvLabel,
  );
  const environmentAqiLabel = getOptionalDisplayText(
    environment?.aqiLabel,
  );
  const environmentGuidanceLabel = getOptionalDisplayText(
    environment?.guidanceLabel,
  );
  const environmentUpdatedLabel = getOptionalDisplayText(
    environment?.updatedAtLabel,
  );
  const hasUsableSnapshotImage =
    hasSnapshotImageUrl(snapshot);
  const snapshotImageKey = hasUsableSnapshotImage
    ? `${snapshot.reportId}::${snapshot.imageUrl}`
    : null;
  const snapshotImageFailed =
    snapshotImageKey !== null &&
    failedImageKey === snapshotImageKey;
  const canUseLatestReportRoute = getActionAvailability({
    callback: onOpenLatestReport,
    canOpen: canOpenLatestReport,
    hasRouteContext: hasUsableLatestSnapshotRoute(snapshot),
    isAvailableOffline: isLatestReportAvailableOffline,
    isOffline,
  });
  const canUseRoutineRoute = getActionAvailability({
    callback: onOpenRoutine,
    canOpen: canOpenRoutine,
    hasRouteContext: hasUsableRoutineRoute(routine),
    isAvailableOffline: isRoutineAvailableOffline,
    isOffline,
  });
  const canUseProgressRoute = getActionAvailability({
    callback: onOpenProgress,
    canOpen: canOpenProgress,
    isAvailableOffline: isProgressAvailableOffline,
    isOffline,
  });
  const canUseRecentOrderRoute = getActionAvailability({
    callback: onOpenRecentOrder,
    canOpen: canOpenRecentOrder,
    hasRouteContext: hasUsableRecentOrderRoute(recentOrder),
    isAvailableOffline: isRecentOrderAvailableOffline,
    isOffline,
  });
  const canUseStartRoute = getActionAvailability({
    callback: onStartAnalysis,
    canOpen: canStartAnalysis,
    isAvailableOffline: isStartAnalysisAvailableOffline,
    isOffline,
  });
  const canUseProfileRoute = getActionAvailability({
    callback: onChangeProfile,
    canOpen: canChangeProfile,
    isAvailableOffline: true,
    isOffline,
  });
  const shouldShowOrderAttention = Boolean(recentOrder);
  const shouldShowEnvironmentAttention =
    !shouldShowOrderAttention &&
    showEnvironmentalModule === true &&
    hasEnvironmentalMeasurements(environment);

  return shell(
    <>
      <section
        className="rounded-[28px] border border-[var(--dl-border-subtle)] bg-[linear-gradient(135deg,var(--dl-surface),var(--dl-blush)_55%,var(--dl-parchment))] p-6"
        data-testid="home-profile-card"
      >
        <Eyebrow>{copy.profileContext}</Eyebrow>
        <h1
          className="mt-4 text-4xl leading-tight text-[var(--dl-text-primary)] sm:text-5xl"
          style={{ fontFamily: fonts.display }}
        >
          {copy.homeHeading}
        </h1>
        <p className="mt-4 text-xl font-bold text-[var(--dl-bark)]">
          {profileGreeting}
        </p>
        <p className="mt-2 text-sm text-[var(--dl-text-secondary)]">
          {profileSyncLabel}
        </p>
        <p className="mt-3 rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-2 text-sm font-semibold text-[var(--dl-text-secondary)]">
          {copy.localFirstHelper}
        </p>
        <div className="mt-5">
          <SecondaryButton
            activeOperation={activeOperation}
            blockedLabel={copy.changeProfileBlocked}
            label={copy.changeProfile}
            onClick={() => {
              if (
                !canUseProfileRoute.isAvailable ||
                typeof onChangeProfile !== "function" ||
                activeOperation !== null ||
                inFlightRef.current !== null
              ) {
                return;
              }

              void runOperation(
                "change-profile",
                onChangeProfile,
                copy.changeProfileError,
              );
            }}
            operation="change-profile"
            pendingLabel={copy.changingProfile}
            unavailableLabel={
              canUseProfileRoute.isAvailable
                ? null
                : copy.changeProfileBlocked
            }
          />
        </div>
      </section>

      {isOffline ? (
        <div
          aria-live="polite"
          className="rounded-[18px] border border-[var(--dl-warning-text)] bg-[var(--dl-warning-surface)] px-4 py-3 text-sm font-semibold text-[var(--dl-warning-text)]"
          role="status"
        >
          {copy.offline}
        </div>
      ) : null}

      {isEmptyState ? (
        <SectionCard testId="home-empty-card">
          <h2
            className="text-3xl text-[var(--dl-text-primary)]"
            style={{ fontFamily: fonts.display }}
          >
            {copy.emptyHeading}
          </h2>
          <p className="mt-2 text-sm text-[var(--dl-text-secondary)]">
            {copy.emptySupporting}
          </p>
        </SectionCard>
      ) : null}

      <SectionCard
        className="bg-[linear-gradient(180deg,var(--dl-surface),var(--dl-surface-soft))]"
        testId="home-start-card"
      >
        <h2
          className="text-3xl text-[var(--dl-text-primary)]"
          style={{ fontFamily: fonts.display }}
        >
          {copy.startCardTitle}
        </h2>
        <p className="mt-2 text-sm text-[var(--dl-text-secondary)]">
          {copy.startCardSupporting}
        </p>
        <div className="mt-5">
          <PrimaryButton
            activeOperation={activeOperation}
            blockedLabel={copy.startBlocked}
            label={copy.startAnalysis}
            onClick={() => {
              if (
                !canUseStartRoute.isAvailable ||
                typeof onStartAnalysis !== "function" ||
                activeOperation !== null ||
                inFlightRef.current !== null
              ) {
                return;
              }

              void runOperation(
                "start-analysis",
                () =>
                  onStartAnalysis(
                    safeReport.profile.profileId,
                  ),
                copy.startError,
              );
            }}
            operation="start-analysis"
            pendingLabel={copy.startingAnalysis}
            unavailableLabel={
              canUseStartRoute.isGenerallyBlocked
                ? copy.startBlocked
                : canUseStartRoute.isOfflineBlocked
                  ? copy.startOfflineBlocked
                  : null
            }
          />
        </div>
      </SectionCard>

      <SectionCard testId="home-routine-card">
        <h2
          className="text-2xl text-[var(--dl-text-primary)]"
          style={{ fontFamily: fonts.display }}
        >
          {copy.routineTitle}
        </h2>
        {routine ? (
          <>
            <p className="mt-3 text-base font-bold text-[var(--dl-bark)]">
              {routineTitleLabel}
            </p>
            <p className="mt-1 text-sm text-[var(--dl-text-secondary)]">
              {routineSupportingLabel}
            </p>
            <dl className="mt-4 grid gap-3 text-sm text-[var(--dl-text-secondary)] sm:grid-cols-2">
              {routineUpdatedLabel ? (
                <div>
                  <dt className="font-semibold text-[var(--dl-bark)]">
                    Updated
                  </dt>
                  <dd>{routineUpdatedLabel}</dd>
                </div>
              ) : null}
              {routineMorningLabel ? (
                <div>
                  <dt className="font-semibold text-[var(--dl-bark)]">
                    Morning
                  </dt>
                  <dd>{routineMorningLabel}</dd>
                </div>
              ) : null}
              {routineEveningLabel ? (
                <div>
                  <dt className="font-semibold text-[var(--dl-bark)]">
                    Evening
                  </dt>
                  <dd>{routineEveningLabel}</dd>
                </div>
              ) : null}
            </dl>
          </>
        ) : (
          <div className="mt-3 rounded-[18px] bg-[var(--dl-surface-soft)] p-4 text-sm text-[var(--dl-text-secondary)]">
            <p className="font-bold text-[var(--dl-bark)]">
              {copy.routineEmpty}
            </p>
            <p className="mt-1">{copy.routineEmptySupporting}</p>
          </div>
        )}
        <div className="mt-4">
          <SecondaryButton
            activeOperation={activeOperation}
            blockedLabel={copy.routineBlocked}
            label={copy.openRoutine}
            onClick={() => {
              if (
                !canUseRoutineRoute.isAvailable ||
                !hasUsableRoutineRoute(routine) ||
                typeof onOpenRoutine !== "function" ||
                activeOperation !== null ||
                inFlightRef.current !== null
              ) {
                return;
              }

              void runOperation(
                "open-routine",
                () => onOpenRoutine(routine.routineId),
                copy.routineError,
              );
            }}
            operation="open-routine"
            pendingLabel={copy.openingRoutine}
            unavailableLabel={
              canUseRoutineRoute.isGenerallyBlocked
                ? copy.routineBlocked
                : canUseRoutineRoute.isOfflineBlocked
                  ? copy.routineOfflineBlocked
                  : null
            }
          />
        </div>
      </SectionCard>

      <SectionCard testId="home-skin-journey-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="sm:w-44 sm:shrink-0">
            {hasUsableSnapshotImage && !snapshotImageFailed ? (
              <img
                alt={getSnapshotImageAlt(snapshot)}
                className="h-[150px] w-full rounded-[18px] object-cover"
                key={snapshotImageKey ?? "snapshot-image"}
                onError={() => {
                  if (snapshotImageKey) {
                    setFailedImageKey(snapshotImageKey);
                  }
                }}
                src={snapshot.imageUrl}
              />
            ) : (
              <Placeholder label={copy.snapshotImagePlaceholder} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-2xl text-[var(--dl-text-primary)]"
              style={{ fontFamily: fonts.display }}
            >
              {copy.skinJourneyTitle}
            </h2>
            {snapshot ? (
              <dl className="mt-3 grid gap-2 text-sm text-[var(--dl-text-secondary)]">
                <div>
                  <dt className="font-semibold text-[var(--dl-bark)]">
                    Captured
                  </dt>
                  <dd>{snapshotCapturedLabel}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--dl-bark)]">
                    Latest summary
                  </dt>
                  <dd>{snapshotCategoryLabel}</dd>
                </div>
                {snapshotScoreLabel ? (
                  <div>
                    <dt className="font-semibold text-[var(--dl-bark)]">
                      Host label
                    </dt>
                    <dd>{snapshotScoreLabel}</dd>
                  </div>
                ) : null}
                {snapshotComparisonLabel ? (
                  <div>
                    <dt className="font-semibold text-[var(--dl-bark)]">
                      Host summary
                    </dt>
                    <dd>{snapshotComparisonLabel}</dd>
                  </div>
                ) : null}
                {snapshotSaveLabel ? (
                  <div>
                    <dt className="font-semibold text-[var(--dl-bark)]">
                      Saved
                    </dt>
                    <dd>{snapshotSaveLabel}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <div className="mt-3 rounded-[18px] bg-[var(--dl-surface-soft)] p-4 text-sm text-[var(--dl-text-secondary)]">
                <p className="font-bold text-[var(--dl-bark)]">
                  {copy.latestSnapshotEmpty}
                </p>
                <p className="mt-1">
                  {copy.latestSnapshotEmptySupporting}
                </p>
              </div>
            )}
            <p className="mt-4 text-sm text-[var(--dl-text-secondary)]">
              {copy.progressSupporting}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <SecondaryButton
                activeOperation={activeOperation}
                blockedLabel={copy.latestReportBlocked}
                label={copy.openLatestReport}
                onClick={() => {
                  if (
                    !canUseLatestReportRoute.isAvailable ||
                    !hasUsableLatestSnapshotRoute(snapshot) ||
                    typeof onOpenLatestReport !== "function" ||
                    activeOperation !== null ||
                    inFlightRef.current !== null
                  ) {
                    return;
                  }

                  void runOperation(
                    "open-latest-report",
                    () => onOpenLatestReport(snapshot.reportId),
                    copy.latestReportError,
                  );
                }}
                operation="open-latest-report"
                pendingLabel={copy.openingLatestReport}
                unavailableLabel={
                  canUseLatestReportRoute.isGenerallyBlocked
                    ? copy.latestReportBlocked
                    : canUseLatestReportRoute.isOfflineBlocked
                      ? copy.latestReportOfflineBlocked
                      : null
                }
              />
              <SecondaryButton
                activeOperation={activeOperation}
                blockedLabel={copy.progressBlocked}
                label={copy.openProgress}
                onClick={() => {
                  if (
                    !canUseProgressRoute.isAvailable ||
                    typeof onOpenProgress !== "function" ||
                    activeOperation !== null ||
                    inFlightRef.current !== null
                  ) {
                    return;
                  }

                  void runOperation(
                    "open-progress",
                    () => onOpenProgress(),
                    copy.progressError,
                  );
                }}
                operation="open-progress"
                pendingLabel={copy.openingProgress}
                unavailableLabel={
                  canUseProgressRoute.isGenerallyBlocked
                    ? copy.progressBlocked
                    : canUseProgressRoute.isOfflineBlocked
                      ? copy.progressOfflineBlocked
                      : null
                }
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {shouldShowOrderAttention && recentOrder ? (
        <SectionCard testId="home-attention-card">
          <h2
            className="text-2xl text-[var(--dl-text-primary)]"
            style={{ fontFamily: fonts.display }}
          >
            {copy.recentOrderTitle}
          </h2>
          <p className="mt-3 text-base font-bold text-[var(--dl-bark)]">
            {recentOrderReferenceLabel}
          </p>
          <p className="mt-1 text-sm text-[var(--dl-text-secondary)]">
            {recentOrderStatusLabel}
          </p>
          {recentOrderSupportingLabel ? (
            <p className="mt-2 text-sm text-[var(--dl-text-secondary)]">
              {recentOrderSupportingLabel}
            </p>
          ) : null}
          <div className="mt-4">
            <SecondaryButton
              activeOperation={activeOperation}
              blockedLabel={copy.recentOrderBlocked}
              label={copy.openRecentOrder}
              onClick={() => {
                if (
                  !canUseRecentOrderRoute.isAvailable ||
                  !hasUsableRecentOrderRoute(recentOrder) ||
                  typeof onOpenRecentOrder !== "function" ||
                  activeOperation !== null ||
                  inFlightRef.current !== null
                ) {
                  return;
                }

                void runOperation(
                  "open-recent-order",
                  () => onOpenRecentOrder(recentOrder.orderId),
                  copy.recentOrderError,
                );
              }}
              operation="open-recent-order"
              pendingLabel={copy.openingRecentOrder}
              unavailableLabel={
                canUseRecentOrderRoute.isGenerallyBlocked
                  ? copy.recentOrderBlocked
                  : canUseRecentOrderRoute.isOfflineBlocked
                    ? copy.recentOrderOfflineBlocked
                    : null
              }
            />
          </div>
        </SectionCard>
      ) : null}

      {shouldShowEnvironmentAttention && environment ? (
        <SectionCard testId="home-attention-card">
          <h2
            className="text-2xl text-[var(--dl-text-primary)]"
            style={{ fontFamily: fonts.display }}
          >
            {copy.environmentTitle}
          </h2>
          <dl className="mt-3 grid gap-3 text-sm text-[var(--dl-text-secondary)]">
            {environmentUvLabel ? (
              <div>
                <dt className="font-semibold text-[var(--dl-bark)]">
                  UV
                </dt>
                <dd>{environmentUvLabel}</dd>
              </div>
            ) : null}
            {environmentAqiLabel ? (
              <div>
                <dt className="font-semibold text-[var(--dl-bark)]">
                  AQI
                </dt>
                <dd>{environmentAqiLabel}</dd>
              </div>
            ) : null}
            {environmentGuidanceLabel ? (
              <div>
                <dt className="font-semibold text-[var(--dl-bark)]">
                  Guidance
                </dt>
                <dd>{environmentGuidanceLabel}</dd>
              </div>
            ) : null}
            {environmentUpdatedLabel ? (
              <div>
                <dt className="font-semibold text-[var(--dl-bark)]">
                  Updated
                </dt>
                <dd>{environmentUpdatedLabel}</dd>
              </div>
            ) : null}
          </dl>
        </SectionCard>
      ) : null}
    </>,
  );
}
