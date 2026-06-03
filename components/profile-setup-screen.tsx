import {
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type AgeRange =
  | "prefer-not-to-say"
  | "under-18"
  | "18-24"
  | "25-34"
  | "35-44"
  | "45-54"
  | "55-plus";

export type SkincareFocus =
  | "understand-skin"
  | "build-routine"
  | "clearer-looking-skin"
  | "hydration-barrier"
  | "uneven-tone"
  | "visible-redness"
  | "texture-pores"
  | "not-sure";

export interface CountryOption {
  code: string;
  name: string;
}

export interface SkinProfileDraft {
  profileName: string;
  ageRange?: AgeRange;
  primaryFocus?: SkincareFocus;
  countryCode?: string;
  createdAtClient: string;
}

export interface ProfileSetupScreenProps {
  isOffline?: boolean;
  isSaving?: boolean;
  allowMinorProfiles?: boolean;
  initialValues?: Partial<
    Pick<
      SkinProfileDraft,
      "profileName" | "ageRange" | "primaryFocus" | "countryCode"
    >
  >;
  countries: CountryOption[];
  onBack: () => void | Promise<void>;
  onSaveProfile: (profile: SkinProfileDraft) => void | Promise<void>;
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
  contextLabel: "CREATE YOUR PROFILE",

  heading: "Who is this profile for?",
  supporting:
    "Use a first name or nickname. This keeps each person’s scans, routines, and recommendations separate.",

  sharedDevice:
    "Creating a profile for someone else? Each person should have their own profile.",

  nameLabel: "Profile name or nickname",
  namePlaceholder: "e.g. Amara",
  nameHelper:
    "This is stored with the local profile and can be changed later.",
  nameRequired: "Enter a profile name or nickname.",
  nameTooLong: "Use 40 characters or fewer.",

  optionalHeading: "Add details for better guidance",
  optionalHelper: "Optional · about 20 seconds",

  ageLabel: "Age range",
  ageHelper:
    "Optional. This may improve guidance without collecting your exact age or date of birth.",
  agePlaceholder: "Select an age range",
  agePreferNot: "Prefer not to say",
  ageUnder18: "Under 18",
  age18to24: "18–24",
  age25to34: "25–34",
  age35to44: "35–44",
  age45to54: "45–54",
  age55plus: "55+",

  minorNotice:
    "Profiles for users under 18 require an additional consent flow. This is not available in the current MVP.",

  focusLabel: "Primary skincare focus",
  focusHelper:
    "Optional. This helps prioritise the guidance shown after your scan.",
  focusPlaceholder: "Select a focus",
  focusUnderstand: "Understand my skin better",
  focusRoutine: "Build a simple routine",
  focusClearer: "Support clearer-looking skin",
  focusHydration: "Improve hydration and barrier care",
  focusTone: "Address uneven-looking tone",
  focusRedness: "Reduce the appearance of redness",
  focusTexture: "Improve texture and visible pores",
  focusNotSure: "I am not sure yet",

  countryLabel: "Country or region",
  countryHelper:
    "Optional. This helps prioritise products available near you.",
  countryPlaceholder: "Select a country or region",

  offline:
    "You appear to be offline. This profile can still be saved on this device. Cloud sync will remain unavailable until you reconnect.",

  save: "Save profile and continue",
  saving: "Saving profile…",
  back: "Back",

  saveError: "We could not save this profile. Please try again.",
  backError: "We could not return to the previous screen. Please try again.",
} as const;

type IconProps = {
  className?: string;
};

type AppShellProps = {
  children: ReactNode;
};

type ProfileTopBarProps = {
  disabled: boolean;
  onBack: () => void;
};

type NameFieldProps = {
  value: string;
  disabled: boolean;
  error: string | null;
  onBlur: () => void;
  onChange: (value: string) => void;
};

type SelectFieldProps = {
  id: string;
  name: string;
  label: string;
  helper: string;
  value: string;
  disabled: boolean;
  children: ReactNode;
  onChange: (value: string) => void;
};

type OptionalDetailsAccordionProps = {
  ageRange: AgeRange | "";
  primaryFocus: SkincareFocus | "";
  countryCode: string;
  countries: CountryOption[];
  disabled: boolean;
  showMinorNotice: boolean;
  onAgeRangeChange: (value: AgeRange | "") => void;
  onPrimaryFocusChange: (value: SkincareFocus | "") => void;
  onCountryCodeChange: (value: string) => void;
};

type ProfileFooterProps = {
  disabled: boolean;
  isSaving: boolean;
  saveError: string | null;
  onBack: () => void;
  onSave: () => void;
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

function InfoIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 10.7v5.7m0-9.1h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function WarningIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M10.2 4.8a2.08 2.08 0 0 1 3.6 0l7 12.1a2.08 2.08 0 0 1-1.8 3.12H5a2.08 2.08 0 0 1-1.8-3.12l7-12.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M12 9v4.4m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
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

function UserProfileIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 48 48"
    >
      <circle cx="24" cy="17" r="7" stroke="var(--dl-bark)" strokeWidth="2" />
      <path
        d="M10.5 39c1.5-7.1 6-11 13.5-11s12 3.9 13.5 11"
        stroke="var(--dl-bark)"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ApertureAccentIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8" fill="var(--dl-surface)" stroke="var(--dl-peach-strong)" strokeWidth="1.4" />
      <path
        d="m8.4 5.9 7.3 1.2 3.8 6.3-3.5 6.5-7.2 1.2-3.7-6.3 3.3-8.9Z"
        stroke="var(--dl-peach-strong)"
        strokeLinejoin="round"
        strokeWidth="1.1"
      />
      <circle cx="12" cy="12" r="2" fill="var(--dl-peach-strong)" />
    </svg>
  );
}

