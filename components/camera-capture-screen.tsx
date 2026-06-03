import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type CameraPermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "error";

export type CaptureReadiness =
  | "checking"
  | "ready"
  | "no-face"
  | "multiple-faces"
  | "move-closer"
  | "move-back"
  | "center-face"
  | "face-forward"
  | "low-light"
  | "too-bright"
  | "blurry"
  | "obstructed";

export type CameraOperation =
  | "request-access"
  | "capture"
  | "back"
  | "different-source"
  | "settings"
  | "switch-camera"
  | null;

export interface CameraCaptureScreenProps {
  profileName: string;

  permissionState?: CameraPermissionState;
  captureReadiness?: CaptureReadiness;

  previewStream?: MediaStream | null;

  isOffline?: boolean;
  isCapturing?: boolean;

  canSwitchCamera?: boolean;
  isPreviewMirrored?: boolean;

  onBack: () => void | Promise<void>;
  onRequestCameraAccess: () => void | Promise<void>;
  onCapturePhoto: () => void | Promise<void>;
  onChooseDifferentSource: () => void | Promise<void>;

  onOpenDeviceSettings?: () => void | Promise<void>;
  onSwitchCamera?: () => void | Promise<void>;
}

export const copy = {
  contextLabel: "SCAN FACE",

  profilePrefix: "Scanning for",

  permissionHeading: "Allow camera access when you are ready",
  permissionSupporting:
    "DermaLens uses your camera to help you take a clear, front-facing photo for your skin analysis.",

  permissionTrustControl: "Your camera opens only after you allow access",
  permissionTrustReview: "You will review the photo before analysis",
  permissionTrustAlternative: "You can choose an existing image instead",

  allowCamera: "Allow camera access",
  requestingCamera: "Requesting camera access…",

  preparingPreview: "Preparing your preview…",

  readinessChecking: "Checking your framing…",
  readinessReady: "Hold still — you are ready",
  readinessNoFace: "Position your face inside the guide",
  readinessMultipleFaces: "Only one face should be visible",
  readinessMoveCloser: "Move a little closer",
  readinessMoveBack: "Move slightly back",
  readinessCenterFace: "Centre your face inside the guide",
  readinessFaceForward: "Face the camera directly",
  readinessLowLight: "Find more even lighting",
  readinessTooBright: "Move away from harsh lighting",
  readinessBlurry: "Hold still so the image is clear",
  readinessObstructed: "Keep your full face visible",

  capture: "Capture photo",
  capturing: "Capturing photo…",

  chooseDifferentSource: "Choose another method",

  offline:
    "You appear to be offline. You can take a photo now, but analysis may remain unavailable until you reconnect.",
  offlineLive: "You can capture now. Analysis may wait until you reconnect.",

  deniedHeading: "Camera access is turned off",
  deniedSupporting:
    "Allow camera access in your device settings, try again, or choose an existing photo instead.",

  unavailableHeading: "Camera is unavailable",
  unavailableSupporting:
    "This device cannot open a camera preview right now. Choose an existing image instead.",

  errorHeading: "We could not open the camera",
  errorSupporting: "Try again or choose an existing image from your device.",

  tryAgain: "Try camera again",
  openSettings: "Open device settings",

  guidanceBoundary:
    "DermaLens provides skincare guidance, not a medical diagnosis.",

  requestError: "We could not request camera access. Please try again.",
  captureError: "We could not capture your photo. Please try again.",
  backError: "We could not return to the previous screen. Please try again.",
  sourceError: "We could not open the image-source options. Please try again.",
  settingsError:
    "We could not open your device settings. Please open them manually.",
  switchError: "We could not switch cameras. Please try again.",
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

  cameraBackground: "#1F1916",
  cameraPanel: "#2E2420",
  cameraOverlayText: "#FAF7F2",
  cameraOverlayMuted: "rgba(250,247,242,0.72)",
  cameraOverlaySoft: "rgba(250,247,242,0.14)",
} as const;

export const fonts = {
  display: 'var(--font-dm-serif-display), Georgia, serif',
  ui: 'var(--font-dm-sans), system-ui, sans-serif',
  metadata: 'var(--font-space-mono), monospace',
} as const;

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

export const darkFocusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-camera-overlay-text)]";

type IconProps = {
  className?: string;
};

type WarmTopBarProps = {
  disabled: boolean;
  onBack: () => void;
};

