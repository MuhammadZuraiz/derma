import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type CheckoutContactAndShippingState =
  | "loading"
  | "ready"
  | "error";

export type CheckoutContactAndShippingOperation =
  | "back"
  | "continue"
  | "retry-load"
  | null;

export type CheckoutAddressMode = "saved" | "new";

export type CheckoutFieldName =
  | "fullName"
  | "email"
  | "phone"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "region"
  | "postalCode"
  | "countryCode";

export interface CheckoutContactAndShippingDraft {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  saveOnDevice: boolean;
}

export type CheckoutFieldErrors = Partial<
  Record<CheckoutFieldName, string>
>;

export interface SavedCheckoutAddress {
  id: string;
  label: string;
  draft: CheckoutContactAndShippingDraft;
  displayLines: string[];
  contactLabel?: string;
}

export interface CheckoutCountryOption {
  code: string;
  label: string;
}

export interface CheckoutDetailsCartSummary {
  itemCount: number;
  subtotalLabel?: string;
}

export interface CheckoutContactAndShippingReport {
  checkoutSessionId: string;
  profileName?: string;
  savedAddresses: SavedCheckoutAddress[];
  defaultDraft: CheckoutContactAndShippingDraft;
  initialSavedAddressId?: string;
  countryOptions: CheckoutCountryOption[];
  postalCodeRequired: boolean;
  cartSummary: CheckoutDetailsCartSummary;
  syncHelperLabel?: string;
  hostFieldErrors?: CheckoutFieldErrors;
  formError?: string;
}

export interface CheckoutContactAndShippingSubmission {
  checkoutSessionId: string;
  selectedSavedAddressId?: string;
  draft: CheckoutContactAndShippingDraft;
}

export interface CheckoutContactAndShippingScreenProps {
  state?: CheckoutContactAndShippingState;
  report?: CheckoutContactAndShippingReport | null;
  isOffline?: boolean;
  canContinue?: boolean;
  onBack: () => void | Promise<void>;
  onContinue: (
    submission: CheckoutContactAndShippingSubmission,
  ) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export function normaliseNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

export function formatCartItemCount(value: number): string {
  const count = normaliseNonNegativeInteger(value);
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function trimCheckoutDraft(
  draft: CheckoutContactAndShippingDraft,
): CheckoutContactAndShippingDraft {
  return {
    ...draft,
    fullName: draft.fullName.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    addressLine1: draft.addressLine1.trim(),
    addressLine2: draft.addressLine2.trim(),
    city: draft.city.trim(),
    region: draft.region.trim(),
    postalCode: draft.postalCode.trim(),
    countryCode: draft.countryCode.trim(),
  };
}

export function validateCheckoutDraft({
  countryOptions,
  draft,
  postalCodeRequired,
}: {
  countryOptions: CheckoutCountryOption[];
  draft: CheckoutContactAndShippingDraft;
  postalCodeRequired: boolean;
}): CheckoutFieldErrors {
  const value = trimCheckoutDraft(draft);
  const errors: CheckoutFieldErrors = {};
  const validCountryCode = countryOptions.some(
    (option) => option.code === value.countryCode,
  );

  if (!value.fullName) {
    errors.fullName = "Enter your full name.";
  }

  if (!value.email) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
    errors.email = "Enter a valid email address.";
  }

  const phoneDigits = value.phone.replace(/\D/g, "");
  if (!value.phone) {
    errors.phone = "Enter your phone number.";
  } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!value.addressLine1) {
    errors.addressLine1 = "Enter your delivery address.";
  }

  if (!value.city) {
    errors.city = "Enter your city.";
  }

  if (!value.region) {
    errors.region = "Enter your state, province, or region.";
  }

  if (postalCodeRequired && !value.postalCode) {
    errors.postalCode = "Enter your postal code.";
  }

  if (!value.countryCode || !validCountryCode) {
    errors.countryCode = "Select your country or region.";
  }

  return errors;
}

export function getInitialSavedAddressId(
  report: CheckoutContactAndShippingReport,
): string | null {
  if (
    report.initialSavedAddressId &&
    report.savedAddresses.some(
      (address) => address.id === report.initialSavedAddressId,
    )
  ) {
    return report.initialSavedAddressId;
  }

  return null;
}

