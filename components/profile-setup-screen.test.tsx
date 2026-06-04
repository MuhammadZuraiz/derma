import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProfileSetupScreen, {
  copy,
  type ProfileSetupScreenProps,
  type SkinProfileDraft,
} from "./profile-setup-screen";

afterEach(() => {
  cleanup();
});

const countries = [
  { code: "AE", name: "United Arab Emirates" },
  { code: "CA", name: "Canada" },
  { code: "AZ", name: "Azerbaijan" },
];

function createProps(overrides: Partial<ProfileSetupScreenProps> = {}): ProfileSetupScreenProps {
  return {
    countries,
    onBack: vi.fn(),
    onSaveProfile: vi.fn(),
    ...overrides,
  };
}

function renderScreen(overrides: Partial<ProfileSetupScreenProps> = {}) {
  const props = createProps(overrides);
  render(<ProfileSetupScreen {...props} />);
  return props;
}

function getNameInput() {
  return screen.getByRole("textbox", { name: copy.nameLabel });
}

function getSaveButton() {
  return screen.getByRole("button", { name: copy.save });
}

function expandOptionalDetails() {
  fireEvent.click(screen.getByText(copy.optionalHeading));
}

function enterValidName(name = "  Amara  ") {
  fireEvent.change(getNameInput(), { target: { value: name } });
}

function createPendingSave() {
  let resolveSave!: () => void;
  const onSaveProfile = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      }),
  );
  return { onSaveProfile, resolve: () => resolveSave() };
}

