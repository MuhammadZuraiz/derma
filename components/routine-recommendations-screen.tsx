import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type RoutineRecommendationsState =
  | "loading"
  | "ready"
  | "limited-availability"
  | "empty"
  | "error";

export type RoutinePeriod = "morning" | "evening";

export type RoutineOperation =
  | "back"
  | "open-store"
  | "open-product"
  | "open-alternatives"
  | "retry-load"
  | null;

export interface ActiveProductContext {
  stepId: string;
  productId: string;
}

export interface RoutineProductRecommendation {
  productId: string;
  name: string;
  brand: string;
  imageUrl?: string;
  priceLabel?: string;
  availabilityLabel: string;
  description?: string;
  isAvailable: boolean;
}

export interface RoutineStep {
  id: string;
  orderLabel: string;
  title: string;
  categoryLabel: string;
  purpose: string;
  usage: string;
  frequencyLabel: string;
  caution?: string;
  rationale?: string;
  recommendedProducts: RoutineProductRecommendation[];
}

export interface WeeklyGuidanceItem {
  id: string;
  title: string;
  frequencyLabel: string;
  description: string;
  caution?: string;
}

export interface RoutinePeriodContent {
  title: string;
  summary: string;
  completionTimeLabel?: string;
  steps: RoutineStep[];
}

export interface RoutineRecommendationsReport {
  routineId: string;
  profileName: string;
  generatedAtLabel: string;
  saveLabel: string;
  morning: RoutinePeriodContent;
  evening: RoutinePeriodContent;
  weeklyGuidance: WeeklyGuidanceItem[];
}

