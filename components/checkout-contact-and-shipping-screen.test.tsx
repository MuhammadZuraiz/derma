import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CheckoutContactAndShippingScreen, {
  copy,
  formatCartItemCount,
  getInitialDraft,
  getInitialSavedAddressId,
  normaliseNonNegativeInteger,
  trimCheckoutDraft,
  validateCheckoutDraft,
  type CheckoutContactAndShippingDraft,
  type CheckoutContactAndShippingReport,
  type CheckoutContactAndShippingScreenProps,
} from "./checkout-contact-and-shipping-screen";

const emptyDraft: CheckoutContactAndShippingDraft = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  countryCode: "",
  saveOnDevice: false,
};

const validDraft: CheckoutContactAndShippingDraft = {
  fullName: "Amara Khan",
  email: "amara@example.com",
  phone: "+971 50 123 4567",
  addressLine1: "21 Palm Street",
  addressLine2: "Apartment 8",
  city: "Dubai",
  region: "Dubai",
  postalCode: "00000",
  countryCode: "AE",
  saveOnDevice: true,
};

function reportWith(
  patch: Partial<CheckoutContactAndShippingReport> = {},
): CheckoutContactAndShippingReport {
  return {
    checkoutSessionId: "checkout-session-1",
    profileName: "Amara",
    defaultDraft: emptyDraft,
    initialSavedAddressId: "home",
    savedAddresses: [
      {
        id: "home",
        label: "Home",
        draft: validDraft,
        displayLines: ["21 Palm Street", "Dubai, Dubai"],
        contactLabel: "+971 50 123 4567",
      },
      {
        id: "office",
        label: "Office",
        draft: {
          ...validDraft,
          fullName: "Amara at Work",
          addressLine1: "11 Business Bay",
        },
        displayLines: ["11 Business Bay", "Dubai, Dubai"],
      },
    ],
    countryOptions: [
      { code: "AE", label: "United Arab Emirates" },
      { code: "HU", label: "Hungary" },
      { code: "PK", label: "Pakistan" },
    ],
    postalCodeRequired: true,
    cartSummary: {
      itemCount: 3,
      subtotalLabel: "AED 210",
    },
    syncHelperLabel: "Optional sync can be enabled later from your account settings.",
    ...patch,
  };
}

function createProps(
  patch: Partial<CheckoutContactAndShippingScreenProps> = {},
): CheckoutContactAndShippingScreenProps {
  return {
    state: "ready",
    report: reportWith(),
    onBack: vi.fn(),
    onContinue: vi.fn(),
    ...patch,
  };
}

