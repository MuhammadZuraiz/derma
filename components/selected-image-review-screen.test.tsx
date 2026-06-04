import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SelectedImageReviewScreen, {
  copy,
  type ImageQualityChecks,
  type SelectedImageReviewScreenProps,
} from "./selected-image-review-screen";

const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "mediaDevices");
const originalGeolocationDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "geolocation");

function restoreNavigatorProperty(
  property: "mediaDevices" | "geolocation",
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(window.navigator, property, descriptor);
  } else {
    delete (window.navigator as unknown as Record<string, unknown>)[property];
  }
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  restoreNavigatorProperty("mediaDevices", originalMediaDevicesDescriptor);
  restoreNavigatorProperty("geolocation", originalGeolocationDescriptor);
});

function createProps(overrides: Partial<SelectedImageReviewScreenProps> = {}): SelectedImageReviewScreenProps {
  return {
    profileName: " Amara ",
    imageUrl: "blob:review-photo",
    imageSource: "camera",
    onBack: vi.fn(),
    onUsePhoto: vi.fn(),
    onReplacePhoto: vi.fn(),
    onChooseDifferentSource: vi.fn(),
    ...overrides,
  };
}

function renderScreen(overrides: Partial<SelectedImageReviewScreenProps> = {}) {
  const props = createProps(overrides);
  const view = render(<SelectedImageReviewScreen {...props} />);
  return { props, ...view };
}

function createPendingCallback() {
  let resolveCallback!: () => void;
  const callback = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        resolveCallback = resolve;
      }),
  );
  return { callback, resolve: () => resolveCallback() };
}

function getPreview() {
  return screen.getByAltText(copy.previewAlt);
}

function loadPreview() {
  fireEvent.load(getPreview());
}

function getDetails() {
  const details = screen.getByText(copy.qualityHeading).closest("details");
  if (!details) throw new Error("Quality details element not found");
  return details;
}

function getPrimaryButton() {
  return screen.getByRole("button", {
    name: new RegExp(
      [
        copy.usePhoto,
        copy.proceeding,
        copy.loadingPhoto,
        copy.checkingPhoto,
        copy.photoUnavailable,
        copy.photoNeedsAnotherTry,
        copy.retryPhotoCheck,
        copy.checkingProfile,
        copy.resolveMismatch,
        copy.resolveProfileCheck,
        copy.reconnectToContinue,
        copy.analysisUnavailable,
      ].map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    ),
  });
}

const allPassedChecks: ImageQualityChecks = {
  "face-visible": "passed",
  "single-face": "passed",
  "frontal-angle": "passed",
  lighting: "passed",
  focus: "passed",
  resolution: "passed",
};

