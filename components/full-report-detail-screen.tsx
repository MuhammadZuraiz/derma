import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export type FullReportDetailState =
  | "loading"
  | "ready"
  | "limited-confidence"
  | "error";

export type FullReportOperation =
  | "back"
  | "open-routine"
  | "share"
  | "download"
  | "retake-photo"
  | "review-classifications"
  | "retry-load"
  | "report-map-error"
  | null;

export type FindingTone = "neutral" | "attention" | "positive";
export type MapLegendTone = "peach" | "sand" | "stone" | "warning";

export interface SkinClassificationEstimate {
  label: string;
  supporting?: string;
  confidenceLabel?: string;
}

export interface ReportClassificationSummary {
  skinType: SkinClassificationEstimate;
  skinTone: SkinClassificationEstimate;
}

export interface FaceMapLegendItem {
  id: string;
  label: string;
  tone?: MapLegendTone;
}

export interface ReportFaceMap {
  imageUrl?: string;
  alt: string;
  legend: FaceMapLegendItem[];
}

export interface RegionFinding {
  id: string;
  title: string;
  levelLabel: string;
  description: string;
  stateLabel?: string;
  spreadLabel?: string;
  metricLabel?: string;
  tone?: FindingTone;
}

export interface ReportRegion {
  id: string;
  label: string;
  summary?: string;
  faceMapImageUrl?: string;
  findings: RegionFinding[];
}

export interface NaturalFeatureNotation {
  id: string;
  title: string;
  description?: string;
  regionLabel?: string;
}

export interface EstimatedMetric {
  id: string;
  label: string;
  value: string;
  supporting?: string;
}

export interface PhotoQualityContextItem {
  id: string;
  label: string;
  valueLabel: string;
  supporting?: string;
}

export interface PhotoQualityContext {
  outcomeLabel: string;
  supporting: string;
  items: PhotoQualityContextItem[];
}

export interface FullReportDetailReport {
  reportId: string;
  profileName: string;
  generatedAtLabel: string;
  saveLabel: string;
  score?: number;
  categoryLabel: string;
  classificationSummary: ReportClassificationSummary;
  faceMap: ReportFaceMap;
  regions: ReportRegion[];
  naturalFeatures: NaturalFeatureNotation[];
  estimatedMetrics: EstimatedMetric[];
  photoQuality: PhotoQualityContext;
}

export interface FullReportDetailScreenProps {
  state?: FullReportDetailState;
  report?: FullReportDetailReport | null;
  initialSelectedRegionId?: string;
  showFaceMapInitially?: boolean;
  isOffline?: boolean;
  canBuildRoutine?: boolean;
  onBack: () => void | Promise<void>;
  onOpenRoutine: () => void | Promise<void>;
  onShareReport?: () => void | Promise<void>;
  onDownloadReport?: () => void | Promise<void>;
  onRetakePhoto?: () => void | Promise<void>;
  onReviewClassifications?: () => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
  onFaceMapLoadError?: () => void | Promise<void>;
}

export const copy = {
  contextLabel: "DETAILED REPORT",
  back: "Back",
  reportActions: "Report actions",
  profilePrefix: "Detailed report for",
  savedOnDevice: "Saved on this device",
  loadingHeading: "Loading your detailed report…",
  loadingSupporting:
    "We are preparing the region-level view of your completed skin snapshot.",
  heading: "Explore your skin snapshot",
  supporting:
    "Review the visible patterns highlighted in this photo, explore each facial region, and check the estimates used to prepare your routine.",
  guidanceBoundary:
    "This report provides skincare guidance, not a medical diagnosis.",
  limitedConfidence:
    "Some findings are less certain than usual. Review the highlighted sections carefully or use another photo for a clearer comparison.",
  snapshotHeading: "Snapshot overview",
  scoreLabel: "Skin snapshot score",
  scoreUnavailable: "Summary score unavailable",
  estimatedFromPhoto: "Estimated from this photo",
  classificationsHeading: "Skin profile estimates",
  skinTypeLabel: "Skin type estimate",
  skinToneLabel: "Skin-tone estimate",
  classificationHelper:
    "These estimates help personalise skincare guidance. Review them if they do not reflect your experience.",
  fitzpatrickHelper:
    "When supplied, the Fitzpatrick type is an estimated sun-response classification.",
  reviewEstimates: "Review estimates",
  reviewingEstimates: "Opening estimate review…",
  mapHeading: "Annotated face map",
  mapSensitiveLabel: "Contains a facial-image representation",
  mapSupporting:
    "Select a region to explore the visible patterns highlighted in this report.",
  mapPrivacyNote:
    "Hide the annotated map whenever you no longer need it on screen.",
  hideMap: "Hide annotated map",
  showMap: "Show annotated map",
  mapLoading: "Loading annotated map…",
  mapUnavailableHeading: "Annotated map unavailable",
  mapUnavailableSupporting:
    "You can still review the region-level report below.",
  legendHeading: "Map legend",
  regionsHeading: "Facial regions",
  visiblePatternsHeading: "Visible patterns",
  noRegionFindings:
    "No priority visible patterns were highlighted in this region.",
  noRegions: "No region-level findings are available in this report.",
  naturalFeaturesHeading: "Natural features",
  naturalFeaturesHelper: "Noted for context, not graded as a concern.",
  noNaturalFeatures: "No natural features were highlighted in this report.",
  metricsHeading: "Estimated measurements",
  metricsHelper:
    "These measurements are estimates from this photo and should be interpreted as skincare-guidance context.",
  noMetrics: "No estimated measurements are available in this report.",
  photoQualityHeading: "Photo quality context",
  photoQualityHelper:
    "Review the image-quality outcome used when generating this report.",
  buildRoutine: "Build my routine",
  preparingRoutine: "Preparing your routine…",
  reconnectForRoutine: "Reconnect to build routine",
  routineUnavailable: "Routine unavailable right now",
  backToSummary: "Back to summary",
  shareReport: "Share report",
  preparingShare: "Preparing report…",
  downloadReport: "Download report",
  preparingDownload: "Preparing download…",
  retakePhoto: "Use another photo",
  errorHeading: "We could not display this detailed report",
  errorSupporting: "Return to your summary or try loading the report again.",
  retry: "Try loading again",
  retrying: "Retrying…",
  backError: "We could not return to your summary. Please try again.",
  routineError: "We could not prepare your routine. Please try again.",
  shareError:
    "We could not prepare the report for sharing. Please try again.",
  downloadError: "We could not prepare the download. Please try again.",
  retakeError: "We could not open the photo options. Please try again.",
  classificationsError:
    "We could not open the estimate review. Please try again.",
  retryError: "We could not reload this report. Please try again.",
  mapCallbackError:
    "We could not report the annotated-map issue. Please try again.",
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
  mapBackground: "#2E2420",
} as const;