export function getInitialDraft(
  report: CheckoutContactAndShippingReport,
): CheckoutContactAndShippingDraft {
  const savedAddressId = getInitialSavedAddressId(report);

  return (
    report.savedAddresses.find((address) => address.id === savedAddressId)
      ?.draft ?? report.defaultDraft
  );
}

export const copy = {
  contextLabel: "CHECKOUT DETAILS",
  back: "Back",
  backToCart: "Back to cart",
  secureCheckout: "Secure checkout",
  heading: "Where should we deliver your order?",
  supporting:
    "Add your contact and delivery details. You will review your order before continuing to secure payment.",
  guestCheckout: "You can complete checkout without creating an account.",
  cartSummary: "Cart summary",
  editCart: "Edit cart",
  savedAddressesHeading: "Saved delivery details",
  useDifferentAddress: "Use a different address",
  contactHeading: "Contact details",
  fullName: "Full name",
  email: "Email address",
  phone: "Phone number",
  deliveryHeading: "Delivery address",
  addressLine1: "Address line 1",
  addressLine2: "Address line 2 (optional)",
  city: "City",
  region: "State, province, or region",
  postalCode: "Postal code",
  postalCodeOptional: "Postal code (optional)",
  country: "Country or region",
  selectCountry: "Select your country or region",
  saveOnDevice: "Save these details on this device for faster checkout",
  privacyAndPayment:
    "Your delivery details are used to prepare this order. Payment details are entered later through the secure payment step.",
  continueToReview: "Continue to review",
  savingDetails: "Saving details…",
  reconnectToContinue: "Reconnect to continue",
  checkoutUnavailable: "Checkout unavailable right now",
  loadingHeading: "Loading checkout details…",
  loadingSupporting: "We are preparing your saved delivery options.",
  errorHeading: "We could not display checkout details",
  errorSupporting: "Try loading checkout details again or return to your cart.",
  retry: "Try loading again",
  retrying: "Retrying…",
  backError: "We could not return to your cart. Please try again.",
  continueError:
    "We could not save your delivery details. Review the form and try again.",
  retryError: "We could not reload checkout details. Please try again.",
} as const;

export const colors = {
  page: "#FAF7F2",
  surface: "#FFFFFF",
  surfaceSoft: "#F5F0E8",
  parchment: "#EDE6D9",
  blush: "#F2D9CC",
  blushStrong: "#E8C4B0",
  peach: "#E8A98A",
  peachStrong: "#D4866A",
  sand: "#C9B8A4",
  stone: "#A89585",
  dusk: "#8C7B72",
  bark: "#5C4A42",
  barkHover: "#493A34",
  textPrimary: "#3A2E28",
  textSecondary: "#6B5650",
  borderSubtle: "#E4D8CE",
  warningText: "#7A5700",
  warningSurface: "#FDF5E4",
  errorText: "#A33D2A",
  errorSurface: "#FBEEE6",
} as const;

export const fonts = {
  display: '"DM Serif Display", Georgia, serif',
  ui: '"DM Sans", system-ui, sans-serif',
  metadata: '"Space Mono", monospace',
} as const;

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

const checkoutDetailsFormId =
  "checkout-contact-and-shipping-form";

const themeStyle = {
  "--dl-page": colors.page,
  "--dl-surface": colors.surface,
  "--dl-surface-soft": colors.surfaceSoft,
  "--dl-parchment": colors.parchment,
  "--dl-blush": colors.blush,
  "--dl-blush-strong": colors.blushStrong,
  "--dl-peach": colors.peach,
  "--dl-peach-strong": colors.peachStrong,
  "--dl-sand": colors.sand,
  "--dl-stone": colors.stone,
  "--dl-dusk": colors.dusk,
  "--dl-bark": colors.bark,
  "--dl-bark-hover": colors.barkHover,
  "--dl-text-primary": colors.textPrimary,
  "--dl-text-secondary": colors.textSecondary,
  "--dl-border-subtle": colors.borderSubtle,
  "--dl-warning-text": colors.warningText,
  "--dl-warning-surface": colors.warningSurface,
  "--dl-error-text": colors.errorText,
  "--dl-error-surface": colors.errorSurface,
  "--dl-ui": fonts.ui,
  "--dl-display": fonts.display,
  "--dl-metadata": fonts.metadata,
} as CSSProperties;

type IconProps = { className?: string };

function ArrowLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m14.5 6-6 6 6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 3.5 19 6v5.5c0 4-2.7 7.4-7 9-4.3-1.6-7-5-7-9V6l7-2.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function LockIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
      <path d="M8.5 10V7.5a3.5 3.5 0 1 1 7 0V10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function WarningIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 4 21 20H3L12 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M12 9v5m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function InfoIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.5v5m0-8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function Spinner({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={`animate-spin motion-reduce:animate-none ${className}`} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity=".25" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function ToastRegion({
  aboveStickyFooter,
  message,
}: {
  aboveStickyFooter: boolean;
  message: string | null;
}) {
  const positionClass = aboveStickyFooter
    ? "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_160px)]"
    : "bottom-[max(24px,env(safe-area-inset-bottom))]";

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 z-50 mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${positionClass} ${message ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      data-testid="toast-region"
      role="status"
      style={themeStyle}
    >
      {message ?? ""}
    </div>
  );
}

function CheckoutTopBar({
  disabled,
  onBack,
}: {
  disabled: boolean;
  onBack: () => void;
}) {
  return (
    <div className="grid min-h-12 grid-cols-[44px_1fr_44px] items-center gap-2">
      <button
        aria-label={copy.back}
        className={`${focusRing} flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={disabled}
        onClick={onBack}
        type="button"
      >
        <ArrowLeftIcon />
      </button>
      <p className="text-center font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </p>
      <span aria-hidden="true" className="block h-11 w-11" />
    </div>
  );
}

function CheckoutHeading() {
  return (
    <>
      <p className="mt-4 flex items-center gap-2 font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.1em] text-[var(--dl-peach-strong)]">
        <LockIcon className="h-4 w-4" />
        {copy.secureCheckout.toUpperCase()}
      </p>
      <h1 className="mt-3 max-w-[620px] font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">
        {copy.heading}
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
        {copy.supporting}
      </p>
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--dl-parchment)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
        <InfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
        <span>{copy.guestCheckout}</span>
      </p>
    </>
  );
}

function CartSummaryCard({
  disabled,
  onEditCart,
  summary,
}: {
  disabled: boolean;
  onEditCart: () => void;
  summary: CheckoutDetailsCartSummary;
}) {
  const countLabel = formatCartItemCount(summary.itemCount);
  const value = summary.subtotalLabel?.trim()
    ? `${countLabel} · ${summary.subtotalLabel}`
    : countLabel;

  return (
    <section className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-blush)] p-4" aria-labelledby="checkout-cart-summary-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold leading-[22px] text-[var(--dl-text-primary)]" id="checkout-cart-summary-heading">
          {copy.cartSummary}
        </h2>
        <button
          className={`${focusRing} min-h-11 rounded-sm px-1 text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={disabled}
          onClick={onEditCart}
          type="button"
        >
          {copy.editCart}
        </button>
      </div>
      <p aria-live="polite" className="mt-2 text-sm font-semibold leading-5 text-[var(--dl-bark)]">
        {value}
      </p>
    </section>
  );
}

function PrivacyAndPaymentNote() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-[var(--dl-surface-soft)] p-3 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
      <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dl-peach-strong)]" />
      <span>{copy.privacyAndPayment}</span>
    </p>
  );
}

function SavedAddressSelector({
  addressMode,
  disabled,
  onSelectAddress,
  onSelectNew,
  report,
  selectedSavedAddressId,
}: {
  addressMode: CheckoutAddressMode;
  disabled: boolean;
  onSelectAddress: (address: SavedCheckoutAddress) => void;
  onSelectNew: () => void;
  report: CheckoutContactAndShippingReport;
  selectedSavedAddressId: string | null;
}) {
  if (report.savedAddresses.length === 0) {
    return null;
  }

  return (
    <fieldset className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
      <legend className="px-1 text-[17px] font-semibold leading-6 text-[var(--dl-text-primary)]">
        {copy.savedAddressesHeading}
      </legend>
      <div className="mt-2 space-y-2">
        {report.savedAddresses.map((address) => (
          <label
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--dl-border-subtle)] p-3 has-[:checked]:border-[var(--dl-peach-strong)] has-[:checked]:bg-[var(--dl-blush)] has-[:disabled]:cursor-not-allowed"
            key={address.id}
          >
            <input
              checked={addressMode === "saved" && selectedSavedAddressId === address.id}
              className="mt-1 h-5 w-5 accent-[var(--dl-bark)]"
              disabled={disabled}
              name="saved-address"
              onChange={() => {
                if (!disabled) {
                  onSelectAddress(address);
                }
              }}
              type="radio"
              value={address.id}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">
                {address.label}
              </span>
              {address.displayLines.map((line, index) => (
                <span className="block text-[13px] leading-[18px] text-[var(--dl-text-secondary)]" key={`${address.id}-line-${index}`}>
                  {line}
                </span>
              ))}
              {address.contactLabel ? (
                <span className="mt-1 block text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
                  {address.contactLabel}
                </span>
              ) : null}
            </span>
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--dl-border-subtle)] p-3 has-[:checked]:border-[var(--dl-peach-strong)] has-[:checked]:bg-[var(--dl-blush)] has-[:disabled]:cursor-not-allowed">
          <input
            checked={addressMode === "new"}
            className="h-5 w-5 accent-[var(--dl-bark)]"
            disabled={disabled}
            name="saved-address"
            onChange={() => {
              if (!disabled) {
                onSelectNew();
              }
            }}
            type="radio"
            value="new"
          />
          <span className="text-sm font-semibold leading-5 text-[var(--dl-text-primary)]">
            {copy.useDifferentAddress}
          </span>
        </label>
      </div>
    </fieldset>
  );
}

