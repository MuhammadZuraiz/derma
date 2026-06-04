import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  Cloud,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";

export type ProfileSwitcherAndManagementState =
  | "loading"
  | "ready"
  | "empty"
  | "error";

export type ProfileManagementOperation =
  | "back"
  | "select-profile"
  | "add-profile"
  | "edit-profile"
  | "open-sync-settings"
  | "delete-profile"
  | "retry-load"
  | null;

export type ManagedProfileSyncState =
  | "local-only"
  | "synced"
  | "sync-pending"
  | "sync-error";

export interface ManagedProfileSummary {
  profileId: string;
  displayName: string;
  isActive: boolean;
  syncState: ManagedProfileSyncState;
  syncLabel: string;
  supporting?: string;
  latestSnapshotLabel?: string;
  canSelect?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  deleteBlockLabel?: string;
}

export interface ProfileSwitcherAndManagementReport {
  profiles: ManagedProfileSummary[];
  helperLabel?: string;
  profileLimitLabel?: string;
  syncHelperLabel?: string;
}

export interface ProfileSwitcherAndManagementScreenProps {
  state?: ProfileSwitcherAndManagementState;
  report?: ProfileSwitcherAndManagementReport | null;
  isOffline?: boolean;
  canGoBack?: boolean;
  canAddProfile?: boolean;
  canOpenSyncSettings?: boolean;
  canSelectProfiles?: boolean;
  canEditProfiles?: boolean;
  canDeleteProfiles?: boolean;
  onBack: () => void | Promise<void>;
  onAddProfile: () => void | Promise<void>;
  onOpenSyncSettings?: () => void | Promise<void>;
  onSelectProfile?: (
    profileId: string,
  ) => void | Promise<void>;
  onEditProfile?: (
    profileId: string,
  ) => void | Promise<void>;
  onDeleteProfile?: (
    profileId: string,
  ) => void | Promise<void>;
  onRetryLoad?: () => void | Promise<void>;
}

export function isProfileSwitcherAndManagementState(
  value: unknown,
): value is ProfileSwitcherAndManagementState {
  return (
    value === "loading" ||
    value === "ready" ||
    value === "empty" ||
    value === "error"
  );
}

export function hasUsableProfileSwitcherAndManagementReport(
  report: ProfileSwitcherAndManagementReport | null | undefined,
): report is ProfileSwitcherAndManagementReport {
  return (
    report !== null &&
    report !== undefined &&
    Array.isArray((report as { profiles?: unknown }).profiles)
  );
}

export const copy = {
  wordmark: "DermaLens",
  contextLabel: "LOCAL PROFILES",
  back: "Back",
  backBlocked: "Back unavailable",
  backing: "Going back...",
  heading: "Choose a profile",
  supporting:
    "Switch between local profiles, add another profile, or review optional sync settings.",
  localFirst:
    "Profiles stay local on this device unless you choose to sync them.",
  offline:
    "You appear to be offline. Locally supplied profiles remain readable.",
  loadingHeading: "Preparing profiles",
  loadingSupporting: "Your local profile list is being prepared.",
  errorHeading: "We could not load your profiles",
  errorSupporting:
    "Your local profiles are protected. Try loading them again.",
  retry: "Try again",
  retrying: "Trying again...",
  emptyHeading: "No profiles yet",
  emptySupporting: "Create a local profile to begin your skincare journey.",
  activeProfiles: "Active profile",
  otherProfiles: "Other profiles",
  activeBadge: "Active profile",
  unnamedProfile: "Unnamed profile",
  latestSnapshot: "Latest snapshot",
  addProfile: "Add profile",
  addProfileBlocked: "Add profile unavailable",
  addingProfile: "Opening profile setup...",
  addProfileSupporting:
    "Create another local profile for a shared device or separate routine.",
  selectProfile: "Select profile",
  selectBlocked: "Profile switching unavailable",
  selectingProfile: "Switching profile...",
  editProfile: "Edit profile",
  editBlocked: "Editing unavailable",
  editingProfile: "Opening editor...",
  deleteProfile: "Delete profile",
  deleteBlocked: "Deletion unavailable",
  deletingProfile: "Deleting profile...",
  syncTitle: "Cloud sync is optional",
  syncSupporting: "Your local profiles remain usable without an account.",
  manageSync: "Manage sync settings",
  syncBlocked: "Sync settings unavailable",
  openingSync: "Opening sync settings...",
  deleteDialogTitle: "Delete this profile?",
  deleteDialogSupporting:
    "This requests removal of the selected profile. The host controls deletion and any synced-data handling.",
  cancel: "Cancel",
  toastLabel: "Profile management notice",
  backError: "We could not go back. Please try again.",
  selectError: "We could not switch profiles. Please try again.",
  addError: "We could not open profile setup. Please try again.",
  editError: "We could not open the profile editor. Please try again.",
  syncError: "We could not open sync settings. Please try again.",
  deleteError: "We could not delete this profile. Please try again.",
  retryError: "We could not reload profiles. Please try again.",
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
  display: 'var(--font-dm-serif-display), Georgia, serif',
  ui: 'var(--font-dm-sans), system-ui, sans-serif',
  metadata: 'var(--font-space-mono), monospace',
} as const;

