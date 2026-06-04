import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FullReportDetailScreen, {
  copy,
  normaliseReportScore,
  type FullReportDetailReport,
  type FullReportDetailScreenProps,
} from "./full-report-detail-screen";

const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
const originalGeolocationDescriptor = Object.getOwnPropertyDescriptor(navigator, "geolocation");
const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");

function restoreDescriptor(target: object, property: PropertyKey, descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(target, property, descriptor);
  else Reflect.deleteProperty(target, property);
}

afterEach(() => {
  cleanup();
  restoreDescriptor(navigator, "mediaDevices", originalMediaDevicesDescriptor);
  restoreDescriptor(navigator, "geolocation", originalGeolocationDescriptor);
  restoreDescriptor(globalThis, "fetch", originalFetchDescriptor);
  document.body.style.overflow = "";
  vi.restoreAllMocks();
});

const baseReport: FullReportDetailReport = {
  reportId: "detail-1",
  profileName: " Amara ",
  generatedAtLabel: "2 June 2026 · 12:15",
  saveLabel: "Saved locally on this device",
  score: 78,
  categoryLabel: "Balanced with a few priorities",
  classificationSummary: {
    skinType: { label: "Combination-leaning", supporting: "Oilier through the centre with drier-looking outer areas.", confidenceLabel: "Estimated" },
    skinTone: { label: "Medium · Fitzpatrick type IV", supporting: "Estimated from the selected photo.", confidenceLabel: "Estimated" },
  },
  faceMap: {
    imageUrl: "/maps/full.png",
    alt: "Annotated face map for Amara",
    legend: [
      { id: "l1", label: "Visible pattern", tone: "peach" },
      { id: "l2", label: "Texture context", tone: "sand" },
      { id: "l3", label: "Worth attention", tone: "warning" },
    ],
  },
  regions: [
    {
      id: "forehead",
      label: "Forehead",
      summary: "A few visible patterns were highlighted across the forehead.",
      findings: [
        { id: "f1", title: "Visible texture", levelLabel: "Moderate", description: "Texture appears slightly uneven in this region.", tone: "neutral", stateLabel: "Visible", spreadLabel: "Localised", metricLabel: "Host estimate" },
        { id: "f2", title: "Hydration support", levelLabel: "Worth attention", description: "This region may benefit from barrier-supportive care.", tone: "attention" },
      ],
    },
    {
      id: "cheeks",
      label: "Cheeks",
      summary: "Cheek-area context from the host report.",
      faceMapImageUrl: "/maps/cheeks.png",
      findings: [
        { id: "f3", title: "Comfort signal", levelLabel: "Positive", description: "The cheek area appears relatively calm in this photo.", tone: "positive" },
      ],
    },
    { id: "chin", label: "Chin", findings: [] },
  ],
  naturalFeatures: [
    { id: "n1", title: "Freckle pattern", description: "Noted for comparison context.", regionLabel: "Cheeks" },
    { id: "n2", title: "Natural crease", description: "Recorded as a natural feature.", regionLabel: "Smile area" },
  ],
  estimatedMetrics: [
    { id: "m1", label: "Texture estimate", value: "Mildly uneven", supporting: "Host-supplied descriptive estimate." },
    { id: "m2", label: "Pore-size distribution", value: "More visible through centre" },
  ],
  photoQuality: {
    outcomeLabel: "Suitable for guidance",
    supporting: "The selected photo passed the host-owned quality review.",
    items: [
      { id: "q1", label: "Lighting", valueLabel: "Even" },
      { id: "q2", label: "Focus", valueLabel: "Clear" },
      { id: "q3", label: "Resolution", valueLabel: "Suitable" },
    ],
  },
};

const baseProps: FullReportDetailScreenProps = {
  state: "ready",
  report: baseReport,
  onBack: vi.fn(),
  onOpenRoutine: vi.fn(),
};

function reportWith(overrides: Partial<FullReportDetailReport> = {}): FullReportDetailReport {
  return { ...baseReport, ...overrides };
}