export const fonts = {
  display: '"DM Serif Display", Georgia, serif',
  ui: '"DM Sans", system-ui, sans-serif',
  metadata: '"Space Mono", monospace',
} as const;

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

export function normaliseReportScore(score: number | undefined): number | null {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  return Math.min(100, Math.max(0, Math.round(score)));
}

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
  "--dl-map-background": colors.mapBackground,
  "--dl-ui": fonts.ui,
  "--dl-display": fonts.display,
  "--dl-metadata": fonts.metadata,
} as CSSProperties;

type IconProps = { className?: string };
type AsyncHandler = () => void;
type ToastRegionProps = { message: string | null };

function ArrowLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24"><path d="m14.5 6-6 6 6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}
function DotsIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>;
}
function CloseIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}
function ShieldIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24"><path d="M12 3.5 19 6v5.5c0 4-2.7 7.4-7 9-4.3-1.6-7-5-7-9V6l7-2.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}
function InfoIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M12 10.5v5m0-8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}
function WarningIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24"><path d="M12 4 21 20H3L12 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /><path d="M12 9v5m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}
function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24"><path d="m5.5 12.5 4 4 9-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}
function Spinner({ className = "h-5 w-5" }: IconProps) {
  return <svg aria-hidden="true" className={`animate-spin motion-reduce:animate-none ${className}`} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" opacity=".25" r="9" stroke="currentColor" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" /></svg>;
}
function ChevronIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24"><path d="m8 10 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function ToastRegion({ message }: ToastRegionProps) {
  return <div aria-atomic="true" aria-live="polite" className={`pointer-events-none fixed inset-x-4 bottom-[max(24px,env(safe-area-inset-bottom))] z-[70] mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${message ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} role="status" style={themeStyle}>{message ?? ""}</div>;
}

function profileDisplayName(profileName: string): string {
  return profileName.trim() || "?";
}

function ProfileInitial({ profileName }: { profileName: string }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] font-[family-name:var(--dl-display)] text-xl text-[var(--dl-bark)]">{profileDisplayName(profileName).charAt(0).toUpperCase()}</span>;
}

function DetailTopBar({ disabled, hasReportActions, onBack, onOpenActions }: { disabled: boolean; hasReportActions: boolean; onBack: AsyncHandler; onOpenActions: (trigger: HTMLButtonElement) => void }) {
  return <div className="grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-2">
    <button className={`${focusRing} flex min-h-11 min-w-11 items-center justify-start gap-1 rounded-sm pr-2 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button"><ArrowLeftIcon />{copy.back}</button>
    <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">{copy.contextLabel}</p>
    <div className="flex justify-end">{hasReportActions ? <button aria-label={copy.reportActions} className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`} disabled={disabled} onClick={(event) => onOpenActions(event.currentTarget)} type="button"><DotsIcon /></button> : <span aria-hidden="true" className="h-11 w-11" />}</div>
  </div>;
}

function ReportProfileRow({ report }: { report: FullReportDetailReport }) {
  return <div className="mt-3 flex min-w-0 items-center gap-2.5"><ProfileInitial profileName={report.profileName} /><div className="min-w-0 flex-1"><p className="text-xs leading-4 text-[var(--dl-text-secondary)]">{copy.profilePrefix}</p><p className="truncate text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{profileDisplayName(report.profileName)}</p><p className="truncate text-xs leading-4 text-[var(--dl-text-secondary)]">{report.generatedAtLabel}</p></div></div>;
}

function GuidanceBoundaryNote() {
  return <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-parchment)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]"><InfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" /><span>{copy.guidanceBoundary}</span></p>;
}

function LimitedConfidenceBanner({ disabled, onRetakePhoto }: { disabled: boolean; onRetakePhoto?: AsyncHandler }) {
  return <div className="mt-3 rounded-xl bg-[var(--dl-warning-surface)] p-3 text-sm leading-5 text-[var(--dl-warning-text)]" role="status"><div className="flex items-start gap-2"><WarningIcon className="mt-0.5 h-5 w-5 shrink-0" /><p>{copy.limitedConfidence}</p></div>{onRetakePhoto ? <button className={`${focusRing} mt-2 min-h-11 rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline underline-offset-4 disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onRetakePhoto} type="button">{copy.retakePhoto}</button> : null}</div>;
}

