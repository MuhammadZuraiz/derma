import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import PrivacyAndFacialDataConsentScreen, {
  copy,
  type FacialDataConsentRecord,
  type PrivacyAndFacialDataConsentScreenProps,
} from "./privacy-consent-screen";

afterEach(() => {
  cleanup();
});

function createProps(
  overrides: Partial<PrivacyAndFacialDataConsentScreenProps> = {},
): PrivacyAndFacialDataConsentScreenProps {
  return {
    consentVersion: "facial-consent-v1",
    privacyNoticeVersion: "privacy-notice-v3",
    onBack: vi.fn(),
    onAcceptConsent: vi.fn(),
    onDeclineConsent: vi.fn(),
    onOpenPrivacyNotice: vi.fn(),
    ...overrides,
  };
}

function renderScreen(overrides: Partial<PrivacyAndFacialDataConsentScreenProps> = {}) {
  const props = createProps(overrides);
  render(<PrivacyAndFacialDataConsentScreen {...props} />);
  return props;
}

function getConsentCheckbox() {
  return screen.getByRole("checkbox", { name: copy.consentLabel });
}

function getPrimaryButton() {
  return screen.getByRole("button", { name: copy.accept });
}

describe("PrivacyAndFacialDataConsentScreen", () => {
  it("leaves the consent checkbox unselected by default", () => {
    renderScreen();
    expect(getConsentCheckbox()).not.toBeChecked();
  });

  it("disables the primary CTA by default", () => {
    renderScreen();
    expect(getPrimaryButton()).toBeDisabled();
  });

  it("enables the primary CTA when consent is selected", () => {
    renderScreen();
    fireEvent.click(getConsentCheckbox());
    expect(getPrimaryButton()).toBeEnabled();
  });

  it("disables the primary CTA again when consent is deselected", () => {
    renderScreen();
    fireEvent.click(getConsentCheckbox());
    fireEvent.click(getConsentCheckbox());
    expect(getPrimaryButton()).toBeDisabled();
  });

  it("passes the complete consent record when the primary CTA is activated", async () => {
    const onAcceptConsent = vi.fn();
    renderScreen({ onAcceptConsent });

    fireEvent.click(getConsentCheckbox());
    fireEvent.click(getPrimaryButton());

    await waitFor(() => expect(onAcceptConsent).toHaveBeenCalledTimes(1));

    const record = onAcceptConsent.mock.calls[0][0] as FacialDataConsentRecord;
    expect(record).toEqual(
      expect.objectContaining({
        facialAnalysisConsent: true,
        consentVersion: "facial-consent-v1",
        privacyNoticeVersion: "privacy-notice-v3",
      }),
    );
    expect(record.acceptedAtClient).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it("shows the loading label while async submission is pending", async () => {
    let resolveSubmission!: () => void;
    const onAcceptConsent = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmission = resolve;
        }),
    );

    renderScreen({ onAcceptConsent });
    fireEvent.click(getConsentCheckbox());
    fireEvent.click(getPrimaryButton());

    expect(
      screen.getByRole("button", { name: copy.submitting }),
    ).toBeDisabled();

    await act(async () => {
      resolveSubmission();
    });
  });

  it("prevents duplicate primary CTA activation", async () => {
    let resolveSubmission!: () => void;
    const onAcceptConsent = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmission = resolve;
        }),
    );

    renderScreen({ onAcceptConsent });
    fireEvent.click(getConsentCheckbox());
    const button = getPrimaryButton();
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onAcceptConsent).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSubmission();
    });
  });


  it("disables the back button while consent submission is pending", async () => {
    let resolveSubmission!: () => void;
    renderScreen({
      onAcceptConsent: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmission = resolve;
          }),
      ),
    });

    fireEvent.click(getConsentCheckbox());
    fireEvent.click(getPrimaryButton());

    expect(screen.getByRole("button", { name: "Go back" })).toBeDisabled();

    await act(async () => {
      resolveSubmission();
    });
  });

  it("disables Not now while consent submission is pending", async () => {
    let resolveSubmission!: () => void;
    renderScreen({
      onAcceptConsent: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmission = resolve;
          }),
      ),
    });

    fireEvent.click(getConsentCheckbox());
    fireEvent.click(getPrimaryButton());

    expect(screen.getByRole("button", { name: copy.decline })).toBeDisabled();

    await act(async () => {
      resolveSubmission();
    });
  });

  it("disables the Privacy Notice button while consent submission is pending", async () => {
    let resolveSubmission!: () => void;
    renderScreen({
      onAcceptConsent: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmission = resolve;
          }),
      ),
    });

    fireEvent.click(getConsentCheckbox());
    fireEvent.click(getPrimaryButton());

    expect(
      screen.getByRole("button", { name: copy.privacyNotice }),
    ).toBeDisabled();

    await act(async () => {
      resolveSubmission();
    });
  });

  it("does not invoke secondary navigation callbacks while consent submission is pending", async () => {
    let resolveSubmission!: () => void;
    const onBack = vi.fn();
    const onDeclineConsent = vi.fn();
    const onOpenPrivacyNotice = vi.fn();

    renderScreen({
      onAcceptConsent: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmission = resolve;
          }),
      ),
      onBack,
      onDeclineConsent,
      onOpenPrivacyNotice,
    });

    fireEvent.click(getConsentCheckbox());
    fireEvent.click(getPrimaryButton());

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    fireEvent.click(screen.getByRole("button", { name: copy.decline }));
    fireEvent.click(screen.getByRole("button", { name: copy.privacyNotice }));

    expect(onBack).not.toHaveBeenCalled();
    expect(onDeclineConsent).not.toHaveBeenCalled();
    expect(onOpenPrivacyNotice).not.toHaveBeenCalled();

    await act(async () => {
      resolveSubmission();
    });
  });

  it("keeps consent selected and shows an inline error after submission rejection", async () => {
    renderScreen({
      onAcceptConsent: vi.fn().mockRejectedValue(new Error("save failed")),
    });

    fireEvent.click(getConsentCheckbox());
    fireEvent.click(getPrimaryButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(copy.submitError);
    expect(getConsentCheckbox()).toBeChecked();
  });

  it("shows the offline banner when offline", () => {
    renderScreen({ isOffline: true });
    expect(screen.getByText(copy.offline).closest("[role=\"status\"]")).toBeInTheDocument();
  });

  it("invokes Not now without creating a consent record", () => {
    const onAcceptConsent = vi.fn();
    const onDeclineConsent = vi.fn();
    renderScreen({ onAcceptConsent, onDeclineConsent });

    fireEvent.click(screen.getByRole("button", { name: copy.decline }));

    expect(onDeclineConsent).toHaveBeenCalledTimes(1);
    expect(onAcceptConsent).not.toHaveBeenCalled();
  });

  it("invokes the back callback", () => {
    const onBack = vi.fn();
    renderScreen({ onBack });

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("invokes the Privacy Notice callback", () => {
    const onOpenPrivacyNotice = vi.fn();
    renderScreen({ onOpenPrivacyNotice });

    fireEvent.click(screen.getByRole("button", { name: copy.privacyNotice }));

    expect(onOpenPrivacyNotice).toHaveBeenCalledTimes(1);
  });

  it("shows the Privacy Notice fallback toast when opening fails", async () => {
    renderScreen({
      onOpenPrivacyNotice: vi.fn().mockRejectedValue(new Error("route failed")),
    });

    fireEvent.click(screen.getByRole("button", { name: copy.privacyNotice }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(copy.privacyNoticeError);
    });
  });

  it("keeps protection details collapsed by default and allows expansion", () => {
    renderScreen();
    const summary = screen.getByText(copy.protectionHeading).closest("summary");
    const details = summary?.closest("details");

    expect(summary).not.toBeNull();
    expect(details).not.toHaveAttribute("open");

    fireEvent.click(summary as HTMLElement);

    expect(details).toHaveAttribute("open");
    expect(screen.getByText(copy.protectionDeviceBody)).toBeInTheDocument();
  });

  it("uses role alert for submission errors", async () => {
    renderScreen({
      onAcceptConsent: vi.fn().mockRejectedValue(new Error("save failed")),
    });

    fireEvent.click(getConsentCheckbox());
    fireEvent.click(getPrimaryButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(copy.submitError);
  });
});
