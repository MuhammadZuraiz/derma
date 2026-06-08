"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type AccountAndOptionalSyncState =
  | "loading"
  | "ready"
  | "empty"
  | "error";

export type AccountAndOptionalSyncOperation =
  | "back"
  | "sign-in"
  | "sign-out"
  | "enable-sync"
  | "disable-sync"
  | "revoke-consent"
  | "delete-facial-data"
  | "retry-load"
  | null;

export type OptionalSyncAccountStatus =
  | "signed-out"
  | "signed-in";

export type OptionalSyncActionKind =
  | "enable"
  | "disable"
  | null;

export type OptionalSyncPrivacyActionKind =
  | "revoke-consent"
  | "delete-facial-data";

export interface AccountAndOptionalSyncProfile {
  profileId: string;
  displayName: string;
  storageStateLabel: string;
  storageSupporting?: string;
  syncAction?: OptionalSyncActionKind;
  syncActionLabel?: string;
  syncBlockedLabel?: string;
  canActivateSyncAction?: boolean;
  consentStateLabel?: string;
  facialDataStateLabel?: string;
  canRevokeConsent?: boolean;
  canRequestFacialDataDeletion?: boolean;
}

export interface AccountAndOptionalSyncReport {
  accountStatus: OptionalSyncAccountStatus;
  accountStatusLabel: string;
  accountSupporting?: string;
  accountDisplayLabel?: string;
  profiles: AccountAndOptionalSyncProfile[];
  helperLabel?: string;
  privacyLabel?: string;
}

export interface AccountAndOptionalSyncScreenProps {
  state?: AccountAndOptionalSyncState;
  report?: AccountAndOptionalSyncReport | null;
  isOffline?: boolean;
  canGoBack?: boolean;
  canRequestSignIn?: boolean;
  canRequestSignOut?: boolean;
  canManageProfileSync?: boolean;
  canRequestConsentRevocation?: boolean;
  canRequestFacialDataDeletion?: boolean;
  isSignInAvailableOffline?: boolean;
  isSignOutAvailableOffline?: boolean;
  isSyncAvailableOffline?: boolean;
  isPrivacyRequestAvailableOffline?: boolean;
  onBack: () => void | Promise<void>;
  onRequestSignIn?: () => void | Promise<void>;
  onRequestSignOut?: () => void | Promise<void>;
  onEnableProfileSync?: (
    profileId: string,
  ) => void | Promise<void>;
  onDisableProfileSync?: (
    profileId: string,
  ) => void | Promise<void>;
  onRevokeConsent?: (
    profileId: string,
  ) => void | Promise<void>;
  onRequestFacialDataDeletion?: (
    profileId: string,
  ) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

interface PendingPrivacyConfirmation {
  kind: OptionalSyncPrivacyActionKind;
  profileId: string;
  displayName: string;
}

export function isAccountAndOptionalSyncState(
  value: unknown,
): value is AccountAndOptionalSyncState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "empty" ||
    value === "error"
  );
}

export function isOptionalSyncAccountStatus(
  value: unknown,
): value is OptionalSyncAccountStatus {
  return (
    value === "signed-out" ||
    value === "signed-in"
  );
}

export function isOptionalSyncActionKind(
  value: unknown,
): value is Exclude<
  OptionalSyncActionKind,
  null
> {
  return (
    value === "enable" ||
    value === "disable"
  );
}

function isNonWhitespaceString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function getRecord(
  value: unknown,
): Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object"
  )
    ? value as Record<string, unknown>
    : {};
}

export function hasUsableAccountAndOptionalSyncReport(
  report:
    | AccountAndOptionalSyncReport
    | null
    | undefined,
): report is AccountAndOptionalSyncReport {
  return (
    report !== null &&
    report !== undefined &&
    isOptionalSyncAccountStatus(
      (report as { accountStatus?: unknown })
        .accountStatus,
    ) &&
    isNonWhitespaceString(
      (report as { accountStatusLabel?: unknown })
        .accountStatusLabel,
    ) &&
    Array.isArray(
      (report as { profiles?: unknown }).profiles,
    )
  );
}

export const copy = {
  wordmark: "DermaLens",
  contextLabel: "OPTIONAL SYNC",
  back: "Back",
  backBlocked: "Back unavailable",
  backPending: "Going back...",
  heading: "Account and optional sync",
  supporting:
    "Keep using local profiles without an account, or explicitly request cloud sync when it suits you.",
  trustHeading: "Local-first by design",
  trustCopy:
    "Your local profiles remain useful without signing in. Cloud sync is optional and never enabled automatically.",
  loadingHeading:
    "Preparing account and sync settings",
  loadingSupporting:
    "Your local profile settings are being prepared.",
  errorHeading:
    "We could not load account and sync settings",
  errorSupporting:
    "Try loading your local profile settings again.",
  emptyHeading: "No local profiles available",
  emptySupporting:
    "Create or restore a local profile before managing optional sync.",
  offline:
    "You appear to be offline. Supplied account and profile settings remain readable. The host controls which actions remain available.",
  accountCardHeading: "Account and sync",
  accountCardSubheading: "Cloud sync is optional",
  accountCardSupporting:
    "Your local profiles remain usable without an account.",
  signIn: "Sign in to manage sync",
  signInPending: "Opening sign-in...",
  signInBlocked: "Sign-in unavailable right now",
  signInReconnect: "Reconnect to sign in",
  signOut: "Sign out",
  signOutPending: "Signing out...",
  signOutBlocked: "Sign-out unavailable right now",
  signOutReconnect: "Reconnect to sign out",
  profileListHeading: "Profile sync settings",
  privacyHeading: "Privacy requests",
  unnamedProfile: "Unnamed profile",
  storageFallback: "Storage state unavailable",
  enableSync: "Enable sync",
  enableSyncPending: "Enabling sync...",
  disableSync: "Remove sync",
  disableSyncPending: "Removing sync...",
  syncBlocked: "Sync action unavailable",
  syncReconnect: "Reconnect to manage sync",
  requestConsent: "Request consent revocation",
  requestFacialData:
    "Request facial-data deletion",
  privacyBlocked: "Request unavailable right now",
  privacyReconnect:
    "Reconnect to submit this request",
  privacyPending: "Submitting request...",
  revokeDialogTitle: "Revoke facial-data consent?",
  revokeDialogSupporting:
    "The host controls consent revocation and any synced-data handling.",
  deletionDialogTitle:
    "Request saved facial-data deletion?",
  deletionDialogSupporting:
    "The host controls deletion execution and any saved or synced facial-data handling.",
  cancel: "Cancel",
  confirmRequest: "Confirm request",
  helperFallback:
    "Account and sync changes stay host-owned. This screen only sends explicit requests.",
  privacyFallback:
    "Local profile settings remain readable without signing in.",
  retryLoad: "Try again",
  retryPending: "Trying again...",
  toastLabel: "Account and sync notice",
  backError:
    "We could not go back. Please try again.",
  signInError:
    "We could not open sign-in. Please try again.",
  signOutError:
    "We could not sign out. Please try again.",
  enableSyncError:
    "We could not enable sync. Please try again.",
  disableSyncError:
    "We could not remove sync. Please try again.",
  privacyError:
    "We could not submit the privacy request. Please try again.",
  retryError:
    "We could not reload account and sync settings. Please try again.",
  accountSuccess: "Account request completed.",
  syncSuccess: "Sync request completed.",
  privacySuccess: "Privacy request completed.",
} as const;

