import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

/**
 * DermaLens Welcome Screen
 *
 * Font loading should be handled once at the application shell level:
 * - Display: "DM Serif Display"
 * - UI/body: "DM Sans"
 * - Metadata: "Space Mono"
 */

export interface WelcomeScreenProps {
  isOffline?: boolean;
  isPreparing?: boolean;
  isGuestScannerAvailableOffline?: boolean;
  onStartAnalysis: () => void | Promise<void>;
  onSignIn: () => void | Promise<void>;
  onOpenGuestScanner: () => void | Promise<void>;
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

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "20px",
  xl: "28px",
  pill: "999px",
} as const;

export const copy = {
  eyebrow: "PERSONALISED SKINCARE GUIDANCE",
  heading: "Your skin, finally understood.",
  supporting:
    "Analyse visible skin concerns, build a personalised routine, and check product ingredients with clearer guidance.",
  trustPrivate: "Private by design",
  trustBoundary: "Skincare guidance, not a medical diagnosis",
  startAnalysis: "Start my skin analysis",
  preparing: "Preparing your privacy settings…",
  signInPrefix: "Already have an account?",
  signInAction: "Sign in",
  scannerTitle: "Checking a product?",
  scannerDescription: "Scan ingredients without creating a profile.",
  privacyLink: "How your skin data is protected",
  disclaimer:
    "DermaLens provides skincare guidance and does not replace medical advice.",
  offline:
    "You appear to be offline. Some analysis and account features may be unavailable.",
  signInUnavailable:
    "Sign-in is temporarily unavailable. You can still continue with a local profile.",
  startAnalysisUnavailable: "We could not continue. Please try again.",
  scannerOffline: "Connect to the internet to scan ingredients.",
  scannerUnavailable:
    "Ingredient scanning is temporarily unavailable. Please try again.",
  privacyTitle: "How your skin data is protected",
  privacyIntro:
    "Before facial analysis begins, DermaLens will ask for your permission and explain how your image is processed.",
  privacyConsent: "Clear consent before facial analysis",
  privacyLocalFirst: "Local-first profile with optional cloud-account sync",
  privacyControl: "Control and delete saved skin data from settings",
  privacyClosing:
    "Your selected privacy settings determine how your profile data is stored and synced.",
  privacyClose: "Got it",
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

function IconBase({
  children,
  className = "h-5 w-5",
  viewBox = "0 0 24 24",
}: {
  children: ReactNode;
  className?: string;
  viewBox?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path
        d="M12 3.4 19 6v5.35c0 4.22-2.52 7.75-7 9.25-4.48-1.5-7-5.03-7-9.25V6l7-2.6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m9.1 12 1.9 1.9 4-4.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </IconBase>
  );
}

function InformationIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 10.7v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="12" cy="7.8" fill="currentColor" r="1" />
    </IconBase>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path
        d="M10.55 4.6a1.67 1.67 0 0 1 2.9 0l7 12.35a1.67 1.67 0 0 1-1.45 2.49H5a1.67 1.67 0 0 1-1.45-2.5l7-12.34Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M12 9v4.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="12" cy="16.5" fill="currentColor" r=".95" />
    </IconBase>
  );
}

function BarcodeIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M4 5v14M7 5v14M10 5v14M14 5v14M17 5v14M20 5v14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <path d="M3 8V5h3M18 5h3v3M21 16v3h-3M6 19H3v-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </IconBase>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="m9 5.5 6.5 6.5L9 18.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </IconBase>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="m6.5 6.5 11 11m0-11-11 11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  );
}

function ConsentIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M7 3.75h7.2L18 7.55V20H7V3.75Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M14 3.9v4h3.8" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="m9.4 14 1.65 1.65 3.65-3.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </IconBase>
  );
}

function DeviceSyncIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect height="14.5" rx="2" stroke="currentColor" strokeWidth="1.6" width="10.5" x="3.75" y="4.75" />
      <path d="M7.35 16.5h3.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <path d="M16.15 8.1a3.15 3.15 0 0 1 3.8 3.08M19.95 11.18l-1.18-1.2m1.18 1.2 1.1-1.2M19.85 15.85a3.15 3.15 0 0 1-3.8-3.08M16.05 12.77l1.18 1.2m-1.18-1.2-1.1 1.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </IconBase>
  );
}

function ControlIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <circle cx="9" cy="7" fill="var(--dl-blush)" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="12" fill="var(--dl-blush)" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="17" fill="var(--dl-blush)" r="2" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-30" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-95" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-9 w-9 shrink-0"
      fill="none"
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="18" cy="18" r="15.25" stroke="var(--dl-bark)" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="10.35" stroke="var(--dl-peach)" strokeWidth="1.35" />
      <circle cx="18" cy="18" fill="var(--dl-peach-strong)" r="3.15" />
      <path d="M18 7.65c2.8 1.4 4.43 3.46 4.88 6.18" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M28.35 18c-1.4 2.8-3.46 4.43-6.18 4.88" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M18 28.35c-2.8-1.4-4.43-3.46-4.88-6.18" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M7.65 18c1.4-2.8 3.46-4.43 6.18-4.88" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function BrandWordmark() {
  return (
    <div aria-label="DermaLens" className="flex items-baseline text-[25px] leading-none" style={{ fontFamily: fonts.ui }}>
      <span className="font-semibold tracking-[-0.045em] text-[var(--dl-text-primary)]">Derma</span>
      <span
        className="ml-[1px] italic tracking-[-0.035em] text-[var(--dl-peach-strong)]"
        style={{ fontFamily: fonts.display }}
      >
        Lens
      </span>
    </div>
  );
}

function BrandHeader() {
  return (
    <header className="dermalens-brand flex items-center gap-[10px]">
      <BrandMark />
      <BrandWordmark />
    </header>
  );
}

function WelcomeHeroIllustration() {
  return (
    <div
      aria-hidden="true"
      className="dermalens-illustration relative mt-6 h-[144px] w-full overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--dl-blush)_0%,var(--dl-surface-soft)_100%)] max-[374px]:h-[128px] md:h-[220px] lg:mt-0 lg:min-h-[580px]"
    >
      <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M-32 531C92 423 126 309 103 188 79 62 149-3 271-22"
          stroke="var(--dl-peach-strong)"
          strokeOpacity=".19"
          strokeWidth="54"
        />
        <path
          d="M499 686c-86-93-118-187-95-282 21-88 83-157 186-205"
          stroke="var(--dl-bark)"
          strokeOpacity=".085"
          strokeWidth="66"
        />
        <path
          d="M-30 344c132 19 238-27 314-138C352 107 447 62 669 70"
          stroke="var(--dl-surface)"
          strokeOpacity=".42"
          strokeWidth="28"
        />
      </svg>

      <div className="absolute left-[37%] top-1/2 h-[240px] w-[240px] -translate-y-1/2 max-[374px]:h-[204px] max-[374px]:w-[204px] sm:left-[43%] lg:left-1/2 lg:h-[580px] lg:w-[580px] lg:-translate-x-[8%]">
        <svg
          className="dermalens-breathe h-full w-full"
          fill="none"
          viewBox="0 0 420 420"
          xmlns="http://www.w3.org/2000/svg"
        >
        <circle cx="210" cy="210" r="155" stroke="var(--dl-bark)" strokeOpacity=".12" strokeWidth="2" />
        <circle cx="210" cy="210" r="120" stroke="var(--dl-peach-strong)" strokeOpacity=".42" strokeWidth="2" />
        <circle cx="210" cy="210" r="77" stroke="var(--dl-bark)" strokeOpacity=".2" strokeWidth="2" />
        <circle cx="210" cy="210" fill="var(--dl-blush-strong)" fillOpacity=".54" r="39" />
        <circle cx="210" cy="210" fill="var(--dl-peach-strong)" fillOpacity=".78" r="17" />
        <path d="M210 55c40 16 68 42 83 79" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeOpacity=".58" strokeWidth="8" />
        <path d="M365 210c-16 40-42 68-79 83" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeOpacity=".58" strokeWidth="8" />
        <path d="M210 365c-40-16-68-42-83-79" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeOpacity=".58" strokeWidth="8" />
        <path d="M55 210c16-40 42-68 79-83" stroke="var(--dl-peach-strong)" strokeLinecap="round" strokeOpacity=".58" strokeWidth="8" />
        <path d="M108 94c38 2 72 16 101 43" stroke="var(--dl-bark)" strokeLinecap="round" strokeOpacity=".13" strokeWidth="14" />
        <path d="M326 108c-2 38-16 72-43 101" stroke="var(--dl-bark)" strokeLinecap="round" strokeOpacity=".13" strokeWidth="14" />
        <path d="M312 326c-38-2-72-16-101-43" stroke="var(--dl-bark)" strokeLinecap="round" strokeOpacity=".13" strokeWidth="14" />
        <path d="M94 312c2-38 16-72 43-101" stroke="var(--dl-bark)" strokeLinecap="round" strokeOpacity=".13" strokeWidth="14" />
        </svg>
      </div>
    </div>
  );
}