type ThemeStyle = CSSProperties & Record<`--dl-${string}`, string>;

const themeStyle: ThemeStyle = {
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
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--dl-bark)]";

type InFlightOperation = {
  operation: Exclude<ProfileManagementOperation, null>;
  profileKey: string | null;
};

type DeleteCandidate = {
  profile: ManagedProfileSummary;
  profileKey: string;
  displayName: string;
  returnFocusTo: HTMLButtonElement | null;
};

function isNonWhitespaceString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function hasUsableProfileRoute(
  profile: ManagedProfileSummary,
): boolean {
  return isNonWhitespaceString(profile.profileId);
}

function getSafeDisplayName(
  profile: ManagedProfileSummary,
): string {
  const displayName = (profile as { displayName?: unknown }).displayName;
  return isNonWhitespaceString(displayName)
    ? displayName.trim()
    : copy.unnamedProfile;
}

function getProfileActionAccessibleLabel(
  label: string,
  displayName: string,
) {
  return `${label}: ${displayName}`;
}

function resolveCurrentDeleteProfile(
  candidate: DeleteCandidate | null,
  profiles: ManagedProfileSummary[],
): ManagedProfileSummary | null {
  if (!candidate || !hasUsableProfileRoute(candidate.profile)) {
    return null;
  }

  const matches = profiles.filter(
    (profile) => profile.profileId === candidate.profile.profileId,
  );

  return matches.length === 1 ? matches[0] : null;
}

function getInitials(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || "P";
}

function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-[0_16px_42px_rgba(92,74,66,0.07)] ${className}`}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--dl-dusk)]"
      style={{ fontFamily: fonts.metadata }}
    >
      {children}
    </p>
  );
}

function ActionButton({
  activeOperation,
  activeProfileKey,
  accessibleLabel,
  blocked,
  blockedLabel,
  children,
  className = "",
  label,
  minHeight = "min-h-[44px]",
  onClick,
  operation,
  pendingLabel,
  profileKey = null,
}: {
  activeOperation: ProfileManagementOperation;
  activeProfileKey: string | null;
  accessibleLabel?: string;
  blocked: boolean;
  blockedLabel: string;
  children?: ReactNode;
  className?: string;
  label: string;
  minHeight?: string;
  onClick: () => void;
  operation: Exclude<ProfileManagementOperation, null>;
  pendingLabel: string;
  profileKey?: string | null;
}) {
  const isPending =
    activeOperation === operation &&
    activeProfileKey === profileKey;
  const hasConflictingOperation =
    activeOperation !== null && !isPending;
  const isDisabled = blocked || isPending || hasConflictingOperation;
  const visibleLabel = isPending ? pendingLabel : blocked ? blockedLabel : label;

  return (
    <button
      aria-label={accessibleLabel}
      className={`${focusRing} ${minHeight} rounded-full px-4 py-2 text-sm font-bold motion-safe:transition disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      type="button"
    >
      {children ? (
        <span className="flex items-center justify-center gap-2">
          {children}
          <span>{visibleLabel}</span>
        </span>
      ) : (
        visibleLabel
      )}
    </button>
  );
}

function PrimaryButton(
  props: Omit<Parameters<typeof ActionButton>[0], "className" | "minHeight">,
) {
  return (
    <ActionButton
      {...props}
      className="w-full bg-[var(--dl-bark)] text-white shadow-[0_12px_30px_rgba(92,74,66,0.2)] hover:bg-[var(--dl-bark-hover)]"
      minHeight="min-h-[52px]"
    />
  );
}