const colors = {
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

const fonts = {
  display:
    '"DM Serif Display", Georgia, serif',
  ui:
    '"DM Sans", system-ui, sans-serif',
  metadata:
    '"Space Mono", monospace',
} as const;

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

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

type ProfileActionStatus = {
  enabled: boolean;
  label: string;
};

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m14.5 6-6 6 6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        opacity=".25"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function displayString(
  value: unknown,
): string | null {
  return isNonWhitespaceString(value)
    ? value.trim()
    : null;
}

function getSafeProfile(
  item: unknown,
) {
  const record = getRecord(item);
  const profileId = displayString(
    record.profileId,
  );
  const displayName =
    displayString(record.displayName) ??
    copy.unnamedProfile;
  const storageStateLabel =
    displayString(
      record.storageStateLabel,
    ) ?? copy.storageFallback;

  return {
    canActivateSyncAction:
      record.canActivateSyncAction,
    canRequestFacialDataDeletion:
      record.canRequestFacialDataDeletion,
    canRevokeConsent: record.canRevokeConsent,
    consentStateLabel: displayString(
      record.consentStateLabel,
    ),
    displayName,
    facialDataStateLabel: displayString(
      record.facialDataStateLabel,
    ),
    profileId,
    storageStateLabel,
    storageSupporting: displayString(
      record.storageSupporting,
    ),
    syncAction: isOptionalSyncActionKind(
      record.syncAction,
    )
      ? record.syncAction
      : null,
    syncActionLabel: displayString(
      record.syncActionLabel,
    ),
    syncBlockedLabel: displayString(
      record.syncBlockedLabel,
    ),
  };
}

function getUniqueProfileIds(
  profiles: unknown[],
): ReadonlySet<string> {
  const counts = new Map<string, number>();

  for (const item of profiles) {
    const profileId = displayString(
      getRecord(item).profileId,
    );

    if (profileId === null) {
      continue;
    }

    counts.set(
      profileId,
      (counts.get(profileId) ?? 0) + 1,
    );
  }

  const uniqueIds = new Set<string>();

  for (const [profileId, count] of counts) {
    if (count === 1) {
      uniqueIds.add(profileId);
    }
  }

  return uniqueIds;
}

function findUniqueProfile(
  profiles: unknown[],
  profileId: string,
) {
  let match:
    | ReturnType<typeof getSafeProfile>
    | null = null;
  let count = 0;

  for (const item of profiles) {
    const safeProfile = getSafeProfile(item);

    if (safeProfile.profileId === profileId) {
      match = safeProfile;
      count += 1;
    }
  }

  return count === 1 ? match : null;
}

function Shell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main
      className="min-h-[100dvh] bg-[var(--dl-page)] font-[family-name:var(--dl-ui)] text-[var(--dl-text-primary)]"
      style={themeStyle}
    >
      {children}
    </main>
  );
}

function TopBar({
  activeOperation,
  canGoBack,
  onBack,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  canGoBack: boolean;
  onBack: () => void;
}) {
  const isPending = activeOperation === "back";
  const isBlocked =
    !canGoBack || activeOperation !== null;
  const label = isPending
    ? copy.backPending
    : canGoBack
      ? copy.back
      : copy.backBlocked;

  return (
    <div className="grid min-h-12 grid-cols-[minmax(88px,1fr)_auto_minmax(88px,1fr)] items-center gap-3">
      <button
        aria-label={label}
        className={`${focusRing} flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold leading-5 text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
        disabled={isBlocked}
        onClick={onBack}
        type="button"
      >
        {isPending ? <Spinner /> : <ArrowLeftIcon />}
        <span className="sr-only">{label}</span>
      </button>
      <p className="text-center font-[family-name:var(--dl-display)] text-[22px] leading-7 text-[var(--dl-bark)]">
        {copy.wordmark}
      </p>
      <p className="text-right font-[family-name:var(--dl-metadata)] text-[10px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
        {copy.contextLabel}
      </p>
    </div>
  );
}

function ToastRegion({
  notice,
}: {
  notice: string | null;
}) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 bottom-[max(24px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-[520px] rounded-xl border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)] shadow-[0_4px_20px_rgba(92,74,66,0.08)] transition-all duration-200 motion-reduce:transition-none ${
        notice
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0"
      }`}
      data-testid="toast-region"
      role="status"
      style={themeStyle}
    >
      {notice ?? ""}
    </div>
  );
}