function ProfileIllustration({ large = false }: { large?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={
        large
          ? "relative flex h-56 w-56 items-center justify-center rounded-full bg-[var(--dl-blush)]"
          : "relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--dl-blush)] max-[374px]:h-16 max-[374px]:w-16"
      }
    >
      <UserProfileIcon className={large ? "h-28 w-28" : "h-11 w-11"} />
      <span
        className={
          large
            ? "absolute bottom-3 right-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--dl-surface)]"
            : "absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--dl-surface)]"
        }
      >
        <ApertureAccentIcon className={large ? "h-12 w-12" : "h-6 w-6"} />
      </span>
    </div>
  );
}

function AppShell({ children }: AppShellProps) {
  return (
    <main
      className="min-h-dvh bg-[var(--dl-page)] text-[var(--dl-text-primary)] font-[family-name:var(--dl-ui)]"
      style={rootStyle}
    >
      <div className="mx-auto min-h-dvh w-full max-w-[1040px] lg:grid lg:grid-cols-[42fr_58fr] lg:gap-16">
        <section className="hidden min-h-dvh flex-col justify-center lg:flex" aria-label="Profile setup introduction">
          <ProfileIllustration large />
          <p className="mt-8 max-w-[350px] font-[family-name:var(--dl-display)] text-[36px] leading-[42px] text-[var(--dl-text-primary)]">
            One profile keeps every scan personal.
          </p>
          <p className="mt-4 max-w-[340px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
            Add other profiles later for family members or shared devices.
          </p>
        </section>
        <section className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col md:max-w-[560px] lg:max-w-none" aria-label="Create profile">
          {children}
        </section>
      </div>
    </main>
  );
}

function BackIconButton({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
  return (
    <button
      aria-label="Go back"
      className={`${focusRing} flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`}
      disabled={disabled}
      type="button"
      onClick={onBack}
    >
      <ArrowLeftIcon />
    </button>
  );
}

function ProfileTopBar({ disabled, onBack }: ProfileTopBarProps) {
  return (
    <header className="flex min-h-12 items-center justify-between">
      <BackIconButton disabled={disabled} onBack={onBack} />
      <span className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-text-secondary)]">
        {copy.contextLabel}
      </span>
    </header>
  );
}

function ProfileContent({ children }: AppShellProps) {
  return <div className="flex flex-1 flex-col pb-0">{children}</div>;
}

function Heading() {
  return (
    <h1 className="mt-5 max-w-[340px] font-[family-name:var(--dl-display)] text-[36px] font-normal leading-10 text-[var(--dl-text-primary)] max-[374px]:mt-4 max-[374px]:text-[33px] max-[374px]:leading-[37px] lg:mt-6">
      {copy.heading}
    </h1>
  );
}

