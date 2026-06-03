import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type SelectedImageSource = "camera" | "upload";

export type ImageValidationState =
  | "checking"
  | "passed"
  | "failed"
  | "error";

export type ImageQualityCheckId =
  | "face-visible"
  | "single-face"
  | "frontal-angle"
  | "lighting"
  | "focus"
  | "resolution";

export type ImageQualityCheckStatus =
  | "checking"
  | "passed"
  | "failed";

export type ImageQualityChecks = Partial<
  Record<ImageQualityCheckId, ImageQualityCheckStatus>
>;

export type ProfileConsistencyState =
  | "not-required"
  | "checking"
  | "matched"
  | "mismatch"
  | "error";

export type ReviewOperation =
  | "back"
  | "proceed"
  | "replace-photo"
  | "different-source"
  | "retry-validation"
  | "change-profile"
  | "create-profile"
  | null;

export interface SelectedImageReviewScreenProps {
  profileName: string;
  imageUrl: string;
  imageSource: SelectedImageSource;

  validationState?: ImageValidationState;
  qualityChecks?: ImageQualityChecks;
  profileConsistencyState?: ProfileConsistencyState;

  isOffline?: boolean;
  canStartAnalysis?: boolean;
  isProceeding?: boolean;

  onBack: () => void | Promise<void>;
  onUsePhoto: () => void | Promise<void>;
  onReplacePhoto: () => void | Promise<void>;
  onChooseDifferentSource: () => void | Promise<void>;

  onRetryValidation?: () => void | Promise<void>;
  onChangeProfile?: () => void | Promise<void>;
  onCreateNewProfile?: () => void | Promise<void>;
  onPreviewLoadError?: () => void | Promise<void>;
}

export const copy = {
  contextLabel: "REVIEW PHOTO",

  profilePrefix: "Reviewing for",
  changeProfile: "Change profile",

  heading: "Review your photo",
  supporting:
    "Make sure this is a clear, recent photo. We will check image quality before skin analysis begins.",

  sourceCamera: "Taken with camera",
  sourceUpload: "Selected from device",

  previewAlt: "Selected facial photo for review",
  previewLoading: "Loading your photo…",
  previewErrorHeading: "We could not display this photo",
  previewErrorBody:
    "Choose another image or return to the previous screen and try again.",

  preAnalysisNote: "Skin analysis has not started yet.",

  offline:
    "You appear to be offline. You can review this photo now, but analysis may remain unavailable until you reconnect.",

  qualityHeading: "Photo quality checks",

  validationChecking: "Checking whether this photo is suitable…",
  validationPassed: "Your photo is ready",
  validationFailed: "This photo needs another try",
  validationError: "We could not check this photo",

  checksHelperChecking:
    "We are checking a few details before analysis begins.",
  checksHelperPassed: "The image is suitable for your skin analysis.",
  checksHelperFailed:
    "Review the highlighted issues and choose another photo.",
  checksHelperError: "Try the quality check again or choose another photo.",

  checkFaceVisibleTitle: "Face visible",
  checkFaceVisiblePassed: "Your full face is visible.",
  checkFaceVisibleFailed: "Choose a photo where your full face is visible.",

  checkSingleFaceTitle: "One face only",
  checkSingleFacePassed: "One face is visible.",
  checkSingleFaceFailed: "Use a photo with only one person.",

  checkFrontalAngleTitle: "Front-facing angle",
  checkFrontalAnglePassed: "Your face is positioned straight on.",
  checkFrontalAngleFailed: "Choose a photo taken straight on.",

  checkLightingTitle: "Lighting",
  checkLightingPassed: "Lighting looks even.",
  checkLightingFailed: "Choose a brighter photo with more even lighting.",

  checkFocusTitle: "Focus",
  checkFocusPassed: "The image looks clear.",
  checkFocusFailed: "Choose a sharper image.",

  checkResolutionTitle: "Resolution",
  checkResolutionPassed: "Image size is suitable.",
  checkResolutionFailed: "Choose a higher-resolution photo.",

  checkPending: "Checking…",

  profileHeading: "Active profile check",

  profileNotRequired: "This is the first scan saved to this profile.",
  profileChecking:
    "Checking that this photo belongs with the active profile…",
  profileMatched: "This photo appears consistent with the active profile.",
  profileMismatch:
    "This photo may not match the active profile. Switch profiles or choose another image before continuing.",
  profileError:
    "We could not confirm the active profile. Try the check again or choose another image.",

  firstScanLabel: "First scan",
  matchedLabel: "Appears consistent",
  mismatchLabel: "Possible mismatch",

  retryValidation: "Try quality check again",
  createNewProfile: "Create new profile",

  usePhoto: "Use this photo",
  proceeding: "Starting analysis…",
  loadingPhoto: "Loading photo…",
  checkingPhoto: "Checking photo…",
  photoUnavailable: "Photo unavailable",
  photoNeedsAnotherTry: "Choose another photo",
  retryPhotoCheck: "Retry photo check",
  checkingProfile: "Checking active profile…",
  resolveMismatch: "Resolve profile mismatch",
  resolveProfileCheck: "Resolve profile check",
  reconnectToContinue: "Reconnect to continue",
  analysisUnavailable: "Analysis unavailable right now",

  retakePhoto: "Retake photo",
  chooseAnotherPhoto: "Choose another photo",
  chooseDifferentSource: "Choose another method",

  usePhotoError: "We could not start analysis. Please try again.",
  backError: "We could not return to the previous screen. Please try again.",
  replacementError: "We could not open another photo option. Please try again.",
  sourceError: "We could not open the image-source options. Please try again.",
  retryError: "We could not retry the quality check. Please try again.",
  profileRouteError: "We could not open your profiles. Please try again.",
  createProfileError: "We could not start a new profile. Please try again.",
  previewCallbackError:
    "We could not report the image-preview issue. Please try again.",
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

  previewBackground: "#1F1916",
} as const;