function renderScreen(overrides: Partial<FullReportDetailScreenProps> = {}) {
  const props: FullReportDetailScreenProps = {
    ...baseProps,
    onBack: vi.fn(),
    onOpenRoutine: vi.fn(),
    ...overrides,
  };
  const result = render(<FullReportDetailScreen {...props} />);
  return { ...result, props };
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

async function openActionsSheet() {
  const trigger = screen.getByRole("button", { name: copy.reportActions });
  fireEvent.click(trigger);
  await waitFor(() => expect(screen.getByRole("dialog", { name: copy.reportActions })).toBeInTheDocument());
  return trigger;
}

function getMapImage() {
  return screen.getByRole("img", { name: baseReport.faceMap.alt });
}

describe("FullReportDetailScreen", () => {
  it("renders loading heading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByRole("heading", { name: copy.loadingHeading })).toBeInTheDocument();
  });

  it("uses a polite status for loading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByText(copy.loadingHeading).closest('[role="status"]')).toHaveAttribute("aria-live", "polite");
  });

  it("hides Report Actions while loading even when callbacks exist", () => {
    renderScreen({ state: "loading", report: null, onShareReport: vi.fn() });
    expect(screen.queryByRole("button", { name: copy.reportActions })).not.toBeInTheDocument();
  });

  it("renders a disabled Build my routine CTA while loading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByRole("button", { name: copy.buildRoutine })).toBeDisabled();
  });

  it("does not show routine unavailable wording while loading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.queryByRole("button", { name: copy.routineUnavailable })).not.toBeInTheDocument();
  });

  it("renders ready heading", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
  });

  it("falls back to error when ready state has no report", () => {
    renderScreen({ state: "ready", report: null });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("renders limited-confidence banner", () => {
    renderScreen({ state: "limited-confidence" });
    expect(screen.getByText(copy.limitedConfidence)).toBeInTheDocument();
  });

  it("marks limited-confidence banner as status", () => {
    renderScreen({ state: "limited-confidence" });
    expect(screen.getByText(copy.limitedConfidence).closest('[role="status"]')).toBeInTheDocument();
  });

  it("renders error heading", () => {
    renderScreen({ state: "error" });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("marks error experience as alert", () => {
    renderScreen({ state: "error" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("hides Report Actions in error state", () => {
    renderScreen({ state: "error", onShareReport: vi.fn() });
    expect(screen.queryByRole("button", { name: copy.reportActions })).not.toBeInTheDocument();
  });

  it("invokes retry callback from error state", () => {
    const onRetryLoad = vi.fn();
    renderScreen({ state: "error", onRetryLoad });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(onRetryLoad).toHaveBeenCalledTimes(1);
  });

  it("renders a trimmed profile name", () => {
    renderScreen();
    expect(screen.getByText("Amara")).toBeInTheDocument();
  });

  it("uses question mark when profile name is blank", () => {
    renderScreen({ report: reportWith({ profileName: "  " }) });
    expect(screen.getAllByText("?").length).toBeGreaterThan(0);
  });

  it("renders generated label", () => {
    renderScreen();
    expect(screen.getByText(baseReport.generatedAtLabel)).toBeInTheDocument();
  });

  it("renders host save label", () => {
    renderScreen();
    expect(screen.getByText(baseReport.saveLabel)).toBeInTheDocument();
  });

  it("falls back to local save label for blank save value", () => {
    renderScreen({ report: reportWith({ saveLabel: " " }) });
    expect(screen.getByText(copy.savedOnDevice)).toBeInTheDocument();
  });

  it("renders valid score", () => {
    renderScreen();
    expect(screen.getByTestId("report-score")).toHaveTextContent("78");
  });

  it("rounds decimal score", () => {
    renderScreen({ report: reportWith({ score: 74.6 }) });
    expect(screen.getByTestId("report-score")).toHaveTextContent("75");
  });

  it("clamps score below zero", () => {
    renderScreen({ report: reportWith({ score: -2 }) });
    expect(screen.getByTestId("report-score")).toHaveTextContent("0");
  });

  it("clamps score above one hundred", () => {
    renderScreen({ report: reportWith({ score: 120 }) });
    expect(screen.getByTestId("report-score")).toHaveTextContent("100");
  });

  it("hides numeric score when omitted", () => {
    renderScreen({ report: reportWith({ score: undefined }) });
    expect(screen.queryByTestId("report-score")).not.toBeInTheDocument();
    expect(screen.getByText(copy.scoreUnavailable)).toBeInTheDocument();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("hides a non-finite score: %s", (score) => {
    renderScreen({ report: reportWith({ score }) });
    expect(screen.queryByTestId("report-score")).not.toBeInTheDocument();
  });

  it("normalises only finite host scores", () => {
    expect(normaliseReportScore(undefined)).toBeNull();
    expect(normaliseReportScore(Number.NaN)).toBeNull();
    expect(normaliseReportScore(44.7)).toBe(45);
  });

  it("renders category unchanged", () => {
    renderScreen();
    expect(screen.getByText(baseReport.categoryLabel)).toBeInTheDocument();
  });

  it("renders guidance boundary", () => {
    renderScreen();
    expect(screen.getByText(copy.guidanceBoundary)).toBeInTheDocument();
  });

  it("renders skin-type estimate", () => {
    renderScreen();
    expect(screen.getByText(baseReport.classificationSummary.skinType.label)).toBeInTheDocument();
  });

  it("renders skin-tone estimate", () => {
    renderScreen();
    expect(screen.getByText(baseReport.classificationSummary.skinTone.label)).toBeInTheDocument();
  });

  it("renders Fitzpatrick helper", () => {
    renderScreen();
    expect(screen.getByText(copy.fitzpatrickHelper)).toBeInTheDocument();
  });

  it("shows review-estimates only when supplied", () => {
    renderScreen();
    expect(screen.queryByRole("button", { name: copy.reviewEstimates })).not.toBeInTheDocument();
    cleanup();
    renderScreen({ onReviewClassifications: vi.fn() });
    expect(screen.getByRole("button", { name: copy.reviewEstimates })).toBeInTheDocument();
  });

  it("invokes review-estimates callback", () => {
    const onReviewClassifications = vi.fn();
    renderScreen({ onReviewClassifications });
    fireEvent.click(screen.getByRole("button", { name: copy.reviewEstimates }));
    expect(onReviewClassifications).toHaveBeenCalledTimes(1);
  });

  it("shows toast when review-estimates rejects", async () => {
    renderScreen({ onReviewClassifications: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.reviewEstimates }));
    expect(await screen.findByText(copy.classificationsError)).toBeInTheDocument();
  });

  it("shows pending label while estimate review is opening", async () => {
    const task = deferred();
    renderScreen({ onReviewClassifications: () => task.promise });
    fireEvent.click(screen.getByRole("button", { name: copy.reviewEstimates }));
    expect(await screen.findByRole("button", { name: copy.reviewingEstimates })).toBeDisabled();
    await act(async () => task.resolve());
  });

  it("disables the pending estimate-review action", async () => {
    const task = deferred();
    renderScreen({ onReviewClassifications: () => task.promise });
    fireEvent.click(screen.getByRole("button", { name: copy.reviewEstimates }));
    expect(await screen.findByRole("button", { name: copy.reviewingEstimates })).toBeDisabled();
    await act(async () => task.resolve());
  });

  it("prevents duplicate estimate-review activation", async () => {
    const task = deferred();
    const onReviewClassifications = vi.fn(() => task.promise);
    renderScreen({ onReviewClassifications });
    const button = screen.getByRole("button", { name: copy.reviewEstimates });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onReviewClassifications).toHaveBeenCalledTimes(1);
    await act(async () => task.resolve());
  });

  it("renders host face-map asset", () => {
    renderScreen();
    expect(getMapImage()).toHaveAttribute("src", baseReport.faceMap.imageUrl);
  });

  it("uses host map alt text", () => {
    renderScreen();
    expect(getMapImage()).toHaveAttribute("alt", baseReport.faceMap.alt);
  });

  it("uses object-contain map styling", () => {
    renderScreen();
    expect(getMapImage()).toHaveClass("object-contain");
  });

  it("marks map loading state as polite status", () => {
    renderScreen();
    expect(screen.getByText(copy.mapLoading).closest('[role="status"]')).toHaveAttribute("aria-live", "polite");
  });

  it("hides map with privacy action", () => {
    renderScreen();
    fireEvent.click(screen.getByRole("button", { name: copy.hideMap }));
    expect(screen.queryByRole("img", { name: baseReport.faceMap.alt })).not.toBeInTheDocument();
  });

  it("shows map again after privacy hide", () => {
    renderScreen();
    fireEvent.click(screen.getByRole("button", { name: copy.hideMap }));
    fireEvent.click(screen.getAllByRole("button", { name: copy.showMap })[0]);
    expect(getMapImage()).toBeInTheDocument();
  });

  it("uses alert semantics for map error", () => {
    renderScreen();
    fireEvent.error(getMapImage());
    expect(screen.getByRole("alert")).toHaveTextContent(copy.mapUnavailableHeading);
  });

  it("keeps text report visible after map error", () => {
    renderScreen();
    fireEvent.error(getMapImage());
    expect(screen.getByRole("heading", { name: copy.visiblePatternsHeading })).toBeInTheDocument();
  });

  it("reports a failed map URL once", async () => {
    const onFaceMapLoadError = vi.fn();
    renderScreen({ onFaceMapLoadError });
    fireEvent.error(getMapImage());
    await waitFor(() => expect(onFaceMapLoadError).toHaveBeenCalledTimes(1));
  });

  it("shows toast when map-error callback rejects", async () => {
    renderScreen({ onFaceMapLoadError: () => Promise.reject(new Error("no")) });
    fireEvent.error(getMapImage());
    expect(await screen.findByText(copy.mapCallbackError)).toBeInTheDocument();
  });

  it("switches to region-specific map URL", () => {
    renderScreen();
    fireEvent.click(screen.getByRole("button", { name: "Cheeks" }));
    expect(getMapImage()).toHaveAttribute("src", "/maps/cheeks.png");
  });

  it("resets loading state when selected map URL changes", () => {
    renderScreen();
    fireEvent.load(getMapImage());
    expect(screen.queryByText(copy.mapLoading)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cheeks" }));
    expect(screen.getByText(copy.mapLoading)).toBeInTheDocument();
  });

  it("renders unavailable state when no map URL exists", () => {
    renderScreen({ report: reportWith({ faceMap: { alt: "No map", legend: [] }, regions: [] }) });
    expect(screen.getByText(copy.mapUnavailableHeading)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: copy.visiblePatternsHeading })).toBeInTheDocument();
  });


  it("hides map privacy controls when no face-map URL exists", () => {
    renderScreen({ report: reportWith({ faceMap: { alt: "No map", legend: [] }, regions: [] }) });
    expect(screen.queryByRole("button", { name: copy.hideMap })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.showMap })).not.toBeInTheDocument();
  });

  it("hides map privacy controls after the active map URL fails", () => {
    renderScreen();
    fireEvent.error(getMapImage());
    expect(screen.queryByRole("button", { name: copy.hideMap })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.showMap })).not.toBeInTheDocument();
  });

  it("disables contextual map reveal while another operation is pending", async () => {
    const task = deferred();
    renderScreen({ onReviewClassifications: () => task.promise });
    fireEvent.click(screen.getByRole("button", { name: copy.hideMap }));
    fireEvent.click(screen.getByRole("button", { name: copy.reviewEstimates }));
    const revealButtons = await screen.findAllByRole("button", { name: copy.showMap });
    expect(revealButtons.at(-1)).toBeDisabled();
    await act(async () => task.resolve());
  });

  it("does not reveal the map from the disabled contextual action", async () => {
    const task = deferred();
    renderScreen({ onReviewClassifications: () => task.promise });
    fireEvent.click(screen.getByRole("button", { name: copy.hideMap }));
    fireEvent.click(screen.getByRole("button", { name: copy.reviewEstimates }));
    const revealButtons = await screen.findAllByRole("button", { name: copy.showMap });
    fireEvent.click(revealButtons.at(-1)!);
    expect(screen.queryByRole("img", { name: baseReport.faceMap.alt })).not.toBeInTheDocument();
    await act(async () => task.resolve());
  });

  it("uses primary text for sand-tone legend contrast", () => {
    renderScreen();
    const sandLegendItem = screen.getByText("Texture context");
    expect(sandLegendItem).toHaveClass("text-[var(--dl-text-primary)]");
    expect(sandLegendItem).not.toHaveClass("text-[var(--dl-bark)]");
  });

  it("resets map error state when a new report reuses the same URL", async () => {
    const { props, rerender } = renderScreen();
    fireEvent.error(getMapImage());
    expect(screen.getByRole("alert")).toHaveTextContent(copy.mapUnavailableHeading);
    rerender(<FullReportDetailScreen {...props} report={reportWith({ reportId: "detail-2" })} />);
    expect(await screen.findByText(copy.mapLoading)).toBeInTheDocument();
  });

  it("remounts a loaded map when a new report reuses the same URL", () => {
    const { props, rerender } = renderScreen();

    const firstImage = getMapImage();
    fireEvent.load(firstImage);

    expect(screen.queryByText(copy.mapLoading)).not.toBeInTheDocument();

    rerender(
      <FullReportDetailScreen
        {...props}
        report={reportWith({
          reportId: "detail-2",
        })}
      />,
    );

    const secondImage = getMapImage();

    expect(secondImage).not.toBe(firstImage);
    expect(screen.getByText(copy.mapLoading)).toBeInTheDocument();

    fireEvent.load(secondImage);

    expect(screen.queryByText(copy.mapLoading)).not.toBeInTheDocument();
  });

  it("preserves legend ordering", () => {
    renderScreen();
    expect(within(screen.getByTestId("map-legend-list")).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Visible pattern", "Texture context", "Worth attention"]);
  });

  it("renders legend labels as text", () => {
    renderScreen();
    expect(screen.getByText("Visible pattern")).toBeVisible();
  });

  it("preserves region chip ordering", () => {
    renderScreen();
    expect(within(screen.getByTestId("region-chip-list")).getAllByRole("button").map((button) => button.textContent)).toEqual(["Forehead", "Cheeks", "Chin"]);
  });

  it("uses aria-pressed on region chips", () => {
    renderScreen();
    expect(screen.getByRole("button", { name: "Forehead" })).toHaveAttribute("aria-pressed", "true");
  });

  it("respects valid initial region selection", () => {
    renderScreen({ initialSelectedRegionId: "cheeks" });
    expect(screen.getByRole("button", { name: "Cheeks" })).toHaveAttribute("aria-pressed", "true");
  });

  it("falls back to first region for invalid initial selection", () => {
    renderScreen({ initialSelectedRegionId: "missing" });
    expect(screen.getByRole("button", { name: "Forehead" })).toHaveAttribute("aria-pressed", "true");
  });

  it("changes findings when a region is selected", () => {
    renderScreen();
    expect(screen.getByText("Visible texture")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cheeks" }));
    expect(screen.getByText("Comfort signal")).toBeInTheDocument();
  });

  it("preserves region-finding order", () => {
    renderScreen();
    expect(within(screen.getByTestId("region-finding-list")).getAllByRole("listitem").map((item) => item.querySelector("h3")?.textContent)).toEqual(["Visible texture", "Hydration support"]);
  });

  it("renders empty copy for selected region without findings", () => {
    renderScreen();
    fireEvent.click(screen.getByRole("button", { name: "Chin" }));
    expect(screen.getByText(copy.noRegionFindings)).toBeInTheDocument();
  });

  it("renders no-regions copy when region list is empty", () => {
    renderScreen({ report: reportWith({ regions: [] }) });
    expect(screen.getByText(copy.noRegions)).toBeInTheDocument();
  });

  it("renders optional finding metadata chips", () => {
    renderScreen();
    expect(screen.getByText("Visible")).toBeInTheDocument();
    expect(screen.getByText("Localised")).toBeInTheDocument();
    expect(screen.getByText("Host estimate")).toBeInTheDocument();
  });

  it("renders natural-features heading", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: copy.naturalFeaturesHeading })).toBeInTheDocument();
  });

  it("preserves natural-feature ordering", () => {
    renderScreen();
    expect(within(screen.getByTestId("natural-feature-list")).getAllByRole("listitem").map((item) => item.querySelector("h3")?.textContent)).toEqual(["Freckle pattern", "Natural crease"]);
  });

  it("does not style natural-feature rows as warnings", () => {
    renderScreen();
    for (const row of screen.getAllByTestId("natural-feature-row")) expect(row.className).not.toContain("warning");
  });

  it("renders empty natural-feature copy", () => {
    renderScreen({ report: reportWith({ naturalFeatures: [] }) });
    expect(screen.getByText(copy.noNaturalFeatures)).toBeInTheDocument();
  });

  it("renders natural-features helper", () => {
    renderScreen();
    expect(screen.getByText(copy.naturalFeaturesHelper)).toBeInTheDocument();
  });

  it("keeps estimated-measurements accordion collapsed by default", () => {
    renderScreen();
    const details = screen.getByText(copy.metricsHeading).closest("details");
    expect(details).not.toHaveAttribute("open");
  });

  it("expands estimated measurements", () => {
    renderScreen();
    fireEvent.click(screen.getByText(copy.metricsHeading).closest("summary")!);
    expect(screen.getByTestId("metrics-list")).toBeVisible();
  });

  it("preserves metric ordering", () => {
    renderScreen();
    fireEvent.click(screen.getByText(copy.metricsHeading).closest("summary")!);
    expect(within(screen.getByTestId("metrics-list")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Texture estimateMildly unevenHost-supplied descriptive estimate.",
      "Pore-size distributionMore visible through centre",
    ]);
  });

  it("renders empty metrics copy", () => {
    renderScreen({ report: reportWith({ estimatedMetrics: [] }) });
    fireEvent.click(screen.getByText(copy.metricsHeading).closest("summary")!);
    expect(screen.getByText(copy.noMetrics)).toBeInTheDocument();
  });

  it("keeps photo-quality accordion collapsed by default", () => {
    renderScreen();
    expect(screen.getByText(copy.photoQualityHeading).closest("details")).not.toHaveAttribute("open");
  });

  it("expands photo-quality accordion", () => {
    renderScreen();
    fireEvent.click(screen.getByText(copy.photoQualityHeading).closest("summary")!);
    expect(screen.getByText(baseReport.photoQuality.outcomeLabel)).toBeVisible();
  });

  it("renders host quality outcome", () => {
    renderScreen();
    fireEvent.click(screen.getByText(copy.photoQualityHeading).closest("summary")!);
    expect(screen.getByText(baseReport.photoQuality.outcomeLabel)).toBeInTheDocument();
  });

  it("preserves host quality-check order", () => {
    renderScreen();
    fireEvent.click(screen.getByText(copy.photoQualityHeading).closest("summary")!);
    expect(within(screen.getByTestId("photo-quality-list")).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["LightingEven", "FocusClear", "ResolutionSuitable"]);
  });

  it("invokes Build Routine", () => {
    const onOpenRoutine = vi.fn();
    renderScreen({ onOpenRoutine });
    fireEvent.click(screen.getByRole("button", { name: copy.buildRoutine }));
    expect(onOpenRoutine).toHaveBeenCalledTimes(1);
  });

  it("shows routine toast on rejection", async () => {
    renderScreen({ onOpenRoutine: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.buildRoutine }));
    expect(await screen.findByText(copy.routineError)).toBeInTheDocument();
  });

  it("does not disable offline routine when host permits", () => {
    renderScreen({ isOffline: true, canBuildRoutine: true });
    expect(screen.getByRole("button", { name: copy.buildRoutine })).toBeEnabled();
  });

  it("labels offline blocked routine with reconnect copy", () => {
    renderScreen({ isOffline: true, canBuildRoutine: false });
    expect(screen.getByRole("button", { name: copy.reconnectForRoutine })).toBeDisabled();
  });

  it("labels online blocked routine unavailable", () => {
    renderScreen({ isOffline: false, canBuildRoutine: false });
    expect(screen.getByRole("button", { name: copy.routineUnavailable })).toBeDisabled();
  });

  it("invokes Back to summary", () => {
    const onBack = vi.fn();
    renderScreen({ onBack });
    fireEvent.click(screen.getByRole("button", { name: copy.backToSummary }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows back toast on rejection", async () => {
    renderScreen({ onBack: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.backToSummary }));
    expect(await screen.findByText(copy.backError)).toBeInTheDocument();
  });

  it("locks conflicting actions while routine opens", async () => {
    const task = deferred();
    renderScreen({ onOpenRoutine: () => task.promise });
    fireEvent.click(screen.getByRole("button", { name: copy.buildRoutine }));
    expect(screen.getByRole("button", { name: copy.preparingRoutine })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.backToSummary })).toBeDisabled();
    await act(async () => task.resolve());
  });

  it("prevents duplicate routine activation", async () => {
    const task = deferred(); const onOpenRoutine = vi.fn(() => task.promise);
    renderScreen({ onOpenRoutine });
    const button = screen.getByRole("button", { name: copy.buildRoutine });
    fireEvent.click(button); fireEvent.click(button);
    expect(onOpenRoutine).toHaveBeenCalledTimes(1);
    await act(async () => task.resolve());
  });

  it("shows report-actions trigger only with callback and usable report", () => {
    renderScreen({ onShareReport: vi.fn() });
    expect(screen.getByRole("button", { name: copy.reportActions })).toBeInTheDocument();
    cleanup();
    renderScreen();
    expect(screen.queryByRole("button", { name: copy.reportActions })).not.toBeInTheDocument();
  });

  it("opens actions sheet", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toBeInTheDocument();
  });

  it("uses dialog semantics", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toHaveAttribute("aria-modal", "true");
  });

  it("traps focus", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    const dialog = screen.getByRole("dialog", { name: copy.reportActions });
    const close = screen.getByRole("button", { name: "Close report actions" });
    close.focus(); fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes sheet on Escape while idle", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument();
  });

  it("closes sheet on idle backdrop click", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    fireEvent.mouseDown(screen.getByTestId("report-actions-backdrop"));
    expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument();
  });

  it("sets background inert while sheet is open", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    expect(screen.getByTestId("detail-app-shell")).toHaveAttribute("inert");
  });

  it("locks body scrolling while sheet is open", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("shows Share only when supplied", async () => {
    renderScreen({ onDownloadReport: vi.fn() });
    await openActionsSheet();
    expect(screen.queryByRole("button", { name: copy.shareReport })).not.toBeInTheDocument();
  });

  it("invokes Share", async () => {
    const onShareReport = vi.fn();
    renderScreen({ onShareReport });
    await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    expect(onShareReport).toHaveBeenCalledTimes(1);
  });

  it("keeps sheet open and toasts on Share rejection", async () => {
    renderScreen({ onShareReport: () => Promise.reject(new Error("no")) });
    await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    expect(await screen.findByText(copy.shareError)).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toBeInTheDocument();
  });

  it("shows Download only when supplied", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    expect(screen.queryByRole("button", { name: copy.downloadReport })).not.toBeInTheDocument();
  });

  it("invokes Download", async () => {
    const onDownloadReport = vi.fn();
    renderScreen({ onDownloadReport });
    await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.downloadReport }));
    expect(onDownloadReport).toHaveBeenCalledTimes(1);
  });

  it("keeps sheet open and toasts on Download rejection", async () => {
    renderScreen({ onDownloadReport: () => Promise.reject(new Error("no")) });
    await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.downloadReport }));
    expect(await screen.findByText(copy.downloadError)).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toBeInTheDocument();
  });

  it("shows Retake only when supplied", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    expect(screen.queryByRole("button", { name: copy.retakePhoto })).not.toBeInTheDocument();
  });

  it("invokes Retake", async () => {
    const onRetakePhoto = vi.fn();
    renderScreen({ onRetakePhoto });
    await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.retakePhoto }));
    expect(onRetakePhoto).toHaveBeenCalledTimes(1);
  });

  it("keeps sheet open and toasts on Retake rejection", async () => {
    renderScreen({ onRetakePhoto: () => Promise.reject(new Error("no")) });
    await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.retakePhoto }));
    expect(await screen.findByText(copy.retakeError)).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toBeInTheDocument();
  });

  it("disables sheet controls during pending action", async () => {
    const task = deferred();
    renderScreen({ onShareReport: () => task.promise, onDownloadReport: vi.fn() });
    await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    expect(screen.getByRole("button", { name: copy.preparingShare })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.downloadReport })).toBeDisabled();
    await act(async () => task.resolve());
  });

  it("prevents duplicate sheet activation", async () => {
    const task = deferred(); const onShareReport = vi.fn(() => task.promise);
    renderScreen({ onShareReport });
    await openActionsSheet(); const button = screen.getByRole("button", { name: copy.shareReport });
    fireEvent.click(button); fireEvent.click(button);
    expect(onShareReport).toHaveBeenCalledTimes(1);
    await act(async () => task.resolve());
  });

  it("restores trigger focus after deferred animation frame", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { frames.push(callback); return frames.length; });
    renderScreen({ onShareReport: vi.fn() });
    const trigger = await openActionsSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).not.toBe(trigger);
    frames.splice(0).forEach((callback) => callback(0));
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps focus inside sheet while pending", async () => {
    const task = deferred();
    renderScreen({ onShareReport: () => task.promise });
    const trigger = await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    trigger.focus();
    await waitFor(() => expect(screen.getByRole("dialog", { name: copy.reportActions }).contains(document.activeElement)).toBe(true));
    await act(async () => task.resolve());
  });

  it("does not close on Escape while pending", async () => {
    const task = deferred();
    renderScreen({ onShareReport: () => task.promise });
    await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.shareReport })); fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toBeInTheDocument();
    await act(async () => task.resolve());
  });

  it("keeps scrolling locked while pending", async () => {
    const task = deferred();
    renderScreen({ onShareReport: () => task.promise });
    await openActionsSheet(); fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    expect(document.body.style.overflow).toBe("hidden");
    await act(async () => task.resolve());
  });

  it("closes stale sheet when report disappears", async () => {
    const { rerender, props } = renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    rerender(<FullReportDetailScreen {...props} report={null} />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("closes stale sheet when state becomes loading", async () => {
    const { rerender, props } = renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet(); rerender(<FullReportDetailScreen {...props} state="loading" />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("closes stale sheet when state becomes error", async () => {
    const { rerender, props } = renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet(); rerender(<FullReportDetailScreen {...props} state="error" />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("closes stale sheet when optional callbacks disappear", async () => {
    const { rerender, props } = renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet(); rerender(<FullReportDetailScreen {...props} onShareReport={undefined} />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("renders no live video", () => {
    renderScreen(); expect(document.querySelector("video")).not.toBeInTheDocument();
  });

  it("renders no file input", () => {
    renderScreen(); expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  it("does not call camera API", () => {
    const getUserMedia = vi.fn(); Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    renderScreen(); expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("does not request geolocation", () => {
    const getCurrentPosition = vi.fn(); Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
    renderScreen(); expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("does not call analysis API", () => {
    const fetch = vi.fn(); Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetch });
    renderScreen(); expect(fetch).not.toHaveBeenCalled();
  });

  it("does not generate a map inside React", () => {
    renderScreen(); expect(document.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("does not draw coordinate landmarks", () => {
    renderScreen(); expect(document.querySelector("[data-landmark], [data-coordinate]")).not.toBeInTheDocument();
  });

  it("does not generate recommendations", () => {
    renderScreen(); expect(screen.queryByText("Recommended products")).not.toBeInTheDocument();
  });

  it("renders no bottom navigation", () => {
    renderScreen(); expect(document.querySelector("nav")).not.toBeInTheDocument();
  });

  it("copy excludes prohibited clinical phrases", () => {
    const allCopy = Object.values(copy).join(" ").toLowerCase();
    for (const phrase of ["overall skin health", "diagnosed conditions", "disease detected", "clinically confirmed", "identity verified", "ethnicity classification", "medical advice"]) expect(allCopy).not.toContain(phrase);
  });

  it("restores mocked browser descriptors", () => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: vi.fn() } });
    restoreDescriptor(navigator, "geolocation", originalGeolocationDescriptor);
    expect(Object.getOwnPropertyDescriptor(navigator, "geolocation")).toEqual(originalGeolocationDescriptor);
  });
});