function SnapshotOverviewCard({ report }: { report: FullReportDetailReport }) {
  const score = normaliseReportScore(report.score);
  return <section className="mt-4 rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-4" aria-label={copy.snapshotHeading}><h2 className="text-base font-semibold leading-[22px] text-[var(--dl-text-primary)]">{copy.snapshotHeading}</h2><p className="mt-2 font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.1em] text-[var(--dl-dusk)]">{copy.scoreLabel.toUpperCase()}</p>{score !== null ? <p className="mt-1 font-[family-name:var(--dl-display)] text-[52px] leading-[56px] text-[var(--dl-text-primary)]" data-testid="report-score">{score}</p> : <p className="mt-3 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.scoreUnavailable}</p>}<p className="mt-1 text-[15px] font-semibold leading-[22px] text-[var(--dl-text-primary)]">{report.categoryLabel}</p><p className="mt-2 text-xs leading-[18px] text-[var(--dl-text-secondary)]">{copy.estimatedFromPhoto}</p></section>;
}

function EstimateRow({ estimate, label }: { estimate: SkinClassificationEstimate; label: string }) {
  return <div className="border-t border-[var(--dl-border-subtle)] py-3 first:border-t-0 first:pt-2 last:pb-0"><p className="text-xs font-semibold leading-4 text-[var(--dl-dusk)]">{label}</p><div className="mt-1 flex flex-wrap items-center gap-2"><p className="text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{estimate.label}</p>{estimate.confidenceLabel ? <span className="rounded-full bg-[var(--dl-parchment)] px-2.5 py-1 text-xs font-semibold leading-4 text-[var(--dl-bark)]">{estimate.confidenceLabel}</span> : null}</div>{estimate.supporting ? <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">{estimate.supporting}</p> : null}</div>;
}

function ClassificationEstimatesCard({ activeOperation, disabled, onReviewClassifications, report }: { activeOperation: FullReportOperation; disabled: boolean; onReviewClassifications?: AsyncHandler; report: FullReportDetailReport }) {
  const isReviewing = activeOperation === "review-classifications";
  return <section className="mt-3.5 rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4"><h2 className="text-base font-semibold leading-[22px] text-[var(--dl-text-primary)]">{copy.classificationsHeading}</h2><p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.classificationHelper}</p><div className="mt-3"><EstimateRow estimate={report.classificationSummary.skinType} label={copy.skinTypeLabel} /><EstimateRow estimate={report.classificationSummary.skinTone} label={copy.skinToneLabel} /></div><p className="mt-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{copy.fitzpatrickHelper}</p>{onReviewClassifications ? <button className={`${focusRing} mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-[var(--dl-bark)] px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`} disabled={disabled} onClick={onReviewClassifications} type="button">{isReviewing ? <Spinner /> : null}{isReviewing ? copy.reviewingEstimates : copy.reviewEstimates}</button> : null}</section>;
}

function legendToneClass(tone: MapLegendTone = "peach"): string {
  if (tone === "warning") return "bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]";
  if (tone === "sand") return "bg-[var(--dl-sand)] text-[var(--dl-text-primary)]";
  if (tone === "stone") return "bg-[var(--dl-stone)] text-[var(--dl-text-primary)]";
  return "bg-[var(--dl-blush)] text-[var(--dl-bark)]";
}

function MapUnavailableState({ isError }: { isError: boolean }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl bg-[var(--dl-parchment)] p-6 text-center" role={isError ? "alert" : undefined}><WarningIcon className="h-8 w-8 text-[var(--dl-peach-strong)]" /><h3 className="mt-3 text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{copy.mapUnavailableHeading}</h3><p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.mapUnavailableSupporting}</p></div>;
}