function SupportingCopy() {
  return (
    <p className="mt-2.5 max-w-[380px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
      {copy.supporting}
    </p>
  );
}

function FlexibleSpacer() {
  return <div className="min-h-4 flex-1" aria-hidden="true" />;
}

function SharedDeviceNote() {
  return (
    <aside className="mt-4 flex gap-2 rounded-xl bg-[var(--dl-surface-soft)] p-3 text-[14px] leading-5 text-[var(--dl-text-secondary)]">
      <InfoIcon className="h-5 w-5 shrink-0 text-[var(--dl-peach-strong)]" />
      <p>{copy.sharedDevice}</p>
    </aside>
  );
}

function OfflineBanner() {
  return (
    <aside
      className="mt-3 flex gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-[14px] leading-5 text-[var(--dl-warning-text)]"
      role="status"
    >
      <WarningIcon className="h-5 w-5 shrink-0" />
      <p>{copy.offline}</p>
    </aside>
  );
}

function NameField({ value, disabled, error, onBlur, onChange }: NameFieldProps) {
  const describedBy = error ? "profile-name-helper profile-name-error" : "profile-name-helper";

  return (
    <div className="mt-5">
      <label className="block text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]" htmlFor="profile-name">
        {copy.nameLabel}
      </label>
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : undefined}
        autoComplete="name"
        className={`${focusRing} mt-2 h-[52px] w-full rounded-xl border bg-[var(--dl-surface)] px-3.5 text-[16px] leading-6 text-[var(--dl-text-primary)] placeholder:text-[var(--dl-stone)] disabled:cursor-not-allowed disabled:bg-[var(--dl-surface-soft)] disabled:text-[var(--dl-text-secondary)] ${
          error ? "border-[var(--dl-error-text)]" : "border-[var(--dl-border-subtle)]"
        }`}
        disabled={disabled}
        id="profile-name"
        maxLength={40}
        name="profileName"
        placeholder={copy.namePlaceholder}
        required
        type="text"
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="mt-1.5 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]" id="profile-name-helper">
        {copy.nameHelper}
      </p>
      {error ? (
        <p className="mt-1.5 text-[14px] leading-5 text-[var(--dl-error-text)]" id="profile-name-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  helper,
  value,
  disabled,
  children,
  onChange,
}: SelectFieldProps) {
  const helperId = `${id}-helper`;

  return (
    <div>
      <label className="block text-[14px] font-semibold leading-5 text-[var(--dl-text-primary)]" htmlFor={id}>
        {label}
      </label>
      <select
        aria-describedby={helperId}
        className={`${focusRing} mt-2 h-[52px] w-full rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-3 text-[15px] leading-[22px] text-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-surface-soft)] disabled:text-[var(--dl-text-secondary)]`}
        disabled={disabled}
        id={id}
        name={name}
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      >
        {children}
      </select>
      <p className="mt-1.5 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]" id={helperId}>
        {helper}
      </p>
    </div>
  );
}

function MinorProfileNotice() {
  return (
    <p
      className="mt-2 rounded-[10px] bg-[var(--dl-warning-surface)] p-2.5 text-[14px] leading-5 text-[var(--dl-warning-text)]"
      role="alert"
    >
      {copy.minorNotice}
    </p>
  );
}

function OptionalDetailsAccordion({
  ageRange,
  primaryFocus,
  countryCode,
  countries,
  disabled,
  showMinorNotice,
  onAgeRangeChange,
  onPrimaryFocusChange,
  onCountryCodeChange,
}: OptionalDetailsAccordionProps) {
  return (
    <details className="group mt-5 border-y border-[var(--dl-border-subtle)]">
      <summary className={`${focusRing} flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-[var(--dl-bark)] marker:hidden [&::-webkit-details-marker]:hidden`}>
        <span>
          <span className="block text-[15px] font-semibold leading-[21px]">{copy.optionalHeading}</span>
          <span className="mt-0.5 block text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{copy.optionalHelper}</span>
        </span>
        <ChevronDownIcon className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
      </summary>

      <div className="space-y-4 pb-4 pt-1">
        <div>
          <SelectField
            disabled={disabled}
            helper={copy.ageHelper}
            id="age-range"
            label={copy.ageLabel}
            name="ageRange"
            value={ageRange}
            onChange={(value) => onAgeRangeChange(value as AgeRange | "")}
          >
            <option value="">{copy.agePlaceholder}</option>
            <option value="prefer-not-to-say">{copy.agePreferNot}</option>
            <option value="under-18">{copy.ageUnder18}</option>
            <option value="18-24">{copy.age18to24}</option>
            <option value="25-34">{copy.age25to34}</option>
            <option value="35-44">{copy.age35to44}</option>
            <option value="45-54">{copy.age45to54}</option>
            <option value="55-plus">{copy.age55plus}</option>
          </SelectField>
          {showMinorNotice ? <MinorProfileNotice /> : null}
        </div>

        <SelectField
          disabled={disabled}
          helper={copy.focusHelper}
          id="primary-focus"
          label={copy.focusLabel}
          name="primaryFocus"
          value={primaryFocus}
          onChange={(value) => onPrimaryFocusChange(value as SkincareFocus | "")}
        >
          <option value="">{copy.focusPlaceholder}</option>
          <option value="understand-skin">{copy.focusUnderstand}</option>
          <option value="build-routine">{copy.focusRoutine}</option>
          <option value="clearer-looking-skin">{copy.focusClearer}</option>
          <option value="hydration-barrier">{copy.focusHydration}</option>
          <option value="uneven-tone">{copy.focusTone}</option>
          <option value="visible-redness">{copy.focusRedness}</option>
          <option value="texture-pores">{copy.focusTexture}</option>
          <option value="not-sure">{copy.focusNotSure}</option>
        </SelectField>

        <SelectField
          disabled={disabled}
          helper={copy.countryHelper}
          id="country-code"
          label={copy.countryLabel}
          name="countryCode"
          value={countryCode}
          onChange={onCountryCodeChange}
        >
          <option value="">{copy.countryPlaceholder}</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </SelectField>
      </div>
    </details>
  );
}

function PrimaryButton({ disabled, isSaving, onSave }: { disabled: boolean; isSaving: boolean; onSave: () => void }) {
  return (
    <button
      className={`${focusRing} flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-center text-[16px] font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] motion-reduce:transition-none`}
      disabled={disabled}
      type="button"
      onClick={onSave}
    >
      <span aria-live="polite">{isSaving ? copy.saving : copy.save}</span>
    </button>
  );
}

function BackTextButton({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
  return (
    <button
      className={`${focusRing} mt-2 min-h-11 w-full rounded-lg px-4 text-[14px] font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
      disabled={disabled}
      type="button"
      onClick={onBack}
    >
      {copy.back}
    </button>
  );
}

function SaveError({ message }: { message: string }) {
  return (
    <p className="mb-3 rounded-[10px] bg-[var(--dl-error-surface)] p-2.5 text-[14px] leading-5 text-[var(--dl-error-text)]" role="alert">
      {message}
    </p>
  );
}

function ProfileFooter({ disabled, isSaving, saveError, onBack, onSave }: ProfileFooterProps) {
  return (
    <footer className="sticky bottom-0 z-20 -mx-6 mt-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-[8px] max-[374px]:-mx-5 max-[374px]:px-5 lg:mx-0 lg:px-0">
      {saveError ? <SaveError message={saveError} /> : null}
      <PrimaryButton disabled={disabled} isSaving={isSaving} onSave={onSave} />
      <BackTextButton disabled={isSaving} onBack={onBack} />
    </footer>
  );
}

function ToastRegion({ message }: ToastRegionProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-5 bottom-[148px] z-40 mx-auto max-w-[520px] transition-all duration-200 motion-reduce:transition-none"
      role="status"
    >
      {message ? (
        <p className="rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-[14px] leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function validateProfileName(profileName: string): string | null {
  const trimmedName = profileName.trim();
  if (!trimmedName) return copy.nameRequired;
  if (trimmedName.length > 40) return copy.nameTooLong;
  return null;
}

export default function ProfileSetupScreen({
  isOffline = false,
  isSaving = false,
  allowMinorProfiles = false,
  initialValues = {},
  countries,
  onBack,
  onSaveProfile,
}: ProfileSetupScreenProps) {
  const [profileName, setProfileName] = useState(initialValues.profileName ?? "");
  const [ageRange, setAgeRange] = useState<AgeRange | "">(initialValues.ageRange ?? "");
  const [primaryFocus, setPrimaryFocus] = useState<SkincareFocus | "">(initialValues.primaryFocus ?? "");
  const [countryCode, setCountryCode] = useState(initialValues.countryCode ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const saveInFlightRef = useRef(false);

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

  const sortedCountries = useMemo(
    () => [...countries].sort((left, right) => left.name.localeCompare(right.name)),
    [countries],
  );

  const saving = isSaving || localSaving;
  const nameValidationError = validateProfileName(profileName);
  const visibleNameError = nameTouched || submissionAttempted ? nameValidationError : null;
  const unsupportedMinorProfile = ageRange === "under-18" && !allowMinorProfiles;
  const saveDisabled = saving || Boolean(nameValidationError) || unsupportedMinorProfile;

  const handleBack = useCallback(async () => {
    if (saving) return;
    setToastMessage(null);
    try {
      await onBack();
    } catch {
      if (mountedRef.current) setToastMessage(copy.backError);
    }
  }, [onBack, saving]);

  const handleSave = useCallback(async () => {
    if (saving || saveInFlightRef.current) return;

    setSubmissionAttempted(true);
    const validationError = validateProfileName(profileName);
    if (validationError || unsupportedMinorProfile) return;

    saveInFlightRef.current = true;
    setLocalSaving(true);
    setSaveError(null);

    const trimmedProfileName = profileName.trim();

    // The backend should store a canonical server-side timestamp
    // when a synced profile is persisted. Local-only profiles should
    // retain the client timestamp until a later optional sync.
    const profile: SkinProfileDraft = {
      profileName: trimmedProfileName,
      ...(ageRange ? { ageRange } : {}),
      ...(primaryFocus ? { primaryFocus } : {}),
      ...(countryCode ? { countryCode } : {}),
      createdAtClient: new Date().toISOString(),
    };

    try {
      // Connect host navigation to ImageSourceSelectionScreen after persistence succeeds.
      await onSaveProfile(profile);
    } catch {
      if (mountedRef.current) setSaveError(copy.saveError);
    } finally {
      saveInFlightRef.current = false;
      if (mountedRef.current) setLocalSaving(false);
    }
  }, [ageRange, countryCode, onSaveProfile, primaryFocus, profileName, saving, unsupportedMinorProfile]);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col px-6 pb-0 pt-[max(20px,env(safe-area-inset-top))] max-[374px]:px-5 max-[374px]:pt-[max(16px,env(safe-area-inset-top))] lg:pt-8">
        <ProfileTopBar disabled={saving} onBack={() => void handleBack()} />

        <ProfileContent>
          <div className="mt-5 max-[374px]:mt-4 lg:hidden">
            <ProfileIllustration />
          </div>

          <Heading />
          <SupportingCopy />

          <SharedDeviceNote />
          {isOffline ? <OfflineBanner /> : null}

          <NameField
            disabled={saving}
            error={visibleNameError}
            value={profileName}
            onBlur={() => setNameTouched(true)}
            onChange={(value) => {
              setProfileName(value);
              if (saveError) setSaveError(null);
            }}
          />

          <OptionalDetailsAccordion
            ageRange={ageRange}
            countries={sortedCountries}
            countryCode={countryCode}
            disabled={saving}
            primaryFocus={primaryFocus}
            showMinorNotice={unsupportedMinorProfile}
            onAgeRangeChange={(value) => {
              setAgeRange(value);
              if (saveError) setSaveError(null);
            }}
            onCountryCodeChange={(value) => {
              setCountryCode(value);
              if (saveError) setSaveError(null);
            }}
            onPrimaryFocusChange={(value) => {
              setPrimaryFocus(value);
              if (saveError) setSaveError(null);
            }}
          />

          <FlexibleSpacer />
        </ProfileContent>

        <ProfileFooter
          disabled={saveDisabled}
          isSaving={saving}
          saveError={saveError}
          onBack={() => void handleBack()}
          onSave={() => void handleSave()}
        />
      </div>
      <ToastRegion message={toastMessage} />
    </AppShell>
  );
}