function SecondaryButton(
  props: Omit<Parameters<typeof ActionButton>[0], "className">,
) {
  return (
    <ActionButton
      {...props}
      className="border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)]"
    />
  );
}

function TextButton(
  props: Omit<Parameters<typeof ActionButton>[0], "className">,
) {
  return (
    <ActionButton
      {...props}
      className="text-[var(--dl-bark)] underline-offset-4 hover:underline"
    />
  );
}

function getActionVisibleLabel({
  activeOperation,
  activeProfileKey,
  blocked,
  blockedLabel,
  label,
  operation,
  pendingLabel,
  profileKey,
}: {
  activeOperation: ProfileManagementOperation;
  activeProfileKey: string | null;
  blocked: boolean;
  blockedLabel: string;
  label: string;
  operation: Exclude<ProfileManagementOperation, null>;
  pendingLabel: string;
  profileKey: string | null;
}) {
  const isPending =
    activeOperation === operation &&
    activeProfileKey === profileKey;

  if (isPending) {
    return pendingLabel;
  }

  return blocked ? blockedLabel : label;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("aria-hidden"));
}

export default function ProfileSwitcherAndManagementScreen({
  state = "ready",
  report = null,
  isOffline = false,
  canGoBack = true,
  canAddProfile = true,
  canOpenSyncSettings = true,
  canSelectProfiles = true,
  canEditProfiles = true,
  canDeleteProfiles = true,
  onBack,
  onAddProfile,
  onOpenSyncSettings,
  onSelectProfile,
  onEditProfile,
  onDeleteProfile,
  onRetryLoad,
}: ProfileSwitcherAndManagementScreenProps) {
  const mountedRef = useRef(false);
  const inFlightRef = useRef<InFlightOperation | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const backgroundShellRef = useRef<HTMLDivElement | null>(null);
  const cancelDeleteButtonRef = useRef<HTMLButtonElement | null>(null);

  const [activeOperation, setActiveOperation] =
    useState<ProfileManagementOperation>(null);
  const [activeProfileKey, setActiveProfileKey] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] =
    useState<DeleteCandidate | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!deleteCandidate) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      cancelDeleteButtonRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [deleteCandidate]);

  useEffect(() => {
    const backgroundShell = backgroundShellRef.current;

    if (!backgroundShell) {
      return;
    }

    if (deleteCandidate) {
      backgroundShell.setAttribute("inert", "");
    } else {
      backgroundShell.removeAttribute("inert");
    }

    return () => {
      backgroundShell.removeAttribute("inert");
    };
  }, [deleteCandidate]);

  const showToast = (notice: string) => {
    if (!mountedRef.current) {
      return;
    }

    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    setToastNotice(notice);
    toastTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setToastNotice(null);
      }
    }, 5000);
  };

  const runOperation = async (
    operation: Exclude<ProfileManagementOperation, null>,
    callback: () => void | Promise<void>,
    errorNotice: string,
    profileKey: string | null = null,
    onResolved?: () => void,
  ) => {
    if (inFlightRef.current !== null) {
      return;
    }

    inFlightRef.current = { operation, profileKey };
    setActiveOperation(operation);
    setActiveProfileKey(profileKey);

    try {
      await callback();

      if (mountedRef.current) {
        onResolved?.();
      }
    } catch {
      showToast(errorNotice);
    } finally {
      if (mountedRef.current) {
        inFlightRef.current = null;
        setActiveOperation(null);
        setActiveProfileKey(null);
      }
    }
  };

  const isDeleteOperationPending = () => (
    inFlightRef.current?.operation === "delete-profile"
  );

  const closeDeleteDialog = (
    shouldRestoreFocus = true,
    force = false,
  ) => {
    if (isDeleteOperationPending() && !force) {
      return;
    }

    const focusTarget = deleteCandidate?.returnFocusTo ?? null;
    setDeleteCandidate(null);

    if (shouldRestoreFocus && focusTarget) {
      window.setTimeout(() => {
        focusTarget.focus();
      }, 0);
    }
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!deleteCandidate) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (!isDeleteOperationPending()) {
        closeDeleteDialog(true);
      }
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const resolvedState = isProfileSwitcherAndManagementState(state)
    ? state
    : "error";
  const hasUsableReport = hasUsableProfileSwitcherAndManagementReport(report);
  const shouldShowReadyError =
    resolvedState === "ready" && !hasUsableReport;
  const shouldShowError =
    resolvedState === "error" || shouldShowReadyError;
  const profiles = hasUsableReport ? report.profiles : [];
  const isEmptyState =
    resolvedState === "empty" ||
    (resolvedState === "ready" && hasUsableReport && profiles.length === 0);
  const currentDeleteProfile = resolveCurrentDeleteProfile(
    deleteCandidate,
    profiles,
  );
  const isConfirmDeletePending =
    activeOperation === "delete-profile" &&
    activeProfileKey === deleteCandidate?.profileKey;
  const canConfirmDelete =
    Boolean(deleteCandidate) &&
    Boolean(currentDeleteProfile) &&
    canDeleteProfiles &&
    currentDeleteProfile?.canDelete !== false &&
    Boolean(onDeleteProfile) &&
    inFlightRef.current === null;
  const deleteDialogActionAccessibleLabel = deleteCandidate
    ? getProfileActionAccessibleLabel(
        isConfirmDeletePending ? copy.deletingProfile : copy.deleteProfile,
        deleteCandidate.displayName,
      )
    : undefined;
  const profileGroups = profiles.reduce<
    Array<{ isActive: boolean; profiles: ManagedProfileSummary[] }>
  >((groups, profile) => {
    const latestGroup = groups[groups.length - 1];

    if (!latestGroup || latestGroup.isActive !== profile.isActive) {
      groups.push({
        isActive: profile.isActive,
        profiles: [profile],
      });
      return groups;
    }

    latestGroup.profiles.push(profile);
    return groups;
  }, []);

  const hasAnyOperation = activeOperation !== null;
  const canUseBack = canGoBack && !hasAnyOperation;

  useEffect(() => {
    if (
      deleteCandidate &&
      !currentDeleteProfile &&
      !isDeleteOperationPending()
    ) {
      closeDeleteDialog(true);
    }
  }, [currentDeleteProfile, deleteCandidate]);

  const handleBack = () => {
    if (!canGoBack || inFlightRef.current !== null) {
      return;
    }

    void runOperation("back", onBack, copy.backError);
  };

  const handleRetryLoad = () => {
    if (!onRetryLoad || inFlightRef.current !== null) {
      return;
    }

    void runOperation("retry-load", onRetryLoad, copy.retryError);
  };

  const handleAddProfile = () => {
    if (!canAddProfile || inFlightRef.current !== null) {
      return;
    }

    void runOperation("add-profile", onAddProfile, copy.addError);
  };

  const handleOpenSyncSettings = () => {
    if (
      !canOpenSyncSettings ||
      !onOpenSyncSettings ||
      inFlightRef.current !== null
    ) {
      return;
    }

    void runOperation(
      "open-sync-settings",
      onOpenSyncSettings,
      copy.syncError,
    );
  };

  const shell = (children: ReactNode) => (
    <main
      className="min-h-screen bg-[var(--dl-page)] px-4 py-5 text-[var(--dl-text-primary)] sm:px-6 lg:px-8"
      style={{ ...themeStyle, fontFamily: fonts.ui }}
    >
      <div
        aria-hidden={deleteCandidate ? true : undefined}
        data-testid="profile-management-background-shell"
        ref={backgroundShellRef}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <header className="grid min-h-[44px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <button
              className={`${focusRing} inline-flex min-h-[44px] items-center gap-2 justify-self-start rounded-full px-3 text-sm font-bold text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:opacity-70`}
              disabled={!canUseBack}
              onClick={handleBack}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              <span>
                {activeOperation === "back"
                  ? copy.backing
                  : canGoBack
                    ? copy.back
                    : copy.backBlocked}
              </span>
            </button>
            <div
              className="text-xl text-[var(--dl-bark)]"
              style={{ fontFamily: fonts.display }}
            >
              {copy.wordmark}
            </div>
          </header>
          {children}
        </div>
      </div>

      {toastNotice ? (
        <div
          aria-label={copy.toastLabel}
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-md rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-bark)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_44px_rgba(58,46,40,0.22)]"
          role="status"
        >
          {toastNotice}
        </div>
      ) : null}

      {deleteCandidate ? (
        <div className="fixed inset-0 z-20 flex items-end bg-[rgba(58,46,40,0.28)] px-4 py-5 sm:items-center sm:justify-center">
          <div
            aria-describedby="profile-delete-dialog-description"
            aria-labelledby="profile-delete-dialog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-[24px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-5 shadow-[0_24px_80px_rgba(58,46,40,0.24)]"
            onKeyDown={handleDialogKeyDown}
            ref={dialogRef}
            role="dialog"
          >
            <h2
              className="text-3xl leading-tight text-[var(--dl-text-primary)]"
              id="profile-delete-dialog-title"
              style={{ fontFamily: fonts.display }}
            >
              {copy.deleteDialogTitle}
            </h2>
            <p className="mt-3 text-base font-bold text-[var(--dl-bark)]">
              {deleteCandidate.displayName}
            </p>
            <p
              className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]"
              id="profile-delete-dialog-description"
            >
              {copy.deleteDialogSupporting}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                className={`${focusRing} min-h-[44px] rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-2 text-sm font-bold text-[var(--dl-bark)] hover:bg-[var(--dl-surface-soft)] disabled:cursor-not-allowed disabled:opacity-70`}
                disabled={isConfirmDeletePending}
                onClick={() => closeDeleteDialog(true)}
                ref={cancelDeleteButtonRef}
                type="button"
              >
                {copy.cancel}
              </button>
              <button
                aria-label={deleteDialogActionAccessibleLabel}
                className={`${focusRing} min-h-[44px] rounded-full bg-[var(--dl-error-text)] px-4 py-2 text-sm font-bold text-white shadow-[0_12px_30px_rgba(163,61,42,0.2)] disabled:cursor-not-allowed disabled:opacity-70`}
                disabled={!canConfirmDelete || isConfirmDeletePending}
                onClick={() => {
                  const profileToDelete = currentDeleteProfile;

                  if (
                    !canConfirmDelete ||
                    !profileToDelete ||
                    !onDeleteProfile ||
                    inFlightRef.current !== null
                  ) {
                    return;
                  }

                  void runOperation(
                    "delete-profile",
                    () => onDeleteProfile(profileToDelete.profileId),
                    copy.deleteError,
                    deleteCandidate.profileKey,
                    () => closeDeleteDialog(true, true),
                  );
                }}
                type="button"
              >
                {isConfirmDeletePending
                  ? copy.deletingProfile
                  : copy.deleteProfile}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );

  if (resolvedState === "loading") {
    return shell(
      <section
        aria-live="polite"
        className="rounded-[28px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-6"
        role="status"
      >
        <Eyebrow>{copy.contextLabel}</Eyebrow>
        <h1
          className="mt-4 text-4xl leading-tight text-[var(--dl-text-primary)]"
          style={{ fontFamily: fonts.display }}
        >
          {copy.loadingHeading}
        </h1>
        <p className="mt-3 max-w-xl text-base text-[var(--dl-text-secondary)]">
          {copy.loadingSupporting}
        </p>
      </section>,
    );
  }

  if (shouldShowError) {
    return shell(
      <>
        <section
          className="rounded-[28px] border border-[var(--dl-error-text)] bg-[var(--dl-error-surface)] p-6 text-[var(--dl-error-text)]"
          role="alert"
        >
          <h1
            className="text-4xl leading-tight"
            style={{ fontFamily: fonts.display }}
          >
            {copy.errorHeading}
          </h1>
          <p className="mt-3 max-w-xl text-sm font-semibold">
            {copy.errorSupporting}
          </p>
        </section>
        {onRetryLoad ? (
          <div>
            <SecondaryButton
              activeOperation={activeOperation}
              activeProfileKey={activeProfileKey}
              blocked={false}
              blockedLabel={copy.retry}
              label={copy.retry}
              onClick={handleRetryLoad}
              operation="retry-load"
              pendingLabel={copy.retrying}
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
            </SecondaryButton>
          </div>
        ) : null}
      </>,
    );
  }

  const profileLimitLabel = report?.profileLimitLabel?.trim();
  const helperLabel = report?.helperLabel?.trim() || copy.localFirst;

  return shell(
    <>
      <section className="rounded-[28px] border border-[var(--dl-border-subtle)] bg-[linear-gradient(135deg,var(--dl-surface),var(--dl-blush)_58%,var(--dl-parchment))] p-6">
        <Eyebrow>{copy.contextLabel}</Eyebrow>
        <h1
          className="mt-4 text-4xl leading-tight text-[var(--dl-text-primary)] sm:text-5xl"
          style={{ fontFamily: fonts.display }}
        >
          {copy.heading}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--dl-text-secondary)]">
          {copy.supporting}
        </p>
        <p className="mt-4 rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] px-4 py-3 text-sm font-semibold text-[var(--dl-bark)]">
          {helperLabel}
        </p>
      </section>

      {isOffline ? (
        <div
          aria-live="polite"
          className="rounded-[18px] border border-[var(--dl-warning-text)] bg-[var(--dl-warning-surface)] px-4 py-3 text-sm font-semibold text-[var(--dl-warning-text)]"
          role="status"
        >
          {copy.offline}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="flex flex-col gap-5">
          {isEmptyState ? (
            <SectionCard>
              <h2
                className="text-3xl text-[var(--dl-text-primary)]"
                style={{ fontFamily: fonts.display }}
              >
                {copy.emptyHeading}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
                {copy.emptySupporting}
              </p>
            </SectionCard>
          ) : null}

          {!isEmptyState
            ? profileGroups.map((group, index) => (
                <ProfileSection
                  activeOperation={activeOperation}
                  activeProfileKey={activeProfileKey}
                  canDeleteProfiles={canDeleteProfiles}
                  canEditProfiles={canEditProfiles}
                  canSelectProfiles={canSelectProfiles}
                  key={`${group.isActive ? "active" : "other"}-${index}`}
                  onDeleteProfile={onDeleteProfile}
                  onEditProfile={onEditProfile}
                  onOpenDeleteDialog={(candidate) => setDeleteCandidate(candidate)}
                  onSelectProfile={onSelectProfile}
                  profiles={group.profiles}
                  sectionTitle={
                    group.isActive ? copy.activeProfiles : copy.otherProfiles
                  }
                  sourceProfiles={profiles}
                  runOperation={runOperation}
                />
              ))
            : null}
        </div>

        <div className="flex flex-col gap-5">
          <SectionCard className="bg-[linear-gradient(180deg,var(--dl-surface),var(--dl-surface-soft))]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-bark)]">
                <Plus aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2
                  className="text-2xl text-[var(--dl-text-primary)]"
                  style={{ fontFamily: fonts.display }}
                >
                  {copy.addProfile}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
                  {copy.addProfileSupporting}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <PrimaryButton
                activeOperation={activeOperation}
                activeProfileKey={activeProfileKey}
                blocked={!canAddProfile}
                blockedLabel={copy.addProfileBlocked}
                label={copy.addProfile}
                onClick={handleAddProfile}
                operation="add-profile"
                pendingLabel={copy.addingProfile}
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
              </PrimaryButton>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--dl-parchment)] text-[var(--dl-bark)]">
                <Cloud aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2
                  className="text-2xl text-[var(--dl-text-primary)]"
                  style={{ fontFamily: fonts.display }}
                >
                  {copy.syncTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
                  {copy.syncSupporting}
                </p>
                {report?.syncHelperLabel ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--dl-text-secondary)]">
                    {report.syncHelperLabel}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-5">
              <SecondaryButton
                activeOperation={activeOperation}
                activeProfileKey={activeProfileKey}
                blocked={!canOpenSyncSettings || !onOpenSyncSettings}
                blockedLabel={copy.syncBlocked}
                label={copy.manageSync}
                onClick={handleOpenSyncSettings}
                operation="open-sync-settings"
                pendingLabel={copy.openingSync}
              />
            </div>
          </SectionCard>

          {profileLimitLabel ? (
            <p className="rounded-[18px] border border-[var(--dl-border-subtle)] bg-[var(--dl-parchment)] px-4 py-3 text-sm font-semibold text-[var(--dl-text-secondary)]">
              {profileLimitLabel}
            </p>
          ) : null}
        </div>
      </div>
    </>,
  );
}

