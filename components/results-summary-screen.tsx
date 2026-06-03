import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export type ResultsSummaryState =
  | "loading"
  | "ready"
  | "limited-confidence"
  | "error";

export type ResultsOperation =
  | "close"
  | "open-routine"
  | "open-report"
  | "share"
  | "download"
  | "retake-photo"
  | null;

export type SummaryHighlightTone = "neutral" | "attention" | "positive";

export interface SummaryHighlight {
  id: string;
  title: string;
  levelLabel: string;
  description: string;
  tone?: SummaryHighlightTone;
}

export interface PositiveSignal {
  id: string;
  title: string;
  description?: string;
}

export interface ResultsComparison {
  kind: "first-scan" | "comparison";
  delta?: number;
  label: string;
}

export interface ResultsSummaryReport {
  reportId: string;
  profileName: string;
  generatedAtLabel: string;

  score?: number;
  categoryLabel: string;
  comparison: ResultsComparison;

  priorityHighlights: SummaryHighlight[];
  positiveSignals: PositiveSignal[];

  saveLabel: string;
}

export interface ResultsSummaryScreenProps {
  state?: ResultsSummaryState;
  report?: ResultsSummaryReport | null;

  isOffline?: boolean;
  canBuildRoutine?: boolean;

  onClose: () => void | Promise<void>;
  onOpenRoutine: () => void | Promise<void>;
  onOpenDetailedReport: () => void | Promise<void>;

  onShareReport?: () => void | Promise<void>;
  onDownloadReport?: () => void | Promise<void>;
  onRetakePhoto?: () => void | Promise<void>;
}

export const copy = {
  contextLabel: "SCAN SUMMARY",

  close: "Close",
  reportActions: "Report actions",

  profilePrefix: "Summary for",
  savedOnDevice: "Saved on this device",

  loadingHeading: "Loading your summary…",
  loadingSupporting:
    "Your report is ready. We are preparing a clear overview.",

  heading: "Your skin snapshot is ready",
  supporting:
    "Here is a calm overview of the visible patterns highlighted in this photo.",

  scoreLabel: "Skin snapshot score",
  estimatedFromPhoto: "Estimated from this photo",
  scoreUnavailable: "Summary score unavailable",

  firstScanBaseline: "First scan baseline",

  guidanceBoundary:
    "This summary provides skincare guidance, not a medical diagnosis.",

  limitedConfidence:
    "Some results are less certain than usual. Review the detailed report or use another photo for a clearer comparison.",

  priorityHeading: "What stood out",
  priorityEmpty:
    "No priority highlights are available in this summary.",

  positiveHeading: "Positive signals",
  positiveEmpty:
    "No positive signals are available in this summary yet.",

  buildRoutine: "Build my routine",
  preparingRoutine: "Preparing your routine…",
  reconnectForRoutine: "Reconnect to build routine",
  routineUnavailable: "Routine unavailable right now",

  detailedReport: "View detailed report",
  openingReport: "Opening detailed report…",

  shareReport: "Share report",
  preparingShare: "Preparing report…",

  downloadReport: "Download report",
  preparingDownload: "Preparing download…",

  retakePhoto: "Use another photo",

  closeError:
    "We could not close this summary. Please try again.",
  routineError:
    "We could not prepare your routine. Please try again.",
  reportError:
    "We could not open the detailed report. Please try again.",
  shareError:
    "We could not prepare the report for sharing. Please try again.",
  downloadError:
    "We could not prepare the download. Please try again.",
  retakeError:
    "We could not open the photo options. Please try again.",

  errorHeading: "We could not display your summary",
  errorSupporting:
    "Return to your photo review or try opening the report again.",
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

export function normaliseSummaryScore(
  score: number | undefined,
): number | null {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function normaliseDelta(
  delta: number | undefined,
): number | null {
  if (typeof delta !== "number" || !Number.isFinite(delta)) {
    return null;
  }

  return Math.round(delta);
}

type IconProps = { className?: string };
type ToastRegionProps = { message: string | null };
type ResultsTopBarProps = {
  disabled: boolean;
  hasReportActions: boolean;
  onClose: () => void;
  onOpenActions: (trigger: HTMLButtonElement) => void;
};
type ReportActionsSheetProps = {
  activeOperation: ResultsOperation;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onDownloadReport?: () => void;
  onRetakePhoto?: () => void;
  onShareReport?: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

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

function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m5.5 12.5 4 4 9-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 3.5 19 6v5.5c0 4-2.7 7.4-7 9-4.3-1.6-7-5-7-9V6l7-2.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function InfoIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.5v5m0-8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
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

function DotsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function UpIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 20 20">
      <path d="m5.5 12 4.5-4.5L14.5 12M10 8v7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function DownIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 20 20">
      <path d="m5.5 8 4.5 4.5L14.5 8M10 12v-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function NeutralIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 20 20">
      <path d="M5 10h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function Spinner({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={`animate-spin motion-reduce:animate-none ${className}`} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity=".25" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function ToastRegion({ message }: ToastRegionProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 bottom-[max(24px,env(safe-area-inset-bottom))] z-[70] mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${message ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      role="status"
      style={themeStyle}
    >
      {message ?? ""}
    </div>
  );
}

function ResultsTopBar({ disabled, hasReportActions, onClose, onOpenActions }: ResultsTopBarProps) {
  return (
    <div className="grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-2">
      <button
        className={`${focusRing} flex min-h-11 min-w-11 items-center justify-start rounded-sm pr-2 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={disabled}
        onClick={onClose}
        type="button"
      >
        {copy.close}
      </button>
      <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </p>
      <div className="flex justify-end">
        {hasReportActions ? (
          <button
            aria-label={copy.reportActions}
            className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`}
            disabled={disabled}
            onClick={(event) => onOpenActions(event.currentTarget)}
            type="button"
          >
            <DotsIcon />
          </button>
        ) : <span aria-hidden="true" className="block h-11 w-11" />}
      </div>
    </div>
  );
}

