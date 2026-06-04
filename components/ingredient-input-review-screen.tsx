import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  UserRound,
} from "lucide-react";

export type IngredientInputReviewState =
  | "loading"
  | "ready"
  | "error";

export type IngredientInputReviewOperation =
  | "back"
  | "change-method"
  | "change-profile"
  | "continue"
  | "retry-load"
  | null;

export type IngredientInputSource =
  | "camera-photo"
  | "chosen-photo"
  | "manual-entry";

export interface IngredientInputReviewProfileSummary {
  profileId: string;
  displayName: string;
  contextLabel?: string;
}

export interface IngredientInputReviewImageSummary {
  imageUrl?: string;
  imageAlt?: string;
  sourceLabel?: string;
}

export interface IngredientInputReviewReport {
  draftId: string;
  source: IngredientInputSource;
  sourceLabel: string;
  ingredientText: string;
  selectedProfile?: IngredientInputReviewProfileSummary;
  image?: IngredientInputReviewImageSummary;
  helperLabel?: string;
  privacyLabel?: string;
  extractionNoticeLabel?: string;
}

export interface IngredientInputReviewSubmission {
  draftId: string;
  ingredientText: string;
  profileId?: string;
}

export interface IngredientInputReviewScreenProps {
  state?: IngredientInputReviewState;
  report?: IngredientInputReviewReport | null;
  isOffline?: boolean;
  canGoBack?: boolean;
  canChangeMethod?: boolean;
  canChangeProfile?: boolean;
  canEditIngredientText?: boolean;
  canContinue?: boolean;
  onBack: () => void | Promise<void>;
  onChangeMethod: () => void | Promise<void>;
  onIngredientTextChange: (
    ingredientText: string,
  ) => void;
  onChangeProfile?: () => void | Promise<void>;
  onContinue: (
    submission: IngredientInputReviewSubmission,
  ) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export function isIngredientInputReviewState(
  value: unknown,
): value is IngredientInputReviewState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "error"
  );
}