describe("ProfileSetupScreen", () => {
  it("starts with a blank nickname input", () => {
    renderScreen();
    expect(getNameInput()).toHaveValue("");
  });

  it("disables the primary CTA when the nickname is blank", () => {
    renderScreen();
    expect(getSaveButton()).toBeDisabled();
  });

  it("does not enable the CTA for a whitespace-only nickname", () => {
    renderScreen();
    fireEvent.change(getNameInput(), { target: { value: "   " } });
    expect(getSaveButton()).toBeDisabled();
  });

  it("enables the CTA for a valid nickname", () => {
    renderScreen();
    enterValidName("Amara");
    expect(getSaveButton()).toBeEnabled();
  });

  it("keeps optional details collapsed by default", () => {
    renderScreen();
    expect(screen.getByText(copy.optionalHeading).closest("details")).not.toHaveAttribute("open");
    expect(document.querySelector("#age-range")).not.toBeVisible();
  });

  it("allows optional details to be expanded", () => {
    renderScreen();
    expandOptionalDetails();
    expect(screen.getByRole("combobox", { name: copy.ageLabel })).toBeVisible();
  });

  it("trims the nickname before saving", async () => {
    const onSaveProfile = vi.fn();
    renderScreen({ onSaveProfile });
    enterValidName("  Amara  ");
    fireEvent.click(getSaveButton());

    await waitFor(() => expect(onSaveProfile).toHaveBeenCalledTimes(1));
    expect((onSaveProfile.mock.calls[0][0] as SkinProfileDraft).profileName).toBe("Amara");
  });

  it("passes createdAtClient in ISO format", async () => {
    const onSaveProfile = vi.fn();
    renderScreen({ onSaveProfile });
    enterValidName("Amara");
    fireEvent.click(getSaveButton());

    await waitFor(() => expect(onSaveProfile).toHaveBeenCalledTimes(1));
    expect((onSaveProfile.mock.calls[0][0] as SkinProfileDraft).createdAtClient).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it("includes optional values when they are selected", async () => {
    const onSaveProfile = vi.fn();
    renderScreen({ onSaveProfile });
    enterValidName("Amara");
    expandOptionalDetails();
    fireEvent.change(screen.getByRole("combobox", { name: copy.ageLabel }), { target: { value: "25-34" } });
    fireEvent.change(screen.getByRole("combobox", { name: copy.focusLabel }), { target: { value: "build-routine" } });
    fireEvent.change(screen.getByRole("combobox", { name: copy.countryLabel }), { target: { value: "AE" } });
    fireEvent.click(getSaveButton());

    await waitFor(() => expect(onSaveProfile).toHaveBeenCalledTimes(1));
    expect(onSaveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        ageRange: "25-34",
        primaryFocus: "build-routine",
        countryCode: "AE",
      }),
    );
  });

  it("omits optional values when they are not selected", async () => {
    const onSaveProfile = vi.fn();
    renderScreen({ onSaveProfile });
    enterValidName("Amara");
    fireEvent.click(getSaveButton());

    await waitFor(() => expect(onSaveProfile).toHaveBeenCalledTimes(1));
    const draft = onSaveProfile.mock.calls[0][0] as SkinProfileDraft;
    expect(draft).not.toHaveProperty("ageRange");
    expect(draft).not.toHaveProperty("primaryFocus");
    expect(draft).not.toHaveProperty("countryCode");
  });

  it("prevents duplicate save activation", async () => {
    const pending = createPendingSave();
    renderScreen({ onSaveProfile: pending.onSaveProfile });
    enterValidName("Amara");
    const button = getSaveButton();
    fireEvent.click(button);
    fireEvent.click(button);

    expect(pending.onSaveProfile).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve());
  });

  it("disables the CTA while saving is pending", async () => {
    const pending = createPendingSave();
    renderScreen({ onSaveProfile: pending.onSaveProfile });
    enterValidName("Amara");
    fireEvent.click(getSaveButton());

    expect(screen.getByRole("button", { name: copy.saving })).toBeDisabled();
    await act(async () => pending.resolve());
  });

  it("disables both Back controls while saving is pending", async () => {
    const pending = createPendingSave();
    renderScreen({ onSaveProfile: pending.onSaveProfile });
    enterValidName("Amara");
    fireEvent.click(getSaveButton());

    expect(screen.getByRole("button", { name: "Go back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.back })).toBeDisabled();
    await act(async () => pending.resolve());
  });

  it("preserves entered values after a save rejection", async () => {
    renderScreen({ onSaveProfile: vi.fn().mockRejectedValue(new Error("save failed")) });
    enterValidName("Amara");
    expandOptionalDetails();
    fireEvent.change(screen.getByRole("combobox", { name: copy.focusLabel }), { target: { value: "hydration-barrier" } });
    fireEvent.click(getSaveButton());

    await screen.findByText(copy.saveError);
    expect(getNameInput()).toHaveValue("Amara");
    expect(screen.getByRole("combobox", { name: copy.focusLabel })).toHaveValue("hydration-barrier");
  });

  it("shows a save rejection inline with alert semantics", async () => {
    renderScreen({ onSaveProfile: vi.fn().mockRejectedValue(new Error("save failed")) });
    enterValidName("Amara");
    fireEvent.click(getSaveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(copy.saveError);
  });

  it("shows the offline banner when offline", () => {
    renderScreen({ isOffline: true });
    expect(screen.getByText(copy.offline).closest('[role="status"]')).toBeInTheDocument();
  });

  it("invokes onBack from the back button", () => {
    const onBack = vi.fn();
    renderScreen({ onBack });
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows the toast fallback when back navigation rejects", async () => {
    renderScreen({ onBack: vi.fn().mockRejectedValue(new Error("back failed")) });
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByText(copy.backError)).toBeInTheDocument();
  });

  it("sorts country options alphabetically", () => {
    renderScreen();
    expandOptionalDetails();
    const select = screen.getByRole("combobox", { name: copy.countryLabel });
    const labels = within(select).getAllByRole("option").map((option) => option.textContent);
    expect(labels).toEqual([
      copy.countryPlaceholder,
      "Azerbaijan",
      "Canada",
      "United Arab Emirates",
    ]);
  });

  it("shows the minor-profile notice for an under-18 profile when minors are not supported", () => {
    renderScreen();
    enterValidName("Amara");
    expandOptionalDetails();
    fireEvent.change(screen.getByRole("combobox", { name: copy.ageLabel }), { target: { value: "under-18" } });
    expect(screen.getByRole("alert")).toHaveTextContent(copy.minorNotice);
  });

  it("disables saving for an unsupported under-18 profile", () => {
    renderScreen();
    enterValidName("Amara");
    expandOptionalDetails();
    fireEvent.change(screen.getByRole("combobox", { name: copy.ageLabel }), { target: { value: "under-18" } });
    expect(getSaveButton()).toBeDisabled();
  });

  it("does not block saving for an under-18 profile when minor profiles are supported", () => {
    renderScreen({ allowMinorProfiles: true });
    enterValidName("Amara");
    expandOptionalDetails();
    fireEvent.change(screen.getByRole("combobox", { name: copy.ageLabel }), { target: { value: "under-18" } });
    expect(screen.queryByText(copy.minorNotice)).not.toBeInTheDocument();
    expect(getSaveButton()).toBeEnabled();
  });

  it("does not render an exact date-of-birth input", () => {
    const { container } = render(<ProfileSetupScreen {...createProps()} />);
    expect(container.querySelector('input[type="date"]')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/date of birth/i)).not.toBeInTheDocument();
  });

  it("does not render a city input", () => {
    renderScreen();
    expect(screen.queryByLabelText(/city/i)).not.toBeInTheDocument();
  });

  it("does not request browser geolocation", () => {
    const geolocationGetter = vi.fn(() => undefined);
    const navigatorPrototype = Object.getPrototypeOf(window.navigator) as object;
    const originalDescriptor = Object.getOwnPropertyDescriptor(navigatorPrototype, "geolocation");
    Object.defineProperty(navigatorPrototype, "geolocation", {
      configurable: true,
      get: geolocationGetter,
    });

    try {
      renderScreen();
      expect(geolocationGetter).not.toHaveBeenCalled();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(navigatorPrototype, "geolocation", originalDescriptor);
      } else {
        delete (navigatorPrototype as { geolocation?: unknown }).geolocation;
      }
    }
  });
});