function profileDisplayName(profileName: string): string {
  return profileName.trim() || "?";
}

function ProfileInitial({ profileName }: { profileName: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] font-[family-name:var(--dl-display)] text-xl text-[var(--dl-bark)]">
      {profileDisplayName(profileName).charAt(0).toUpperCase()}
    </span>
  );
}

function ReportProfileRow({ report }: { report: ResultsSummaryReport }) {
  return (
    <div className="mt-3 flex min-w-0 items-center gap-2.5">
      <ProfileInitial profileName={report.profileName} />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-4 text-[var(--dl-text-secondary)]">{copy.profilePrefix}</p>
        <p className="truncate text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">
          {profileDisplayName(report.profileName)}
        </p>
        <p className="truncate text-xs leading-4 text-[var(--dl-text-secondary)]">{report.generatedAtLabel}</p>
      </div>
    </div>
  );
}

function TrendIndicator({ delta }: { delta: number | null }) {
  if (delta === null) return null;

  if (delta > 0) {
    return <span aria-label="Trend increased" className="inline-flex items-center text-[var(--dl-bark)]" data-testid="trend-up"><UpIcon /></span>;
  }
  if (delta < 0) {
    return <span aria-label="Trend decreased" className="inline-flex items-center text-[var(--dl-bark)]" data-testid="trend-down"><DownIcon /></span>;
  }
  return <span aria-label="Trend unchanged" className="inline-flex items-center text-[var(--dl-bark)]" data-testid="trend-neutral"><NeutralIcon /></span>;
}

