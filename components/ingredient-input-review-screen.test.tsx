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

import IngredientInputReviewScreen, {
  copy,
  getIngredientInputReviewSubmission,
  hasUsableIngredientInputReviewReport,
  isIngredientInputReviewState,
  isIngredientInputSource,
  type IngredientInputReviewReport,
  type IngredientInputReviewScreenProps,
} from "./ingredient-input-review-screen";

const opaqueDraftId = "draft-secret-ingredient-review";
const opaqueProfileId = "profile-secret-amara";

const selectedProfile = {
  profileId: opaqueProfileId,
  displayName: "Amara",
  contextLabel: "Host profile context label",
};

const defaultReport: IngredientInputReviewReport = {
  draftId: opaqueDraftId,
  source: "camera-photo",
  sourceLabel: "Host source: camera label",
  ingredientText: "Aqua, Glycerin, Niacinamide",
  selectedProfile,
  image: {
    imageUrl: "https://example.com/ingredient-label.jpg",
    imageAlt: "Host supplied label alt",
    sourceLabel: "Host image source label",
  },
  helperLabel: "Host helper label",
  privacyLabel: "Host privacy label",
  extractionNoticeLabel: "Host extraction notice",
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
  overrides: Partial<IngredientInputReviewScreenProps> = {},
): IngredientInputReviewScreenProps {
  return {
    report: defaultReport,
    onBack: vi.fn(),
    onChangeMethod: vi.fn(),
    onIngredientTextChange: vi.fn(),
    onChangeProfile: vi.fn(),
    onContinue: vi.fn(),
    onRetryLoad: vi.fn(),
    ...overrides,
  };
}

function renderScreen(
  overrides: Partial<IngredientInputReviewScreenProps> = {},
) {
  return render(
    <IngredientInputReviewScreen {...createProps(overrides)} />,
  );
}

function renderStrictScreen(
  overrides: Partial<IngredientInputReviewScreenProps> = {},
) {
  return render(
    <StrictMode>
      <IngredientInputReviewScreen {...createProps(overrides)} />
    </StrictMode>,
  );
}

function getButton(name: string) {
  return screen.getByRole("button", { name });
}

function getTextarea() {
  return screen.getByRole("textbox", { name: copy.ingredientText });
}