type OfflineBannerProps = {
  compact?: boolean;
};

type ToastRegionProps = {
  isLive: boolean;
  message: string | null;
};

type PermissionExperienceProps = {
  disabled: boolean;
  isOffline: boolean;
  isRequesting: boolean;
  onBack: () => void;
  onChooseDifferentSource: () => void;
  onRequestAccess: () => void;
};

type RecoveryExperienceProps = {
  disabled: boolean;
  isOffline: boolean;
  permissionState: Extract<CameraPermissionState, "denied" | "unavailable" | "error">;
  canOpenSettings: boolean;
  onBack: () => void;
  onChooseDifferentSource: () => void;
  onOpenSettings: () => void;
  onRetry: () => void;
};

type LiveCameraExperienceProps = {
  canCapture: boolean;
  canSwitchCamera: boolean;
  captureReadiness: CaptureReadiness;
  capturing: boolean;
  disabled: boolean;
  isOffline: boolean;
  isPreviewMirrored: boolean;
  onBack: () => void;
  onCapture: () => void;
  onChooseDifferentSource: () => void;
  onSwitchCamera: () => void;
  previewStream: MediaStream | null;
  profileName: string;
};

type LiveTopBarProps = {
  canSwitchCamera: boolean;
  disabled: boolean;
  onBack: () => void;
  onSwitchCamera: () => void;
};

type CameraPreviewProps = {
  isPreviewMirrored: boolean;
  previewStream: MediaStream | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

type ReadinessGuidancePillProps = {
  readiness: CaptureReadiness;
};

type CaptureControlsProps = {
  canCapture: boolean;
  capturing: boolean;
  disabled: boolean;
  isOffline: boolean;
  onCapture: () => void;
  onChooseDifferentSource: () => void;
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
  "--dl-camera-background": colors.cameraBackground,
  "--dl-camera-panel": colors.cameraPanel,
  "--dl-camera-overlay-text": colors.cameraOverlayText,
  "--dl-camera-overlay-muted": colors.cameraOverlayMuted,
  "--dl-camera-overlay-soft": colors.cameraOverlaySoft,
  "--dl-display": fonts.display,
  "--dl-ui": fonts.ui,
  "--dl-metadata": fonts.metadata,
} as CSSProperties;

function ArrowLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M19 12H5m6 6-6-6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CameraIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M4.6 7.8h3.1l1.2-1.9h6.2l1.2 1.9h3.1a1.6 1.6 0 0 1 1.6 1.6v8.4a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V9.4a1.6 1.6 0 0 1 1.6-1.6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="13.4" r="3.25" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ApertureIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7.4" stroke="currentColor" strokeWidth="1.55" />
      <path
        d="m12 4.6 3.35 5.8m4.05 1.6h-6.7m3.35 5.8-3.35-5.8m-.7 7.4-3.35-5.8M4.6 12h6.7M7.95 6.2l3.35 5.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="m6.4 12.2 3.5 3.5 7.7-7.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function WarningIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 8.5v4.75m0 3.25h.01M10.1 4.8 3.16 16.65A2 2 0 0 0 4.88 19.7h14.24a2 2 0 0 0 1.72-3.05L13.9 4.8a2 2 0 0 0-3.8 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function InfoIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 10.7v5m0-8.15h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function SwitchCameraIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M7.4 7.4H5.8A2.8 2.8 0 0 0 3 10.2v6A2.8 2.8 0 0 0 5.8 19h12.4a2.8 2.8 0 0 0 2.8-2.8v-6a2.8 2.8 0 0 0-2.8-2.8h-1.6l-1.25-2H8.65l-1.25 2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M14.9 11.2A3.2 3.2 0 0 0 9 12m.1 2.8A3.2 3.2 0 0 0 15 14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.55"
      />
      <path d="m8.45 10.9.55 1.2 1.2-.55m5.35 1.55-.55-1.2-1.2.55" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.35" />
    </svg>
  );
}