function AnnotatedFaceMapCard({ disabled, initialVisible, onFaceMapLoadError, onSelectRegion, report, selectedRegion }: { disabled: boolean; initialVisible: boolean; onFaceMapLoadError?: AsyncHandler; onSelectRegion: (id: string) => void; report: FullReportDetailReport; selectedRegion: ReportRegion | null }) {
  const [isMapVisible, setIsMapVisible] = useState(initialVisible);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const reportedErrorUrlRef = useRef<string | null>(null);
  const activeFaceMapUrl = selectedRegion?.faceMapImageUrl ?? report.faceMap.imageUrl ?? null;
  const canToggleMapVisibility = Boolean(activeFaceMapUrl) && !hasMapError;

  useEffect(() => {
    setIsMapLoaded(false);
    setHasMapError(false);
    reportedErrorUrlRef.current = null;
  }, [activeFaceMapUrl, report.reportId]);

  const handleMapError = useCallback(() => {
    setIsMapLoaded(false);
    setHasMapError(true);
    if (!activeFaceMapUrl || !onFaceMapLoadError || reportedErrorUrlRef.current === activeFaceMapUrl) return;
    reportedErrorUrlRef.current = activeFaceMapUrl;
    onFaceMapLoadError();
  }, [activeFaceMapUrl, onFaceMapLoadError]);

  return <section className="mt-3.5 rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold leading-[22px] text-[var(--dl-text-primary)]">{copy.mapHeading}</h2><p className="mt-1 text-xs font-semibold leading-4 text-[var(--dl-dusk)]">{copy.mapSensitiveLabel}</p><p className="mt-1 max-w-[500px] text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.mapSupporting}</p></div>{canToggleMapVisibility ? <button className={`${focusRing} min-h-11 rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={() => setIsMapVisible((visible) => !visible)} type="button">{isMapVisible ? copy.hideMap : copy.showMap}</button> : null}</div>
    <div className="mt-3">
      {!activeFaceMapUrl ? <MapUnavailableState isError={false} /> : hasMapError ? <MapUnavailableState isError /> : !isMapVisible ? <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl bg-[var(--dl-parchment)] p-6 text-center"><ShieldIcon className="h-8 w-8 text-[var(--dl-peach-strong)]" /><p className="mt-3 max-w-[320px] text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.mapPrivacyNote}</p><button className={`${focusRing} mt-3 min-h-11 rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline underline-offset-4 disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={() => { if (disabled) return; setIsMapVisible(true); }} type="button">{copy.showMap}</button></div> : <div className="relative overflow-hidden rounded-2xl bg-[var(--dl-map-background)]"><img key={`${report.reportId}:${activeFaceMapUrl}`} alt={report.faceMap.alt} className={`h-[300px] w-full object-contain max-[374px]:h-[250px] md:h-[360px] lg:h-[520px] ${isMapLoaded ? "block" : "invisible"}`} draggable={false} onError={handleMapError} onLoad={() => setIsMapLoaded(true)} src={activeFaceMapUrl} />{!isMapLoaded ? <div aria-live="polite" className="absolute inset-0 flex items-center justify-center gap-2 text-sm leading-5 text-white" role="status"><Spinner />{copy.mapLoading}</div> : null}</div>}
    </div>
    {report.faceMap.legend.length > 0 ? <div className="mt-4"><h3 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{copy.legendHeading}</h3><ul className="mt-2 flex flex-wrap gap-2" data-testid="map-legend-list">{report.faceMap.legend.map((item) => <li className={`rounded-full px-2.5 py-1 text-xs font-semibold leading-4 ${legendToneClass(item.tone)}`} key={item.id}>{item.label}</li>)}</ul></div> : null}
    <div className="mt-4"><h3 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{copy.regionsHeading}</h3><div className="mt-2 flex gap-2 overflow-x-auto pb-1" data-testid="region-chip-list">{report.regions.map((region) => <button aria-pressed={region.id === selectedRegion?.id} className={`${focusRing} min-h-11 shrink-0 rounded-full border px-3.5 text-sm font-semibold leading-5 transition-colors motion-reduce:transition-none ${region.id === selectedRegion?.id ? "border-[var(--dl-bark)] bg-[var(--dl-bark)] text-white" : "border-[var(--dl-border-subtle)] bg-[var(--dl-parchment)] text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)]"}`} disabled={disabled} key={region.id} onClick={() => onSelectRegion(region.id)} type="button">{region.label}</button>)}</div></div>
  </section>;
}

function findingToneClass(tone: FindingTone = "neutral"): string {
  if (tone === "attention") return "bg-[var(--dl-warning-surface)] text-[var(--dl-warning-text)]";
  if (tone === "positive") return "bg-[var(--dl-blush)] text-[var(--dl-bark)]";
  return "bg-[var(--dl-parchment)] text-[var(--dl-bark)]";
}

function SelectedRegionFindingsCard({ selectedRegion }: { selectedRegion: ReportRegion | null }) {
  return <section className="mt-3.5 rounded-[20px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4"><h2 className="text-lg font-semibold leading-6 text-[var(--dl-text-primary)]">{copy.visiblePatternsHeading}</h2>{selectedRegion ? <><p className="mt-1 text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{selectedRegion.label}</p>{selectedRegion.summary ? <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">{selectedRegion.summary}</p> : null}{selectedRegion.findings.length > 0 ? <ul className="mt-2" data-testid="region-finding-list">{selectedRegion.findings.map((finding) => <li className="border-b border-[var(--dl-border-subtle)] py-3 last:border-b-0 last:pb-0" key={finding.id}><div className="flex flex-wrap items-center gap-2"><h3 className="text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{finding.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold leading-4 ${findingToneClass(finding.tone)}`}>{finding.levelLabel}</span></div><p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">{finding.description}</p>{finding.stateLabel || finding.spreadLabel || finding.metricLabel ? <div className="mt-2 flex flex-wrap gap-1.5">{[finding.stateLabel, finding.spreadLabel, finding.metricLabel].filter(Boolean).map((label) => <span className="rounded-full bg-[var(--dl-surface-soft)] px-2 py-1 text-xs leading-4 text-[var(--dl-bark)]" key={label}>{label}</span>)}</div> : null}</li>)}</ul> : <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.noRegionFindings}</p>}</> : <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.noRegions}</p>}</section>;
}