export function isIngredientInputSource(
  value: unknown,
): value is IngredientInputSource {
  return (
    value === "camera-photo" ||
    value === "chosen-photo" ||
    value === "manual-entry"
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

export function hasUsableIngredientInputReviewReport(
  report: IngredientInputReviewReport | null | undefined,
): report is IngredientInputReviewReport {
  return (
    report !== null &&
    report !== undefined &&
    isNonWhitespaceString((report as { draftId?: unknown }).draftId) &&
    isIngredientInputSource((report as { source?: unknown }).source) &&
    isNonWhitespaceString((report as { sourceLabel?: unknown }).sourceLabel) &&
    typeof (report as { ingredientText?: unknown }).ingredientText === "string"
  );
}

export function getIngredientInputReviewSubmission(
  report: IngredientInputReviewReport | null | undefined,
): IngredientInputReviewSubmission | null {
  if (
    !hasUsableIngredientInputReviewReport(report) ||
    report.ingredientText.trim().length === 0
  ) {
    return null;
  }

  const selectedProfile = report.selectedProfile;
  const profileId = (selectedProfile as { profileId?: unknown } | undefined)
    ?.profileId;
  const hasProfile = isNonWhitespaceString(
    profileId,
  );

  return hasProfile
    ? {
        draftId: report.draftId,
        ingredientText: report.ingredientText,
        profileId,
      }
    : {
        draftId: report.draftId,
        ingredientText: report.ingredientText,
      };
}

export const copy = {
  wordmark: "DermaLens",
  contextLabel: "INGREDIENT REVIEW",
  back: "Back",
  backBlocked: "Back unavailable",
  backing: "Going back...",
  heading: "Review ingredient text",
  supporting:
    "Check the ingredient list and correct anything that was missed before guidance is prepared.",
  reviewTitle: "Review before guidance",
  reviewSupporting:
    "Nothing is analysed from this screen until you explicitly continue.",
  offline:
    "You appear to be offline. The text shown here remains readable. The host controls which next steps remain available.",
  sourceTitle: "Input source",
  sourceCamera:
    "Label photo captured through the host camera route.",
  sourceChosen:
    "Existing label photo selected through the host picker route.",
  sourceManual: "Ingredient text entered manually.",
  imageTitle: "Label photo",
  imageFallbackAlt: "Skincare ingredient label preview",
  imageUnavailable: "Label image unavailable",
  ingredientText: "Ingredient text",
  ingredientTextHelp:
    "Edit the label text so it matches the product packaging.",
  editingBlocked: "Ingredient editing unavailable",
  emptyTitle: "Add ingredient text to continue",
  emptySupporting:
    "No ingredient text is available yet. Type or paste the product label before continuing.",
  optionalProfileTitle: "Optional profile context",
  optionalProfileSupporting:
    "A local profile may help the host tailor later guidance, but it is not required.",
  noProfile: "No profile selected",
  noProfileSupporting: "Guidance can continue without a profile.",
  profileReady: "This profile will accompany the draft when you continue.",
  unnamedProfile: "Unnamed profile",
  malformedProfile:
    "Profile context unavailable. Guidance can continue in guest mode.",
  privacyFallback:
    "The host controls how this draft is stored and when guidance is prepared.",
  helperFallback:
    "Your corrections are sent only when you continue.",
  changeMethod: "Change input method",
  changingMethod: "Opening input methods...",
  changeMethodBlocked: "Input-method change unavailable",
  changeProfile: "Change profile",
  changingProfile: "Opening profile switcher...",
  changeProfileBlocked: "Profile switching unavailable",
  continue: "Continue to ingredient guidance",
  continuing: "Preparing guidance...",
  continueBlocked: "Guidance unavailable right now",
  retry: "Try again",
  retrying: "Trying again...",
  loadingHeading: "Preparing ingredient text",
  loadingSupporting: "Your ingredient review is being prepared.",
  errorHeading: "We could not load the ingredient text",
  errorSupporting: "Try loading the ingredient review again.",
  toastLabel: "Ingredient review notice",
  backError: "We could not go back. Please try again.",
  changeMethodError:
    "We could not open the input methods. Please try again.",
  changeProfileError:
    "We could not open profile switching. Please try again.",
  continueError:
    "We could not prepare ingredient guidance. Please try again.",
  retryError:
    "We could not reload the ingredient review. Please try again.",
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
  IngredientInputReviewOperation,
  null
>;

function getSourceSupporting(
  source: IngredientInputSource,
): string {
  if (source === "camera-photo") {
    return copy.sourceCamera;
  }

  if (source === "chosen-photo") {
    return copy.sourceChosen;
  }

  return copy.sourceManual;
}

function hasUsableProfileRoute(
  profile: IngredientInputReviewProfileSummary | undefined,
): boolean {
  return isNonWhitespaceString(
    (profile as { profileId?: unknown } | undefined)?.profileId,
  );
}

function getSafeProfileName(
  profile: IngredientInputReviewProfileSummary,
): string {
  const displayName = (profile as { displayName?: unknown }).displayName;
  return isNonWhitespaceString(displayName)
    ? displayName.trim()
    : copy.unnamedProfile;
}

function getImageUrl(
  report: IngredientInputReviewReport,
): string | null {
  const imageUrl = (report.image as { imageUrl?: unknown } | undefined)
    ?.imageUrl;
  return isNonWhitespaceString(imageUrl) ? imageUrl : null;
}

function getImageAlt(
  report: IngredientInputReviewReport,
): string {
  const imageAlt = (report.image as { imageAlt?: unknown } | undefined)
    ?.imageAlt;
  return isNonWhitespaceString(imageAlt)
    ? imageAlt
    : copy.imageFallbackAlt;
}

function PageShell({
  activeOperation,
  canGoBack,
  children,
  onBack,
  toast,
}: {
  activeOperation: IngredientInputReviewOperation;
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

function SourceCard({
  report,
}: {
  report: IngredientInputReviewReport;
}) {
  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-brown)]">
          <ClipboardList aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {copy.sourceTitle}
          </h2>
          <p className="mt-1 text-base font-semibold text-[var(--dl-brown)]">
            {report.sourceLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {getSourceSupporting(report.source)}
          </p>
        </div>
      </div>
      {isNonWhitespaceString(report.extractionNoticeLabel) ? (
        <p className="mt-4 rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--dl-text-secondary)]">
          {report.extractionNoticeLabel}
        </p>
      ) : null}
    </section>
  );
}

function ChangeMethodPanel({
  activeOperation,
  canChangeMethod,
  onChangeMethod,
}: {
  activeOperation: IngredientInputReviewOperation;
  canChangeMethod: boolean;
  onChangeMethod: () => void;
}) {
  const isBusy = activeOperation !== null;
  const disabled = isBusy || !canChangeMethod;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <button
        className={`${focusRing} inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-4 py-2 text-sm font-bold text-[var(--dl-brown)] transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
        disabled={disabled}
        onClick={onChangeMethod}
        type="button"
      >
        {activeOperation === "change-method"
          ? copy.changingMethod
          : canChangeMethod
            ? copy.changeMethod
            : copy.changeMethodBlocked}
      </button>
    </section>
  );
}

function ImagePreviewCard({
  failedImageKey,
  onImageError,
  report,
}: {
  failedImageKey: string | null;
  onImageError: (key: string) => void;
  report: IngredientInputReviewReport;
}) {
  if (report.source === "manual-entry") {
    return null;
  }

  const imageUrl = getImageUrl(report);
  const imageKey = imageUrl ? `${report.draftId}:${imageUrl}` : null;
  const canRenderImage =
    imageUrl !== null &&
    imageKey !== null &&
    failedImageKey !== imageKey;

  return (
    <section
      className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm"
      data-testid="image-preview-card"
    >
      <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
        {copy.imageTitle}
      </h2>
      {isNonWhitespaceString(report.image?.sourceLabel) ? (
        <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
          {report.image.sourceLabel}
        </p>
      ) : null}
      <div className="mt-4 overflow-hidden rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)]">
        {canRenderImage ? (
          <img
            alt={getImageAlt(report)}
            className="aspect-[4/3] w-full object-cover"
            onError={() => onImageError(imageKey)}
            src={imageUrl}
          />
        ) : (
          <div className="flex aspect-[4/3] min-h-[180px] items-center justify-center px-4 text-center text-sm font-semibold text-[var(--dl-text-secondary)]">
            {copy.imageUnavailable}
          </div>
        )}
      </div>
    </section>
  );
}

function IngredientEditor({
  ingredientEditingDisabled,
  onIngredientTextChange,
  report,
}: {
  ingredientEditingDisabled: boolean;
  onIngredientTextChange: (ingredientText: string) => void;
  report: IngredientInputReviewReport;
}) {
  const isBlank = report.ingredientText.trim().length === 0;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-brown)]">
          <FileText aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <label
            className="text-lg font-bold text-[var(--dl-text-primary)]"
            htmlFor="ingredient-input-review-text"
          >
            {copy.ingredientText}
          </label>
          <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {copy.ingredientTextHelp}
          </p>
        </div>
      </div>
      <textarea
        className={`${focusRing} mt-4 min-h-[220px] w-full resize-y rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-4 py-3 text-base leading-7 text-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:opacity-70`}
        disabled={ingredientEditingDisabled}
        id="ingredient-input-review-text"
        onChange={(event) => onIngredientTextChange(event.currentTarget.value)}
        value={report.ingredientText}
      />
      {ingredientEditingDisabled ? (
        <p className="mt-3 text-sm font-semibold text-[var(--dl-text-secondary)]">
          {copy.editingBlocked}
        </p>
      ) : null}
      {isBlank ? (
        <div className="mt-4 rounded-[8px] border border-[var(--dl-blush-strong)] bg-[var(--dl-error-surface)] px-4 py-3 text-sm leading-6 text-[var(--dl-error-text)]">
          <h2 className="font-bold">{copy.emptyTitle}</h2>
          <p className="mt-1">{copy.emptySupporting}</p>
        </div>
      ) : null}
    </section>
  );
}

function ProfileCard({
  activeOperation,
  canChangeProfile,
  hasChangeProfileRoute,
  onChangeProfile,
  report,
}: {
  activeOperation: IngredientInputReviewOperation;
  canChangeProfile: boolean;
  hasChangeProfileRoute: boolean;
  onChangeProfile: () => void;
  report: IngredientInputReviewReport;
}) {
  const profile = report.selectedProfile;
  const hasProfile = profile !== undefined;
  const malformedProfile = hasProfile && !hasUsableProfileRoute(profile);
  const profileName = profile ? getSafeProfileName(profile) : copy.noProfile;
  const contextLabel = isNonWhitespaceString(
    (profile as { contextLabel?: unknown } | undefined)?.contextLabel,
  )
    ? profile?.contextLabel
    : null;
  const isBusy = activeOperation !== null;
  const shouldShowButton = hasChangeProfileRoute;
  const buttonDisabled =
    isBusy || !hasChangeProfileRoute || !canChangeProfile;

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
              ? copy.profileReady
              : copy.noProfileSupporting}
        </p>
      </div>
      {shouldShowButton ? (
        <button
          className={`${focusRing} mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-4 py-2 text-sm font-bold text-[var(--dl-brown)] transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
          disabled={buttonDisabled}
          onClick={onChangeProfile}
          type="button"
        >
          {activeOperation === "change-profile"
            ? copy.changingProfile
            : canChangeProfile
              ? copy.changeProfile
              : copy.changeProfileBlocked}
        </button>
      ) : null}
    </section>
  );
}

function HelperCard({
  report,
}: {
  report: IngredientInputReviewReport;
}) {
  const privacyLabel = isNonWhitespaceString(report.privacyLabel)
    ? report.privacyLabel
    : copy.privacyFallback;
  const helperLabel = isNonWhitespaceString(report.helperLabel)
    ? report.helperLabel
    : copy.helperFallback;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
        {copy.reviewTitle}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
        {copy.reviewSupporting}
      </p>
      <div className="mt-4 rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface)] p-4">
        <p className="text-sm font-bold text-[var(--dl-brown)]">
          {privacyLabel}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
          {helperLabel}
        </p>
      </div>
    </section>
  );
}

