import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ImageSourceSelectionScreen, {
  copy,
  type ImageSourceSelectionScreenProps,
} from "./image-source-selection-screen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function createProps(
  overrides: Partial<ImageSourceSelectionScreenProps> = {},
): ImageSourceSelectionScreenProps {
  return {
    profileName: "Amara",
    onBack: vi.fn(),
    onChooseCamera: vi.fn(),
    onChooseUpload: vi.fn(),
    ...overrides,
  };
}

function renderScreen(overrides: Partial<ImageSourceSelectionScreenProps> = {}) {
  const props = createProps(overrides);
  render(<ImageSourceSelectionScreen {...props} />);
  return props;
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

function getCameraButton() {
  return screen.getByRole("button", { name: copy.cameraTitle });
}

function getUploadButton() {
  return screen.getByRole("button", { name: copy.uploadTitle });
}

describe("ImageSourceSelectionScreen", () => {
  it("displays the active profile name", () => {
    renderScreen({ profileName: "Amara" });
    expect(screen.getByText("Amara")).toBeInTheDocument();
  });

  it("derives the profile initial from the trimmed profile name", () => {
    renderScreen({ profileName: "   amara   " });
    expect(screen.getByTestId("profile-initial")).toHaveTextContent("A");
  });

  it("shows a question mark when the profile name is empty", () => {
    renderScreen({ profileName: "   " });
    expect(screen.getByTestId("profile-initial")).toHaveTextContent("?");
  });

  it("shows the camera option", () => {
    renderScreen();
    expect(getCameraButton()).toBeInTheDocument();
  });

  it("shows the upload option", () => {
    renderScreen();
    expect(getUploadButton()).toBeInTheDocument();
  });

  it("labels the camera option as recommended", () => {
    renderScreen();
    expect(screen.getByText(copy.recommended)).toBeInTheDocument();
  });

  it("invokes the camera callback", () => {
    const onChooseCamera = vi.fn();
    renderScreen({ onChooseCamera });
    fireEvent.click(getCameraButton());
    expect(onChooseCamera).toHaveBeenCalledTimes(1);
  });

  it("invokes the upload callback", () => {
    const onChooseUpload = vi.fn();
    renderScreen({ onChooseUpload });
    fireEvent.click(getUploadButton());
    expect(onChooseUpload).toHaveBeenCalledTimes(1);
  });

  it("disables both source cards while camera opening is pending", async () => {
    const pending = createPendingCallback();
    renderScreen({ onChooseCamera: pending.callback });
    fireEvent.click(getCameraButton());

    expect(screen.getByRole("button", { name: copy.openingCamera })).toBeDisabled();
    expect(getUploadButton()).toBeDisabled();
    await act(async () => pending.resolve());
  });

  it("disables both source cards while upload opening is pending", async () => {
    const pending = createPendingCallback();
    renderScreen({ onChooseUpload: pending.callback });
    fireEvent.click(getUploadButton());

    expect(getCameraButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.openingUpload })).toBeDisabled();
    await act(async () => pending.resolve());
  });

  it("disables Back while a source opening is pending", async () => {
    const pending = createPendingCallback();
    renderScreen({ onChooseCamera: pending.callback });
    fireEvent.click(getCameraButton());

    expect(screen.getByRole("button", { name: "Go back" })).toBeDisabled();
    await act(async () => pending.resolve());
  });

  it("disables Change Profile while a source opening is pending", async () => {
    const pending = createPendingCallback();
    renderScreen({ onChooseCamera: pending.callback, onChangeProfile: vi.fn() });
    fireEvent.click(getCameraButton());

    expect(screen.getByRole("button", { name: copy.changeProfile })).toBeDisabled();
    await act(async () => pending.resolve());
  });

  it("prevents duplicate source activation", async () => {
    const pending = createPendingCallback();
    const onChooseUpload = vi.fn();
    renderScreen({ onChooseCamera: pending.callback, onChooseUpload });
    fireEvent.click(getCameraButton());
    fireEvent.click(screen.getByRole("button", { name: copy.openingCamera }));
    fireEvent.click(getUploadButton());

    expect(pending.callback).toHaveBeenCalledTimes(1);
    expect(onChooseUpload).not.toHaveBeenCalled();
    await act(async () => pending.resolve());
  });

  it("shows a toast when the camera callback rejects", async () => {
    renderScreen({ onChooseCamera: vi.fn().mockRejectedValue(new Error("camera failed")) });
    fireEvent.click(getCameraButton());
    expect(await screen.findByText(copy.sourceError)).toBeInTheDocument();
  });

  it("shows a toast when the upload callback rejects", async () => {
    renderScreen({ onChooseUpload: vi.fn().mockRejectedValue(new Error("upload failed")) });
    fireEvent.click(getUploadButton());
    expect(await screen.findByText(copy.sourceError)).toBeInTheDocument();
  });

  it("keeps the camera card visible and disabled when the camera is unavailable", () => {
    renderScreen({ isCameraAvailable: false });
    expect(getCameraButton()).toBeDisabled();
    expect(screen.getByText(copy.cameraUnavailable)).toBeInTheDocument();
  });

  it("keeps the upload card visible and disabled when upload is unavailable", () => {
    renderScreen({ isUploadAvailable: false });
    expect(getUploadButton()).toBeDisabled();
    expect(screen.getByText(copy.uploadUnavailable)).toBeInTheDocument();
  });

  it("renders an alert when neither image source is available", () => {
    renderScreen({ isCameraAvailable: false, isUploadAvailable: false });
    expect(screen.getByRole("alert")).toHaveTextContent(copy.noSources);
    expect(getCameraButton()).toBeDisabled();
    expect(getUploadButton()).toBeDisabled();
  });

  it("shows the offline banner when offline", () => {
    renderScreen({ isOffline: true });
    expect(screen.getByText(copy.offline).closest('[role="status"]')).toBeInTheDocument();
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

  it("shows Change Profile only when its callback is provided", () => {
    const { unmount } = render(<ImageSourceSelectionScreen {...createProps()} />);
    expect(screen.queryByRole("button", { name: copy.changeProfile })).not.toBeInTheDocument();
    unmount();

    renderScreen({ onChangeProfile: vi.fn() });
    expect(screen.getByRole("button", { name: copy.changeProfile })).toBeInTheDocument();
  });

  it("invokes the Change Profile callback", () => {
    const onChangeProfile = vi.fn();
    renderScreen({ onChangeProfile });
    fireEvent.click(screen.getByRole("button", { name: copy.changeProfile }));
    expect(onChangeProfile).toHaveBeenCalledTimes(1);
  });

  it("shows a toast when Change Profile rejects", async () => {
    renderScreen({ onChangeProfile: vi.fn().mockRejectedValue(new Error("profiles failed")) });
    fireEvent.click(screen.getByRole("button", { name: copy.changeProfile }));
    expect(await screen.findByText(copy.profileError)).toBeInTheDocument();
  });

  it("does not render a file input", () => {
    const { container } = render(<ImageSourceSelectionScreen {...createProps()} />);
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  it("does not invoke a camera media-device API on mount", () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    renderScreen();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("does not invoke geolocation on mount", () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    renderScreen();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
