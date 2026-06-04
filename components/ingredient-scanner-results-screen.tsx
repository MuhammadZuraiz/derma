import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bookmark,
  ChevronLeft,
  ClipboardList,
  FileText,
  Info,
  RotateCcw,
  UserRound,
} from "lucide-react";

export type IngredientScannerResultsState =
  | "loading"
  | "ready"
  | "empty"
  | "error";

export type IngredientScannerResultsOperation =
  | "back-to-review"
  | "scan-another-product"
  | "save-result"
  | "retry-load"
  | null;

export type IngredientGuidanceTone =
  | "neutral"
  | "attention"
  | "caution";

export interface IngredientScannerResultsProfileSummary {
  profileId: string;
  displayName: string;
  contextLabel?: string;
}

export interface IngredientScannerGuidanceItem {
  itemId: string;
  name: string;
  flagLabel: string;
  summary: string;
  categoryLabel?: string;
  supporting?: string;
  tone?: IngredientGuidanceTone;
}

export interface IngredientScannerResultsReport {
  resultId: string;
  draftId: string;
  sourceLabel: string;
  summaryLabel: string;
  ingredientCountLabel?: string;
  guidanceItems: IngredientScannerGuidanceItem[];
  selectedProfile?: IngredientScannerResultsProfileSummary;
  helperLabel?: string;
  disclaimerLabel?: string;
  savedLabel?: string;
}

export interface IngredientScannerResultSaveSubmission {
  resultId: string;
  draftId: string;
  profileId?: string;
}

export interface IngredientScannerResultsScreenProps {
  state?: IngredientScannerResultsState;
  report?: IngredientScannerResultsReport | null;
  isOffline?: boolean;
  canGoBackToReview?: boolean;
  canScanAnotherProduct?: boolean;
  canSaveResult?: boolean;
  isSaveAvailableOffline?: boolean;
  onBackToReview: (draftId: string) => void | Promise<void>;
  onScanAnotherProduct: () => void | Promise<void>;
  onSaveResult?: (
    submission: IngredientScannerResultSaveSubmission,
  ) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export function isIngredientScannerResultsState(
  value: unknown,
): value is IngredientScannerResultsState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "empty" ||
    value === "error"
  );
}