function LoadingExperience({
  activeOperation,
  canGoBack,
  onBack,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  canGoBack: boolean;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[900px] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <TopBar
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={onBack}
      />
      <div
        aria-live="polite"
        className="mt-8"
        role="status"
      >
        <h1 className="font-[family-name:var(--dl-display)] text-[38px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[34px]">
          {copy.loadingHeading}
        </h1>
        <p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
          {copy.loadingSupporting}
        </p>
      </div>
      <div
        aria-hidden="true"
        className="mt-8 space-y-4"
      >
        <div className="h-28 animate-pulse rounded-[18px] bg-[var(--dl-parchment)] motion-reduce:animate-none" />
        <div className="h-32 animate-pulse rounded-[18px] bg-[var(--dl-parchment)] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

function ErrorExperience({
  activeOperation,
  canGoBack,
  onBack,
  onRetry,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  canGoBack: boolean;
  onBack: () => void;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[760px] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <TopBar
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={onBack}
      />
      <div className="flex flex-1 flex-col justify-center py-10">
        <div className="mt-5" role="alert">
          <h1 className="font-[family-name:var(--dl-display)] text-[38px] leading-10 text-[var(--dl-text-primary)] max-[374px]:text-[34px]">
            {copy.errorHeading}
          </h1>
          <p className="mt-2 max-w-[560px] text-[15px] leading-[22px] text-[var(--dl-text-secondary)]">
            {copy.errorSupporting}
          </p>
        </div>
        {onRetry ? (
          <button
            className={`${focusRing} mt-6 flex min-h-[52px] max-w-[360px] items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-5 text-base font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
            disabled={activeOperation !== null}
            onClick={onRetry}
            type="button"
          >
            {activeOperation === "retry-load" ? (
              <Spinner />
            ) : null}
            {activeOperation === "retry-load"
              ? copy.retryPending
              : copy.retryLoad}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OfflineBanner({
  isOffline,
}: {
  isOffline: boolean;
}) {
  if (!isOffline) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="mt-5 rounded-[16px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-4 py-3 text-sm leading-5 text-[var(--dl-bark)]"
      role="status"
    >
      {copy.offline}
    </div>
  );
}

function TrustCard() {
  return (
    <section
      className="mt-5 rounded-[16px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] px-4 py-3"
      data-testid="local-first-trust-card"
    >
      <h2 className="text-[17px] font-semibold leading-6 text-[var(--dl-bark)]">
        {copy.trustHeading}
      </h2>
      <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {copy.trustCopy}
      </p>
    </section>
  );
}

function AccountCard({
  activeOperation,
  canRequestSignIn,
  canRequestSignOut,
  isOffline,
  isSignInAvailableOffline,
  isSignOutAvailableOffline,
  onRequestSignIn,
  onRequestSignOut,
  report,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  canRequestSignIn: boolean;
  canRequestSignOut: boolean;
  isOffline: boolean;
  isSignInAvailableOffline: boolean;
  isSignOutAvailableOffline: boolean;
  onRequestSignIn?: () => void;
  onRequestSignOut?: () => void;
  report: AccountAndOptionalSyncReport;
}) {
  const isSignedOut =
    report.accountStatus === "signed-out";
  const operationPending =
    activeOperation !== null;
  const hostAllowed = isSignedOut
    ? canRequestSignIn && Boolean(onRequestSignIn)
    : canRequestSignOut && Boolean(onRequestSignOut);
  const offlineAllowed = isSignedOut
    ? !isOffline || isSignInAvailableOffline
    : !isOffline || isSignOutAvailableOffline;
  const enabled =
    hostAllowed && offlineAllowed && !operationPending;
  const isPending = isSignedOut
    ? activeOperation === "sign-in"
    : activeOperation === "sign-out";
  const blockedByOffline =
    hostAllowed && !offlineAllowed;
  const label = isPending
    ? isSignedOut
      ? copy.signInPending
      : copy.signOutPending
    : enabled
      ? isSignedOut
        ? copy.signIn
        : copy.signOut
      : blockedByOffline
        ? isSignedOut
          ? copy.signInReconnect
          : copy.signOutReconnect
        : isSignedOut
          ? copy.signInBlocked
          : copy.signOutBlocked;

  return (
    <section
      className="rounded-[18px] border border-[var(--dl-parchment)] bg-[var(--dl-surface)] p-4"
      data-testid="account-card"
    >
      <h2 className="text-[20px] font-semibold leading-7 text-[var(--dl-text-primary)]">
        {copy.accountCardHeading}
      </h2>
      <p className="mt-1 text-sm font-semibold leading-5 text-[var(--dl-bark)]">
        {copy.accountCardSubheading}
      </p>
      <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {copy.accountCardSupporting}
      </p>
      <div className="mt-4 rounded-[14px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface-soft)] p-3">
        <p className="text-sm font-semibold leading-5 text-[var(--dl-bark)]">
          {report.accountStatusLabel}
        </p>
        {displayString(report.accountSupporting) ? (
          <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
            {displayString(report.accountSupporting)}
          </p>
        ) : null}
        {displayString(report.accountDisplayLabel) ? (
          <p className="mt-1 font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.08em] text-[var(--dl-dusk)]">
            {displayString(report.accountDisplayLabel)}
          </p>
        ) : null}
      </div>
      <button
        className={`${focusRing} mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-4 text-sm font-semibold leading-5 text-white transition-colors hover:bg-[var(--dl-bark-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)] sm:max-w-[360px]`}
        disabled={!enabled}
        onClick={() => {
          if (!enabled) {
            return;
          }

          if (isSignedOut) {
            onRequestSignIn?.();
            return;
          }

          onRequestSignOut?.();
        }}
        type="button"
      >
        {isPending ? <Spinner /> : null}
        {label}
      </button>
    </section>
  );
}

function getSyncActionStatus({
  activeOperation,
  activeTargetProfileId,
  canManageProfileSync,
  isOffline,
  isSyncAvailableOffline,
  onDisableProfileSync,
  onEnableProfileSync,
  profile,
  uniqueProfileIds,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  activeTargetProfileId: string | null;
  canManageProfileSync: boolean;
  isOffline: boolean;
  isSyncAvailableOffline: boolean;
  onDisableProfileSync?: (profileId: string) => void;
  onEnableProfileSync?: (profileId: string) => void;
  profile: ReturnType<typeof getSafeProfile>;
  uniqueProfileIds: ReadonlySet<string>;
}): ProfileActionStatus {
  const hasUsableUniqueId =
    profile.profileId !== null &&
    uniqueProfileIds.has(profile.profileId);
  const hasCallback =
    profile.syncAction === "enable"
      ? Boolean(onEnableProfileSync)
      : profile.syncAction === "disable"
        ? Boolean(onDisableProfileSync)
        : false;
  const hostAllowed =
    canManageProfileSync &&
    profile.canActivateSyncAction !== false &&
    profile.syncAction !== null &&
    hasCallback &&
    hasUsableUniqueId;
  const offlineAllowed =
    !isOffline || isSyncAvailableOffline;
  const enabled =
    hostAllowed &&
    offlineAllowed &&
    activeOperation === null;
  const pending =
    profile.profileId !== null &&
    profile.profileId === activeTargetProfileId &&
    (
      (
        activeOperation === "enable-sync" &&
        profile.syncAction === "enable"
      ) ||
      (
        activeOperation === "disable-sync" &&
        profile.syncAction === "disable"
      )
    );
  const baseLabel =
    profile.syncActionLabel ??
    (
      profile.syncAction === "enable"
        ? copy.enableSync
        : profile.syncAction === "disable"
          ? copy.disableSync
          : copy.syncBlocked
    );

  if (pending) {
    return {
      enabled: false,
      label:
        profile.syncAction === "enable"
          ? copy.enableSyncPending
          : copy.disableSyncPending,
    };
  }

  if (enabled) {
    return { enabled: true, label: baseLabel };
  }

  if (hostAllowed && !offlineAllowed) {
    return {
      enabled: false,
      label: copy.syncReconnect,
    };
  }

  return {
    enabled: false,
    label:
      profile.syncBlockedLabel ??
      copy.syncBlocked,
  };
}

function getPrivacyActionStatus({
  activeOperation,
  activeTargetProfileId,
  canRequest,
  isOffline,
  isPrivacyRequestAvailableOffline,
  profile,
  uniqueProfileIds,
  callbackExists,
  privacyOperation,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  activeTargetProfileId: string | null;
  canRequest: boolean;
  isOffline: boolean;
  isPrivacyRequestAvailableOffline: boolean;
  profile: ReturnType<typeof getSafeProfile>;
  uniqueProfileIds: ReadonlySet<string>;
  callbackExists: boolean;
  privacyOperation:
    | "revoke-consent"
    | "delete-facial-data";
}): ProfileActionStatus {
  const hasUsableUniqueId =
    profile.profileId !== null &&
    uniqueProfileIds.has(profile.profileId);
  const hostAllowed =
    canRequest &&
    callbackExists &&
    hasUsableUniqueId;
  const offlineAllowed =
    !isOffline ||
    isPrivacyRequestAvailableOffline;

  if (
    activeOperation === privacyOperation &&
    profile.profileId !== null &&
    profile.profileId === activeTargetProfileId
  ) {
    return {
      enabled: false,
      label: copy.privacyPending,
    };
  }

  if (
    hostAllowed &&
    offlineAllowed &&
    activeOperation === null
  ) {
    return {
      enabled: true,
      label: "",
    };
  }

  if (hostAllowed && !offlineAllowed) {
    return {
      enabled: false,
      label: copy.privacyReconnect,
    };
  }

  return {
    enabled: false,
    label: copy.privacyBlocked,
  };
}

function ProfileCard({
  activeOperation,
  activeTargetProfileId,
  canManageProfileSync,
  canRequestConsentRevocation,
  canRequestFacialDataDeletion,
  isOffline,
  isPrivacyRequestAvailableOffline,
  isSyncAvailableOffline,
  hasFacialDataDeletionCallback,
  hasRevokeConsentCallback,
  item,
  onDisableProfileSync,
  onEnableProfileSync,
  onOpenPrivacyConfirmation,
  uniqueProfileIds,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  activeTargetProfileId: string | null;
  canManageProfileSync: boolean;
  canRequestConsentRevocation: boolean;
  canRequestFacialDataDeletion: boolean;
  isOffline: boolean;
  isPrivacyRequestAvailableOffline: boolean;
  isSyncAvailableOffline: boolean;
  hasFacialDataDeletionCallback: boolean;
  hasRevokeConsentCallback: boolean;
  item: unknown;
  onDisableProfileSync?: (profileId: string) => void;
  onEnableProfileSync?: (profileId: string) => void;
  onOpenPrivacyConfirmation: (
    kind: OptionalSyncPrivacyActionKind,
    profileId: string | null,
    displayName: string,
    opener: HTMLButtonElement,
  ) => void;
  uniqueProfileIds: ReadonlySet<string>;
}) {
  const profile = getSafeProfile(item);
  const syncStatus = getSyncActionStatus({
    activeOperation,
    activeTargetProfileId,
    canManageProfileSync,
    isOffline,
    isSyncAvailableOffline,
    onDisableProfileSync,
    onEnableProfileSync,
    profile,
    uniqueProfileIds,
  });
  const consentStatus = getPrivacyActionStatus({
    activeOperation,
    activeTargetProfileId,
    callbackExists: hasRevokeConsentCallback,
    canRequest:
      canRequestConsentRevocation &&
      profile.canRevokeConsent !== false,
    isOffline,
    isPrivacyRequestAvailableOffline,
    profile,
    privacyOperation: "revoke-consent",
    uniqueProfileIds,
  });
  const facialDataStatus = getPrivacyActionStatus({
    activeOperation,
    activeTargetProfileId,
    callbackExists:
      hasFacialDataDeletionCallback,
    canRequest:
      canRequestFacialDataDeletion &&
      profile.canRequestFacialDataDeletion !==
        false,
    isOffline,
    isPrivacyRequestAvailableOffline,
    profile,
    privacyOperation: "delete-facial-data",
    uniqueProfileIds,
  });

  return (
    <li
      className="rounded-[18px] border border-[var(--dl-parchment)] bg-[var(--dl-surface)] p-4"
      data-testid="sync-profile-card"
    >
      <div className="min-w-0">
        <h3 className="text-[20px] font-semibold leading-7 text-[var(--dl-text-primary)]">
          {profile.displayName}
        </h3>
        <p className="mt-2 text-sm font-semibold leading-5 text-[var(--dl-bark)]">
          {profile.storageStateLabel}
        </p>
        {profile.storageSupporting ? (
          <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
            {profile.storageSupporting}
          </p>
        ) : null}
        {profile.consentStateLabel ? (
          <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
            {profile.consentStateLabel}
          </p>
        ) : null}
        {profile.facialDataStateLabel ? (
          <p className="mt-1 text-sm leading-5 text-[var(--dl-text-secondary)]">
            {profile.facialDataStateLabel}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          aria-label={`${syncStatus.label}: ${profile.displayName}`}
          className={`${focusRing} flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--dl-bark)] px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:border-[var(--dl-sand)] disabled:text-[var(--dl-dusk)]`}
          disabled={!syncStatus.enabled}
          onClick={() => {
            if (
              !syncStatus.enabled ||
              profile.profileId === null
            ) {
              return;
            }

            if (profile.syncAction === "enable") {
              onEnableProfileSync?.(
                profile.profileId,
              );
              return;
            }

            if (profile.syncAction === "disable") {
              onDisableProfileSync?.(
                profile.profileId,
              );
            }
          }}
          type="button"
        >
          {syncStatus.label ===
            copy.enableSyncPending ||
          syncStatus.label ===
            copy.disableSyncPending ? (
            <Spinner />
          ) : null}
          {syncStatus.label}
        </button>
        <button
          aria-label={`${consentStatus.label || copy.requestConsent}: ${profile.displayName}`}
          className={`${focusRing} flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--dl-parchment)] px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={!consentStatus.enabled}
          onClick={(event) => {
            if (!consentStatus.enabled) {
              return;
            }

            onOpenPrivacyConfirmation(
              "revoke-consent",
              profile.profileId,
              profile.displayName,
              event.currentTarget,
            );
          }}
          type="button"
        >
          {copy.requestConsent}
        </button>
        <button
          aria-label={`${facialDataStatus.label || copy.requestFacialData}: ${profile.displayName}`}
          className={`${focusRing} flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--dl-parchment)] px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] transition-colors hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
          disabled={!facialDataStatus.enabled}
          onClick={(event) => {
            if (!facialDataStatus.enabled) {
              return;
            }

            onOpenPrivacyConfirmation(
              "delete-facial-data",
              profile.profileId,
              profile.displayName,
              event.currentTarget,
            );
          }}
          type="button"
        >
          {copy.requestFacialData}
        </button>
      </div>
    </li>
  );
}

function EmptyProfileCard() {
  return (
    <section
      className="rounded-[18px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-4 text-[var(--dl-bark)]"
      data-testid="empty-sync-profile-card"
    >
      <h2 className="text-[20px] font-semibold leading-7">
        {copy.emptyHeading}
      </h2>
      <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {copy.emptySupporting}
      </p>
    </section>
  );
}

function ProfileList({
  activeOperation,
  activeTargetProfileId,
  canManageProfileSync,
  canRequestConsentRevocation,
  canRequestFacialDataDeletion,
  isOffline,
  isPrivacyRequestAvailableOffline,
  isSyncAvailableOffline,
  hasFacialDataDeletionCallback,
  hasRevokeConsentCallback,
  onDisableProfileSync,
  onEnableProfileSync,
  onOpenPrivacyConfirmation,
  profiles,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  activeTargetProfileId: string | null;
  canManageProfileSync: boolean;
  canRequestConsentRevocation: boolean;
  canRequestFacialDataDeletion: boolean;
  isOffline: boolean;
  isPrivacyRequestAvailableOffline: boolean;
  isSyncAvailableOffline: boolean;
  hasFacialDataDeletionCallback: boolean;
  hasRevokeConsentCallback: boolean;
  onDisableProfileSync?: (profileId: string) => void;
  onEnableProfileSync?: (profileId: string) => void;
  onOpenPrivacyConfirmation: (
    kind: OptionalSyncPrivacyActionKind,
    profileId: string | null,
    displayName: string,
    opener: HTMLButtonElement,
  ) => void;
  profiles: unknown[];
}) {
  if (profiles.length === 0) {
    return <EmptyProfileCard />;
  }

  const uniqueProfileIds =
    getUniqueProfileIds(profiles);

  return (
    <section aria-labelledby="profile-sync-heading">
      <h2
        className="mb-3 text-[20px] font-semibold leading-7 text-[var(--dl-text-primary)]"
        id="profile-sync-heading"
      >
        {copy.profileListHeading}
      </h2>
      <ol className="space-y-4">
        {profiles.map((profile, index) => (
          <ProfileCard
            activeOperation={activeOperation}
            activeTargetProfileId={
              activeTargetProfileId
            }
            canManageProfileSync={
              canManageProfileSync
            }
            canRequestConsentRevocation={
              canRequestConsentRevocation
            }
            canRequestFacialDataDeletion={
              canRequestFacialDataDeletion
            }
            isOffline={isOffline}
            isPrivacyRequestAvailableOffline={
              isPrivacyRequestAvailableOffline
            }
            isSyncAvailableOffline={
              isSyncAvailableOffline
            }
            hasFacialDataDeletionCallback={
              hasFacialDataDeletionCallback
            }
            hasRevokeConsentCallback={
              hasRevokeConsentCallback
            }
            item={profile}
            key={`sync-profile-${index}`}
            onDisableProfileSync={
              onDisableProfileSync
            }
            onEnableProfileSync={
              onEnableProfileSync
            }
            onOpenPrivacyConfirmation={
              onOpenPrivacyConfirmation
            }
            uniqueProfileIds={uniqueProfileIds}
          />
        ))}
      </ol>
    </section>
  );
}

function HelperCard({
  helperLabel,
  privacyLabel,
}: {
  helperLabel?: string;
  privacyLabel?: string;
}) {
  return (
    <section className="rounded-[18px] border border-[var(--dl-parchment)] bg-[var(--dl-surface-soft)] p-4">
      <h2 className="text-[17px] font-semibold leading-6 text-[var(--dl-bark)]">
        {copy.privacyHeading}
      </h2>
      <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {displayString(helperLabel) ??
          copy.helperFallback}
      </p>
      <p className="mt-2 text-sm leading-5 text-[var(--dl-text-secondary)]">
        {displayString(privacyLabel) ??
          copy.privacyFallback}
      </p>
    </section>
  );
}

function PrivacyConfirmationDialog({
  activeOperation,
  confirmation,
  onCancel,
  onConfirm,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  confirmation: PendingPrivacyConfirmation;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef =
    useRef<HTMLButtonElement | null>(null);
  const isPending =
    activeOperation === "revoke-consent" ||
    activeOperation === "delete-facial-data";
  const title =
    confirmation.kind === "revoke-consent"
      ? copy.revokeDialogTitle
      : copy.deletionDialogTitle;
  const supporting =
    confirmation.kind === "revoke-consent"
      ? copy.revokeDialogSupporting
      : copy.deletionDialogSupporting;
  const titleId = "privacy-confirmation-title";
  const supportingId =
    "privacy-confirmation-supporting";

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Escape") {
      if (!isPending) {
        event.preventDefault();
        onCancel();
      }
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const buttons =
      dialogRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])",
      ) ?? [];
    const focusable = Array.from(buttons).slice();

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last =
      focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      aria-describedby={supportingId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(58,46,40,0.34)] p-4 sm:items-center"
      data-testid="privacy-confirmation-dialog"
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      <div
        className="w-full max-w-[520px] rounded-[24px] border border-[var(--dl-parchment)] bg-[var(--dl-surface)] p-5 shadow-[0_20px_60px_rgba(58,46,40,0.18)]"
        ref={dialogRef}
        style={themeStyle}
      >
        <h2
          className="font-[family-name:var(--dl-display)] text-[30px] leading-9 text-[var(--dl-text-primary)]"
          id={titleId}
        >
          {title}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-5 text-[var(--dl-bark)]">
          {confirmation.displayName}
        </p>
        <p
          className="mt-3 text-sm leading-5 text-[var(--dl-text-secondary)]"
          id={supportingId}
        >
          {supporting}
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            className={`${focusRing} min-h-11 rounded-full border border-[var(--dl-parchment)] px-4 text-sm font-semibold leading-5 text-[var(--dl-bark)] disabled:cursor-not-allowed disabled:text-[var(--dl-dusk)]`}
            disabled={isPending}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {copy.cancel}
          </button>
          <button
            className={`${focusRing} flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--dl-bark)] px-4 text-sm font-semibold leading-5 text-white disabled:cursor-not-allowed disabled:bg-[var(--dl-sand)] disabled:text-[var(--dl-text-secondary)]`}
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {isPending ? <Spinner /> : null}
            {isPending
              ? copy.privacyPending
              : copy.confirmRequest}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadyExperience({
  activeOperation,
  activeTargetProfileId,
  canGoBack,
  canManageProfileSync,
  canRequestConsentRevocation,
  canRequestFacialDataDeletion,
  canRequestSignIn,
  canRequestSignOut,
  isOffline,
  isPrivacyRequestAvailableOffline,
  isSignInAvailableOffline,
  isSignOutAvailableOffline,
  isSyncAvailableOffline,
  hasFacialDataDeletionCallback,
  hasRevokeConsentCallback,
  onBack,
  onDisableProfileSync,
  onEnableProfileSync,
  onOpenPrivacyConfirmation,
  onRequestSignIn,
  onRequestSignOut,
  report,
  showEmptyProfiles,
}: {
  activeOperation: AccountAndOptionalSyncOperation;
  activeTargetProfileId: string | null;
  canGoBack: boolean;
  canManageProfileSync: boolean;
  canRequestConsentRevocation: boolean;
  canRequestFacialDataDeletion: boolean;
  canRequestSignIn: boolean;
  canRequestSignOut: boolean;
  isOffline: boolean;
  isPrivacyRequestAvailableOffline: boolean;
  isSignInAvailableOffline: boolean;
  isSignOutAvailableOffline: boolean;
  isSyncAvailableOffline: boolean;
  hasFacialDataDeletionCallback: boolean;
  hasRevokeConsentCallback: boolean;
  onBack: () => void;
  onDisableProfileSync?: (profileId: string) => void;
  onEnableProfileSync?: (profileId: string) => void;
  onOpenPrivacyConfirmation: (
    kind: OptionalSyncPrivacyActionKind,
    profileId: string | null,
    displayName: string,
    opener: HTMLButtonElement,
  ) => void;
  onRequestSignIn?: () => void;
  onRequestSignOut?: () => void;
  report: AccountAndOptionalSyncReport;
  showEmptyProfiles: boolean;
}) {
  const profiles = showEmptyProfiles
    ? []
    : report.profiles;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[1040px] px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
      <TopBar
        activeOperation={activeOperation}
        canGoBack={canGoBack}
        onBack={onBack}
      />
      <header className="mt-7">
        <p className="font-[family-name:var(--dl-metadata)] text-[11px] leading-4 tracking-[0.12em] text-[var(--dl-dusk)]">
          {copy.contextLabel}
        </p>
        <h1 className="mt-2 font-[family-name:var(--dl-display)] text-[42px] leading-[44px] text-[var(--dl-text-primary)] max-[374px]:text-[36px]">
          {copy.heading}
        </h1>
        <p className="mt-3 max-w-[650px] text-[15px] leading-[23px] text-[var(--dl-text-secondary)]">
          {copy.supporting}
        </p>
      </header>
      <OfflineBanner isOffline={isOffline} />
      <TrustCard />
      <div className="mt-6 space-y-5">
        <AccountCard
          activeOperation={activeOperation}
          canRequestSignIn={canRequestSignIn}
          canRequestSignOut={canRequestSignOut}
          isOffline={isOffline}
          isSignInAvailableOffline={
            isSignInAvailableOffline
          }
          isSignOutAvailableOffline={
            isSignOutAvailableOffline
          }
          onRequestSignIn={onRequestSignIn}
          onRequestSignOut={onRequestSignOut}
          report={report}
        />
        <ProfileList
          activeOperation={activeOperation}
          activeTargetProfileId={
            activeTargetProfileId
          }
          canManageProfileSync={
            canManageProfileSync
          }
          canRequestConsentRevocation={
            canRequestConsentRevocation
          }
          canRequestFacialDataDeletion={
            canRequestFacialDataDeletion
          }
          isOffline={isOffline}
          isPrivacyRequestAvailableOffline={
            isPrivacyRequestAvailableOffline
          }
          isSyncAvailableOffline={
            isSyncAvailableOffline
          }
          hasFacialDataDeletionCallback={
            hasFacialDataDeletionCallback
          }
          hasRevokeConsentCallback={
            hasRevokeConsentCallback
          }
          onDisableProfileSync={
            onDisableProfileSync
          }
          onEnableProfileSync={onEnableProfileSync}
          onOpenPrivacyConfirmation={
            onOpenPrivacyConfirmation
          }
          profiles={profiles}
        />
        <HelperCard
          helperLabel={report.helperLabel}
          privacyLabel={report.privacyLabel}
        />
      </div>
    </div>
  );
}

export default function AccountAndOptionalSyncScreen({
  state = "loading",
  report = null,
  isOffline = false,
  canGoBack = true,
  canRequestSignIn = true,
  canRequestSignOut = true,
  canManageProfileSync = true,
  canRequestConsentRevocation = true,
  canRequestFacialDataDeletion = true,
  isSignInAvailableOffline = false,
  isSignOutAvailableOffline = false,
  isSyncAvailableOffline = false,
  isPrivacyRequestAvailableOffline = false,
  onBack,
  onRequestSignIn,
  onRequestSignOut,
  onEnableProfileSync,
  onDisableProfileSync,
  onRevokeConsent,
  onRequestFacialDataDeletion,
  onRetryLoad,
}: AccountAndOptionalSyncScreenProps) {
  const mountedRef = useRef(true);
  const inFlightRef = useRef<
    Exclude<AccountAndOptionalSyncOperation, null>
      | null
  >(null);
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef =
    useRef<HTMLButtonElement | null>(null);
  const confirmationOpenRef = useRef(false);
  const [
    activeOperation,
    setActiveOperation,
  ] =
    useState<AccountAndOptionalSyncOperation>(
      null,
    );
  const [
    activeTargetProfileId,
    setActiveTargetProfileId,
  ] = useState<string | null>(null);
  const [
    pendingConfirmation,
    setPendingConfirmation,
  ] =
    useState<PendingPrivacyConfirmation | null>(
      null,
    );
  const [toastNotice, setToastNotice] =
    useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const appShell = appShellRef.current;

    if (!appShell) {
      return;
    }

    if (pendingConfirmation) {
      appShell.setAttribute("inert", "");
    } else {
      appShell.removeAttribute("inert");
    }
  }, [pendingConfirmation]);

  useEffect(() => {
    if (!toastNotice) {
      return;
    }

    const timeout = window.setTimeout(
      () => {
        if (mountedRef.current) {
          setToastNotice(null);
        }
      },
      5000,
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toastNotice]);

  const runtimeState =
    isAccountAndOptionalSyncState(state)
      ? state
      : "error";
  const hasUsableReport =
    hasUsableAccountAndOptionalSyncReport(
      report,
    );
  const effectiveState =
    (
      runtimeState === "ready" ||
      runtimeState === "empty"
    ) &&
    !hasUsableReport
      ? "error"
      : runtimeState;
  const readyReport =
    hasUsableReport ? report : null;

  const runOperation = useCallback(
    async (
      operation: Exclude<
        AccountAndOptionalSyncOperation,
        null
      >,
      callback: () => void | Promise<void>,
      failureNotice: string,
      successNotice?: string,
      targetProfileId?: string,
    ) => {
      if (inFlightRef.current !== null) {
        return false;
      }

      inFlightRef.current = operation;

      if (mountedRef.current) {
        setActiveOperation(operation);
        setActiveTargetProfileId(
          targetProfileId ?? null,
        );
        setToastNotice(null);
      }

      try {
        await callback();

        if (
          successNotice &&
          mountedRef.current
        ) {
          setToastNotice(successNotice);
        }

        return true;
      } catch {
        if (mountedRef.current) {
          setToastNotice(failureNotice);
        }

        return false;
      } finally {
        inFlightRef.current = null;

        if (mountedRef.current) {
          setActiveOperation(null);
          setActiveTargetProfileId(null);
        }
      }
    },
    [],
  );

  const restoreFocus = useCallback(() => {
    const returnFocusTo =
      returnFocusRef.current;
    returnFocusRef.current = null;
    window.setTimeout(() => {
      returnFocusTo?.focus();
    }, 0);
  }, []);

  const clearConfirmation = useCallback(() => {
    confirmationOpenRef.current = false;
    setPendingConfirmation(null);
  }, []);

  const closeConfirmation = useCallback(() => {
    if (
      activeOperation === "revoke-consent" ||
      activeOperation === "delete-facial-data" ||
      inFlightRef.current !== null
    ) {
      return;
    }

    clearConfirmation();
    restoreFocus();
  }, [
    activeOperation,
    clearConfirmation,
    restoreFocus,
  ]);

  const handleBack = useCallback(() => {
    if (
      !canGoBack ||
      confirmationOpenRef.current ||
      activeOperation !== null ||
      inFlightRef.current !== null
    ) {
      return;
    }

    void runOperation(
      "back",
      onBack,
      copy.backError,
    );
  }, [
    activeOperation,
    canGoBack,
    onBack,
    runOperation,
  ]);

  const handleRequestSignIn = useCallback(() => {
    if (
      !readyReport ||
      readyReport.accountStatus !== "signed-out" ||
      !canRequestSignIn ||
      !onRequestSignIn ||
      confirmationOpenRef.current ||
      activeOperation !== null ||
      inFlightRef.current !== null ||
      (
        isOffline &&
        !isSignInAvailableOffline
      )
    ) {
      return;
    }

    void runOperation(
      "sign-in",
      onRequestSignIn,
      copy.signInError,
      copy.accountSuccess,
    );
  }, [
    activeOperation,
    canRequestSignIn,
    isOffline,
    isSignInAvailableOffline,
    onRequestSignIn,
    readyReport,
    runOperation,
  ]);

  const handleRequestSignOut = useCallback(() => {
    if (
      !readyReport ||
      readyReport.accountStatus !== "signed-in" ||
      !canRequestSignOut ||
      !onRequestSignOut ||
      confirmationOpenRef.current ||
      activeOperation !== null ||
      inFlightRef.current !== null ||
      (
        isOffline &&
        !isSignOutAvailableOffline
      )
    ) {
      return;
    }

    void runOperation(
      "sign-out",
      onRequestSignOut,
      copy.signOutError,
      copy.accountSuccess,
    );
  }, [
    activeOperation,
    canRequestSignOut,
    isOffline,
    isSignOutAvailableOffline,
    onRequestSignOut,
    readyReport,
    runOperation,
  ]);

  const handleEnableProfileSync = useCallback(
    (profileId: string) => {
      if (
        !readyReport ||
        !onEnableProfileSync ||
        !canManageProfileSync ||
        confirmationOpenRef.current ||
        activeOperation !== null ||
        inFlightRef.current !== null ||
        (
          isOffline &&
          !isSyncAvailableOffline
        )
      ) {
        return;
      }

      const uniqueProfileIds =
        getUniqueProfileIds(readyReport.profiles);
      const profile = findUniqueProfile(
        readyReport.profiles,
        profileId,
      );

      if (
        !profile ||
        !uniqueProfileIds.has(profileId) ||
        profile.syncAction !== "enable" ||
        profile.canActivateSyncAction === false
      ) {
        return;
      }

      void runOperation(
        "enable-sync",
        () => onEnableProfileSync(profileId),
        copy.enableSyncError,
        copy.syncSuccess,
        profileId,
      );
    },
    [
      activeOperation,
      canManageProfileSync,
      isOffline,
      isSyncAvailableOffline,
      onEnableProfileSync,
      readyReport,
      runOperation,
    ],
  );

  const handleDisableProfileSync = useCallback(
    (profileId: string) => {
      if (
        !readyReport ||
        !onDisableProfileSync ||
        !canManageProfileSync ||
        confirmationOpenRef.current ||
        activeOperation !== null ||
        inFlightRef.current !== null ||
        (
          isOffline &&
          !isSyncAvailableOffline
        )
      ) {
        return;
      }

      const uniqueProfileIds =
        getUniqueProfileIds(readyReport.profiles);
      const profile = findUniqueProfile(
        readyReport.profiles,
        profileId,
      );

      if (
        !profile ||
        !uniqueProfileIds.has(profileId) ||
        profile.syncAction !== "disable" ||
        profile.canActivateSyncAction === false
      ) {
        return;
      }

      void runOperation(
        "disable-sync",
        () => onDisableProfileSync(profileId),
        copy.disableSyncError,
        copy.syncSuccess,
        profileId,
      );
    },
    [
      activeOperation,
      canManageProfileSync,
      isOffline,
      isSyncAvailableOffline,
      onDisableProfileSync,
      readyReport,
      runOperation,
    ],
  );

  const openPrivacyConfirmation = useCallback(
    (
      kind: OptionalSyncPrivacyActionKind,
      profileId: string | null,
      displayName: string,
      opener: HTMLButtonElement,
    ) => {
      if (
        profileId === null ||
        pendingConfirmation !== null ||
        confirmationOpenRef.current ||
        activeOperation !== null ||
        inFlightRef.current !== null
      ) {
        return;
      }

      returnFocusRef.current = opener;
      confirmationOpenRef.current = true;
      setPendingConfirmation({
        kind,
        profileId,
        displayName,
      });
    },
    [activeOperation, pendingConfirmation],
  );

  const confirmPrivacyRequest = useCallback(() => {
    if (
      !pendingConfirmation ||
      activeOperation !== null ||
      inFlightRef.current !== null
    ) {
      return;
    }

    if (!readyReport) {
      clearConfirmation();
      setToastNotice(copy.privacyError);
      restoreFocus();
      return;
    }

    const {
      kind,
      profileId,
    } = pendingConfirmation;
    const uniqueProfileIds =
      getUniqueProfileIds(readyReport.profiles);
    const profile = findUniqueProfile(
      readyReport.profiles,
      profileId,
    );
    const isConsent =
      kind === "revoke-consent";
    const callback = isConsent
      ? onRevokeConsent
      : onRequestFacialDataDeletion;
    const globalAllowed = isConsent
      ? canRequestConsentRevocation
      : canRequestFacialDataDeletion;
    const profileAllowed = isConsent
      ? profile?.canRevokeConsent !== false
      : profile?.canRequestFacialDataDeletion !==
        false;
    const offlineAllowed =
      !isOffline ||
      isPrivacyRequestAvailableOffline;

    if (
      !profile ||
      !uniqueProfileIds.has(profileId) ||
      !globalAllowed ||
      !profileAllowed ||
      !callback ||
      !offlineAllowed
    ) {
      clearConfirmation();
      setToastNotice(copy.privacyError);
      restoreFocus();
      return;
    }

    void runOperation(
      kind,
      async () => {
        await callback(profileId);
      },
      copy.privacyError,
      copy.privacySuccess,
      profileId,
    ).then((didSucceed) => {
      if (didSucceed && mountedRef.current) {
        clearConfirmation();
        restoreFocus();
      }
    });
  }, [
    activeOperation,
    canRequestConsentRevocation,
    canRequestFacialDataDeletion,
    isOffline,
    isPrivacyRequestAvailableOffline,
    onRequestFacialDataDeletion,
    onRevokeConsent,
    pendingConfirmation,
    readyReport,
    clearConfirmation,
    restoreFocus,
    runOperation,
  ]);

  const handleRetryLoad = useCallback(() => {
    if (
      !onRetryLoad ||
      confirmationOpenRef.current ||
      activeOperation !== null ||
      inFlightRef.current !== null
    ) {
      return;
    }

    void runOperation(
      "retry-load",
      onRetryLoad,
      copy.retryError,
    );
  }, [
    activeOperation,
    onRetryLoad,
    runOperation,
  ]);

  return (
    <Shell>
      <div
        aria-hidden={
          pendingConfirmation ? true : undefined
        }
        ref={appShellRef}
      >
        {effectiveState === "loading" ? (
          <LoadingExperience
            activeOperation={activeOperation}
            canGoBack={canGoBack}
            onBack={handleBack}
          />
        ) : null}
        {(
          effectiveState === "ready" ||
          effectiveState === "empty"
        ) && readyReport ? (
          <ReadyExperience
            activeOperation={activeOperation}
            activeTargetProfileId={
              activeTargetProfileId
            }
            canGoBack={canGoBack}
            canManageProfileSync={
              canManageProfileSync
            }
            canRequestConsentRevocation={
              canRequestConsentRevocation
            }
            canRequestFacialDataDeletion={
              canRequestFacialDataDeletion
            }
            canRequestSignIn={canRequestSignIn}
            canRequestSignOut={canRequestSignOut}
            isOffline={isOffline}
            isPrivacyRequestAvailableOffline={
              isPrivacyRequestAvailableOffline
            }
            isSignInAvailableOffline={
              isSignInAvailableOffline
            }
            isSignOutAvailableOffline={
              isSignOutAvailableOffline
            }
            isSyncAvailableOffline={
              isSyncAvailableOffline
            }
            onBack={handleBack}
            onDisableProfileSync={
              onDisableProfileSync
                ? handleDisableProfileSync
                : undefined
            }
            onEnableProfileSync={
              onEnableProfileSync
                ? handleEnableProfileSync
                : undefined
            }
            onOpenPrivacyConfirmation={
              openPrivacyConfirmation
            }
            onRequestSignIn={
              onRequestSignIn
                ? handleRequestSignIn
                : undefined
            }
            onRequestSignOut={
              onRequestSignOut
                ? handleRequestSignOut
                : undefined
            }
            hasFacialDataDeletionCallback={
              Boolean(onRequestFacialDataDeletion)
            }
            hasRevokeConsentCallback={
              Boolean(onRevokeConsent)
            }
            report={readyReport}
            showEmptyProfiles={
              effectiveState === "empty"
            }
          />
        ) : null}
        {effectiveState === "error" ? (
          <ErrorExperience
            activeOperation={activeOperation}
            canGoBack={canGoBack}
            onBack={handleBack}
            onRetry={
              onRetryLoad
                ? handleRetryLoad
                : undefined
            }
          />
        ) : null}
      </div>
      {pendingConfirmation ? (
        <PrivacyConfirmationDialog
          activeOperation={activeOperation}
          confirmation={pendingConfirmation}
          onCancel={closeConfirmation}
          onConfirm={confirmPrivacyRequest}
        />
      ) : null}
      <ToastRegion notice={toastNotice} />
    </Shell>
  );
}
