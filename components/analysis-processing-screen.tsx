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

export type AnalysisProcessingState =
  | "preparing"
  | "processing"
  | "waiting-for-connection"
  | "complete"
  | "error";

export type AnalysisStage =
  | "preparing-photo"
  | "mapping-regions"
  | "reviewing-visible-concerns"
  | "preparing-guidance"
  | "finalising-report";

export type AnalysisOperation =
  | "cancel"
  | "retry"
  | "return-to-review"
  | "view-results"
  | null;

export interface AnalysisProcessingScreenProps {
  profileName: string;

  processingState?: AnalysisProcessingState;
  activeStage?: AnalysisStage;
  completedStages?: AnalysisStage[];

  measuredProgressPercent?: number;

  isOffline?: boolean;
  canProcessOffline?: boolean;
  isTakingLongerThanExpected?: boolean;

  onCancelAnalysis: () => void | Promise<void>;
  onRetryAnalysis?: () => void | Promise<void>;
  onReturnToPhotoReview?: () => void | Promise<void>;
  onViewResults?: () => void | Promise<void>;
}

export const copy = {
  contextLabel: "ANALYSING PHOTO",

  profilePrefix: "Preparing guidance for",

  processingHeading: "Analysing your skin…",
  processingSupporting:
    "We are reviewing your selected photo and preparing personalised skincare guidance.",

  stagePreparingPhoto: "Preparing your photo",
  stageMappingRegions: "Mapping facial regions",
  stageReviewingVisibleConcerns: "Reviewing visible concerns",
  stagePreparingGuidance: "Preparing personalised guidance",
  stageFinalisingReport: "Finalising your report",

  measuredProgressLabel: "Analysis progress",

  privacyNote:
    "Your selected photo is being used only to prepare your skincare guidance.",

  guidanceBoundary:
    "DermaLens provides skincare guidance, not a medical diagnosis.",

  takingLonger:
    "This is taking a little longer than usual. Please keep this screen open while we finish.",

  pausedContextLabel: "ANALYSIS PAUSED",
  localContextLabel: "PROCESSING LOCALLY",
  localProcessingHeading: "Continuing on this device",
  waitingHeading: "Waiting for a connection",
  waitingSupporting:
    "Your photo is ready. Reconnect to continue preparing your skincare guidance.",
  waitingLocalSupporting:
    "Your device can continue processing this photo locally while you are offline.",

  completeHeading: "Your report is ready",
  completeSupporting:
    "Your skincare-guidance summary is ready to review.",
  viewResults: "View my results",
  openingResults: "Opening your report…",

  errorHeading: "We could not finish the analysis",
  errorSupporting:
    "Try again or return to your photo review before continuing.",
  retry: "Try analysis again",
  retrying: "Retrying analysis…",
  returnToReview: "Return to photo review",

  cancel: "Cancel",
  cancelAnalysis: "Cancel analysis",
  cancelSheetHeading: "Stop this analysis?",
  cancelSheetSupporting:
    "Your current analysis will stop. You can return to photo review and try again later.",
  keepAnalysing: "Keep analysing",
  confirmCancel: "Stop analysis",
  stoppingAnalysis: "Stopping analysis…",

  cancelError:
    "We could not stop the analysis. Please try again.",
  retryError:
    "We could not restart the analysis. Please try again.",
  reviewRouteError:
    "We could not return to photo review. Please try again.",
  resultsRouteError:
    "We could not open your results. Please try again.",
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
  display: 'var(--font-dm-serif-display), Georgia, serif',
  ui: 'var(--font-dm-sans), system-ui, sans-serif',
  metadata: 'var(--font-space-mono), monospace',
} as const;

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

export const analysisStageOrder: AnalysisStage[] = [
  "preparing-photo",
  "mapping-regions",
  "reviewing-visible-concerns",
  "preparing-guidance",
  "finalising-report",
];

export function getStageLabel(stage: AnalysisStage): string {
  const labels: Record<AnalysisStage, string> = {
    "preparing-photo": copy.stagePreparingPhoto,
    "mapping-regions": copy.stageMappingRegions,
    "reviewing-visible-concerns": copy.stageReviewingVisibleConcerns,
    "preparing-guidance": copy.stagePreparingGuidance,
    "finalising-report": copy.stageFinalisingReport,
  };

  return labels[stage];
}

export type StageVisualState = "completed" | "active" | "pending";

