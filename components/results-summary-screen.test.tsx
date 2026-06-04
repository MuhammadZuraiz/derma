import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ResultsSummaryScreen, {
  copy,
  normaliseDelta,
  normaliseSummaryScore,
  type ResultsSummaryReport,
  type ResultsSummaryScreenProps,
} from "./results-summary-screen";

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

const baseReport: ResultsSummaryReport = {
  reportId: "report-1",
  profileName: " Amara ",
  generatedAtLabel: "2 June 2026 · 10:30",
  score: 78,
  categoryLabel: "Balanced with a few priorities",
  comparison: { kind: "first-scan", label: "Host baseline label" },
  priorityHighlights: [
    { id: "h1", title: "Hydration support", levelLabel: "Worth attention", description: "Visible dryness appears in a few areas.", tone: "attention" },
    { id: "h2", title: "Texture care", levelLabel: "Moderate priority", description: "A gentle routine may support a smoother-looking appearance.", tone: "neutral" },
    { id: "h3", title: "Barrier comfort", levelLabel: "Monitor", description: "Keep the routine simple and supportive.", tone: "neutral" },
    { id: "h4", title: "Fourth hidden highlight", levelLabel: "Hidden", description: "This should not render.", tone: "positive" },
  ],
  positiveSignals: [
    { id: "p1", title: "Even-looking lighting response", description: "The photo provides a clear overview." },
    { id: "p2", title: "Routine-ready summary" },
    { id: "p3", title: "Clear comparison baseline" },
    { id: "p4", title: "Fourth hidden positive" },
  ],
  saveLabel: "Saved locally on this device",
};

const baseProps: ResultsSummaryScreenProps = {
  state: "ready",
  report: baseReport,
  onClose: vi.fn(),
  onOpenRoutine: vi.fn(),
  onOpenDetailedReport: vi.fn(),
};

function renderScreen(overrides: Partial<ResultsSummaryScreenProps> = {}) {
  const props: ResultsSummaryScreenProps = {
    ...baseProps,
    onClose: vi.fn(),
    onOpenRoutine: vi.fn(),
    onOpenDetailedReport: vi.fn(),
    ...overrides,
  };
  const result = render(<ResultsSummaryScreen {...props} />);
  return { ...result, props };
}

