import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnalysisProcessingScreen, {
  analysisStageOrder,
  copy,
  getStageLabel,
  type AnalysisProcessingScreenProps,
  type AnalysisStage,
} from "./analysis-processing-screen";

type Deferred<T = void> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const defaultProps: AnalysisProcessingScreenProps = {
  profileName: "  Amara  ",
  onCancelAnalysis: vi.fn(),
};

function renderScreen(overrides: Partial<AnalysisProcessingScreenProps> = {}) {
  return render(<AnalysisProcessingScreen {...defaultProps} {...overrides} />);
}

function getCancelTrigger() {
  return screen.getByRole("button", { name: copy.cancel });
}

function openCancelSheet() {
  fireEvent.click(getCancelTrigger());
  return screen.getByRole("dialog", { name: copy.cancelSheetHeading });
}

const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
const originalGeolocationDescriptor = Object.getOwnPropertyDescriptor(navigator, "geolocation");
const originalFetch = globalThis.fetch;

function restoreNavigatorDescriptor(key: "mediaDevices" | "geolocation", descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(navigator, key, descriptor);
  else delete (navigator as Navigator & Record<string, unknown>)[key];
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  restoreNavigatorDescriptor("mediaDevices", originalMediaDevicesDescriptor);
  restoreNavigatorDescriptor("geolocation", originalGeolocationDescriptor);
  globalThis.fetch = originalFetch;
  document.body.style.overflow = "";
});

