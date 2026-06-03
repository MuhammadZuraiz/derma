import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ImageSource = "camera" | "upload";

export interface ImageSourceSelectionScreenProps {
  profileName: string;

  isOffline?: boolean;
  isOpeningSource?: boolean;

  isCameraAvailable?: boolean;
  isUploadAvailable?: boolean;

  onBack: () => void | Promise<void>;
  onChooseCamera: () => void | Promise<void>;
  onChooseUpload: () => void | Promise<void>;

  onChangeProfile?: () => void | Promise<void>;
}

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

export const copy = {
  contextLabel: "START YOUR SCAN",

  profilePrefix: "Scanning for",
  changeProfile: "Change profile",

  heading: "How would you like to add your photo?",
  supporting:
    "Take a new photo for the most consistent results, or choose a clear recent image from your device.",

  offline:
    "You appear to be offline. You can choose an image now, but some analysis features may remain unavailable until you reconnect.",

  recommended: "Recommended",

  cameraTitle: "Take a new photo",
  cameraBody: "Best for guided capture and consistent quality checks.",
  cameraUnavailable:
    "Camera access is not available on this device. Choose a photo from your device instead.",
  openingCamera: "Opening camera…",

  uploadTitle: "Choose from your device",
  uploadBody: "Select a recent, unedited, front-facing photo.",
  uploadUnavailable: "Photo upload is not available on this device.",
  openingUpload: "Opening photo picker…",

  noSources:
    "No image source is currently available on this device. Please try again later or use another device.",

  tipsHeading: "For a clearer scan",
  tipForward: "Face forward",
  tipLighting: "Use even lighting",
  tipFocus: "Keep your full face clear and in focus",

  reviewNote: "You will review your image before analysis begins.",

  sourceError: "We could not open this option. Please try again.",
  backError: "We could not return to the previous screen. Please try again.",
  profileError: "We could not open your profiles. Please try again.",
} as const;

type IconProps = {
  className?: string;
};

type AppShellProps = {
  children: ReactNode;
};

type SourceTopBarProps = {
  disabled: boolean;
  onBack: () => void;
};

type ActiveProfileCardProps = {
  profileName: string;
  disabled: boolean;
  onChangeProfile?: () => void;
};

type SourceCardProps = {
  source: ImageSource;
  title: string;
  body: string;
  disabled: boolean;
  recommended?: boolean;
  onActivate: () => void;
};

type SourceCardsProps = {
  activeSource: ImageSource | null;
  disabled: boolean;
  isCameraAvailable: boolean;
  isUploadAvailable: boolean;
  onChooseCamera: () => void;
  onChooseUpload: () => void;
};