function ContinuePanel({
  activeOperation,
  canContinue,
  onContinue,
  submission,
}: {
  activeOperation: IngredientInputReviewOperation;
  canContinue: boolean;
  onContinue: () => void;
  submission: IngredientInputReviewSubmission | null;
}) {
  const isBusy = activeOperation !== null;
  const disabled = isBusy || !canContinue || submission === null;
  const buttonLabel =
    activeOperation === "continue"
      ? copy.continuing
      : submission === null
        ? copy.emptyTitle
        : canContinue
          ? copy.continue
          : copy.continueBlocked;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <button
        className={`${focusRing} inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-brown)] px-5 py-3 text-base font-bold text-white transition hover:bg-[var(--dl-brown-hover)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
        disabled={disabled}
        onClick={onContinue}
        type="button"
      >
        {buttonLabel}
      </button>
    </section>
  );
}

export default function IngredientInputReviewScreen({
  state = "ready",
  report = null,
  isOffline = false,
  canGoBack = true,
  canChangeMethod = true,
  canChangeProfile = true,
  canEditIngredientText = true,
  canContinue = true,
  onBack,
  onChangeMethod,
  onIngredientTextChange,
  onChangeProfile,
  onContinue,
  onRetryLoad,
}: IngredientInputReviewScreenProps) {
  const mountedRef = useRef(false);
  const inFlightRef = useRef<InFlightOperation | null>(null);
  const [activeOperation, setActiveOperation] =
    useState<IngredientInputReviewOperation>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [failedImageKey, setFailedImageKey] = useState<string | null>(null);

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

  const resolvedState = isIngredientInputReviewState(state)
    ? state
    : "error";
  const hasReport = hasUsableIngredientInputReviewReport(report);
  const readyReport = hasReport ? report : null;
  const submission = getIngredientInputReviewSubmission(readyReport);
  const isBusy = activeOperation !== null;
  const ingredientEditingDisabled = !canEditIngredientText || isBusy;

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

  function activateChangeMethod() {
    if (!canChangeMethod || isBusy) {
      return;
    }

    void runOperation(
      "change-method",
      onChangeMethod,
      copy.changeMethodError,
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

  function activateContinue() {
    if (!canContinue || submission === null || isBusy) {
      return;
    }

    void runOperation(
      "continue",
      () => onContinue(submission),
      copy.continueError,
    );
  }

  function activateIngredientTextChange(
    ingredientText: string,
  ) {
    if (!canEditIngredientText || inFlightRef.current !== null) {
      return;
    }

    onIngredientTextChange(ingredientText);
  }

  function activateRetryLoad() {
    if (!onRetryLoad || isBusy) {
      return;
    }

    void runOperation("retry-load", onRetryLoad, copy.retryError);
  }

  function renderErrorExperience() {
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

  if (resolvedState === "error" || readyReport === null) {
    return renderErrorExperience();
  }

  return (
    <PageShell
      activeOperation={activeOperation}
      canGoBack={canGoBack}
      onBack={activateBack}
      toast={toast}
    >
      <main className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] lg:items-start">
        <div className="flex flex-col gap-5">
          <IntroSection />
          {isOffline ? <OfflineBanner /> : null}
          <SourceCard report={readyReport} />
          <ImagePreviewCard
            failedImageKey={failedImageKey}
            onImageError={setFailedImageKey}
            report={readyReport}
          />
          <IngredientEditor
            ingredientEditingDisabled={ingredientEditingDisabled}
            onIngredientTextChange={activateIngredientTextChange}
            report={readyReport}
          />
        </div>
        <section className="flex flex-col gap-5" aria-label="Ingredient review context">
          <ProfileCard
            activeOperation={activeOperation}
            canChangeProfile={canChangeProfile}
            hasChangeProfileRoute={Boolean(onChangeProfile)}
            onChangeProfile={activateChangeProfile}
            report={readyReport}
          />
          <HelperCard report={readyReport} />
          <ChangeMethodPanel
            activeOperation={activeOperation}
            canChangeMethod={canChangeMethod}
            onChangeMethod={activateChangeMethod}
          />
          <ContinuePanel
            activeOperation={activeOperation}
            canContinue={canContinue}
            onContinue={activateContinue}
            submission={submission}
          />
        </section>
      </main>
    </PageShell>
  );
}