const fieldIds: Record<CheckoutFieldName, string> = {
  fullName: "checkout-full-name",
  email: "checkout-email",
  phone: "checkout-phone",
  addressLine1: "checkout-address-line-1",
  addressLine2: "checkout-address-line-2",
  city: "checkout-city",
  region: "checkout-region",
  postalCode: "checkout-postal-code",
  countryCode: "checkout-country-code",
};

const validationOrder: CheckoutFieldName[] = [
  "fullName",
  "email",
  "phone",
  "addressLine1",
  "city",
  "region",
  "postalCode",
  "countryCode",
];

function FieldError({ error, field }: { error?: string; field: CheckoutFieldName }) {
  if (!error) {
    return null;
  }

  return (
    <p className="mt-1.5 text-sm leading-5 text-[var(--dl-error-text)]" id={`${fieldIds[field]}-error`} role="alert">
      {error}
    </p>
  );
}

function FormInput({
  autoComplete,
  disabled,
  error,
  field,
  inputMode,
  label,
  onChange,
  type = "text",
  value,
}: {
  autoComplete: string;
  disabled: boolean;
  error?: string;
  field: Exclude<CheckoutFieldName, "countryCode">;
  inputMode?: "email" | "tel" | "text";
  label: string;
  onChange: (field: CheckoutFieldName, value: string) => void;
  type?: "email" | "tel" | "text";
  value: string;
}) {
  const id = fieldIds[field];
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label className="block text-sm font-semibold leading-5 text-[var(--dl-text-primary)]" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={`${focusRing} mt-1.5 min-h-12 w-full rounded-xl border bg-[var(--dl-surface)] px-3.5 text-base leading-6 text-[var(--dl-text-primary)] placeholder:text-[var(--dl-stone)] disabled:cursor-not-allowed disabled:bg-[var(--dl-surface-soft)] ${error ? "border-[var(--dl-error-text)]" : "border-[var(--dl-border-subtle)]"}`}
        disabled={disabled}
        id={id}
        inputMode={inputMode}
        name={field}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(field, event.currentTarget.value)}
        type={type}
        value={value}
      />
      <FieldError error={error} field={field} />
    </div>
  );
}

function CountrySelect({
  disabled,
  error,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  error?: string;
  onChange: (field: CheckoutFieldName, value: string) => void;
  options: CheckoutCountryOption[];
  value: string;
}) {
  const field: CheckoutFieldName = "countryCode";
  const id = fieldIds[field];
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label className="block text-sm font-semibold leading-5 text-[var(--dl-text-primary)]" htmlFor={id}>
        {copy.country}
      </label>
      <select
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        autoComplete="country"
        className={`${focusRing} mt-1.5 min-h-12 w-full rounded-xl border bg-[var(--dl-surface)] px-3.5 text-base leading-6 text-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-surface-soft)] ${error ? "border-[var(--dl-error-text)]" : "border-[var(--dl-border-subtle)]"}`}
        disabled={disabled}
        id={id}
        name={field}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(field, event.currentTarget.value)}
        value={value}
      >
        <option value="">{copy.selectCountry}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError error={error} field={field} />
    </div>
  );
}

