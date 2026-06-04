import {
  type CSSProperties,
  type ReactNode,
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
  canChangeProfile?: boolean;
  canOpenLatestReport?: boolean;
  canOpenRoutine?: boolean;
  canOpenGuestScanner?: boolean;
  isGuestScannerAvailableOffline?: boolean;
  canOpenProgress?: boolean;
  canOpenOrders?: boolean;
  canOpenStore?: boolean;
  canOpenRecentOrder?: boolean;
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

export const copy = {
  wordmark: "DermaLens",
  changeProfile: "Change profile",
  changingProfile: "Changing profile...",
  changeProfileBlocked: "Profile switching unavailable",
  loadingHeading: "Preparing your dashboard",
  loadingSupporting: "Your skincare home base is being prepared.",
  readyHeading: "Good to see you again",
  emptyHeading: "Your dashboard is ready",
  emptySupporting:
    "Start your first scan to build a skincare snapshot and routine.",
  errorHeading: "We could not load your dashboard",
  errorSupporting:
    "Your locally supplied content is protected. Try loading the dashboard again.",
  retryLoad: "Try again",
  retryingLoad: "Trying again...",
  retryError: "We could not reload the dashboard. Please try again.",
  offline:
    "You appear to be offline. Locally supplied dashboard details remain visible.",
  profileContext: "ACTIVE PROFILE",
  localFirstHelper: "Your profile stays local unless you choose to sync it.",
  startCardTitle: "Start a new skin scan",
  startCardSupporting:
    "Take or choose a photo when you want an updated skincare snapshot.",
  startAnalysis: "Start a new scan",
  startingAnalysis: "Starting scan...",
  startBlocked: "Scan unavailable right now",
  startError: "We could not start a new scan. Please try again.",
  latestSnapshotTitle: "Latest snapshot",
  latestSnapshotEmpty: "No skin snapshot yet.",
  latestSnapshotEmptySupporting:
    "Start a scan when you are ready to compare visible skincare patterns.",
  openLatestReport: "View latest report",
  openingLatestReport: "Opening report...",
  latestReportBlocked: "Report unavailable right now",
  latestReportError: "We could not open the latest report. Please try again.",
  snapshotImageAlt: "Latest skincare snapshot",
  snapshotImagePlaceholder: "Snapshot image unavailable",
  routineTitle: "Active routine",
  routineEmpty: "No active routine yet.",
  routineEmptySupporting:
    "Your routine will appear here after a report is ready.",
  openRoutine: "Open routine",
  openingRoutine: "Opening routine...",
  routineBlocked: "Routine unavailable right now",
  routineError: "We could not open your routine. Please try again.",
  quickActionsTitle: "Quick actions",
  scannerTitle: "Ingredient scanner",
  scannerSupporting: "Check a product ingredient list.",
  openScanner: "Open scanner",
  openingScanner: "Opening scanner...",
  scannerBlocked: "Scan unavailable right now",
  scannerOfflineBlocked: "Reconnect to scan ingredients",
  scannerError: "We could not open ingredient scanning. Please try again.",
  progressTitle: "Progress",
  progressSupporting: "Review host-supplied scan history.",
  openProgress: "Open progress",
  openingProgress: "Opening progress...",
  progressBlocked: "Progress unavailable right now",
  progressError: "We could not open progress. Please try again.",
  ordersTitle: "Orders",
  ordersSupporting: "Check first-party order activity.",
  openOrders: "Open orders",
  openingOrders: "Opening orders...",
  ordersBlocked: "Orders unavailable right now",
  ordersError: "We could not open orders. Please try again.",
  storeTitle: "Store",
  storeSupporting: "Browse DermaLens products.",
  openStore: "Open store",
  openingStore: "Opening store...",
  storeBlocked: "Store unavailable right now",
  storeError: "We could not open the store. Please try again.",
  recentOrderTitle: "Recent order",
  openRecentOrder: "View order details",
  openingRecentOrder: "Opening order...",
  recentOrderBlocked: "Order details unavailable",
  recentOrderError: "We could not open order details. Please try again.",
  environmentTitle: "UV and air quality",
  environmentUnavailable: "Environment details are unavailable right now.",
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

type ThemeStyle = CSSProperties & Record<`--dl-${string}`, string>;

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
  return report.profile.displayName.trim() || "Your profile";
}

function getSnapshotImageAlt(snapshot: DashboardLatestSnapshot) {
  const suppliedAlt = snapshot.imageAlt?.trim();
  return suppliedAlt ? suppliedAlt : copy.snapshotImageAlt;
}

function hasEnvironmentalMeasurements(
  environment: DashboardEnvironmentalSummary | undefined,
) {
  return (
    isNonWhitespaceString(environment?.uvLabel) ||
    isNonWhitespaceString(environment?.aqiLabel)
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-[0_18px_60px_rgba(92,74,66,0.08)] ${className}`}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--dl-dusk)]"
      style={{ fontFamily: fonts.metadata }}
    >
      {children}
    </p>
  );
}

function ActionButton({
  blocked,
  blockedLabel,
  children,
  className = "",
  label,
  minHeight = "min-h-[44px]",
  onClick,
  operation,
  pendingLabel,
  activeOperation,
}: {
  blocked?: boolean;
  blockedLabel: string;
  children?: ReactNode;
  className?: string;
  label: string;
  minHeight?: string;
  onClick: () => void;
  operation: Exclude<HomeDashboardOperation, null>;
  pendingLabel: string;
  activeOperation: HomeDashboardOperation;
}) {
  const isPending = activeOperation === operation;
  const hasConflictingOperation = activeOperation !== null && !isPending;
  const isDisabled = blocked || isPending || hasConflictingOperation;
  const visibleLabel = isPending ? pendingLabel : blocked ? blockedLabel : label;

  return (
    <button
      className={`${focusRing} ${minHeight} rounded-full px-4 py-2 text-sm font-bold motion-safe:transition disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      type="button"
    >
      {children ? (
        <span className="flex items-center justify-center gap-2">
          {children}
          <span>{visibleLabel}</span>
        </span>
      ) : (
        visibleLabel
      )}
    </button>
  );
}

function SecondaryButton(props: Omit<Parameters<typeof ActionButton>[0], "className">) {
  return (
    <ActionButton
      {...props}
      className="border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)]"
    />
  );
}

function PrimaryButton(props: Omit<Parameters<typeof ActionButton>[0], "className" | "minHeight">) {
  return (
    <ActionButton
      {...props}
      className="bg-[var(--dl-bark)] text-white shadow-[0_12px_32px_rgba(92,74,66,0.2)] hover:bg-[var(--dl-bark-hover)]"
      minHeight="min-h-[52px]"
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

export default function HomeDashboardScreen({
  state = "ready",
  report = null,
  isOffline = false,
  showEnvironmentalModule = false,
  canStartAnalysis = true,
  canChangeProfile = true,
  canOpenLatestReport = true,
  canOpenRoutine = true,
  canOpenGuestScanner = true,
  isGuestScannerAvailableOffline = true,
  canOpenProgress = true,
  canOpenOrders = true,
  canOpenStore = true,
  canOpenRecentOrder = true,
  onStartAnalysis,
  onChangeProfile,
  onOpenLatestReport,
  onOpenRoutine,
  onOpenGuestScanner,
  onOpenProgress,
  onOpenOrders,
  onOpenStore,
  onOpenRecentOrder,
  onRetryLoad,
}: HomeDashboardScreenProps) {
  const mountedRef = useRef(false);
  const inFlightRef = useRef<HomeDashboardOperation>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [activeOperation, setActiveOperation] =
    useState<HomeDashboardOperation>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [failedImageKey, setFailedImageKey] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (notice: string) => {
    if (!mountedRef.current) {
      return;
    }

    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    setToastNotice(notice);
    toastTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setToastNotice(null);
      }
    }, 5000);
  };

  const runOperation = async (
    operation: Exclude<HomeDashboardOperation, null>,
    callback: () => void | Promise<void>,
    errorNotice: string,
  ) => {
    if (inFlightRef.current !== null) {
      return;
    }

    inFlightRef.current = operation;
    setActiveOperation(operation);

    try {
      await callback();
    } catch {
      showToast(errorNotice);
    } finally {
      if (mountedRef.current) {
        inFlightRef.current = null;
        setActiveOperation(null);
      }
    }
  };

  const resolvedState = isHomeDashboardState(state) ? state : "error";
  const hasUsableReport = hasUsableHomeDashboardReport(report);
  const shouldShowError =
    resolvedState === "error" ||
    ((resolvedState === "ready" || resolvedState === "empty") && !hasUsableReport);

  const shell = (children: ReactNode) => (
    <main
      className="min-h-screen bg-[var(--dl-page)] px-4 py-5 text-[var(--dl-text-primary)] sm:px-6 lg:px-8"
      style={{ ...themeStyle, fontFamily: fonts.ui }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex min-h-[44px] items-center justify-between gap-4">
          <div
            className="text-xl text-[var(--dl-bark)]"
            style={{ fontFamily: fonts.display }}
          >
            {copy.wordmark}
          </div>
          {hasUsableReport ? (
            <SecondaryButton
              activeOperation={activeOperation}
              blocked={!canChangeProfile}
              blockedLabel={copy.changeProfileBlocked}
              label={copy.changeProfile}
              onClick={() =>
                runOperation(
                  "change-profile",
                  onChangeProfile,
                  copy.changeProfileBlocked,
                )
              }
              operation="change-profile"
              pendingLabel={copy.changingProfile}
            />
          ) : null}
        </header>
        {children}
      </div>
      {toastNotice ? (
        <div
          aria-label={copy.toastNoticeLabel}
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-10 mx-auto max-w-md rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-bark)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_44px_rgba(58,46,40,0.22)]"
          role="status"
        >
          {toastNotice}
        </div>
      ) : null}
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
        {onRetryLoad ? (
          <div>
            <SecondaryButton
              activeOperation={activeOperation}
              blocked={false}
              blockedLabel={copy.retryLoad}
              label={copy.retryLoad}
              onClick={() =>
                runOperation("retry-load", onRetryLoad, copy.retryError)
              }
              operation="retry-load"
              pendingLabel={copy.retryingLoad}
            />
          </div>
        ) : null}
      </>,
    );
  }

  const safeReport = report as HomeDashboardReport;
  const profileName = getProfileName(safeReport);
  const snapshot = safeReport.latestSnapshot;
  const routine = safeReport.routine;
  const recentOrder = safeReport.recentOrder;
  const environment = safeReport.environment;
  const hasUsableSnapshotImage = hasSnapshotImageUrl(snapshot);
  const canUseLatestReportRoute =
    canOpenLatestReport &&
    Boolean(onOpenLatestReport) &&
    hasUsableLatestSnapshotRoute(snapshot);
  const canUseRoutineRoute =
    canOpenRoutine &&
    Boolean(onOpenRoutine) &&
    hasUsableRoutineRoute(routine);
  const canUseRecentOrderRoute =
    canOpenRecentOrder &&
    Boolean(onOpenRecentOrder) &&
    hasUsableRecentOrderRoute(recentOrder);
  const snapshotImageKey =
    hasUsableSnapshotImage ? `${snapshot.reportId}::${snapshot.imageUrl}` : null;
  const snapshotImageFailed =
    snapshotImageKey !== null && failedImageKey === snapshotImageKey;
  const scannerBlocked =
    !canOpenGuestScanner || (isOffline && !isGuestScannerAvailableOffline);

  return shell(
    <>
      {isOffline ? (
        <div
          aria-live="polite"
          className="rounded-[18px] border border-[var(--dl-warning-text)] bg-[var(--dl-warning-surface)] px-4 py-3 text-sm font-semibold text-[var(--dl-warning-text)]"
          role="status"
        >
          {copy.offline}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-[var(--dl-border-subtle)] bg-[linear-gradient(135deg,var(--dl-surface),var(--dl-blush)_55%,var(--dl-parchment))] p-6">
        <Eyebrow>{copy.profileContext}</Eyebrow>
        <h1
          className="mt-4 text-4xl leading-tight text-[var(--dl-text-primary)] sm:text-5xl"
          style={{ fontFamily: fonts.display }}
        >
          {safeReport.greetingLabel || copy.readyHeading}
        </h1>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-lg font-bold text-[var(--dl-bark)]">
              {profileName}
            </p>
            <p className="mt-1 text-sm text-[var(--dl-text-secondary)]">
              {safeReport.profile.syncLabel}
            </p>
          </div>
          <p className="rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-2 text-sm font-semibold text-[var(--dl-text-secondary)]">
            {copy.localFirstHelper}
          </p>
        </div>
      </section>

      {resolvedState === "empty" ? (
        <SectionCard>
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="flex flex-col gap-5">
          <SectionCard className="bg-[linear-gradient(180deg,var(--dl-surface),var(--dl-surface-soft))]">
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
                blocked={!canStartAnalysis}
                blockedLabel={copy.startBlocked}
                label={copy.startAnalysis}
                onClick={() =>
                  runOperation(
                    "start-analysis",
                    () => onStartAnalysis(safeReport.profile.profileId),
                    copy.startError,
                  )
                }
                operation="start-analysis"
                pendingLabel={copy.startingAnalysis}
              />
            </div>
          </SectionCard>

          <SectionCard>
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
                  {copy.latestSnapshotTitle}
                </h2>
                {snapshot ? (
                  <>
                    <dl className="mt-3 grid gap-2 text-sm text-[var(--dl-text-secondary)]">
                      <div>
                        <dt className="font-semibold text-[var(--dl-bark)]">
                          Captured
                        </dt>
                        <dd>{snapshot.capturedAtLabel}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[var(--dl-bark)]">
                          Snapshot
                        </dt>
                        <dd>{snapshot.categoryLabel}</dd>
                      </div>
                      {snapshot.scoreLabel ? (
                        <div>
                          <dt className="font-semibold text-[var(--dl-bark)]">
                            Host label
                          </dt>
                          <dd>{snapshot.scoreLabel}</dd>
                        </div>
                      ) : null}
                      {snapshot.comparisonLabel ? (
                        <div>
                          <dt className="font-semibold text-[var(--dl-bark)]">
                            Comparison
                          </dt>
                          <dd>{snapshot.comparisonLabel}</dd>
                        </div>
                      ) : null}
                      {snapshot.saveLabel ? (
                        <div>
                          <dt className="font-semibold text-[var(--dl-bark)]">
                            Saved
                          </dt>
                          <dd>{snapshot.saveLabel}</dd>
                        </div>
                      ) : null}
                    </dl>
                    <div className="mt-4">
                      <SecondaryButton
                        activeOperation={activeOperation}
                        blocked={!canUseLatestReportRoute}
                        blockedLabel={copy.latestReportBlocked}
                        label={copy.openLatestReport}
                        onClick={() =>
                          runOperation(
                            "open-latest-report",
                            () => {
                              if (!hasUsableLatestSnapshotRoute(snapshot)) {
                                return;
                              }

                              return onOpenLatestReport?.(snapshot.reportId);
                            },
                            copy.latestReportError,
                          )
                        }
                        operation="open-latest-report"
                        pendingLabel={copy.openingLatestReport}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mt-3 rounded-[18px] bg-[var(--dl-surface-soft)] p-4 text-sm text-[var(--dl-text-secondary)]">
                    <p className="font-bold text-[var(--dl-bark)]">
                      {copy.latestSnapshotEmpty}
                    </p>
                    <p className="mt-1">{copy.latestSnapshotEmptySupporting}</p>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <h2
              className="text-2xl text-[var(--dl-text-primary)]"
              style={{ fontFamily: fonts.display }}
            >
              {copy.routineTitle}
            </h2>
            {routine ? (
              <>
                <p className="mt-3 text-base font-bold text-[var(--dl-bark)]">
                  {routine.title}
                </p>
                <p className="mt-1 text-sm text-[var(--dl-text-secondary)]">
                  {routine.supporting}
                </p>
                <dl className="mt-4 grid gap-3 text-sm text-[var(--dl-text-secondary)] sm:grid-cols-2">
                  {routine.updatedAtLabel ? (
                    <div>
                      <dt className="font-semibold text-[var(--dl-bark)]">
                        Updated
                      </dt>
                      <dd>{routine.updatedAtLabel}</dd>
                    </div>
                  ) : null}
                  {routine.morningSummaryLabel ? (
                    <div>
                      <dt className="font-semibold text-[var(--dl-bark)]">
                        Morning
                      </dt>
                      <dd>{routine.morningSummaryLabel}</dd>
                    </div>
                  ) : null}
                  {routine.eveningSummaryLabel ? (
                    <div>
                      <dt className="font-semibold text-[var(--dl-bark)]">
                        Evening
                      </dt>
                      <dd>{routine.eveningSummaryLabel}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4">
                  <SecondaryButton
                    activeOperation={activeOperation}
                    blocked={!canUseRoutineRoute}
                    blockedLabel={copy.routineBlocked}
                    label={copy.openRoutine}
                    onClick={() =>
                      runOperation(
                        "open-routine",
                        () => {
                          if (!hasUsableRoutineRoute(routine)) {
                            return;
                          }

                          return onOpenRoutine?.(routine.routineId);
                        },
                        copy.routineError,
                      )
                    }
                    operation="open-routine"
                    pendingLabel={copy.openingRoutine}
                  />
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-[18px] bg-[var(--dl-surface-soft)] p-4 text-sm text-[var(--dl-text-secondary)]">
                <p className="font-bold text-[var(--dl-bark)]">
                  {copy.routineEmpty}
                </p>
                <p className="mt-1">{copy.routineEmptySupporting}</p>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="flex flex-col gap-5">
          <SectionCard>
            <h2
              className="text-2xl text-[var(--dl-text-primary)]"
              style={{ fontFamily: fonts.display }}
            >
              {copy.quickActionsTitle}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <QuickAction
                activeOperation={activeOperation}
                blocked={scannerBlocked}
                blockedLabel={
                  isOffline && !isGuestScannerAvailableOffline
                    ? copy.scannerOfflineBlocked
                    : copy.scannerBlocked
                }
                label={copy.openScanner}
                onClick={() =>
                  runOperation("open-scanner", onOpenGuestScanner, copy.scannerError)
                }
                operation="open-scanner"
                pendingLabel={copy.openingScanner}
                supporting={copy.scannerSupporting}
                title={copy.scannerTitle}
              />
              <QuickAction
                activeOperation={activeOperation}
                blocked={!canOpenProgress || !onOpenProgress}
                blockedLabel={copy.progressBlocked}
                label={copy.openProgress}
                onClick={() =>
                  runOperation(
                    "open-progress",
                    () => onOpenProgress?.(),
                    copy.progressError,
                  )
                }
                operation="open-progress"
                pendingLabel={copy.openingProgress}
                supporting={copy.progressSupporting}
                title={copy.progressTitle}
              />
              <QuickAction
                activeOperation={activeOperation}
                blocked={!canOpenOrders || !onOpenOrders}
                blockedLabel={copy.ordersBlocked}
                label={copy.openOrders}
                onClick={() =>
                  runOperation("open-orders", () => onOpenOrders?.(), copy.ordersError)
                }
                operation="open-orders"
                pendingLabel={copy.openingOrders}
                supporting={copy.ordersSupporting}
                title={copy.ordersTitle}
              />
              <QuickAction
                activeOperation={activeOperation}
                blocked={!canOpenStore}
                blockedLabel={copy.storeBlocked}
                label={copy.openStore}
                onClick={() =>
                  runOperation("open-store", onOpenStore, copy.storeError)
                }
                operation="open-store"
                pendingLabel={copy.openingStore}
                supporting={copy.storeSupporting}
                title={copy.storeTitle}
              />
            </div>
          </SectionCard>

          {recentOrder ? (
            <SectionCard>
              <h2
                className="text-2xl text-[var(--dl-text-primary)]"
                style={{ fontFamily: fonts.display }}
              >
                {copy.recentOrderTitle}
              </h2>
              <p className="mt-3 text-base font-bold text-[var(--dl-bark)]">
                {recentOrder.orderReferenceLabel}
              </p>
              <p className="mt-1 text-sm text-[var(--dl-text-secondary)]">
                {recentOrder.statusLabel}
              </p>
              {recentOrder.supporting ? (
                <p className="mt-2 text-sm text-[var(--dl-text-secondary)]">
                  {recentOrder.supporting}
                </p>
              ) : null}
              <div className="mt-4">
                <SecondaryButton
                  activeOperation={activeOperation}
                  blocked={!canUseRecentOrderRoute}
                  blockedLabel={copy.recentOrderBlocked}
                  label={copy.openRecentOrder}
                  onClick={() =>
                    runOperation(
                      "open-recent-order",
                      () => {
                        if (!hasUsableRecentOrderRoute(recentOrder)) {
                          return;
                        }

                        return onOpenRecentOrder?.(recentOrder.orderId);
                      },
                      copy.recentOrderError,
                    )
                  }
                  operation="open-recent-order"
                  pendingLabel={copy.openingRecentOrder}
                />
              </div>
            </SectionCard>
          ) : null}

          {showEnvironmentalModule ? (
            <SectionCard>
              <h2
                className="text-2xl text-[var(--dl-text-primary)]"
                style={{ fontFamily: fonts.display }}
              >
                {copy.environmentTitle}
              </h2>
              {/* Host owns this feature flag and the environmental adapter. */}
              {hasEnvironmentalMeasurements(environment) ? (
                <dl className="mt-3 grid gap-3 text-sm text-[var(--dl-text-secondary)]">
                  {isNonWhitespaceString(environment?.uvLabel) ? (
                    <div>
                      <dt className="font-semibold text-[var(--dl-bark)]">
                        UV
                      </dt>
                      <dd>{environment.uvLabel}</dd>
                    </div>
                  ) : null}
                  {isNonWhitespaceString(environment?.aqiLabel) ? (
                    <div>
                      <dt className="font-semibold text-[var(--dl-bark)]">
                        AQI
                      </dt>
                      <dd>{environment.aqiLabel}</dd>
                    </div>
                  ) : null}
                  {environment?.guidanceLabel ? (
                    <div>
                      <dt className="font-semibold text-[var(--dl-bark)]">
                        Guidance
                      </dt>
                      <dd>{environment.guidanceLabel}</dd>
                    </div>
                  ) : null}
                  {environment?.updatedAtLabel ? (
                    <div>
                      <dt className="font-semibold text-[var(--dl-bark)]">
                        Updated
                      </dt>
                      <dd>{environment.updatedAtLabel}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p
                  className="mt-3 rounded-[18px] bg-[var(--dl-surface-soft)] p-4 text-sm font-semibold text-[var(--dl-text-secondary)]"
                  role="status"
                >
                  {copy.environmentUnavailable}
                </p>
              )}
            </SectionCard>
          ) : null}
        </div>
      </div>
    </>,
  );
}

function QuickAction({
  activeOperation,
  blocked,
  blockedLabel,
  label,
  onClick,
  operation,
  pendingLabel,
  supporting,
  title,
}: {
  activeOperation: HomeDashboardOperation;
  blocked: boolean;
  blockedLabel: string;
  label: string;
  onClick: () => void;
  operation: Exclude<HomeDashboardOperation, null>;
  pendingLabel: string;
  supporting: string;
  title: string;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-4">
      <h3 className="text-base font-bold text-[var(--dl-bark)]">
        {title}
      </h3>
      <p className="mt-1 min-h-[40px] text-sm text-[var(--dl-text-secondary)]">
        {supporting}
      </p>
      <div className="mt-3">
        <SecondaryButton
          activeOperation={activeOperation}
          blocked={blocked}
          blockedLabel={blockedLabel}
          label={label}
          onClick={onClick}
          operation={operation}
          pendingLabel={pendingLabel}
        />
      </div>
    </div>
  );
}