function SummaryScoreCard({ report }: { report: ResultsSummaryReport }) {
  const score = normaliseSummaryScore(report.score);
  const delta = report.comparison.kind === "comparison"
    ? normaliseDelta(report.comparison.delta)
    : null;
  const comparisonLabel = report.comparison.kind === "first-scan"
    ? copy.firstScanBaseline
    : report.comparison.label;

  return (
    <section className="mt-4 rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-[18px] text-center" aria-label={copy.scoreLabel}>
      <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.1em] text-[var(--dl-dusk)]">{copy.scoreLabel.toUpperCase()}</p>
      {score !== null ? (
        <p className="mt-1 font-[family-name:var(--dl-display)] text-[64px] font-normal leading-[66px] text-[var(--dl-text-primary)] max-[374px]:text-[58px] max-[374px]:leading-[60px]" data-testid="summary-score">{score}</p>
      ) : (
        <p className="mt-4 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.scoreUnavailable}</p>
      )}
      <p className="mt-1 text-[15px] font-semibold leading-[22px] text-[var(--dl-text-primary)]">{report.categoryLabel}</p>
      <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-sm leading-5 text-[var(--dl-bark)]">
        <TrendIndicator delta={delta} />
        <span>{comparisonLabel}</span>
      </p>
      <p className="mt-2.5 text-xs leading-[18px] text-[var(--dl-text-secondary)]">{copy.estimatedFromPhoto}</p>
    </section>
  );
}

function GuidanceBoundaryNote() {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-parchment)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <InfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <span>{copy.guidanceBoundary}</span>
    </p>
  );
}

function LimitedConfidenceBanner({ disabled, onRetakePhoto }: { disabled: boolean; onRetakePhoto?: () => void }) {
  return (
    <div className="mt-3 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]" role="status">
      <div className="flex items-start gap-2">
        <WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <p>{copy.limitedConfidence}</p>
      </div>
      {onRetakePhoto ? (
        <button
          className={`${focusRing} mt-2 min-h-11 rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline underline-offset-4 disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={disabled}
          onClick={onRetakePhoto}
          type="button"
        >
          {copy.retakePhoto}
        </button>
      ) : null}
    </div>
  );
}

function highlightToneClasses(tone: SummaryHighlightTone = "neutral"): string {
  if (tone === "attention") return "bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]";
  if (tone === "positive") return "bg-[var(--dl-blush)] text-[var(--dl-bark)]";
  return "bg-[var(--dl-parchment)] text-[var(--dl-bark)]";
}

function SummaryHighlightRow({ highlight }: { highlight: SummaryHighlight }) {
  return (
    <li className="border-b border-[var(--dl-border-subtle)] py-3 first:pt-2 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{highlight.title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold leading-4 ${highlightToneClasses(highlight.tone)}`}>{highlight.levelLabel}</span>
      </div>
      <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">{highlight.description}</p>
    </li>
  );
}

function PriorityHighlightsCard({ highlights }: { highlights: SummaryHighlight[] }) {
  const visibleHighlights = highlights.slice(0, 3);
  return (
    <section className="mt-4 rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <h2 className="text-lg font-semibold leading-6 text-[var(--dl-text-primary)]">{copy.priorityHeading}</h2>
      {visibleHighlights.length > 0 ? (
        <ul className="mt-1" data-testid="priority-highlight-list">
          {visibleHighlights.map((highlight) => <SummaryHighlightRow highlight={highlight} key={highlight.id} />)}
        </ul>
      ) : <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.priorityEmpty}</p>}
    </section>
  );
}

function PositiveSignalRow({ signal }: { signal: PositiveSignal }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <div>
        <h3 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{signal.title}</h3>
        {signal.description ? <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{signal.description}</p> : null}
      </div>
    </li>
  );
}

function PositiveSignalsCard({ signals }: { signals: PositiveSignal[] }) {
  const visibleSignals = signals.slice(0, 3);
  return (
    <section className="mt-3.5 rounded-2xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-3.5">
      <h2 className="text-base font-semibold leading-[22px] text-[var(--dl-text-primary)]">{copy.positiveHeading}</h2>
      {visibleSignals.length > 0 ? (
        <ul className="mt-2.5 space-y-2" data-testid="positive-signal-list">
          {visibleSignals.map((signal) => <PositiveSignalRow key={signal.id} signal={signal} />)}
        </ul>
      ) : <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.positiveEmpty}</p>}
    </section>
  );
}

function LocalSaveNote({ saveLabel }: { saveLabel: string }) {
  return (
    <p className="mt-3.5 flex items-start gap-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <span>{saveLabel.trim() || copy.savedOnDevice}</span>
    </p>
  );
}

