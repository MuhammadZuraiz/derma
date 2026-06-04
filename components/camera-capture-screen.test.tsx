import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CameraCaptureScreen, {
  copy,
  getReadinessMessage,
  type CameraCaptureScreenProps,
  type CaptureReadiness,
} from "./camera-capture-screen";

const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(
  window.navigator,
  "mediaDevices",
);
const originalGeolocationDescriptor = Object.getOwnPropertyDescriptor(
  window.navigator,
  "geolocation",
);

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

function createProps(
  overrides: Partial<CameraCaptureScreenProps> = {},
): CameraCaptureScreenProps {
  return {
    profileName: "Amara",
    onBack: vi.fn(),
    onRequestCameraAccess: vi.fn(),
    onCapturePhoto: vi.fn(),
    onChooseDifferentSource: vi.fn(),
    ...overrides,
  };
}

function renderScreen(overrides: Partial<CameraCaptureScreenProps> = {}) {
  const props = createProps(overrides);
  const view = render(<CameraCaptureScreen {...props} />);
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

function createFakeStream() {
  return { id: "preview-stream" } as unknown as MediaStream;
}

function getAllowCameraButton() {
  return screen.getByRole("button", { name: copy.allowCamera });
}

function getCaptureButton() {
  return screen.getByRole("button", { name: copy.capture });
}

describe("CameraCaptureScreen", () => {
  it("displays the permission explainer in the idle state", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: copy.permissionHeading })).toBeInTheDocument();
    expect(screen.getByText(copy.permissionSupporting)).toBeInTheDocument();
  });

  it("does not invoke the camera permission callback on mount", () => {
    const onRequestCameraAccess = vi.fn();
    renderScreen({ onRequestCameraAccess });
    expect(onRequestCameraAccess).not.toHaveBeenCalled();
  });

  it("invokes the camera permission callback after activation", () => {
    const onRequestCameraAccess = vi.fn();
    renderScreen({ onRequestCameraAccess });
    fireEvent.click(getAllowCameraButton());
    expect(onRequestCameraAccess).toHaveBeenCalledTimes(1);
  });

  it("disables conflicting actions while a permission request is pending", async () => {
    const pending = createPendingCallback();
    renderScreen({ onRequestCameraAccess: pending.callback });
    fireEvent.click(getAllowCameraButton());

    expect(screen.getByRole("button", { name: copy.requestingCamera })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.chooseDifferentSource })).toBeDisabled();

    await act(async () => pending.resolve());
  });

  it("shows a toast when camera permission requesting rejects", async () => {
    renderScreen({
      onRequestCameraAccess: vi.fn().mockRejectedValue(new Error("request failed")),
    });
    fireEvent.click(getAllowCameraButton());
    expect(await screen.findByText(copy.requestError)).toBeInTheDocument();
  });

  it("displays the denied-state recovery heading", () => {
    renderScreen({ permissionState: "denied" });
    expect(screen.getByRole("heading", { name: copy.deniedHeading })).toBeInTheDocument();
  });

  it("shows a retry action in the denied state", () => {
    renderScreen({ permissionState: "denied" });
    expect(screen.getByRole("button", { name: copy.tryAgain })).toBeInTheDocument();
  });

  it("shows the device-settings action only when its callback is supplied", () => {
    const { unmount } = renderScreen({ permissionState: "denied" });
    expect(screen.queryByRole("button", { name: copy.openSettings })).not.toBeInTheDocument();
    unmount();

    renderScreen({ permissionState: "denied", onOpenDeviceSettings: vi.fn() });
    expect(screen.getByRole("button", { name: copy.openSettings })).toBeInTheDocument();
  });

  it("invokes the device-settings callback", () => {
    const onOpenDeviceSettings = vi.fn();
    renderScreen({ permissionState: "denied", onOpenDeviceSettings });
    fireEvent.click(screen.getByRole("button", { name: copy.openSettings }));
    expect(onOpenDeviceSettings).toHaveBeenCalledTimes(1);
  });

  it("displays alternate-source recovery when the camera is unavailable", () => {
    renderScreen({ permissionState: "unavailable" });
    expect(screen.getByRole("heading", { name: copy.unavailableHeading })).toBeInTheDocument();
    expect(screen.getByText(copy.unavailableSupporting)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.tryAgain })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.chooseDifferentSource })).toBeInTheDocument();
  });

  it("displays retry recovery in the error state", () => {
    renderScreen({ permissionState: "error" });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.tryAgain })).toBeInTheDocument();
  });

  it("renders a video element in the granted state", () => {
    renderScreen({ permissionState: "granted" });
    expect(screen.getByLabelText("Live camera preview")).toBeInstanceOf(HTMLVideoElement);
  });

  it("attaches a provided preview stream to video.srcObject", () => {
    const previewStream = createFakeStream();
    renderScreen({ permissionState: "granted", previewStream });
    const video = screen.getByLabelText("Live camera preview") as HTMLVideoElement;
    expect(video.srcObject).toBe(previewStream);
  });

  it("shows preview preparation copy when granted without a stream", () => {
    renderScreen({ permissionState: "granted", previewStream: null });
    expect(screen.getByText(copy.preparingPreview)).toBeInTheDocument();
  });

  it("does not render the face-guide overlay until a preview stream exists", () => {
    renderScreen({ permissionState: "granted", previewStream: null });
    expect(screen.queryByTestId("face-guide-overlay")).not.toBeInTheDocument();
  });

  it("does not render readiness guidance until a preview stream exists", () => {
    renderScreen({
      permissionState: "granted",
      previewStream: null,
      captureReadiness: "ready",
    });
    expect(screen.queryByText(copy.readinessReady)).not.toBeInTheDocument();
  });

  it("announces preview loading through a status region", () => {
    renderScreen({ permissionState: "granted", previewStream: null });
    expect(screen.getByText(copy.preparingPreview).closest('[role="status"]')).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("mirrors the video preview by default", () => {
    renderScreen({ permissionState: "granted", previewStream: createFakeStream() });
    expect(screen.getByLabelText("Live camera preview")).toHaveClass("-scale-x-100");
  });

  it("does not mirror the video preview when the host disables mirroring", () => {
    renderScreen({
      permissionState: "granted",
      previewStream: createFakeStream(),
      isPreviewMirrored: false,
    });
    expect(screen.getByLabelText("Live camera preview")).not.toHaveClass("-scale-x-100");
  });

  it("maps readiness copy correctly for every readiness value", () => {
    const previewStream = createFakeStream();
    const readinessValues: CaptureReadiness[] = [
      "checking",
      "ready",
      "no-face",
      "multiple-faces",
      "move-closer",
      "move-back",
      "center-face",
      "face-forward",
      "low-light",
      "too-bright",
      "blurry",
      "obstructed",
    ];
    const { rerender } = render(
      <CameraCaptureScreen {...createProps({ permissionState: "granted", previewStream })} />,
    );

    for (const captureReadiness of readinessValues) {
      rerender(
        <CameraCaptureScreen
          {...createProps({ permissionState: "granted", previewStream, captureReadiness })}
        />,
      );
      expect(screen.getByText(getReadinessMessage(captureReadiness))).toBeInTheDocument();
    }
  });

  it("disables the shutter when readiness is not ready", () => {
    renderScreen({
      permissionState: "granted",
      previewStream: createFakeStream(),
      captureReadiness: "center-face",
    });
    expect(getCaptureButton()).toBeDisabled();
  });

  it("disables the shutter when the stream is absent", () => {
    renderScreen({
      permissionState: "granted",
      previewStream: null,
      captureReadiness: "ready",
    });
    expect(getCaptureButton()).toBeDisabled();
  });

  it("enables the shutter when a stream exists and readiness is ready", () => {
    renderScreen({
      permissionState: "granted",
      previewStream: createFakeStream(),
      captureReadiness: "ready",
    });
    expect(getCaptureButton()).toBeEnabled();
  });

  it("invokes the capture callback when the shutter is activated", () => {
    const onCapturePhoto = vi.fn();
    renderScreen({
      permissionState: "granted",
      previewStream: createFakeStream(),
      captureReadiness: "ready",
      onCapturePhoto,
    });
    fireEvent.click(getCaptureButton());
    expect(onCapturePhoto).toHaveBeenCalledTimes(1);
  });

  it("prevents duplicate capture activation", async () => {
    const pending = createPendingCallback();
    renderScreen({
      permissionState: "granted",
      previewStream: createFakeStream(),
      captureReadiness: "ready",
      onCapturePhoto: pending.callback,
    });
    fireEvent.click(getCaptureButton());
    fireEvent.click(screen.getByRole("button", { name: copy.capturing }));
    expect(pending.callback).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve());
  });

  it("shows a toast when capture rejects", async () => {
    renderScreen({
      permissionState: "granted",
      previewStream: createFakeStream(),
      captureReadiness: "ready",
      onCapturePhoto: vi.fn().mockRejectedValue(new Error("capture failed")),
    });
    fireEvent.click(getCaptureButton());
    expect(await screen.findByText(copy.captureError)).toBeInTheDocument();
  });

  it("disables Back while capture is pending", async () => {
    const pending = createPendingCallback();
    renderScreen({
      permissionState: "granted",
      previewStream: createFakeStream(),
      captureReadiness: "ready",
      onCapturePhoto: pending.callback,
    });
    fireEvent.click(getCaptureButton());
    expect(screen.getByRole("button", { name: "Go back" })).toBeDisabled();
    await act(async () => pending.resolve());
  });

  it("disables Choose Another Method while capture is pending", async () => {
    const pending = createPendingCallback();
    renderScreen({
      permissionState: "granted",
      previewStream: createFakeStream(),
      captureReadiness: "ready",
      onCapturePhoto: pending.callback,
    });
    fireEvent.click(getCaptureButton());
    expect(screen.getByRole("button", { name: copy.chooseDifferentSource })).toBeDisabled();
    await act(async () => pending.resolve());
  });

  it("shows the camera-switch control only when supported and supplied", () => {
    const { unmount } = renderScreen({ permissionState: "granted" });
    expect(screen.queryByRole("button", { name: "Switch camera" })).not.toBeInTheDocument();
    unmount();

    const { unmount: unmountUnsupported } = renderScreen({
      permissionState: "granted",
      onSwitchCamera: vi.fn(),
      canSwitchCamera: false,
    });
    expect(screen.queryByRole("button", { name: "Switch camera" })).not.toBeInTheDocument();
    unmountUnsupported();

    renderScreen({ permissionState: "granted", onSwitchCamera: vi.fn(), canSwitchCamera: true });
    expect(screen.getByRole("button", { name: "Switch camera" })).toBeInTheDocument();
  });

  it("invokes the camera-switch callback", () => {
    const onSwitchCamera = vi.fn();
    renderScreen({ permissionState: "granted", onSwitchCamera, canSwitchCamera: true });
    fireEvent.click(screen.getByRole("button", { name: "Switch camera" }));
    expect(onSwitchCamera).toHaveBeenCalledTimes(1);
  });

  it("shows a toast when camera switching rejects", async () => {
    renderScreen({
      permissionState: "granted",
      onSwitchCamera: vi.fn().mockRejectedValue(new Error("switch failed")),
      canSwitchCamera: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Switch camera" }));
    expect(await screen.findByText(copy.switchError)).toBeInTheDocument();
  });

  it("shows the offline banner in the permission view", () => {
    renderScreen({ isOffline: true });
    expect(screen.getByText(copy.offline).closest('[role="status"]')).toBeInTheDocument();
  });

  it("shows the compact offline note in the live view", () => {
    renderScreen({ permissionState: "granted", isOffline: true });
    expect(screen.getByText(copy.offlineLive).closest('[role="status"]')).toBeInTheDocument();
  });

  it("invokes the Back callback", () => {
    const onBack = vi.fn();
    renderScreen({ onBack });
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows a toast when Back rejects", async () => {
    renderScreen({ onBack: vi.fn().mockRejectedValue(new Error("back failed")) });
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByText(copy.backError)).toBeInTheDocument();
  });

  it("invokes Choose Another Method", () => {
    const onChooseDifferentSource = vi.fn();
    renderScreen({ onChooseDifferentSource });
    fireEvent.click(screen.getByRole("button", { name: copy.chooseDifferentSource }));
    expect(onChooseDifferentSource).toHaveBeenCalledTimes(1);
  });

  it("shows a toast when Choose Another Method rejects", async () => {
    renderScreen({
      onChooseDifferentSource: vi.fn().mockRejectedValue(new Error("source failed")),
    });
    fireEvent.click(screen.getByRole("button", { name: copy.chooseDifferentSource }));
    expect(await screen.findByText(copy.sourceError)).toBeInTheDocument();
  });

  it("does not render a file input", () => {
    const { container } = renderScreen();
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  it("does not call getUserMedia on mount", () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    renderScreen();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("does not request geolocation", () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });
    renderScreen();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("restores mocked browser API property descriptors", () => {
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: vi.fn() },
    });

    restoreNavigatorProperty("mediaDevices", originalMediaDevicesDescriptor);
    restoreNavigatorProperty("geolocation", originalGeolocationDescriptor);

    expect(Object.getOwnPropertyDescriptor(window.navigator, "mediaDevices")).toEqual(
      originalMediaDevicesDescriptor,
    );
    expect(Object.getOwnPropertyDescriptor(window.navigator, "geolocation")).toEqual(
      originalGeolocationDescriptor,
    );
  });
});