function expectOpaqueIdsNotRendered(container: HTMLElement) {
  expect(container.textContent).not.toContain(opaqueDraftId);
  expect(container.innerHTML).not.toContain(opaqueDraftId);
  expect(container.textContent).not.toContain(opaqueProfileId);
  expect(container.innerHTML).not.toContain(opaqueProfileId);
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

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("IngredientInputReviewScreen runtime guards and required context", () => {
  it("recognises only supported runtime states", () => {
    expect(isIngredientInputReviewState("loading")).toBe(true);
    expect(isIngredientInputReviewState("ready")).toBe(true);
    expect(isIngredientInputReviewState("error")).toBe(true);
    expect(isIngredientInputReviewState("empty")).toBe(false);
  });

  it("recognises only supported input sources", () => {
    expect(isIngredientInputSource("camera-photo")).toBe(true);
    expect(isIngredientInputSource("chosen-photo")).toBe(true);
    expect(isIngredientInputSource("manual-entry")).toBe(true);
    expect(isIngredientInputSource("scanned-text")).toBe(false);
  });

  it("recognises only usable required report context", () => {
    expect(hasUsableIngredientInputReviewReport(defaultReport)).toBe(true);
    expect(hasUsableIngredientInputReviewReport(null)).toBe(false);
    expect(hasUsableIngredientInputReviewReport(undefined)).toBe(false);
    expect(
      hasUsableIngredientInputReviewReport({
        ...defaultReport,
        draftId: "",
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientInputReviewReport({
        ...defaultReport,
        draftId: "   ",
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientInputReviewReport({
        ...defaultReport,
        source: "unknown" as IngredientInputReviewReport["source"],
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientInputReviewReport({
        ...defaultReport,
        ingredientText: 42 as unknown as string,
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientInputReviewReport({
        ...defaultReport,
        ingredientText: "",
      }),
    ).toBe(true);
  });

  it("fails closed for malformed ready reports", () => {
    const { rerender } = renderScreen({ report: null, state: "ready" });
    expect(screen.getByRole("heading", { level: 1, name: copy.errorHeading }))
      .toBeVisible();

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          report: {
            ...defaultReport,
            draftId: "   ",
          },
        })}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: copy.errorHeading }))
      .toBeVisible();
  });

  it("keeps blank ingredient text readable while blocking Continue", () => {
    renderScreen({
      report: {
        ...defaultReport,
        ingredientText: "",
      },
    });

    expect(getTextarea()).toHaveValue("");
    expect(screen.getByText(copy.emptySupporting)).toBeVisible();
    expect(getButton(copy.emptyTitle)).toBeDisabled();
  });

  it("does not render opaque draft IDs", () => {
    const { container } = renderScreen();

    expectOpaqueIdsNotRendered(container);
  });
});

describe("IngredientInputReviewScreen core states", () => {
  it("renders loading heading and polite static-only status semantics", () => {
    renderScreen({ state: "loading" });

    expect(screen.getByRole("heading", { level: 1, name: copy.loadingHeading }))
      .toBeVisible();
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(copy.loadingSupporting);
    expect(within(status).queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps Back outside the loading live region", () => {
    renderScreen({ state: "loading" });

    const status = screen.getByRole("status");
    expect(getButton(copy.back)).toBeVisible();
    expect(within(status).queryByRole("button", { name: copy.back }))
      .not.toBeInTheDocument();
  });

  it("renders ready heading and exactly one h1", () => {
    renderScreen();

    expect(screen.getByRole("heading", { level: 1, name: copy.heading }))
      .toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("keeps ready mobile reading order from review through Continue", () => {
    renderScreen({
      isOffline: true,
      report: {
        ...defaultReport,
        sourceLabel: "Host source summary",
        privacyLabel: "Host privacy helper",
        helperLabel: "Host processing helper",
      },
    });

    expectTextOrder(
      copy.heading,
      "You appear to be offline",
      copy.sourceTitle,
      "Host source summary",
      copy.imageTitle,
      copy.ingredientText,
      copy.optionalProfileTitle,
      copy.reviewTitle,
      copy.changeMethod,
      copy.continue,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: copy.changeMethod }))
      .toHaveLength(1);
    expect(screen.getAllByText(copy.offline)).toHaveLength(1);
  });

  it("renders the error state with Retry only when supplied", () => {
    const retry = vi.fn();
    renderScreen({ onRetryLoad: retry, state: "error" });

    expect(screen.getByRole("heading", { level: 1, name: copy.errorHeading }))
      .toBeVisible();
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

  it("fails closed for unknown runtime state", () => {
    renderScreen({
      state: "unexpected" as unknown as IngredientInputReviewScreenProps["state"],
    });

    expect(screen.getByRole("heading", { level: 1, name: copy.errorHeading }))
      .toBeVisible();
  });
});

describe("IngredientInputReviewScreen controlled textarea", () => {
  it("renders host-supplied text unchanged", () => {
    renderScreen({
      report: {
        ...defaultReport,
        ingredientText: "  Aqua,\n  Glycerin  ",
      },
    });

    expect(getTextarea()).toHaveValue("  Aqua,\n  Glycerin  ");
  });

  it("passes exact user-entered values to the host callback", () => {
    const onIngredientTextChange = vi.fn();
    renderScreen({ onIngredientTextChange });

    fireEvent.change(getTextarea(), {
      target: {
        value: "  Water,\n  Oil,   Fragrance  ",
      },
    });

    expect(onIngredientTextChange).toHaveBeenCalledWith(
      "  Water,\n  Oil,   Fragrance  ",
    );
  });

  it("uses refreshed host text after rerender without local source drift", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        ingredientText: "Original host text",
      },
    });

    fireEvent.change(getTextarea(), {
      target: {
        value: "User draft that host has not accepted",
      },
    });
    expect(getTextarea()).toHaveValue("Original host text");

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          report: {
            ...defaultReport,
            ingredientText: "Refreshed host text",
          },
        })}
      />,
    );
    expect(getTextarea()).toHaveValue("Refreshed host text");
  });

  it("keeps blocked editing readable and does not invoke callback", async () => {
    const user = userEvent.setup();
    const onIngredientTextChange = vi.fn();
    renderScreen({
      canEditIngredientText: false,
      onIngredientTextChange,
    });

    expect(getTextarea()).toBeDisabled();
    expect(getTextarea()).toHaveValue(defaultReport.ingredientText);
    expect(screen.getByText(copy.editingBlocked)).toBeVisible();

    await user.type(getTextarea(), " more");
    expect(onIngredientTextChange).not.toHaveBeenCalled();

    const textarea = getTextarea();
    textarea.removeAttribute("disabled");
    fireEvent.change(textarea, {
      target: {
        value: "Blocked forced value",
      },
    });
    expect(onIngredientTextChange).not.toHaveBeenCalled();
  });

  it("renders the visible textarea label and empty corrective copy", () => {
    renderScreen({
      report: {
        ...defaultReport,
        ingredientText: " ",
      },
    });

    expect(getTextarea()).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: copy.emptyTitle }),
    ).toBeVisible();
    expect(screen.getByText(copy.emptySupporting)).toBeVisible();
    expect(getButton(copy.emptyTitle)).toBeDisabled();
  });
});