function ProfileSection({
  activeOperation,
  activeProfileKey,
  canDeleteProfiles,
  canEditProfiles,
  canSelectProfiles,
  onDeleteProfile,
  onEditProfile,
  onOpenDeleteDialog,
  onSelectProfile,
  profiles,
  sectionTitle,
  sourceProfiles,
  runOperation,
}: {
  activeOperation: ProfileManagementOperation;
  activeProfileKey: string | null;
  canDeleteProfiles: boolean;
  canEditProfiles: boolean;
  canSelectProfiles: boolean;
  onDeleteProfile?: (profileId: string) => void | Promise<void>;
  onEditProfile?: (profileId: string) => void | Promise<void>;
  onOpenDeleteDialog: (candidate: DeleteCandidate) => void;
  onSelectProfile?: (profileId: string) => void | Promise<void>;
  profiles: ManagedProfileSummary[];
  sectionTitle: string;
  sourceProfiles: ManagedProfileSummary[];
  runOperation: (
    operation: Exclude<ProfileManagementOperation, null>,
    callback: () => void | Promise<void>,
    errorNotice: string,
    profileKey?: string | null,
    onResolved?: () => void,
  ) => Promise<void>;
}) {
  if (profiles.length === 0) {
    return null;
  }

  return (
    <section>
      <h2
        className="text-3xl text-[var(--dl-text-primary)]"
        style={{ fontFamily: fonts.display }}
      >
        {sectionTitle}
      </h2>
      <div className="mt-3 grid gap-3">
        {profiles.map((profile) => {
          const profileKey = String(sourceProfiles.indexOf(profile));

          return (
            <ProfileCard
              activeOperation={activeOperation}
              activeProfileKey={activeProfileKey}
              canDeleteProfiles={canDeleteProfiles}
              canEditProfiles={canEditProfiles}
              canSelectProfiles={canSelectProfiles}
              key={`${profileKey}-${profile.isActive ? "active" : "profile"}`}
              onDeleteProfile={onDeleteProfile}
              onEditProfile={onEditProfile}
              onOpenDeleteDialog={onOpenDeleteDialog}
              onSelectProfile={onSelectProfile}
              profile={profile}
              profileKey={profileKey}
              runOperation={runOperation}
            />
          );
        })}
      </div>
    </section>
  );
}