function NaturalFeaturesCard({ features }: { features: NaturalFeatureNotation[] }) {
  return <section className="mt-3.5 rounded-2xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-3.5"><h2 className="text-base font-semibold leading-[22px] text-[var(--dl-text-primary)]">{copy.naturalFeaturesHeading}</h2><p className="mt-1 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{copy.naturalFeaturesHelper}</p>{features.length > 0 ? <ul className="mt-3 space-y-2" data-testid="natural-feature-list">{features.map((feature) => <li className="flex items-start gap-2" data-testid="natural-feature-row" key={feature.id}><InfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" /><div><h3 className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{feature.title}</h3>{feature.description ? <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{feature.description}</p> : null}{feature.regionLabel ? <p className="mt-0.5 text-xs leading-4 text-[var(--dl-dusk)]">{feature.regionLabel}</p> : null}</div></li>)}</ul> : <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.noNaturalFeatures}</p>}</section>;
}

function AccordionShell({ children, helper, title }: { children: ReactNode; helper: string; title: string }) {
  return <details className="group mt-3.5 border-y border-[var(--dl-border-subtle)]"><summary className={`${focusRing} flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-3 py-3 text-left`}><span><span className="block text-[15px] font-semibold leading-[21px] text-[var(--dl-text-primary)]">{title}</span><span className="mt-0.5 block text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{helper}</span></span><ChevronIcon className="h-5 w-5 shrink-0 text-[var(--dl-dusk)] transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary><div className="pb-4">{children}</div></details>;
}

function EstimatedMeasurementsAccordion({ metrics }: { metrics: EstimatedMetric[] }) {
  return <AccordionShell helper={copy.metricsHelper} title={copy.metricsHeading}>{metrics.length > 0 ? <ul className="grid gap-2 sm:grid-cols-2" data-testid="metrics-list">{metrics.map((metric) => <li className="rounded-xl bg-[var(--dl-surface)] p-3" key={metric.id}><p className="text-xs font-semibold leading-4 text-[var(--dl-dusk)]">{metric.label}</p><p className="mt-1 text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{metric.value}</p>{metric.supporting ? <p className="mt-1 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{metric.supporting}</p> : null}</li>)}</ul> : <p className="text-sm leading-5 text-[var(--dl-text-secondary)]">{copy.noMetrics}</p>}</AccordionShell>;
}

function PhotoQualityContextAccordion({ context }: { context: PhotoQualityContext }) {
  return <AccordionShell helper={copy.photoQualityHelper} title={copy.photoQualityHeading}><div className="rounded-xl bg-[var(--dl-surface)] p-3"><p className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{context.outcomeLabel}</p><p className="mt-1 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{context.supporting}</p></div><ul className="mt-2" data-testid="photo-quality-list">{context.items.map((item) => <li className="border-b border-[var(--dl-border-subtle)] py-2.5 last:border-b-0" key={item.id}><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">{item.label}</p><p className="text-sm leading-5 text-[var(--dl-bark)]">{item.valueLabel}</p></div>{item.supporting ? <p className="mt-1 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">{item.supporting}</p> : null}</li>)}</ul></AccordionShell>;
}

function LocalSaveNote({ saveLabel }: { saveLabel: string }) {
  return <p className="mt-3.5 flex items-start gap-2 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]"><ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" /><span>{saveLabel.trim() || copy.savedOnDevice}</span></p>;
}

function getRoutineButtonLabel({ activeOperation, canBuildRoutine, isOffline }: { activeOperation: FullReportOperation; canBuildRoutine: boolean; isOffline: boolean }): string {
  if (activeOperation === "open-routine") return copy.preparingRoutine;
  if (!canBuildRoutine) return isOffline ? copy.reconnectForRoutine : copy.routineUnavailable;
  return copy.buildRoutine;
}

function DetailFooter({ activeOperation, canBuildRoutine, disabled, hasReport, isOffline, onBack, onOpenRoutine, routineLabelOverride }: { activeOperation: FullReportOperation; canBuildRoutine: boolean; disabled: boolean; hasReport: boolean; isOffline: boolean; onBack: AsyncHandler; onOpenRoutine: AsyncHandler; routineLabelOverride?: string }) {
  return <footer className="sticky bottom-0 z-20 -mx-6 mt-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-[8px] max-[374px]:-mx-5 max-[374px]:px-5 lg:mx-0 lg:px-0"><button className={`${focusRing} min-h-[52px] w-full rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] motion-reduce:transition-none`} disabled={!hasReport || !canBuildRoutine || disabled} onClick={onOpenRoutine} type="button">{routineLabelOverride ?? getRoutineButtonLabel({ activeOperation, canBuildRoutine, isOffline })}</button><button className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={!hasReport || disabled} onClick={onBack} type="button">{copy.backToSummary}</button></footer>;
}