function renderScreen(
  patch: Partial<CheckoutContactAndShippingScreenProps> = {},
) {
  const props = createProps(patch);
  const view = render(<CheckoutContactAndShippingScreen {...props} />);
  return { ...view, props };
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function useDifferentAddress() {
  fireEvent.click(
    screen.getByRole("radio", { name: copy.useDifferentAddress }),
  );
}

function fillValidDraft() {
  useDifferentAddress();
  fireEvent.change(screen.getByLabelText(copy.fullName), {
    target: { value: "  Noor Ali  " },
  });
  fireEvent.change(screen.getByLabelText(copy.email), {
    target: { value: "  noor@example.com  " },
  });
  fireEvent.change(screen.getByLabelText(copy.phone), {
    target: { value: "  +971 55 555 5555  " },
  });
  fireEvent.change(screen.getByLabelText(copy.addressLine1), {
    target: { value: "  9 Garden Road  " },
  });
  fireEvent.change(screen.getByLabelText(copy.addressLine2), {
    target: { value: "  Flat 3  " },
  });
  fireEvent.change(screen.getByLabelText(copy.city), {
    target: { value: "  Abu Dhabi  " },
  });
  fireEvent.change(screen.getByLabelText(copy.region), {
    target: { value: "  Abu Dhabi  " },
  });
  fireEvent.change(screen.getByLabelText(/Postal code/), {
    target: { value: "  12345  " },
  });
  fireEvent.change(screen.getByLabelText(copy.country), {
    target: { value: "AE" },
  });
}

function continueButton() {
  return screen.getByRole("button", { name: copy.continueToReview });
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("defensive helpers", () => {
  it.each([
    [-1, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [2.9, 2],
    [3, 3],
  ])("normalises %p to %p", (input, output) => {
    expect(normaliseNonNegativeInteger(input)).toBe(output);
  });

  it("formats singular and plural item counts", () => {
    expect(formatCartItemCount(1)).toBe("1 item");
    expect(formatCartItemCount(2)).toBe("2 items");
  });

  it("trims draft strings without changing saveOnDevice", () => {
    expect(trimCheckoutDraft({ ...validDraft, fullName: "  Amara  " })).toEqual({
      ...validDraft,
      fullName: "Amara",
    });
  });

  it("validates required values and basic contact formats", () => {
    const errors = validateCheckoutDraft({
      countryOptions: reportWith().countryOptions,
      draft: emptyDraft,
      postalCodeRequired: true,
    });
    expect(errors.fullName).toBe("Enter your full name.");
    expect(errors.countryCode).toBe("Select your country or region.");
  });

  it("does not require an optional postal code", () => {
    const errors = validateCheckoutDraft({
      countryOptions: reportWith().countryOptions,
      draft: { ...validDraft, postalCode: "" },
      postalCodeRequired: false,
    });
    expect(errors.postalCode).toBeUndefined();
  });

  it("accepts a valid supplied country code", () => {
    const errors = validateCheckoutDraft({
      countryOptions: reportWith().countryOptions,
      draft: validDraft,
      postalCodeRequired: true,
    });
    expect(errors.countryCode).toBeUndefined();
  });

  it("rejects a blank country code", () => {
    const errors = validateCheckoutDraft({
      countryOptions: reportWith().countryOptions,
      draft: { ...validDraft, countryCode: "" },
      postalCodeRequired: true,
    });
    expect(errors.countryCode).toBe("Select your country or region.");
  });

  it("rejects a stale country code missing from the supplied options", () => {
    const errors = validateCheckoutDraft({
      countryOptions: reportWith().countryOptions,
      draft: { ...validDraft, countryCode: "REMOVED" },
      postalCodeRequired: true,
    });
    expect(errors.countryCode).toBe("Select your country or region.");
  });

  it("returns only a valid initial saved-address ID", () => {
    expect(getInitialSavedAddressId(reportWith())).toBe("home");
    expect(getInitialSavedAddressId(reportWith({ initialSavedAddressId: "missing" }))).toBeNull();
  });

  it("uses the selected saved-address draft or default draft", () => {
    expect(getInitialDraft(reportWith()).fullName).toBe("Amara Khan");
    expect(getInitialDraft(reportWith({ initialSavedAddressId: "missing" }))).toBe(emptyDraft);
  });
});

describe("core states", () => {
  it("renders loading heading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByRole("heading", { name: copy.loadingHeading })).toBeInTheDocument();
  });

  it("uses polite status semantics for static loading content only", () => {
    renderScreen({ state: "loading", report: null });
    const status = screen.getByRole("heading", { name: copy.loadingHeading }).parentElement;
    expect(status).toHaveAttribute("role", "status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(within(status as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a disabled neutral loading footer CTA", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByRole("button", { name: copy.continueToReview })).toBeDisabled();
    expect(screen.queryByText(copy.checkoutUnavailable)).not.toBeInTheDocument();
  });

  it("renders ready heading", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
  });

  it("uses a semantic submit button for the ready-state Continue CTA", () => {
    renderScreen();
    expect(continueButton()).toHaveAttribute("type", "submit");
  });

  it("associates the ready-state Continue CTA with the checkout details form", () => {
    renderScreen();
    expect(continueButton()).toHaveAttribute(
      "form",
      "checkout-contact-and-shipping-form",
    );
  });

  it("keeps the disabled loading CTA unassociated with the ready-state form", () => {
    renderScreen({ state: "loading", report: null });
    const button = screen.getByRole("button", { name: copy.continueToReview });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("form");
    expect(button).toHaveAttribute("type", "button");
  });

  it("falls back to error when ready payload is missing", () => {
    renderScreen({ state: "ready", report: null });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("renders a static error alert without buttons", () => {
    renderScreen({ state: "error", report: null });
    const alert = screen.getByRole("alert");
    expect(within(alert).getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
    expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows Retry only when supplied", () => {
    const { rerender, props } = renderScreen({ state: "error", report: null });
    expect(screen.queryByRole("button", { name: copy.retry })).not.toBeInTheDocument();
    rerender(<CheckoutContactAndShippingScreen {...props} onRetryLoad={vi.fn()} />);
    expect(screen.getByRole("button", { name: copy.retry })).toBeInTheDocument();
  });

  it("invokes Retry, shows pending feedback, prevents duplicates, and shows failures", async () => {
    const pending = deferred();
    const onRetryLoad = vi.fn(() => pending.promise);
    renderScreen({ state: "error", report: null, onRetryLoad });
    const retry = screen.getByRole("button", { name: copy.retry });
    fireEvent.click(retry);
    fireEvent.click(screen.getByRole("button", { name: copy.retrying }));
    expect(onRetryLoad).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: copy.retrying })).toBeDisabled();
    pending.reject(new Error("retry failed"));
    await screen.findByText(copy.retryError);
  });
});

describe("guest, privacy, and cart summary messaging", () => {
  it("renders guest checkout and review-before-payment messaging", () => {
    renderScreen();
    expect(screen.getByText(copy.guestCheckout)).toBeInTheDocument();
    expect(screen.getByText(copy.supporting)).toBeInTheDocument();
    expect(screen.getByText(copy.privacyAndPayment)).toBeInTheDocument();
  });

  it("renders no account or payment-card requirement", () => {
    renderScreen();
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cvv/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument();
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
  });

  it.each([
    [3, "3 items"],
    [-1, "0 items"],
    [Number.NaN, "0 items"],
    [Number.POSITIVE_INFINITY, "0 items"],
    [2.9, "2 items"],
  ])("renders safe cart count %p as %s", (itemCount, expected) => {
    renderScreen({ report: reportWith({ cartSummary: { itemCount } }) });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders host subtotal unchanged without inventing a value", () => {
    const { rerender, props } = renderScreen();
    expect(screen.getAllByText("AED 210").length).toBeGreaterThan(0);
    rerender(<CheckoutContactAndShippingScreen {...props} report={reportWith({ cartSummary: { itemCount: 3 } })} />);
    expect(screen.queryByText("AED 210")).not.toBeInTheDocument();
  });

  it("uses a narrow polite cart-summary value and Edit Cart invokes Back", () => {
    const onBack = vi.fn();
    renderScreen({ onBack });
    expect(screen.getByText("3 items · AED 210")).toHaveAttribute("aria-live", "polite");
    fireEvent.click(screen.getByRole("button", { name: copy.editCart }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("saved address selection", () => {
  it("renders saved addresses in host order only when supplied", () => {
    const { rerender, props } = renderScreen();
    const radios = screen.getAllByRole("radio");
    expect(radios.map((radio: HTMLElement) => radio.getAttribute("value"))).toEqual(["home", "office", "new"]);
    rerender(<CheckoutContactAndShippingScreen {...props} report={reportWith({ savedAddresses: [], initialSavedAddressId: undefined })} />);
    expect(screen.queryByText(copy.savedAddressesHeading)).not.toBeInTheDocument();
  });

  it("selects a valid initial saved address and falls back to new mode for invalid ID", () => {
    const { rerender, props } = renderScreen();
    expect(screen.getByRole("radio", { name: /Home/ })).toBeChecked();
    rerender(<CheckoutContactAndShippingScreen {...props} report={reportWith({ checkoutSessionId: "session-2", initialSavedAddressId: "missing" })} />);
    expect(screen.getByRole("radio", { name: copy.useDifferentAddress })).toBeChecked();
  });

  it("populates a saved address locally without calling the host", () => {
    const onContinue = vi.fn();
    renderScreen({ onContinue });
    fireEvent.click(screen.getByRole("radio", { name: /Office/ }));
    expect(screen.getByLabelText(copy.fullName)).toHaveValue("Amara at Work");
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("restores default draft in different-address mode and remains editable", () => {
    renderScreen();
    fireEvent.click(screen.getByRole("radio", { name: copy.useDifferentAddress }));
    expect(screen.getByLabelText(copy.fullName)).toHaveValue("");
    fireEvent.change(screen.getByLabelText(copy.fullName), { target: { value: "New Name" } });
    expect(screen.getByLabelText(copy.fullName)).toHaveValue("New Name");
  });
});

describe("semantic form fields", () => {
  it.each([
    [copy.fullName, "name"],
    [copy.email, "email"],
    [copy.phone, "tel"],
    [copy.addressLine1, "address-line1"],
    [copy.addressLine2, "address-line2"],
    [copy.city, "address-level2"],
    [copy.region, "address-level1"],
    [copy.postalCode, "postal-code"],
    [copy.country, "country"],
  ])("sets autocomplete for %s", (label, autoComplete) => {
    renderScreen();
    expect(screen.getByLabelText(label)).toHaveAttribute("autocomplete", autoComplete);
  });

  it("uses semantic email, tel, select, checkbox, and host country order", () => {
    renderScreen();
    expect(screen.getByLabelText(copy.email)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(copy.phone)).toHaveAttribute("type", "tel");
    const select = screen.getByLabelText(copy.country);
    expect(select.tagName).toBe("SELECT");
    expect(within(select).getAllByRole("option").map((option) => option.textContent)).toEqual([
      copy.selectCountry,
      "United Arab Emirates",
      "Hungary",
      "Pakistan",
    ]);
    expect(screen.getByRole("checkbox", { name: copy.saveOnDevice })).toBeInTheDocument();
  });

  it("does not infer a country and shows optional postal label when configured", () => {
    renderScreen({ report: reportWith({ postalCodeRequired: false, initialSavedAddressId: undefined }) });
    expect(screen.getByLabelText(copy.country)).toHaveValue("");
    expect(screen.getByLabelText(copy.postalCodeOptional)).toBeInTheDocument();
  });

  it("renders sync helper only when supplied", () => {
    const { rerender, props } = renderScreen();
    expect(screen.getByText(/Optional sync can be enabled later/)).toBeInTheDocument();
    rerender(<CheckoutContactAndShippingScreen {...props} report={reportWith({ syncHelperLabel: undefined })} />);
    expect(screen.queryByText(/Optional sync can be enabled later/)).not.toBeInTheDocument();
  });
});

describe("validation and error precedence", () => {
  it("renders all blank required-field errors, prevents host continuation, and focuses the first field", () => {
    const onContinue = vi.fn();
    renderScreen({ onContinue, report: reportWith({ initialSavedAddressId: undefined }) });
    fireEvent.click(continueButton());
    expect(screen.getByText("Enter your full name.")).toHaveAttribute("role", "alert");
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your phone number.")).toBeInTheDocument();
    expect(screen.getByText("Enter your delivery address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your city.")).toBeInTheDocument();
    expect(screen.getByText("Enter your state, province, or region.")).toBeInTheDocument();
    expect(screen.getByText("Enter your postal code.")).toBeInTheDocument();
    expect(screen.getByText("Select your country or region.")).toBeInTheDocument();
    expect(screen.getByLabelText(copy.fullName)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(copy.fullName)).toHaveFocus();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it.each([
    ["email", "bad", "Enter a valid email address."],
    ["phone", "12", "Enter a valid phone number."],
    ["phone", "1234567890123456", "Enter a valid phone number."],
  ])("validates %s value %s", (field, value, message) => {
    renderScreen({ report: reportWith({ initialSavedAddressId: undefined }) });
    fireEvent.change(screen.getByLabelText(field === "email" ? copy.email : copy.phone), { target: { value } });
    fireEvent.click(continueButton());
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("allows optional postal code submission", () => {
    const onContinue = vi.fn();
    renderScreen({ onContinue, report: reportWith({ postalCodeRequired: false, initialSavedAddressId: undefined }) });
    fillValidDraft();
    fireEvent.change(screen.getByLabelText(copy.postalCodeOptional), { target: { value: "" } });
    fireEvent.click(continueButton());
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("editing a field clears local error", () => {
    renderScreen({ report: reportWith({ initialSavedAddressId: undefined }) });
    fireEvent.click(continueButton());
    fireEvent.change(screen.getByLabelText(copy.fullName), { target: { value: "Noor" } });
    expect(screen.queryByText("Enter your full name.")).not.toBeInTheDocument();
  });

  it("host error overrides local error and editing dismisses it locally", () => {
    renderScreen({ report: reportWith({ initialSavedAddressId: undefined, hostFieldErrors: { email: "Host says this email is already used." } }) });
    fireEvent.click(continueButton());
    expect(screen.getByText("Host says this email is already used.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(copy.email), { target: { value: "fresh@example.com" } });
    expect(screen.queryByText("Host says this email is already used.")).not.toBeInTheDocument();
  });

  it("renders a different new host error for the same email field after rerender", () => {
    const { props, rerender } = renderScreen({
      report: reportWith({
        initialSavedAddressId: undefined,
        hostFieldErrors: { email: "Host says this email is already used." },
      }),
    });
    fireEvent.change(screen.getByLabelText(copy.email), {
      target: { value: "fresh@example.com" },
    });
    expect(
      screen.queryByText("Host says this email is already used."),
    ).not.toBeInTheDocument();

    rerender(
      <CheckoutContactAndShippingScreen
        {...props}
        report={reportWith({
          initialSavedAddressId: undefined,
          hostFieldErrors: { email: "Host now says this address cannot be used." },
        })}
      />,
    );

    expect(
      screen.getByText("Host now says this address cannot be used."),
    ).toBeInTheDocument();
  });

  it("resets dismissed host-error values when checkout-session ID changes", () => {
    const { props, rerender } = renderScreen({
      report: reportWith({
        initialSavedAddressId: undefined,
        hostFieldErrors: { email: "Host says this email is already used." },
      }),
    });
    fireEvent.change(screen.getByLabelText(copy.email), {
      target: { value: "fresh@example.com" },
    });
    expect(
      screen.queryByText("Host says this email is already used."),
    ).not.toBeInTheDocument();

    rerender(
      <CheckoutContactAndShippingScreen
        {...props}
        report={reportWith({
          checkoutSessionId: "checkout-session-2",
          initialSavedAddressId: undefined,
          hostFieldErrors: { email: "Host says this email is already used." },
        })}
      />,
    );

    expect(
      screen.getByText("Host says this email is already used."),
    ).toBeInTheDocument();
  });

  it("blocks a saved address with a removed country code until a valid option is selected", () => {
    const onContinue = vi.fn();
    renderScreen({
      onContinue,
      report: reportWith({
        savedAddresses: [
          {
            id: "legacy",
            label: "Legacy address",
            draft: { ...validDraft, countryCode: "REMOVED" },
            displayLines: ["21 Palm Street", "Dubai, Dubai"],
          },
        ],
        initialSavedAddressId: "legacy",
      }),
    });

    fireEvent.click(continueButton());
    expect(screen.getByText("Select your country or region.")).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(copy.country), {
      target: { value: "AE" },
    });
    fireEvent.click(continueButton());
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("renders static form error without buttons", () => {
    renderScreen({ report: reportWith({ formError: "Please review your delivery details." }) });
    const alert = screen.getByText("Please review your delivery details.");
    expect(alert).toHaveAttribute("role", "alert");
    expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("submission and session reset", () => {
  it("submits a valid semantic form exactly once", () => {
    const onContinue = vi.fn();
    renderScreen({ onContinue });

    const form = document.getElementById(
      "checkout-contact-and-shipping-form",
    );

    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("submits a trimmed draft with session ID, saveOnDevice, and no saved ID in new mode", () => {
    const onContinue = vi.fn();
    renderScreen({ onContinue });
    fillValidDraft();
    fireEvent.click(continueButton());
    expect(onContinue).toHaveBeenCalledWith({
      checkoutSessionId: "checkout-session-1",
      selectedSavedAddressId: undefined,
      draft: {
        fullName: "Noor Ali",
        email: "noor@example.com",
        phone: "+971 55 555 5555",
        addressLine1: "9 Garden Road",
        addressLine2: "Flat 3",
        city: "Abu Dhabi",
        region: "Abu Dhabi",
        postalCode: "12345",
        countryCode: "AE",
        saveOnDevice: false,
      },
    });
  });

  it("includes selected saved address ID", () => {
    const onContinue = vi.fn();
    renderScreen({ onContinue });
    fireEvent.click(continueButton());
    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ selectedSavedAddressId: "home" }));
  });

  it("shows pending continuation, prevents duplicates, disables controls, and preserves draft after rejection", async () => {
    const pending = deferred();
    const onContinue = vi.fn(() => pending.promise);
    renderScreen({ onContinue });
    fillValidDraft();
    fireEvent.click(continueButton());
    expect(screen.getByRole("button", { name: copy.savingDetails })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: copy.savingDetails }));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(copy.fullName)).toBeDisabled();
    pending.reject(new Error("continue failed"));
    await screen.findByText(copy.continueError);
    expect(screen.getByLabelText(copy.fullName)).toHaveValue("  Noor Ali  ");
  });

  it("switches to new-address metadata when the selected saved address is removed in the same session", () => {
    const { props, rerender } = renderScreen();
    fireEvent.change(screen.getByLabelText(copy.fullName), {
      target: { value: "Typed after saved selection" },
    });

    rerender(
      <CheckoutContactAndShippingScreen
        {...props}
        report={reportWith({
          savedAddresses: reportWith().savedAddresses.filter(
            (address) => address.id !== "home",
          ),
        })}
      />,
    );

    expect(
      screen.getByRole("radio", { name: copy.useDifferentAddress }),
    ).toBeChecked();
  });

  it("preserves the typed draft when the selected saved address is removed in the same session", () => {
    const { props, rerender } = renderScreen();
    fireEvent.change(screen.getByLabelText(copy.fullName), {
      target: { value: "Typed after saved selection" },
    });

    rerender(
      <CheckoutContactAndShippingScreen
        {...props}
        report={reportWith({
          savedAddresses: reportWith().savedAddresses.filter(
            (address) => address.id !== "home",
          ),
        })}
      />,
    );

    expect(screen.getByLabelText(copy.fullName)).toHaveValue(
      "Typed after saved selection",
    );
  });

  it("omits a stale saved-address ID after same-session removal", () => {
    const onContinue = vi.fn();
    const { props, rerender } = renderScreen({ onContinue });

    rerender(
      <CheckoutContactAndShippingScreen
        {...props}
        onContinue={onContinue}
        report={reportWith({
          savedAddresses: reportWith().savedAddresses.filter(
            (address) => address.id !== "home",
          ),
        })}
      />,
    );

    fireEvent.click(continueButton());
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ selectedSavedAddressId: undefined }),
    );
  });

  it("blocks keyboard form submission when continuation is disabled without adding validation errors or calling the host", () => {
    const onContinue = vi.fn();
    renderScreen({
      canContinue: false,
      onContinue,
      report: reportWith({ initialSavedAddressId: undefined }),
    });

    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(screen.queryByText("Enter your full name.")).not.toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("keeps offline form entry enabled unless host blocks continuation", () => {
    const { rerender, props } = renderScreen({ isOffline: true });
    expect(screen.getByRole("button", { name: copy.continueToReview })).toBeEnabled();
    rerender(<CheckoutContactAndShippingScreen {...props} canContinue={false} isOffline />);
    expect(screen.getByRole("button", { name: copy.reconnectToContinue })).toBeDisabled();
    rerender(<CheckoutContactAndShippingScreen {...props} canContinue={false} isOffline={false} />);
    expect(screen.getByRole("button", { name: copy.checkoutUnavailable })).toBeDisabled();
  });

  it("resets address, draft, and local errors when checkout-session ID changes", () => {
    const { rerender, props } = renderScreen({ report: reportWith({ initialSavedAddressId: undefined }) });
    fireEvent.change(screen.getByLabelText(copy.fullName), { target: { value: "Typed Name" } });
    fireEvent.click(continueButton());
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    rerender(<CheckoutContactAndShippingScreen {...props} report={reportWith({ checkoutSessionId: "checkout-session-2", initialSavedAddressId: "office" })} />);
    expect(screen.getByRole("radio", { name: /Office/ })).toBeChecked();
    expect(screen.getByLabelText(copy.fullName)).toHaveValue("Amara at Work");
    expect(screen.queryByText("Enter your email address.")).not.toBeInTheDocument();
  });

  it("does not reset typed draft merely because host error changes", () => {
    const { rerender, props } = renderScreen({ report: reportWith({ initialSavedAddressId: undefined }) });
    fireEvent.change(screen.getByLabelText(copy.fullName), { target: { value: "Typed Name" } });
    rerender(<CheckoutContactAndShippingScreen {...props} report={reportWith({ initialSavedAddressId: undefined, formError: "Host error changed" })} />);
    expect(screen.getByLabelText(copy.fullName)).toHaveValue("Typed Name");
  });
});

describe("navigation and toast positioning", () => {
  it("invokes top-bar and footer Back callbacks", () => {
    const onBack = vi.fn();
    renderScreen({ onBack });
    fireEvent.click(screen.getByRole("button", { name: copy.back }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows Back failure toast above footer in ready state", async () => {
    renderScreen({ onBack: vi.fn(() => Promise.reject(new Error("back"))) });
    fireEvent.click(screen.getByRole("button", { name: copy.back }));
    const toast = await screen.findByTestId("toast-region");
    expect(toast).toHaveTextContent(copy.backError);
    expect(toast).toHaveClass("bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_160px)]");
  });

  it("uses bottom safe-area toast placement for error retry failure", async () => {
    renderScreen({ state: "error", report: null, onRetryLoad: vi.fn(() => Promise.reject(new Error("retry"))) });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    const toast = await screen.findByTestId("toast-region");
    expect(toast).toHaveTextContent(copy.retryError);
    expect(toast).toHaveClass("bottom-[max(24px,env(safe-area-inset-bottom))]");
  });
});

describe("architecture boundary", () => {
  it("renders no restricted checkout, account, promo, media, or navigation UI", () => {
    renderScreen();
    expect(document.querySelector("a")).not.toBeInTheDocument();
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument();
    expect(document.querySelector("video")).not.toBeInTheDocument();
    expect(document.querySelector('input[name="promo-code"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/card number|cvv|expiry|apple pay|google pay|promo code/i)).not.toBeInTheDocument();
  });

  it("does not invoke browser persistence, network, media, geolocation, or IndexedDB APIs", () => {
    const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
    const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    const originalFetch = Object.getOwnPropertyDescriptor(window, "fetch");
    const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB");
    const originalSetItem = Storage.prototype.setItem;
    const getUserMedia = vi.fn();
    const getCurrentPosition = vi.fn();
    const fetchSpy = vi.fn();
    const indexedDbOpen = vi.fn();
    const setItem = vi.fn();

    try {
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
      Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
      Object.defineProperty(window, "fetch", { configurable: true, value: fetchSpy });
      Object.defineProperty(window, "indexedDB", { configurable: true, value: { open: indexedDbOpen } });
      Storage.prototype.setItem = setItem;
      renderScreen();
      expect(getUserMedia).not.toHaveBeenCalled();
      expect(getCurrentPosition).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(indexedDbOpen).not.toHaveBeenCalled();
      expect(setItem).not.toHaveBeenCalled();
    } finally {
      Storage.prototype.setItem = originalSetItem;
      if (originalMediaDevices) Object.defineProperty(navigator, "mediaDevices", originalMediaDevices);
      else delete (navigator as { mediaDevices?: unknown }).mediaDevices;
      if (originalGeolocation) Object.defineProperty(navigator, "geolocation", originalGeolocation);
      else delete (navigator as { geolocation?: unknown }).geolocation;
      if (originalFetch) Object.defineProperty(window, "fetch", originalFetch);
      else delete (window as { fetch?: unknown }).fetch;
      if (originalIndexedDb) Object.defineProperty(window, "indexedDB", originalIndexedDb);
      else delete (window as { indexedDB?: unknown }).indexedDB;
    }
  });

  it("contains no restricted checkout copy or bottom navigation", () => {
    renderScreen();
    const component = document.body.textContent?.toLowerCase() ?? "";
    expect(component).not.toContain("affiliate");
    expect(component).not.toContain("marketplace");
    expect(component).not.toContain("diagnosis");
    expect(document.querySelector("nav")).not.toBeInTheDocument();
  });
});