describe("IngredientInputReviewScreen submission helper and Continue", () => {
  it("submits valid draft text unchanged with profile context", () => {
    expect(getIngredientInputReviewSubmission(defaultReport)).toEqual({
      draftId: opaqueDraftId,
      ingredientText: defaultReport.ingredientText,
      profileId: opaqueProfileId,
    });
  });

  it("omits profile ID for guest or malformed optional profile context", () => {
    const guest = getIngredientInputReviewSubmission({
      ...defaultReport,
      selectedProfile: undefined,
    });
    const blank = getIngredientInputReviewSubmission({
      ...defaultReport,
      selectedProfile: {
        ...selectedProfile,
        profileId: "",
      },
    });
    const whitespace = getIngredientInputReviewSubmission({
      ...defaultReport,
      selectedProfile: {
        ...selectedProfile,
        profileId: "   ",
      },
    });

    expect(guest).toEqual({
      draftId: opaqueDraftId,
      ingredientText: defaultReport.ingredientText,
    });
    expect(blank).toEqual(guest);
    expect(whitespace).toEqual(guest);
    expect(Object.prototype.hasOwnProperty.call(guest, "profileId")).toBe(false);
  });

  it("returns null for blank ingredient text or malformed required context", () => {
    expect(
      getIngredientInputReviewSubmission({
        ...defaultReport,
        ingredientText: "",
      }),
    ).toBeNull();
    expect(
      getIngredientInputReviewSubmission({
        ...defaultReport,
        ingredientText: "   ",
      }),
    ).toBeNull();
    expect(
      getIngredientInputReviewSubmission({
        ...defaultReport,
        draftId: "",
      }),
    ).toBeNull();
  });

  it("invokes Continue only on explicit activation", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const { rerender } = renderScreen({ onContinue });

    expect(onContinue).not.toHaveBeenCalled();
    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          onContinue,
          report: {
            ...defaultReport,
            helperLabel: "Updated helper",
          },
        })}
      />,
    );
    expect(onContinue).not.toHaveBeenCalled();

    await user.click(getButton(copy.continue));
    expect(onContinue).toHaveBeenCalledWith({
      draftId: opaqueDraftId,
      ingredientText: defaultReport.ingredientText,
      profileId: opaqueProfileId,
    });
  });

  it("protects Continue with pending, duplicate guard, and conflicting disabled controls", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onContinue = vi.fn(() => deferred.promise);
    const onIngredientTextChange = vi.fn();
    renderScreen({ onContinue, onIngredientTextChange });

    await user.click(getButton(copy.continue));
    await user.click(getButton(copy.continuing));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(getButton(copy.continuing)).toBeDisabled();
    expect(getButton(copy.back)).toBeDisabled();
    expect(getButton(copy.changeMethod)).toBeDisabled();
    expect(getButton(copy.changeProfile)).toBeDisabled();
    expect(getTextarea()).toBeDisabled();
    expect(getTextarea()).toHaveValue(defaultReport.ingredientText);

    const textarea = getTextarea();
    textarea.removeAttribute("disabled");
    fireEvent.change(textarea, {
      target: {
        value: "Continue pending forced value",
      },
    });
    expect(onIngredientTextChange).not.toHaveBeenCalled();

    deferred.resolve();
    await waitFor(() => expect(getButton(copy.continue)).toBeEnabled());
    expect(getTextarea()).toBeEnabled();
  });

  it("converts Continue rejection into a toast", async () => {
    const user = userEvent.setup();
    renderScreen({
      onContinue: vi.fn(() => Promise.reject(new Error("continue failed"))),
    });

    await user.click(getButton(copy.continue));

    expect(await screen.findByText(copy.continueError)).toBeVisible();
  });

  it("keeps host-blocked and blank-text Continue visible and guarded", () => {
    const onContinue = vi.fn();
    renderScreen({
      canContinue: false,
      onContinue,
    });

    const blocked = getButton(copy.continueBlocked);
    expect(blocked).toBeDisabled();
    blocked.removeAttribute("disabled");
    fireEvent.click(blocked);
    expect(onContinue).not.toHaveBeenCalled();

    cleanup();
    renderScreen({
      onContinue,
      report: {
        ...defaultReport,
        ingredientText: "",
      },
    });
    const blank = getButton(copy.emptyTitle);
    expect(blank).toBeDisabled();
    blank.removeAttribute("disabled");
    fireEvent.click(blank);
    expect(onContinue).not.toHaveBeenCalled();
  });
});