function SkeletonBlock({ className }: { className: string }) { return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--dl-parchment)] motion-reduce:animate-none ${className}`} />; }

function LoadingExperience({ disabled, onBack, onOpenActions }: { disabled: boolean; onBack: AsyncHandler; onOpenActions: (trigger: HTMLButtonElement) => void }) {
  return <div className="mx-auto min-h-[100dvh] w-full max-w-[720px] px-6 pt-[max(24px,env(safe-area-inset-top))] max-[374px]:px-5 md:max-w-[760px]"><DetailTopBar disabled={disabled} hasReportActions={false} onBack={onBack} onOpenActions={onOpenActions} /><div aria-live="polite" role="status"><div className="mt-3 flex gap-2.5"><SkeletonBlock className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><SkeletonBlock className="h-3 w-28" /><SkeletonBlock className="h-4 w-40" /></div></div><h1 className="mt-[18px] font-[family-name:var(--dl-display)] text-4xl leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.loadingHeading}</h1><p className="mt-2 max-w-[390px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.loadingSupporting}</p><SkeletonBlock className="mt-4 h-40 w-full rounded-[20px]" /><SkeletonBlock className="mt-3.5 h-48 w-full rounded-[18px]" /><SkeletonBlock className="mt-3.5 h-72 w-full rounded-[20px]" /></div><DetailFooter activeOperation={null} canBuildRoutine={false} disabled hasReport={false} isOffline={false} onBack={() => undefined} onOpenRoutine={() => undefined} routineLabelOverride={copy.buildRoutine} /></div>;
}

function ErrorExperience({ activeOperation, disabled, onBack, onRetakePhoto, onRetryLoad }: { activeOperation: FullReportOperation; disabled: boolean; onBack: AsyncHandler; onRetakePhoto?: AsyncHandler; onRetryLoad?: AsyncHandler }) {
  return <div className="mx-auto min-h-[100dvh] w-full max-w-[520px] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] max-[374px]:px-5"><DetailTopBar disabled={disabled} hasReportActions={false} onBack={onBack} onOpenActions={() => undefined} /><div className="pt-14 text-center" role="alert"><div aria-hidden="true" className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-error-text)]"><WarningIcon className="h-11 w-11" /></div><h1 className="mt-6 font-[family-name:var(--dl-display)] text-[38px] leading-[42px] text-[var(--dl-text-primary)] max-[374px]:text-[34px] max-[374px]:leading-[38px]">{copy.errorHeading}</h1><p className="mx-auto mt-2.5 max-w-[360px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.errorSupporting}</p>{onRetryLoad ? <button className={`${focusRing} mt-7 min-h-[52px] w-full rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] motion-reduce:transition-none`} disabled={disabled} onClick={onRetryLoad} type="button">{activeOperation === "retry-load" ? copy.retrying : copy.retry}</button> : null}<button className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onBack} type="button">{copy.backToSummary}</button>{onRetakePhoto ? <button className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={disabled} onClick={onRetakePhoto} type="button">{copy.retakePhoto}</button> : null}</div></div>;
}

function ReadyExperience({ activeOperation, canBuildRoutine, disabled, hasReportActions, initialVisible, isOffline, onBack, onFaceMapLoadError, onOpenActions, onOpenRoutine, onRetakePhoto, onReviewClassifications, report, selectedRegion, setSelectedRegionId, state }: { activeOperation: FullReportOperation; canBuildRoutine: boolean; disabled: boolean; hasReportActions: boolean; initialVisible: boolean; isOffline: boolean; onBack: AsyncHandler; onFaceMapLoadError?: AsyncHandler; onOpenActions: (trigger: HTMLButtonElement) => void; onOpenRoutine: AsyncHandler; onRetakePhoto?: AsyncHandler; onReviewClassifications?: AsyncHandler; report: FullReportDetailReport; selectedRegion: ReportRegion | null; setSelectedRegionId: (id: string) => void; state: FullReportDetailState }) {
  return <div className="mx-auto min-h-[100dvh] w-full max-w-[720px] px-6 pt-[max(24px,env(safe-area-inset-top))] max-[374px]:px-5 md:max-w-[760px] lg:max-w-[1180px]"><div className="lg:grid lg:grid-cols-[minmax(0,48fr)_minmax(0,52fr)] lg:gap-x-12"><div className="lg:col-start-2"><DetailTopBar disabled={disabled} hasReportActions={hasReportActions} onBack={onBack} onOpenActions={onOpenActions} /><ReportProfileRow report={report} /><h1 className="mt-[18px] font-[family-name:var(--dl-display)] text-4xl leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">{copy.heading}</h1><p className="mt-2 max-w-[520px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">{copy.supporting}</p><GuidanceBoundaryNote />{state === "limited-confidence" ? <LimitedConfidenceBanner disabled={disabled} onRetakePhoto={onRetakePhoto} /> : null}</div><div className="lg:col-start-1 lg:row-start-1 lg:row-span-2"><SnapshotOverviewCard report={report} /><ClassificationEstimatesCard activeOperation={activeOperation} disabled={disabled} onReviewClassifications={onReviewClassifications} report={report} /><AnnotatedFaceMapCard disabled={disabled} initialVisible={initialVisible} onFaceMapLoadError={onFaceMapLoadError} onSelectRegion={setSelectedRegionId} report={report} selectedRegion={selectedRegion} /><LocalSaveNote saveLabel={report.saveLabel} /></div><div className="lg:col-start-2 lg:row-start-2"><SelectedRegionFindingsCard selectedRegion={selectedRegion} /><NaturalFeaturesCard features={report.naturalFeatures} /><EstimatedMeasurementsAccordion metrics={report.estimatedMetrics} /><PhotoQualityContextAccordion context={report.photoQuality} /><div aria-hidden="true" className="min-h-4" /><DetailFooter activeOperation={activeOperation} canBuildRoutine={canBuildRoutine} disabled={disabled} hasReport isOffline={isOffline} onBack={onBack} onOpenRoutine={onOpenRoutine} /></div></div></div>;
}

function AppShell({ children, isDialogOpen }: { children: ReactNode; isDialogOpen: boolean }) {
  const shellRef = useRef<HTMLElement>(null);
  useEffect(() => { const shell = shellRef.current; if (!shell) return; if (isDialogOpen) shell.setAttribute("inert", ""); else shell.removeAttribute("inert"); }, [isDialogOpen]);
  return <main aria-hidden={isDialogOpen || undefined} className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]" data-testid="detail-app-shell" ref={shellRef} style={themeStyle}>{children}</main>;
}

const focusableSelector = ["button:not([disabled])", "[href]", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])", '[tabindex]:not([tabindex="-1"])'].join(",");

function SheetActionButton({ active, disabled, label, onClick }: { active: boolean; disabled: boolean; label: string; onClick: AsyncHandler }) {
  return <button className={`${focusRing} flex min-h-12 w-full items-center justify-start gap-2 rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 text-left text-sm font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)] motion-reduce:transition-none`} disabled={disabled} onClick={onClick} type="button">{active ? <Spinner /> : null}{label}</button>;
}

function ReportActionsSheet({ activeOperation, isOpen, isPending, onClose, onDownloadReport, onRetakePhoto, onShareReport, returnFocusRef }: { activeOperation: FullReportOperation; isOpen: boolean; isPending: boolean; onClose: AsyncHandler; onDownloadReport?: AsyncHandler; onRetakePhoto?: AsyncHandler; onShareReport?: AsyncHandler; returnFocusRef: RefObject<HTMLButtonElement | null> }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isPendingRef = useRef(isPending);
  useEffect(() => { isPendingRef.current = isPending; }, [isPending]);
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const animationFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPendingRef.current) { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (elements.length === 0) { event.preventDefault(); dialogRef.current.focus(); return; }
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { window.cancelAnimationFrame(animationFrame); document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKeyDown); window.requestAnimationFrame(() => { const trigger = returnFocusRef.current; if (trigger?.isConnected) trigger.focus(); }); };
  }, [isOpen, onClose, returnFocusRef]);
  useEffect(() => { if (!isOpen || !isPending || !dialogRef.current) return; if (!dialogRef.current.contains(document.activeElement)) dialogRef.current.focus(); }, [isOpen, isPending]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(58,46,40,0.34)] md:items-center md:p-6" data-testid="report-actions-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onClose(); }}><div aria-labelledby={titleId} aria-modal="true" className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] bg-[var(--dl-surface)] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 shadow-[0_4px_20px_rgba(92,74,66,0.08)] outline-none md:max-w-[520px] md:rounded-[28px] md:p-6" ref={dialogRef} role="dialog" style={themeStyle} tabIndex={-1}><div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--dl-border-subtle)] md:hidden" /><div className="flex items-start justify-between gap-4"><h2 className="font-[family-name:var(--dl-display)] text-[28px] leading-[34px] text-[var(--dl-text-primary)]" id={titleId}>{copy.reportActions}</h2><button aria-label="Close report actions" className={`${focusRing} -mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`} disabled={isPending} onClick={onClose} ref={closeButtonRef} type="button"><CloseIcon /></button></div><div className="mt-3 space-y-2">{onShareReport ? <SheetActionButton active={activeOperation === "share"} disabled={isPending} label={activeOperation === "share" ? copy.preparingShare : copy.shareReport} onClick={onShareReport} /> : null}{onDownloadReport ? <SheetActionButton active={activeOperation === "download"} disabled={isPending} label={activeOperation === "download" ? copy.preparingDownload : copy.downloadReport} onClick={onDownloadReport} /> : null}{onRetakePhoto ? <SheetActionButton active={activeOperation === "retake-photo"} disabled={isPending} label={copy.retakePhoto} onClick={onRetakePhoto} /> : null}</div></div></div>;
}

export default function FullReportDetailScreen({ state = "loading", report = null, initialSelectedRegionId, showFaceMapInitially = true, isOffline = false, canBuildRoutine = true, onBack, onOpenRoutine, onShareReport, onDownloadReport, onRetakePhoto, onReviewClassifications, onRetryLoad, onFaceMapLoadError }: FullReportDetailScreenProps) {
  const firstRegionId = report?.regions[0]?.id ?? null;
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(initialSelectedRegionId ?? firstRegionId);
  const [activeOperation, setActiveOperation] = useState<FullReportOperation>(null);
  const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef<FullReportOperation>(null);
  const actionsReturnFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  useEffect(() => { if (!toastMessage) return; const timeoutId = window.setTimeout(() => setToastMessage(null), 5000); return () => window.clearTimeout(timeoutId); }, [toastMessage]);
  useEffect(() => { const regions = report?.regions ?? []; const selectedStillExists = regions.some((region) => region.id === selectedRegionId); if (selectedStillExists) return; const validInitial = initialSelectedRegionId && regions.some((region) => region.id === initialSelectedRegionId) ? initialSelectedRegionId : null; setSelectedRegionId(validInitial ?? regions[0]?.id ?? null); }, [initialSelectedRegionId, report, selectedRegionId]);

  const operationPending = activeOperation !== null;
  const effectiveState: FullReportDetailState = (state === "ready" || state === "limited-confidence") && report === null ? "error" : state;
  const hasRenderableReport = (effectiveState === "ready" || effectiveState === "limited-confidence") && report !== null;
  const hasReportActions = hasRenderableReport && Boolean(onShareReport || onDownloadReport || onRetakePhoto);
  const selectedRegion = report?.regions.find((region) => region.id === selectedRegionId) ?? null;

  const runOperation = useCallback(async (operation: Exclude<FullReportOperation, null>, callback: () => void | Promise<void>, failureMessage: string, closeSheetOnSuccess = false) => {
    if (inFlightRef.current !== null) return;
    inFlightRef.current = operation; setActiveOperation(operation); setToastMessage(null);
    try { await callback(); if (mountedRef.current && closeSheetOnSuccess) setIsActionsSheetOpen(false); }
    catch { if (mountedRef.current) setToastMessage(failureMessage); }
    finally { inFlightRef.current = null; if (mountedRef.current) setActiveOperation(null); }
  }, []);

  const handleBack = useCallback(() => { if (operationPending || inFlightRef.current !== null) return; void runOperation("back", onBack, copy.backError); }, [onBack, operationPending, runOperation]);
  const handleRoutine = useCallback(() => { if (operationPending || inFlightRef.current !== null || !hasRenderableReport || !canBuildRoutine) return; void runOperation("open-routine", onOpenRoutine, copy.routineError); }, [canBuildRoutine, hasRenderableReport, onOpenRoutine, operationPending, runOperation]);
  const handleShare = useCallback(() => { if (!hasRenderableReport || !onShareReport || operationPending || inFlightRef.current !== null) return; void runOperation("share", onShareReport, copy.shareError, true); }, [hasRenderableReport, onShareReport, operationPending, runOperation]);
  const handleDownload = useCallback(() => { if (!hasRenderableReport || !onDownloadReport || operationPending || inFlightRef.current !== null) return; void runOperation("download", onDownloadReport, copy.downloadError, true); }, [hasRenderableReport, onDownloadReport, operationPending, runOperation]);
  const handleRetake = useCallback(() => { if (!onRetakePhoto || operationPending || inFlightRef.current !== null) return; void runOperation("retake-photo", onRetakePhoto, copy.retakeError, isActionsSheetOpen); }, [isActionsSheetOpen, onRetakePhoto, operationPending, runOperation]);
  const handleReviewClassifications = useCallback(() => { if (!onReviewClassifications || operationPending || inFlightRef.current !== null) return; void runOperation("review-classifications", onReviewClassifications, copy.classificationsError); }, [onReviewClassifications, operationPending, runOperation]);
  const handleRetryLoad = useCallback(() => { if (!onRetryLoad || operationPending || inFlightRef.current !== null) return; void runOperation("retry-load", onRetryLoad, copy.retryError); }, [onRetryLoad, operationPending, runOperation]);
  const handleFaceMapLoadError = useCallback(() => { if (!onFaceMapLoadError || operationPending || inFlightRef.current !== null) return; void runOperation("report-map-error", onFaceMapLoadError, copy.mapCallbackError); }, [onFaceMapLoadError, operationPending, runOperation]);
  const openActionsSheet = useCallback((trigger: HTMLButtonElement) => { if (!hasReportActions || operationPending || inFlightRef.current !== null) return; actionsReturnFocusRef.current = trigger; setIsActionsSheetOpen(true); }, [hasReportActions, operationPending]);
  const closeActionsSheet = useCallback(() => { if (operationPending || inFlightRef.current !== null) return; setIsActionsSheetOpen(false); }, [operationPending]);
  useEffect(() => { if (!isActionsSheetOpen || operationPending) return; if (!hasReportActions) setIsActionsSheetOpen(false); }, [hasReportActions, isActionsSheetOpen, operationPending]);

  let content: ReactNode;
  if (effectiveState === "loading") content = <LoadingExperience disabled={operationPending} onBack={handleBack} onOpenActions={openActionsSheet} />;
  else if (effectiveState === "error" || !report) content = <ErrorExperience activeOperation={activeOperation} disabled={operationPending} onBack={handleBack} onRetakePhoto={onRetakePhoto ? handleRetake : undefined} onRetryLoad={onRetryLoad ? handleRetryLoad : undefined} />;
  else content = <ReadyExperience activeOperation={activeOperation} canBuildRoutine={canBuildRoutine} disabled={operationPending} hasReportActions={hasReportActions} initialVisible={showFaceMapInitially} isOffline={isOffline} onBack={handleBack} onFaceMapLoadError={onFaceMapLoadError ? handleFaceMapLoadError : undefined} onOpenActions={openActionsSheet} onOpenRoutine={handleRoutine} onRetakePhoto={onRetakePhoto ? handleRetake : undefined} onReviewClassifications={onReviewClassifications ? handleReviewClassifications : undefined} report={report} selectedRegion={selectedRegion} setSelectedRegionId={setSelectedRegionId} state={effectiveState} />;

  return <><AppShell isDialogOpen={isActionsSheetOpen}>{content}</AppShell><ReportActionsSheet activeOperation={activeOperation} isOpen={isActionsSheetOpen} isPending={operationPending} onClose={closeActionsSheet} onDownloadReport={hasReportActions && onDownloadReport ? handleDownload : undefined} onRetakePhoto={hasReportActions && onRetakePhoto ? handleRetake : undefined} onShareReport={hasReportActions && onShareReport ? handleShare : undefined} returnFocusRef={actionsReturnFocusRef} /><ToastRegion message={toastMessage} /></>;
}