type ToastRegionProps = {
  message: string | null;
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

function ChevronRightIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="m9 5 7 7-7 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
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

function CheckIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="m6.5 12.4 3.4 3.4 7.6-7.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ShieldIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3.8c2.25 1.45 4.52 2.12 6.8 2.12v5.15c0 4.12-2.42 7.42-6.8 9.13-4.38-1.71-6.8-5.01-6.8-9.13V5.92c2.28 0 4.55-.67 6.8-2.12Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m9.4 12 1.75 1.75 3.45-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
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
      <circle cx="12" cy="13.5" r="3.15" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PhotoIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <rect x="3.4" y="4.2" width="17.2" height="15.6" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8.25" cy="9" r="1.45" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m5.6 17 4.15-4.25 2.8 2.65 2.2-2.15L18.55 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function FaceApertureArtwork({ className = "h-[72px] w-[72px]" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="58" fill="var(--dl-blush)" />
      <path
        d="M60 26.5c-14.2 0-24.4 11.1-24.4 26.7 0 7.5 2.3 14.15 6.45 19.75 4.6 6.2 10.4 10.55 17.95 14.55 7.55-4 13.35-8.35 17.95-14.55 4.15-5.6 6.45-12.25 6.45-19.75C84.4 37.6 74.2 26.5 60 26.5Z"
        stroke="var(--dl-bark)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M49 57.5c3 2.1 6.67 3.15 11 3.15s8-1.05 11-3.15M51.5 47.2h.01M68.5 47.2h.01"
        stroke="var(--dl-bark)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path d="M29 43v-9a5 5 0 0 1 5-5h9M77 29h9a5 5 0 0 1 5 5v9M91 77v9a5 5 0 0 1-5 5h-9M43 91h-9a5 5 0 0 1-5-5v-9" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

function DesktopArtwork() {
  return (
    <svg aria-hidden="true" className="h-[260px] w-[260px]" fill="none" viewBox="0 0 280 280">
      <circle cx="140" cy="140" r="136" fill="var(--dl-blush)" />
      <circle cx="140" cy="140" r="112" stroke="var(--dl-blush-strong)" strokeWidth="2" />
      <circle cx="140" cy="140" r="88" stroke="var(--dl-peach)" strokeDasharray="5 10" strokeLinecap="round" strokeWidth="3" />
      <path
        d="M140 73c-29.5 0-50.6 23.1-50.6 55.5 0 15.5 4.8 29.3 13.4 40.9 9.5 12.9 21.6 21.9 37.2 30.2 15.6-8.3 27.7-17.3 37.2-30.2 8.6-11.6 13.4-25.4 13.4-40.9C190.6 96.1 169.5 73 140 73Z"
        stroke="var(--dl-bark)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path d="M116 137c6.3 4.3 14.3 6.5 24 6.5s17.7-2.2 24-6.5M122 116h.01M158 116h.01" stroke="var(--dl-bark)" strokeLinecap="round" strokeWidth="5" />
      <path d="M68 106V81a13 13 0 0 1 13-13h25M174 68h25a13 13 0 0 1 13 13v25M212 174v25a13 13 0 0 1-13 13h-25M106 212H81a13 13 0 0 1-13-13v-25" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeWidth="7" />
    </svg>
  );
}

function AppShell({ children }: AppShellProps) {
  return (
    <main
      className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]"
      style={rootStyle}
    >
      <div className="mx-auto min-h-[100dvh] w-full max-w-[520px] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] min-[320px]:max-[374px]:px-5 md:max-w-[560px] md:py-[max(32px,env(safe-area-inset-top))] lg:grid lg:max-w-[1040px] lg:grid-cols-[42fr_58fr] lg:items-center lg:gap-16 lg:px-0 lg:py-12">
        {children}
      </div>
    </main>
  );
}

function SourceTopBar({ disabled, onBack }: SourceTopBarProps) {
  return (
    <header className="flex min-h-12 items-center justify-between">
      <button
        aria-label="Go back"
        className={`flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] ${focusRing}`}
        disabled={disabled}
        type="button"
        onClick={onBack}
      >
        <ArrowLeftIcon />
      </button>
      <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </p>
    </header>
  );
}

function ActiveProfileCard({ profileName, disabled, onChangeProfile }: ActiveProfileCardProps) {
  const trimmedName = profileName.trim();
  const initial = Array.from(trimmedName)[0]?.toUpperCase() ?? "?";

  return (
    <section
      aria-label="Active profile"
      className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-3"
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] font-[family-name:var(--dl-display)] text-xl text-[var(--dl-bark)]"
        data-testid="profile-initial"
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-4 text-[var(--dl-text-secondary)]">{copy.profilePrefix}</p>
        <p className="truncate text-base font-semibold leading-[22px] text-[var(--dl-text-primary)]">
          {trimmedName}
        </p>
      </div>
      {onChangeProfile ? (
        <button
          className={`min-h-11 shrink-0 rounded-lg px-1 text-sm font-semibold text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] ${focusRing}`}
          disabled={disabled}
          type="button"
          onClick={onChangeProfile}
        >
          {copy.changeProfile}
        </button>
      ) : null}
    </section>
  );
}

function SourceIllustration() {
  return (
    <div className="mt-4 min-[375px]:mt-5 lg:hidden">
      <FaceApertureArtwork className="h-16 w-16 min-[375px]:h-[72px] min-[375px]:w-[72px]" />
    </div>
  );
}

function OfflineBanner() {
  return (
    <div
      className="mt-3.5 flex gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]"
      role="status"
    >
      <WarningIcon className="h-5 w-5 shrink-0" />
      <p>{copy.offline}</p>
    </div>
  );
}