describe("IngredientInputReviewScreen source summary", () => {
  it.each([
    ["camera-photo", copy.sourceCamera],
    ["chosen-photo", copy.sourceChosen],
    ["manual-entry", copy.sourceManual],
  ] as const)("renders source copy for %s", (source, supporting) => {
    renderScreen({
      report: {
        ...defaultReport,
        source,
        sourceLabel: `Host source label ${source}`,
      },
    });

    expect(screen.getByText(`Host source label ${source}`)).toBeVisible();
    expect(screen.getByText(supporting)).toBeVisible();
  });

  it("supports Change input method callback, pending, duplicate guard, and recovery", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onChangeMethod = vi.fn(() => deferred.promise);
    const onIngredientTextChange = vi.fn();
    renderScreen({ onChangeMethod, onIngredientTextChange });

    await user.click(getButton(copy.changeMethod));
    await user.click(getButton(copy.changingMethod));

    expect(onChangeMethod).toHaveBeenCalledTimes(1);
    expect(getButton(copy.changingMethod)).toBeDisabled();
    expect(getTextarea()).toBeDisabled();

    const textarea = getTextarea();
    textarea.removeAttribute("disabled");
    fireEvent.change(textarea, {
      target: {
        value: "Change method pending forced value",
      },
    });
    expect(onIngredientTextChange).not.toHaveBeenCalled();

    deferred.reject(new Error("method failed"));
    expect(await screen.findByText(copy.changeMethodError)).toBeVisible();
  });

  it("keeps host-blocked Change input method visible and guarded", () => {
    const onChangeMethod = vi.fn();
    renderScreen({
      canChangeMethod: false,
      onChangeMethod,
    });

    const button = getButton(copy.changeMethodBlocked);
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);

    expect(onChangeMethod).not.toHaveBeenCalled();
  });
});

describe("IngredientInputReviewScreen image preview", () => {
  it("renders camera and chosen-photo image URLs", () => {
    const { rerender } = renderScreen();

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      defaultReport.image?.imageUrl,
    );

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          report: {
            ...defaultReport,
            source: "chosen-photo",
            image: {
              imageUrl: "https://example.com/chosen-label.jpg",
            },
          },
        })}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/chosen-label.jpg",
    );
  });

  it("uses safe alt fallback or supplied alt", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        image: {
          imageUrl: "https://example.com/no-alt.jpg",
        },
      },
    });

    expect(screen.getByRole("img", { name: copy.imageFallbackAlt })).toBeVisible();

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          report: {
            ...defaultReport,
            image: {
              imageAlt: "Host alt text",
              imageUrl: "https://example.com/with-alt.jpg",
            },
          },
        })}
      />,
    );
    expect(screen.getByRole("img", { name: "Host alt text" })).toBeVisible();
  });

  it("renders local placeholder for missing, whitespace, or failed image URLs", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        image: undefined,
      },
    });
    expect(screen.getByText(copy.imageUnavailable)).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          report: {
            ...defaultReport,
            image: {
              imageUrl: "   ",
            },
          },
        })}
      />,
    );
    expect(screen.getByText(copy.imageUnavailable)).toBeVisible();

    rerender(<IngredientInputReviewScreen {...createProps()} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText(copy.imageUnavailable)).toBeVisible();
  });

  it("retries replacement image URLs after a prior load failure", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        image: {
          imageUrl: "https://example.com/first.jpg",
        },
      },
    });

    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText(copy.imageUnavailable)).toBeVisible();

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          report: {
            ...defaultReport,
            image: {
              imageUrl: "https://example.com/replacement.jpg",
            },
          },
        })}
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/replacement.jpg",
    );
  });

  it("omits image preview for manual-entry source", () => {
    renderScreen({
      report: {
        ...defaultReport,
        source: "manual-entry",
      },
    });

    expect(screen.queryByTestId("image-preview-card")).not.toBeInTheDocument();
  });
});