function Spinner({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`${className} animate-spin motion-reduce:animate-none`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-30" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function WarmTopBar({ disabled, onBack }: WarmTopBarProps) {
  return (
    <header className="flex min-h-12 items-center justify-between pt-[max(16px,env(safe-area-inset-top))]">
      <button
        aria-label="Go back"
        className={`flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] ${focusRing}`}
        disabled={disabled}
        onClick={onBack}
        type="button"
      >
        <ArrowLeftIcon />
      </button>
      <span className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </span>
    </header>
  );
}

function OfflineBanner({ compact = false }: OfflineBannerProps) {
  return (
    <div
      className={`${compact ? "rounded-full px-3 py-2" : "rounded-xl p-3"} flex gap-2 bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]`}
      role="status"
    >
      <WarningIcon className={`${compact ? "h-[18px] w-[18px]" : "h-5 w-5"} shrink-0`} />
      <p className={`${compact ? "text-[13px] leading-[18px]" : "text-sm leading-5"}`}>
        {compact ? copy.offlineLive : copy.offline}
      </p>
    </div>
  );
}

function CameraPermissionIllustration({ large = false }: { large?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`${large ? "h-[196px] w-[196px]" : "h-20 w-20 max-[374px]:h-[72px] max-[374px]:w-[72px]"} relative flex shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-bark)]`}
    >
      <CameraIcon className={large ? "h-20 w-20" : "h-9 w-9"} />
      <span className={`${large ? "h-[72px] w-[72px]" : "h-8 w-8"} absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-[var(--dl-page)] bg-[var(--dl-peach)] text-[var(--dl-bark)]`}>
        <ApertureIcon className={large ? "h-10 w-10" : "h-5 w-5"} />
      </span>
    </div>
  );
}

function DesktopWarmAside() {
  return (
    <aside className="hidden min-h-[680px] flex-col justify-center rounded-[28px] bg-[var(--dl-parchment)] p-12 lg:flex">
      <CameraPermissionIllustration large />
      <p className="mt-12 max-w-[340px] font-[family-name:var(--dl-display)] text-[38px] leading-[43px] text-[var(--dl-text-primary)]">
        A clear photo creates more useful guidance.
      </p>
    </aside>
  );
}

function WarmPageShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]"
      style={rootStyle}
    >
      <div className="mx-auto grid min-h-[100dvh] max-w-[1040px] lg:grid-cols-[42%_58%] lg:gap-16 lg:px-6 lg:py-6">
        <DesktopWarmAside />
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[560px] flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] max-[374px]:px-5 lg:min-h-[680px] lg:pr-0">
          {children}
        </div>
      </div>
    </main>
  );
}

function PermissionTrustList() {
  const items = [
    copy.permissionTrustControl,
    copy.permissionTrustReview,
    copy.permissionTrustAlternative,
  ];

  return (
    <ul className="mt-[22px] space-y-2.5 max-[374px]:mt-[18px]">
      {items.map((item) => (
        <li className="flex gap-2 text-sm leading-5 text-[var(--dl-text-secondary)]" key={item}>
          <CheckIcon className="h-5 w-5 shrink-0 text-[var(--dl-peach-strong)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PrimaryWarmButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] ${focusRing}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function WarmTextButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-11 w-full rounded-lg px-3 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] ${focusRing}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PermissionExperience({
  disabled,
  isOffline,
  isRequesting,
  onBack,
  onChooseDifferentSource,
  onRequestAccess,
}: PermissionExperienceProps) {
  return (
    <WarmPageShell>
      <WarmTopBar disabled={disabled} onBack={onBack} />
      <section className="flex flex-1 flex-col">
        <div className="mt-7 max-[374px]:mt-5">
          <CameraPermissionIllustration />
        </div>
        <h1 className="mt-6 max-w-[360px] font-[family-name:var(--dl-display)] text-[38px] leading-[42px] text-[var(--dl-text-primary)] max-[374px]:mt-5 max-[374px]:text-[34px] max-[374px]:leading-[38px]">
          {copy.permissionHeading}
        </h1>
        <p className="mt-3 max-w-[390px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
          {copy.permissionSupporting}
        </p>
        <PermissionTrustList />
        {isOffline ? <div className="mt-[18px]"><OfflineBanner /></div> : null}
        <div className="min-h-6 flex-1" />
        <div className="pt-6">
          <PrimaryWarmButton disabled={disabled} onClick={onRequestAccess}>
            {isRequesting ? <Spinner /> : null}
            <span aria-live="polite">
              {isRequesting ? copy.requestingCamera : copy.allowCamera}
            </span>
          </PrimaryWarmButton>
          <div className="mt-2">
            <WarmTextButton disabled={disabled} onClick={onChooseDifferentSource}>
              {copy.chooseDifferentSource}
            </WarmTextButton>
          </div>
          <p className="mt-3 text-center text-xs leading-[18px] text-[var(--dl-text-secondary)]">
            {copy.guidanceBoundary}
          </p>
        </div>
      </section>
    </WarmPageShell>
  );
}

function RecoveryIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-bark)] max-[374px]:h-[72px] max-[374px]:w-[72px]"
    >
      <CameraIcon className="h-9 w-9" />
      <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--dl-page)] bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]">
        <WarningIcon className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}

