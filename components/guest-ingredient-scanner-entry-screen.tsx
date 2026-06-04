import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Camera,
  ChevronLeft,
  ClipboardList,
  Image as ImageIcon,
  UserRound,
} from "lucide-react";

export type GuestIngredientScannerEntryState =
  | "loading"
  | "ready"
  | "error";

export type GuestIngredientScannerEntryOperation =
  | "back"
  | "take-photo"
  | "choose-photo"
  | "manual-entry"
  | "change-profile"
  | "continue-without-profile"
  | "retry-load"
  | null;

export interface IngredientScannerEntryProfileSummary {
  profileId: string;
  displayName: string;
  contextLabel?: string;
}

export interface GuestIngredientScannerEntryReport {
  selectedProfile?: IngredientScannerEntryProfileSummary;
  helperLabel?: string;
  privacyLabel?: string;
  photoTips?: string[];
}

export interface IngredientScannerEntrySubmission {
  profileId?: string;
}

export interface GuestIngredientScannerEntryScreenProps {
  state?: GuestIngredientScannerEntryState;
  report?: GuestIngredientScannerEntryReport | null;
  isOffline?: boolean;
  canGoBack?: boolean;
  canTakePhoto?: boolean;
  isTakePhotoAvailableOffline?: boolean;
  canChoosePhoto?: boolean;
  isChoosePhotoAvailableOffline?: boolean;
  canEnterIngredientsManually?: boolean;
  isManualEntryAvailableOffline?: boolean;
  canChangeProfile?: boolean;
  canContinueWithoutProfile?: boolean;
  onBack: () => void | Promise<void>;
  onTakePhoto: (
    submission: IngredientScannerEntrySubmission,
  ) => void | Promise<void>;
  onChoosePhoto: (
    submission: IngredientScannerEntrySubmission,
  ) => void | Promise<void>;
  onEnterIngredientsManually: (
    submission: IngredientScannerEntrySubmission,
  ) => void | Promise<void>;
  onChangeProfile?: () => void | Promise<void>;
  onContinueWithoutProfile?: () => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export function isGuestIngredientScannerEntryState(
  value: unknown,
): value is GuestIngredientScannerEntryState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "error"
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

export const copy = {
  wordmark: "DermaLens",
  contextLabel: "INGREDIENT CHECK",
  back: "Back",
  backBlocked: "Back unavailable",
  backing: "Going back...",
  heading: "Check product ingredients",
  supporting:
    "Take a clear photo of a skincare ingredient list, choose an existing label photo, or paste the text manually.",
  helperFallback:
    "Start with the label text. The host prepares the next step only after you choose how to continue.",
  privacyFallback:
    "You will review the ingredient text before guidance is prepared.",
  noAccountTitle: "No account required",
  noAccountSupporting:
    "You can use the ingredient scanner without signing in or completing a facial scan.",
  offline:
    "You appear to be offline. Available scanner methods are controlled by the host.",
  methodHeading: "Choose a scanner method",
  takePhoto: "Take ingredient photo",
  takePhotoSupporting:
    "Use a host camera route for a clear product label photo.",
  takingPhoto: "Opening camera...",
  takePhotoOfflineBlocked: "Reconnect to take a photo",
  takePhotoBlocked: "Photo scanning unavailable",
  choosePhoto: "Choose a label photo",
  choosePhotoSupporting:
    "Use a host photo route for an ingredient-list image you already have.",
  choosingPhoto: "Opening photo picker...",
  choosePhotoOfflineBlocked: "Reconnect to choose a photo",
  choosePhotoBlocked: "Photo selection unavailable",
  manualEntry: "Enter ingredients manually",
  manualEntrySupporting:
    "Paste or type the ingredient list on the host manual-entry route.",
  enteringManually: "Opening manual entry...",
  manualEntryOfflineBlocked: "Reconnect to enter ingredients",
  manualEntryBlocked: "Manual entry unavailable",
  optionalProfileTitle: "Optional profile context",
  optionalProfileSupporting:
    "You can continue without a profile. A selected local profile may help the host tailor later guidance.",
  noProfileSelected: "No profile selected",
  profileOptional:
    "Profile context is optional for ingredient guidance.",
  unnamedProfile: "Unnamed profile",
  malformedProfile:
    "Profile context unavailable. You can continue as a guest.",
  changeProfile: "Change profile",
  changingProfile: "Opening profile switcher...",
  changeProfileBlocked: "Profile switching unavailable",
  continueWithoutProfile: "Scan without a profile",
  continuingWithoutProfile: "Switching to guest mode...",
  guestModeBlocked: "Guest mode unavailable",
  photoTipsHeading: "For a clearer label photo",
  loadingHeading: "Preparing ingredient scanner",
  loadingSupporting: "Your scanner options are being prepared.",
  errorHeading: "We could not open the ingredient scanner",
  errorSupporting: "Try loading the available scanner options again.",
  retry: "Try again",
  retrying: "Trying again...",
  toastLabel: "Ingredient scanner notice",
  backError: "We could not go back. Please try again.",
  takePhotoError: "We could not open the camera route. Please try again.",
  choosePhotoError: "We could not open the photo picker route. Please try again.",
  manualEntryError: "We could not open manual entry. Please try again.",
  changeProfileError: "We could not open profile switching. Please try again.",
  continueWithoutProfileError:
    "We could not continue without a profile. Please try again.",
  retryError: "We could not reload the scanner. Please try again.",
} as const;

const colors = {
  cream: "#FAF7F2",
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
  brown: "#5C4A42",
  brownHover: "#493A34",
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
  "--dl-cream": colors.cream,
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
  "--dl-brown": colors.brown,
  "--dl-brown-hover": colors.brownHover,
  "--dl-text-primary": colors.textPrimary,
  "--dl-text-secondary": colors.textSecondary,
  "--dl-border-subtle": colors.borderSubtle,
  "--dl-notice-text": colors.noticeText,
  "--dl-notice-surface": colors.noticeSurface,
  "--dl-error-text": colors.errorText,
  "--dl-error-surface": colors.errorSurface,
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-brown)]";

