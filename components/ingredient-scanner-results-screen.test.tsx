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

import IngredientScannerResultsScreen, {
  copy,
  getIngredientScannerResultSaveSubmission,
  hasUsableIngredientScannerResultsReport,
  isIngredientGuidanceTone,
  isIngredientScannerResultsState,
  type IngredientScannerGuidanceItem,
  type IngredientScannerResultsReport,
  type IngredientScannerResultsScreenProps,
} from "./ingredient-scanner-results-screen";

const opaqueResultId = "result-secret-ingredient-guidance";
const opaqueDraftId = "draft-secret-ingredient-guidance";
const opaqueProfileId = "profile-secret-amara";
const opaqueItemIds = [
  "item-secret-niacinamide",
  "item-secret-fragrance",
  "item-secret-retinol",
];

const selectedProfile = {
  profileId: opaqueProfileId,
  displayName: "Amara",
  contextLabel: "Host profile context",
};

const defaultItems: IngredientScannerGuidanceItem[] = [
  {
    itemId: opaqueItemIds[0],
    name: "Niacinamide",
    flagLabel: "Host neutral flag",
    summary: "Host neutral note.",
    categoryLabel: "Barrier support",
    supporting: "Host supporting note.",
    tone: "neutral",
  },
  {
    itemId: opaqueItemIds[1],
    name: "Fragrance",
    flagLabel: "Host attention flag",
    summary: "Host attention note.",
    tone: "attention",
  },
  {
    itemId: opaqueItemIds[2],
    name: "Retinol",
    flagLabel: "Host caution flag",
    summary: "Host caution note.",
    tone: "caution",
  },
];

const defaultReport: IngredientScannerResultsReport = {
  resultId: opaqueResultId,
  draftId: opaqueDraftId,
  sourceLabel: "Host source label",
  summaryLabel: "Host summary label",
  ingredientCountLabel: "Host count label",
  guidanceItems: defaultItems,
  selectedProfile,
  helperLabel: "Host storage helper",
  disclaimerLabel: "Host disclaimer helper",
  savedLabel: "Host saved label",
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
  overrides: Partial<IngredientScannerResultsScreenProps> = {},
): IngredientScannerResultsScreenProps {
  return {
    report: defaultReport,
    onBackToReview: vi.fn(),
    onScanAnotherProduct: vi.fn(),
    onSaveResult: vi.fn(),
    onRetryLoad: vi.fn(),
    ...overrides,
  };
}

function renderScreen(
  overrides: Partial<IngredientScannerResultsScreenProps> = {},
) {
  return render(
    <IngredientScannerResultsScreen {...createProps(overrides)} />,
  );
}

function renderStrictScreen(
  overrides: Partial<IngredientScannerResultsScreenProps> = {},
) {
  return render(
    <StrictMode>
      <IngredientScannerResultsScreen {...createProps(overrides)} />
    </StrictMode>,
  );
}

function getButton(name: string) {
  return screen.getByRole("button", { name });
}

function expectTextOrder(...items: string[]) {
  const bodyText = document.body.textContent ?? "";
  let previousIndex = -1;

  for (const item of items) {
    const nextIndex = bodyText.indexOf(item, previousIndex + 1);
    expect(nextIndex).toBeGreaterThan(previousIndex);
    previousIndex = nextIndex;
  }
}

function expectOpaqueIdsNotRendered(container: HTMLElement) {
  expect(container.textContent).not.toContain(opaqueResultId);
  expect(container.innerHTML).not.toContain(opaqueResultId);
  expect(container.textContent).not.toContain(opaqueDraftId);
  expect(container.innerHTML).not.toContain(opaqueDraftId);
  expect(container.textContent).not.toContain(opaqueProfileId);
  expect(container.innerHTML).not.toContain(opaqueProfileId);

  for (const itemId of opaqueItemIds) {
    expect(container.textContent).not.toContain(itemId);
    expect(container.innerHTML).not.toContain(itemId);
  }
}