describe("IngredientInputReviewScreen optional profile", () => {
  it("renders no-profile and valid profile states", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        selectedProfile: undefined,
      },
    });

    expect(screen.getByText(copy.noProfile)).toBeVisible();
    expect(screen.getByText(copy.noProfileSupporting)).toBeVisible();

    rerender(<IngredientInputReviewScreen {...createProps()} />);
    expect(screen.getByText("Amara")).toBeVisible();
    expect(screen.getByText(selectedProfile.contextLabel)).toBeVisible();
    expect(screen.getByText(copy.profileReady)).toBeVisible();
  });

  it("uses safe display-name fallback", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        selectedProfile: {
          ...selectedProfile,
          displayName: "   ",
        },
      },
    });

    expect(screen.getByText(copy.unnamedProfile)).toBeVisible();

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          report: {
            ...defaultReport,
            selectedProfile: {
              ...selectedProfile,
              displayName: 12 as unknown as string,
            },
          },
        })}
      />,
    );
    expect(screen.getByText(copy.unnamedProfile)).toBeVisible();
  });

  it("shows malformed profile message and omits profile from Continue submission", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    renderScreen({
      onContinue,
      report: {
        ...defaultReport,
        selectedProfile: {
          ...selectedProfile,
          profileId: " ",
        },
      },
    });

    expect(screen.getByText(copy.malformedProfile)).toBeVisible();

    await user.click(getButton(copy.continue));
    expect(onContinue).toHaveBeenCalledWith({
      draftId: opaqueDraftId,
      ingredientText: defaultReport.ingredientText,
    });
  });

  it("supports Change profile callback, host block, pending, and rejection", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onChangeProfile = vi.fn(() => deferred.promise);
    const onIngredientTextChange = vi.fn();
    const { rerender } = renderScreen({
      onChangeProfile,
      onIngredientTextChange,
    });

    await user.click(getButton(copy.changeProfile));
    await user.click(getButton(copy.changingProfile));
    expect(onChangeProfile).toHaveBeenCalledTimes(1);
    expect(getButton(copy.changingProfile)).toBeDisabled();
    expect(getTextarea()).toBeDisabled();

    const textarea = getTextarea();
    textarea.removeAttribute("disabled");
    fireEvent.change(textarea, {
      target: {
        value: "Change profile pending forced value",
      },
    });
    expect(onIngredientTextChange).not.toHaveBeenCalled();

    deferred.resolve();

    await waitFor(() => expect(getButton(copy.changeProfile)).toBeEnabled());
    expect(getTextarea()).toBeEnabled();

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          canChangeProfile: false,
          onChangeProfile,
        })}
      />,
    );
    expect(getButton(copy.changeProfileBlocked)).toBeDisabled();

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          onChangeProfile: vi.fn(() => Promise.reject(new Error("profile failed"))),
        })}
      />,
    );
    await user.click(getButton(copy.changeProfile));
    expect(await screen.findByText(copy.changeProfileError)).toBeVisible();
  });

  it("hides Change profile when callback is absent", () => {
    renderScreen({ onChangeProfile: undefined });

    expect(screen.queryByRole("button", { name: copy.changeProfile }))
      .not.toBeInTheDocument();
  });
});