describe("SelectedImageReviewScreen", () => {
  it("displays the active profile name", () => {
    renderScreen();
    expect(screen.getByText("Amara")).toBeInTheDocument();
  });

  it("derives the profile initial from the trimmed name", () => {
    renderScreen({ profileName: "  amara " });
    expect(within(screen.getByLabelText("Active profile")).getByText("A")).toBeInTheDocument();
  });

  it("uses ? when the profile name is empty", () => {
    renderScreen({ profileName: "   " });
    expect(within(screen.getByLabelText("Active profile")).getAllByText("?").length).toBeGreaterThan(0);
  });

  it("displays the selected image with the expected alt text", () => {
    renderScreen();
    expect(getPreview()).toHaveAttribute("src", "blob:review-photo");
  });

  it("shows the camera source badge for camera images", () => {
    renderScreen({ imageSource: "camera" });
    expect(screen.getByText(copy.sourceCamera)).toBeInTheDocument();
  });

  it("shows the upload source badge for uploaded images", () => {
    renderScreen({ imageSource: "upload" });
    expect(screen.getByText(copy.sourceUpload)).toBeInTheDocument();
  });

  it("shows the preview-loading state before image load", () => {
    renderScreen();
    expect(screen.getByText(copy.previewLoading)).toBeInTheDocument();
  });

  it("marks the preview-loading state as role=status", () => {
    renderScreen();
    expect(screen.getByText(copy.previewLoading).closest('[role="status"]')).toHaveAttribute("aria-live", "polite");
  });

  it("displays the preview error after the image error event", () => {
    renderScreen();
    fireEvent.error(getPreview());
    expect(screen.getByRole("alert")).toHaveTextContent(copy.previewErrorHeading);
    expect(screen.getByText(copy.previewErrorBody)).toBeInTheDocument();
  });

  it("invokes onPreviewLoadError once after image error when supplied", async () => {
    const onPreviewLoadError = vi.fn();
    renderScreen({ onPreviewLoadError });
    const preview = getPreview();
    fireEvent.error(preview);
    fireEvent.error(preview);
    await waitFor(() => expect(onPreviewLoadError).toHaveBeenCalledTimes(1));
  });

  it("shows a toast when the preview-load callback rejects", async () => {
    renderScreen({ onPreviewLoadError: vi.fn().mockRejectedValue(new Error("report failed")) });
    fireEvent.error(getPreview());
    expect(await screen.findByText(copy.previewCallbackError)).toBeInTheDocument();
  });

  it("does not invoke validation or analysis callbacks on mount", () => {
    const onRetryValidation = vi.fn();
    const onUsePhoto = vi.fn();
    renderScreen({ onRetryValidation, onUsePhoto });
    expect(onRetryValidation).not.toHaveBeenCalled();
    expect(onUsePhoto).not.toHaveBeenCalled();
  });

  it("defaults omitted individual quality-check statuses to checking", () => {
    renderScreen({ qualityChecks: {} });
    expect(screen.getAllByText(copy.checkPending)).toHaveLength(6);
  });

  it("renders all six quality-check rows", () => {
    renderScreen();
    [
      copy.checkFaceVisibleTitle,
      copy.checkSingleFaceTitle,
      copy.checkFrontalAngleTitle,
      copy.checkLightingTitle,
      copy.checkFocusTitle,
      copy.checkResolutionTitle,
    ].forEach((title) => expect(screen.getByText(title)).toBeInTheDocument());
  });

  it("maps passed and failed quality-check guidance correctly", () => {
    renderScreen({ qualityChecks: { "face-visible": "passed", lighting: "failed" } });
    expect(screen.getByText(copy.checkFaceVisiblePassed)).toBeInTheDocument();
    expect(screen.getByText(copy.checkLightingFailed)).toBeInTheDocument();
  });

  it("opens the quality accordion by default while validation is checking", () => {
    renderScreen({ validationState: "checking" });
    expect(getDetails()).toHaveAttribute("open");
  });

  it("opens the quality accordion by default when validation fails", () => {
    renderScreen({ validationState: "failed" });
    expect(getDetails()).toHaveAttribute("open");
  });

  it("collapses the quality accordion by default when validation passes", () => {
    renderScreen({ validationState: "passed" });
    expect(getDetails()).not.toHaveAttribute("open");
  });

  it("enables Continue for passed validation on the first-scan path after image load", () => {
    renderScreen({ validationState: "passed", profileConsistencyState: "not-required" });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.usePhoto })).toBeEnabled();
  });

  it("enables Continue for passed validation with an appears-consistent profile after image load", () => {
    renderScreen({ validationState: "passed", profileConsistencyState: "matched" });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.usePhoto })).toBeEnabled();
  });

  it("disables Continue while validation is checking", () => {
    renderScreen({ validationState: "checking" });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.checkingPhoto })).toBeDisabled();
  });

  it("disables Continue after validation failure", () => {
    renderScreen({ validationState: "failed" });
    loadPreview();
    expect(getPrimaryButton()).toBeDisabled();
  });

  it("displays Retry for validation error when callback exists", () => {
    renderScreen({ validationState: "error", onRetryValidation: vi.fn() });
    expect(screen.getByRole("button", { name: copy.retryValidation })).toBeInTheDocument();
  });

  it("invokes the Retry callback", () => {
    const onRetryValidation = vi.fn();
    renderScreen({ validationState: "error", onRetryValidation });
    fireEvent.click(screen.getByRole("button", { name: copy.retryValidation }));
    expect(onRetryValidation).toHaveBeenCalledTimes(1);
  });

  it("disables Continue for a profile mismatch", () => {
    renderScreen({ validationState: "passed", profileConsistencyState: "mismatch" });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.resolveMismatch })).toBeDisabled();
  });

  it("uses role=alert for a profile mismatch", () => {
    renderScreen({ profileConsistencyState: "mismatch" });
    expect(screen.getByRole("alert")).toHaveTextContent(copy.profileMismatch);
  });

  it("displays Change Profile for mismatch when callback exists", () => {
    renderScreen({ profileConsistencyState: "mismatch", onChangeProfile: vi.fn() });
    expect(screen.getAllByRole("button", { name: copy.changeProfile }).length).toBeGreaterThan(0);
  });

  it("displays Create New Profile for mismatch when callback exists", () => {
    renderScreen({ profileConsistencyState: "mismatch", onCreateNewProfile: vi.fn() });
    expect(screen.getByRole("button", { name: copy.createNewProfile })).toBeInTheDocument();
  });

  it("uses non-definitive copy for a matched profile safeguard", () => {
    renderScreen({ profileConsistencyState: "matched" });
    expect(screen.getByText(copy.profileMatched)).toHaveTextContent("appears consistent");
    expect(screen.queryByText(/verified identity|identity confirmed|exact profile match/i)).not.toBeInTheDocument();
  });

  it("disables Continue with an analysis-unavailable label when the online host blocks analysis", () => {
    renderScreen({ validationState: "passed", canStartAnalysis: false });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.analysisUnavailable })).toBeDisabled();
  });

  it("keeps Use this photo enabled while offline when local analysis is available", () => {
    renderScreen({
      validationState: "passed",
      profileConsistencyState: "not-required",
      isOffline: true,
      canStartAnalysis: true,
    });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.usePhoto })).toBeEnabled();
  });

  it("shows Reconnect to continue while offline when the host blocks analysis", () => {
    renderScreen({
      validationState: "passed",
      profileConsistencyState: "not-required",
      isOffline: true,
      canStartAnalysis: false,
    });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.reconnectToContinue })).toBeDisabled();
  });

  it("shows Analysis unavailable right now while online when the host blocks analysis", () => {
    renderScreen({
      validationState: "passed",
      profileConsistencyState: "not-required",
      canStartAnalysis: false,
    });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.analysisUnavailable })).toBeDisabled();
  });

  it("shows Photo unavailable after the preview fails", () => {
    renderScreen();
    fireEvent.error(getPreview());
    expect(screen.getByRole("button", { name: copy.photoUnavailable })).toBeDisabled();
  });

  it("shows Choose another photo after failed validation", () => {
    renderScreen({ validationState: "failed" });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.photoNeedsAnotherTry })).toBeDisabled();
  });

  it("shows Retry photo check after validation error", () => {
    renderScreen({ validationState: "error" });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.retryPhotoCheck })).toBeDisabled();
  });

  it("shows Checking active profile while the profile safeguard is checking", () => {
    renderScreen({ validationState: "passed", profileConsistencyState: "checking" });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.checkingProfile })).toBeDisabled();
  });

  it("shows Resolve profile check after a profile-safeguard error", () => {
    renderScreen({ validationState: "passed", profileConsistencyState: "error" });
    loadPreview();
    expect(screen.getByRole("button", { name: copy.resolveProfileCheck })).toBeDisabled();
  });

  it("announces checking validation as a polite status", () => {
    renderScreen({ validationState: "checking" });
    const summary = screen.getByText(copy.validationChecking).closest('[role="status"]');
    expect(summary).toHaveAttribute("aria-live", "polite");
  });

  it("announces passed validation as a polite status", () => {
    renderScreen({ validationState: "passed" });
    const summary = screen.getByText(copy.validationPassed).closest('[role="status"]');
    expect(summary).toHaveAttribute("aria-live", "polite");
  });

  it("announces failed validation as an alert", () => {
    renderScreen({ validationState: "failed" });
    expect(screen.getByText(copy.validationFailed).closest('[role="alert"]')).toBeInTheDocument();
  });

  it("announces validation errors as an alert", () => {
    renderScreen({ validationState: "error" });
    expect(screen.getByText(copy.validationError).closest('[role="alert"]')).toBeInTheDocument();
  });

  it("shows the offline banner when offline", () => {
    renderScreen({ isOffline: true });
    expect(screen.getByText(copy.offline)).toBeInTheDocument();
  });

  it("renders Retake photo for the camera route", () => {
    renderScreen({ imageSource: "camera" });
    expect(screen.getByRole("button", { name: copy.retakePhoto })).toBeInTheDocument();
  });

  it("renders Choose another photo for the upload route", () => {
    renderScreen({ imageSource: "upload" });
    expect(screen.getByRole("button", { name: copy.chooseAnotherPhoto })).toBeInTheDocument();
  });

  it("invokes the replace-photo callback", () => {
    const onReplacePhoto = vi.fn();
    renderScreen({ onReplacePhoto });
    fireEvent.click(screen.getByRole("button", { name: copy.retakePhoto }));
    expect(onReplacePhoto).toHaveBeenCalledTimes(1);
  });

  it("invokes the Choose Different Source callback", () => {
    const onChooseDifferentSource = vi.fn();
    renderScreen({ onChooseDifferentSource });
    fireEvent.click(screen.getByRole("button", { name: copy.chooseDifferentSource }));
    expect(onChooseDifferentSource).toHaveBeenCalledTimes(1);
  });

  it("invokes the Back callback", () => {
    const onBack = vi.fn();
    renderScreen({ onBack });
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("disables conflicting controls while Proceed is pending", async () => {
    const pending = createPendingCallback();
    renderScreen({ validationState: "passed", onUsePhoto: pending.callback, onChangeProfile: vi.fn() });
    loadPreview();
    fireEvent.click(screen.getByRole("button", { name: copy.usePhoto }));

    expect(screen.getByRole("button", { name: copy.proceeding })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.retakePhoto })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.chooseDifferentSource })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.changeProfile })).toBeDisabled();

    await act(async () => pending.resolve());
  });

  it("prevents duplicate Proceed activation", async () => {
    const pending = createPendingCallback();
    renderScreen({ validationState: "passed", onUsePhoto: pending.callback });
    loadPreview();
    const usePhoto = screen.getByRole("button", { name: copy.usePhoto });
    fireEvent.click(usePhoto);
    fireEvent.click(usePhoto);
    expect(pending.callback).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve());
  });

  it("shows a toast when Proceed rejects", async () => {
    renderScreen({ validationState: "passed", onUsePhoto: vi.fn().mockRejectedValue(new Error("proceed failed")) });
    loadPreview();
    fireEvent.click(screen.getByRole("button", { name: copy.usePhoto }));
    expect(await screen.findByText(copy.usePhotoError)).toBeInTheDocument();
  });

  it("shows a toast when Back rejects", async () => {
    renderScreen({ onBack: vi.fn().mockRejectedValue(new Error("back failed")) });
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByText(copy.backError)).toBeInTheDocument();
  });

  it("shows a toast when replace-photo rejects", async () => {
    renderScreen({ onReplacePhoto: vi.fn().mockRejectedValue(new Error("replace failed")) });
    fireEvent.click(screen.getByRole("button", { name: copy.retakePhoto }));
    expect(await screen.findByText(copy.replacementError)).toBeInTheDocument();
  });

  it("shows a toast when different-source rejects", async () => {
    renderScreen({ onChooseDifferentSource: vi.fn().mockRejectedValue(new Error("source failed")) });
    fireEvent.click(screen.getByRole("button", { name: copy.chooseDifferentSource }));
    expect(await screen.findByText(copy.sourceError)).toBeInTheDocument();
  });

  it("shows a toast when Change Profile rejects", async () => {
    renderScreen({ onChangeProfile: vi.fn().mockRejectedValue(new Error("profile failed")) });
    fireEvent.click(screen.getByRole("button", { name: copy.changeProfile }));
    expect(await screen.findByText(copy.profileRouteError)).toBeInTheDocument();
  });

  it("shows a toast when Create New Profile rejects", async () => {
    renderScreen({ profileConsistencyState: "mismatch", onCreateNewProfile: vi.fn().mockRejectedValue(new Error("create failed")) });
    fireEvent.click(screen.getByRole("button", { name: copy.createNewProfile }));
    expect(await screen.findByText(copy.createProfileError)).toBeInTheDocument();
  });

  it("shows a toast when Retry Validation rejects", async () => {
    renderScreen({ validationState: "error", onRetryValidation: vi.fn().mockRejectedValue(new Error("retry failed")) });
    fireEvent.click(screen.getByRole("button", { name: copy.retryValidation }));
    expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
  });

  it("does not render a file input", () => {
    const { container } = renderScreen();
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  it("does not render a live camera preview", () => {
    const { container } = renderScreen();
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("does not call getUserMedia", () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(window.navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    renderScreen();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("does not request geolocation", () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(window.navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
    renderScreen();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("restores mocked browser API property descriptors after relevant tests", () => {
    expect(Object.getOwnPropertyDescriptor(window.navigator, "mediaDevices")).toEqual(originalMediaDevicesDescriptor);
    expect(Object.getOwnPropertyDescriptor(window.navigator, "geolocation")).toEqual(originalGeolocationDescriptor);
  });
});