function expectNeutralEmptyCard() {
  const card = screen.getByTestId("empty-guidance-card");

  expect(card).not.toHaveAttribute("role", "alert");
  expect(card).toHaveClass("border-[var(--dl-parchment)]");
  expect(card).toHaveClass("bg-[var(--dl-surface-soft)]");
  expect(card).not.toHaveClass("bg-[var(--dl-error-surface)]");
  expect(card).not.toHaveClass("text-[var(--dl-error-text)]");
  expect(within(card).getByText(copy.emptyTitle)).toHaveClass(
    "text-[var(--dl-bark)]",
  );
  expect(within(card).getByText(copy.emptySupporting)).toHaveClass(
    "text-[var(--dl-text-secondary)]",
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("IngredientScannerResultsScreen runtime helpers", () => {
  it("recognises only supported runtime states", () => {
    expect(isIngredientScannerResultsState("loading")).toBe(true);
    expect(isIngredientScannerResultsState("ready")).toBe(true);
    expect(isIngredientScannerResultsState("empty")).toBe(true);
    expect(isIngredientScannerResultsState("error")).toBe(true);
    expect(isIngredientScannerResultsState("blocked")).toBe(false);
  });

  it("recognises only supported tones", () => {
    expect(isIngredientGuidanceTone("neutral")).toBe(true);
    expect(isIngredientGuidanceTone("attention")).toBe(true);
    expect(isIngredientGuidanceTone("caution")).toBe(true);
    expect(isIngredientGuidanceTone("urgent")).toBe(false);
  });

  it("validates required report context without validating item content", () => {
    expect(hasUsableIngredientScannerResultsReport(defaultReport)).toBe(true);
    expect(hasUsableIngredientScannerResultsReport(null)).toBe(false);
    expect(hasUsableIngredientScannerResultsReport(undefined)).toBe(false);
    expect(
      hasUsableIngredientScannerResultsReport({
        ...defaultReport,
        resultId: "",
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientScannerResultsReport({
        ...defaultReport,
        resultId: "   ",
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientScannerResultsReport({
        ...defaultReport,
        draftId: "",
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientScannerResultsReport({
        ...defaultReport,
        sourceLabel: " ",
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientScannerResultsReport({
        ...defaultReport,
        summaryLabel: "",
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientScannerResultsReport({
        ...defaultReport,
        guidanceItems: {} as unknown as IngredientScannerGuidanceItem[],
      }),
    ).toBe(false);
    expect(
      hasUsableIngredientScannerResultsReport({
        ...defaultReport,
        guidanceItems: [],
      }),
    ).toBe(true);
  });

  it("fails closed for ready null and malformed required reports", () => {
    const { rerender } = renderScreen({ report: null, state: "ready" });
    expect(screen.getByRole("heading", { level: 1, name: copy.errorHeading }))
      .toBeVisible();

    rerender(
      <IngredientScannerResultsScreen
        {...createProps({
          report: {
            ...defaultReport,
            resultId: " ",
          },
        })}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: copy.errorHeading }))
      .toBeVisible();
  });

  it("renders a readable empty experience for ready empty arrays", () => {
    renderScreen({
      report: {
        ...defaultReport,
        guidanceItems: [],
      },
    });

    expect(screen.getByText(copy.emptyTitle)).toBeVisible();
    expect(screen.getByText(copy.emptySupporting)).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("fails closed for unknown runtime state", () => {
    renderScreen({
      state: "unexpected" as IngredientScannerResultsScreenProps["state"],
    });

    expect(screen.getByRole("heading", { level: 1, name: copy.errorHeading }))
      .toBeVisible();
  });
});

describe("IngredientScannerResultsScreen core rendering", () => {
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
    expect(getButton(copy.backToReview)).toBeVisible();
    expect(within(status).queryByRole("button", { name: copy.backToReview }))
      .not.toBeInTheDocument();
  });

  it("renders ready heading and exactly one h1", () => {
    renderScreen();

    expect(screen.getByRole("heading", { level: 1, name: copy.heading }))
      .toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("keeps mobile reading order aligned with the guidance flow", () => {
    renderScreen({ isOffline: true, isSaveAvailableOffline: true });

    expectTextOrder(
      copy.heading,
      "You appear to be offline",
      copy.trustTitle,
      copy.sourceTitle,
      defaultReport.sourceLabel,
      copy.summaryTitle,
      defaultReport.summaryLabel,
      copy.guidanceListTitle,
      "Niacinamide",
      copy.profileTitle,
      copy.helperTitle,
      copy.saveResult,
      copy.scanAnother,
    );
  });

  it("renders host source, summary, and count labels unchanged", () => {
    renderScreen();

    expect(screen.getByText(defaultReport.sourceLabel)).toBeVisible();
    expect(screen.getByText(defaultReport.summaryLabel)).toBeVisible();
    expect(screen.getByText(defaultReport.ingredientCountLabel ?? ""))
      .toBeVisible();
  });

  it("does not calculate a count when the host count label is absent", () => {
    renderScreen({
      report: {
        ...defaultReport,
        ingredientCountLabel: undefined,
      },
    });

    expect(screen.queryByText(defaultReport.ingredientCountLabel ?? ""))
      .not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("3");
  });

  it("preserves host guidance item order", () => {
    renderScreen();

    expectTextOrder("Niacinamide", "Fragrance", "Retinol");
  });

  it("uses safe fallbacks for malformed guidance item text", () => {
    const { container } = renderScreen({
      report: {
        ...defaultReport,
        guidanceItems: [
          {
            itemId: "malformed-item",
            name: " ",
            flagLabel: "",
            summary: 12 as unknown as string,
          },
        ],
      },
    });

    expect(screen.getByText(copy.unnamedIngredient)).toBeVisible();
    expect(screen.getByText(copy.unavailableFlag)).toBeVisible();
    expect(screen.getByText(copy.unavailableSummary)).toBeVisible();
    expect(container.textContent).not.toContain("malformed-item");
  });

  it("renders malformed guidance entries as neutral fallback cards in received order", () => {
    const { container } = renderScreen({
      report: {
        ...defaultReport,
        guidanceItems: [
          {
            itemId: "valid-before",
            name: "Valid before",
            flagLabel: "Host label before",
            summary: "Host summary before",
          },
          null,
          undefined,
          "unexpected",
          42,
          {
            itemId: "valid-after",
            name: "Valid after",
            flagLabel: "Host label after",
            summary: "Host summary after",
          },
        ] as unknown as IngredientScannerGuidanceItem[],
      },
    });
    const listItems = screen.getAllByRole("listitem");

    expect(listItems).toHaveLength(6);
    expect(within(listItems[0]).getByText("Valid before")).toBeVisible();
    expect(within(listItems[5]).getByText("Valid after")).toBeVisible();

    for (const fallbackItem of listItems.slice(1, 5)) {
      expect(within(fallbackItem).getByText(copy.unnamedIngredient)).toBeVisible();
      expect(within(fallbackItem).getByText(copy.unavailableFlag)).toBeVisible();
      expect(within(fallbackItem).getByText(copy.unavailableSummary)).toBeVisible();
      expect(fallbackItem).toHaveAttribute("data-tone", "neutral");
    }

    expectTextOrder(
      "Valid before",
      copy.unnamedIngredient,
      copy.unnamedIngredient,
      copy.unnamedIngredient,
      copy.unnamedIngredient,
      "Valid after",
    );
    expect(container.textContent).not.toContain("valid-before");
    expect(container.textContent).not.toContain("valid-after");
    expect(container.textContent).not.toContain("null");
    expect(container.textContent).not.toContain("undefined");
    expect(container.textContent).not.toContain("unexpected");
    expect(container.textContent).not.toContain("42");
  });

  it("renders optional category and supporting labels only when usable", () => {
    renderScreen();

    expect(screen.getByText("Barrier support")).toBeVisible();
    expect(screen.getByText("Host supporting note.")).toBeVisible();

    cleanup();
    renderScreen({
      report: {
        ...defaultReport,
        guidanceItems: [
          {
            ...defaultItems[0],
            categoryLabel: " ",
            supporting: "",
          },
        ],
      },
    });
    expect(screen.queryByText("Barrier support")).not.toBeInTheDocument();
    expect(screen.queryByText("Host supporting note.")).not.toBeInTheDocument();
  });

  it("uses neutral warm styling when tone is malformed", () => {
    renderScreen({
      report: {
        ...defaultReport,
        guidanceItems: [
          {
            ...defaultItems[0],
            name: "Malformed tone item",
            tone: "urgent" as unknown as IngredientScannerGuidanceItem["tone"],
          },
        ],
      },
    });

    expect(screen.getByText("Malformed tone item").closest("li"))
      .toHaveAttribute("data-tone", "neutral");
  });

  it("does not render opaque identifiers", () => {
    const { container } = renderScreen();

    expectOpaqueIdsNotRendered(container);
  });
});

describe("IngredientScannerResultsScreen empty experience", () => {
  it("renders explicit empty state without an error alert", () => {
    renderScreen({
      state: "empty",
      report: {
        ...defaultReport,
        guidanceItems: [],
      },
    });

    expect(screen.getByText(copy.emptyTitle)).toBeVisible();
    expect(getButton(copy.backToReview)).toBeVisible();
    expect(getButton(copy.scanAnother)).toBeVisible();
    expect(getButton(copy.saveResult)).toBeVisible();
    expectNeutralEmptyCard();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders ready empty-array guidance as a neutral card", () => {
    renderScreen({
      report: {
        ...defaultReport,
        guidanceItems: [],
      },
    });

    expectNeutralEmptyCard();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps Save visible according to host availability", () => {
    renderScreen({
      canSaveResult: false,
      state: "empty",
      report: {
        ...defaultReport,
        guidanceItems: [],
      },
    });

    expect(getButton(copy.saveBlocked)).toBeVisible();
    expect(getButton(copy.saveBlocked)).toBeDisabled();
  });

  it("keeps the error experience visually and semantically distinct", () => {
    renderScreen({ state: "error" });

    expect(screen.getByRole("alert")).toHaveTextContent(copy.errorSupporting);
    expect(screen.queryByTestId("empty-guidance-card")).not.toBeInTheDocument();
  });
});

describe("IngredientScannerResultsScreen profile context", () => {
  it("renders no-profile and valid profile states", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        selectedProfile: undefined,
      },
    });

    expect(screen.getByText(copy.noProfile)).toBeVisible();
    expect(screen.getByText(copy.noProfileSupporting)).toBeVisible();

    rerender(<IngredientScannerResultsScreen {...createProps()} />);
    expect(screen.getByText("Amara")).toBeVisible();
    expect(screen.getByText("Host profile context")).toBeVisible();
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
      <IngredientScannerResultsScreen
        {...createProps({
          report: {
            ...defaultReport,
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

  it("shows malformed profile context while omitting profile from Save", async () => {
    const user = userEvent.setup();
    const onSaveResult = vi.fn();
    renderScreen({
      onSaveResult,
      report: {
        ...defaultReport,
        selectedProfile: {
          ...selectedProfile,
          profileId: " ",
        },
      },
    });

    expect(screen.getByText(copy.malformedProfile)).toBeVisible();
    await user.click(getButton(copy.saveResult));
    expect(onSaveResult).toHaveBeenCalledWith({
      resultId: opaqueResultId,
      draftId: opaqueDraftId,
    });
  });

  it("does not require sign-in or account creation UI", () => {
    renderScreen();
    const text = document.body.textContent?.toLowerCase() ?? "";

    expect(text).not.toContain("sign in");
    expect(text).not.toContain("create account");
  });
});

describe("IngredientScannerResultsScreen save helper", () => {
  it("creates valid guest and profiled submissions", () => {
    const guest = getIngredientScannerResultSaveSubmission({
      ...defaultReport,
      selectedProfile: undefined,
    });
    const profiled = getIngredientScannerResultSaveSubmission(defaultReport);

    expect(guest).toEqual({
      resultId: opaqueResultId,
      draftId: opaqueDraftId,
    });
    expect(Object.prototype.hasOwnProperty.call(guest, "profileId")).toBe(false);
    expect(profiled).toEqual({
      resultId: opaqueResultId,
      draftId: opaqueDraftId,
      profileId: opaqueProfileId,
    });
  });

  it("returns null for malformed required context", () => {
    expect(
      getIngredientScannerResultSaveSubmission({
        ...defaultReport,
        resultId: "",
      }),
    ).toBeNull();
  });

  it("omits malformed optional profile IDs", () => {
    expect(
      getIngredientScannerResultSaveSubmission({
        ...defaultReport,
        selectedProfile: {
          ...selectedProfile,
          profileId: " ",
        },
      }),
    ).toEqual({
      resultId: opaqueResultId,
      draftId: opaqueDraftId,
    });
  });
});

describe("IngredientScannerResultsScreen Back to review", () => {
  it("passes draft ID only on explicit activation", async () => {
    const user = userEvent.setup();
    const onBackToReview = vi.fn();
    const { rerender } = renderScreen({ onBackToReview });

    expect(onBackToReview).not.toHaveBeenCalled();
    rerender(
      <IngredientScannerResultsScreen
        {...createProps({
          onBackToReview,
          report: {
            ...defaultReport,
            summaryLabel: "Updated summary",
          },
        })}
      />,
    );
    expect(onBackToReview).not.toHaveBeenCalled();

    await user.click(getButton(copy.backToReview));
    expect(onBackToReview).toHaveBeenCalledWith(opaqueDraftId);
  });

  it("protects Back with pending label, duplicate guard, and conflicting disabled controls", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onBackToReview = vi.fn(() => deferred.promise);
    renderScreen({ onBackToReview });

    await user.click(getButton(copy.backToReview));
    await user.click(getButton(copy.backToReviewPending));

    expect(onBackToReview).toHaveBeenCalledTimes(1);
    expect(getButton(copy.backToReviewPending)).toBeDisabled();
    expect(getButton(copy.saveResult)).toBeDisabled();
    expect(getButton(copy.scanAnother)).toBeDisabled();

    deferred.resolve();
    await waitFor(() => expect(getButton(copy.backToReview)).toBeEnabled());
  });

  it("keeps host-blocked and malformed Back guarded", () => {
    const onBackToReview = vi.fn();
    const { rerender } = renderScreen({
      canGoBackToReview: false,
      onBackToReview,
    });

    const blocked = getButton(copy.backToReviewBlocked);
    expect(blocked).toBeDisabled();
    blocked.removeAttribute("disabled");
    fireEvent.click(blocked);
    expect(onBackToReview).not.toHaveBeenCalled();

    rerender(
      <IngredientScannerResultsScreen
        {...createProps({
          onBackToReview,
          report: {
            ...defaultReport,
            draftId: "",
          },
        })}
      />,
    );
    const malformed = getButton(copy.backToReviewBlocked);
    malformed.removeAttribute("disabled");
    fireEvent.click(malformed);
    expect(onBackToReview).not.toHaveBeenCalled();
  });

  it("converts Back rejection into a toast", async () => {
    const user = userEvent.setup();
    renderScreen({
      onBackToReview: vi.fn(() => Promise.reject(new Error("back failed"))),
    });

    await user.click(getButton(copy.backToReview));

    expect(await screen.findByText(copy.backError)).toBeVisible();
  });
});

describe("IngredientScannerResultsScreen Scan another product", () => {
  it("invokes callback and protects pending duplicates", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onScanAnotherProduct = vi.fn(() => deferred.promise);
    renderScreen({ onScanAnotherProduct });

    await user.click(getButton(copy.scanAnother));
    await user.click(getButton(copy.scanAnotherPending));

    expect(onScanAnotherProduct).toHaveBeenCalledTimes(1);
    expect(getButton(copy.scanAnotherPending)).toBeDisabled();
    expect(getButton(copy.backToReview)).toBeDisabled();
    expect(getButton(copy.saveResult)).toBeDisabled();

    deferred.resolve();
    await waitFor(() => expect(getButton(copy.scanAnother)).toBeEnabled());
  });

  it("keeps host-blocked Scan another visible and guarded", () => {
    const onScanAnotherProduct = vi.fn();
    renderScreen({
      canScanAnotherProduct: false,
      onScanAnotherProduct,
    });

    const button = getButton(copy.scanAnotherBlocked);
    expect(button).toBeDisabled();
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onScanAnotherProduct).not.toHaveBeenCalled();
  });

  it("converts Scan another rejection into a toast", async () => {
    const user = userEvent.setup();
    renderScreen({
      onScanAnotherProduct: vi.fn(() => Promise.reject(new Error("scan failed"))),
    });

    await user.click(getButton(copy.scanAnother));

    expect(await screen.findByText(copy.scanAnotherError)).toBeVisible();
  });
});

describe("IngredientScannerResultsScreen Save result", () => {
  it("invokes Save with exact submission and no local report mutation", async () => {
    const user = userEvent.setup();
    const onSaveResult = vi.fn();
    renderScreen({ onSaveResult });

    await user.click(getButton(copy.saveResult));

    expect(onSaveResult).toHaveBeenCalledWith({
      resultId: opaqueResultId,
      draftId: opaqueDraftId,
      profileId: opaqueProfileId,
    });
    expect(screen.getByText(defaultReport.summaryLabel)).toBeVisible();
    expect(screen.getByText(defaultReport.savedLabel ?? "")).toBeVisible();
  });

  it("protects Save with pending label, duplicate guard, and conflicting disabled controls", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onSaveResult = vi.fn(() => deferred.promise);
    renderScreen({ onSaveResult });

    await user.click(getButton(copy.saveResult));
    await user.click(getButton(copy.savePending));

    expect(onSaveResult).toHaveBeenCalledTimes(1);
    expect(getButton(copy.savePending)).toBeDisabled();
    expect(getButton(copy.backToReview)).toBeDisabled();
    expect(getButton(copy.scanAnother)).toBeDisabled();

    deferred.resolve();
    expect(await screen.findByText(copy.saveDone)).toBeVisible();
    await waitFor(() => expect(getButton(copy.saveResult)).toBeEnabled());
  });

  it("keeps host-blocked, callback-absent, and malformed Save guarded", () => {
    const onSaveResult = vi.fn();
    renderScreen({
      canSaveResult: false,
      onSaveResult,
    });

    const blocked = getButton(copy.saveBlocked);
    expect(blocked).toBeDisabled();
    blocked.removeAttribute("disabled");
    fireEvent.click(blocked);
    expect(onSaveResult).not.toHaveBeenCalled();

    cleanup();
    renderScreen({
      onSaveResult: undefined,
    });
    expect(getButton(copy.saveBlocked)).toBeDisabled();

    cleanup();
    renderScreen({
      onSaveResult,
      state: "empty",
      report: {
        ...defaultReport,
        resultId: "",
      },
    });
    const malformed = getButton(copy.saveBlocked);
    malformed.removeAttribute("disabled");
    fireEvent.click(malformed);
    expect(onSaveResult).not.toHaveBeenCalled();
  });

  it("uses distinct offline Save capability and guard precedence", () => {
    const onSaveResult = vi.fn();
    renderScreen({
      isOffline: true,
      isSaveAvailableOffline: false,
      onSaveResult,
    });

    const reconnect = getButton(copy.saveReconnect);
    expect(reconnect).toBeDisabled();
    reconnect.removeAttribute("disabled");
    fireEvent.click(reconnect);
    expect(onSaveResult).not.toHaveBeenCalled();

    cleanup();
    renderScreen({
      canSaveResult: false,
      isOffline: true,
      isSaveAvailableOffline: false,
      onSaveResult,
    });
    expect(getButton(copy.saveBlocked)).toBeDisabled();

    cleanup();
    renderScreen({
      isOffline: true,
      isSaveAvailableOffline: true,
      onSaveResult,
    });
    expect(getButton(copy.saveResult)).toBeEnabled();
  });

  it("converts Save rejection into a toast", async () => {
    const user = userEvent.setup();
    renderScreen({
      onSaveResult: vi.fn(() => Promise.reject(new Error("save failed"))),
    });

    await user.click(getButton(copy.saveResult));

    expect(await screen.findByText(copy.saveError)).toBeVisible();
  });
});

describe("IngredientScannerResultsScreen Retry", () => {
  it("renders Retry only when supplied", () => {
    const retry = vi.fn();
    renderScreen({ onRetryLoad: retry, state: "error" });
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
    await user.click(getButton(copy.retryPending));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(getButton(copy.retryPending)).toBeDisabled();

    deferred.reject(new Error("retry failed"));
    expect(await screen.findByText(copy.retryError)).toBeVisible();
  });
});

describe("IngredientScannerResultsScreen offline behaviour", () => {
  it("shows informational offline banner and keeps guidance readable", () => {
    renderScreen({ isOffline: true });

    expect(screen.getByText(copy.offline)).toBeVisible();
    expect(screen.getByText("Niacinamide")).toBeVisible();
    expect(screen.getByText(defaultReport.summaryLabel)).toBeVisible();
  });

  it("keeps Back and Scan governed by host props", () => {
    renderScreen({
      canGoBackToReview: false,
      canScanAnotherProduct: false,
      isOffline: true,
    });

    expect(getButton(copy.backToReviewBlocked)).toBeDisabled();
    expect(getButton(copy.scanAnotherBlocked)).toBeDisabled();
  });
});

describe("IngredientScannerResultsScreen architecture boundaries", () => {
  it("keeps StrictMode pending behaviour stable", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onSaveResult = vi.fn(() => deferred.promise);
    renderStrictScreen({ onSaveResult });

    await user.click(getButton(copy.saveResult));
    await user.click(getButton(copy.savePending));

    expect(onSaveResult).toHaveBeenCalledTimes(1);
    deferred.resolve();
  });

  it("recovers from StrictMode callback rejection with a toast", async () => {
    const user = userEvent.setup();
    renderStrictScreen({
      onSaveResult: vi.fn(() => Promise.reject(new Error("strict failed"))),
    });

    await user.click(getButton(copy.saveResult));

    expect(await screen.findByText(copy.saveError)).toBeVisible();
  });

  it("does not call browser, storage, camera, or location APIs", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    const storageSet = vi.spyOn(Storage.prototype, "setItem");
    const storageGet = vi.spyOn(Storage.prototype, "getItem");
    const indexedDbOpen = vi.fn();
    const mediaDevices = {
      getUserMedia: vi.fn(),
    };
    const geolocation = {
      getCurrentPosition: vi.fn(),
    };
    const fileReaderSpy = vi.fn();
    const originalFetch = globalThis.fetch;
    const originalCookie = document.cookie;
    const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB");
    const originalMediaDevices = Object.getOwnPropertyDescriptor(
      window.navigator,
      "mediaDevices",
    );
    const originalGeolocation = Object.getOwnPropertyDescriptor(
      window.navigator,
      "geolocation",
    );
    const originalFileReader = Object.getOwnPropertyDescriptor(
      globalThis,
      "FileReader",
    );

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchSpy,
    });
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: indexedDbOpen },
    });
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: mediaDevices,
    });
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: geolocation,
    });
    Object.defineProperty(globalThis, "FileReader", {
      configurable: true,
      value: fileReaderSpy,
    });

    try {
      renderScreen();
      await user.click(getButton(copy.saveResult));
      await user.click(getButton(copy.scanAnother));
      await user.click(getButton(copy.backToReview));

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageSet).not.toHaveBeenCalled();
      expect(storageGet).not.toHaveBeenCalled();
      expect(indexedDbOpen).not.toHaveBeenCalled();
      expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(fileReaderSpy).not.toHaveBeenCalled();
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

      if (originalMediaDevices) {
        Object.defineProperty(window.navigator, "mediaDevices", originalMediaDevices);
      } else {
        delete (window.navigator as unknown as { mediaDevices?: unknown }).mediaDevices;
      }

      if (originalGeolocation) {
        Object.defineProperty(window.navigator, "geolocation", originalGeolocation);
      } else {
        delete (window.navigator as unknown as { geolocation?: unknown }).geolocation;
      }

      if (originalFileReader) {
        Object.defineProperty(globalThis, "FileReader", originalFileReader);
      } else {
        delete (globalThis as { FileReader?: unknown }).FileReader;
      }
    }
  });

  it("renders no forbidden route elements, wording, styles, or opaque IDs", () => {
    const { container } = renderScreen();
    const text = container.textContent?.toLowerCase() ?? "";
    const markup = container.innerHTML.toLowerCase();

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(container.querySelector("nav")).toBeNull();
    expect(text).not.toContain("bottom navigation");
    expect(text).not.toContain("product recommendation");
    expect(text).not.toContain("store route");
    expect(text).not.toContain("affiliate");
    expect(text).not.toContain("marketplace");
    expect(text).not.toContain("external seller");
    expect(text).not.toContain("sponsored");
    expect(text).not.toContain("diagnosis");
    expect(text).not.toContain("treatment");
    expect(text).not.toContain("safe for you");
    expect(text).not.toContain("allergy-safe");
    expect(text).not.toContain("clinically approved");
    expect(text).not.toContain("dermatologist approved");
    expect(text).not.toContain("guaranteed compatible");
    expect(markup).not.toContain("sage");
    expect(markup).not.toContain("green");
    expect(markup).not.toContain("blue");
    expectOpaqueIdsNotRendered(container);
  });
});