export interface RoutineRecommendationsScreenProps {
  state?: RoutineRecommendationsState;
  report?: RoutineRecommendationsReport | null;
  initialPeriod?: RoutinePeriod;
  isOffline?: boolean;
  canOpenStore?: boolean;
  onBack: () => void | Promise<void>;
  onOpenStore: () => void | Promise<void>;
  onOpenProduct?: (productId: string) => void | Promise<void>;
  onOpenAlternatives?: (stepId: string) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export const copy = {
  contextLabel: "YOUR ROUTINE",
  back: "Back",
  backToReport: "Back to report",
  profilePrefix: "Routine for",
  savedOnDevice: "Saved on this device",
  loadingHeading: "Loading your routine…",
  loadingSupporting:
    "We are preparing a clear morning and evening plan from your completed snapshot.",
  heading: "Your personalised routine",
  supporting:
    "Start with a simple routine based on your completed skin snapshot. Introduce changes gradually and adjust based on how your skin responds.",
  guidanceBoundary:
    "This routine provides skincare guidance, not medical advice.",
  limitedAvailability:
    "Some recommended products are not currently available in your region. Your routine steps remain usable.",
  morning: "Morning",
  evening: "Evening",
  stepsLabel: "steps",
  noSteps: "No daily steps are available for this routine period.",
  whyThisStep: "Why this step?",
  alternatives: "See alternatives",
  openingAlternatives: "Opening alternatives…",
  recommendedProduct: "Recommended product",
  recommendedProducts: "Recommended products",
  optionalProduct: "Optional store recommendation",
  productAvailable: "Available",
  productUnavailable: "Currently unavailable",
  productImageUnavailable: "Product image unavailable",
  viewProduct: "View product",
  openingProduct: "Opening product…",
  noMatchedProduct:
    "No DermaLens store product is currently matched to this step. You can still follow the routine using a suitable product you already own.",
  weeklyHeading: "Weekly guidance",
  weeklyHelper: "Use these occasional steps only as recommended.",
  safetyHeading: "Introduce products gradually",
  safetyPatchTest:
    "Introduce one new product at a time. Patch test first and stop using a product if irritation occurs.",
  safetyEscalation:
    "For persistent or severe irritation, seek advice from a qualified healthcare professional.",
  storeNote:
    "You can follow this routine with suitable products you already own. Store recommendations are optional.",
  shopRoutine: "Shop routine products",
  openingStore: "Opening store…",
  reconnectToShop: "Reconnect to shop products",
  storeUnavailable: "Store unavailable right now",
  retry: "Try loading again",
  retrying: "Retrying…",
  emptyHeading: "Your routine is not available yet",
  emptySupporting:
    "Return to your report and try preparing the routine again.",
  errorHeading: "We could not display your routine",
  errorSupporting:
    "Try loading the routine again or return to your detailed report.",
  backError: "We could not return to your report. Please try again.",
  storeError: "We could not open the store. Please try again.",
  productError: "We could not open this product. Please try again.",
  alternativesError:
    "We could not open the alternatives. Please try again.",
  retryError: "We could not reload your routine. Please try again.",
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
  display: '"DM Serif Display", Georgia, serif',
  ui: '"DM Sans", system-ui, sans-serif',
  metadata: '"Space Mono", monospace',
} as const;

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

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

type IconProps = { className?: string };

function ArrowLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m14.5 6-6 6 6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function InfoIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.5v5m0-8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
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

function Spinner({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={`animate-spin motion-reduce:animate-none ${className}`} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity=".25" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function ToastRegion({
  aboveStickyFooter,
  message,
}: {
  aboveStickyFooter: boolean;
  message: string | null;
}) {
  const positionClass = aboveStickyFooter
    ? "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_144px)]"
    : "bottom-[max(24px,env(safe-area-inset-bottom))]";

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 z-50 mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${positionClass} ${
        message ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      data-testid="toast-region"
      role="status"
      style={themeStyle}
    >
      {message ?? ""}
    </div>
  );
}

function displayName(value: string): string {
  return value.trim() || "?";
}

function ProfileInitial({ profileName }: { profileName: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] font-[family-name:var(--dl-display)] text-xl text-[var(--dl-bark)]">
      {displayName(profileName).charAt(0).toUpperCase()}
    </span>
  );
}

function RoutineTopBar({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
  return (
    <div className="grid min-h-12 grid-cols-[44px_1fr_44px] items-center gap-2">
      <button
        aria-label={copy.back}
        className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`}
        disabled={disabled}
        onClick={onBack}
        type="button"
      >
        <ArrowLeftIcon />
      </button>
      <p className="text-center font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </p>
      <span aria-hidden="true" className="block h-11 w-11" />
    </div>
  );
}

function RoutineProfileRow({ report }: { report: RoutineRecommendationsReport }) {
  const saveLabel = report.saveLabel.trim() || copy.savedOnDevice;
  return (
    <div className="mt-3 flex min-w-0 items-center gap-2.5">
      <ProfileInitial profileName={report.profileName} />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-4 text-[var(--dl-text-secondary)]">{copy.profilePrefix}</p>
        <p className="truncate text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{displayName(report.profileName)}</p>
        <p className="truncate text-xs leading-4 text-[var(--dl-text-secondary)]">{report.generatedAtLabel}</p>
      </div>
      <p className="flex max-w-[150px] items-center gap-1 text-right text-xs leading-4 text-[var(--dl-text-secondary)]">
        <ShieldIcon className="h-4 w-4 shrink-0 text-[var(--dl-peach-strong)]" />
        <span>{saveLabel}</span>
      </p>
    </div>
  );
}

function GuidanceBoundaryNote() {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-parchment)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <InfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <span>{copy.guidanceBoundary}</span>
    </p>
  );
}

function LimitedAvailabilityBanner() {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]" role="status">
      <WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{copy.limitedAvailability}</p>
    </div>
  );
}

function PeriodSwitcher({ disabled, onSelect, selectedPeriod }: { disabled: boolean; onSelect: (period: RoutinePeriod) => void; selectedPeriod: RoutinePeriod }) {
  const options: Array<{ id: RoutinePeriod; label: string }> = [
    { id: "morning", label: copy.morning },
    { id: "evening", label: copy.evening },
  ];
  return (
    <div aria-label="Routine period" className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--dl-parchment)] p-1.5" role="group">
      {options.map(({ id, label }) => {
        const selected = id === selectedPeriod;
        return (
          <button
            aria-pressed={selected}
            className={`${focusRing} min-h-11 rounded-xl px-3 text-sm font-semibold leading-5 transition-colors disabled:cursor-not-allowed motion-reduce:transition-none ${selected ? "bg-[var(--dl-bark)] text-[var(--dl-page)]" : "bg-transparent text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)]"}`}
            disabled={disabled}
            key={id}
            onClick={() => onSelect(id)}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function RoutineSummaryCard({ routine }: { routine: RoutinePeriodContent }) {
  return (
    <section className="mt-3 rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--dl-display)] text-[26px] font-normal leading-8 text-[var(--dl-text-primary)]">{routine.title}</h2>
        <span className="rounded-full bg-[var(--dl-surface)] px-2.5 py-1 text-xs font-semibold leading-4 text-[var(--dl-bark)]">{routine.steps.length} {copy.stepsLabel}</span>
      </div>
      <p className="mt-1.5 text-sm leading-5 text-[var(--dl-text-secondary)]">{routine.summary}</p>
      {routine.completionTimeLabel ? <p className="mt-2 font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.08em] text-[var(--dl-dusk)]">{routine.completionTimeLabel}</p> : null}
    </section>
  );
}

function ProductImage({ product }: { product: RoutineProductRecommendation }) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => setHasError(false), [product.imageUrl]);

  if (!product.imageUrl || hasError) {
    return (
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-[var(--dl-parchment)] p-2 text-center text-[11px] leading-4 text-[var(--dl-text-secondary)] max-[374px]:h-16 max-[374px]:w-16" data-testid={`product-image-placeholder-${product.productId}`}>
        {copy.productImageUnavailable}
      </div>
    );
  }

  return (
    <img
      alt={`${product.brand} ${product.name}`}
      className="h-[72px] w-[72px] shrink-0 rounded-xl bg-[var(--dl-surface)] object-contain p-1 max-[374px]:h-16 max-[374px]:w-16"
      draggable={false}
      onError={() => setHasError(true)}
      src={product.imageUrl}
    />
  );
}

function ProductRecommendationCard({
  activeOperation,
  activeProductContext,
  disabled,
  onOpenProduct,
  product,
  stepId,
}: {
  activeOperation: RoutineOperation;
  activeProductContext: ActiveProductContext | null;
  disabled: boolean;
  onOpenProduct?: (stepId: string, productId: string) => void;
  product: RoutineProductRecommendation;
  stepId: string;
}) {
  const isOpening =
    activeOperation === "open-product" &&
    activeProductContext?.stepId === stepId &&
    activeProductContext?.productId === product.productId;

  const availabilityLabel =
    product.availabilityLabel.trim() ||
    (product.isAvailable ? copy.productAvailable : copy.productUnavailable);

  return (
    <li className="rounded-[14px] bg-[var(--dl-surface-soft)] p-3">
      <div className="flex gap-3">
        <ProductImage product={product} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-[var(--dl-dusk)]">{copy.optionalProduct}</p>
          <p className="mt-0.5 text-xs leading-4 text-[var(--dl-text-secondary)]">{product.brand}</p>
          <h4 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{product.name}</h4>
          {product.priceLabel ? <p className="mt-0.5 text-sm font-semibold leading-5 text-[var(--dl-bark)]">{product.priceLabel}</p> : null}
          <p className={`mt-0.5 text-xs leading-4 ${product.isAvailable ? "text-[var(--dl-text-secondary)]" : "text-[var(--dl-warning-text)]"}`}>{availabilityLabel}</p>
        </div>
      </div>
      {product.description ? <p className="mt-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{product.description}</p> : null}
      {onOpenProduct ? (
        <button
          className={`${focusRing} mt-2 min-h-11 rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline underline-offset-4 disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={disabled || !product.isAvailable}
          onClick={() => onOpenProduct(stepId, product.productId)}
          type="button"
        >
          {isOpening ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" />{copy.openingProduct}</span> : copy.viewProduct}
        </button>
      ) : null}
    </li>
  );
}

function RoutineStepCard({
  activeAlternativesStepId,
  activeOperation,
  activeProductContext,
  disabled,
  onOpenAlternatives,
  onOpenProduct,
  step,
}: {
  activeAlternativesStepId: string | null;
  activeOperation: RoutineOperation;
  activeProductContext: ActiveProductContext | null;
  disabled: boolean;
  onOpenAlternatives?: (stepId: string) => void;
  onOpenProduct?: (stepId: string, productId: string) => void;
  step: RoutineStep;
}) {
  const isOpeningAlternatives = activeOperation === "open-alternatives" && activeAlternativesStepId === step.id;
  const count = step.recommendedProducts.length;
  return (
    <article className="mt-3 rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4" data-testid={`routine-step-${step.id}`}>
      <header className="flex items-start gap-3">
        <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] px-2 text-xs font-semibold leading-4 text-[var(--dl-bark)]">{step.orderLabel}</span>
        <div>
          <h3 className="text-[16px] font-semibold leading-[22px] text-[var(--dl-text-primary)]">{step.title}</h3>
          <p className="mt-0.5 text-xs leading-4 text-[var(--dl-dusk)]">{step.categoryLabel}</p>
        </div>
      </header>
      <p className="mt-3 text-sm leading-5 text-[var(--dl-text-secondary)]">{step.purpose}</p>
      <p className="mt-2 text-sm leading-5 text-[var(--dl-text-primary)]">{step.usage}</p>
      <span className="mt-3 inline-flex rounded-full bg-[var(--dl-parchment)] px-2.5 py-1 text-xs font-semibold leading-4 text-[var(--dl-bark)]">{step.frequencyLabel}</span>
      {step.caution ? <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]"><WarningIcon className="mt-0.5 h-5 w-5 shrink-0" /><span>{step.caution}</span></p> : null}
      {step.rationale ? (
        <details className="mt-3 border-y border-[var(--dl-border-subtle)]">
          <summary className={`${focusRing} flex min-h-11 cursor-pointer items-center text-sm font-semibold leading-5 text-[var(--dl-bark)]`}>{copy.whyThisStep}</summary>
          <p className="pb-3 text-sm leading-5 text-[var(--dl-text-secondary)]">{step.rationale}</p>
        </details>
      ) : null}
      <div className="mt-3">
        {count > 0 ? (
          <>
            <h4 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{count === 1 ? copy.recommendedProduct : copy.recommendedProducts}</h4>
            <ul className="mt-2 space-y-2" data-testid={`product-list-${step.id}`}>
              {step.recommendedProducts.map((product) => (
                <ProductRecommendationCard
                  activeOperation={activeOperation}
                  activeProductContext={activeProductContext}
                  disabled={disabled}
                  key={`${step.id}:${product.productId}`}
                  onOpenProduct={onOpenProduct}
                  product={product}
                  stepId={step.id}
                />
              ))}
            </ul>
          </>
        ) : <p className="rounded-xl bg-[var(--dl-surface-soft)] p-3 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.noMatchedProduct}</p>}
      </div>
      {onOpenAlternatives ? (
        <button
          className={`${focusRing} mt-3 min-h-11 rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline underline-offset-4 disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={disabled}
          onClick={() => onOpenAlternatives(step.id)}
          type="button"
        >
          {isOpeningAlternatives ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" />{copy.openingAlternatives}</span> : copy.alternatives}
        </button>
      ) : null}
    </article>
  );
}

function WeeklyGuidanceCard({ items }: { items: WeeklyGuidanceItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-4 rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <h2 className="text-[16px] font-semibold leading-[22px] text-[var(--dl-text-primary)]">{copy.weeklyHeading}</h2>
      <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.weeklyHelper}</p>
      <ul className="mt-2 divide-y divide-[var(--dl-border-subtle)]" data-testid="weekly-guidance-list">
        {items.map((item) => (
          <li className="py-3 first:pt-2 last:pb-0" key={item.id}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{item.title}</h3>
              <span className="rounded-full bg-[var(--dl-parchment)] px-2.5 py-1 text-xs font-semibold leading-4 text-[var(--dl-bark)]">{item.frequencyLabel}</span>
            </div>
            <p className="mt-1 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{item.description}</p>
            {item.caution ? <p className="mt-2 text-[13px] leading-[18px] text-[var(--dl-warning-text)]">{item.caution}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SafetyCard() {
  return (
    <section className="mt-4 rounded-[16px] bg-[var(--dl-parchment)] p-4">
      <h2 className="text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{copy.safetyHeading}</h2>
      <p className="mt-1.5 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.safetyPatchTest}</p>
      <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.safetyEscalation}</p>
    </section>
  );
}

function StoreNote() {
  return (
    <p className="mt-3 flex items-start gap-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <span>{copy.storeNote}</span>
    </p>
  );
}

function getStoreButtonLabel({ activeOperation, canOpenStore, isOffline }: { activeOperation: RoutineOperation; canOpenStore: boolean; isOffline: boolean }): string {
  if (activeOperation === "open-store") return copy.openingStore;
  if (!canOpenStore) return isOffline ? copy.reconnectToShop : copy.storeUnavailable;
  return copy.shopRoutine;
}

function RoutineFooter({
  activeOperation,
  canOpenStore,
  disabled,
  isOffline,
  onBack,
  onOpenStore,
  storeLabelOverride,
}: {
  activeOperation: RoutineOperation;
  canOpenStore: boolean;
  disabled: boolean;
  isOffline: boolean;
  onBack: () => void;
  onOpenStore: () => void;
  storeLabelOverride?: string;
}) {
  const openingStore = activeOperation === "open-store";
  return (
    <footer className="sticky bottom-0 z-20 -mx-6 mt-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-sm max-[374px]:-mx-5 max-[374px]:px-5">
      <button
        className={`${focusRing} flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] motion-reduce:transition-none`}
        disabled={disabled || !canOpenStore}
        onClick={onOpenStore}
        type="button"
      >
        {openingStore ? <Spinner className="mr-2 h-4 w-4" /> : null}
        {storeLabelOverride ?? getStoreButtonLabel({ activeOperation, canOpenStore, isOffline })}
      </button>
      <button
        className={`${focusRing} mt-1.5 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={disabled}
        onClick={onBack}
        type="button"
      >
        {copy.backToReport}
      </button>
    </footer>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--dl-parchment)] motion-reduce:animate-none ${className}`} />;
}

function LoadingExperience({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
  return (
    <>
      <RoutineTopBar disabled={disabled} onBack={onBack} />
      <div aria-live="polite" role="status">
        <div className="mt-3 flex items-center gap-2.5"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-36" /></div></div>
        <h1 className="mt-5 font-[family-name:var(--dl-display)] text-[36px] font-normal leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.loadingHeading}</h1>
        <p className="mt-2 max-w-[390px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.loadingSupporting}</p>
      </div>
      <Skeleton className="mt-4 h-14 w-full" />
      <div className="mt-3 space-y-3"><Skeleton className="h-44 w-full" /><Skeleton className="h-44 w-full" /><Skeleton className="h-44 w-full" /></div>
      <RoutineFooter activeOperation={null} canOpenStore={false} disabled isOffline={false} onBack={onBack} onOpenStore={() => undefined} storeLabelOverride={copy.shopRoutine} />
    </>
  );
}

function RecoveryExperience({
  activeOperation,
  disabled,
  kind,
  onBack,
  onRetry,
}: {
  activeOperation: RoutineOperation;
  disabled: boolean;
  kind: "empty" | "error";
  onBack: () => void;
  onRetry?: () => void;
}) {
  const error = kind === "error";
  const isRetrying = activeOperation === "retry-load";

  return (
    <>
      <RoutineTopBar disabled={disabled} onBack={onBack} />
      <div role={error ? "alert" : undefined}>
        <div className="mx-auto mt-12 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-peach-strong)]">
          {error ? <WarningIcon className="h-9 w-9" /> : <InfoIcon className="h-9 w-9" />}
        </div>
        <h1 className="mt-5 text-center font-[family-name:var(--dl-display)] text-[36px] font-normal leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{error ? copy.errorHeading : copy.emptyHeading}</h1>
        <p className="mx-auto mt-2 max-w-[390px] text-center text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{error ? copy.errorSupporting : copy.emptySupporting}</p>
      </div>
      <div className="mx-auto mt-6 max-w-[440px]">
        {onRetry ? (
          <button
            className={`${focusRing} flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
            disabled={disabled}
            onClick={onRetry}
            type="button"
          >
            {isRetrying ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {isRetrying ? copy.retrying : copy.retry}
          </button>
        ) : null}
        <button className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button">{copy.backToReport}</button>
      </div>
    </>
  );
}

function ReadyExperience({
  activeAlternativesStepId,
  activeOperation,
  activeProductContext,
  canOpenStore,
  disabled,
  effectiveState,
  isOffline,
  onBack,
  onOpenAlternatives,
  onOpenProduct,
  onOpenStore,
  report,
  selectedPeriod,
  setSelectedPeriod,
}: {
  activeAlternativesStepId: string | null;
  activeOperation: RoutineOperation;
  activeProductContext: ActiveProductContext | null;
  canOpenStore: boolean;
  disabled: boolean;
  effectiveState: "ready" | "limited-availability";
  isOffline: boolean;
  onBack: () => void;
  onOpenAlternatives?: (stepId: string) => void;
  onOpenProduct?: (stepId: string, productId: string) => void;
  onOpenStore: () => void;
  report: RoutineRecommendationsReport;
  selectedPeriod: RoutinePeriod;
  setSelectedPeriod: (period: RoutinePeriod) => void;
}) {
  const selectedRoutine = selectedPeriod === "morning" ? report.morning : report.evening;
  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] lg:gap-12">
        <div>
          <RoutineTopBar disabled={disabled} onBack={onBack} />
          <RoutineProfileRow report={report} />
          <h1 className="mt-[18px] font-[family-name:var(--dl-display)] text-[36px] font-normal leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.heading}</h1>
          <p className="mt-2 max-w-[520px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.supporting}</p>
          <GuidanceBoundaryNote />
          {effectiveState === "limited-availability" ? <LimitedAvailabilityBanner /> : null}
          <PeriodSwitcher disabled={disabled} onSelect={setSelectedPeriod} selectedPeriod={selectedPeriod} />
          <RoutineSummaryCard routine={selectedRoutine} />
        </div>
        <div className="lg:pt-3">
          {selectedRoutine.steps.length > 0 ? (
            <div data-testid="daily-step-list">
              {selectedRoutine.steps.map((step) => (
                <RoutineStepCard
                  activeAlternativesStepId={activeAlternativesStepId}
                  activeOperation={activeOperation}
                  activeProductContext={activeProductContext}
                  disabled={disabled}
                  key={step.id}
                  onOpenAlternatives={onOpenAlternatives}
                  onOpenProduct={onOpenProduct}
                  step={step}
                />
              ))}
            </div>
          ) : <p className="mt-4 rounded-xl bg-[var(--dl-surface-soft)] p-3 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.noSteps}</p>}
          <WeeklyGuidanceCard items={report.weeklyGuidance} />
          <SafetyCard />
          <StoreNote />
          <RoutineFooter activeOperation={activeOperation} canOpenStore={canOpenStore} disabled={disabled} isOffline={isOffline} onBack={onBack} onOpenStore={onOpenStore} />
        </div>
      </div>
    </>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-[var(--dl-page)] px-6 pb-0 pt-[max(20px,env(safe-area-inset-top))] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)] max-[374px]:px-5 md:mx-auto md:max-w-[760px] lg:max-w-[1180px]" style={themeStyle}>
      {children}
    </main>
  );
}