export function isIngredientGuidanceTone(
  value: unknown,
): value is IngredientGuidanceTone {
  return (
    value === "neutral" ||
    value === "attention" ||
    value === "caution"
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

export function hasUsableIngredientScannerResultsReport(
  report: IngredientScannerResultsReport | null | undefined,
): report is IngredientScannerResultsReport {
  return (
    report !== null &&
    report !== undefined &&
    isNonWhitespaceString((report as { resultId?: unknown }).resultId) &&
    isNonWhitespaceString((report as { draftId?: unknown }).draftId) &&
    isNonWhitespaceString((report as { sourceLabel?: unknown }).sourceLabel) &&
    isNonWhitespaceString((report as { summaryLabel?: unknown }).summaryLabel) &&
    Array.isArray((report as { guidanceItems?: unknown }).guidanceItems)
  );
}

export function getIngredientScannerResultSaveSubmission(
  report: IngredientScannerResultsReport | null | undefined,
): IngredientScannerResultSaveSubmission | null {
  if (!hasUsableIngredientScannerResultsReport(report)) {
    return null;
  }

  const profileId = (report.selectedProfile as { profileId?: unknown } | undefined)
    ?.profileId;
  const hasProfile = isNonWhitespaceString(profileId);

  return hasProfile
    ? {
        resultId: report.resultId,
        draftId: report.draftId,
        profileId,
      }
    : {
        resultId: report.resultId,
        draftId: report.draftId,
      };
}

export const copy = {
  wordmark: "DermaLens",
  backToReview: "Back to review",
  backToReviewBlocked: "Back to review unavailable",
  backToReviewPending: "Returning to review...",
  contextLabel: "INGREDIENT GUIDANCE",
  heading: "Ingredient guidance",
  supporting: "Review the host-prepared notes for this product label.",
  trustTitle: "Guidance, not a medical assessment",
  trustSupporting:
    "This information does not diagnose allergies or determine whether a product is medically suitable for your needs.",
  offline:
    "You appear to be offline. Supplied ingredient guidance remains readable. The host controls which actions remain available.",
  sourceTitle: "Input source",
  summaryTitle: "Ingredient notes",
  guidanceListTitle: "Host-prepared notes",
  unnamedIngredient: "Unnamed ingredient",
  unavailableFlag: "Guidance label unavailable",
  unavailableSummary: "Ingredient guidance details are unavailable.",
  emptyTitle: "No ingredient guidance available yet",
  emptySupporting:
    "The host did not supply ingredient notes for this result. You can return to review the text or scan another product.",
  profileTitle: "Optional profile context",
  profileSupporting:
    "A usable local profile may accompany this result, but an account is not required.",
  noProfile: "No profile selected",
  noProfileSupporting: "This result can remain readable without a profile.",
  unnamedProfile: "Unnamed profile",
  malformedProfile:
    "Profile context unavailable. This result remains readable in guest mode.",
  profileReady: "This local profile can accompany save requests.",
  helperTitle: "Storage and review",
  helperFallback:
    "The host controls save behaviour, storage, and routing for this result.",
  disclaimerFallback:
    "Use these notes as skincare guidance and check the product label when needed.",
  saveResult: "Save result",
  saveBlocked: "Saving unavailable right now",
  saveReconnect: "Reconnect to save this result",
  savePending: "Saving result...",
  saveDone: "Result save request completed.",
  scanAnother: "Scan another product",
  scanAnotherBlocked: "Scanner entry unavailable right now",
  scanAnotherPending: "Opening scanner entry...",
  retry: "Try again",
  retryPending: "Trying again...",
  loadingHeading: "Preparing ingredient guidance",
  loadingSupporting: "Your reviewed ingredient text is being prepared for display.",
  errorHeading: "We could not load ingredient guidance",
  errorSupporting: "Try loading the ingredient guidance again.",
  toastLabel: "Ingredient guidance notice",
  backError: "We could not return to the ingredient review. Please try again.",
  saveError: "We could not save this result. Please try again.",
  scanAnotherError: "We could not open the scanner entry. Please try again.",
  retryError: "We could not reload ingredient guidance. Please try again.",
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
  bark: "#5C4A42",
  barkHover: "#493A34",
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
  "--dl-bark": colors.bark,
  "--dl-bark-hover": colors.barkHover,
  "--dl-text-primary": colors.textPrimary,
  "--dl-text-secondary": colors.textSecondary,
  "--dl-border-subtle": colors.borderSubtle,
  "--dl-notice-text": colors.noticeText,
  "--dl-notice-surface": colors.noticeSurface,
  "--dl-error-text": colors.errorText,
  "--dl-error-surface": colors.errorSurface,
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

type InFlightOperation = Exclude<
  IngredientScannerResultsOperation,
  null
>;

function getDisplayText(
  value: unknown,
  fallback: string,
): string {
  return isNonWhitespaceString(value) ? value.trim() : fallback;
}

function getGuidanceItemRecord(
  item: unknown,
): Record<string, unknown> {
  return (
    item !== null &&
    typeof item === "object"
  )
    ? item as Record<string, unknown>
    : {};
}

function getTone(
  tone: unknown,
): IngredientGuidanceTone {
  return isIngredientGuidanceTone(tone) ? tone : "neutral";
}

function getProfileName(
  profile: IngredientScannerResultsProfileSummary,
): string {
  return getDisplayText(
    (profile as { displayName?: unknown }).displayName,
    copy.unnamedProfile,
  );
}

function hasUsableProfileId(
  profile: IngredientScannerResultsProfileSummary | undefined,
): boolean {
  return isNonWhitespaceString(
    (profile as { profileId?: unknown } | undefined)?.profileId,
  );
}

function PageShell({
  activeOperation,
  canGoBackToReview,
  children,
  hasReviewRoute,
  onBackToReview,
  toastText,
}: {
  activeOperation: IngredientScannerResultsOperation;
  canGoBackToReview: boolean;
  children: ReactNode;
  hasReviewRoute: boolean;
  onBackToReview: () => void;
  toastText: string | null;
}) {
  const isBusy = activeOperation !== null;
  const backDisabled = isBusy || !canGoBackToReview || !hasReviewRoute;

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
            className={`${focusRing} inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-2 text-sm font-semibold text-[var(--dl-bark)] shadow-sm transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
            disabled={backDisabled}
            onClick={onBackToReview}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            {activeOperation === "back-to-review"
              ? copy.backToReviewPending
              : canGoBackToReview && hasReviewRoute
                ? copy.backToReview
                : copy.backToReviewBlocked}
          </button>
          <p
            className="text-sm font-bold tracking-[0.18em] text-[var(--dl-bark)]"
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
          role={toastText ? "status" : undefined}
        >
          {toastText ? (
            <div className="rounded-[8px] border border-[var(--dl-blush-strong)] bg-[var(--dl-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--dl-error-text)] shadow-sm">
              <span className="sr-only">{copy.toastLabel}: </span>
              {toastText}
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

function TrustCard() {
  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface)] text-[var(--dl-bark)]">
          <Info aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {copy.trustTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {copy.trustSupporting}
          </p>
        </div>
      </div>
    </section>
  );
}

function SourceCard({
  report,
}: {
  report: IngredientScannerResultsReport;
}) {
  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-bark)]">
          <ClipboardList aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {copy.sourceTitle}
          </h2>
          <p className="mt-2 text-base font-semibold leading-7 text-[var(--dl-bark)]">
            {report.sourceLabel}
          </p>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  report,
}: {
  report: IngredientScannerResultsReport;
}) {
  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-bark)]">
          <FileText aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {copy.summaryTitle}
          </h2>
          <p className="mt-2 text-base leading-7 text-[var(--dl-text-secondary)]">
            {report.summaryLabel}
          </p>
          {isNonWhitespaceString(report.ingredientCountLabel) ? (
            <p className="mt-3 rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-3 py-2 text-sm font-bold text-[var(--dl-bark)]">
              {report.ingredientCountLabel}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function GuidanceItemCard({
  item,
}: {
  item: unknown;
}) {
  const safeItem = getGuidanceItemRecord(item);
  const tone = getTone(safeItem.tone);
  const name = getDisplayText(
    safeItem.name,
    copy.unnamedIngredient,
  );
  const flagLabel = getDisplayText(
    safeItem.flagLabel,
    copy.unavailableFlag,
  );
  const summary = getDisplayText(
    safeItem.summary,
    copy.unavailableSummary,
  );
  const categoryLabel = safeItem.categoryLabel;
  const supporting = safeItem.supporting;
  const toneClassName =
    tone === "caution"
      ? "border-[var(--dl-peach-strong)] bg-[var(--dl-error-surface)]"
      : tone === "attention"
        ? "border-[var(--dl-sand)] bg-[var(--dl-notice-surface)]"
        : "border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)]";

  return (
    <li
      className={`rounded-[8px] border p-4 ${toneClassName}`}
      data-tone={tone}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-base font-bold text-[var(--dl-text-primary)]">
          {name}
        </h3>
        <p className="rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-3 py-1 text-xs font-bold text-[var(--dl-bark)]">
          {flagLabel}
        </p>
      </div>
      {isNonWhitespaceString(categoryLabel) ? (
        <p
          className="mt-3 text-xs font-bold tracking-[0.16em] text-[var(--dl-peach-strong)]"
          style={{ fontFamily: fonts.metadata }}
        >
          {categoryLabel}
        </p>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-[var(--dl-text-secondary)]">
        {summary}
      </p>
      {isNonWhitespaceString(supporting) ? (
        <p className="mt-3 border-t border-[var(--dl-border-subtle)] pt-3 text-sm leading-6 text-[var(--dl-text-secondary)]">
          {supporting}
        </p>
      ) : null}
    </li>
  );
}

function GuidanceList({
  items,
}: {
  items: unknown[];
}) {
  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
        {copy.guidanceListTitle}
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item, index) => (
          <GuidanceItemCard item={item} key={index} />
        ))}
      </ul>
    </section>
  );
}

function EmptyGuidanceCard() {
  return (
    <section
      className="rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-5 shadow-sm"
      data-testid="empty-guidance-card"
    >
      <h2 className="text-lg font-bold text-[var(--dl-bark)]">
        {copy.emptyTitle}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
        {copy.emptySupporting}
      </p>
    </section>
  );
}

function ProfileCard({
  report,
}: {
  report: IngredientScannerResultsReport | null;
}) {
  const profile = report?.selectedProfile;
  const hasProfile = profile !== undefined;
  const malformedProfile = hasProfile && !hasUsableProfileId(profile);
  const contextLabel = isNonWhitespaceString(
    (profile as { contextLabel?: unknown } | undefined)?.contextLabel,
  )
    ? profile?.contextLabel
    : null;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-surface-soft)] text-[var(--dl-bark)]">
          <UserRound aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
            {copy.profileTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {copy.profileSupporting}
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-4">
        <h3 className="text-base font-bold text-[var(--dl-bark)]">
          {profile ? getProfileName(profile) : copy.noProfile}
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
    </section>
  );
}

function HelperCard({
  report,
}: {
  report: IngredientScannerResultsReport | null;
}) {
  const helperLabel = isNonWhitespaceString(report?.helperLabel)
    ? report?.helperLabel
    : copy.helperFallback;
  const disclaimerLabel = isNonWhitespaceString(report?.disclaimerLabel)
    ? report?.disclaimerLabel
    : copy.disclaimerFallback;
  const savedLabel = isNonWhitespaceString(report?.savedLabel)
    ? report?.savedLabel
    : null;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[var(--dl-text-primary)]">
        {copy.helperTitle}
      </h2>
      <div className="mt-4 rounded-[8px] border border-[var(--dl-parchment)] bg-[var(--dl-surface)] p-4">
        <p className="text-sm font-bold text-[var(--dl-bark)]">
          {helperLabel}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
          {disclaimerLabel}
        </p>
        {savedLabel ? (
          <p className="mt-3 rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-3 py-2 text-sm font-bold text-[var(--dl-bark)]">
            {savedLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SavePanel({
  activeOperation,
  canSaveResult,
  hasSaveRoute,
  isOffline,
  isSaveAvailableOffline,
  onSaveResult,
  submission,
}: {
  activeOperation: IngredientScannerResultsOperation;
  canSaveResult: boolean;
  hasSaveRoute: boolean;
  isOffline: boolean;
  isSaveAvailableOffline: boolean;
  onSaveResult: () => void;
  submission: IngredientScannerResultSaveSubmission | null;
}) {
  const isBusy = activeOperation !== null;
  const saveAvailable =
    canSaveResult &&
    hasSaveRoute &&
    (!isOffline || isSaveAvailableOffline);
  const disabled = isBusy || !saveAvailable || submission === null;
  const label =
    activeOperation === "save-result"
      ? copy.savePending
      : !canSaveResult || !hasSaveRoute || submission === null
        ? copy.saveBlocked
        : isOffline && !isSaveAvailableOffline
          ? copy.saveReconnect
          : copy.saveResult;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <button
        className={`${focusRing} inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] px-4 py-2 text-sm font-bold text-[var(--dl-bark)] transition hover:border-[var(--dl-sand)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
        disabled={disabled}
        onClick={onSaveResult}
        type="button"
      >
        <Bookmark aria-hidden="true" className="h-4 w-4" />
        {label}
      </button>
    </section>
  );
}

function ScanAnotherPanel({
  activeOperation,
  canScanAnotherProduct,
  onScanAnotherProduct,
}: {
  activeOperation: IngredientScannerResultsOperation;
  canScanAnotherProduct: boolean;
  onScanAnotherProduct: () => void;
}) {
  const isBusy = activeOperation !== null;
  const disabled = isBusy || !canScanAnotherProduct;

  return (
    <section className="rounded-[8px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-sm">
      <button
        className={`${focusRing} inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 py-3 text-base font-bold text-white transition hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
        disabled={disabled}
        onClick={onScanAnotherProduct}
        type="button"
      >
        <RotateCcw aria-hidden="true" className="h-4 w-4" />
        {activeOperation === "scan-another-product"
          ? copy.scanAnotherPending
          : canScanAnotherProduct
            ? copy.scanAnother
            : copy.scanAnotherBlocked}
      </button>
    </section>
  );
}

export default function IngredientScannerResultsScreen({
  state = "ready",
  report = null,
  isOffline = false,
  canGoBackToReview = true,
  canScanAnotherProduct = true,
  canSaveResult = true,
  isSaveAvailableOffline = false,
  onBackToReview,
  onScanAnotherProduct,
  onSaveResult,
  onRetryLoad,
}: IngredientScannerResultsScreenProps) {
  const mountedRef = useRef(false);
  const inFlightRef = useRef<InFlightOperation | null>(null);
  const [activeOperation, setActiveOperation] =
    useState<IngredientScannerResultsOperation>(null);
  const [toastText, setToastText] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastText) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (mountedRef.current) {
        setToastText(null);
      }
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [toastText]);

  const resolvedState = isIngredientScannerResultsState(state)
    ? state
    : "error";
  const hasReport = hasUsableIngredientScannerResultsReport(report);
  const readyReport = hasReport ? report : null;
  const submission = getIngredientScannerResultSaveSubmission(readyReport);
  const isBusy = activeOperation !== null;
  const showEmpty =
    resolvedState === "empty" ||
    (resolvedState === "ready" &&
      readyReport !== null &&
      readyReport.guidanceItems.length === 0);

  async function runOperation(
    operation: InFlightOperation,
    action: (() => void | Promise<void>) | undefined,
    failureText: string,
    successText?: string,
  ) {
    if (inFlightRef.current !== null || action === undefined) {
      return;
    }

    inFlightRef.current = operation;
    setActiveOperation(operation);
    setToastText(null);

    try {
      await action();
      if (successText && mountedRef.current) {
        setToastText(successText);
      }
    } catch {
      if (mountedRef.current) {
        setToastText(failureText);
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

  function activateBackToReview() {
    if (
      !canGoBackToReview ||
      readyReport === null ||
      isBusy
    ) {
      return;
    }

    void runOperation(
      "back-to-review",
      () => onBackToReview(readyReport.draftId),
      copy.backError,
    );
  }

  function activateScanAnotherProduct() {
    if (!canScanAnotherProduct || isBusy) {
      return;
    }

    void runOperation(
      "scan-another-product",
      onScanAnotherProduct,
      copy.scanAnotherError,
    );
  }

  function activateSaveResult() {
    const saveAvailable =
      canSaveResult &&
      onSaveResult !== undefined &&
      (!isOffline || isSaveAvailableOffline);

    if (
      !saveAvailable ||
      submission === null ||
      onSaveResult === undefined ||
      isBusy
    ) {
      return;
    }

    void runOperation(
      "save-result",
      () => onSaveResult(submission),
      copy.saveError,
      copy.saveDone,
    );
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
        canGoBackToReview={canGoBackToReview}
        hasReviewRoute={readyReport !== null}
        onBackToReview={activateBackToReview}
        toastText={toastText}
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
                className={`${focusRing} mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--dl-bark)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none`}
                disabled={isBusy}
                onClick={activateRetryLoad}
                type="button"
              >
                {activeOperation === "retry-load"
                  ? copy.retryPending
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
        canGoBackToReview={canGoBackToReview}
        hasReviewRoute={readyReport !== null}
        onBackToReview={activateBackToReview}
        toastText={toastText}
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

  if (resolvedState === "error" || (resolvedState === "ready" && readyReport === null)) {
    return renderErrorExperience();
  }

  return (
    <PageShell
      activeOperation={activeOperation}
      canGoBackToReview={canGoBackToReview}
      hasReviewRoute={readyReport !== null}
      onBackToReview={activateBackToReview}
      toastText={toastText}
    >
      <main className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] lg:items-start">
        <div className="flex flex-col gap-5">
          <IntroSection />
          {isOffline ? <OfflineBanner /> : null}
          <TrustCard />
          {readyReport ? <SourceCard report={readyReport} /> : null}
          {readyReport ? <SummaryCard report={readyReport} /> : null}
          {showEmpty || readyReport === null ? (
            <EmptyGuidanceCard />
          ) : (
            <GuidanceList items={readyReport.guidanceItems} />
          )}
        </div>
        <section className="flex flex-col gap-5" aria-label="Ingredient guidance context">
          <ProfileCard report={readyReport} />
          <HelperCard report={readyReport} />
          <SavePanel
            activeOperation={activeOperation}
            canSaveResult={canSaveResult}
            hasSaveRoute={onSaveResult !== undefined}
            isOffline={isOffline}
            isSaveAvailableOffline={isSaveAvailableOffline}
            onSaveResult={activateSaveResult}
            submission={submission}
          />
          <ScanAnotherPanel
            activeOperation={activeOperation}
            canScanAnotherProduct={canScanAnotherProduct}
            onScanAnotherProduct={activateScanAnotherProduct}
          />
        </section>
      </main>
    </PageShell>
  );
}