function Eyebrow() {
  return (
    <p
      className="flex items-center gap-2 text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-bark)]"
      style={{ fontFamily: fonts.metadata }}
    >
      <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-[var(--dl-peach-strong)]" />
      <span>{copy.eyebrow}</span>
    </p>
  );
}

function HeroHeading() {
  return (
    <h1
      className="mt-[10px] max-w-[340px] text-[42px] font-normal leading-[46px] tracking-[-0.025em] text-[var(--dl-text-primary)] max-[374px]:text-[38px] max-[374px]:leading-[42px]"
      id="dermalens-welcome-heading"
      style={{ fontFamily: fonts.display }}
    >
      {copy.heading}
    </h1>
  );
}

function SupportingCopy() {
  return (
    <p className="mt-[14px] max-w-[360px] text-base leading-6 text-[var(--dl-text-secondary)]">
      {copy.supporting}
    </p>
  );
}

function WelcomeMessage() {
  return (
    <section className="dermalens-message mt-5" aria-labelledby="dermalens-welcome-heading">
      <Eyebrow />
      <HeroHeading />
      <SupportingCopy />
    </section>
  );
}

function TrustItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
      <span className="shrink-0 text-[var(--dl-peach-strong)]">{icon}</span>
      <span>{text}</span>
    </li>
  );
}

function TrustList() {
  return (
    <ul className="dermalens-trust mt-4 flex flex-col gap-2" aria-label="DermaLens trust information">
      <TrustItem icon={<ShieldIcon className="h-5 w-5" />} text={copy.trustPrivate} />
      <TrustItem icon={<InformationIcon className="h-5 w-5" />} text={copy.trustBoundary} />
    </ul>
  );
}

function FlexibleSpacer() {
  return <div aria-hidden="true" className="dermalens-spacer min-h-4 flex-1" />;
}

function OfflineBanner() {
  return (
    <div
      className="dermalens-offline mb-4 flex gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]"
      role="status"
    >
      <WarningIcon className="mt-px h-5 w-5 shrink-0" />
      <p>{copy.offline}</p>
    </div>
  );
}

function PrimaryButton({
  isPreparing,
  onClick,
}: {
  isPreparing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-busy={isPreparing}
      className={`${focusRing} flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-6 py-3 text-center text-base font-semibold leading-5 text-white shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:opacity-80 motion-reduce:transition-none`}
      disabled={isPreparing}
      onClick={onClick}
      type="button"
    >
      {isPreparing ? <Spinner /> : null}
      <span aria-live="polite">{isPreparing ? copy.preparing : copy.startAnalysis}</span>
    </button>
  );
}

