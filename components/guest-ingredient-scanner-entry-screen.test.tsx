import "@testing-library/jest-dom/vitest";

import { StrictMode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import GuestIngredientScannerEntryScreen, {
  copy,
  getIngredientScannerSubmission,
  isGuestIngredientScannerEntryState,
  type GuestIngredientScannerEntryReport,
  type GuestIngredientScannerEntryScreenProps,
} from "./guest-ingredient-scanner-entry-screen";

const opaqueProfileId = "profile-secret-amara";

const selectedProfile = {
  profileId: opaqueProfileId,
  displayName: "Amara",
  contextLabel: "Host context: sensitive skin routine",
};

const defaultReport: GuestIngredientScannerEntryReport = {
  helperLabel: "Host helper: choose how to provide the ingredient list.",
  privacyLabel: copy.privacyFallback,
  photoTips: [
    "Place the label on a flat surface.",
    "Keep the whole ingredient list visible.",
  ],
};

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function createProps(
  overrides: Partial<GuestIngredientScannerEntryScreenProps> = {},
): GuestIngredientScannerEntryScreenProps {
  return {
    report: defaultReport,
    onBack: vi.fn(),
    onTakePhoto: vi.fn(),
    onChoosePhoto: vi.fn(),
    onEnterIngredientsManually: vi.fn(),
    ...overrides,
  };
}

function renderScreen(
  overrides: Partial<GuestIngredientScannerEntryScreenProps> = {},
) {
  return render(
    <GuestIngredientScannerEntryScreen {...createProps(overrides)} />,
  );
}

function renderStrictScreen(
  overrides: Partial<GuestIngredientScannerEntryScreenProps> = {},
) {
  return render(
    <StrictMode>
      <GuestIngredientScannerEntryScreen {...createProps(overrides)} />
    </StrictMode>,
  );
}

function expectOpaqueProfileIdNotRendered(container: HTMLElement) {
  expect(container.textContent).not.toContain(opaqueProfileId);
  expect(container.innerHTML).not.toContain(opaqueProfileId);
}

function getButton(name: string) {
  return screen.getByRole("button", { name });
}

function expectTextOrder(...items: string[]) {
  const bodyText = document.body.textContent ?? "";
  let previousIndex = -1;

  for (const item of items) {
    const nextIndex = bodyText.indexOf(item);
    expect(nextIndex).toBeGreaterThan(previousIndex);
    previousIndex = nextIndex;
  }
}

type MethodCase = {
  blockedLabel: string;
  callbackProp:
    | "onTakePhoto"
    | "onChoosePhoto"
    | "onEnterIngredientsManually";
  label: string;
  offlineBlockedLabel: string;
  offlineAvailabilityProp:
    | "isTakePhotoAvailableOffline"
    | "isChoosePhotoAvailableOffline"
    | "isManualEntryAvailableOffline";
  pendingLabel: string;
  unavailableProp:
    | "canTakePhoto"
    | "canChoosePhoto"
    | "canEnterIngredientsManually";
};

const methodCases: MethodCase[] = [
  {
    blockedLabel: copy.takePhotoBlocked,
    callbackProp: "onTakePhoto",
    label: copy.takePhoto,
    offlineAvailabilityProp: "isTakePhotoAvailableOffline",
    offlineBlockedLabel: copy.takePhotoOfflineBlocked,
    pendingLabel: copy.takingPhoto,
    unavailableProp: "canTakePhoto",
  },
  {
    blockedLabel: copy.choosePhotoBlocked,
    callbackProp: "onChoosePhoto",
    label: copy.choosePhoto,
    offlineAvailabilityProp: "isChoosePhotoAvailableOffline",
    offlineBlockedLabel: copy.choosePhotoOfflineBlocked,
    pendingLabel: copy.choosingPhoto,
    unavailableProp: "canChoosePhoto",
  },
  {
    blockedLabel: copy.manualEntryBlocked,
    callbackProp: "onEnterIngredientsManually",
    label: copy.manualEntry,
    offlineAvailabilityProp: "isManualEntryAvailableOffline",
    offlineBlockedLabel: copy.manualEntryOfflineBlocked,
    pendingLabel: copy.enteringManually,
    unavailableProp: "canEnterIngredientsManually",
  },
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("GuestIngredientScannerEntryScreen core states", () => {
  it("recognises only supported runtime states", () => {
    expect(isGuestIngredientScannerEntryState("loading")).toBe(true);
    expect(isGuestIngredientScannerEntryState("ready")).toBe(true);
    expect(isGuestIngredientScannerEntryState("error")).toBe(true);
    expect(isGuestIngredientScannerEntryState("empty")).toBe(false);
    expect(isGuestIngredientScannerEntryState("blocked")).toBe(false);
  });

  it("renders the loading heading with polite static-only status semantics", () => {
    renderScreen({ state: "loading" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.loadingHeading,
      }),
    ).toBeVisible();

    const loadingStatus = screen.getByRole("status");
    expect(loadingStatus).toHaveAttribute("aria-live", "polite");
    expect(loadingStatus).toHaveTextContent(copy.loadingSupporting);
    expect(within(loadingStatus).queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps Back outside the loading live region", () => {
    renderScreen({ state: "loading" });

    const loadingStatus = screen.getByRole("status");
    expect(screen.getByRole("button", { name: copy.back })).toBeVisible();
    expect(within(loadingStatus).queryByRole("button", { name: copy.back }))
      .not.toBeInTheDocument();
  });

  it("renders a guest-ready experience with a null report", () => {
    renderScreen({ report: null, state: "ready" });

    expect(
      screen.getByRole("heading", { level: 1, name: copy.heading }),
    ).toBeVisible();
    expect(screen.getByText(copy.noProfileSelected)).toBeVisible();
    expect(getButton(copy.takePhoto)).toBeEnabled();
  });

  it("renders exactly one h1", () => {
    renderScreen();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("keeps ready offline content in mobile and assistive reading order", () => {
    renderScreen({
      isOffline: true,
      report: {
        helperLabel: "Host helper label",
        photoTips: ["Host photo tip"],
        privacyLabel: "Host privacy label",
      },
    });

    expectTextOrder(
      copy.heading,
      copy.supporting,
      copy.offline,
      copy.noAccountTitle,
      "Host privacy label",
      copy.methodHeading,
      copy.optionalProfileTitle,
      copy.photoTipsHeading,
    );
    expect(screen.getAllByText(copy.offline)).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders the error state with Retry only when supplied", () => {
    const retry = vi.fn();
    renderScreen({ onRetryLoad: retry, state: "error" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(copy.errorSupporting);
    expect(getButton(copy.retry)).toBeVisible();

    cleanup();
    renderScreen({ onRetryLoad: undefined, state: "error" });
    expect(screen.queryByRole("button", { name: copy.retry }))
      .not.toBeInTheDocument();
  });

  it("protects Retry with pending label, duplicate guard, and toast recovery", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const retry = vi.fn(() => deferred.promise);
    renderScreen({ onRetryLoad: retry, state: "error" });

    await user.click(getButton(copy.retry));
    await user.click(getButton(copy.retrying));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(getButton(copy.retrying)).toBeDisabled();

    deferred.reject(new Error("retry failed"));
    expect(await screen.findByText(copy.retryError)).toBeVisible();
  });

  it("fails closed to the error experience for unknown runtime state", () => {
    renderScreen({
      state: "unexpected" as unknown as GuestIngredientScannerEntryScreenProps["state"],
    });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();
  });

  it("invokes Back only on explicit activation", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const { rerender } = renderScreen({ onBack });

    expect(onBack).not.toHaveBeenCalled();

    rerender(
      <GuestIngredientScannerEntryScreen
        {...createProps({
          onBack,
          report: {
            helperLabel: "Updated host helper.",
          },
        })}
      />,
    );
    expect(onBack).not.toHaveBeenCalled();

    await user.click(getButton(copy.back));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("protects Back pending and duplicate activation while disabling scanner methods", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onBack = vi.fn(() => deferred.promise);
    renderScreen({ onBack });

    await user.click(getButton(copy.back));
    await user.click(getButton(copy.backing));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(getButton(copy.backing)).toBeDisabled();
    expect(getButton(copy.takePhoto)).toBeDisabled();
    expect(getButton(copy.choosePhoto)).toBeDisabled();
    expect(getButton(copy.manualEntry)).toBeDisabled();

    deferred.resolve();
    await waitFor(() => expect(getButton(copy.back)).toBeEnabled());
  });

  it("keeps host-blocked Back visible, disabled, and programmatically guarded", () => {
    const onBack = vi.fn();
    renderScreen({
      canGoBack: false,
      onBack,
    });

    const backButton = getButton(copy.backBlocked);
    expect(backButton).toBeDisabled();
    backButton.removeAttribute("disabled");
    fireEvent.click(backButton);

    expect(onBack).not.toHaveBeenCalled();
  });

  it("converts Back rejection into a non-blocking toast", async () => {
    const user = userEvent.setup();
    renderScreen({
      onBack: vi.fn(() => Promise.reject(new Error("back failed"))),
    });

    await user.click(getButton(copy.back));

    expect(await screen.findByText(copy.backError)).toBeVisible();
    expect(getButton(copy.takePhoto)).toBeEnabled();
  });
});

describe("GuestIngredientScannerEntryScreen trust copy", () => {
  it("renders no-account and review-before-guidance positioning", () => {
    renderScreen();

    expect(screen.getByText(copy.noAccountTitle)).toBeVisible();
    expect(screen.getByText(copy.noAccountSupporting)).toBeVisible();
    expect(screen.getByText(copy.privacyFallback)).toBeVisible();
  });

  it("does not force sign-in, account creation, facial analysis, or store entry", () => {
    const { container } = renderScreen();
    const text = container.textContent?.toLowerCase() ?? "";

    expect(text).toContain("without signing in");
    expect(text).toContain("without");
    expect(text).not.toContain("create account");
    expect(text).not.toContain("sign in to continue");
    expect(text).not.toContain("facial analysis required");
    expect(text).not.toContain("store");
    expect(text).not.toContain("diagnosis");
    expect(text).not.toContain("treatment");
  });
});

describe("GuestIngredientScannerEntryScreen scanner submissions", () => {
  it("builds guest and profile submissions defensively", () => {
    expect(getIngredientScannerSubmission(null)).toEqual({});
    expect(getIngredientScannerSubmission(defaultReport)).toEqual({});
    expect(
      getIngredientScannerSubmission({
        selectedProfile,
      }),
    ).toEqual({ profileId: opaqueProfileId });
  });

  it("submits guest payloads for each scanner method", async () => {
    const user = userEvent.setup();
    const onTakePhoto = vi.fn();
    const onChoosePhoto = vi.fn();
    const onEnterIngredientsManually = vi.fn();
    renderScreen({
      report: null,
      onChoosePhoto,
      onEnterIngredientsManually,
      onTakePhoto,
    });

    await user.click(getButton(copy.takePhoto));
    await user.click(getButton(copy.choosePhoto));
    await user.click(getButton(copy.manualEntry));

    expect(onTakePhoto).toHaveBeenCalledWith({});
    expect(onChoosePhoto).toHaveBeenCalledWith({});
    expect(onEnterIngredientsManually).toHaveBeenCalledWith({});
  });

  it("submits a valid selected profile ID without rendering it", async () => {
    const user = userEvent.setup();
    const onTakePhoto = vi.fn();
    const { container } = renderScreen({
      report: { selectedProfile },
      onTakePhoto,
    });

    await user.click(getButton(copy.takePhoto));

    expect(onTakePhoto).toHaveBeenCalledWith({ profileId: opaqueProfileId });
    expectOpaqueProfileIdNotRendered(container);
  });

  it("falls back to guest payloads for blank and whitespace profile IDs", async () => {
    const user = userEvent.setup();
    const blank = vi.fn();
    const whitespace = vi.fn();

    const { rerender } = renderScreen({
      report: {
        selectedProfile: {
          ...selectedProfile,
          profileId: "",
        },
      },
      onTakePhoto: blank,
    });
    await user.click(getButton(copy.takePhoto));
    expect(blank).toHaveBeenCalledWith({});

    rerender(
      <GuestIngredientScannerEntryScreen
        {...createProps({
          report: {
            selectedProfile: {
              ...selectedProfile,
              profileId: "   ",
            },
          },
          onTakePhoto: whitespace,
        })}
      />,
    );
    await user.click(getButton(copy.takePhoto));
    expect(whitespace).toHaveBeenCalledWith({});
  });

  it.each(["", "   "])(
    "falls back to guest payloads for every method with malformed profile ID %j",
    async (profileId) => {
      const user = userEvent.setup();
      const onTakePhoto = vi.fn();
      const onChoosePhoto = vi.fn();
      const onEnterIngredientsManually = vi.fn();
      const { container } = renderScreen({
        report: {
          selectedProfile: {
            ...selectedProfile,
            profileId,
          },
        },
        onChoosePhoto,
        onEnterIngredientsManually,
        onTakePhoto,
      });

      await user.click(getButton(copy.takePhoto));
      await user.click(getButton(copy.choosePhoto));
      await user.click(getButton(copy.manualEntry));

      expect(onTakePhoto).toHaveBeenCalledWith({});
      expect(onChoosePhoto).toHaveBeenCalledWith({});
      expect(onEnterIngredientsManually).toHaveBeenCalledWith({});
      for (const callback of [
        onTakePhoto,
        onChoosePhoto,
        onEnterIngredientsManually,
      ]) {
        expect(callback).not.toHaveBeenCalledWith({
          profileId,
        });
        expect(Object.keys(callback.mock.calls[0][0])).toEqual([]);
      }
      expect(screen.getByText(copy.malformedProfile)).toBeVisible();
      expect(container.textContent).not.toContain("profile-secret");
    },
  );

  it("does not activate callbacks on mount or rerender", () => {
    const onTakePhoto = vi.fn();
    const onChoosePhoto = vi.fn();
    const onEnterIngredientsManually = vi.fn();
    const { rerender } = renderScreen({
      onChoosePhoto,
      onEnterIngredientsManually,
      onTakePhoto,
    });

    rerender(
      <GuestIngredientScannerEntryScreen
        {...createProps({
          onChoosePhoto,
          onEnterIngredientsManually,
          onTakePhoto,
          report: {
            helperLabel: "Updated host helper.",
          },
        })}
      />,
    );

    expect(onTakePhoto).not.toHaveBeenCalled();
    expect(onChoosePhoto).not.toHaveBeenCalled();
    expect(onEnterIngredientsManually).not.toHaveBeenCalled();
  });
});

describe("GuestIngredientScannerEntryScreen scanner-method async behaviour", () => {
  it.each(methodCases)(
    "shows pending state and blocks duplicate %s activation",
    async ({ callbackProp, label, pendingLabel }) => {
      const user = userEvent.setup();
      const deferred = createDeferred();
      const callback = vi.fn(() => deferred.promise);
      renderScreen({ [callbackProp]: callback });

      await user.click(getButton(label));
      await user.click(getButton(pendingLabel));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(getButton(pendingLabel)).toBeDisabled();

      deferred.resolve();
      await waitFor(() => expect(getButton(label)).toBeEnabled());
    },
  );

  it.each(methodCases)(
    "disables conflicting controls while %s is pending",
    async ({ callbackProp, label, pendingLabel }) => {
      const user = userEvent.setup();
      const deferred = createDeferred();
      renderScreen({ [callbackProp]: vi.fn(() => deferred.promise) });

      await user.click(getButton(label));

      expect(getButton(pendingLabel)).toBeDisabled();
      expect(getButton(copy.back)).toBeDisabled();
      for (const otherMethod of methodCases) {
        if (otherMethod.pendingLabel !== pendingLabel) {
          expect(getButton(otherMethod.label)).toBeDisabled();
        }
      }

      deferred.resolve();
    },
  );

  it.each(methodCases)(
    "converts %s callback rejection into a toast",
    async ({ callbackProp, label }) => {
      const user = userEvent.setup();
      const callback = vi.fn(() => Promise.reject(new Error("route failed")));
      renderScreen({ [callbackProp]: callback });

      await user.click(getButton(label));

      expect(await screen.findByText(/Please try again\./)).toBeVisible();
    },
  );

  it.each(methodCases)(
    "guards %s when host availability blocks it",
    ({ blockedLabel, callbackProp, unavailableProp }) => {
      const callback = vi.fn();
      renderScreen({
        [callbackProp]: callback,
        [unavailableProp]: false,
      });

      const button = getButton(blockedLabel);
      expect(button).toBeDisabled();
      button.removeAttribute("disabled");
      fireEvent.click(button);

      expect(callback).not.toHaveBeenCalled();
    },
  );

  it.each(methodCases)(
    "prefers the general unavailable label over reconnect copy for %s",
    ({
      blockedLabel,
      callbackProp,
      offlineAvailabilityProp,
      unavailableProp,
    }) => {
      const callback = vi.fn();
      renderScreen({
        [callbackProp]: callback,
        [offlineAvailabilityProp]: false,
        [unavailableProp]: false,
        isOffline: true,
      });

      const button = getButton(blockedLabel);
      expect(button).toBeVisible();
      expect(button).toBeDisabled();
      button.removeAttribute("disabled");
      fireEvent.click(button);

      expect(callback).not.toHaveBeenCalled();
    },
  );
});

describe("GuestIngredientScannerEntryScreen offline behaviour", () => {
  it("shows an informational offline banner and keeps profile context readable", () => {
    renderScreen({
      isOffline: true,
      report: { selectedProfile },
    });

    expect(screen.getByRole("status", { name: "" })).toHaveTextContent(copy.offline);
    expect(screen.getByText("Amara")).toBeVisible();
  });

  it("keeps methods enabled offline when host flags allow them", () => {
    renderScreen({
      isChoosePhotoAvailableOffline: true,
      isManualEntryAvailableOffline: true,
      isOffline: true,
      isTakePhotoAvailableOffline: true,
    });

    expect(getButton(copy.takePhoto)).toBeEnabled();
    expect(getButton(copy.choosePhoto)).toBeEnabled();
    expect(getButton(copy.manualEntry)).toBeEnabled();
  });

  it("uses method-specific offline blocked labels", () => {
    renderScreen({ isOffline: true });

    expect(getButton(copy.takePhotoOfflineBlocked)).toBeDisabled();
    expect(getButton(copy.choosePhotoOfflineBlocked)).toBeDisabled();
    expect(getButton(copy.manualEntryOfflineBlocked)).toBeDisabled();
  });

  it("does not automatically disable every route while offline", () => {
    renderScreen({
      isChoosePhotoAvailableOffline: false,
      isManualEntryAvailableOffline: true,
      isOffline: true,
      isTakePhotoAvailableOffline: true,
    });

    expect(getButton(copy.takePhoto)).toBeEnabled();
    expect(getButton(copy.choosePhotoOfflineBlocked)).toBeDisabled();
    expect(getButton(copy.manualEntry)).toBeEnabled();
  });
});

describe("GuestIngredientScannerEntryScreen optional profile", () => {
  it("renders the no-profile state and hides Change profile without a route", () => {
    renderScreen({ report: null });

    expect(screen.getByText(copy.noProfileSelected)).toBeVisible();
    expect(screen.getByText(copy.profileOptional)).toBeVisible();
    expect(screen.queryByRole("button", { name: copy.changeProfile }))
      .not.toBeInTheDocument();
  });

  it("shows Change profile for guest mode when the host supplies a route", () => {
    renderScreen({
      onChangeProfile: vi.fn(),
      report: null,
    });

    expect(getButton(copy.changeProfile)).toBeEnabled();
  });

  it("renders selected profile state and host context label unchanged", () => {
    renderScreen({ report: { selectedProfile } });

    expect(screen.getByText("Amara")).toBeVisible();
    expect(screen.getByText(selectedProfile.contextLabel)).toBeVisible();
  });

  it("uses safe profile names for blank and non-string display names", () => {
    const { rerender } = renderScreen({
      report: {
        selectedProfile: {
          ...selectedProfile,
          displayName: "   ",
        },
      },
    });

    expect(screen.getByText(copy.unnamedProfile)).toBeVisible();

    rerender(
      <GuestIngredientScannerEntryScreen
        {...createProps({
          report: {
            selectedProfile: {
              ...selectedProfile,
              displayName: 42 as unknown as string,
            },
          },
        })}
      />,
    );

    expect(screen.getByText(copy.unnamedProfile)).toBeVisible();
  });

  it("invokes Change profile and handles callback absence or host block", async () => {
    const user = userEvent.setup();
    const onChangeProfile = vi.fn();
    const { rerender } = renderScreen({
      onChangeProfile,
      report: { selectedProfile },
    });

    await user.click(getButton(copy.changeProfile));
    expect(onChangeProfile).toHaveBeenCalledTimes(1);

    rerender(
      <GuestIngredientScannerEntryScreen
        {...createProps({
          onChangeProfile: undefined,
          report: { selectedProfile },
        })}
      />,
    );
    expect(getButton(copy.changeProfileBlocked)).toBeDisabled();

    rerender(
      <GuestIngredientScannerEntryScreen
        {...createProps({
          canChangeProfile: false,
          onChangeProfile,
          report: { selectedProfile },
        })}
      />,
    );
    expect(getButton(copy.changeProfileBlocked)).toBeDisabled();
  });

  it("converts Change-profile rejection into a toast", async () => {
    const user = userEvent.setup();
    renderScreen({
      onChangeProfile: vi.fn(() => Promise.reject(new Error("blocked"))),
      report: { selectedProfile },
    });

    await user.click(getButton(copy.changeProfile));

    expect(await screen.findByText(copy.changeProfileError)).toBeVisible();
  });

  it("supports Scan without a profile with pending, duplicate guard, and no local clearing", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onContinueWithoutProfile = vi.fn(() => deferred.promise);
    renderScreen({
      onContinueWithoutProfile,
      report: { selectedProfile },
    });

    await user.click(getButton(copy.continueWithoutProfile));
    await user.click(getButton(copy.continuingWithoutProfile));

    expect(onContinueWithoutProfile).toHaveBeenCalledTimes(1);
    expect(getButton(copy.continuingWithoutProfile)).toBeDisabled();

    deferred.resolve();
    await waitFor(() => expect(getButton(copy.continueWithoutProfile)).toBeEnabled());
    expect(screen.getByText("Amara")).toBeVisible();
  });

  it("supports guest-mode blocked and rejection states", async () => {
    const user = userEvent.setup();
    const onContinueWithoutProfile = vi.fn();
    const { rerender } = renderScreen({
      canContinueWithoutProfile: false,
      onContinueWithoutProfile,
      report: { selectedProfile },
    });

    expect(getButton(copy.guestModeBlocked)).toBeDisabled();

    rerender(
      <GuestIngredientScannerEntryScreen
        {...createProps({
          onContinueWithoutProfile: vi.fn(() => Promise.reject(new Error("guest failed"))),
          report: { selectedProfile },
        })}
      />,
    );
    await user.click(getButton(copy.continueWithoutProfile));
    expect(await screen.findByText(copy.continueWithoutProfileError)).toBeVisible();
  });

  it("renders readable unavailable context for malformed profile IDs", () => {
    renderScreen({
      report: {
        selectedProfile: {
          ...selectedProfile,
          profileId: "   ",
        },
      },
    });

    expect(screen.getByText(copy.malformedProfile)).toBeVisible();
  });
});

describe("GuestIngredientScannerEntryScreen photo tips", () => {
  it("renders usable tips in received order and omits whitespace-only entries", () => {
    renderScreen({
      report: {
        photoTips: [
          "First host tip",
          "   ",
          "Second host tip",
        ],
      },
    });

    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent))
      .toEqual(["-First host tip", "-Second host tip"]);
  });

  it("ignores malformed non-array runtime tips and omits empty cards", () => {
    const { rerender } = renderScreen({
      report: {
        photoTips: "not an array",
      } as unknown as GuestIngredientScannerEntryReport,
    });

    expect(screen.queryByText(copy.photoTipsHeading)).not.toBeInTheDocument();

    rerender(
      <GuestIngredientScannerEntryScreen
        {...createProps({
          report: {
            photoTips: ["   "],
          },
        })}
      />,
    );
    expect(screen.queryByText(copy.photoTipsHeading)).not.toBeInTheDocument();
  });
});

describe("GuestIngredientScannerEntryScreen architecture boundaries", () => {
  it("keeps StrictMode pending behaviour stable", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onTakePhoto = vi.fn(() => deferred.promise);
    renderStrictScreen({ onTakePhoto });

    await user.click(getButton(copy.takePhoto));
    await user.click(getButton(copy.takingPhoto));

    expect(onTakePhoto).toHaveBeenCalledTimes(1);
    deferred.resolve();
  });

  it("recovers from StrictMode callback rejection with a toast", async () => {
    const user = userEvent.setup();
    renderStrictScreen({
      onTakePhoto: vi.fn(() => Promise.reject(new Error("strict failed"))),
    });

    await user.click(getButton(copy.takePhoto));

    expect(await screen.findByText(copy.takePhotoError)).toBeVisible();
  });

  it("does not call browser, storage, camera, or location APIs", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    const storageSet = vi.spyOn(Storage.prototype, "setItem");
    const storageGet = vi.spyOn(Storage.prototype, "getItem");
    const originalFetch = globalThis.fetch;
    const originalCookie = document.cookie;
    const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB");
    const mediaDevices = {
      getUserMedia: vi.fn(),
    };
    const geolocation = {
      getCurrentPosition: vi.fn(),
    };

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchSpy,
    });
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: vi.fn() },
    });
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: mediaDevices,
    });
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: geolocation,
    });

    try {
      renderScreen();
      await user.click(getButton(copy.takePhoto));
      await user.click(getButton(copy.choosePhoto));
      await user.click(getButton(copy.manualEntry));

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageSet).not.toHaveBeenCalled();
      expect(storageGet).not.toHaveBeenCalled();
      expect(window.indexedDB.open).not.toHaveBeenCalled();
      expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(document.cookie).toBe(originalCookie);
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, "fetch", {
          configurable: true,
          value: originalFetch,
        });
      } else {
        delete (globalThis as { fetch?: unknown }).fetch;
      }

      if (originalIndexedDb) {
        Object.defineProperty(window, "indexedDB", originalIndexedDb);
      } else {
        delete (window as unknown as { indexedDB?: unknown }).indexedDB;
      }
    }
  });

  it("renders no anchors, iframe, file input, bottom navigation, or forbidden wording", () => {
    const { container } = renderScreen({
      report: { selectedProfile },
    });
    const text = container.textContent?.toLowerCase() ?? "";
    const markup = container.innerHTML.toLowerCase();

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(container.querySelector("nav")).toBeNull();
    expect(text).not.toContain("affiliate");
    expect(text).not.toContain("marketplace");
    expect(text).not.toContain("external seller");
    expect(text).not.toContain("sponsored");
    expect(text).not.toContain("diagnosis");
    expect(text).not.toContain("treatment");
    expect(markup).not.toContain("sage");
    expect(markup).not.toContain("green");
    expect(markup).not.toContain("blue");
    expectOpaqueProfileIdNotRendered(container);
  });
});