function NoSourcesAvailableAlert() {
  return (
    <div
      className="mt-[18px] rounded-[14px] border border-[rgba(163,61,42,0.25)] bg-[var(--dl-error-surface)] p-3.5 text-sm leading-5 text-[var(--dl-error-text)]"
      role="alert"
    >
      {copy.noSources}
    </div>
  );
}

function SourceCard({ source, title, body, disabled, recommended = false, onActivate }: SourceCardProps) {
  const icon = source === "camera" ? <CameraIcon /> : <PhotoIcon />;

  return (
    <button
      aria-label={title}
      className={`group flex min-h-28 w-full items-center gap-3.5 rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4 text-left transition-[background-color,border-color,transform] hover:-translate-y-px hover:border-[var(--dl-blush-strong)] hover:bg-[#FFFDFC] active:translate-y-0 active:bg-[var(--dl-surface-soft)] motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-[var(--dl-border-subtle)] disabled:bg-[var(--dl-surface-soft)] disabled:hover:translate-y-0 ${focusRing}`}
      disabled={disabled}
      type="button"
      onClick={onActivate}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--dl-blush)] text-[var(--dl-peach-strong)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        {recommended ? (
          <span className="mb-1 inline-flex rounded-full bg-[var(--dl-blush)] px-2 py-[3px] text-[11px] font-semibold leading-4 text-[var(--dl-bark)]">
            {copy.recommended}
          </span>
        ) : null}
        <span className="block text-base font-semibold leading-[22px] text-[var(--dl-text-primary)]">{title}</span>
        <span className="mt-[3px] block text-sm leading-5 text-[var(--dl-text-secondary)]">{body}</span>
      </span>
      <ChevronRightIcon className="h-[18px] w-[18px] shrink-0 text-[var(--dl-dusk)]" />
    </button>
  );
}

function SourceCards({
  activeSource,
  disabled,
  isCameraAvailable,
  isUploadAvailable,
  onChooseCamera,
  onChooseUpload,
}: SourceCardsProps) {
  return (
    <div className="mt-4 space-y-3 min-[375px]:mt-5">
      <SourceCard
        body={isCameraAvailable ? copy.cameraBody : copy.cameraUnavailable}
        disabled={disabled || !isCameraAvailable}
        recommended
        source="camera"
        title={activeSource === "camera" ? copy.openingCamera : copy.cameraTitle}
        onActivate={onChooseCamera}
      />
      <SourceCard
        body={isUploadAvailable ? copy.uploadBody : copy.uploadUnavailable}
        disabled={disabled || !isUploadAvailable}
        source="upload"
        title={activeSource === "upload" ? copy.openingUpload : copy.uploadTitle}
        onActivate={onChooseUpload}
      />
    </div>
  );
}