type InFlightOperation = Exclude<
  GuestIngredientScannerEntryOperation,
  null
>;

type MethodAvailability = {
  blockedLabel: string;
  isAvailable: boolean;
};

function hasUsableProfileContext(
  report: GuestIngredientScannerEntryReport | null | undefined,
): report is GuestIngredientScannerEntryReport & {
  selectedProfile: IngredientScannerEntryProfileSummary;
} {
  return isNonWhitespaceString(
    (report?.selectedProfile as { profileId?: unknown } | undefined)?.profileId,
  );
}

function getSafeDisplayName(
  profile: IngredientScannerEntryProfileSummary,
): string {
  const displayName = (profile as { displayName?: unknown }).displayName;
  return isNonWhitespaceString(displayName)
    ? displayName.trim()
    : copy.unnamedProfile;
}

function getUsablePhotoTips(
  report: GuestIngredientScannerEntryReport | null | undefined,
): string[] {
  const tips = (report as { photoTips?: unknown } | null | undefined)
    ?.photoTips;

  if (!Array.isArray(tips)) {
    return [];
  }

  return tips.filter(isNonWhitespaceString).map((tip) => tip.trim());
}

export function getIngredientScannerSubmission(
  report: GuestIngredientScannerEntryReport | null | undefined,
): IngredientScannerEntrySubmission {
  return hasUsableProfileContext(report)
    ? { profileId: report.selectedProfile.profileId }
    : {};
}

function getMethodAvailability(
  canUseMethod: boolean,
  isOffline: boolean,
  isAvailableOffline: boolean,
  offlineBlockedLabel: string,
  unavailableLabel: string,
): MethodAvailability {
  if (!canUseMethod) {
    return {
      blockedLabel: unavailableLabel,
      isAvailable: false,
    };
  }

  if (isOffline && !isAvailableOffline) {
    return {
      blockedLabel: offlineBlockedLabel,
      isAvailable: false,
    };
  }

  return {
    blockedLabel: unavailableLabel,
    isAvailable: true,
  };
}