function reportWith(overrides: Partial<ResultsSummaryReport> = {}): ResultsSummaryReport {
  return { ...baseReport, ...overrides };
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

describe("ResultsSummaryScreen", () => {
  it("renders the loading heading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByRole("heading", { name: copy.loadingHeading })).toBeInTheDocument();
  });

  it("marks the loading state as a polite status region", () => {
    renderScreen({ state: "loading", report: null });
    const status = screen.getByText(copy.loadingHeading).closest('[role="status"]');
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("renders a disabled Build Routine CTA while loading", () => {
    renderScreen({ state: "loading", report: null });

    expect(
      screen.getByRole("button", { name: copy.buildRoutine }),
    ).toBeDisabled();
  });

  it("does not show routine-unavailable wording while loading", () => {
    renderScreen({ state: "loading", report: null });

    expect(
      screen.queryByRole("button", {
        name: copy.routineUnavailable,
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the ready snapshot heading", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
  });

  it("displays the report profile name", () => {
    renderScreen();
    expect(screen.getByText("Amara")).toBeInTheDocument();
  });

  it("derives the profile initial from a trimmed name", () => {
    renderScreen();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("uses a question mark for a blank profile name", () => {
    renderScreen({ report: reportWith({ profileName: "   " }) });
    expect(screen.getAllByText("?").length).toBeGreaterThan(0);
  });

  it("displays the generated-at label", () => {
    renderScreen();
    expect(screen.getByText(baseReport.generatedAtLabel)).toBeInTheDocument();
  });

  it("displays the host-provided save label", () => {
    renderScreen();
    expect(screen.getByText(baseReport.saveLabel)).toBeInTheDocument();
  });

  it("falls back to the local save copy when the save label is blank", () => {
    renderScreen({ report: reportWith({ saveLabel: " " }) });
    expect(screen.getByText(copy.savedOnDevice)).toBeInTheDocument();
  });

  it("renders a valid host-provided score", () => {
    renderScreen();
    expect(screen.getByTestId("summary-score")).toHaveTextContent("78");
  });

  it("rounds a decimal score", () => {
    renderScreen({ report: reportWith({ score: 61.6 }) });
    expect(screen.getByTestId("summary-score")).toHaveTextContent("62");
  });

  it("clamps a score below zero", () => {
    renderScreen({ report: reportWith({ score: -50 }) });
    expect(screen.getByTestId("summary-score")).toHaveTextContent("0");
  });

  it("clamps a score above one hundred", () => {
    renderScreen({ report: reportWith({ score: 140 }) });
    expect(screen.getByTestId("summary-score")).toHaveTextContent("100");
  });

  it("renders unavailable copy when score is omitted", () => {
    renderScreen({ report: reportWith({ score: undefined }) });
    expect(screen.getByText(copy.scoreUnavailable)).toBeInTheDocument();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("renders unavailable copy for a non-finite score: %s", (score) => {
    renderScreen({ report: reportWith({ score }) });
    expect(screen.getByText(copy.scoreUnavailable)).toBeInTheDocument();
    expect(screen.queryByTestId("summary-score")).not.toBeInTheDocument();
  });

  it("normaliseSummaryScore hides omitted and non-finite values", () => {
    expect(normaliseSummaryScore(undefined)).toBeNull();
    expect(normaliseSummaryScore(Number.NaN)).toBeNull();
    expect(normaliseSummaryScore(Number.POSITIVE_INFINITY)).toBeNull();
    expect(normaliseSummaryScore(Number.NEGATIVE_INFINITY)).toBeNull();
  });

  it("renders the first-scan baseline label", () => {
    renderScreen();
    expect(screen.getByText(copy.firstScanBaseline)).toBeInTheDocument();
  });

  it("renders a host-supplied comparison label unchanged", () => {
    renderScreen({ report: reportWith({ comparison: { kind: "comparison", label: "Host supplied: steady since last scan", delta: 0 } }) });
    expect(screen.getByText("Host supplied: steady since last scan")).toBeInTheDocument();
  });

  it("renders an upward icon for a finite positive delta", () => {
    renderScreen({ report: reportWith({ comparison: { kind: "comparison", label: "Host trend", delta: 3.2 } }) });
    expect(screen.getByTestId("trend-up")).toBeInTheDocument();
  });

  it("renders a downward icon for a finite negative delta", () => {
    renderScreen({ report: reportWith({ comparison: { kind: "comparison", label: "Host trend", delta: -2.2 } }) });
    expect(screen.getByTestId("trend-down")).toBeInTheDocument();
  });

  it("renders a neutral icon for a zero delta", () => {
    renderScreen({ report: reportWith({ comparison: { kind: "comparison", label: "Host trend", delta: 0 } }) });
    expect(screen.getByTestId("trend-neutral")).toBeInTheDocument();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("renders no trend icon for a non-finite delta: %s", (delta) => {
    renderScreen({ report: reportWith({ comparison: { kind: "comparison", label: "Host trend", delta } }) });
    expect(screen.queryByTestId("trend-up")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trend-down")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trend-neutral")).not.toBeInTheDocument();
  });

  it("normaliseDelta rounds only finite host-provided values", () => {
    expect(normaliseDelta(2.6)).toBe(3);
    expect(normaliseDelta(undefined)).toBeNull();
    expect(normaliseDelta(Number.NaN)).toBeNull();
  });

  it("renders the guidance-not-diagnosis copy", () => {
    renderScreen();
    expect(screen.getByText(copy.guidanceBoundary)).toBeInTheDocument();
  });

  it("renders the limited-confidence banner", () => {
    renderScreen({ state: "limited-confidence" });
    expect(screen.getByText(copy.limitedConfidence)).toBeInTheDocument();
  });

  it("marks the limited-confidence banner as a status region", () => {
    renderScreen({ state: "limited-confidence" });
    expect(screen.getByText(copy.limitedConfidence).closest('[role="status"]')).toBeInTheDocument();
  });

  it("renders the limited-confidence retake action only when supplied", () => {
    const { rerender } = render(<ResultsSummaryScreen {...baseProps} state="limited-confidence" />);
    expect(screen.queryByRole("button", { name: copy.retakePhoto })).not.toBeInTheDocument();
    rerender(<ResultsSummaryScreen {...baseProps} state="limited-confidence" onRetakePhoto={vi.fn()} />);
    expect(screen.getByRole("button", { name: copy.retakePhoto })).toBeInTheDocument();
  });

  it("renders at most three priority highlights", () => {
    renderScreen();
    expect(within(screen.getByTestId("priority-highlight-list")).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("Fourth hidden highlight")).not.toBeInTheDocument();
  });

  it("preserves host-supplied priority highlight ordering", () => {
    renderScreen();
    const list = screen.getByTestId("priority-highlight-list");
    const items = within(list).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Hydration support");
    expect(items[1]).toHaveTextContent("Texture care");
    expect(items[2]).toHaveTextContent("Barrier comfort");
  });

  it("renders empty priority copy", () => {
    renderScreen({ report: reportWith({ priorityHighlights: [] }) });
    expect(screen.getByText(copy.priorityEmpty)).toBeInTheDocument();
  });

  it("renders at most three positive signals", () => {
    renderScreen();
    expect(within(screen.getByTestId("positive-signal-list")).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("Fourth hidden positive")).not.toBeInTheDocument();
  });

  it("preserves host-supplied positive signal ordering", () => {
    renderScreen();
    const items = within(screen.getByTestId("positive-signal-list")).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Even-looking lighting response");
    expect(items[1]).toHaveTextContent("Routine-ready summary");
    expect(items[2]).toHaveTextContent("Clear comparison baseline");
  });

  it("renders empty positive copy", () => {
    renderScreen({ report: reportWith({ positiveSignals: [] }) });
    expect(screen.getByText(copy.positiveEmpty)).toBeInTheDocument();
  });

  it("invokes Build Routine", () => {
    const onOpenRoutine = vi.fn();
    renderScreen({ onOpenRoutine });
    fireEvent.click(screen.getByRole("button", { name: copy.buildRoutine }));
    expect(onOpenRoutine).toHaveBeenCalledTimes(1);
  });

  it("locks conflicting actions while routine opening is pending", async () => {
    const action = deferred();
    renderScreen({ onOpenRoutine: vi.fn(() => action.promise), onShareReport: vi.fn() });
    fireEvent.click(screen.getByRole("button", { name: copy.buildRoutine }));
    expect(screen.getByRole("button", { name: copy.preparingRoutine })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.detailedReport })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.close })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.reportActions })).toBeDisabled();
    action.resolve();
    await waitFor(() => expect(screen.getByRole("button", { name: copy.buildRoutine })).toBeEnabled());
  });

  it("displays a toast after a routine rejection", async () => {
    renderScreen({ onOpenRoutine: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.buildRoutine }));
    await waitFor(() => expect(screen.getByText(copy.routineError)).toBeInTheDocument());
  });

  it("does not block routine generation solely because the device is offline", () => {
    renderScreen({ isOffline: true, canBuildRoutine: true });
    expect(screen.getByRole("button", { name: copy.buildRoutine })).toBeEnabled();
  });

  it("shows reconnect wording when offline routine generation is blocked", () => {
    renderScreen({ isOffline: true, canBuildRoutine: false });
    expect(screen.getByRole("button", { name: copy.reconnectForRoutine })).toBeDisabled();
  });

  it("invokes Detailed Report", () => {
    const onOpenDetailedReport = vi.fn();
    renderScreen({ onOpenDetailedReport });
    fireEvent.click(screen.getByRole("button", { name: copy.detailedReport }));
    expect(onOpenDetailedReport).toHaveBeenCalledTimes(1);
  });

  it("displays a toast after a detailed-report rejection", async () => {
    renderScreen({ onOpenDetailedReport: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.detailedReport }));
    await waitFor(() => expect(screen.getByText(copy.reportError)).toBeInTheDocument());
  });

  it("invokes Close", () => {
    const onClose = vi.fn();
    renderScreen({ onClose });
    fireEvent.click(screen.getByRole("button", { name: copy.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays a toast after a Close rejection", async () => {
    renderScreen({ onClose: vi.fn().mockRejectedValue(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.close }));
    await waitFor(() => expect(screen.getByText(copy.closeError)).toBeInTheDocument());
  });

  it("renders the Report Actions trigger only when an optional callback exists", () => {
    const { rerender } = render(<ResultsSummaryScreen {...baseProps} />);
    expect(screen.queryByRole("button", { name: copy.reportActions })).not.toBeInTheDocument();
    rerender(<ResultsSummaryScreen {...baseProps} onShareReport={vi.fn()} />);
    expect(screen.getByRole("button", { name: copy.reportActions })).toBeInTheDocument();
  });

  it("opens the Report Actions sheet", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toBeInTheDocument();
  });

  it("uses accessible dialog semantics for the sheet", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toHaveAttribute("aria-modal", "true");
  });

  it("traps focus inside the sheet", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    const dialog = screen.getByRole("dialog", { name: copy.reportActions });
    const close = screen.getByRole("button", { name: "Close report actions" });
    const share = screen.getByRole("button", { name: copy.shareReport });
    await waitFor(() => expect(close).toHaveFocus());
    share.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(share).toHaveFocus();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes an idle sheet on Escape", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("closes an idle sheet from its backdrop", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    fireEvent.mouseDown(screen.getByTestId("report-actions-backdrop"));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("marks background content inert while the sheet is open", async () => {
    renderScreen({ onShareReport: vi.fn() });
    await openActionsSheet();
    expect(screen.getByTestId("results-app-shell")).toHaveAttribute("inert");
  });

  it("locks background scrolling while the sheet is open", async () => {
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
    await openActionsSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    expect(onShareReport).toHaveBeenCalledTimes(1);
  });

  it("keeps the sheet open and displays a toast after Share rejection", async () => {
    renderScreen({ onShareReport: vi.fn().mockRejectedValue(new Error("no")) });
    await openActionsSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    await waitFor(() => expect(screen.getByText(copy.shareError)).toBeInTheDocument());
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
    await openActionsSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.downloadReport }));
    expect(onDownloadReport).toHaveBeenCalledTimes(1);
  });

  it("keeps the sheet open and displays a toast after Download rejection", async () => {
    renderScreen({ onDownloadReport: vi.fn().mockRejectedValue(new Error("no")) });
    await openActionsSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.downloadReport }));
    await waitFor(() => expect(screen.getByText(copy.downloadError)).toBeInTheDocument());
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
    await openActionsSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.retakePhoto }));
    expect(onRetakePhoto).toHaveBeenCalledTimes(1);
  });

  it("keeps the sheet open and displays a toast after Retake rejection", async () => {
    renderScreen({ onRetakePhoto: vi.fn().mockRejectedValue(new Error("no")) });
    await openActionsSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.retakePhoto }));
    await waitFor(() => expect(screen.getByText(copy.retakeError)).toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toBeInTheDocument();
  });

  it("disables conflicting sheet controls while an action is pending", async () => {
    const action = deferred();
    renderScreen({ onShareReport: vi.fn(() => action.promise), onDownloadReport: vi.fn() });
    await openActionsSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    expect(screen.getByRole("button", { name: copy.preparingShare })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.downloadReport })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close report actions" })).toBeDisabled();
    action.resolve();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("prevents duplicate sheet activation", async () => {
    const action = deferred();
    const onShareReport = vi.fn(() => action.promise);
    renderScreen({ onShareReport });
    await openActionsSheet();
    const share = screen.getByRole("button", { name: copy.shareReport });
    fireEvent.click(share);
    fireEvent.click(share);
    expect(onShareReport).toHaveBeenCalledTimes(1);
    action.resolve();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("returns focus to the Report Actions trigger after sheet close", async () => {
    renderScreen({ onShareReport: vi.fn() });
    const trigger = await openActionsSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("hides the Report Actions trigger while loading even when optional callbacks are supplied", () => {
    renderScreen({ state: "loading", report: null, onShareReport: vi.fn() });
    expect(screen.queryByRole("button", { name: copy.reportActions })).not.toBeInTheDocument();
  });

  it("hides the Report Actions trigger in the error state even when optional callbacks are supplied", () => {
    renderScreen({ state: "error", onShareReport: vi.fn() });
    expect(screen.queryByRole("button", { name: copy.reportActions })).not.toBeInTheDocument();
  });

  it("keeps the direct retake recovery action in the error state when supplied", () => {
    renderScreen({ state: "error", onRetakePhoto: vi.fn() });
    expect(screen.getByRole("button", { name: copy.retakePhoto })).toBeInTheDocument();
  });

  it("hides the Report Actions trigger when ready state has no report", () => {
    renderScreen({ state: "ready", report: null, onShareReport: vi.fn() });
    expect(screen.queryByRole("button", { name: copy.reportActions })).not.toBeInTheDocument();
  });

  it("hides the Report Actions trigger when limited-confidence state has no report", () => {
    renderScreen({ state: "limited-confidence", report: null, onShareReport: vi.fn() });
    expect(screen.queryByRole("button", { name: copy.reportActions })).not.toBeInTheDocument();
  });

  it("closes an idle sheet when the host transitions from ready to loading", async () => {
    const onShareReport = vi.fn();
    const { rerender } = render(<ResultsSummaryScreen {...baseProps} onShareReport={onShareReport} />);
    await openActionsSheet();
    rerender(<ResultsSummaryScreen {...baseProps} state="loading" report={null} onShareReport={onShareReport} />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("closes an idle sheet when the host transitions from ready to error", async () => {
    const onShareReport = vi.fn();
    const { rerender } = render(<ResultsSummaryScreen {...baseProps} onShareReport={onShareReport} />);
    await openActionsSheet();
    rerender(<ResultsSummaryScreen {...baseProps} state="error" onShareReport={onShareReport} />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("closes an idle sheet when the report becomes unavailable", async () => {
    const onShareReport = vi.fn();
    const { rerender } = render(<ResultsSummaryScreen {...baseProps} onShareReport={onShareReport} />);
    await openActionsSheet();
    rerender(<ResultsSummaryScreen {...baseProps} report={null} onShareReport={onShareReport} />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("closes an idle sheet when all optional report actions are removed", async () => {
    const { rerender } = render(<ResultsSummaryScreen {...baseProps} onShareReport={vi.fn()} />);
    await openActionsSheet();
    rerender(<ResultsSummaryScreen {...baseProps} />);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("shows online routine-unavailable wording when routine generation is blocked", () => {
    renderScreen({ isOffline: false, canBuildRoutine: false });
    expect(screen.getByRole("button", { name: copy.routineUnavailable })).toBeDisabled();
  });

  it("continues to show reconnect wording when offline routine generation is blocked", () => {
    renderScreen({ isOffline: true, canBuildRoutine: false });
    expect(screen.getByRole("button", { name: copy.reconnectForRoutine })).toBeDisabled();
  });

  it("continues to enable Build Routine when offline generation is available", () => {
    renderScreen({ isOffline: true, canBuildRoutine: true });
    expect(screen.getByRole("button", { name: copy.buildRoutine })).toBeEnabled();
  });

  it("restores trigger focus after the Report Actions sheet closes", async () => {
    renderScreen({ onShareReport: vi.fn() });
    const trigger = await openActionsSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("defers trigger-focus restoration until an animation frame after sheet close", async () => {
    renderScreen({ onShareReport: vi.fn() });
    const trigger = await openActionsSheet();
    await waitFor(() => expect(screen.getByRole("button", { name: "Close report actions" })).toHaveFocus());

    const callbacks: FrameRequestCallback[] = [];
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callbacks.push(callback);
        return callbacks.length;
      });

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
    expect(trigger).not.toHaveFocus();
    expect(callbacks).toHaveLength(1);

    act(() => callbacks[0](performance.now()));
    expect(trigger).toHaveFocus();
    requestAnimationFrameSpy.mockRestore();
  });

  it("does not move focus into inert background content when an asynchronous sheet action starts", async () => {
    const action = deferred();
    renderScreen({ onShareReport: vi.fn(() => action.promise) });
    const trigger = await openActionsSheet();
    const dialog = screen.getByRole("dialog", { name: copy.reportActions });
    fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    expect(trigger).not.toHaveFocus();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    action.resolve();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("keeps focus inside the sheet while a sheet action is pending", async () => {
    const action = deferred();
    renderScreen({ onShareReport: vi.fn(() => action.promise) });
    const trigger = await openActionsSheet();
    const dialog = screen.getByRole("dialog", { name: copy.reportActions });
    const share = screen.getByRole("button", { name: copy.shareReport });
    trigger.focus();
    fireEvent.click(share);
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    action.resolve();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("does not close the sheet on Escape while a sheet action is pending", async () => {
    const action = deferred();
    renderScreen({ onShareReport: vi.fn(() => action.promise) });
    await openActionsSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog", { name: copy.reportActions })).toBeInTheDocument();
    action.resolve();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("keeps background scrolling locked while a sheet action is pending", async () => {
    const action = deferred();
    renderScreen({ onShareReport: vi.fn(() => action.promise) });
    await openActionsSheet();
    fireEvent.click(screen.getByRole("button", { name: copy.shareReport }));
    expect(document.body.style.overflow).toBe("hidden");
    action.resolve();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: copy.reportActions })).not.toBeInTheDocument());
  });

  it("renders the error heading", () => {
    renderScreen({ state: "error" });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("marks the error experience as an alert", () => {
    renderScreen({ state: "error" });
    expect(screen.getByText(copy.errorHeading).closest('[role="alert"]')).toBeInTheDocument();
  });

  it("renders no fake findings in the error experience", () => {
    renderScreen({ state: "error" });
    expect(screen.queryByText(copy.priorityHeading)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.positiveHeading)).not.toBeInTheDocument();
    expect(screen.queryByTestId("summary-score")).not.toBeInTheDocument();
  });

  it("renders no image element", () => {
    const { container } = renderScreen();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders no facial-overlay content", () => {
    renderScreen();
    expect(screen.queryByText(/face map|facial landmark|region overlay/i)).not.toBeInTheDocument();
  });

  it("renders no file input", () => {
    const { container } = renderScreen();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  it("renders no video element", () => {
    const { container } = renderScreen();
    expect(container.querySelector("video")).toBeNull();
  });

  it("does not call an analysis API", () => {
    const fetchMock = vi.fn();
    Object.defineProperty(globalThis, "fetch", { configurable: true, writable: true, value: fetchMock });
    renderScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call a camera API", () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    renderScreen();
    expect(getUserMedia).not.toHaveBeenCalled();
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
    expect(Object.getOwnPropertyDescriptor(globalThis, "fetch")).toEqual(originalFetchDescriptor);
  });

  it("keeps prohibited clinical phrases out of the copy object", () => {
    const allCopy = Object.values(copy).join(" ").toLowerCase();
    expect(allCopy).not.toContain("overall skin health");
    expect(allCopy).not.toContain("disease detected");
    expect(allCopy).not.toContain("verified condition");
    expect(allCopy).not.toContain("clinically confirmed");
    expect(allCopy).not.toContain("identity verified");
  });
});