function getRoutineButtonLabel({
  activeOperation,
  canBuildRoutine,
  isOffline,
}: {
  activeOperation: ResultsOperation;
  canBuildRoutine: boolean;
  isOffline: boolean;
}): string {
  if (activeOperation === "open-routine") {
    return copy.preparingRoutine;
  }

  if (!canBuildRoutine) {
    return isOffline
      ? copy.reconnectForRoutine
      : copy.routineUnavailable;
  }

  return copy.buildRoutine;
}

function ResultsFooter({ activeOperation, canBuildRoutine, disabled, hasReport, isOffline, onOpenDetailedReport, onOpenRoutine, routineLabelOverride }: {
  activeOperation: ResultsOperation;
  canBuildRoutine: boolean;
  disabled: boolean;
  hasReport: boolean;
  isOffline: boolean;
  onOpenDetailedReport: () => void;
  onOpenRoutine: () => void;
  routineLabelOverride?: string;
}) {
  const canOpenRoutine = hasReport && canBuildRoutine && !disabled;
  const canOpenReport = hasReport && !disabled;
  return (
    <footer className="sticky bottom-0 z-20 -mx-6 mt-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-[8px] max-[374px]:-mx-5 max-[374px]:px-5 lg:mx-0 lg:px-0">
      <button
        className={`${focusRing} flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] motion-reduce:transition-none`}
        disabled={!canOpenRoutine}
        onClick={onOpenRoutine}
        type="button"
      >
        {activeOperation === "open-routine" ? <Spinner /> : null}
        {routineLabelOverride ??
          getRoutineButtonLabel({ activeOperation, canBuildRoutine, isOffline })}
      </button>
      <button
        className={`${focusRing} mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--dl-bark)] bg-transparent px-6 text-sm font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`}
        disabled={!canOpenReport}
        onClick={onOpenDetailedReport}
        type="button"
      >
        {activeOperation === "open-report" ? <Spinner /> : null}
        {activeOperation === "open-report" ? copy.openingReport : copy.detailedReport}
      </button>
    </footer>
  );
}