function ProfileCard({
  activeOperation,
  activeProfileKey,
  canDeleteProfiles,
  canEditProfiles,
  canSelectProfiles,
  onDeleteProfile,
  onEditProfile,
  onOpenDeleteDialog,
  onSelectProfile,
  profile,
  profileKey,
  runOperation,
}: {
  activeOperation: ProfileManagementOperation;
  activeProfileKey: string | null;
  canDeleteProfiles: boolean;
  canEditProfiles: boolean;
  canSelectProfiles: boolean;
  onDeleteProfile?: (profileId: string) => void | Promise<void>;
  onEditProfile?: (profileId: string) => void | Promise<void>;
  onOpenDeleteDialog: (candidate: DeleteCandidate) => void;
  onSelectProfile?: (profileId: string) => void | Promise<void>;
  profile: ManagedProfileSummary;
  profileKey: string;
  runOperation: (
    operation: Exclude<ProfileManagementOperation, null>,
    callback: () => void | Promise<void>,
    errorNotice: string,
    profileKey?: string | null,
    onResolved?: () => void,
  ) => Promise<void>;
}) {
  const displayName = getSafeDisplayName(profile);
  const hasUsableRoute = hasUsableProfileRoute(profile);
  const canUseSelect =
    !profile.isActive &&
    canSelectProfiles &&
    profile.canSelect !== false &&
    Boolean(onSelectProfile) &&
    hasUsableRoute;
  const canUseEdit =
    canEditProfiles &&
    profile.canEdit !== false &&
    Boolean(onEditProfile) &&
    hasUsableRoute;
  const canUseDelete =
    canDeleteProfiles &&
    profile.canDelete !== false &&
    Boolean(onDeleteProfile) &&
    hasUsableRoute;
  const deleteBlockedLabel =
    profile.canDelete === false && isNonWhitespaceString(profile.deleteBlockLabel)
      ? profile.deleteBlockLabel
      : copy.deleteBlocked;
  const selectBlocked = !canUseSelect;
  const editBlocked = !canUseEdit;
  const deleteBlocked = !canUseDelete;
  const selectAccessibleLabel = getProfileActionAccessibleLabel(
    getActionVisibleLabel({
      activeOperation,
      activeProfileKey,
      blocked: selectBlocked,
      blockedLabel: copy.selectBlocked,
      label: copy.selectProfile,
      operation: "select-profile",
      pendingLabel: copy.selectingProfile,
      profileKey,
    }),
    displayName,
  );
  const editAccessibleLabel = getProfileActionAccessibleLabel(
    getActionVisibleLabel({
      activeOperation,
      activeProfileKey,
      blocked: editBlocked,
      blockedLabel: copy.editBlocked,
      label: copy.editProfile,
      operation: "edit-profile",
      pendingLabel: copy.editingProfile,
      profileKey,
    }),
    displayName,
  );
  const deleteAccessibleLabel = getProfileActionAccessibleLabel(
    getActionVisibleLabel({
      activeOperation,
      activeProfileKey,
      blocked: deleteBlocked,
      blockedLabel: deleteBlockedLabel,
      label: copy.deleteProfile,
      operation: "delete-profile",
      pendingLabel: copy.deletingProfile,
      profileKey,
    }),
    displayName,
  );

  return (
    <article
      className="rounded-[22px] border border-[var(--dl-border-subtle)] bg-[var(--dl-surface)] p-4 shadow-[0_10px_30px_rgba(92,74,66,0.06)]"
      data-testid="profile-card"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blush)] text-[var(--dl-bark)]">
          <span
            className="text-2xl"
            style={{ fontFamily: fonts.display }}
          >
            {getInitials(displayName)}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold leading-6 text-[var(--dl-text-primary)]">
              {displayName}
            </h3>
            {profile.isActive ? (
              <span className="rounded-full border border-[var(--dl-border-subtle)] bg-[var(--dl-parchment)] px-3 py-1 text-xs font-bold text-[var(--dl-bark)]">
                {copy.activeBadge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
            {profile.syncLabel}
          </p>
          {profile.supporting ? (
            <p className="mt-1 text-sm leading-6 text-[var(--dl-text-secondary)]">
              {profile.supporting}
            </p>
          ) : null}
          {profile.latestSnapshotLabel ? (
            <p className="mt-2 inline-flex rounded-full bg-[var(--dl-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--dl-text-secondary)]">
              {copy.latestSnapshot}: {profile.latestSnapshotLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--dl-border-subtle)] pt-4">
        {!profile.isActive ? (
          <SecondaryButton
            activeOperation={activeOperation}
            activeProfileKey={activeProfileKey}
            accessibleLabel={selectAccessibleLabel}
            blocked={selectBlocked}
            blockedLabel={copy.selectBlocked}
            label={copy.selectProfile}
            onClick={() => {
              if (!canUseSelect || !onSelectProfile) {
                return;
              }

              void runOperation(
                "select-profile",
                () => onSelectProfile(profile.profileId),
                copy.selectError,
                profileKey,
              );
            }}
            operation="select-profile"
            pendingLabel={copy.selectingProfile}
            profileKey={profileKey}
          >
            <UserRound aria-hidden="true" className="h-4 w-4" />
          </SecondaryButton>
        ) : null}

        <SecondaryButton
          activeOperation={activeOperation}
          activeProfileKey={activeProfileKey}
          accessibleLabel={editAccessibleLabel}
          blocked={editBlocked}
          blockedLabel={copy.editBlocked}
          label={copy.editProfile}
          onClick={() => {
            if (!canUseEdit || !onEditProfile) {
              return;
            }

            void runOperation(
              "edit-profile",
              () => onEditProfile(profile.profileId),
              copy.editError,
              profileKey,
            );
          }}
          operation="edit-profile"
          pendingLabel={copy.editingProfile}
          profileKey={profileKey}
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
        </SecondaryButton>

        <TextButton
          activeOperation={activeOperation}
          activeProfileKey={activeProfileKey}
          accessibleLabel={deleteAccessibleLabel}
          blocked={deleteBlocked}
          blockedLabel={deleteBlockedLabel}
          label={copy.deleteProfile}
          onClick={() => {
            if (!canUseDelete) {
              return;
            }

            onOpenDeleteDialog({
              displayName,
              profile,
              profileKey,
              returnFocusTo: document.activeElement instanceof HTMLButtonElement
                ? document.activeElement
                : null,
            });
          }}
          operation="delete-profile"
          pendingLabel={copy.deletingProfile}
          profileKey={profileKey}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </TextButton>
      </div>
    </article>
  );
}
