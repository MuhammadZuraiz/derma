import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export interface FacialDataConsentRecord {
  facialAnalysisConsent: true;
  consentVersion: string;
  privacyNoticeVersion: string;
  acceptedAtClient: string;
}

export interface PrivacyAndFacialDataConsentScreenProps {
  isOffline?: boolean;
  isSubmitting?: boolean;
  consentVersion: string;
  privacyNoticeVersion: string;
  onBack: () => void | Promise<void>;
  onAcceptConsent: (
    record: FacialDataConsentRecord,
  ) => void | Promise<void>;
  onDeclineConsent: () => void | Promise<void>;
  onOpenPrivacyNotice: () => void | Promise<void>;
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

export const copy = {
  contextLabel: "BEFORE YOUR FIRST SCAN",
  heading: "Before we analyse your skin",
  supporting:
    "Your facial image and the skin-analysis data created from it are sensitive. Please review how DermaLens uses them before you continue.",

  offline:
    "You appear to be offline. Your choice can be saved on this device, but cloud sync and some analysis features may be unavailable.",

  summaryPurposeTitle: "Used for your skincare guidance",
  summaryPurposeBody:
    "Your image and derived skin-analysis data are used to analyse visible concerns and personalise recommendations.",

  summaryLocalTitle: "Starts on this device",
  summaryLocalBody:
    "Your profile is local-first. Optional cloud-account sync can be enabled later.",

  summaryControlTitle: "You remain in control",
  summaryControlBody:
    "You can revoke consent and request deletion of saved facial data from Settings.",

  guidanceBoundary:
    "DermaLens provides skincare guidance, not a medical diagnosis.",

  protectionHeading: "How your data is protected",
  protectionIntro:
    "Expand to learn more about processing, protection, and your choices.",

  protectionDeviceTitle: "Processing is minimised",
  protectionDeviceBody:
    "DermaLens uses on-device processing where technically feasible to minimise unnecessary transfer of raw facial images.",

  protectionStorageTitle: "Protected during transfer and storage",
  protectionStorageBody:
    "Facial images and derived skin-analysis data are protected when transferred and stored.",

  protectionPurposeTitle: "No unrelated use",
  protectionPurposeBody:
    "Your facial data is used only for skin analysis and personalisation. It is not used for unrelated purposes.",

  protectionDeletionTitle: "Consent can be revoked",
  protectionDeletionBody:
    "You can revoke consent and request deletion of saved facial data from Settings.",

  privacyNotice: "Read the full Privacy Notice",

  consentLabel:
    "I agree to DermaLens processing my facial image and skin-analysis data to provide personalised skincare guidance.",

  accept: "Agree and continue",
  submitting: "Saving your choice…",
  decline: "Not now",

  submitError: "We could not save your choice. Please try again.",
  privacyNoticeError:
    "The Privacy Notice could not be opened. Please try again.",
  backError: "We could not return to the previous screen. Please try again.",
  declineError:
    "We could not return to the previous screen. Please try again.",
} as const;

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

type IconProps = {
  className?: string;
};

type SummaryRow = {
  icon: ReactNode;
  title: string;
  body: string;
};

type ProtectionItem = {
  title: string;
  body: string;
};

type AppShellProps = {
  children: ReactNode;
};

type ConsentTopBarProps = {
  disabled: boolean;
  onBack: () => void;
};

type PrivacySummaryRowProps = SummaryRow;

type ConsentCheckboxProps = {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
};

type ConsentFooterProps = {
  consentChecked: boolean;
  isSubmitting: boolean;
  submissionError: string | null;
  onConsentChange: (checked: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
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
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
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

function ShieldApertureIcon({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 48 48"
    >
      <path
        d="M24 4.8 38.2 10v10.6c0 9.2-5.8 17.5-14.2 22.6-8.4-5.1-14.2-13.4-14.2-22.6V10L24 4.8Z"
        stroke="var(--dl-bark)"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <circle cx="24" cy="23" r="8.2" stroke="var(--dl-peach-strong)" strokeWidth="2" />
      <path
        d="m20.2 15.8 7.7 1.3 4 6.8-3.7 7-7.7 1.3-4-6.7 3.7-9.7Z"
        stroke="var(--dl-peach-strong)"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <circle cx="24" cy="23" r="2.2" fill="var(--dl-peach-strong)" />
    </svg>
  );
}

function ScanIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3m18 0v3a2 2 0 0 1-2 2h-3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
    </svg>
  );
}

function DeviceIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <rect
        height="18"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        width="12"
        x="6"
        y="3"
      />
      <path d="M10 18h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function ControlsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M4 6h6m4 0h6M4 12h10m4 0h2M4 18h3m4 0h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="12" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="18" r="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function InformationIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 10v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="12" cy="7.2" r="1" fill="currentColor" />
    </svg>
  );
}

function WarningIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="m12 3 9 16H3l9-16Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M12 9v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SpinnerIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function PrivacyIllustration({ large = false }: { large?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={
        large
          ? "relative flex h-[292px] w-[292px] items-center justify-center rounded-full bg-[var(--dl-blush)]"
          : "flex h-16 w-16 items-center justify-center rounded-full bg-[var(--dl-blush)] max-[374px]:h-14 max-[374px]:w-14"
      }
    >
      {large ? (
        <>
          <div className="absolute inset-[22px] rounded-full border border-[var(--dl-blush-strong)]" />
          <div className="absolute inset-[47px] rounded-full border border-[var(--dl-peach)]/70" />
          <div className="absolute inset-[74px] rounded-full border border-[var(--dl-border-subtle)]" />
          <ShieldApertureIcon className="h-[132px] w-[132px]" />
        </>
      ) : (
        <ShieldApertureIcon className="h-10 w-10 max-[374px]:h-9 max-[374px]:w-9" />
      )}
    </div>
  );
}

function DesktopTrustVisual() {
  return (
    <aside
      aria-label="DermaLens privacy commitment"
      className="hidden min-h-0 flex-col justify-center lg:flex"
    >
      <PrivacyIllustration large />
      <p className="mt-8 max-w-[330px] font-[family-name:var(--dl-display)] text-[36px] leading-[42px] text-[var(--dl-text-primary)]">
        Your skin data deserves thoughtful protection.
      </p>
      <div className="mt-5 h-px w-20 bg-[var(--dl-peach-strong)]" />
    </aside>
  );
}

function AppShell({ children }: AppShellProps) {
  return (
    <main
      className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]"
      style={rootStyle}
    >
      <div className="mx-auto grid h-[100dvh] max-w-[520px] grid-cols-1 lg:max-w-[1040px] lg:grid-cols-[42fr_58fr] lg:gap-16">
        <DesktopTrustVisual />
        <section className="flex min-h-0 min-w-0 flex-col">{children}</section>
      </div>
    </main>
  );
}

function BackButton({
  disabled,
  onBack,
}: {
  disabled: boolean;
  onBack: () => void;
}) {
  return (
    <button
      aria-label="Go back"
      className={`${focusRing} -ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] active:bg-[var(--dl-parchment)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`}
      disabled={disabled}
      onClick={onBack}
      type="button"
    >
      <ArrowLeftIcon />
    </button>
  );
}

function ConsentTopBar({ disabled, onBack }: ConsentTopBarProps) {
  return (
    <header className="flex min-h-12 items-center justify-between gap-3">
      <BackButton disabled={disabled} onBack={onBack} />
      <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-text-secondary)]">
        {copy.contextLabel}
      </p>
    </header>
  );
}

function OfflineBanner() {
  return (
    <div
      className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-[var(--dl-warning-text)]"
      role="status"
    >
      <WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm leading-5">{copy.offline}</p>
    </div>
  );
}

function PrivacySummaryRow({ icon, title, body }: PrivacySummaryRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5 md:py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--dl-blush)] text-[var(--dl-peach-strong)]">
        {icon}
      </div>
      <div>
        <h2 className="text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">
          {title}
        </h2>
        <p className="mt-0.5 text-sm leading-5 text-[var(--dl-text-secondary)]">
          {body}
        </p>
      </div>
    </div>
  );
}

function PrivacySummaryCard() {
  const rows: SummaryRow[] = [
    {
      icon: <ScanIcon />,
      title: copy.summaryPurposeTitle,
      body: copy.summaryPurposeBody,
    },
    {
      icon: <DeviceIcon />,
      title: copy.summaryLocalTitle,
      body: copy.summaryLocalBody,
    },
    {
      icon: <ControlsIcon />,
      title: copy.summaryControlTitle,
      body: copy.summaryControlBody,
    },
  ];

  return (
    <section
      aria-label="Facial-data consent summary"
      className="mt-5 divide-y divide-[var(--dl-border-subtle)] rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-1.5 max-[374px]:mt-4 max-[374px]:px-3 max-[374px]:py-1"
      id="facial-data-consent-explanation"
    >
      {rows.map((row) => (
        <PrivacySummaryRow key={row.title} {...row} />
      ))}
    </section>
  );
}

function GuidanceBoundaryNote() {
  return (
    <div
      className="mt-3.5 flex items-start gap-2 rounded-xl bg-[var(--dl-surface-soft)] p-3 text-[var(--dl-text-secondary)] max-[374px]:mt-3"
      id="facial-data-guidance-boundary"
    >
      <InformationIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--dl-peach-strong)]" />
      <p className="text-sm leading-5">{copy.guidanceBoundary}</p>
    </div>
  );
}

