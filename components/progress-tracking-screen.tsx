import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft as BackIcon,
  FileText,
  History,
  Images,
  Info,
  RotateCcw,
  Sparkles,
  UserRound,
} from "lucide-react";

export type ProgressTrackingState =
  | "loading"
  | "ready"
  | "empty"
  | "error";

export type ProgressTrackingOperation =
  | "back"
  | "start-new-scan"
  | "select-baseline"
  | "select-comparison"
  | "open-report"
  | "open-routine"
  | "retry-load"
  | null;

export type ProgressComparisonTone =
  | "neutral"
  | "attention"
  | "caution";

export interface ProgressTrackingProfileSummary {
  profileId: string;
  displayName: string;
  contextLabel?: string;
}

export interface ProgressScanHistoryItem {
  scanId: string;
  capturedAtLabel: string;
  titleLabel: string;
  categoryLabel?: string;
  summaryLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
  photoQualityLabel?: string;
  isBaselineSelected?: boolean;
  isComparisonSelected?: boolean;
  canSelectAsBaseline?: boolean;
  canSelectAsComparison?: boolean;
  canOpenReport?: boolean;
}

export interface ProgressComparisonMetric {
  metricId: string;
  label: string;
  baselineValueLabel: string;
  comparisonValueLabel: string;
  deltaLabel?: string;
  supporting?: string;
  tone?: ProgressComparisonTone;
}

export interface ProgressTrackingComparisonSummary {
  baselineScanId: string;
  comparisonScanId: string;
  headingLabel: string;
  summaryLabel: string;
  metrics?: ProgressComparisonMetric[];
  helperLabel?: string;
}

export interface ProgressRoutinePrompt {
  routineId: string;
  titleLabel: string;
  supportingLabel: string;
  actionLabel?: string;
}

export interface ProgressTrackingReport {
  profile: ProgressTrackingProfileSummary;
  scans: ProgressScanHistoryItem[];
  comparison?: ProgressTrackingComparisonSummary;
  routinePrompt?: ProgressRoutinePrompt;
  helperLabel?: string;
  privacyLabel?: string;
}

export interface ProgressTrackingScreenProps {
  state?: ProgressTrackingState;
  report?: ProgressTrackingReport | null;
  isOffline?: boolean;
  canGoBack?: boolean;
  canStartNewScan?: boolean;
  canSelectBaseline?: boolean;
  canSelectComparison?: boolean;
  canOpenReport?: boolean;
  canOpenRoutine?: boolean;
  onBack: () => void | Promise<void>;
  onStartNewScan: (
    profileId: string,
  ) => void | Promise<void>;
  onSelectBaseline?: (
    scanId: string,
  ) => void | Promise<void>;
  onSelectComparison?: (
    scanId: string,
  ) => void | Promise<void>;
  onOpenReport?: (
    scanId: string,
  ) => void | Promise<void>;
  onOpenRoutine?: (
    routineId: string,
  ) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export function isProgressTrackingState(
  value: unknown,
): value is ProgressTrackingState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "empty" ||
    value === "error"
  );
}