function PhotoTipsCard() {
  const tips = [copy.tipForward, copy.tipLighting, copy.tipFocus];

  return (
    <section className="mt-5 rounded-2xl bg-[var(--dl-surface-soft)] p-3.5" aria-labelledby="photo-tips-heading">
      <h2 id="photo-tips-heading" className="text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">
        {copy.tipsHeading}
      </h2>
      <ul className="mt-2.5 space-y-2">
        {tips.map((tip) => (
          <li className="flex gap-2 text-sm leading-5 text-[var(--dl-text-secondary)]" key={tip}>
            <CheckIcon className="h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewNote() {
  return (
    <div className="mt-3.5 flex gap-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <ShieldIcon className="h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <p>{copy.reviewNote}</p>
    </div>
  );
}

function ToastRegion({ message }: ToastRegionProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-5 bottom-[max(20px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-[520px]"
      role="status"
    >
      {message ? (
        <div className="rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-opacity motion-reduce:transition-none">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function DesktopAside() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:items-start lg:justify-center" aria-hidden="true">
      <DesktopArtwork />
      <p className="mt-8 max-w-[360px] font-[family-name:var(--dl-display)] text-[34px] leading-[40px] text-[var(--dl-text-primary)]">
        A clearer photo creates more useful guidance.
      </p>
      <p className="mt-3 max-w-[360px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
        Choose the method that works best for you. You will review the image before analysis begins.
      </p>
    </aside>
  );
}

function SourceSelectionContent({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

export default function ImageSourceSelectionScreen({
  profileName,
  isOffline = false,
  isOpeningSource = false,
  isCameraAvailable = true,
  isUploadAvailable = true,
  onBack,
  onChooseCamera,
  onChooseUpload,
  onChangeProfile,
}: ImageSourceSelectionScreenProps) {
  const mountedRef = useRef(false);
  const sourceInFlightRef = useRef(false);
  const navigationInFlightRef = useRef(false);
  const [activeSource, setActiveSource] = useState<ImageSource | null>(null);
  const [navigationPending, setNavigationPending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => {
      if (mountedRef.current) setToastMessage(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const opening = isOpeningSource || activeSource !== null;
  const locked = opening || navigationPending;
  const noSourcesAvailable = !isCameraAvailable && !isUploadAvailable;

  const runNavigation = useCallback(
    async (callback: () => void | Promise<void>, failureMessage: string) => {
      if (locked || navigationInFlightRef.current || sourceInFlightRef.current) return;
      navigationInFlightRef.current = true;
      setToastMessage(null);
      setNavigationPending(true);
      try {
        await callback();
      } catch {
        if (mountedRef.current) setToastMessage(failureMessage);
      } finally {
        navigationInFlightRef.current = false;
        if (mountedRef.current) setNavigationPending(false);
      }
    },
    [locked],
  );

  const handleBack = useCallback(() => {
    void runNavigation(onBack, copy.backError);
  }, [onBack, runNavigation]);

  const handleChangeProfile = useCallback(() => {
    if (!onChangeProfile) return;
    void runNavigation(onChangeProfile, copy.profileError);
  }, [onChangeProfile, runNavigation]);

  const runSource = useCallback(
    async (source: ImageSource, available: boolean, callback: () => void | Promise<void>) => {
      if (!available || locked || sourceInFlightRef.current || navigationInFlightRef.current) return;
      sourceInFlightRef.current = true;
      setToastMessage(null);
      setActiveSource(source);
      try {
        await callback();
      } catch {
        if (mountedRef.current) setToastMessage(copy.sourceError);
      } finally {
        sourceInFlightRef.current = false;
        if (mountedRef.current) setActiveSource(null);
      }
    },
    [locked],
  );

  const handleChooseCamera = useCallback(() => {
    // Route to CameraCaptureScreen. That screen owns any explicit camera-permission request.
    void runSource("camera", isCameraAvailable, onChooseCamera);
  }, [isCameraAvailable, onChooseCamera, runSource]);

  const handleChooseUpload = useCallback(() => {
    // Ask the host to open its native picker, then route the selected image to SelectedImageReviewScreen.
    void runSource("upload", isUploadAvailable, onChooseUpload);
  }, [isUploadAvailable, onChooseUpload, runSource]);

  const activeProfileCard = useMemo(
    () => (
      <ActiveProfileCard
        disabled={locked}
        profileName={profileName}
        onChangeProfile={onChangeProfile ? handleChangeProfile : undefined}
      />
    ),
    [handleChangeProfile, locked, onChangeProfile, profileName],
  );

  return (
    <AppShell>
      <DesktopAside />
      <SourceSelectionContent>
        <SourceTopBar disabled={locked} onBack={handleBack} />
        {activeProfileCard}
        <SourceIllustration />
        <h1 className="mt-3.5 max-w-[360px] font-[family-name:var(--dl-display)] text-[33px] font-normal leading-[37px] text-[var(--dl-text-primary)] min-[375px]:mt-[18px] min-[375px]:text-4xl min-[375px]:leading-10">
          {copy.heading}
        </h1>
        <p className="mt-2 max-w-[380px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)] min-[375px]:mt-2.5">
          {copy.supporting}
        </p>
        {isOffline ? <OfflineBanner /> : null}
        {noSourcesAvailable ? <NoSourcesAvailableAlert /> : null}
        <SourceCards
          activeSource={activeSource}
          disabled={locked}
          isCameraAvailable={isCameraAvailable}
          isUploadAvailable={isUploadAvailable}
          onChooseCamera={handleChooseCamera}
          onChooseUpload={handleChooseUpload}
        />
        <PhotoTipsCard />
        <ReviewNote />
      </SourceSelectionContent>
      <ToastRegion message={toastMessage} />
    </AppShell>
  );
}