function SignInPrompt({ onSignIn }: { onSignIn: () => void }) {
  return (
    <p className="mt-3 text-center text-sm leading-5 text-[var(--dl-text-secondary)]">
      {copy.signInPrefix}{" "}
      <button
        className={`${focusRing} -my-3 inline-flex min-h-11 items-center rounded-sm py-3 font-semibold text-[var(--dl-bark)] hover:underline`}
        onClick={onSignIn}
        type="button"
      >
        {copy.signInAction}
      </button>
    </p>
  );
}

function WelcomeActions({
  isPreparing,
  onStartAnalysis,
  onSignIn,
}: {
  isPreparing: boolean;
  onStartAnalysis: () => void;
  onSignIn: () => void;
}) {
  return (
    <div className="dermalens-actions">
      <PrimaryButton isPreparing={isPreparing} onClick={onStartAnalysis} />
      <SignInPrompt onSignIn={onSignIn} />
    </div>
  );
}

function GuestScannerCard({
  isUnavailableOffline,
  onOpenGuestScanner,
}: {
  isUnavailableOffline: boolean;
  onOpenGuestScanner: () => void;
}) {
  const helperText = isUnavailableOffline ? copy.scannerOffline : copy.scannerDescription;

  return (
    <button
      aria-disabled={isUnavailableOffline || undefined}
      className={`${focusRing} dermalens-scanner mt-6 flex w-full items-center gap-3 rounded-[20px] border p-4 text-left transition-[background-color,border-color,transform] motion-reduce:transform-none motion-reduce:transition-none ${
        isUnavailableOffline
          ? "cursor-not-allowed border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)]"
          : "border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] hover:-translate-y-px hover:border-[var(--dl-sand)] hover:bg-[#FFFDFC] active:translate-y-0 active:bg-[var(--dl-surface-soft)]"
      }`}
      onClick={onOpenGuestScanner}
      type="button"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--dl-peach-strong)] ${
          isUnavailableOffline ? "bg-[var(--dl-parchment)]" : "bg-[var(--dl-blush)]"
        }`}
      >
        <BarcodeIcon className="h-[22px] w-[22px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-[22px] text-[var(--dl-text-primary)]">{copy.scannerTitle}</span>
        <span className="mt-0.5 block text-sm leading-5 text-[var(--dl-text-secondary)]">{helperText}</span>
      </span>
      <ChevronRightIcon className="h-[18px] w-[18px] shrink-0 text-[var(--dl-dusk)]" />
    </button>
  );
}

function PrivacyLink({
  triggerRef,
  onOpen,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
}) {
  return (
    <div className="dermalens-privacy-link mt-5 text-center">
      <button
        className={`${focusRing} inline-flex min-h-11 items-center rounded-sm py-3 text-sm font-semibold leading-5 text-[var(--dl-bark)] hover:underline`}
        onClick={onOpen}
        ref={triggerRef}
        type="button"
      >
        {copy.privacyLink}
      </button>
    </div>
  );
}

function DisclaimerText() {
  return (
    <p className="dermalens-disclaimer mx-auto mt-3 max-w-[340px] text-center text-xs leading-[18px] text-[var(--dl-text-secondary)]">
      {copy.disclaimer}
    </p>
  );
}

function AppShell({
  children,
  isDialogOpen,
}: {
  children: ReactNode;
  isDialogOpen: boolean;
}) {
  const shellRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    // React-compatible inert handling keeps the background application shell
    // out of the tab order and accessibility tree while the dialog is open.
    if (isDialogOpen) {
      shell.setAttribute("inert", "");
    } else {
      shell.removeAttribute("inert");
    }
  }, [isDialogOpen]);

  return (
    <main
      aria-hidden={isDialogOpen || undefined}
      className="min-h-[100dvh] overflow-x-hidden bg-[var(--dl-page)] text-[var(--dl-text-primary)]"
      ref={shellRef}
      style={{ ...themeStyle, fontFamily: fonts.ui }}
    >
      <div className="dermalens-shell mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col px-6 md:max-w-[540px] pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] max-[374px]:px-5 lg:min-h-[calc(100dvh-64px)] lg:max-w-[1120px] lg:px-0 lg:pb-8 lg:pt-8">
        {children}
      </div>
    </main>
  );
}

function PrivacyItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--dl-blush)] text-[var(--dl-peach-strong)]">
        {icon}
      </span>
      <span className="pt-2 text-sm font-medium leading-5 text-[var(--dl-text-primary)]">{children}</span>
    </li>
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

function PrivacySheet({
  isOpen,
  onClose,
  returnFocusRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusDialog = () => closeButtonRef.current?.focus();
    const animationFrame = window.requestAnimationFrame(focusDialog);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(58,46,40,0.34)] md:items-center md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="dermalens-sheet max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] bg-[var(--dl-surface)] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 shadow-[0_4px_20px_rgba(92,74,66,0.08)] outline-none md:max-h-[80vh] md:max-w-[520px] md:rounded-[28px] md:p-6"
        ref={dialogRef}
        role="dialog"
        style={{ ...themeStyle, fontFamily: fonts.ui }}
        tabIndex={-1}
      >
        <div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--dl-border-subtle)] md:hidden" />

        <div className="flex items-start justify-between gap-4">
          <h2
            className="max-w-[380px] text-[28px] font-normal leading-[34px] tracking-[-0.015em] text-[var(--dl-text-primary)]"
            id={titleId}
            style={{ fontFamily: fonts.display }}
          >
            {copy.privacyTitle}
          </h2>
          <button
            aria-label="Close privacy information"
            className={`${focusRing} -mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] motion-reduce:transition-none`}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.privacyIntro}</p>

        <ul className="mt-5 flex flex-col gap-3">
          <PrivacyItem icon={<ConsentIcon className="h-5 w-5" />}>{copy.privacyConsent}</PrivacyItem>
          <PrivacyItem icon={<DeviceSyncIcon className="h-5 w-5" />}>{copy.privacyLocalFirst}</PrivacyItem>
          <PrivacyItem icon={<ControlIcon className="h-5 w-5" />}>{copy.privacyControl}</PrivacyItem>
        </ul>

        <p className="mt-5 rounded-xl bg-[var(--dl-surface-soft)] p-3 text-sm leading-5 text-[var(--dl-text-secondary)]">
          {copy.privacyClosing}
        </p>

        <button
          className={`${focusRing} mt-5 flex h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] motion-reduce:transition-none`}
          onClick={onClose}
          type="button"
        >
          {copy.privacyClose}
        </button>
      </div>
    </div>
  );
}

function ToastRegion({ message }: { message: string | null }) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[max(24px,calc(env(safe-area-inset-bottom)+24px))] z-[60] flex justify-center"
      role="status"
      style={{ ...themeStyle, fontFamily: fonts.ui }}
    >
      {message ? (
        <div className="dermalens-toast max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-text-primary)] shadow-[0_4px_20px_rgba(92,74,66,0.08)]">
          {message}
        </div>
      ) : null}
    </div>
  );
}

export default function WelcomeScreen({
  isOffline = false,
  isPreparing = false,
  isGuestScannerAvailableOffline = false,
  onStartAnalysis,
  onSignIn,
  onOpenGuestScanner,
}: WelcomeScreenProps) {
  const [isPrivacySheetOpen, setIsPrivacySheetOpen] = useState(false);
  const [isStartRequested, setIsStartRequested] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const startRequestInFlightRef = useRef(false);
  const privacyTriggerRef = useRef<HTMLButtonElement>(null);

  const preparing = isPreparing || isStartRequested;
  const isGuestScannerUnavailableOffline =
    isOffline && !isGuestScannerAvailableOffline;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const handleStartAnalysis = async () => {
    if (preparing || startRequestInFlightRef.current) return;

    startRequestInFlightRef.current = true;
    setIsStartRequested(true);
    setToastMessage(null);

    // Analytics integration point: track the welcome-screen primary CTA activation.
    // Route integration point: navigate to PrivacyAndFacialDataConsentScreen.
    try {
      await onStartAnalysis();
    } catch {
      if (isMountedRef.current) {
        setToastMessage(copy.startAnalysisUnavailable);
      }
    } finally {
      startRequestInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsStartRequested(false);
      }
    }
  };

  const handleSignIn = async () => {
    setToastMessage(null);

    // Analytics integration point: track optional cloud-account sign-in activation.
    try {
      await onSignIn();
    } catch {
      if (isMountedRef.current) {
        setToastMessage(copy.signInUnavailable);
      }
    }
  };

  const handleOpenGuestScanner = async () => {
    setToastMessage(null);

    if (isGuestScannerUnavailableOffline) {
      setToastMessage(copy.scannerOffline);
      return;
    }

    // Analytics integration point: track guest-mode ingredient-scanner activation.
    // Route integration point: navigate to the guest ingredient scanner.
    try {
      await onOpenGuestScanner();
    } catch {
      if (isMountedRef.current) {
        setToastMessage(copy.scannerUnavailable);
      }
    }
  };

  return (
    <>
      <style>{`
        @keyframes dermalens-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: translateY(-1.4%) scale(1.025); }
        }

        @keyframes dermalens-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes dermalens-sheet-in {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dermalens-breathe {
          animation: dermalens-breathe 9s ease-in-out infinite;
          transform-origin: center;
        }

        .dermalens-toast {
          animation: dermalens-toast-in 180ms ease-out both;
        }

        .dermalens-sheet {
          animation: dermalens-sheet-in 180ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .dermalens-breathe,
          .dermalens-toast,
          .dermalens-sheet {
            animation: none !important;
          }
        }

        @media (min-width: 1024px) {
          .dermalens-shell {
            display: grid;
            grid-template-columns: minmax(0, 54fr) minmax(0, 46fr);
            grid-template-rows: auto auto auto minmax(28px, 1fr) auto auto auto auto auto;
            column-gap: 64px;
            align-items: start;
          }

          .dermalens-brand { grid-column: 2; grid-row: 1; }
          .dermalens-illustration { grid-column: 1; grid-row: 1 / span 9; }
          .dermalens-message { grid-column: 2; grid-row: 2; margin-top: 40px; }
          .dermalens-trust { grid-column: 2; grid-row: 3; }
          .dermalens-spacer { grid-column: 2; grid-row: 4; }
          .dermalens-offline { grid-column: 2; grid-row: 5; }
          .dermalens-actions { grid-column: 2; grid-row: 6; }
          .dermalens-scanner { grid-column: 2; grid-row: 7; }
          .dermalens-privacy-link { grid-column: 2; grid-row: 8; }
          .dermalens-disclaimer { grid-column: 2; grid-row: 9; }
        }
      `}</style>

      <AppShell isDialogOpen={isPrivacySheetOpen}>
        <BrandHeader />
        <WelcomeHeroIllustration />
        <WelcomeMessage />
        <TrustList />
        <FlexibleSpacer />
        {isOffline ? <OfflineBanner /> : null}
        <WelcomeActions
          isPreparing={preparing}
          onSignIn={handleSignIn}
          onStartAnalysis={handleStartAnalysis}
        />
        <GuestScannerCard
          isUnavailableOffline={isGuestScannerUnavailableOffline}
          onOpenGuestScanner={handleOpenGuestScanner}
        />
        <PrivacyLink onOpen={() => setIsPrivacySheetOpen(true)} triggerRef={privacyTriggerRef} />
        <DisclaimerText />
      </AppShell>

      <PrivacySheet
        isOpen={isPrivacySheetOpen}
        onClose={() => setIsPrivacySheetOpen(false)}
        returnFocusRef={privacyTriggerRef}
      />

      <ToastRegion message={toastMessage} />
    </>
  );
}