function ProtectionDetailRow({ title, body }: ProtectionItem) {
  return (
    <div>
      <h3 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">
        {title}
      </h3>
      <p className="mt-0.5 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {body}
      </p>
    </div>
  );
}

function ProtectionDetailsAccordion() {
  const details: ProtectionItem[] = [
    {
      title: copy.protectionDeviceTitle,
      body: copy.protectionDeviceBody,
    },
    {
      title: copy.protectionStorageTitle,
      body: copy.protectionStorageBody,
    },
    {
      title: copy.protectionPurposeTitle,
      body: copy.protectionPurposeBody,
    },
    {
      title: copy.protectionDeletionTitle,
      body: copy.protectionDeletionBody,
    },
  ];

  return (
    <details className="group mt-5 border-y border-[var(--dl-border-subtle)]">
      <summary className={`${focusRing} flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 rounded-sm py-2.5 text-left [&::-webkit-details-marker]:hidden`}>
        <span>
          <span className="block text-[15px] font-semibold leading-[21px] text-[var(--dl-bark)]">
            {copy.protectionHeading}
          </span>
          <span className="mt-0.5 block text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
            {copy.protectionIntro}
          </span>
        </span>
        <ChevronDownIcon className="h-[18px] w-[18px] shrink-0 text-[var(--dl-dusk)] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="space-y-3 pb-4 pt-2">
        {details.map((detail) => (
          <ProtectionDetailRow key={detail.title} {...detail} />
        ))}
      </div>
    </details>
  );
}