export const fonts = {
  display: 'var(--font-dm-serif-display), Georgia, serif',
  ui: 'var(--font-dm-sans), system-ui, sans-serif',
  metadata: 'var(--font-space-mono), monospace',
} as const;

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

type IconProps = { className?: string };

type ToastRegionProps = { message: string | null };

type BackButtonProps = { disabled: boolean; onClick: () => void };

type ActiveProfileRowProps = {
  disabled: boolean;
  onChangeProfile?: () => void;
  profileName: string;
};

type ImagePreviewCardProps = {
  hasError: boolean;
  imageSource: SelectedImageSource;
  imageUrl: string;
  isLoaded: boolean;
  onError: () => void;
  onLoad: () => void;
};

type PhotoQualityCardProps = {
  disabled: boolean;
  onRetryValidation?: () => void;
  qualityChecks: ImageQualityChecks;
  validationState: ImageValidationState;
};

type ProfileConsistencyCardProps = {
  disabled: boolean;
  onChangeProfile?: () => void;
  onCreateNewProfile?: () => void;
  onRetryValidation?: () => void;
  state: ProfileConsistencyState;
};

type ReviewFooterProps = {
  canProceed: boolean;
  disabled: boolean;
  imageSource: SelectedImageSource;
  primaryLabel: string;
  onChooseDifferentSource: () => void;
  onProceed: () => void;
  onReplacePhoto: () => void;
};

const rootStyle = {
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
  "--dl-preview-background": colors.previewBackground,
  "--dl-display": fonts.display,
  "--dl-ui": fonts.ui,
  "--dl-metadata": fonts.metadata,
} as CSSProperties;

function ArrowLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M19 12H5m6 6-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m7 9.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m6.4 12.2 3.5 3.5 7.7-7.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function WarningIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 8.5v4.75m0 3.25h.01M10.1 4.8 3.16 16.65A2 2 0 0 0 4.88 19.7h14.24a2 2 0 0 0 1.72-3.05L13.9 4.8a2 2 0 0 0-3.8 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 3.7 18.5 6v5.35c0 4.05-2.38 7.32-6.5 9.05-4.12-1.73-6.5-5-6.5-9.05V6L12 3.7Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m9.2 12.1 1.85 1.85 3.8-3.9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function Spinner({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={`${className} animate-spin motion-reduce:animate-none`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-30" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function ToastRegion({ message }: ToastRegionProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(max(24px,env(safe-area-inset-bottom))+180px)] z-50 flex justify-center px-5"
      role="status"
    >
      {message ? (
        <p className="max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.12)] transition-opacity motion-reduce:transition-none">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function BackButton({ disabled, onClick }: BackButtonProps) {
  return (
    <button
      aria-label="Go back"
      className={`flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] ${focusRing}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <ArrowLeftIcon />
    </button>
  );
}

function ReviewTopBar({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
  return (
    <header className="flex min-h-12 items-center justify-between pt-[max(16px,env(safe-area-inset-top))]">
      <BackButton disabled={disabled} onClick={onBack} />
      <span className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </span>
    </header>
  );
}

function ActiveProfileRow({ disabled, onChangeProfile, profileName }: ActiveProfileRowProps) {
  const trimmedName = profileName.trim() || "?";
  const initial = trimmedName === "?" ? "?" : Array.from(trimmedName)[0]?.toUpperCase() || "?";

  return (
    <section className="mt-3 flex min-w-0 items-center gap-2.5" aria-label="Active profile">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] font-[family-name:var(--dl-display)] text-lg leading-none text-[var(--dl-bark)]">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-4 text-[var(--dl-text-secondary)]">{copy.profilePrefix}</p>
        <p className="truncate text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{trimmedName}</p>
      </div>
      {onChangeProfile ? (
        <button
          className={`min-h-11 shrink-0 rounded-lg px-2 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] ${focusRing}`}
          disabled={disabled}
          onClick={onChangeProfile}
          type="button"
        >
          {copy.changeProfile}
        </button>
      ) : null}
    </section>
  );
}

function ImagePreviewCard({ hasError, imageSource, imageUrl, isLoaded, onError, onLoad }: ImagePreviewCardProps) {
  return (
    <section className="relative h-[300px] overflow-hidden rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-preview-background)] max-[374px]:h-[260px] md:h-[360px] lg:h-[520px]" aria-label="Selected image preview">
      <span className="absolute left-3 top-3 z-20 rounded-full bg-[rgba(31,25,22,0.72)] px-2.5 py-1.5 text-xs leading-4 text-[var(--dl-page)]">
        {imageSource === "camera" ? copy.sourceCamera : copy.sourceUpload}
      </span>
      {!hasError ? (
        <img
          alt={copy.previewAlt}
          className={`h-full w-full object-contain transition-opacity motion-reduce:transition-none ${isLoaded ? "opacity-100" : "opacity-0"}`}
          draggable={false}
          onError={onError}
          onLoad={onLoad}
          src={imageUrl}
        />
      ) : null}
      {!isLoaded && !hasError ? (
        <div className="absolute inset-0 flex items-center justify-center" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-3 text-[var(--dl-page)]">
            <Spinner className="h-6 w-6" />
            <p className="text-sm leading-5">{copy.previewLoading}</p>
          </div>
        </div>
      ) : null}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center" role="alert">
          <div className="max-w-[320px] text-[var(--dl-page)]">
            <WarningIcon className="mx-auto h-7 w-7 text-[var(--dl-peach)]" />
            <h2 className="mt-3 text-base font-semibold leading-6">{copy.previewErrorHeading}</h2>
            <p className="mt-1 text-sm leading-5 text-[rgba(250,247,242,0.78)]">{copy.previewErrorBody}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PreAnalysisNote() {
  return (
    <div className="mt-3 flex gap-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <ShieldIcon className="h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <p>{copy.preAnalysisNote}</p>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div className="mt-3.5 flex gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]" role="status">
      <WarningIcon className="h-5 w-5 shrink-0" />
      <p>{copy.offline}</p>
    </div>
  );
}

const qualityCheckOrder: ImageQualityCheckId[] = [
  "face-visible",
  "single-face",
  "frontal-angle",
  "lighting",
  "focus",
  "resolution",
];

const checkCopy: Record<ImageQualityCheckId, { title: string; passed: string; failed: string }> = {
  "face-visible": { title: copy.checkFaceVisibleTitle, passed: copy.checkFaceVisiblePassed, failed: copy.checkFaceVisibleFailed },
  "single-face": { title: copy.checkSingleFaceTitle, passed: copy.checkSingleFacePassed, failed: copy.checkSingleFaceFailed },
  "frontal-angle": { title: copy.checkFrontalAngleTitle, passed: copy.checkFrontalAnglePassed, failed: copy.checkFrontalAngleFailed },
  lighting: { title: copy.checkLightingTitle, passed: copy.checkLightingPassed, failed: copy.checkLightingFailed },
  focus: { title: copy.checkFocusTitle, passed: copy.checkFocusPassed, failed: copy.checkFocusFailed },
  resolution: { title: copy.checkResolutionTitle, passed: copy.checkResolutionPassed, failed: copy.checkResolutionFailed },
};

function ValidationSummary({ validationState }: { validationState: ImageValidationState }) {
  const stateCopy = {
    checking: [copy.validationChecking, copy.checksHelperChecking],
    passed: [copy.validationPassed, copy.checksHelperPassed],
    failed: [copy.validationFailed, copy.checksHelperFailed],
    error: [copy.validationError, copy.checksHelperError],
  } as const;
  const [heading, helper] = stateCopy[validationState];
  const isChecking = validationState === "checking";
  const isPassed = validationState === "passed";

  return (
    <div
      className="flex gap-3"
      {...(isChecking || isPassed
        ? { role: "status", "aria-live": "polite" }
        : { role: "alert" })}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${isPassed ? "bg-[var(--dl-blush)] text-[var(--dl-bark)]" : isChecking ? "bg-[var(--dl-surface-soft)] text-[var(--dl-bark)]" : "bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]"}`}>
        {isChecking ? <Spinner /> : isPassed ? <CheckIcon /> : <WarningIcon />}
      </span>
      <div>
        <h2 className="text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{heading}</h2>
        <p className="mt-0.5 text-sm leading-5 text-[var(--dl-text-secondary)]">{helper}</p>
      </div>
    </div>
  );
}

function QualityCheckRow({ id, status }: { id: ImageQualityCheckId; status: ImageQualityCheckStatus }) {
  const item = checkCopy[id];
  const isChecking = status === "checking";
  const isPassed = status === "passed";
  const body = isChecking ? copy.checkPending : isPassed ? item.passed : item.failed;

  return (
    <li className="flex gap-2.5 border-t border-[var(--dl-border-subtle)] py-[9px] first:border-t-0">
      <span className={`mt-0.5 shrink-0 ${isPassed ? "text-[var(--dl-peach-strong)]" : isChecking ? "text-[var(--dl-dusk)]" : "text-[var(--dl-warning-text)]"}`}>
        {isChecking ? <Spinner className="h-[18px] w-[18px]" /> : isPassed ? <CheckIcon className="h-[18px] w-[18px]" /> : <WarningIcon className="h-[18px] w-[18px]" />}
      </span>
      <div>
        <h3 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{item.title}</h3>
        <p className={`text-[13px] leading-[18px] ${status === "failed" ? "text-[var(--dl-warning-text)]" : "text-[var(--dl-text-secondary)]"}`}>{body}</p>
      </div>
    </li>
  );
}

function QualityChecksAccordion({ qualityChecks, validationState }: { qualityChecks: ImageQualityChecks; validationState: ImageValidationState }) {
  const [isOpen, setIsOpen] = useState(validationState !== "passed");

  useEffect(() => {
    setIsOpen(validationState !== "passed");
  }, [validationState]);

  return (
    <details
      className="group mt-3 border-y border-[var(--dl-border-subtle)]"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
    >
      <summary className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold leading-5 text-[var(--dl-bark)] marker:content-none ${focusRing}`}>
        <span>{copy.qualityHeading}</span>
        <ChevronDownIcon className="h-[18px] w-[18px] shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <ul className="pb-1">
        {qualityCheckOrder.map((id) => (
          <QualityCheckRow id={id} key={id} status={qualityChecks[id] ?? "checking"} />
        ))}
      </ul>
    </details>
  );
}

function SecondaryOutlineButton({ children, disabled, onClick }: { children: ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      className={`min-h-12 w-full rounded-full border border-[var(--dl-bark)] px-5 text-sm font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:border-[var(--dl-stone)] disabled:text-[var(--dl-dusk)] ${focusRing}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PhotoQualityCard({ disabled, onRetryValidation, qualityChecks, validationState }: PhotoQualityCardProps) {
  return (
    <section className="mt-4 rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <ValidationSummary validationState={validationState} />
      <QualityChecksAccordion qualityChecks={qualityChecks} validationState={validationState} />
      {validationState === "error" && onRetryValidation ? (
        <div className="mt-3">
          <SecondaryOutlineButton disabled={disabled} onClick={onRetryValidation}>{copy.retryValidation}</SecondaryOutlineButton>
        </div>
      ) : null}
    </section>
  );
}

function StatusBadge({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-4 ${warning ? "bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]" : "bg-[var(--dl-blush)] text-[var(--dl-bark)]"}`}>
      {children}
    </span>
  );
}

function CompactTextButton({ children, disabled, onClick }: { children: ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      className={`min-h-11 rounded-lg px-2 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] ${focusRing}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ProfileConsistencyCard({ disabled, onChangeProfile, onCreateNewProfile, onRetryValidation, state }: ProfileConsistencyCardProps) {
  const isMismatch = state === "mismatch";
  const isError = state === "error";
  const message = {
    "not-required": copy.profileNotRequired,
    checking: copy.profileChecking,
    matched: copy.profileMatched,
    mismatch: copy.profileMismatch,
    error: copy.profileError,
  }[state];

  return (
    <section className={`mt-3.5 rounded-2xl border border-[var(--dl-border-subtle)] p-3.5 ${isMismatch || isError ? "bg-[var(--dl-warning-surface)]" : "bg-[var(--dl-surface)]"}`}>
      <h2 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{copy.profileHeading}</h2>
      <div className="mt-2">
        {state === "not-required" ? <StatusBadge>{copy.firstScanLabel}</StatusBadge> : null}
        {state === "matched" ? <StatusBadge>{copy.matchedLabel}</StatusBadge> : null}
        {state === "mismatch" ? <StatusBadge warning>{copy.mismatchLabel}</StatusBadge> : null}
      </div>
      <div {...(state === "checking" ? { role: "status", "aria-live": "polite" } : {})} {...(isMismatch || isError ? { role: "alert" } : {})} className="mt-2 flex gap-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {state === "checking" ? <Spinner className="mt-0.5 h-[18px] w-[18px] shrink-0" /> : null}
        <p>{message}</p>
      </div>
      {isMismatch ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {onChangeProfile ? <CompactTextButton disabled={disabled} onClick={onChangeProfile}>{copy.changeProfile}</CompactTextButton> : null}
          {onCreateNewProfile ? <CompactTextButton disabled={disabled} onClick={onCreateNewProfile}>{copy.createNewProfile}</CompactTextButton> : null}
        </div>
      ) : null}
      {isError && onRetryValidation ? (
        <div className="mt-3">
          <SecondaryOutlineButton disabled={disabled} onClick={onRetryValidation}>{copy.retryValidation}</SecondaryOutlineButton>
        </div>
      ) : null}
    </section>
  );
}

function ReviewFooter({ canProceed, disabled, imageSource, onChooseDifferentSource, onProceed, onReplacePhoto, primaryLabel }: ReviewFooterProps) {
  return (
    <footer className="sticky bottom-0 z-30 -mx-6 mt-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-md max-[374px]:-mx-5 max-[374px]:px-5 lg:static lg:mx-0 lg:rounded-2xl lg:border lg:p-4">
      <button
        className={`min-h-[52px] w-full rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] ${focusRing}`}
        disabled={!canProceed}
        onClick={onProceed}
        type="button"
      >
        {primaryLabel}
      </button>
      <div className="mt-2">
        <SecondaryOutlineButton disabled={disabled} onClick={onReplacePhoto}>
          {imageSource === "camera" ? copy.retakePhoto : copy.chooseAnotherPhoto}
        </SecondaryOutlineButton>
      </div>
      <button
        className={`mt-1 min-h-11 w-full rounded-lg px-3 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] ${focusRing}`}
        disabled={disabled}
        onClick={onChooseDifferentSource}
        type="button"
      >
        {copy.chooseDifferentSource}
      </button>
    </footer>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]" style={rootStyle}>
      {children}
    </main>
  );
}

export default function SelectedImageReviewScreen({
  canStartAnalysis = true,
  imageSource,
  imageUrl,
  isOffline = false,
  isProceeding = false,
  onBack,
  onChangeProfile,
  onChooseDifferentSource,
  onCreateNewProfile,
  onPreviewLoadError,
  onReplacePhoto,
  onRetryValidation,
  onUsePhoto,
  profileConsistencyState = "not-required",
  profileName,
  qualityChecks = {},
  validationState = "checking",
}: SelectedImageReviewScreenProps) {
  const [activeOperation, setActiveOperation] = useState<ReviewOperation>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewLoadError, setPreviewLoadError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const operationRef = useRef<ReviewOperation>(null);
  const previewCallbackReportedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setPreviewLoaded(false);
    setPreviewLoadError(false);
    previewCallbackReportedRef.current = false;
  }, [imageUrl]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => {
      if (mountedRef.current) setToastMessage(null);
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const operationPending = activeOperation !== null || isProceeding;

  const runOperation = useCallback(
    async (operation: Exclude<ReviewOperation, null>, callback: () => void | Promise<void>, errorMessage: string) => {
      if (operationRef.current !== null || isProceeding) return;
      operationRef.current = operation;
      if (mountedRef.current) {
        setToastMessage(null);
        setActiveOperation(operation);
      }
      try {
        await callback();
      } catch {
        if (mountedRef.current) setToastMessage(errorMessage);
      } finally {
        operationRef.current = null;
        if (mountedRef.current) setActiveOperation(null);
      }
    },
    [isProceeding],
  );

  const handlePreviewError = useCallback(() => {
    setPreviewLoaded(false);
    setPreviewLoadError(true);
    if (!onPreviewLoadError || previewCallbackReportedRef.current) return;
    previewCallbackReportedRef.current = true;
    void Promise.resolve()
      .then(() => onPreviewLoadError())
      .catch(() => {
        if (mountedRef.current) setToastMessage(copy.previewCallbackError);
      });
  }, [onPreviewLoadError]);

  const handlePreviewLoad = useCallback(() => {
    setPreviewLoaded(true);
    setPreviewLoadError(false);
  }, []);

  const profileAllowsProceed = profileConsistencyState === "not-required" || profileConsistencyState === "matched";
  const canProceed = previewLoaded && !previewLoadError && validationState === "passed" && profileAllowsProceed && canStartAnalysis && !operationPending;

  function getPrimaryButtonLabel(): string {
    if (activeOperation === "proceed" || isProceeding) {
      return copy.proceeding;
    }

    if (previewLoadError) {
      return copy.photoUnavailable;
    }

    if (!previewLoaded) {
      return copy.loadingPhoto;
    }

    if (validationState === "checking") {
      return copy.checkingPhoto;
    }

    if (validationState === "failed") {
      return copy.photoNeedsAnotherTry;
    }

    if (validationState === "error") {
      return copy.retryPhotoCheck;
    }

    if (profileConsistencyState === "checking") {
      return copy.checkingProfile;
    }

    if (profileConsistencyState === "mismatch") {
      return copy.resolveMismatch;
    }

    if (profileConsistencyState === "error") {
      return copy.resolveProfileCheck;
    }

    if (!canStartAnalysis) {
      return isOffline
        ? copy.reconnectToContinue
        : copy.analysisUnavailable;
    }

    return copy.usePhoto;
  }

  const changeProfileHandler = onChangeProfile
    ? () => void runOperation("change-profile", onChangeProfile, copy.profileRouteError)
    : undefined;
  const createProfileHandler = onCreateNewProfile
    ? () => void runOperation("create-profile", onCreateNewProfile, copy.createProfileError)
    : undefined;
  const retryHandler = onRetryValidation
    ? () => void runOperation("retry-validation", onRetryValidation, copy.retryError)
    : undefined;

  return (
    <AppShell>
      <div className="mx-auto grid min-h-[100dvh] max-w-[1120px] px-6 pb-6 max-[374px]:px-5 md:max-w-[600px] lg:max-w-[1120px] lg:grid-cols-[48%_52%] lg:gap-x-12 lg:px-6 lg:py-6">
        <div className="lg:col-start-2 lg:row-start-1">
          <ReviewTopBar disabled={operationPending} onBack={() => void runOperation("back", onBack, copy.backError)} />
          <ActiveProfileRow disabled={operationPending} onChangeProfile={changeProfileHandler} profileName={profileName} />
          <h1 className="mt-[18px] font-[family-name:var(--dl-display)] text-4xl leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.heading}</h1>
          <p className="mt-2 max-w-[390px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.supporting}</p>
        </div>

        <div className="mt-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <ImagePreviewCard hasError={previewLoadError} imageSource={imageSource} imageUrl={imageUrl} isLoaded={previewLoaded} onError={handlePreviewError} onLoad={handlePreviewLoad} />
          <PreAnalysisNote />
        </div>

        <div className="flex min-h-0 flex-col lg:col-start-2 lg:row-start-2">
          {isOffline ? <OfflineBanner /> : null}
          <PhotoQualityCard disabled={operationPending} onRetryValidation={retryHandler} qualityChecks={qualityChecks} validationState={validationState} />
          <ProfileConsistencyCard disabled={operationPending} onChangeProfile={changeProfileHandler} onCreateNewProfile={createProfileHandler} onRetryValidation={retryHandler} state={profileConsistencyState} />
          <div className="min-h-4 flex-1" />
          <ReviewFooter canProceed={canProceed} disabled={operationPending} imageSource={imageSource} onChooseDifferentSource={() => void runOperation("different-source", onChooseDifferentSource, copy.sourceError)} onProceed={() => void runOperation("proceed", onUsePhoto, copy.usePhotoError)} onReplacePhoto={() => void runOperation("replace-photo", onReplacePhoto, copy.replacementError)} primaryLabel={getPrimaryButtonLabel()} />
        </div>
      </div>
      <ToastRegion message={toastMessage} />
    </AppShell>
  );
}