export function isProgressComparisonTone(
  value: unknown,
): value is ProgressComparisonTone {
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

export function hasUsableProgressTrackingReport(
  report: ProgressTrackingReport | null | undefined,
): report is ProgressTrackingReport {
  return (
    report !== null &&
    report !== undefined &&
    report.profile !== null &&
    typeof report.profile === "object" &&
    isNonWhitespaceString(
      (report.profile as { profileId?: unknown }).profileId,
    ) &&
    Array.isArray(
      (report as { scans?: unknown }).scans,
    )
  );
}

export const copy = {
  wordmark: "DermaLens",
  back: "Back",
  backBlocked: "Back unavailable",
  contextLabel: "PROGRESS",
  heading: "Progress snapshots",
  supporting:
    "Review host-supplied snapshots and explicitly choose two scans when you want to compare them.",
  loadingHeading: "Preparing progress snapshots",
  loadingSupporting:
    "Your host-supplied scan history is being prepared.",
  errorHeading: "We could not load progress snapshots",
  errorSupporting: "Try loading the progress history again.",
  retry: "Try again",
  offline:
    "You appear to be offline. Supplied progress snapshots remain readable. The host controls which actions remain available.",
  profileTitle: "Progress profile",
  profileHelper:
    "Progress history is supplied by the host for this local profile.",
  unnamedProfile: "Unnamed profile",
  chooseTitle: "Choose snapshots to compare",
  chooseSupporting:
    "DermaLens does not infer progress automatically. Select a baseline and a comparison snapshot to review host-supplied notes.",
  historyTitle: "Snapshot history",
  comparisonTitle: "Comparison summary",
  startNewScan: "Start a new scan",
  startBlocked: "Scan setup unavailable right now",
  dateUnavailable: "Date unavailable",
  untitledSnapshot: "Untitled snapshot",
  imageAltFallback: "Skincare progress snapshot",
  imageUnavailable: "Snapshot image unavailable",
  useBaseline: "Use as baseline",
  selectedBaseline: "Selected baseline",
  baselineBlocked: "Baseline selection unavailable",
  useComparison: "Compare with this scan",
  selectedComparison: "Selected comparison",
  comparisonBlocked: "Comparison selection unavailable",
  openReport: "Open report",
  reportBlocked: "Report unavailable right now",
  comparisonUnavailable:
    "Comparison details are unavailable right now.",
  noMetrics: "No comparison metrics supplied.",
  metricLabelUnavailable: "Metric label unavailable",
  baselineValueUnavailable: "Baseline value unavailable",
  comparisonValueUnavailable: "Comparison value unavailable",
  routineTitleUnavailable: "Routine prompt unavailable",
  routineSupportingUnavailable: "Routine details are unavailable.",
  routineAction: "Open routine",
  routineBlocked: "Routine unavailable right now",
  emptyHeading: "No progress snapshots yet",
  emptySupporting:
    "Start a new scan to create a snapshot for future comparisons.",
  toastLabel: "Progress notice",
  goingBack: "Going back...",
  openingScanSetup: "Opening scan setup...",
  selectingBaseline: "Selecting baseline...",
  selectingComparison: "Selecting comparison...",
  openingReport: "Opening report...",
  openingRoutine: "Opening routine...",
  tryingAgain: "Trying again...",
  backError: "We could not go back. Please try again.",
  startError: "We could not open scan setup. Please try again.",
  baselineError:
    "We could not select the baseline snapshot. Please try again.",
  comparisonError:
    "We could not select the comparison snapshot. Please try again.",
  reportError: "We could not open the report. Please try again.",
  routineError: "We could not open the routine. Please try again.",
  retryError:
    "We could not reload progress snapshots. Please try again.",
  privacyFallback:
    "The host controls progress history, comparison choices, storage, and routing.",
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
  noticeText: "#7A5700",
  noticeSurface: "#FDF5E4",
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
  "--dl-notice-text": colors.noticeText,
  "--dl-notice-surface": colors.noticeSurface,
  "--dl-error-text": colors.errorText,
  "--dl-error-surface": colors.errorSurface,
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

type InFlightOperation = Exclude<
  ProgressTrackingOperation,
  null
>;

type ActionKind =
  | "select-baseline"
  | "select-comparison"
  | "open-report"
  | "open-routine";

function getDisplayText(
  value: unknown,
  fallback: string,
): string {
  return isNonWhitespaceString(value) ? value.trim() : fallback;
}

function getOptionalText(
  value: unknown,
): string | null {
  return isNonWhitespaceString(value) ? value.trim() : null;
}

function getRecord(
  item: unknown,
): Record<string, unknown> {
  return (
    item !== null &&
    typeof item === "object"
  )
    ? item as Record<string, unknown>
    : {};
}

function getTone(
  tone: unknown,
): ProgressComparisonTone {
  return isProgressComparisonTone(tone) ? tone : "neutral";
}

function toneClassName(
  tone: ProgressComparisonTone,
): string {
  if (tone === "caution") {
    return "border-[var(--dl-peach-strong)] bg-[var(--dl-error-surface)]";
  }

  if (tone === "attention") {
    return "border-[var(--dl-sand)] bg-[var(--dl-notice-surface)]";
  }

  return "border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)]";
}

function PageShell({
  activeOperation,
  canGoBack,
  children,
  onBack,
  toastText,
}: {
  activeOperation: ProgressTrackingOperation;
  canGoBack: boolean;
  children: ReactNode;
  onBack: () => void;
  toastText: string | null;
}) {
  const isBusy = activeOperation !== null;

  return (
    <main
      className="min-h-screen bg-[var(--dl-page)] px-4 py-4 text-[var(--dl-text-primary)] sm:px-6 lg:px-8"
      style={{
        ...themeStyle,
        fontFamily: fonts.ui,
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <button
            className={`${focusRing} inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-2 text-sm font-semibold text-[var(--dl-bark)] shadow-sm transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
            disabled={isBusy || !canGoBack}
            onClick={onBack}
            type="button"
          >
            <BackIcon aria-hidden="true" className="h-4 w-4" />
            {activeOperation === "back"
              ? copy.goingBack
              : canGoBack
                ? copy.back
                : copy.backBlocked}
          </button>
          <p
            className="text-sm font-bold tracking-[0.18em] text-[var(--dl-bark)]"
            style={{ fontFamily: fonts.metadata }}
          >
            {copy.wordmark}
          </p>
        </header>
        {children}
        <div
          aria-atomic="true"
          aria-live="polite"
          className="min-h-[2.75rem]"
          data-testid="toast-region"
          role={toastText ? "status" : undefined}
        >
          {toastText ? (
            <div className="rounded-[8px] border border-[var(--dl-blush-strong)] bg-[var(--dl-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--dl-error-text)] shadow-sm">
              <span className="sr-only">{copy.toastLabel}: </span>
              {toastText}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function IntroSection() {
  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm sm:p-7">
      <p
        className="mb-3 text-xs font-bold tracking-[0.22em] text-[var(--dl-peach-strong)]"
        style={{ fontFamily: fonts.metadata }}
      >
        {copy.contextLabel}
      </p>
      <h1
        className="text-4xl font-normal leading-tight text-[var(--dl-text-primary)] sm:text-5xl"
        style={{ fontFamily: fonts.display }}
      >
        {copy.heading}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--dl-text-secondary)]">
        {copy.supporting}
      </p>
    </section>
  );
}

function LoadingContent() {
  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-6 shadow-sm">
      <h1
        className="text-4xl font-normal text-[var(--dl-text-primary)]"
        style={{ fontFamily: fonts.display }}
      >
        {copy.loadingHeading}
      </h1>
      <p
        aria-live="polite"
        className="mt-4 text-base leading-7 text-[var(--dl-text-secondary)]"
        role="status"
      >
        {copy.loadingSupporting}
      </p>
    </section>
  );
}

function ErrorContent({
  activeOperation,
  hasRetryRoute,
  onRetryLoad,
}: {
  activeOperation: ProgressTrackingOperation;
  hasRetryRoute: boolean;
  onRetryLoad: () => void;
}) {
  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-6 shadow-sm">
      <h1
        className="text-4xl font-normal text-[var(--dl-text-primary)]"
        style={{ fontFamily: fonts.display }}
      >
        {copy.errorHeading}
      </h1>
      <div
        className="mt-4 rounded-[8px] border border-[var(--dl-blush-strong)] bg-[var(--dl-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--dl-error-text)]"
        role="alert"
      >
        {copy.errorSupporting}
      </div>
      {hasRetryRoute ? (
        <button
          className={`${focusRing} mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--dl-bark)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
          disabled={activeOperation !== null}
          onClick={onRetryLoad}
          type="button"
        >
          {activeOperation === "retry-load"
            ? copy.tryingAgain
            : copy.retry}
        </button>
      ) : null}
    </section>
  );
}

function OfflineBanner() {
  return (
    <div
      aria-live="polite"
      className="rounded-[8px] border border-[var(--dl-sand)] bg-[var(--dl-notice-surface)] px-4 py-3 text-sm font-semibold text-[var(--dl-notice-text)]"
      role="status"
    >
      {copy.offline}
    </div>
  );
}

function ProfileCard({
  report,
}: {
  report: ProgressTrackingReport;
}) {
  const profileRecord = getRecord(report.profile);
  const displayName = getDisplayText(
    profileRecord.displayName,
    copy.unnamedProfile,
  );
  const contextLabel = getOptionalText(
    profileRecord.contextLabel,
  );

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-bark)]">
          <UserRound aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {copy.profileTitle}
          </h2>
          <p className="mt-2 text-base font-semibold leading-7 text-[var(--dl-bark)]">
            {displayName}
          </p>
          {contextLabel ? (
            <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
              {contextLabel}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {copy.profileHelper}
          </p>
        </div>
      </div>
    </section>
  );
}

function ComparisonIntroCard({
  report,
}: {
  report: ProgressTrackingReport;
}) {
  const helperLabel = getOptionalText(report.helperLabel);
  const privacyLabel = getOptionalText(report.privacyLabel);

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface)] text-[var(--dl-bark)]">
          <Info aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {copy.chooseTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {copy.chooseSupporting}
          </p>
          {helperLabel ? (
            <p className="mt-3 rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface)] px-3 py-2 text-sm font-semibold leading-6 text-[var(--dl-bark)]">
              {helperLabel}
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {privacyLabel ?? copy.privacyFallback}
          </p>
        </div>
      </div>
    </section>
  );
}

function SnapshotImage({
  failedImageKey,
  imageAlt,
  imageKey,
  imageUrl,
  onImageError,
}: {
  failedImageKey: string | null;
  imageAlt: string;
  imageKey: string | null;
  imageUrl: string | null;
  onImageError: (imageKey: string) => void;
}) {
  const failed =
    imageKey !== null &&
    failedImageKey === imageKey;

  if (imageUrl === null || imageKey === null || failed) {
    return (
      <div className="flex min-h-[142px] items-center justify-center rounded-[8px] border border-dashed border-[var(--dl-sand)] bg-[var(--dl-surface-soft)] px-4 text-center text-sm font-semibold text-[var(--dl-text-secondary)]">
        {copy.imageUnavailable}
      </div>
    );
  }

  return (
    <img
      alt={imageAlt}
      className="h-[142px] w-full rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] object-cover"
      draggable={false}
      key={imageKey}
      onError={() => onImageError(imageKey)}
      src={imageUrl}
    />
  );
}

function ScanActionButton({
  action,
  activeOperation,
  activeTargetId,
  blocked,
  blockedLabel,
  disabled,
  label,
  onClick,
  pendingLabel,
  targetId,
  title,
}: {
  action: ActionKind;
  activeOperation: ProgressTrackingOperation;
  activeTargetId: string | null;
  blocked: boolean;
  blockedLabel: string;
  disabled: boolean;
  label: string;
  onClick: () => void;
  pendingLabel: string;
  targetId: string | null;
  title: string;
}) {
  const isPending =
    activeOperation === action &&
    activeTargetId !== null &&
    targetId !== null &&
    activeTargetId === targetId;
  const visibleLabel = isPending
    ? pendingLabel
    : blocked
      ? blockedLabel
      : label;
  const ariaLabel = isPending
    ? `${pendingLabel.replace("...", "")}: ${title}`
    : blocked
      ? `${blockedLabel}: ${title}`
      : `${label}: ${title}`;

  return (
    <button
      aria-label={ariaLabel}
      className={`${focusRing} inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-2 text-sm font-bold text-[var(--dl-bark)] transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {visibleLabel}
    </button>
  );
}

function ScanHistoryCard({
  activeOperation,
  activeTargetId,
  canOpenReport,
  canSelectBaseline,
  canSelectComparison,
  failedImageKey,
  item,
  onImageError,
  onOpenReport,
  onSelectBaseline,
  onSelectComparison,
}: {
  activeOperation: ProgressTrackingOperation;
  activeTargetId: string | null;
  canOpenReport: boolean;
  canSelectBaseline: boolean;
  canSelectComparison: boolean;
  failedImageKey: string | null;
  item: unknown;
  onImageError: (imageKey: string) => void;
  onOpenReport?: (scanId: string) => void;
  onSelectBaseline?: (scanId: string) => void;
  onSelectComparison?: (scanId: string) => void;
}) {
  const safeScan = getRecord(item);
  const scanId = isNonWhitespaceString(safeScan.scanId)
    ? safeScan.scanId
    : null;
  const title = getDisplayText(
    safeScan.titleLabel,
    copy.untitledSnapshot,
  );
  const capturedAt = getDisplayText(
    safeScan.capturedAtLabel,
    copy.dateUnavailable,
  );
  const categoryLabel = getOptionalText(
    safeScan.categoryLabel,
  );
  const summaryLabel = getOptionalText(
    safeScan.summaryLabel,
  );
  const photoQualityLabel = getOptionalText(
    safeScan.photoQualityLabel,
  );
  const imageUrl = getOptionalText(
    safeScan.imageUrl,
  );
  const imageAlt = getDisplayText(
    safeScan.imageAlt,
    copy.imageAltFallback,
  );
  const imageKey =
    scanId !== null && imageUrl !== null
      ? `${scanId}:${imageUrl}`
      : imageUrl !== null
        ? `snapshot:${imageUrl}`
        : null;
  const isBusy = activeOperation !== null;
  const selectedBaseline = safeScan.isBaselineSelected === true;
  const selectedComparison = safeScan.isComparisonSelected === true;
  const baselineAllowed =
    canSelectBaseline &&
    safeScan.canSelectAsBaseline !== false &&
    scanId !== null &&
    onSelectBaseline !== undefined &&
    !selectedBaseline;
  const comparisonAllowed =
    canSelectComparison &&
    safeScan.canSelectAsComparison !== false &&
    scanId !== null &&
    onSelectComparison !== undefined &&
    !selectedComparison;
  const reportAllowed =
    canOpenReport &&
    safeScan.canOpenReport !== false &&
    scanId !== null &&
    onOpenReport !== undefined;

  return (
    <li
      className="rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface)] p-4 shadow-sm"
      data-testid="progress-scan-card"
    >
      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
        <SnapshotImage
          failedImageKey={failedImageKey}
          imageAlt={imageAlt}
          imageKey={imageKey}
          imageUrl={imageUrl}
          onImageError={onImageError}
        />
        <div className="min-w-0">
          <p
            className="text-xs font-bold tracking-[0.16em] text-[var(--dl-peach-strong)]"
            style={{ fontFamily: fonts.metadata }}
          >
            {capturedAt}
          </p>
          <h3 className="mt-2 text-xl font-bold text-[var(--dl-text-primary)]">
            {title}
          </h3>
          {categoryLabel ? (
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--dl-bark)]">
              {categoryLabel}
            </p>
          ) : null}
          {summaryLabel ? (
            <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
              {summaryLabel}
            </p>
          ) : null}
          {photoQualityLabel ? (
            <p className="mt-3 rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--dl-bark)]">
              {photoQualityLabel}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <ScanActionButton
              action="select-baseline"
              activeOperation={activeOperation}
              activeTargetId={activeTargetId}
              blocked={!baselineAllowed}
              blockedLabel={
                selectedBaseline
                  ? copy.selectedBaseline
                  : copy.baselineBlocked
              }
              disabled={isBusy || !baselineAllowed}
              label={copy.useBaseline}
              onClick={() => {
                if (!baselineAllowed || scanId === null || isBusy) {
                  return;
                }

                onSelectBaseline(scanId);
              }}
              pendingLabel={copy.selectingBaseline}
              targetId={scanId}
              title={title}
            />
            <ScanActionButton
              action="select-comparison"
              activeOperation={activeOperation}
              activeTargetId={activeTargetId}
              blocked={!comparisonAllowed}
              blockedLabel={
                selectedComparison
                  ? copy.selectedComparison
                  : copy.comparisonBlocked
              }
              disabled={isBusy || !comparisonAllowed}
              label={copy.useComparison}
              onClick={() => {
                if (!comparisonAllowed || scanId === null || isBusy) {
                  return;
                }

                onSelectComparison(scanId);
              }}
              pendingLabel={copy.selectingComparison}
              targetId={scanId}
              title={title}
            />
            <ScanActionButton
              action="open-report"
              activeOperation={activeOperation}
              activeTargetId={activeTargetId}
              blocked={!reportAllowed}
              blockedLabel={copy.reportBlocked}
              disabled={isBusy || !reportAllowed}
              label={copy.openReport}
              onClick={() => {
                if (!reportAllowed || scanId === null || isBusy) {
                  return;
                }

                onOpenReport(scanId);
              }}
              pendingLabel={copy.openingReport}
              targetId={scanId}
              title={title}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

function ScanHistoryList({
  activeOperation,
  activeTargetId,
  canOpenReport,
  canSelectBaseline,
  canSelectComparison,
  failedImageKey,
  onImageError,
  onOpenReport,
  onSelectBaseline,
  onSelectComparison,
  scans,
}: {
  activeOperation: ProgressTrackingOperation;
  activeTargetId: string | null;
  canOpenReport: boolean;
  canSelectBaseline: boolean;
  canSelectComparison: boolean;
  failedImageKey: string | null;
  onImageError: (imageKey: string) => void;
  onOpenReport?: (scanId: string) => void;
  onSelectBaseline?: (scanId: string) => void;
  onSelectComparison?: (scanId: string) => void;
  scans: unknown[];
}) {
  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface)] text-[var(--dl-bark)]">
          <History aria-hidden="true" className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
          {copy.historyTitle}
        </h2>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {scans.map((item, index) => (
          <ScanHistoryCard
            activeOperation={activeOperation}
            activeTargetId={activeTargetId}
            canOpenReport={canOpenReport}
            canSelectBaseline={canSelectBaseline}
            canSelectComparison={canSelectComparison}
            failedImageKey={failedImageKey}
            item={item}
            key={index}
            onImageError={onImageError}
            onOpenReport={onOpenReport}
            onSelectBaseline={onSelectBaseline}
            onSelectComparison={onSelectComparison}
          />
        ))}
      </ul>
    </section>
  );
}

function EmptyStateCard() {
  return (
    <section
      className="rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-5 shadow-sm"
      data-testid="progress-empty-card"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface)] text-[var(--dl-bark)]">
          <Images aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-bark)]">
            {copy.emptyHeading}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {copy.emptySupporting}
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricRow({
  metric,
}: {
  metric: unknown;
}) {
  const safeMetric = getRecord(metric);
  const tone = getTone(safeMetric.tone);
  const label = getDisplayText(
    safeMetric.label,
    copy.metricLabelUnavailable,
  );
  const baselineValue = getDisplayText(
    safeMetric.baselineValueLabel,
    copy.baselineValueUnavailable,
  );
  const comparisonValue = getDisplayText(
    safeMetric.comparisonValueLabel,
    copy.comparisonValueUnavailable,
  );
  const deltaLabel = getOptionalText(safeMetric.deltaLabel);
  const supporting = getOptionalText(safeMetric.supporting);

  return (
    <li
      className={`rounded-[8px] border p-4 ${toneClassName(tone)}`}
      data-testid="progress-metric-row"
      data-tone={tone}
    >
      <h3 className="text-base font-bold text-[var(--dl-text-primary)]">
        {label}
      </h3>
      <dl className="mt-3 grid gap-3 text-sm text-[var(--dl-text-secondary)] sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-[var(--dl-bark)]">
            Baseline
          </dt>
          <dd>{baselineValue}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--dl-bark)]">
            Comparison
          </dt>
          <dd>{comparisonValue}</dd>
        </div>
      </dl>
      {deltaLabel ? (
        <p className="mt-3 rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-3 py-2 text-sm font-bold text-[var(--dl-bark)]">
          {deltaLabel}
        </p>
      ) : null}
      {supporting ? (
        <p className="mt-3 text-sm leading-6 text-[var(--dl-text-secondary)]">
          {supporting}
        </p>
      ) : null}
    </li>
  );
}

function ComparisonSummaryCard({
  comparison,
}: {
  comparison: ProgressTrackingComparisonSummary;
}) {
  const comparisonRecord = getRecord(comparison);
  const hasUsableIds =
    isNonWhitespaceString(comparisonRecord.baselineScanId) &&
    isNonWhitespaceString(comparisonRecord.comparisonScanId);
  const headingLabel = getDisplayText(
    comparisonRecord.headingLabel,
    copy.comparisonTitle,
  );
  const summaryLabel = getDisplayText(
    comparisonRecord.summaryLabel,
    copy.comparisonUnavailable,
  );
  const helperLabel = getOptionalText(
    comparisonRecord.helperLabel,
  );
  const metricItems = Array.isArray(comparisonRecord.metrics)
    ? comparisonRecord.metrics
    : [];

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-bark)]">
          <Sparkles aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {copy.comparisonTitle}
          </h2>
          <h3 className="mt-2 text-base font-bold text-[var(--dl-bark)]">
            {headingLabel}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {hasUsableIds ? summaryLabel : copy.comparisonUnavailable}
          </p>
          {hasUsableIds && helperLabel ? (
            <p className="mt-3 rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--dl-bark)]">
              {helperLabel}
            </p>
          ) : null}
        </div>
      </div>
      {hasUsableIds ? (
        metricItems.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {metricItems.map((metric, index) => (
              <MetricRow key={index} metric={metric} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--dl-text-secondary)]">
            {copy.noMetrics}
          </p>
        )
      ) : null}
    </section>
  );
}

function RoutinePromptCard({
  activeOperation,
  canOpenRoutine,
  onOpenRoutine,
  routinePrompt,
}: {
  activeOperation: ProgressTrackingOperation;
  canOpenRoutine: boolean;
  onOpenRoutine?: (routineId: string) => void;
  routinePrompt: ProgressRoutinePrompt;
}) {
  const safeRoutine = getRecord(routinePrompt);
  const routineId = isNonWhitespaceString(safeRoutine.routineId)
    ? safeRoutine.routineId
    : null;
  const title = getDisplayText(
    safeRoutine.titleLabel,
    copy.routineTitleUnavailable,
  );
  const supporting = getDisplayText(
    safeRoutine.supportingLabel,
    copy.routineSupportingUnavailable,
  );
  const actionLabel = getDisplayText(
    safeRoutine.actionLabel,
    copy.routineAction,
  );
  const isBusy = activeOperation !== null;
  const disabled =
    isBusy ||
    !canOpenRoutine ||
    onOpenRoutine === undefined ||
    routineId === null;
  const visibleLabel =
    activeOperation === "open-routine"
      ? copy.openingRoutine
      : disabled
        ? copy.routineBlocked
        : actionLabel;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-bark)]">
          <RotateCcw aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {supporting}
          </p>
          <button
            className={`${focusRing} mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-4 py-2 text-sm font-bold text-[var(--dl-bark)] transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
            disabled={disabled}
            onClick={() => {
              if (
                disabled ||
                routineId === null ||
                onOpenRoutine === undefined
              ) {
                return;
              }

              onOpenRoutine(routineId);
            }}
            type="button"
          >
            {visibleLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function StartNewScanPanel({
  activeOperation,
  canStartNewScan,
  onStartNewScan,
}: {
  activeOperation: ProgressTrackingOperation;
  canStartNewScan: boolean;
  onStartNewScan: () => void;
}) {
  const disabled =
    activeOperation !== null ||
    !canStartNewScan;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <button
        className={`${focusRing} inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 py-3 text-base font-bold text-white transition hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
        disabled={disabled}
        onClick={onStartNewScan}
        type="button"
      >
        <FileText aria-hidden="true" className="h-4 w-4" />
        {activeOperation === "start-new-scan"
          ? copy.openingScanSetup
          : canStartNewScan
            ? copy.startNewScan
            : copy.startBlocked}
      </button>
    </section>
  );
}

export default function ProgressTrackingScreen({
  state = "ready",
  report = null,
  isOffline = false,
  canGoBack = true,
  canStartNewScan = true,
  canSelectBaseline = true,
  canSelectComparison = true,
  canOpenReport = true,
  canOpenRoutine = true,
  onBack,
  onStartNewScan,
  onSelectBaseline,
  onSelectComparison,
  onOpenReport,
  onOpenRoutine,
  onRetryLoad,
}: ProgressTrackingScreenProps) {
  const mountedRef = useRef(false);
  const inFlightRef = useRef<InFlightOperation | null>(null);
  const activeTargetRef = useRef<string | null>(null);
  const [activeOperation, setActiveOperation] =
    useState<ProgressTrackingOperation>(null);
  const [activeTargetId, setActiveTargetId] =
    useState<string | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [failedImageKey, setFailedImageKey] =
    useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastText) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (mountedRef.current) {
        setToastText(null);
      }
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [toastText]);

  const resolvedState = isProgressTrackingState(state)
    ? state
    : "error";
  const hasReport = hasUsableProgressTrackingReport(report);
  const readyReport = hasReport ? report : null;
  const isBusy = activeOperation !== null;
  const showEmpty =
    resolvedState === "empty" ||
    (resolvedState === "ready" &&
      readyReport !== null &&
      readyReport.scans.length === 0);

  async function runOperation(
    operation: InFlightOperation,
    action: (() => void | Promise<void>) | undefined,
    failureText: string,
    targetId: string | null = null,
  ) {
    if (inFlightRef.current !== null || action === undefined) {
      return;
    }

    inFlightRef.current = operation;
    activeTargetRef.current = targetId;
    setActiveOperation(operation);
    setActiveTargetId(targetId);
    setToastText(null);

    try {
      await action();
    } catch {
      if (mountedRef.current) {
        setToastText(failureText);
      }
    } finally {
      if (inFlightRef.current === operation) {
        inFlightRef.current = null;
        activeTargetRef.current = null;
      }

      if (mountedRef.current) {
        setActiveOperation(null);
        setActiveTargetId(null);
      }
    }
  }

  function activateBack() {
    if (!canGoBack || isBusy) {
      return;
    }

    void runOperation(
      "back",
      onBack,
      copy.backError,
    );
  }

  function activateStartNewScan() {
    const profileId = readyReport?.profile.profileId;

    if (
      !canStartNewScan ||
      readyReport === null ||
      !isNonWhitespaceString(profileId) ||
      isBusy
    ) {
      return;
    }

    void runOperation(
      "start-new-scan",
      () => onStartNewScan(profileId),
      copy.startError,
    );
  }

  function activateSelectBaseline(scanId: string) {
    if (
      !canSelectBaseline ||
      onSelectBaseline === undefined ||
      !isNonWhitespaceString(scanId) ||
      isBusy
    ) {
      return;
    }

    void runOperation(
      "select-baseline",
      () => onSelectBaseline(scanId),
      copy.baselineError,
      scanId,
    );
  }

  function activateSelectComparison(scanId: string) {
    if (
      !canSelectComparison ||
      onSelectComparison === undefined ||
      !isNonWhitespaceString(scanId) ||
      isBusy
    ) {
      return;
    }

    void runOperation(
      "select-comparison",
      () => onSelectComparison(scanId),
      copy.comparisonError,
      scanId,
    );
  }

  function activateOpenReport(scanId: string) {
    if (
      !canOpenReport ||
      onOpenReport === undefined ||
      !isNonWhitespaceString(scanId) ||
      isBusy
    ) {
      return;
    }

    void runOperation(
      "open-report",
      () => onOpenReport(scanId),
      copy.reportError,
      scanId,
    );
  }

  function activateOpenRoutine(routineId: string) {
    if (
      !canOpenRoutine ||
      onOpenRoutine === undefined ||
      !isNonWhitespaceString(routineId) ||
      isBusy
    ) {
      return;
    }

    void runOperation(
      "open-routine",
      () => onOpenRoutine(routineId),
      copy.routineError,
      routineId,
    );
  }

  function activateRetryLoad() {
    if (onRetryLoad === undefined || isBusy) {
      return;
    }

    void runOperation(
      "retry-load",
      onRetryLoad,
      copy.retryError,
    );
  }

  if (resolvedState === "loading") {
    return (
      <PageShell
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={activateBack}
        toastText={toastText}
      >
        <LoadingContent />
      </PageShell>
    );
  }

  if (
    resolvedState === "error" ||
    (resolvedState === "ready" && readyReport === null)
  ) {
    return (
      <PageShell
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={activateBack}
        toastText={toastText}
      >
        <ErrorContent
          activeOperation={activeOperation}
          hasRetryRoute={onRetryLoad !== undefined}
          onRetryLoad={activateRetryLoad}
        />
      </PageShell>
    );
  }

  if (readyReport === null) {
    return (
      <PageShell
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={activateBack}
        toastText={toastText}
      >
        <IntroSection />
        <EmptyStateCard />
        <StartNewScanPanel
          activeOperation={activeOperation}
          canStartNewScan={false}
          onStartNewScan={activateStartNewScan}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      activeOperation={activeOperation}
      canGoBack={canGoBack}
      onBack={activateBack}
      toastText={toastText}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] lg:items-start">
        <div className="flex flex-col gap-5">
          <IntroSection />
          {isOffline ? <OfflineBanner /> : null}
          <ProfileCard report={readyReport} />
          <ComparisonIntroCard report={readyReport} />
          {showEmpty ? (
            <EmptyStateCard />
          ) : (
            <ScanHistoryList
              activeOperation={activeOperation}
              activeTargetId={activeTargetId}
              canOpenReport={canOpenReport}
              canSelectBaseline={canSelectBaseline}
              canSelectComparison={canSelectComparison}
              failedImageKey={failedImageKey}
              onImageError={setFailedImageKey}
              onOpenReport={onOpenReport ? activateOpenReport : undefined}
              onSelectBaseline={
                onSelectBaseline ? activateSelectBaseline : undefined
              }
              onSelectComparison={
                onSelectComparison ? activateSelectComparison : undefined
              }
              scans={readyReport.scans as unknown[]}
            />
          )}
        </div>
        <section
          aria-label="Progress details"
          className="flex flex-col gap-5"
        >
          {readyReport.comparison ? (
            <ComparisonSummaryCard comparison={readyReport.comparison} />
          ) : null}
          {readyReport.routinePrompt ? (
            <RoutinePromptCard
              activeOperation={activeOperation}
              canOpenRoutine={canOpenRoutine}
              onOpenRoutine={
                onOpenRoutine ? activateOpenRoutine : undefined
              }
              routinePrompt={readyReport.routinePrompt}
            />
          ) : null}
          <StartNewScanPanel
            activeOperation={activeOperation}
            canStartNewScan={canStartNewScan}
            onStartNewScan={activateStartNewScan}
          />
        </section>
      </div>
    </PageShell>
  );
}