function RecoveryExperience({
  canOpenSettings,
  disabled,
  isOffline,
  onBack,
  onChooseDifferentSource,
  onOpenSettings,
  onRetry,
  permissionState,
}: RecoveryExperienceProps) {
  const heading =
    permissionState === "denied"
      ? copy.deniedHeading
      : permissionState === "unavailable"
        ? copy.unavailableHeading
        : copy.errorHeading;
  const supporting =
    permissionState === "denied"
      ? copy.deniedSupporting
      : permissionState === "unavailable"
        ? copy.unavailableSupporting
        : copy.errorSupporting;
  const canRetry = permissionState !== "unavailable";

  return (
    <WarmPageShell>
      <WarmTopBar disabled={disabled} onBack={onBack} />
      <section className="flex flex-1 flex-col">
        <div className="mt-7 max-[374px]:mt-5">
          <RecoveryIllustration />
        </div>
        <h1 className="mt-6 max-w-[380px] font-[family-name:var(--dl-display)] text-[38px] leading-[42px] text-[var(--dl-text-primary)] max-[374px]:mt-5 max-[374px]:text-[34px] max-[374px]:leading-[38px]">
          {heading}
        </h1>
        <p className="mt-3 max-w-[390px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
          {supporting}
        </p>
        {isOffline ? <div className="mt-[18px]"><OfflineBanner /></div> : null}
        <div className="min-h-6 flex-1" />
        <div className="space-y-2 pt-6">
          {canRetry ? (
            <PrimaryWarmButton disabled={disabled} onClick={onRetry}>
              {copy.tryAgain}
            </PrimaryWarmButton>
          ) : null}
          {permissionState === "denied" && canOpenSettings ? (
            <button
              className={`min-h-12 w-full rounded-full border border-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:border-[var(--dl-stone)] disabled:text-[var(--dl-dusk)] ${focusRing}`}
              disabled={disabled}
              onClick={onOpenSettings}
              type="button"
            >
              {copy.openSettings}
            </button>
          ) : null}
          <WarmTextButton disabled={disabled} onClick={onChooseDifferentSource}>
            {copy.chooseDifferentSource}
          </WarmTextButton>
        </div>
      </section>
    </WarmPageShell>
  );
}