export function getStageVisualState(
  stage: AnalysisStage,
  activeStage: AnalysisStage,
  completedStages: AnalysisStage[],
): StageVisualState {
  if (completedStages.includes(stage)) return "completed";
  if (stage === activeStage) return "active";
  return "pending";
}

type IconProps = { className?: string };

type ToastRegionProps = { message: string | null };

type ProcessingTopBarProps = {
  disabled: boolean;
  label?: string;
  onOpenCancel: (trigger: HTMLButtonElement) => void;
};

type AnalysisStageCardProps = {
  activeStage: AnalysisStage;
  completedStages: AnalysisStage[];
};

type ExperienceProps = {
  activeStage: AnalysisStage;
  completedStages: AnalysisStage[];
  disabled: boolean;
  isTakingLongerThanExpected: boolean;
  onOpenCancel: (trigger: HTMLButtonElement) => void;
  profileName: string;
  safeMeasuredProgress: number | null;
};

type WaitingForConnectionExperienceProps = Pick<
  ExperienceProps,
  "activeStage" | "completedStages" | "disabled" | "onOpenCancel" | "profileName"
> & { canProcessOffline: boolean };

type CompleteExperienceProps = {
  activeOperation: AnalysisOperation;
  disabled: boolean;
  onViewResults?: () => void;
};

type ErrorExperienceProps = {
  activeOperation: AnalysisOperation;
  disabled: boolean;
  onRetryAnalysis?: () => void;
  onReturnToPhotoReview?: () => void;
};

