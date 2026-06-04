import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import WelcomeScreen, { copy, type WelcomeScreenProps } from "./welcome-screen";

const createProps = (
  overrides: Partial<WelcomeScreenProps> = {},
): WelcomeScreenProps => ({
  onStartAnalysis: vi.fn(),
  onSignIn: vi.fn(),
  onOpenGuestScanner: vi.fn(),
  ...overrides,
});

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

beforeAll(() => {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0);
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (handle: number) => window.clearTimeout(handle);
  }
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WelcomeScreen", () => {
  it("invokes onStartAnalysis when the primary CTA is activated", () => {
    const onStartAnalysis = vi.fn();

    render(<WelcomeScreen {...createProps({ onStartAnalysis })} />);

    fireEvent.click(
      screen.getByRole("button", { name: copy.startAnalysis }),
    );

    expect(onStartAnalysis).toHaveBeenCalledTimes(1);
  });

  it("shows loading text and disables the primary CTA while preparation is pending", async () => {
    const deferred = createDeferred<void>();

    render(
      <WelcomeScreen
        {...createProps({ onStartAnalysis: () => deferred.promise })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: copy.startAnalysis }),
    );

    const preparingButton = screen.getByRole("button", {
      name: copy.preparing,
    });

    expect(preparingButton).toBeDisabled();

    deferred.resolve(undefined);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: copy.startAnalysis }),
      ).toBeEnabled();
    });
  });

  it("displays a non-blocking toast when onStartAnalysis rejects", async () => {
    render(
      <WelcomeScreen
        {...createProps({
          onStartAnalysis: vi
            .fn()
            .mockRejectedValue(new Error("analysis route unavailable")),
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: copy.startAnalysis }),
    );

    expect(await screen.findByText(copy.startAnalysisUnavailable)).toBeVisible();
  });

  it("renders the offline banner when isOffline is true", () => {
    render(<WelcomeScreen {...createProps({ isOffline: true })} />);

    expect(screen.getByText(copy.offline).closest('[role="status"]')).toBeVisible();
  });

  it("opens the Privacy Sheet and makes the background shell inert", () => {
    render(<WelcomeScreen {...createProps()} />);

    fireEvent.click(
      screen.getByRole("button", { name: copy.privacyLink }),
    );

    expect(screen.getByRole("dialog", { name: copy.privacyTitle })).toBeVisible();
    expect(document.querySelector("main")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector("main")).toHaveAttribute("inert");
  });

  it("closes the Privacy Sheet when Escape is pressed", () => {
    render(<WelcomeScreen {...createProps()} />);

    fireEvent.click(
      screen.getByRole("button", { name: copy.privacyLink }),
    );
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("returns focus to the Privacy Link after the sheet closes", async () => {
    render(<WelcomeScreen {...createProps()} />);

    const privacyLink = screen.getByRole("button", { name: copy.privacyLink });

    fireEvent.click(privacyLink);
    fireEvent.click(screen.getByRole("button", { name: copy.privacyClose }));

    await waitFor(() => {
      expect(privacyLink).toHaveFocus();
    });
  });

  it("invokes onOpenGuestScanner when the Guest Scanner Card is activated", () => {
    const onOpenGuestScanner = vi.fn();

    render(<WelcomeScreen {...createProps({ onOpenGuestScanner })} />);

    fireEvent.click(
      screen.getByRole("button", { name: /checking a product/i }),
    );

    expect(onOpenGuestScanner).toHaveBeenCalledTimes(1);
  });

  it("keeps the Guest Scanner Card visible but unavailable when offline scanning is unsupported", () => {
    const onOpenGuestScanner = vi.fn();

    render(
      <WelcomeScreen
        {...createProps({ isOffline: true, onOpenGuestScanner })}
      />,
    );

    const scannerCard = screen.getByRole("button", {
      name: /checking a product/i,
    });

    expect(scannerCard).toHaveAttribute("aria-disabled", "true");
    expect(scannerCard).toHaveTextContent(copy.scannerOffline);

    fireEvent.click(scannerCard);

    expect(onOpenGuestScanner).not.toHaveBeenCalled();
  });

  it("displays the local-profile fallback toast when sign-in rejects", async () => {
    render(
      <WelcomeScreen
        {...createProps({
          onSignIn: vi.fn().mockRejectedValue(new Error("sign-in unavailable")),
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: copy.signInAction }),
    );

    expect(await screen.findByText(copy.signInUnavailable)).toBeVisible();
  });
});