describe("IngredientInputReviewScreen offline behaviour", () => {
  it("shows informational offline banner and keeps content readable", () => {
    renderScreen({ isOffline: true });

    expect(screen.getByText(copy.offline)).toBeVisible();
    expect(getTextarea()).toHaveValue(defaultReport.ingredientText);
    expect(screen.getByRole("img")).toBeVisible();
  });

  it("uses host props rather than automatically blocking editing or Continue", () => {
    const { rerender } = renderScreen({
      isOffline: true,
    });
    expect(getTextarea()).toBeEnabled();
    expect(getButton(copy.continue)).toBeEnabled();

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          canContinue: false,
          canEditIngredientText: false,
          isOffline: true,
        })}
      />,
    );
    expect(getTextarea()).toBeDisabled();
    expect(getButton(copy.continueBlocked)).toBeDisabled();
  });
});

describe("IngredientInputReviewScreen Back behaviour", () => {
  it("activates Back explicitly without mount or rerender callbacks", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const { rerender } = renderScreen({ onBack });

    expect(onBack).not.toHaveBeenCalled();
    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          onBack,
          report: {
            ...defaultReport,
            helperLabel: "Updated helper",
          },
        })}
      />,
    );
    expect(onBack).not.toHaveBeenCalled();

    await user.click(getButton(copy.back));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("protects Back with pending label, duplicate guard, and conflicting disabled controls", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onBack = vi.fn(() => deferred.promise);
    const onIngredientTextChange = vi.fn();
    renderScreen({ onBack, onIngredientTextChange });

    await user.click(getButton(copy.back));
    await user.click(getButton(copy.backing));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(getButton(copy.backing)).toBeDisabled();
    expect(getButton(copy.changeMethod)).toBeDisabled();
    expect(getButton(copy.changeProfile)).toBeDisabled();
    expect(getButton(copy.continue)).toBeDisabled();
    expect(getTextarea()).toBeDisabled();

    const textarea = getTextarea();
    textarea.removeAttribute("disabled");
    fireEvent.change(textarea, {
      target: {
        value: "Back pending forced value",
      },
    });
    expect(onIngredientTextChange).not.toHaveBeenCalled();

    deferred.resolve();
    await waitFor(() => expect(getButton(copy.back)).toBeEnabled());
    expect(getTextarea()).toBeEnabled();
  });

  it("keeps host-blocked Back visible, guarded, and recovers from rejection", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const { rerender } = renderScreen({
      canGoBack: false,
      onBack,
    });

    const blocked = getButton(copy.backBlocked);
    expect(blocked).toBeDisabled();
    blocked.removeAttribute("disabled");
    fireEvent.click(blocked);
    expect(onBack).not.toHaveBeenCalled();

    rerender(
      <IngredientInputReviewScreen
        {...createProps({
          onBack: vi.fn(() => Promise.reject(new Error("back failed"))),
        })}
      />,
    );
    await user.click(getButton(copy.back));
    expect(await screen.findByText(copy.backError)).toBeVisible();
  });
});

describe("IngredientInputReviewScreen architecture boundaries", () => {
  it("keeps StrictMode pending behaviour stable", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onContinue = vi.fn(() => deferred.promise);
    renderStrictScreen({ onContinue });

    await user.click(getButton(copy.continue));
    await user.click(getButton(copy.continuing));

    expect(onContinue).toHaveBeenCalledTimes(1);
    deferred.resolve();
  });

  it("recovers from StrictMode callback rejection with a toast", async () => {
    const user = userEvent.setup();
    renderStrictScreen({
      onContinue: vi.fn(() => Promise.reject(new Error("strict failed"))),
    });

    await user.click(getButton(copy.continue));

    expect(await screen.findByText(copy.continueError)).toBeVisible();
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
      fireEvent.change(getTextarea(), {
        target: {
          value: "Aqua",
        },
      });
      await user.click(getButton(copy.continue));
      await user.click(getButton(copy.changeMethod));

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

  it("renders no forbidden route elements, wording, or opaque IDs", () => {
    const { container } = renderScreen();
    const text = container.textContent?.toLowerCase() ?? "";
    const markup = container.innerHTML.toLowerCase();

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(container.querySelector("nav")).toBeNull();
    expect(text).not.toContain("create account");
    expect(text).not.toContain("affiliate");
    expect(text).not.toContain("marketplace");
    expect(text).not.toContain("external seller");
    expect(text).not.toContain("sponsored");
    expect(text).not.toContain("diagnosis");
    expect(text).not.toContain("treatment");
    expect(markup).not.toContain("sage");
    expect(markup).not.toContain("green");
    expect(markup).not.toContain("blue");
    expectOpaqueIdsNotRendered(container);
  });
});