type CancelAnalysisSheetProps = {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
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

function WarningIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 4 21 20H3L12 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M12 9v5m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function ConnectionIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 48 48">
      <path d="M15 34h19a8 8 0 0 0 .4-16A12 12 0 0 0 11 20.5 7 7 0 0 0 15 34Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="m20 30 8-8m-8 0 8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
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

function Spinner({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={`animate-spin motion-reduce:animate-none ${className}`} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity=".25" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function ApertureProgressMark({ large = false }: { large?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto ${large ? "h-[220px] w-[220px]" : "h-28 w-28 max-[374px]:h-24 max-[374px]:w-24"}`}
      data-testid="aperture-progress-mark"
    >
      <svg className="absolute inset-0 h-full w-full animate-[spin_8s_linear_infinite] motion-reduce:animate-none" fill="none" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="47" stroke="var(--dl-parchment)" strokeWidth="8" />
        <path d="M56 9a47 47 0 0 1 41.5 25" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeWidth="8" />
        <path d="M97 79a47 47 0 0 1-32 23" stroke="var(--dl-blush-strong)" strokeLinecap="round" strokeWidth="8" />
      </svg>
      <svg className="absolute inset-[18%] h-[64%] w-[64%] animate-[spin_13s_linear_infinite_reverse] motion-reduce:animate-none" fill="none" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="28" stroke="var(--dl-blush)" strokeWidth="7" />
        <path d="M17 15a28 28 0 0 1 36 1" stroke="var(--dl-bark)" strokeLinecap="round" strokeWidth="7" />
      </svg>
      <div className="absolute inset-[37%] rounded-full bg-[var(--dl-peach)]" />
    </div>
  );
}

function StaticStatusIllustration({ kind }: { kind: "connection" | "complete" | "error" }) {
  return (
    <div aria-hidden="true" className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-bark)]">
      {kind === "connection" ? <ConnectionIcon /> : null}
      {kind === "complete" ? <CheckIcon className="h-12 w-12 text-[var(--dl-peach-strong)]" /> : null}
      {kind === "error" ? <WarningIcon className="h-11 w-11 text-[var(--dl-error-text)]" /> : null}
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

function ActiveProfileRow({ profileName }: { profileName: string }) {
  return (
    <div className="mt-3.5 flex min-w-0 items-center gap-2.5">
      <ProfileInitial profileName={profileName} />
      <div className="min-w-0">
        <p className="text-xs leading-4 text-[var(--dl-text-secondary)]">{copy.profilePrefix}</p>
        <p className="truncate text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">
          {profileDisplayName(profileName)}
        </p>
      </div>
    </div>
  );
}

function ProcessingTopBar({ disabled, label = copy.contextLabel, onOpenCancel }: ProcessingTopBarProps) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3">
      <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">{label}</p>
      <button
        className={`${focusRing} flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={disabled}
        onClick={(event) => onOpenCancel(event.currentTarget)}
        type="button"
      >
        {copy.cancel}
      </button>
    </div>
  );
}

function MeasuredProgress({ value }: { value: number }) {
  return (
    <div className="mx-auto mt-[18px] w-full max-w-[420px]">
      <div
        aria-label={copy.measuredProgressLabel}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={value}
        className="h-1.5 overflow-hidden rounded-full bg-[var(--dl-parchment)]"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[var(--dl-peach-strong)] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1.5 text-right font-[family-name:var(--dl-metadata)] text-xs leading-4 text-[var(--dl-text-secondary)]">{value}%</p>
    </div>
  );
}

function StageStatusIcon({ state }: { state: StageVisualState }) {
  if (state === "completed") {
    return <CheckIcon className="h-5 w-5 text-[var(--dl-peach-strong)]" />;
  }
  if (state === "active") {
    return <Spinner className="h-5 w-5 text-[var(--dl-peach-strong)]" />;
  }
  return <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[var(--dl-dusk)]" />;
}

function StageRow({ activeStage, completedStages, stage }: AnalysisStageCardProps & { stage: AnalysisStage }) {
  const visualState = getStageVisualState(stage, activeStage, completedStages);
  const activeProps = visualState === "active"
    ? ({ "aria-current": "step", "aria-live": "polite", role: "status" } as const)
    : {};

  return (
    <li
      {...activeProps}
      className="flex min-h-11 items-center gap-2.5 border-b border-[var(--dl-border-subtle)] py-2 last:border-b-0"
      data-state={visualState}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center"><StageStatusIcon state={visualState} /></span>
      <span className={`text-sm leading-5 ${visualState === "active" ? "font-semibold text-[var(--dl-text-primary)]" : visualState === "completed" ? "text-[var(--dl-text-primary)]" : "text-[var(--dl-text-secondary)]"}`}>
        {getStageLabel(stage)}
      </span>
    </li>
  );
}

function AnalysisStageCard({ activeStage, completedStages }: AnalysisStageCardProps) {
  return (
    <div aria-label="Analysis stages" className="mt-[22px] rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-3.5">
      <ul>
        {analysisStageOrder.map((stage) => (
          <StageRow activeStage={activeStage} completedStages={completedStages} key={stage} stage={stage} />
        ))}
      </ul>
    </div>
  );
}

function PrivacyAndBoundaryNotes() {
  return (
    <>
      <p className="mt-4 flex items-start gap-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
        <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
        <span>{copy.privacyNote}</span>
      </p>
      <p className="mt-2.5 text-center text-xs leading-[18px] text-[var(--dl-text-secondary)]">{copy.guidanceBoundary}</p>
    </>
  );
}

function LongRunningNote() {
  return (
    <p className="mt-3.5 flex items-start gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]" role="status">
      <WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <span>{copy.takingLonger}</span>
    </p>
  );
}

function ProcessingExperience({ activeStage, completedStages, disabled, isTakingLongerThanExpected, onOpenCancel, profileName, safeMeasuredProgress }: ExperienceProps) {
  return (
    <WarmExperienceFrame leftContent={<DesktopProcessingVisual />}>
      <ProcessingTopBar disabled={disabled} onOpenCancel={onOpenCancel} />
      <ActiveProfileRow profileName={profileName} />
      <div className="mt-9 max-[374px]:mt-7 lg:mt-7"><ApertureProgressMark /></div>
      <h1 className="mt-7 text-center font-[family-name:var(--dl-display)] text-[38px] font-normal leading-[42px] tracking-[-0.015em] text-[var(--dl-text-primary)] max-[374px]:text-[34px] max-[374px]:leading-[38px]">
        {copy.processingHeading}
      </h1>
      <p className="mx-auto mt-2.5 max-w-[360px] text-center text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.processingSupporting}</p>
      {safeMeasuredProgress !== null ? <MeasuredProgress value={safeMeasuredProgress} /> : null}
      <AnalysisStageCard activeStage={activeStage} completedStages={completedStages} />
      {isTakingLongerThanExpected ? <LongRunningNote /> : null}
      <PrivacyAndBoundaryNotes />
    </WarmExperienceFrame>
  );
}

function WaitingForConnectionExperience({ activeStage, canProcessOffline, completedStages, disabled, onOpenCancel, profileName }: WaitingForConnectionExperienceProps) {
  return (
    <WarmExperienceFrame leftContent={<DesktopStaticVisual kind="connection" />}>
      <ProcessingTopBar
        disabled={disabled}
        label={canProcessOffline ? copy.localContextLabel : copy.pausedContextLabel}
        onOpenCancel={onOpenCancel}
      />
      <ActiveProfileRow profileName={profileName} />
      <div aria-live="polite" role="status">
        <div className="mt-8"><StaticStatusIllustration kind="connection" /></div>
        <h1 className="mt-6 text-center font-[family-name:var(--dl-display)] text-[38px] font-normal leading-[42px] tracking-[-0.015em] text-[var(--dl-text-primary)] max-[374px]:text-[34px] max-[374px]:leading-[38px]">
          {canProcessOffline ? copy.localProcessingHeading : copy.waitingHeading}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[390px] text-center text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
          {canProcessOffline ? copy.waitingLocalSupporting : copy.waitingSupporting}
        </p>
      </div>
      {canProcessOffline ? <AnalysisStageCard activeStage={activeStage} completedStages={completedStages} /> : null}
      <PrivacyAndBoundaryNotes />
      <button
        className={`${focusRing} mt-5 flex min-h-11 w-full items-center justify-center rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={disabled}
        onClick={(event) => onOpenCancel(event.currentTarget)}
        type="button"
      >
        {copy.cancelAnalysis}
      </button>
    </WarmExperienceFrame>
  );
}

function CompleteExperience({ activeOperation, disabled, onViewResults }: CompleteExperienceProps) {
  return (
    <WarmExperienceFrame leftContent={<DesktopStaticVisual kind="complete" />}>
      <div className="pt-[max(24px,env(safe-area-inset-top))] lg:pt-0">
        <div className="mt-8"><StaticStatusIllustration kind="complete" /></div>
        <h1 className="mt-6 text-center font-[family-name:var(--dl-display)] text-[38px] font-normal leading-[42px] tracking-[-0.015em] text-[var(--dl-text-primary)] max-[374px]:text-[34px] max-[374px]:leading-[38px]">{copy.completeHeading}</h1>
        <p className="mx-auto mt-2.5 max-w-[360px] text-center text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.completeSupporting}</p>
        {onViewResults ? (
          <button
            className={`${focusRing} mt-7 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] motion-reduce:transition-none`}
            disabled={disabled}
            onClick={onViewResults}
            type="button"
          >
            {activeOperation === "view-results" ? <Spinner /> : null}
            {activeOperation === "view-results" ? copy.openingResults : copy.viewResults}
          </button>
        ) : null}
      </div>
    </WarmExperienceFrame>
  );
}

function ErrorExperience({ activeOperation, disabled, onRetryAnalysis, onReturnToPhotoReview }: ErrorExperienceProps) {
  return (
    <WarmExperienceFrame leftContent={<DesktopStaticVisual kind="error" />}>
      <div className="pt-[max(24px,env(safe-area-inset-top))] lg:pt-0">
        <div className="mt-8"><StaticStatusIllustration kind="error" /></div>
        <h1 className="mt-6 text-center font-[family-name:var(--dl-display)] text-[38px] font-normal leading-[42px] tracking-[-0.015em] text-[var(--dl-text-primary)] max-[374px]:text-[34px] max-[374px]:leading-[38px]">{copy.errorHeading}</h1>
        <p className="mx-auto mt-2.5 max-w-[360px] text-center text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.errorSupporting}</p>
        {onRetryAnalysis ? (
          <button
            className={`${focusRing} mt-7 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] motion-reduce:transition-none`}
            disabled={disabled}
            onClick={onRetryAnalysis}
            type="button"
          >
            {activeOperation === "retry" ? <Spinner /> : null}
            {activeOperation === "retry" ? copy.retrying : copy.retry}
          </button>
        ) : null}
        {onReturnToPhotoReview ? (
          <button
            className={`${focusRing} mt-2 flex min-h-11 w-full items-center justify-center rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
            disabled={disabled}
            onClick={onReturnToPhotoReview}
            type="button"
          >
            {copy.returnToReview}
          </button>
        ) : null}
      </div>
    </WarmExperienceFrame>
  );
}