function ResultsReadyExperience({
  activeOperation,
  canBuildRoutine,
  disabled,
  isOffline,
  onClose,
  onOpenActions,
  onOpenDetailedReport,
  onOpenRoutine,
  onRetakePhoto,
  report,
  state,
  hasReportActions,
}: {
  activeOperation: ResultsOperation;
  canBuildRoutine: boolean;
  disabled: boolean;
  hasReportActions: boolean;
  isOffline: boolean;
  onClose: () => void;
  onOpenActions: (trigger: HTMLButtonElement) => void;
  onOpenDetailedReport: () => void;
  onOpenRoutine: () => void;
  onRetakePhoto?: () => void;
  report: ResultsSummaryReport;
  state: "ready" | "limited-confidence";
}) {
  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[600px] px-6 pb-0 pt-[max(24px,env(safe-area-inset-top))] max-[374px]:px-5 md:max-w-[640px] lg:grid lg:max-w-[1120px] lg:grid-cols-[42%_58%] lg:gap-12 lg:px-0 lg:py-8">
      <div className="lg:col-start-2 lg:row-start-1">
        <ResultsTopBar disabled={disabled} hasReportActions={hasReportActions} onClose={onClose} onOpenActions={onOpenActions} />
        <ReportProfileRow report={report} />
        <h1 className="mt-[18px] font-[family-name:var(--dl-display)] text-4xl font-normal leading-10 tracking-[-0.015em] text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.heading}</h1>
        <p className="mt-2 max-w-[390px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.supporting}</p>
      </div>
      <div className="lg:col-start-1 lg:row-start-1 lg:pt-12">
        <SummaryScoreCard report={report} />
        <GuidanceBoundaryNote />
        <LocalSaveNote saveLabel={report.saveLabel} />
      </div>
      <div className="lg:col-start-2 lg:row-start-2">
        {state === "limited-confidence" ? <LimitedConfidenceBanner disabled={disabled} onRetakePhoto={onRetakePhoto} /> : null}
        <PriorityHighlightsCard highlights={report.priorityHighlights} />
        <PositiveSignalsCard signals={report.positiveSignals} />
        <div aria-hidden="true" className="min-h-4" />
        <ResultsFooter activeOperation={activeOperation} canBuildRoutine={canBuildRoutine} disabled={disabled} hasReport isOffline={isOffline} onOpenDetailedReport={onOpenDetailedReport} onOpenRoutine={onOpenRoutine} />
      </div>
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--dl-parchment)] motion-reduce:animate-none ${className}`} />;
}

function LoadingExperience({ disabled, hasReportActions, onClose, onOpenActions }: Pick<ResultsReadyExperienceProps, "disabled" | "hasReportActions" | "onClose" | "onOpenActions">) {
  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[600px] px-6 pb-0 pt-[max(24px,env(safe-area-inset-top))] max-[374px]:px-5 md:max-w-[640px]">
      <ResultsTopBar disabled={disabled} hasReportActions={hasReportActions} onClose={onClose} onOpenActions={onOpenActions} />
      <div aria-live="polite" role="status">
        <div className="mt-3 flex items-center gap-2.5"><SkeletonBlock className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><SkeletonBlock className="h-3 w-20" /><SkeletonBlock className="h-4 w-36" /></div></div>
        <h1 className="mt-[18px] font-[family-name:var(--dl-display)] text-4xl font-normal leading-10 tracking-[-0.015em] text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.loadingHeading}</h1>
        <p className="mt-2 max-w-[390px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.loadingSupporting}</p>
        <SkeletonBlock className="mt-4 h-48 w-full rounded-[20px]" />
        <SkeletonBlock className="mt-4 h-44 w-full rounded-[20px]" />
        <SkeletonBlock className="mt-3.5 h-28 w-full rounded-2xl" />
      </div>
      <ResultsFooter activeOperation={null} canBuildRoutine={false} disabled hasReport={false} isOffline={false} onOpenDetailedReport={() => undefined} onOpenRoutine={() => undefined} routineLabelOverride={copy.buildRoutine} />
    </div>
  );
}

type ResultsReadyExperienceProps = Parameters<typeof ResultsReadyExperience>[0];

function ErrorExperience({ activeOperation, disabled, hasReportActions, onClose, onOpenActions, onRetakePhoto }: {
  activeOperation: ResultsOperation;
  disabled: boolean;
  hasReportActions: boolean;
  onClose: () => void;
  onOpenActions: (trigger: HTMLButtonElement) => void;
  onRetakePhoto?: () => void;
}) {
  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[520px] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] max-[374px]:px-5">
      <ResultsTopBar disabled={disabled} hasReportActions={hasReportActions} onClose={onClose} onOpenActions={onOpenActions} />
      <div className="pt-14 text-center" role="alert">
        <div aria-hidden="true" className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-error-text)]"><WarningIcon className="h-11 w-11" /></div>
        <h1 className="mt-6 font-[family-name:var(--dl-display)] text-[38px] font-normal leading-[42px] tracking-[-0.015em] text-[var(--dl-text-primary)] max-[374px]:text-[34px] max-[374px]:leading-[38px]">{copy.errorHeading}</h1>
        <p className="mx-auto mt-2.5 max-w-[360px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.errorSupporting}</p>
        {onRetakePhoto ? (
          <button className={`${focusRing} mt-7 min-h-[52px] w-full rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] motion-reduce:transition-none`} disabled={disabled} onClick={onRetakePhoto} type="button">
            {activeOperation === "retake-photo" ? <span className="inline-flex items-center gap-2"><Spinner />{copy.retakePhoto}</span> : copy.retakePhoto}
          </button>
        ) : null}
        <button className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onClose} type="button">{copy.close}</button>
      </div>
    </div>
  );
}

function AppShell({ children, isDialogOpen }: { children: ReactNode; isDialogOpen: boolean }) {
  const shellRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (isDialogOpen) shell.setAttribute("inert", "");
    else shell.removeAttribute("inert");
  }, [isDialogOpen]);

  return (
    <main
      aria-hidden={isDialogOpen || undefined}
      className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]"
      data-testid="results-app-shell"
      ref={shellRef}
      style={themeStyle}
    >
      {children}
    </main>
  );
}

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function ReportActionsSheet({ activeOperation, isOpen, isPending, onClose, onDownloadReport, onRetakePhoto, onShareReport, returnFocusRef }: ReportActionsSheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isPendingRef = useRef(isPending);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const animationFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPendingRef.current) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (elements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => {
        const trigger = returnFocusRef.current;

        if (trigger?.isConnected) {
          trigger.focus();
        }
      });
    };
  }, [isOpen, onClose, returnFocusRef]);

  useEffect(() => {
    if (!isOpen || !isPending || !dialogRef.current) return;
    if (!dialogRef.current.contains(document.activeElement)) dialogRef.current.focus();
  }, [isOpen, isPending]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(58,46,40,0.34)] md:items-center md:p-6" data-testid="report-actions-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onClose(); }}>
      <div aria-labelledby={titleId} aria-modal="true" className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] bg-[var(--dl-surface)] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 shadow-[0_4px_20px_rgba(92,74,66,0.08)] outline-none md:max-w-[520px] md:rounded-[28px] md:p-6" ref={dialogRef} role="dialog" style={themeStyle} tabIndex={-1}>
        <div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--dl-border-subtle)] md:hidden" />
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-[family-name:var(--dl-display)] text-[28px] font-normal leading-[34px] tracking-[-0.015em] text-[var(--dl-text-primary)]" id={titleId}>{copy.reportActions}</h2>
          <button aria-label="Close report actions" className={`${focusRing} -mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`} disabled={isPending} onClick={onClose} ref={closeButtonRef} type="button"><CloseIcon /></button>
        </div>
        <div className="mt-3 space-y-2">
          {onShareReport ? <SheetActionButton active={activeOperation === "share"} disabled={isPending} label={activeOperation === "share" ? copy.preparingShare : copy.shareReport} onClick={onShareReport} /> : null}
          {onDownloadReport ? <SheetActionButton active={activeOperation === "download"} disabled={isPending} label={activeOperation === "download" ? copy.preparingDownload : copy.downloadReport} onClick={onDownloadReport} /> : null}
          {onRetakePhoto ? <SheetActionButton active={activeOperation === "retake-photo"} disabled={isPending} label={copy.retakePhoto} onClick={onRetakePhoto} /> : null}
        </div>
      </div>
    </div>
  );
}

function SheetActionButton({ active, disabled, label, onClick }: { active: boolean; disabled: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`${focusRing} flex min-h-12 w-full items-center justify-start gap-2 rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 text-left text-sm font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`} disabled={disabled} onClick={onClick} type="button">
      {active ? <Spinner /> : null}{label}
    </button>
  );
}

export default function ResultsSummaryScreen({
  state = "loading",
  report = null,
  isOffline = false,
  canBuildRoutine = true,
  onClose,
  onOpenRoutine,
  onOpenDetailedReport,
  onShareReport,
  onDownloadReport,
  onRetakePhoto,
}: ResultsSummaryScreenProps) {
  const [activeOperation, setActiveOperation] = useState<ResultsOperation>(null);
  const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef<ResultsOperation>(null);
  const actionsReturnFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const operationPending = activeOperation !== null;
  const effectiveState: ResultsSummaryState =
    (state === "ready" || state === "limited-confidence") && !report
      ? "error"
      : state;
  const hasRenderableSummary =
    (effectiveState === "ready" ||
      effectiveState === "limited-confidence") &&
    report !== null;
  const hasReportActions =
    hasRenderableSummary &&
    Boolean(
      onShareReport ||
      onDownloadReport ||
      onRetakePhoto
    );

  const runOperation = useCallback(async (
    operation: Exclude<ResultsOperation, null>,
    callback: () => void | Promise<void>,
    failureMessage: string,
    closeSheetOnSuccess = false,
  ) => {
    if (inFlightRef.current !== null) return;
    inFlightRef.current = operation;
    setActiveOperation(operation);
    setToastMessage(null);
    try {
      await callback();
      if (mountedRef.current && closeSheetOnSuccess) setIsActionsSheetOpen(false);
    } catch {
      if (mountedRef.current) setToastMessage(failureMessage);
    } finally {
      inFlightRef.current = null;
      if (mountedRef.current) setActiveOperation(null);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) return;
    void runOperation("close", onClose, copy.closeError);
  }, [onClose, operationPending, runOperation]);

  const handleRoutine = useCallback(() => {
    if (operationPending || inFlightRef.current !== null || !canBuildRoutine) return;
    void runOperation("open-routine", onOpenRoutine, copy.routineError);
  }, [canBuildRoutine, onOpenRoutine, operationPending, runOperation]);

  const handleDetailedReport = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) return;
    void runOperation("open-report", onOpenDetailedReport, copy.reportError);
  }, [onOpenDetailedReport, operationPending, runOperation]);

  const handleShare = useCallback(() => {
    if (
      !hasRenderableSummary ||
      !onShareReport ||
      operationPending ||
      inFlightRef.current !== null
    ) {
      return;
    }
    void runOperation("share", onShareReport, copy.shareError, true);
  }, [hasRenderableSummary, onShareReport, operationPending, runOperation]);

  const handleDownload = useCallback(() => {
    if (
      !hasRenderableSummary ||
      !onDownloadReport ||
      operationPending ||
      inFlightRef.current !== null
    ) {
      return;
    }
    void runOperation("download", onDownloadReport, copy.downloadError, true);
  }, [hasRenderableSummary, onDownloadReport, operationPending, runOperation]);

  const handleRetake = useCallback(() => {
    if (!onRetakePhoto || operationPending || inFlightRef.current !== null) return;
    void runOperation("retake-photo", onRetakePhoto, copy.retakeError, isActionsSheetOpen);
  }, [isActionsSheetOpen, onRetakePhoto, operationPending, runOperation]);

  const openActionsSheet = useCallback((trigger: HTMLButtonElement) => {
    if (
      !hasReportActions ||
      operationPending ||
      inFlightRef.current !== null
    ) {
      return;
    }
    actionsReturnFocusRef.current = trigger;
    setIsActionsSheetOpen(true);
  }, [hasReportActions, operationPending]);

  const closeActionsSheet = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) return;
    setIsActionsSheetOpen(false);
  }, [operationPending]);

  useEffect(() => {
    if (
      !isActionsSheetOpen ||
      operationPending
    ) {
      return;
    }

    if (!hasReportActions) {
      setIsActionsSheetOpen(false);
    }
  }, [
    hasReportActions,
    isActionsSheetOpen,
    operationPending,
  ]);

  let content: ReactNode;
  if (effectiveState === "loading") {
    content = <LoadingExperience disabled={operationPending} hasReportActions={hasReportActions} onClose={handleClose} onOpenActions={openActionsSheet} />;
  } else if (effectiveState === "error" || !report) {
    content = <ErrorExperience activeOperation={activeOperation} disabled={operationPending} hasReportActions={hasReportActions} onClose={handleClose} onOpenActions={openActionsSheet} onRetakePhoto={onRetakePhoto ? handleRetake : undefined} />;
  } else {
    content = <ResultsReadyExperience activeOperation={activeOperation} canBuildRoutine={canBuildRoutine} disabled={operationPending} hasReportActions={hasReportActions} isOffline={isOffline} onClose={handleClose} onOpenActions={openActionsSheet} onOpenDetailedReport={handleDetailedReport} onOpenRoutine={handleRoutine} onRetakePhoto={onRetakePhoto ? handleRetake : undefined} report={report} state={effectiveState} />;
  }

  return (
    <>
      <AppShell isDialogOpen={isActionsSheetOpen}>{content}</AppShell>
      <ReportActionsSheet
        activeOperation={activeOperation}
        isOpen={isActionsSheetOpen}
        isPending={operationPending}
        onClose={closeActionsSheet}
        onDownloadReport={
          hasReportActions && onDownloadReport
            ? handleDownload
            : undefined
        }
        onRetakePhoto={
          hasReportActions && onRetakePhoto
            ? handleRetake
            : undefined
        }
        onShareReport={
          hasReportActions && onShareReport
            ? handleShare
            : undefined
        }
        returnFocusRef={actionsReturnFocusRef}
      />
      <ToastRegion message={toastMessage} />
    </>
  );
}