function CameraPreview({ isPreviewMirrored, previewStream, videoRef }: CameraPreviewProps) {
  return (
    <>
      <video
        aria-label="Live camera preview"
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${
          isPreviewMirrored ? "-scale-x-100" : ""
        }`}
        muted
        playsInline
        ref={videoRef}
      />
      {!previewStream ? (
        <div
          aria-live="polite"
          className="absolute inset-0 flex items-center justify-center bg-[var(--dl-camera-background)]"
          role="status"
        >
          <div className="flex flex-col items-center gap-3 text-[var(--dl-camera-overlay-text)]">
            <Spinner className="h-6 w-6" />
            <p className="text-sm leading-5">{copy.preparingPreview}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function LiveTopBar({ canSwitchCamera, disabled, onBack, onSwitchCamera }: LiveTopBarProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex min-h-[88px] items-center justify-between bg-gradient-to-b from-black/55 to-transparent px-5 pt-[max(16px,env(safe-area-inset-top))]">
      <button
        aria-label="Go back"
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-[var(--dl-camera-overlay-text)] backdrop-blur-sm transition-colors hover:bg-black/45 disabled:cursor-not-allowed disabled:text-[var(--dl-camera-overlay-muted)] ${darkFocusRing}`}
        disabled={disabled}
        onClick={onBack}
        type="button"
      >
        <ArrowLeftIcon />
      </button>
      <span className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-camera-overlay-text)]">
        {copy.contextLabel}
      </span>
      {canSwitchCamera ? (
        <button
          aria-label="Switch camera"
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-[var(--dl-camera-overlay-text)] backdrop-blur-sm transition-colors hover:bg-black/45 disabled:cursor-not-allowed disabled:text-[var(--dl-camera-overlay-muted)] ${darkFocusRing}`}
          disabled={disabled}
          onClick={onSwitchCamera}
          type="button"
        >
          <SwitchCameraIcon />
        </button>
      ) : (
        <span aria-hidden="true" className="h-11 w-11" />
      )}
    </header>
  );
}

function ActiveProfilePill({ profileName }: { profileName: string }) {
  const trimmedName = profileName.trim() || "?";

  return (
    <div className="absolute left-5 top-[calc(max(16px,env(safe-area-inset-top))+78px)] z-20 inline-flex max-w-[calc(100%-40px)] rounded-full border border-white/15 bg-[rgba(31,25,22,0.58)] px-3 py-2 text-[13px] leading-[18px] text-[var(--dl-camera-overlay-text)] backdrop-blur-sm">
      <span className="truncate">
        {copy.profilePrefix} {trimmedName}
      </span>
    </div>
  );
}

function FaceGuideOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pb-16"
      data-testid="face-guide-overlay"
    >
      <div
        className="relative w-[62vw] max-w-[260px] aspect-[0.78] rounded-[50%] border-2 border-dashed border-[rgba(232,169,138,0.55)] shadow-[0_0_0_9999px_rgba(31,25,22,0.24)]"
      >
        <span className="absolute -left-1 -top-1 h-7 w-7 rounded-tl-2xl border-l-[3px] border-t-[3px] border-[var(--dl-peach)]" />
        <span className="absolute -right-1 -top-1 h-7 w-7 rounded-tr-2xl border-r-[3px] border-t-[3px] border-[var(--dl-peach)]" />
        <span className="absolute -bottom-1 -left-1 h-7 w-7 rounded-bl-2xl border-b-[3px] border-l-[3px] border-[var(--dl-peach)]" />
        <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-br-2xl border-b-[3px] border-r-[3px] border-[var(--dl-peach)]" />
      </div>
    </div>
  );
}

export function getReadinessMessage(readiness: CaptureReadiness): string {
  const messages: Record<CaptureReadiness, string> = {
    checking: copy.readinessChecking,
    ready: copy.readinessReady,
    "no-face": copy.readinessNoFace,
    "multiple-faces": copy.readinessMultipleFaces,
    "move-closer": copy.readinessMoveCloser,
    "move-back": copy.readinessMoveBack,
    "center-face": copy.readinessCenterFace,
    "face-forward": copy.readinessFaceForward,
    "low-light": copy.readinessLowLight,
    "too-bright": copy.readinessTooBright,
    blurry: copy.readinessBlurry,
    obstructed: copy.readinessObstructed,
  };

  return messages[readiness];
}

function ReadinessGuidancePill({ readiness }: ReadinessGuidancePillProps) {
  const ready = readiness === "ready";
  const checking = readiness === "checking";
  const style = ready
    ? "bg-[var(--dl-blush)] text-[var(--dl-bark)]"
    : checking
      ? "bg-[rgba(250,247,242,0.9)] text-[var(--dl-bark)]"
      : "bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]";

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`${style} flex max-w-[420px] items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm leading-5 shadow-[0_4px_20px_rgba(31,25,22,0.14)]`}
      role="status"
    >
      {ready ? <CheckIcon className="h-[18px] w-[18px] shrink-0" /> : checking ? <InfoIcon className="h-[18px] w-[18px] shrink-0" /> : <WarningIcon className="h-[18px] w-[18px] shrink-0" />}
      <span>{getReadinessMessage(readiness)}</span>
    </div>
  );
}

function CaptureControls({
  canCapture,
  capturing,
  disabled,
  isOffline,
  onCapture,
  onChooseDifferentSource,
}: CaptureControlsProps) {
  return (
    <section className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[rgba(31,25,22,0.96)] via-[rgba(31,25,22,0.82)] to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-10 backdrop-blur-[2px]">
      {isOffline ? <div className="mx-auto mb-3 max-w-[420px]"><OfflineBanner compact /></div> : null}
      <div className="mx-auto flex max-w-[420px] flex-col items-center">
        <button
          aria-label={capturing ? copy.capturing : copy.capture}
          className={`flex h-[76px] w-[76px] items-center justify-center rounded-full border-[3px] border-[rgba(250,247,242,0.88)] transition-transform motion-reduce:transition-none enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:border-[rgba(250,247,242,0.42)] ${darkFocusRing}`}
          disabled={!canCapture}
          onClick={onCapture}
          type="button"
        >
          <span
            className={`flex h-[58px] w-[58px] items-center justify-center rounded-full text-[var(--dl-camera-panel)] ${
              canCapture
                ? "bg-[var(--dl-camera-overlay-text)]"
                : "bg-[var(--dl-camera-overlay-muted)]"
            }`}
          >
            {capturing ? <Spinner className="h-5 w-5" /> : null}
          </span>
        </button>
        <button
          className={`mt-2.5 min-h-11 rounded-lg px-4 text-sm font-semibold leading-5 text-[var(--dl-camera-overlay-text)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-camera-overlay-muted)] ${darkFocusRing}`}
          disabled={disabled}
          onClick={onChooseDifferentSource}
          type="button"
        >
          {copy.chooseDifferentSource}
        </button>
      </div>
    </section>
  );
}

function LiveCameraExperience({
  canCapture,
  canSwitchCamera,
  captureReadiness,
  capturing,
  disabled,
  isOffline,
  isPreviewMirrored,
  onBack,
  onCapture,
  onChooseDifferentSource,
  onSwitchCamera,
  previewStream,
  profileName,
}: LiveCameraExperienceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = previewStream;

    return () => {
      if (video.srcObject === previewStream) {
        video.srcObject = null;
      }
    };
  }, [previewStream]);

  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[var(--dl-camera-background)] font-[family-name:var(--dl-ui)]"
      style={rootStyle}
    >
      <section className="relative h-[100dvh] w-full max-w-[620px] overflow-hidden bg-[var(--dl-camera-background)] lg:h-[calc(100dvh-48px)] lg:max-h-[920px] lg:rounded-[28px]">
        <CameraPreview
          isPreviewMirrored={isPreviewMirrored}
          previewStream={previewStream}
          videoRef={videoRef}
        />
        <LiveTopBar
          canSwitchCamera={canSwitchCamera}
          disabled={disabled}
          onBack={onBack}
          onSwitchCamera={onSwitchCamera}
        />
        <ActiveProfilePill profileName={profileName} />
        {previewStream ? (
          <>
            <FaceGuideOverlay />
            <div className="absolute inset-x-5 bottom-[176px] z-30 flex justify-center">
              <ReadinessGuidancePill readiness={captureReadiness} />
            </div>
          </>
        ) : null}
        <CaptureControls
          canCapture={canCapture}
          capturing={capturing}
          disabled={disabled}
          isOffline={isOffline}
          onCapture={onCapture}
          onChooseDifferentSource={onChooseDifferentSource}
        />
      </section>
    </main>
  );
}

function ToastRegion({ isLive, message }: ToastRegionProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-5"
      role="status"
      style={{
        bottom: isLive
          ? "calc(max(20px, env(safe-area-inset-bottom)) + 150px)"
          : "max(20px, env(safe-area-inset-bottom))",
      }}
    >
      {message ? (
        <p
          className={`${isLive ? "border-white/15 bg-[var(--dl-camera-panel)] text-[var(--dl-camera-overlay-text)]" : "border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] text-[var(--dl-bark)]"} w-full max-w-[520px] rounded-xl border px-4 py-3 text-sm leading-5 shadow-[0_4px_20px_rgba(92,74,66,0.12)] transition-opacity motion-reduce:transition-none`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default function CameraCaptureScreen({
  profileName,
  permissionState = "idle",
  captureReadiness = "checking",
  previewStream = null,
  isOffline = false,
  isCapturing = false,
  canSwitchCamera = false,
  isPreviewMirrored = true,
  onBack,
  onRequestCameraAccess,
  onCapturePhoto,
  onChooseDifferentSource,
  onOpenDeviceSettings,
  onSwitchCamera,
}: CameraCaptureScreenProps) {
  const mountedRef = useRef(false);
  const activeOperationRef = useRef<CameraOperation>(null);
  const [activeOperation, setActiveOperation] = useState<CameraOperation>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = window.setTimeout(() => {
      if (mountedRef.current) setToastMessage(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const operationPending =
    activeOperation !== null || permissionState === "requesting" || isCapturing;

  const runOperation = useCallback(
    async (
      operation: Exclude<CameraOperation, null>,
      callback: () => void | Promise<void>,
      errorMessage: string,
    ) => {
      if (
        activeOperationRef.current !== null ||
        permissionState === "requesting" ||
        isCapturing
      ) {
        return;
      }

      activeOperationRef.current = operation;
      if (mountedRef.current) {
        setActiveOperation(operation);
        setToastMessage(null);
      }

      try {
        await callback();
      } catch {
        if (mountedRef.current) setToastMessage(errorMessage);
      } finally {
        activeOperationRef.current = null;
        if (mountedRef.current) setActiveOperation(null);
      }
    },
    [isCapturing, permissionState],
  );

  const handleBack = useCallback(() => {
    if (operationPending || activeOperationRef.current !== null) return;
    void runOperation("back", onBack, copy.backError);
  }, [onBack, operationPending, runOperation]);

  const handleRequestAccess = useCallback(() => {
    if (operationPending || activeOperationRef.current !== null) return;
    // Connect this callback to the host camera adapter. It may request the
    // front-facing camera only after this explicit user activation.
    void runOperation("request-access", onRequestCameraAccess, copy.requestError);
  }, [onRequestCameraAccess, operationPending, runOperation]);

  const handleDifferentSource = useCallback(() => {
    if (operationPending || activeOperationRef.current !== null) return;
    // Route back to ImageSourceSelectionScreen.
    void runOperation("different-source", onChooseDifferentSource, copy.sourceError);
  }, [onChooseDifferentSource, operationPending, runOperation]);

  const handleOpenSettings = useCallback(() => {
    if (!onOpenDeviceSettings || operationPending || activeOperationRef.current !== null) return;
    void runOperation("settings", onOpenDeviceSettings, copy.settingsError);
  }, [onOpenDeviceSettings, operationPending, runOperation]);

  const handleSwitchCamera = useCallback(() => {
    if (!onSwitchCamera || operationPending || activeOperationRef.current !== null) return;
    void runOperation("switch-camera", onSwitchCamera, copy.switchError);
  }, [onSwitchCamera, operationPending, runOperation]);

  const capturing = isCapturing || activeOperation === "capture";
  const canCapture =
    Boolean(previewStream) &&
    captureReadiness === "ready" &&
    !capturing &&
    !operationPending;

  const handleCapture = useCallback(() => {
    if (!canCapture || operationPending || activeOperationRef.current !== null) return;
    // The host camera adapter captures the still image after this activation
    // and routes the result to SelectedImageReviewScreen.
    void runOperation("capture", onCapturePhoto, copy.captureError);
  }, [canCapture, onCapturePhoto, operationPending, runOperation]);

  const isLive = permissionState === "granted";
  const switchControlVisible = Boolean(canSwitchCamera && onSwitchCamera);

  return (
    <>
      {permissionState === "idle" || permissionState === "requesting" ? (
        <PermissionExperience
          disabled={operationPending}
          isOffline={isOffline}
          isRequesting={permissionState === "requesting" || activeOperation === "request-access"}
          onBack={handleBack}
          onChooseDifferentSource={handleDifferentSource}
          onRequestAccess={handleRequestAccess}
        />
      ) : permissionState === "denied" || permissionState === "unavailable" || permissionState === "error" ? (
        <RecoveryExperience
          canOpenSettings={Boolean(onOpenDeviceSettings)}
          disabled={operationPending}
          isOffline={isOffline}
          onBack={handleBack}
          onChooseDifferentSource={handleDifferentSource}
          onOpenSettings={handleOpenSettings}
          onRetry={handleRequestAccess}
          permissionState={permissionState}
        />
      ) : (
        <LiveCameraExperience
          canCapture={canCapture}
          canSwitchCamera={switchControlVisible}
          captureReadiness={captureReadiness}
          capturing={capturing}
          disabled={operationPending}
          isOffline={isOffline}
          isPreviewMirrored={isPreviewMirrored}
          onBack={handleBack}
          onCapture={handleCapture}
          onChooseDifferentSource={handleDifferentSource}
          onSwitchCamera={handleSwitchCamera}
          previewStream={previewStream}
          profileName={profileName}
        />
      )}
      <div style={rootStyle}>
        <ToastRegion isLive={isLive} message={toastMessage} />
      </div>
    </>
  );
}