describe("AnalysisProcessingScreen", () => {
  it("renders the processing heading in the preparing state", () => {
    renderScreen({ processingState: "preparing" });
    expect(screen.getByRole("heading", { level: 1, name: copy.processingHeading })).toBeInTheDocument();
  });

  it("renders the processing heading in the processing state", () => {
    renderScreen({ processingState: "processing" });
    expect(screen.getByRole("heading", { level: 1, name: copy.processingHeading })).toBeInTheDocument();
  });

  it("displays the active profile name", () => {
    renderScreen();
    expect(screen.getByText("Amara")).toBeInTheDocument();
  });

  it("derives the profile initial from the trimmed name", () => {
    renderScreen({ profileName: "  amara" });
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("uses a question mark when the profile name is blank", () => {
    renderScreen({ profileName: "   " });
    expect(screen.getAllByText("?").length).toBeGreaterThan(0);
  });

  it("renders all five stages", () => {
    renderScreen();
    for (const stage of analysisStageOrder) expect(screen.getByText(getStageLabel(stage))).toBeInTheDocument();
  });

  it("maps every stage label", () => {
    const expected: Record<AnalysisStage, string> = {
      "preparing-photo": copy.stagePreparingPhoto,
      "mapping-regions": copy.stageMappingRegions,
      "reviewing-visible-concerns": copy.stageReviewingVisibleConcerns,
      "preparing-guidance": copy.stagePreparingGuidance,
      "finalising-report": copy.stageFinalisingReport,
    };
    for (const stage of analysisStageOrder) expect(getStageLabel(stage)).toBe(expected[stage]);
  });

  it("renders completed visual state when the host marks a stage completed", () => {
    renderScreen({ activeStage: "mapping-regions", completedStages: ["preparing-photo"] });
    expect(screen.getByText(copy.stagePreparingPhoto).closest("li")).toHaveAttribute("data-state", "completed");
  });

  it("marks the active stage with aria-current step", () => {
    renderScreen({ activeStage: "mapping-regions" });
    expect(screen.getByText(copy.stageMappingRegions).closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("marks the active stage as a polite status", () => {
    renderScreen({ activeStage: "mapping-regions" });
    const row = screen.getByText(copy.stageMappingRegions).closest("li");
    expect(row).toHaveAttribute("role", "status");
    expect(row).toHaveAttribute("aria-live", "polite");
  });

  it("renders pending visual state without inferring completion by position", () => {
    renderScreen({ activeStage: "finalising-report", completedStages: [] });
    expect(screen.getByText(copy.stagePreparingPhoto).closest("li")).toHaveAttribute("data-state", "pending");
  });

  it("does not automatically advance stages", () => {
    vi.useFakeTimers();
    renderScreen({ activeStage: "preparing-photo" });
    expect(screen.getByText(copy.stagePreparingPhoto).closest("li")).toHaveAttribute("aria-current", "step");
    vi.advanceTimersByTime(60_000);
    expect(screen.getByText(copy.stagePreparingPhoto).closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("omits measured progress when not supplied", () => {
    renderScreen();
    expect(screen.queryByRole("progressbar", { name: copy.measuredProgressLabel })).not.toBeInTheDocument();
  });

  it("renders measured progress when supplied", () => {
    renderScreen({ measuredProgressPercent: 43 });
    expect(screen.getByRole("progressbar", { name: copy.measuredProgressLabel })).toHaveAttribute("aria-valuenow", "43");
    expect(screen.getByText("43%")).toBeInTheDocument();
  });

  it("clamps measured progress values below zero", () => {
    renderScreen({ measuredProgressPercent: -8 });
    expect(screen.getByRole("progressbar", { name: copy.measuredProgressLabel })).toHaveAttribute("aria-valuenow", "0");
  });

  it("clamps measured progress values above one hundred", () => {
    renderScreen({ measuredProgressPercent: 180 });
    expect(screen.getByRole("progressbar", { name: copy.measuredProgressLabel })).toHaveAttribute("aria-valuenow", "100");
  });

  it("uses progressbar semantics for measured progress", () => {
    renderScreen({ measuredProgressPercent: 60 });
    const progress = screen.getByRole("progressbar", { name: copy.measuredProgressLabel });
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
    expect(progress).toHaveAttribute("aria-valuenow", "60");
  });

  it("shows the long-running note only when requested", () => {
    const { rerender } = render(<AnalysisProcessingScreen {...defaultProps} />);
    expect(screen.queryByText(copy.takingLonger)).not.toBeInTheDocument();
    rerender(<AnalysisProcessingScreen {...defaultProps} isTakingLongerThanExpected />);
    expect(screen.getByText(copy.takingLonger)).toBeInTheDocument();
  });

  it("renders the waiting heading", () => {
    renderScreen({ processingState: "waiting-for-connection" });
    expect(screen.getByRole("heading", { level: 1, name: copy.waitingHeading })).toBeInTheDocument();
  });

  it("announces the waiting state politely", () => {
    renderScreen({ processingState: "waiting-for-connection" });
    const heading = screen.getByRole("heading", { level: 1, name: copy.waitingHeading });
    const status = heading.closest('[role="status"]');
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("does not render an active spinning aperture mark while offline processing is blocked", () => {
    renderScreen({ processingState: "waiting-for-connection", canProcessOffline: false });
    expect(screen.queryByTestId("aperture-progress-mark")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Analysis stages")).not.toBeInTheDocument();
  });

  it("allows an offline-capable waiting view to render the host-controlled stage card", () => {
    renderScreen({ processingState: "waiting-for-connection", canProcessOffline: true });
    expect(screen.getByLabelText("Analysis stages")).toBeInTheDocument();
  });

  it("renders the complete-state heading", () => {
    renderScreen({ processingState: "complete" });
    expect(screen.getByRole("heading", { level: 1, name: copy.completeHeading })).toBeInTheDocument();
  });

  it("shows View Results only when its callback exists", () => {
    const { rerender } = render(<AnalysisProcessingScreen {...defaultProps} processingState="complete" />);
    expect(screen.queryByRole("button", { name: copy.viewResults })).not.toBeInTheDocument();
    rerender(<AnalysisProcessingScreen {...defaultProps} onViewResults={vi.fn()} processingState="complete" />);
    expect(screen.getByRole("button", { name: copy.viewResults })).toBeInTheDocument();
  });

  it("invokes the View Results callback", () => {
    const onViewResults = vi.fn();
    renderScreen({ processingState: "complete", onViewResults });
    fireEvent.click(screen.getByRole("button", { name: copy.viewResults }));
    expect(onViewResults).toHaveBeenCalledTimes(1);
  });

  it("shows a toast when View Results rejects", async () => {
    renderScreen({ processingState: "complete", onViewResults: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.viewResults }));
    expect(await screen.findByText(copy.resultsRouteError)).toBeInTheDocument();
  });

  it("renders the error-state heading", () => {
    renderScreen({ processingState: "error" });
    expect(screen.getByRole("heading", { level: 1, name: copy.errorHeading })).toBeInTheDocument();
  });

  it("shows Retry only when its callback exists", () => {
    const { rerender } = render(<AnalysisProcessingScreen {...defaultProps} processingState="error" />);
    expect(screen.queryByRole("button", { name: copy.retry })).not.toBeInTheDocument();
    rerender(<AnalysisProcessingScreen {...defaultProps} onRetryAnalysis={vi.fn()} processingState="error" />);
    expect(screen.getByRole("button", { name: copy.retry })).toBeInTheDocument();
  });

  it("invokes Retry", () => {
    const onRetryAnalysis = vi.fn();
    renderScreen({ processingState: "error", onRetryAnalysis });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(onRetryAnalysis).toHaveBeenCalledTimes(1);
  });

  it("shows a toast when Retry rejects", async () => {
    renderScreen({ processingState: "error", onRetryAnalysis: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
  });

  it("shows Return to photo review only when its callback exists", () => {
    const { rerender } = render(<AnalysisProcessingScreen {...defaultProps} processingState="error" />);
    expect(screen.queryByRole("button", { name: copy.returnToReview })).not.toBeInTheDocument();
    rerender(<AnalysisProcessingScreen {...defaultProps} onReturnToPhotoReview={vi.fn()} processingState="error" />);
    expect(screen.getByRole("button", { name: copy.returnToReview })).toBeInTheDocument();
  });

  it("invokes Return to photo review", () => {
    const onReturnToPhotoReview = vi.fn();
    renderScreen({ processingState: "error", onReturnToPhotoReview });
    fireEvent.click(screen.getByRole("button", { name: copy.returnToReview }));
    expect(onReturnToPhotoReview).toHaveBeenCalledTimes(1);
  });

  it("shows a toast when Return to photo review rejects", async () => {
    renderScreen({ processingState: "error", onReturnToPhotoReview: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.returnToReview }));
    expect(await screen.findByText(copy.reviewRouteError)).toBeInTheDocument();
  });

  it("opens the cancellation sheet from the cancel trigger", () => {
    renderScreen();
    expect(openCancelSheet()).toBeInTheDocument();
  });

  it("uses dialog semantics for the cancellation sheet", () => {
    renderScreen();
    expect(openCancelSheet()).toHaveAttribute("aria-modal", "true");
  });

  it("traps focus inside the cancellation sheet", async () => {
    renderScreen();
    const dialog = openCancelSheet();
    const close = within(dialog).getByRole("button", { name: "Close cancellation confirmation" });
    const keep = within(dialog).getByRole("button", { name: copy.keepAnalysing });
    await waitFor(() => expect(close).toHaveFocus());
    keep.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(keep).toHaveFocus();
  });

  it("closes the cancellation sheet on Escape while idle", () => {
    renderScreen();
    openCancelSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: copy.cancelSheetHeading })).not.toBeInTheDocument();
  });

  it("closes the cancellation sheet after a backdrop click while idle", () => {
    renderScreen();
    openCancelSheet();
    fireEvent.mouseDown(screen.getByTestId("cancel-sheet-backdrop"));
    expect(screen.queryByRole("dialog", { name: copy.cancelSheetHeading })).not.toBeInTheDocument();
  });

  it("closes the sheet when Keep analysing is activated", () => {
    renderScreen();
    openCancelSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.keepAnalysing }));
    expect(screen.queryByRole("dialog", { name: copy.cancelSheetHeading })).not.toBeInTheDocument();
  });

  it("invokes Stop analysis only after confirmation", () => {
    const onCancelAnalysis = vi.fn();
    renderScreen({ onCancelAnalysis });
    openCancelSheet();
    expect(onCancelAnalysis).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: copy.confirmCancel }));
    expect(onCancelAnalysis).toHaveBeenCalledTimes(1);
  });

  it("disables cancellation-sheet actions while stopping", () => {
    const pending = deferred<void>();
    renderScreen({ onCancelAnalysis: vi.fn(() => pending.promise) });
    openCancelSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.confirmCancel }));
    expect(screen.getByRole("button", { name: copy.stoppingAnalysis })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.keepAnalysing })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close cancellation confirmation" })).toBeDisabled();
  });

  it("prevents duplicate cancellation", () => {
    const pending = deferred<void>();
    const onCancelAnalysis = vi.fn(() => pending.promise);
    renderScreen({ onCancelAnalysis });
    openCancelSheet();
    const confirm = screen.getByRole("button", { name: copy.confirmCancel });
    fireEvent.click(confirm);
    fireEvent.click(screen.getByRole("button", { name: copy.stoppingAnalysis }));
    expect(onCancelAnalysis).toHaveBeenCalledTimes(1);
  });

  it("keeps the cancellation sheet open after cancellation failure", async () => {
    renderScreen({ onCancelAnalysis: vi.fn().mockRejectedValue(new Error("no")) });
    openCancelSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.confirmCancel }));
    expect(await screen.findByRole("dialog", { name: copy.cancelSheetHeading })).toBeInTheDocument();
  });

  it("shows a toast after cancellation failure", async () => {
    renderScreen({ onCancelAnalysis: vi.fn().mockRejectedValue(new Error("no")) });
    openCancelSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.confirmCancel }));
    expect(await screen.findByText(copy.cancelError)).toBeInTheDocument();
  });

  it("returns focus to the cancel trigger after the sheet closes", async () => {
    renderScreen();
    const trigger = getCancelTrigger();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: copy.keepAnalysing }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("applies inert to the background while the cancellation sheet is open", () => {
    renderScreen();
    openCancelSheet();
    expect(screen.getByTestId("analysis-app-shell")).toHaveAttribute("inert");
  });

  it("locks background scrolling while the cancellation sheet is open", () => {
    renderScreen();
    openCancelSheet();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("does not use a timer to advance host-controlled analysis stages", () => {
    vi.useFakeTimers();
    renderScreen({ activeStage: "mapping-regions", completedStages: ["preparing-photo"] });
    vi.advanceTimersByTime(300_000);
    expect(screen.getByText(copy.stageMappingRegions).closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText(copy.stagePreparingGuidance).closest("li")).toHaveAttribute("data-state", "pending");
  });

  it("does not invoke an analysis API from the component", () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
    renderScreen();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not invoke a camera API", () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    renderScreen();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("does not render a file input", () => {
    const { container } = renderScreen();
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  it("does not render a video element", () => {
    const { container } = renderScreen();
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("does not request geolocation", () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
    renderScreen();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("restores mocked browser API descriptors after relevant tests", () => {
    expect(Object.getOwnPropertyDescriptor(navigator, "mediaDevices")).toEqual(originalMediaDevicesDescriptor);
    expect(Object.getOwnPropertyDescriptor(navigator, "geolocation")).toEqual(originalGeolocationDescriptor);
  });

  it("does not include incomplete skin findings in the copy object", () => {
    const allCopy = Object.values(copy).join(" ").toLowerCase();
    for (const forbidden of ["acne count", "pore value", "severity score", "confirmed condition", "disease detection", "identity verification"]) {
      expect(allCopy).not.toContain(forbidden);
    }
  });

  it("defensively pauses an active processing view when offline processing is unavailable", () => {
    renderScreen({ processingState: "processing", isOffline: true, canProcessOffline: false });
    expect(screen.getByRole("heading", { level: 1, name: copy.waitingHeading })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: copy.processingHeading })).not.toBeInTheDocument();
  });

  it("does not render the spinning aperture mark in the defensive offline-paused state", () => {
    renderScreen({ processingState: "processing", isOffline: true, canProcessOffline: false });
    expect(screen.queryByTestId("aperture-progress-mark")).not.toBeInTheDocument();
  });

  it("uses the local-processing context label while continuing offline on this device", () => {
    renderScreen({ processingState: "waiting-for-connection", isOffline: true, canProcessOffline: true });
    expect(screen.getByText(copy.localContextLabel)).toBeInTheDocument();
  });

  it("uses the local-processing heading while continuing offline on this device", () => {
    renderScreen({ processingState: "waiting-for-connection", isOffline: true, canProcessOffline: true });
    expect(screen.getByRole("heading", { level: 1, name: copy.localProcessingHeading })).toBeInTheDocument();
  });

  it("uses the paused context label when offline processing cannot continue", () => {
    renderScreen({ processingState: "processing", isOffline: true, canProcessOffline: false });
    expect(screen.getByText(copy.pausedContextLabel)).toBeInTheDocument();
  });

  it("uses the waiting heading when offline processing cannot continue", () => {
    renderScreen({ processingState: "processing", isOffline: true, canProcessOffline: false });
    expect(screen.getByRole("heading", { level: 1, name: copy.waitingHeading })).toBeInTheDocument();
  });

  it("omits measured progress when the supplied value is NaN", () => {
    renderScreen({ measuredProgressPercent: Number.NaN });
    expect(screen.queryByRole("progressbar", { name: copy.measuredProgressLabel })).not.toBeInTheDocument();
  });

  it("omits measured progress when the supplied value is positive infinity", () => {
    renderScreen({ measuredProgressPercent: Number.POSITIVE_INFINITY });
    expect(screen.queryByRole("progressbar", { name: copy.measuredProgressLabel })).not.toBeInTheDocument();
  });

  it("omits measured progress when the supplied value is negative infinity", () => {
    renderScreen({ measuredProgressPercent: Number.NEGATIVE_INFINITY });
    expect(screen.queryByRole("progressbar", { name: copy.measuredProgressLabel })).not.toBeInTheDocument();
  });

  it("restores focus to the top-bar Cancel trigger that opened the sheet", async () => {
    renderScreen();
    const trigger = screen.getByRole("button", { name: copy.cancel });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: copy.keepAnalysing }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("restores focus to the lower Cancel analysis trigger that opened the sheet", async () => {
    renderScreen({ processingState: "waiting-for-connection" });
    const trigger = screen.getByRole("button", { name: copy.cancelAnalysis });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: copy.keepAnalysing }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes an idle cancellation sheet when processing completes", async () => {
    const { rerender } = render(<AnalysisProcessingScreen {...defaultProps} processingState="processing" />);
    openCancelSheet();
    rerender(<AnalysisProcessingScreen {...defaultProps} processingState="complete" />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.cancelSheetHeading })).not.toBeInTheDocument());
  });

  it("closes an idle cancellation sheet when processing fails", async () => {
    const { rerender } = render(<AnalysisProcessingScreen {...defaultProps} processingState="processing" />);
    openCancelSheet();
    rerender(<AnalysisProcessingScreen {...defaultProps} processingState="error" />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.cancelSheetHeading })).not.toBeInTheDocument());
  });

  it("does not restore focus to the background trigger when asynchronous cancellation starts", async () => {
    const pending = deferred<void>();
    renderScreen({ onCancelAnalysis: vi.fn(() => pending.promise) });
    const trigger = getCancelTrigger();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: copy.cancelSheetHeading });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Close cancellation confirmation" })).toHaveFocus());

    fireEvent.click(within(dialog).getByRole("button", { name: copy.confirmCancel }));

    expect(trigger).not.toHaveFocus();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("keeps focus inside the dialog while cancellation is pending", async () => {
    const pending = deferred<void>();
    renderScreen({ onCancelAnalysis: vi.fn(() => pending.promise) });
    openCancelSheet();
    const dialog = screen.getByRole("dialog", { name: copy.cancelSheetHeading });
    fireEvent.click(within(dialog).getByRole("button", { name: copy.confirmCancel }));

    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
  });

  it("keeps background scrolling locked while cancellation is pending", () => {
    const pending = deferred<void>();
    renderScreen({ onCancelAnalysis: vi.fn(() => pending.promise) });
    openCancelSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.confirmCancel }));

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("does not close the cancellation sheet on Escape while cancellation is pending", () => {
    const pending = deferred<void>();
    renderScreen({ onCancelAnalysis: vi.fn(() => pending.promise) });
    openCancelSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.confirmCancel }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByRole("dialog", { name: copy.cancelSheetHeading })).toBeInTheDocument();
  });

  it("keeps interactive controls outside the paused waiting-state live region", () => {
    renderScreen({ processingState: "waiting-for-connection", canProcessOffline: false });
    const heading = screen.getByRole("heading", { level: 1, name: copy.waitingHeading });
    const liveRegion = heading.closest('[role="status"]');

    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(within(liveRegion as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps interactive controls outside the local-processing live region", () => {
    renderScreen({ processingState: "waiting-for-connection", isOffline: true, canProcessOffline: true });
    const heading = screen.getByRole("heading", { level: 1, name: copy.localProcessingHeading });
    const liveRegion = heading.closest('[role="status"]');

    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(within(liveRegion as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
  });

  it("restores focus to the specific lower trigger only after a pending cancellation request settles and the sheet closes", async () => {
    renderScreen({
      processingState: "waiting-for-connection",
      onCancelAnalysis: vi.fn().mockRejectedValue(new Error("no")),
    });
    const trigger = screen.getByRole("button", { name: copy.cancelAnalysis });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: copy.confirmCancel }));

    expect(await screen.findByText(copy.cancelError)).toBeInTheDocument();
    expect(trigger).not.toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: copy.keepAnalysing }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("preserves stale-sheet cleanup after the focus-management refinement", async () => {
    const { rerender } = render(<AnalysisProcessingScreen {...defaultProps} processingState="processing" />);
    openCancelSheet();
    rerender(<AnalysisProcessingScreen {...defaultProps} processingState="complete" />);

    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.cancelSheetHeading })).not.toBeInTheDocument());
  });

});