function DesktopProcessingVisual() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[28px] bg-[var(--dl-parchment)] px-8 py-12 text-center">
      <ApertureProgressMark large />
      <p className="mt-8 max-w-[320px] font-[family-name:var(--dl-display)] text-[34px] leading-[40px] text-[var(--dl-text-primary)]">Clearer guidance starts with a careful review.</p>
    </div>
  );
}

function DesktopStaticVisual({ kind }: { kind: "connection" | "complete" | "error" }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[28px] bg-[var(--dl-parchment)] px-8 py-12 text-center">
      <StaticStatusIllustration kind={kind} />
      <p className="mt-8 max-w-[320px] font-[family-name:var(--dl-display)] text-[34px] leading-[40px] text-[var(--dl-text-primary)]">Clearer guidance starts with a careful review.</p>
    </div>
  );
}

function WarmExperienceFrame({ children, leftContent }: { children: ReactNode; leftContent: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[100dvh] w-full max-w-[520px] grid-cols-1 px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] max-[374px]:px-5 md:max-w-[580px] lg:min-h-[calc(100dvh-64px)] lg:max-w-[1040px] lg:grid-cols-[42%_58%] lg:gap-16 lg:px-0 lg:py-8">
      <aside className="hidden lg:block">{leftContent}</aside>
      <section className="lg:min-w-0">{children}</section>
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
      data-testid="analysis-app-shell"
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

function CancelAnalysisSheet({ isOpen, isPending, onClose, onConfirm, returnFocusRef }: CancelAnalysisSheetProps) {
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

    const animationFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPendingRef.current) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

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
      returnFocusRef.current?.focus();
    };
  }, [isOpen, onClose, returnFocusRef]);

  useEffect(() => {
    if (!isOpen || !isPending || !dialogRef.current) return;

    if (!dialogRef.current.contains(document.activeElement)) {
      dialogRef.current.focus();
    }
  }, [isOpen, isPending]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(58,46,40,0.34)] md:items-center md:p-6"
      data-testid="cancel-sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] bg-[var(--dl-surface)] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 shadow-[0_4px_20px_rgba(92,74,66,0.08)] outline-none md:max-w-[520px] md:rounded-[28px] md:p-6"
        ref={dialogRef}
        role="dialog"
        style={themeStyle}
        tabIndex={-1}
      >
        <div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--dl-border-subtle)] md:hidden" />
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-[family-name:var(--dl-display)] text-[28px] font-normal leading-[34px] tracking-[-0.015em] text-[var(--dl-text-primary)]" id={titleId}>{copy.cancelSheetHeading}</h2>
          <button
            aria-label="Close cancellation confirmation"
            className={`${focusRing} -mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`}
            disabled={isPending}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <p className="mt-3 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.cancelSheetSupporting}</p>
        <button
          className={`${focusRing} mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-[var(--dl-error-text)] bg-[var(--dl-error-surface)] px-6 text-base font-semibold leading-5 text-[var(--dl-error-text)] transition-colors hover:bg-[var(--dl-warning-surface)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`}
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? <Spinner /> : null}
          {isPending ? copy.stoppingAnalysis : copy.confirmCancel}
        </button>
        <button
          className={`${focusRing} mt-2 flex min-h-11 w-full items-center justify-center rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={isPending}
          onClick={onClose}
          type="button"
        >
          {copy.keepAnalysing}
        </button>
      </div>
    </div>
  );
}

function ToastRegion({ message }: ToastRegionProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[max(24px,calc(env(safe-area-inset-bottom)+24px))] z-[60] flex justify-center"
      role="status"
      style={themeStyle}
    >
      {message ? (
        <div className="max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-text-primary)] shadow-[0_4px_20px_rgba(92,74,66,0.08)]">{message}</div>
      ) : null}
    </div>
  );
}

export default function AnalysisProcessingScreen({
  profileName,
  processingState = "preparing",
  activeStage = "preparing-photo",
  completedStages = [],
  measuredProgressPercent,
  isOffline = false,
  canProcessOffline = false,
  isTakingLongerThanExpected = false,
  onCancelAnalysis,
  onRetryAnalysis,
  onReturnToPhotoReview,
  onViewResults,
}: AnalysisProcessingScreenProps) {
  const [activeOperation, setActiveOperation] = useState<AnalysisOperation>(null);
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef<AnalysisOperation>(null);
  const cancelReturnFocusRef = useRef<HTMLButtonElement>(null);

  const operationPending = activeOperation !== null;
  const shouldPauseForConnection =
    isOffline &&
    !canProcessOffline &&
    (processingState === "preparing" ||
      processingState === "processing");
  const effectiveProcessingState: AnalysisProcessingState =
    shouldPauseForConnection
      ? "waiting-for-connection"
      : processingState;
  const safeMeasuredProgress =
    typeof measuredProgressPercent === "number" &&
    Number.isFinite(measuredProgressPercent)
      ? Math.min(100, Math.max(0, measuredProgressPercent))
      : null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => {
      if (isMountedRef.current) setToastMessage(null);
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const showToast = useCallback((message: string) => {
    if (isMountedRef.current) setToastMessage(message);
  }, []);

  const runOperation = useCallback(async (
    operation: Exclude<AnalysisOperation, null>,
    callback: () => void | Promise<void>,
    failureMessage: string,
    onSuccess?: () => void,
  ) => {
    if (inFlightRef.current !== null) return;
    inFlightRef.current = operation;
    if (isMountedRef.current) setActiveOperation(operation);
    try {
      await callback();
      if (isMountedRef.current) onSuccess?.();
    } catch {
      showToast(failureMessage);
    } finally {
      inFlightRef.current = null;
      if (isMountedRef.current) setActiveOperation(null);
    }
  }, [showToast]);

  const openCancelSheet = useCallback(
    (trigger: HTMLButtonElement) => {
      if (operationPending || inFlightRef.current !== null) return;
      cancelReturnFocusRef.current = trigger;
      setIsCancelSheetOpen(true);
    },
    [operationPending],
  );

  const closeCancelSheet = useCallback(() => {
    if (inFlightRef.current === "cancel") return;
    setIsCancelSheetOpen(false);
  }, []);

  useEffect(() => {
    if (!isCancelSheetOpen || activeOperation === "cancel") return;
    if (effectiveProcessingState === "complete" || effectiveProcessingState === "error") {
      setIsCancelSheetOpen(false);
    }
  }, [activeOperation, effectiveProcessingState, isCancelSheetOpen]);

  const handleCancel = useCallback(() => {
    void runOperation("cancel", onCancelAnalysis, copy.cancelError, () => setIsCancelSheetOpen(false));
  }, [onCancelAnalysis, runOperation]);

  const handleRetry = useCallback(() => {
    if (!onRetryAnalysis) return;
    void runOperation("retry", onRetryAnalysis, copy.retryError);
  }, [onRetryAnalysis, runOperation]);

  const handleReturnToReview = useCallback(() => {
    if (!onReturnToPhotoReview) return;
    void runOperation("return-to-review", onReturnToPhotoReview, copy.reviewRouteError);
  }, [onReturnToPhotoReview, runOperation]);

  const handleViewResults = useCallback(() => {
    if (!onViewResults) return;
    void runOperation("view-results", onViewResults, copy.resultsRouteError);
  }, [onViewResults, runOperation]);

  let experience: ReactNode;
  if (effectiveProcessingState === "waiting-for-connection") {
    experience = (
      <WaitingForConnectionExperience
        activeStage={activeStage}
        canProcessOffline={canProcessOffline}
        completedStages={completedStages}
        disabled={operationPending}
        onOpenCancel={openCancelSheet}
        profileName={profileName}
      />
    );
  } else if (effectiveProcessingState === "complete") {
    experience = <CompleteExperience activeOperation={activeOperation} disabled={operationPending} onViewResults={onViewResults ? handleViewResults : undefined} />;
  } else if (effectiveProcessingState === "error") {
    experience = (
      <ErrorExperience
        activeOperation={activeOperation}
        disabled={operationPending}
        onRetryAnalysis={onRetryAnalysis ? handleRetry : undefined}
        onReturnToPhotoReview={onReturnToPhotoReview ? handleReturnToReview : undefined}
      />
    );
  } else {
    experience = (
      <ProcessingExperience
        activeStage={activeStage}
        completedStages={completedStages}
        disabled={operationPending}
        isTakingLongerThanExpected={isTakingLongerThanExpected}
        onOpenCancel={openCancelSheet}
        profileName={profileName}
        safeMeasuredProgress={safeMeasuredProgress}
      />
    );
  }

  return (
    <>
      <AppShell isDialogOpen={isCancelSheetOpen}>{experience}</AppShell>
      <CancelAnalysisSheet
        isOpen={isCancelSheetOpen}
        isPending={activeOperation === "cancel"}
        onClose={closeCancelSheet}
        onConfirm={handleCancel}
        returnFocusRef={cancelReturnFocusRef}
      />
      <ToastRegion message={toastMessage} />
    </>
  );
}