export default function RoutineRecommendationsScreen({
  state = "loading",
  report = null,
  initialPeriod = "morning",
  isOffline = false,
  canOpenStore = true,
  onBack,
  onOpenStore,
  onOpenProduct,
  onOpenAlternatives,
  onRetryLoad,
}: RoutineRecommendationsScreenProps) {
  const mountedRef = useRef(false);
  const inFlightRef = useRef<RoutineOperation>(null);
  const [activeOperation, setActiveOperation] = useState<RoutineOperation>(null);
  const [activeProductContext, setActiveProductContext] = useState<ActiveProductContext | null>(null);
  const [activeAlternativesStepId, setActiveAlternativesStepId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<RoutinePeriod>(initialPeriod);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => setSelectedPeriod(initialPeriod), [initialPeriod]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const effectiveState: RoutineRecommendationsState =
    (state === "ready" || state === "limited-availability") && report === null
      ? "error"
      : state;

  const hasRenderableRoutine =
    (effectiveState === "ready" || effectiveState === "limited-availability") &&
    report !== null;

  const operationPending = activeOperation !== null;
  const hasStickyFooter = effectiveState === "loading" || hasRenderableRoutine;

  const runOperation = useCallback(async (
    operation: Exclude<RoutineOperation, null>,
    callback: () => void | Promise<void>,
    errorMessage: string,
    context?: {
      productId?: string;
      productStepId?: string;
      alternativesStepId?: string;
    },
  ) => {
    if (inFlightRef.current !== null) return;
    inFlightRef.current = operation;
    setToastMessage(null);
    setActiveOperation(operation);
    setActiveProductContext(
      context?.productId && context?.productStepId
        ? {
            productId: context.productId,
            stepId: context.productStepId,
          }
        : null,
    );
    setActiveAlternativesStepId(context?.alternativesStepId ?? null);
    try {
      await callback();
    } catch {
      if (mountedRef.current) setToastMessage(errorMessage);
    } finally {
      if (mountedRef.current) {
        setActiveOperation(null);
        setActiveProductContext(null);
        setActiveAlternativesStepId(null);
      }
      inFlightRef.current = null;
    }
  }, []);

  const handleBack = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) return;
    void runOperation("back", onBack, copy.backError);
  }, [onBack, operationPending, runOperation]);

  const handleOpenStore = useCallback(() => {
    if (!hasRenderableRoutine || !canOpenStore || operationPending || inFlightRef.current !== null) return;
    void runOperation("open-store", onOpenStore, copy.storeError);
  }, [canOpenStore, hasRenderableRoutine, onOpenStore, operationPending, runOperation]);

  const handleOpenProduct = useCallback((stepId: string, productId: string) => {
    if (!hasRenderableRoutine || !onOpenProduct || operationPending || inFlightRef.current !== null) return;
    void runOperation(
      "open-product",
      () => onOpenProduct(productId),
      copy.productError,
      { productId, productStepId: stepId },
    );
  }, [hasRenderableRoutine, onOpenProduct, operationPending, runOperation]);

  const handleOpenAlternatives = useCallback((stepId: string) => {
    if (!hasRenderableRoutine || !onOpenAlternatives || operationPending || inFlightRef.current !== null) return;
    void runOperation("open-alternatives", () => onOpenAlternatives(stepId), copy.alternativesError, { alternativesStepId: stepId });
  }, [hasRenderableRoutine, onOpenAlternatives, operationPending, runOperation]);

  const handleRetry = useCallback(() => {
    if (!onRetryLoad || operationPending || inFlightRef.current !== null) return;
    void runOperation("retry-load", onRetryLoad, copy.retryError);
  }, [onRetryLoad, operationPending, runOperation]);

  let content: ReactNode;
  if (effectiveState === "loading") {
    content = <LoadingExperience disabled={operationPending} onBack={handleBack} />;
  } else if (effectiveState === "empty" || effectiveState === "error") {
    content = <RecoveryExperience activeOperation={activeOperation} disabled={operationPending} kind={effectiveState} onBack={handleBack} onRetry={onRetryLoad ? handleRetry : undefined} />;
  } else if (report) {
    content = (
      <ReadyExperience
        activeAlternativesStepId={activeAlternativesStepId}
        activeOperation={activeOperation}
        activeProductContext={activeProductContext}
        canOpenStore={canOpenStore}
        disabled={operationPending}
        effectiveState={effectiveState}
        isOffline={isOffline}
        onBack={handleBack}
        onOpenAlternatives={onOpenAlternatives ? handleOpenAlternatives : undefined}
        onOpenProduct={onOpenProduct ? handleOpenProduct : undefined}
        onOpenStore={handleOpenStore}
        report={report}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={(period) => {
          if (operationPending || inFlightRef.current !== null) return;
          setSelectedPeriod(period);
        }}
      />
    );
  } else {
    content = <RecoveryExperience activeOperation={activeOperation} disabled={operationPending} kind="error" onBack={handleBack} onRetry={onRetryLoad ? handleRetry : undefined} />;
  }

  return (
    <>
      <AppShell>{content}</AppShell>
      <ToastRegion aboveStickyFooter={hasStickyFooter} message={toastMessage} />
    </>
  );
}