function PageShell({
  activeOperation,
  canGoBack,
  children,
  onBack,
  toast,
}: {
  activeOperation: GuestIngredientScannerEntryOperation;
  canGoBack: boolean;
  children: ReactNode;
  onBack: () => void;
  toast: string | null;
}) {
  const isBusy = activeOperation !== null;
  const backDisabled = isBusy || !canGoBack;

  return (
    <div
      className="min-h-screen bg-[var(--dl-cream)] px-4 py-4 text-[var(--dl-text-primary)] sm:px-6 lg:px-8"
      style={{
        ...themeStyle,
        fontFamily: fonts.ui,
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <button
            className={`${focusRing} inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-2 text-sm font-semibold text-[var(--dl-brown)] shadow-sm transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
            disabled={backDisabled}
            onClick={onBack}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            {activeOperation === "back"
              ? copy.backing
              : canGoBack
                ? copy.back
                : copy.backBlocked}
          </button>
          <p
            className="text-sm font-bold tracking-[0.18em] text-[var(--dl-brown)]"
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
          role={toast ? "status" : undefined}
        >
          {toast ? (
            <div className="rounded-[8px] border border-[var(--dl-blush-strong)] bg-[var(--dl-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--dl-error-text)] shadow-sm">
              <span className="sr-only">{copy.toastLabel}: </span>
              {toast}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
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

function TrustCardSection({
  helperLabel,
  privacyLabel,
}: {
  helperLabel?: string;
  privacyLabel?: string;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <TrustCard
        title={copy.noAccountTitle}
        supporting={copy.noAccountSupporting}
      />
      <TrustCard
        title={privacyLabel ?? copy.privacyFallback}
        supporting={helperLabel ?? copy.helperFallback}
      />
    </section>
  );
}

function TrustCard({
  supporting,
  title,
}: {
  supporting: string;
  title: string;
}) {
  return (
    <div className="rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-4">
      <h2 className="text-base font-bold text-[var(--dl-brown)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
        {supporting}
      </p>
    </div>
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

function MethodButton({
  activeOperation,
  availability,
  icon,
  label,
  operation,
  pendingLabel,
  supporting,
  onActivate,
  primary,
}: {
  activeOperation: GuestIngredientScannerEntryOperation;
  availability: MethodAvailability;
  icon: ReactNode;
  label: string;
  operation: InFlightOperation;
  pendingLabel: string;
  supporting: string;
  onActivate: () => void;
  primary?: boolean;
}) {
  const isBusy = activeOperation !== null;
  const isPending = activeOperation === operation;
  const disabled = isBusy || !availability.isAvailable;
  const buttonLabel = isPending
    ? pendingLabel
    : availability.isAvailable
      ? label
      : availability.blockedLabel;

  return (
    <div
      className={`rounded-[8px] border ${
        primary
          ? "border-[var(--dl-peach-strong)] bg-[var(--dl-blush)]"
          : "border-[var(--dl-border-subtle)] bg-[var(--dl-surface)]"
      } p-4 shadow-sm`}
      data-testid={`scanner-method-${operation}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-brown)]">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--dl-text-primary)]">
            {label}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {supporting}
          </p>
        </div>
      </div>
      <button
        className={`${focusRing} mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none ${
          primary
            ? "min-h-[52px] bg-[var(--dl-brown)] text-white hover:bg-[var(--dl-brown-hover)]"
            : "min-h-[44px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] text-[var(--dl-brown)] hover:border-[var(--dl-sand)]"
        }`}
        disabled={disabled}
        onClick={onActivate}
        type="button"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ProfileContextCard({
  activeOperation,
  canChangeProfile,
  canContinueWithoutProfile,
  hasChangeProfileRoute,
  hasContinueWithoutProfileRoute,
  malformedProfile,
  onChangeProfile,
  onContinueWithoutProfile,
  profile,
}: {
  activeOperation: GuestIngredientScannerEntryOperation;
  canChangeProfile: boolean;
  canContinueWithoutProfile: boolean;
  hasChangeProfileRoute: boolean;
  hasContinueWithoutProfileRoute: boolean;
  malformedProfile: boolean;
  onChangeProfile: () => void;
  onContinueWithoutProfile: () => void;
  profile?: IngredientScannerEntryProfileSummary;
}) {
  const isBusy = activeOperation !== null;
  const hasProfile = profile !== undefined;
  const changeProfileVisible = hasProfile || hasChangeProfileRoute;
  const changeProfileDisabled =
    isBusy || !hasChangeProfileRoute || !canChangeProfile;
  const continueVisible =
    hasProfile && hasContinueWithoutProfileRoute;
  const continueDisabled =
    isBusy || !canContinueWithoutProfile;
  const profileName = profile
    ? getSafeDisplayName(profile)
    : copy.noProfileSelected;
  const contextLabel = isNonWhitespaceString(
    (profile as { contextLabel?: unknown } | undefined)?.contextLabel,
  )
    ? (profile as IngredientScannerEntryProfileSummary).contextLabel
    : null;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-brown)]">
          <UserRound aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {copy.optionalProfileTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {copy.optionalProfileSupporting}
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-4">
        <h3 className="text-base font-bold text-[var(--dl-brown)]">
          {profileName}
        </h3>
        {contextLabel ? (
          <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {contextLabel}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
          {malformedProfile
            ? copy.malformedProfile
            : hasProfile
              ? copy.profileOptional
              : copy.profileOptional}
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {changeProfileVisible ? (
          <button
            className={`${focusRing} inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-4 py-2 text-sm font-bold text-[var(--dl-brown)] transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
            disabled={changeProfileDisabled}
            onClick={onChangeProfile}
            type="button"
          >
            {activeOperation === "change-profile"
              ? copy.changingProfile
              : hasChangeProfileRoute && canChangeProfile
                ? copy.changeProfile
                : copy.changeProfileBlocked}
          </button>
        ) : null}
        {continueVisible ? (
          <button
            className={`${focusRing} inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-2 text-sm font-bold text-[var(--dl-brown)] transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
            disabled={continueDisabled}
            onClick={onContinueWithoutProfile}
            type="button"
          >
            {activeOperation === "continue-without-profile"
              ? copy.continuingWithoutProfile
              : canContinueWithoutProfile
                ? copy.continueWithoutProfile
                : copy.guestModeBlocked}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function PhotoTipsCard({
  tips,
}: {
  tips: string[];
}) {
  if (tips.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
        {copy.photoTipsHeading}
      </h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
        {tips.map((tip, index) => (
          <li className="flex gap-2" key={`${tip}-${index}`}>
            <span aria-hidden="true" className="text-[var(--dl-peach-strong)]">
              -
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function GuestIngredientScannerEntryScreen({
  state = "ready",
  report = null,
  isOffline = false,
  canGoBack = true,
  canTakePhoto = true,
  isTakePhotoAvailableOffline = false,
  canChoosePhoto = true,
  isChoosePhotoAvailableOffline = false,
  canEnterIngredientsManually = true,
  isManualEntryAvailableOffline = false,
  canChangeProfile = true,
  canContinueWithoutProfile = true,
  onBack,
  onTakePhoto,
  onChoosePhoto,
  onEnterIngredientsManually,
  onChangeProfile,
  onContinueWithoutProfile,
  onRetryLoad,
}: GuestIngredientScannerEntryScreenProps) {
  const mountedRef = useRef(false);
  const inFlightRef = useRef<InFlightOperation | null>(null);
  const [activeOperation, setActiveOperation] =
    useState<GuestIngredientScannerEntryOperation>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (mountedRef.current) {
        setToast(null);
      }
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const resolvedState = isGuestIngredientScannerEntryState(state)
    ? state
    : "error";
  const selectedProfile = report?.selectedProfile;
  const malformedProfile =
    selectedProfile !== undefined &&
    !hasUsableProfileContext(report);
  const submission = getIngredientScannerSubmission(report);
  const photoTips = getUsablePhotoTips(report);
  const helperLabel =
    isNonWhitespaceString(report?.helperLabel)
      ? report?.helperLabel
      : undefined;
  const privacyLabel =
    isNonWhitespaceString(report?.privacyLabel)
      ? report?.privacyLabel
      : undefined;
  const isBusy = activeOperation !== null;

  const takePhotoAvailability = getMethodAvailability(
    canTakePhoto,
    isOffline,
    isTakePhotoAvailableOffline,
    copy.takePhotoOfflineBlocked,
    copy.takePhotoBlocked,
  );
  const choosePhotoAvailability = getMethodAvailability(
    canChoosePhoto,
    isOffline,
    isChoosePhotoAvailableOffline,
    copy.choosePhotoOfflineBlocked,
    copy.choosePhotoBlocked,
  );
  const manualEntryAvailability = getMethodAvailability(
    canEnterIngredientsManually,
    isOffline,
    isManualEntryAvailableOffline,
    copy.manualEntryOfflineBlocked,
    copy.manualEntryBlocked,
  );

  async function runOperation(
    operation: InFlightOperation,
    action: (() => void | Promise<void>) | undefined,
    failureText: string,
  ) {
    if (inFlightRef.current !== null || action === undefined) {
      return;
    }

    inFlightRef.current = operation;
    setActiveOperation(operation);
    setToast(null);

    try {
      await action();
    } catch {
      if (mountedRef.current) {
        setToast(failureText);
      }
    } finally {
      if (mountedRef.current && inFlightRef.current === operation) {
        inFlightRef.current = null;
        setActiveOperation(null);
      } else if (!mountedRef.current && inFlightRef.current === operation) {
        inFlightRef.current = null;
      }
    }
  }

  function activateBack() {
    if (!canGoBack || isBusy) {
      return;
    }

    void runOperation("back", onBack, copy.backError);
  }

  function activateTakePhoto() {
    if (!takePhotoAvailability.isAvailable || isBusy) {
      return;
    }

    void runOperation(
      "take-photo",
      () => onTakePhoto(submission),
      copy.takePhotoError,
    );
  }

  function activateChoosePhoto() {
    if (!choosePhotoAvailability.isAvailable || isBusy) {
      return;
    }

    void runOperation(
      "choose-photo",
      () => onChoosePhoto(submission),
      copy.choosePhotoError,
    );
  }

  function activateManualEntry() {
    if (!manualEntryAvailability.isAvailable || isBusy) {
      return;
    }

    void runOperation(
      "manual-entry",
      () => onEnterIngredientsManually(submission),
      copy.manualEntryError,
    );
  }

  function activateChangeProfile() {
    if (!canChangeProfile || !onChangeProfile || isBusy) {
      return;
    }

    void runOperation(
      "change-profile",
      onChangeProfile,
      copy.changeProfileError,
    );
  }

  function activateContinueWithoutProfile() {
    if (
      !canContinueWithoutProfile ||
      !onContinueWithoutProfile ||
      isBusy
    ) {
      return;
    }

    void runOperation(
      "continue-without-profile",
      onContinueWithoutProfile,
      copy.continueWithoutProfileError,
    );
  }

  function activateRetryLoad() {
    if (!onRetryLoad || isBusy) {
      return;
    }

    void runOperation("retry-load", onRetryLoad, copy.retryError);
  }

  if (resolvedState === "loading") {
    return (
      <PageShell
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={activateBack}
        toast={toast}
      >
        <main>
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
        </main>
      </PageShell>
    );
  }

  if (resolvedState === "error") {
    return (
      <PageShell
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={activateBack}
        toast={toast}
      >
        <main>
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
            {onRetryLoad ? (
              <button
                className={`${focusRing} mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--dl-brown)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--dl-brown-hover)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
                disabled={isBusy}
                onClick={activateRetryLoad}
                type="button"
              >
                {activeOperation === "retry-load"
                  ? copy.retrying
                  : copy.retry}
              </button>
            ) : null}
          </section>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell
      activeOperation={activeOperation}
      canGoBack={canGoBack}
      onBack={activateBack}
      toast={toast}
    >
      <main className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)] lg:items-start">
        <div className="flex flex-col gap-5">
          <HeroSection />
          {isOffline ? <OfflineBanner /> : null}
          <TrustCardSection
            helperLabel={helperLabel}
            privacyLabel={privacyLabel}
          />
          <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--dl-text-primary)]">
              {copy.methodHeading}
            </h2>
            <div className="mt-4 grid gap-4">
              <MethodButton
                activeOperation={activeOperation}
                availability={takePhotoAvailability}
                icon={<Camera aria-hidden="true" className="h-5 w-5" />}
                label={copy.takePhoto}
                operation="take-photo"
                pendingLabel={copy.takingPhoto}
                primary
                supporting={copy.takePhotoSupporting}
                onActivate={activateTakePhoto}
              />
              <MethodButton
                activeOperation={activeOperation}
                availability={choosePhotoAvailability}
                icon={<ImageIcon aria-hidden="true" className="h-5 w-5" />}
                label={copy.choosePhoto}
                operation="choose-photo"
                pendingLabel={copy.choosingPhoto}
                supporting={copy.choosePhotoSupporting}
                onActivate={activateChoosePhoto}
              />
              <MethodButton
                activeOperation={activeOperation}
                availability={manualEntryAvailability}
                icon={<ClipboardList aria-hidden="true" className="h-5 w-5" />}
                label={copy.manualEntry}
                operation="manual-entry"
                pendingLabel={copy.enteringManually}
                supporting={copy.manualEntrySupporting}
                onActivate={activateManualEntry}
              />
            </div>
          </section>
        </div>
        <section className="flex flex-col gap-5" aria-label="Scanner context">
          <ProfileContextCard
            activeOperation={activeOperation}
            canChangeProfile={canChangeProfile}
            canContinueWithoutProfile={
              canContinueWithoutProfile
            }
            hasChangeProfileRoute={Boolean(onChangeProfile)}
            hasContinueWithoutProfileRoute={Boolean(onContinueWithoutProfile)}
            malformedProfile={malformedProfile}
            onChangeProfile={activateChangeProfile}
            onContinueWithoutProfile={activateContinueWithoutProfile}
            profile={selectedProfile}
          />
          <PhotoTipsCard tips={photoTips} />
        </section>
      </main>
    </PageShell>
  );
}