function PrivacyNoticeLink({
  disabled,
  onOpen,
}: {
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      className={`${focusRing} mt-2 flex min-h-11 items-center rounded-sm text-left text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
      disabled={disabled}
      onClick={onOpen}
      type="button"
    >
      {copy.privacyNotice}
    </button>
  );
}

function ConsentContent({
  isOffline,
  isSubmitting,
  onBack,
  onOpenPrivacyNotice,
}: {
  isOffline: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onOpenPrivacyNotice: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-[max(20px,env(safe-area-inset-top))] max-[374px]:px-5 lg:px-0 lg:pb-8 lg:pt-8">
      <ConsentTopBar disabled={isSubmitting} onBack={onBack} />
      <div className="mt-5 lg:hidden">
        <PrivacyIllustration />
      </div>
      <h1 className="mt-5 max-w-[340px] font-[family-name:var(--dl-display)] text-[36px] font-normal leading-10 text-[var(--dl-text-primary)] max-[374px]:mt-4 max-[374px]:text-[33px] max-[374px]:leading-[37px] lg:mt-5 lg:text-[38px] lg:leading-[43px]">
        {copy.heading}
      </h1>
      <p className="mt-3 max-w-[440px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
        {copy.supporting}
      </p>
      {isOffline ? <OfflineBanner /> : null}
      <PrivacySummaryCard />
      <GuidanceBoundaryNote />
      <ProtectionDetailsAccordion />
      <PrivacyNoticeLink disabled={isSubmitting} onOpen={onOpenPrivacyNotice} />
    </div>
  );
}

function ConsentCheckbox({
  checked,
  disabled,
  onChange,
}: ConsentCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm leading-5 text-[var(--dl-text-primary)]">
      <span className="flex h-11 w-11 shrink-0 items-start justify-center pt-1">
        <input
          aria-describedby="facial-data-consent-explanation facial-data-guidance-boundary"
          checked={checked}
          className={`${focusRing} h-5 w-5 cursor-pointer accent-[var(--dl-bark)] disabled:cursor-not-allowed`}
          disabled={disabled}
          id="facial-data-consent"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
      </span>
      <span className="pt-0.5">{copy.consentLabel}</span>
    </label>
  );
}

function SubmissionError({ message }: { message: string }) {
  return (
    <p
      className="mt-2.5 rounded-[10px] bg-[var(--dl-error-surface)] p-2.5 text-sm leading-5 text-[var(--dl-error-text)]"
      role="alert"
    >
      {message}
    </p>
  );
}

function PrimaryButton({
  disabled,
  isSubmitting,
  onClick,
}: {
  disabled: boolean;
  isSubmitting: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${focusRing} mt-3.5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] motion-reduce:transition-none`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {isSubmitting ? (
        <SpinnerIcon className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" />
      ) : null}
      <span aria-live="polite">{isSubmitting ? copy.submitting : copy.accept}</span>
    </button>
  );
}

function DeclineButton({
  disabled,
  onDecline,
}: {
  disabled: boolean;
  onDecline: () => void;
}) {
  return (
    <button
      className={`${focusRing} mt-2 flex min-h-11 w-full items-center justify-center rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
      disabled={disabled}
      onClick={onDecline}
      type="button"
    >
      {copy.decline}
    </button>
  );
}

function ConsentFooter({
  consentChecked,
  isSubmitting,
  submissionError,
  onConsentChange,
  onAccept,
  onDecline,
}: ConsentFooterProps) {
  return (
    <footer className="sticky bottom-0 z-10 shrink-0 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-[8px] max-[374px]:px-5 lg:px-0">
      <ConsentCheckbox
        checked={consentChecked}
        disabled={isSubmitting}
        onChange={onConsentChange}
      />
      {submissionError ? <SubmissionError message={submissionError} /> : null}
      <PrimaryButton
        disabled={!consentChecked || isSubmitting}
        isSubmitting={isSubmitting}
        onClick={onAccept}
      />
      <DeclineButton disabled={isSubmitting} onDecline={onDecline} />
    </footer>
  );
}

function ToastRegion({ message }: ToastRegionProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed bottom-[calc(max(20px,env(safe-area-inset-bottom))+188px)] left-1/2 z-30 w-[calc(100%-48px)] max-w-[520px] -translate-x-1/2 max-[374px]:w-[calc(100%-40px)] lg:bottom-6"
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

export default function PrivacyAndFacialDataConsentScreen({
  isOffline = false,
  isSubmitting = false,
  consentVersion,
  privacyNoticeVersion,
  onBack,
  onAcceptConsent,
  onDeclineConsent,
  onOpenPrivacyNotice,
}: PrivacyAndFacialDataConsentScreenProps) {
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmittingLocally, setIsSubmittingLocally] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mountedRef = useRef(false);
  const acceptanceInFlightRef = useRef(false);
  const submitting = isSubmitting || isSubmittingLocally;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      if (mountedRef.current) setToastMessage(null);
    }, 5_000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const clearToast = useCallback(() => {
    if (mountedRef.current) setToastMessage(null);
  }, []);

  const showToast = useCallback((message: string) => {
    if (mountedRef.current) setToastMessage(message);
  }, []);

  const handleBack = useCallback(async () => {
    if (submitting) return;

    clearToast();

    try {
      // Analytics hook: track consent-screen back navigation here.
      // Route hook: return to WelcomeScreen here.
      await onBack();
    } catch {
      showToast(copy.backError);
    }
  }, [clearToast, onBack, showToast, submitting]);

  const handleOpenPrivacyNotice = useCallback(async () => {
    if (submitting) return;

    clearToast();

    try {
      // Analytics hook: track Privacy Notice opens here.
      // Route or modal hook: open the host application's Privacy Notice here.
      await onOpenPrivacyNotice();
    } catch {
      showToast(copy.privacyNoticeError);
    }
  }, [clearToast, onOpenPrivacyNotice, showToast, submitting]);

  const handleDeclineConsent = useCallback(async () => {
    if (submitting) return;

    clearToast();

    try {
      // Analytics hook: track a declined or postponed facial-data consent here.
      // Route hook: return to WelcomeScreen without saving consent here.
      await onDeclineConsent();
    } catch {
      showToast(copy.declineError);
    }
  }, [clearToast, onDeclineConsent, showToast, submitting]);

  const handleConsentChange = useCallback((checked: boolean) => {
    setConsentChecked(checked);
    setSubmissionError(null);
  }, []);

  const handleAcceptConsent = useCallback(async () => {
    if (!consentChecked || submitting || acceptanceInFlightRef.current) return;

    acceptanceInFlightRef.current = true;
    setSubmissionError(null);
    setIsSubmittingLocally(true);

    const record: FacialDataConsentRecord = {
      facialAnalysisConsent: true,
      consentVersion,
      privacyNoticeVersion,
      acceptedAtClient: new Date().toISOString(),
    };

    // The backend should store a canonical server-side timestamp
    // and the submitted consent and Privacy Notice versions
    // for the auditable consent record.

    try {
      // Analytics hook: track completed facial-data consent here.
      // Route hook: navigate to ProfileSetupScreen after the host persists consent.
      await onAcceptConsent(record);
    } catch {
      if (mountedRef.current) setSubmissionError(copy.submitError);
    } finally {
      acceptanceInFlightRef.current = false;
      if (mountedRef.current) setIsSubmittingLocally(false);
    }
  }, [consentChecked, consentVersion, onAcceptConsent, privacyNoticeVersion, submitting]);

  return (
    <AppShell>
      <ConsentContent
        isOffline={isOffline}
        isSubmitting={submitting}
        onBack={() => void handleBack()}
        onOpenPrivacyNotice={() => void handleOpenPrivacyNotice()}
      />
      <ConsentFooter
        consentChecked={consentChecked}
        isSubmitting={submitting}
        onAccept={() => void handleAcceptConsent()}
        onConsentChange={handleConsentChange}
        onDecline={() => void handleDeclineConsent()}
        submissionError={submissionError}
      />
      <ToastRegion message={toastMessage} />
    </AppShell>
  );
}