function CheckoutForm({
  disabled,
  displayErrors,
  draft,
  onChange,
  onSaveOnDeviceChange,
  report,
}: {
  disabled: boolean;
  displayErrors: CheckoutFieldErrors;
  draft: CheckoutContactAndShippingDraft;
  onChange: (field: CheckoutFieldName, value: string) => void;
  onSaveOnDeviceChange: (checked: boolean) => void;
  report: CheckoutContactAndShippingReport;
}) {
  return (
    <div className="space-y-4">
      <fieldset className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
        <legend className="px-1 text-[17px] font-semibold leading-6 text-[var(--dl-text-primary)]">
          {copy.contactHeading}
        </legend>
        <div className="mt-2 space-y-4">
          <FormInput autoComplete="name" disabled={disabled} error={displayErrors.fullName} field="fullName" label={copy.fullName} onChange={onChange} value={draft.fullName} />
          <FormInput autoComplete="email" disabled={disabled} error={displayErrors.email} field="email" inputMode="email" label={copy.email} onChange={onChange} type="email" value={draft.email} />
          <FormInput autoComplete="tel" disabled={disabled} error={displayErrors.phone} field="phone" inputMode="tel" label={copy.phone} onChange={onChange} type="tel" value={draft.phone} />
        </div>
      </fieldset>

      <fieldset className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4">
        <legend className="px-1 text-[17px] font-semibold leading-6 text-[var(--dl-text-primary)]">
          {copy.deliveryHeading}
        </legend>
        <div className="mt-2 space-y-4">
          <FormInput autoComplete="address-line1" disabled={disabled} error={displayErrors.addressLine1} field="addressLine1" label={copy.addressLine1} onChange={onChange} value={draft.addressLine1} />
          <FormInput autoComplete="address-line2" disabled={disabled} error={displayErrors.addressLine2} field="addressLine2" label={copy.addressLine2} onChange={onChange} value={draft.addressLine2} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput autoComplete="address-level2" disabled={disabled} error={displayErrors.city} field="city" label={copy.city} onChange={onChange} value={draft.city} />
            <FormInput autoComplete="address-level1" disabled={disabled} error={displayErrors.region} field="region" label={copy.region} onChange={onChange} value={draft.region} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput autoComplete="postal-code" disabled={disabled} error={displayErrors.postalCode} field="postalCode" label={report.postalCodeRequired ? copy.postalCode : copy.postalCodeOptional} onChange={onChange} value={draft.postalCode} />
            <CountrySelect disabled={disabled} error={displayErrors.countryCode} onChange={onChange} options={report.countryOptions} value={draft.countryCode} />
          </div>
        </div>
      </fieldset>

      <div className="rounded-xl bg-[var(--dl-surface-soft)] p-3">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--dl-text-primary)] has-[:disabled]:cursor-not-allowed">
          <input
            checked={draft.saveOnDevice}
            className="mt-0.5 h-5 w-5 accent-[var(--dl-bark)]"
            disabled={disabled}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSaveOnDeviceChange(event.currentTarget.checked)}
            type="checkbox"
          />
          <span>{copy.saveOnDevice}</span>
        </label>
        {report.syncHelperLabel?.trim() ? (
          <p className="ml-8 mt-1 text-[13px] leading-[18px] text-[var(--dl-text-secondary)]">
            {report.syncHelperLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function getContinueLabel({
  activeOperation,
  canContinue,
  isOffline,
}: {
  activeOperation: CheckoutContactAndShippingOperation;
  canContinue: boolean;
  isOffline: boolean;
}): string {
  if (activeOperation === "continue") {
    return copy.savingDetails;
  }

  if (!canContinue) {
    return isOffline ? copy.reconnectToContinue : copy.checkoutUnavailable;
  }

  return copy.continueToReview;
}

function CheckoutFooter({
  activeOperation,
  canContinue,
  disabled,
  isOffline,
  formId,
  onBack,
  onContinue,
  subtotalLabel,
  continueLabelOverride,
}: {
  activeOperation: CheckoutContactAndShippingOperation;
  canContinue: boolean;
  disabled: boolean;
  isOffline: boolean;
  formId?: string;
  onBack: () => void;
  onContinue: () => void;
  subtotalLabel?: string;
  continueLabelOverride?: string;
}) {
  return (
    <footer className="sticky bottom-0 z-30 -mx-6 mt-5 border-t border-[var(--dl-border-subtle)] bg-[rgba(250,247,242,0.97)] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[8px] max-[374px]:-mx-5 max-[374px]:px-5 lg:mx-0 lg:rounded-t-2xl lg:border-x">
      {subtotalLabel?.trim() ? (
        <p className="mb-2 text-center text-sm font-semibold leading-5 text-[var(--dl-bark)]">
          {subtotalLabel}
        </p>
      ) : null}
      <button
        className={`${focusRing} flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] active:bg-[var(--dl-text-primary)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
        disabled={disabled || !canContinue}
        form={formId}
        onClick={formId ? undefined : onContinue}
        type={formId ? "submit" : "button"}
      >
        {activeOperation === "continue" ? <Spinner className="mr-2 h-4 w-4" /> : null}
        {continueLabelOverride ?? getContinueLabel({ activeOperation, canContinue, isOffline })}
      </button>
      <button
        className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={disabled}
        onClick={onBack}
        type="button"
      >
        {copy.backToCart}
      </button>
    </footer>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--dl-parchment)] motion-reduce:animate-none ${className}`} />;
}

function LoadingExperience({
  disabled,
  onBack,
}: {
  disabled: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <CheckoutTopBar disabled={disabled} onBack={onBack} />
      <div aria-live="polite" className="mt-6" role="status">
        <h1 className="font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">
          {copy.loadingHeading}
        </h1>
        <p className="mt-2 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
          {copy.loadingSupporting}
        </p>
      </div>
      <div className="mt-5 space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-28" />
        <Skeleton className="h-56" />
        <Skeleton className="h-72" />
      </div>
      <CheckoutFooter activeOperation={null} canContinue={false} continueLabelOverride={copy.continueToReview} disabled isOffline={false} onBack={onBack} onContinue={() => undefined} />
    </>
  );
}

function RecoveryExperience({
  activeOperation,
  disabled,
  onBack,
  onRetry,
}: {
  activeOperation: CheckoutContactAndShippingOperation;
  disabled: boolean;
  onBack: () => void;
  onRetry?: () => void;
}) {
  const retrying = activeOperation === "retry-load";

  return (
    <>
      <CheckoutTopBar disabled={disabled} onBack={onBack} />
      <div className="mx-auto mt-12 max-w-[520px] text-center" role="alert">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-peach-strong)]">
          <WarningIcon className="h-9 w-9" />
        </div>
        <h1 className="mt-5 font-[family-name:var(--dl-display)] text-[36px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[33px] max-[374px]:leading-[37px]">
          {copy.errorHeading}
        </h1>
        <p className="mt-2 text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
          {copy.errorSupporting}
        </p>
      </div>
      <div className="mx-auto mt-6 max-w-[440px]">
        {onRetry ? (
          <button
            className={`${focusRing} flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--dl-bark)] px-6 text-base font-semibold leading-5 text-white disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
            disabled={disabled}
            onClick={onRetry}
            type="button"
          >
            {retrying ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {retrying ? copy.retrying : copy.retry}
          </button>
        ) : null}
        <button
          className={`${focusRing} mt-2 min-h-11 w-full rounded-sm text-sm font-semibold leading-5 text-[var(--dl-bark)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={disabled}
          onClick={onBack}
          type="button"
        >
          {copy.backToCart}
        </button>
      </div>
    </>
  );
}

function ReadyExperience({
  activeOperation,
  canContinue,
  disabled,
  isOffline,
  onBack,
  onContinue,
  report,
}: {
  activeOperation: CheckoutContactAndShippingOperation;
  canContinue: boolean;
  disabled: boolean;
  isOffline: boolean;
  onBack: () => void;
  onContinue: (submission: CheckoutContactAndShippingSubmission) => void;
  report: CheckoutContactAndShippingReport;
}) {
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(() => getInitialSavedAddressId(report));
  const [addressMode, setAddressMode] = useState<CheckoutAddressMode>(() => (getInitialSavedAddressId(report) ? "saved" : "new"));
  const [draft, setDraft] = useState<CheckoutContactAndShippingDraft>(() => getInitialDraft(report));
  const [localErrors, setLocalErrors] = useState<CheckoutFieldErrors>({});
  const [dismissedHostErrorValues, setDismissedHostErrorValues] =
    useState<CheckoutFieldErrors>({});

  const fieldRefs = useRef<Partial<Record<CheckoutFieldName, HTMLElement | null>>>({});

  useEffect(() => {
    const initialSavedAddressId = getInitialSavedAddressId(report);
    setSelectedSavedAddressId(initialSavedAddressId);
    setAddressMode(initialSavedAddressId ? "saved" : "new");
    setDraft(getInitialDraft(report));
    setLocalErrors({});
    setDismissedHostErrorValues({});
  }, [report.checkoutSessionId]);

  const selectedSavedAddressExists =
    selectedSavedAddressId !== null &&
    report.savedAddresses.some(
      (address) => address.id === selectedSavedAddressId,
    );

  useEffect(() => {
    if (addressMode === "saved" && !selectedSavedAddressExists) {
      setAddressMode("new");
      setSelectedSavedAddressId(null);
    }
  }, [addressMode, selectedSavedAddressExists]);

  useEffect(() => {
    for (const field of Object.keys(fieldIds) as CheckoutFieldName[]) {
      fieldRefs.current[field] = document.getElementById(fieldIds[field]);
    }
  });

  const displayErrors = useMemo<CheckoutFieldErrors>(() => {
    const visibleHostErrors = Object.fromEntries(
      Object.entries(report.hostFieldErrors ?? {}).filter(
        ([field, message]) =>
          dismissedHostErrorValues[field as CheckoutFieldName] !==
          message,
      ),
    ) as CheckoutFieldErrors;

    return {
      ...localErrors,
      ...visibleHostErrors,
    };
  }, [dismissedHostErrorValues, localErrors, report.hostFieldErrors]);

  const clearErrorsForField = useCallback((field: CheckoutFieldName) => {
    setLocalErrors((current) => {
      if (!(field in current)) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
    setDismissedHostErrorValues((current) => {
      const activeHostError = report.hostFieldErrors?.[field];

      if (!activeHostError) {
        return current;
      }

      return {
        ...current,
        [field]: activeHostError,
      };
    });
  }, [report.hostFieldErrors]);

  const handleChange = useCallback((field: CheckoutFieldName, value: string) => {
    if (disabled) return;
    setDraft((current) => ({ ...current, [field]: value }));
    clearErrorsForField(field);
  }, [clearErrorsForField, disabled]);

  const handleSelectSavedAddress = useCallback((address: SavedCheckoutAddress) => {
    if (disabled) return;
    setAddressMode("saved");
    setSelectedSavedAddressId(address.id);
    setDraft(address.draft);
    setLocalErrors({});
    setDismissedHostErrorValues({});
  }, [disabled]);

  const handleSelectNewAddress = useCallback(() => {
    if (disabled) return;
    setAddressMode("new");
    setSelectedSavedAddressId(null);
    setDraft(report.defaultDraft);
    setLocalErrors({});
    setDismissedHostErrorValues({});
  }, [disabled, report.defaultDraft]);

  const handleSubmit = useCallback(() => {
    if (disabled || !canContinue) return;
    const errors = validateCheckoutDraft({
      countryOptions: report.countryOptions,
      draft,
      postalCodeRequired: report.postalCodeRequired,
    });
    const firstInvalid = validationOrder.find((field) => errors[field]);

    if (firstInvalid) {
      setLocalErrors(errors);
      window.requestAnimationFrame(() => {
        fieldRefs.current[firstInvalid]?.focus();
      });
      return;
    }

    onContinue({
      checkoutSessionId: report.checkoutSessionId,
      selectedSavedAddressId:
        addressMode === "saved" && selectedSavedAddressExists
          ? selectedSavedAddressId ?? undefined
          : undefined,
      draft: trimCheckoutDraft(draft),
    });
  }, [addressMode, canContinue, disabled, draft, onContinue, report.checkoutSessionId, report.countryOptions, report.postalCodeRequired, selectedSavedAddressExists, selectedSavedAddressId]);

  return (
    <>
      <CheckoutTopBar disabled={disabled} onBack={onBack} />
      <div className="lg:grid lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] lg:gap-x-12">
        <div className="lg:col-start-2 lg:row-start-1">
          <CheckoutHeading />
          <div className="mt-4">
            <CartSummaryCard disabled={disabled} onEditCart={onBack} summary={report.cartSummary} />
          </div>
          <div className="mt-3">
            <PrivacyAndPaymentNote />
          </div>
        </div>

        <form id={checkoutDetailsFormId} className="mt-5 space-y-4 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:mt-4" noValidate onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); handleSubmit(); }}>
          <SavedAddressSelector addressMode={addressMode} disabled={disabled} onSelectAddress={handleSelectSavedAddress} onSelectNew={handleSelectNewAddress} report={report} selectedSavedAddressId={selectedSavedAddressId} />
          <CheckoutForm
            disabled={disabled}
            displayErrors={displayErrors}
            draft={draft}
            onChange={handleChange}
            onSaveOnDeviceChange={(checked) => {
              if (!disabled) {
                setDraft((current) => ({ ...current, saveOnDevice: checked }));
              }
            }}
            report={report}
          />
          {report.formError?.trim() ? (
            <p className="rounded-xl bg-[var(--dl-error-surface)] p-3 text-sm leading-5 text-[var(--dl-error-text)]" role="alert">
              {report.formError}
            </p>
          ) : null}
        </form>

        <div className="lg:col-start-2 lg:row-start-2">
          <CheckoutFooter activeOperation={activeOperation} canContinue={canContinue} disabled={disabled} formId={checkoutDetailsFormId} isOffline={isOffline} onBack={onBack} onContinue={handleSubmit} subtotalLabel={report.cartSummary.subtotalLabel} />
        </div>
      </div>
    </>
  );
}

export default function CheckoutContactAndShippingScreen({
  state = "loading",
  report = null,
  isOffline = false,
  canContinue = true,
  onBack,
  onContinue,
  onRetryLoad,
}: CheckoutContactAndShippingScreenProps) {
  const [activeOperation, setActiveOperation] = useState<CheckoutContactAndShippingOperation>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef<CheckoutContactAndShippingOperation>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  const effectiveState: CheckoutContactAndShippingState =
    state === "ready" && report === null ? "error" : state;

  const hasRenderableCheckoutDetails = effectiveState === "ready" && report !== null;
  const hasStickyFooter = effectiveState === "loading" || hasRenderableCheckoutDetails;
  const operationPending = activeOperation !== null;

  const runOperation = useCallback(async (
    operation: Exclude<CheckoutContactAndShippingOperation, null>,
    callback: () => void | Promise<void>,
    errorMessage: string,
  ) => {
    if (inFlightRef.current !== null) return;
    inFlightRef.current = operation;
    setActiveOperation(operation);
    setToastMessage(null);
    try {
      await callback();
    } catch {
      if (mountedRef.current) {
        setToastMessage(errorMessage);
      }
    } finally {
      inFlightRef.current = null;
      if (mountedRef.current) {
        setActiveOperation(null);
      }
    }
  }, []);

  const handleBack = useCallback(() => {
    if (operationPending || inFlightRef.current !== null) return;
    void runOperation("back", onBack, copy.backError);
  }, [onBack, operationPending, runOperation]);

  const handleContinue = useCallback((submission: CheckoutContactAndShippingSubmission) => {
    if (operationPending || inFlightRef.current !== null || !canContinue) return;
    void runOperation("continue", () => onContinue(submission), copy.continueError);
  }, [canContinue, onContinue, operationPending, runOperation]);

  const handleRetry = useCallback(() => {
    if (!onRetryLoad || operationPending || inFlightRef.current !== null) return;
    void runOperation("retry-load", onRetryLoad, copy.retryError);
  }, [onRetryLoad, operationPending, runOperation]);

  return (
    <main className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]" style={themeStyle}>
      <div className="mx-auto min-h-[100dvh] max-w-[820px] px-6 pb-6 pt-[max(20px,env(safe-area-inset-top))] max-[374px]:px-5 lg:max-w-[1180px]">
        {effectiveState === "loading" ? (
          <LoadingExperience disabled={operationPending} onBack={handleBack} />
        ) : null}
        {effectiveState === "error" ? (
          <RecoveryExperience activeOperation={activeOperation} disabled={operationPending} onBack={handleBack} onRetry={onRetryLoad ? handleRetry : undefined} />
        ) : null}
        {hasRenderableCheckoutDetails && report ? (
          <ReadyExperience activeOperation={activeOperation} canContinue={canContinue} disabled={operationPending} isOffline={isOffline} onBack={handleBack} onContinue={handleContinue} report={report} />
        ) : null}
      </div>
      <ToastRegion aboveStickyFooter={hasStickyFooter} message={toastMessage} />
    </main>
  );
}
