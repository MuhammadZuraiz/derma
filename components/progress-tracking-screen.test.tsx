import "@testing-library/jest-dom/vitest";

import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProgressTrackingScreen, {
  copy,
  hasUsableProgressTrackingReport,
  isProgressComparisonTone,
  isProgressTrackingState,
  type ProgressScanHistoryItem,
  type ProgressTrackingReport,
  type ProgressTrackingScreenProps,
} from "./progress-tracking-screen";

const opaqueProfileId = "profile-secret-progress-amara";
const opaqueScanIds = [
  "scan-secret-progress-june",
  "scan-secret-progress-july",
  "scan-secret-progress-august",
];
const opaqueMetricIds = [
  "metric-secret-texture",
  "metric-secret-comfort",
  "metric-secret-brightness",
];
const opaqueRoutineId = "routine-secret-progress";

const defaultScans: ProgressScanHistoryItem[] = [
  {
    scanId: opaqueScanIds[0],
    capturedAtLabel: "June 2, 2026",
    titleLabel: "June snapshot",
    categoryLabel: "Host category before",
    summaryLabel: "Host summary before.",
    imageUrl: "/progress-june.jpg",
    imageAlt: "June skincare snapshot",
    photoQualityLabel: "Host photo-quality note before",
    isBaselineSelected: true,
  },
  {
    scanId: opaqueScanIds[1],
    capturedAtLabel: "July 2, 2026",
    titleLabel: "July snapshot",
    categoryLabel: "Host category comparison",
    summaryLabel: "Host summary comparison.",
    imageUrl: "/progress-july.jpg",
    imageAlt: "July skincare snapshot",
    photoQualityLabel: "Host photo-quality note comparison",
    isComparisonSelected: true,
  },
  {
    scanId: opaqueScanIds[2],
    capturedAtLabel: "August 2, 2026",
    titleLabel: "August snapshot",
    categoryLabel: "Host category later",
    summaryLabel: "Host summary later.",
    imageUrl: "/progress-august.jpg",
    imageAlt: "August skincare snapshot",
    photoQualityLabel: "Host photo-quality note later",
  },
];

const defaultReport: ProgressTrackingReport = {
  profile: {
    profileId: opaqueProfileId,
    displayName: "Amara",
    contextLabel: "Host local profile context",
  },
  scans: defaultScans,
  comparison: {
    baselineScanId: opaqueScanIds[0],
    comparisonScanId: opaqueScanIds[1],
    headingLabel: "June to July host comparison",
    summaryLabel: "Host-supplied comparison notes.",
    helperLabel: "Host helper for selected snapshots.",
    metrics: [
      {
        metricId: opaqueMetricIds[0],
        label: "Texture note",
        baselineValueLabel: "Baseline host value",
        comparisonValueLabel: "Comparison host value",
        deltaLabel: "Host supplied change note",
        supporting: "Host supporting context.",
        tone: "neutral",
      },
      {
        metricId: opaqueMetricIds[1],
        label: "Comfort note",
        baselineValueLabel: "Baseline comfort value",
        comparisonValueLabel: "Comparison comfort value",
        tone: "attention",
      },
      {
        metricId: opaqueMetricIds[2],
        label: "Routine timing note",
        baselineValueLabel: "Baseline timing value",
        comparisonValueLabel: "Comparison timing value",
        tone: "caution",
      },
    ],
  },
  routinePrompt: {
    routineId: opaqueRoutineId,
    titleLabel: "Review your routine rhythm",
    supportingLabel: "Host prompt for the currently supplied routine.",
    actionLabel: "Open host routine",
  },
  helperLabel: "Host helper copy for progress snapshots.",
  privacyLabel: "Host privacy copy for progress history.",
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
  overrides: Partial<ProgressTrackingScreenProps> = {},
): ProgressTrackingScreenProps {
  return {
    report: defaultReport,
    onBack: vi.fn(),
    onStartNewScan: vi.fn(),
    onSelectBaseline: vi.fn(),
    onSelectComparison: vi.fn(),
    onOpenReport: vi.fn(),
    onOpenRoutine: vi.fn(),
    onRetryLoad: vi.fn(),
    ...overrides,
  };
}

function renderScreen(
  overrides: Partial<ProgressTrackingScreenProps> = {},
) {
  return render(
    <ProgressTrackingScreen {...createProps(overrides)} />,
  );
}

function renderStrictScreen(
  overrides: Partial<ProgressTrackingScreenProps> = {},
) {
  return render(
    <StrictMode>
      <ProgressTrackingScreen {...createProps(overrides)} />
    </StrictMode>,
  );
}

function getButton(name: string | RegExp) {
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
  const rendered = `${container.textContent ?? ""} ${container.innerHTML}`;

  expect(rendered).not.toContain(opaqueProfileId);
  expect(rendered).not.toContain(opaqueRoutineId);

  for (const scanId of opaqueScanIds) {
    expect(rendered).not.toContain(scanId);
  }

  for (const metricId of opaqueMetricIds) {
    expect(rendered).not.toContain(metricId);
  }
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ProgressTrackingScreen runtime helpers", () => {
  it("recognises only supported runtime states", () => {
    expect(isProgressTrackingState("loading")).toBe(true);
    expect(isProgressTrackingState("ready")).toBe(true);
    expect(isProgressTrackingState("empty")).toBe(true);
    expect(isProgressTrackingState("error")).toBe(true);
    expect(isProgressTrackingState("blocked")).toBe(false);
  });

  it("recognises only supported comparison tones", () => {
    expect(isProgressComparisonTone("neutral")).toBe(true);
    expect(isProgressComparisonTone("attention")).toBe(true);
    expect(isProgressComparisonTone("caution")).toBe(true);
    expect(isProgressComparisonTone("urgent")).toBe(false);
  });

  it("validates only required profile ID and scan-array context", () => {
    expect(hasUsableProgressTrackingReport(defaultReport)).toBe(true);
    expect(hasUsableProgressTrackingReport(null)).toBe(false);
    expect(hasUsableProgressTrackingReport(undefined)).toBe(false);
    expect(
      hasUsableProgressTrackingReport({
        ...defaultReport,
        profile: {
          ...defaultReport.profile,
          profileId: "",
        },
      }),
    ).toBe(false);
    expect(
      hasUsableProgressTrackingReport({
        ...defaultReport,
        profile: {
          ...defaultReport.profile,
          profileId: "   ",
        },
      }),
    ).toBe(false);
    expect(
      hasUsableProgressTrackingReport({
        ...defaultReport,
        scans: {} as unknown as ProgressScanHistoryItem[],
      }),
    ).toBe(false);
    expect(
      hasUsableProgressTrackingReport({
        ...defaultReport,
        profile: {
          ...defaultReport.profile,
          displayName: "",
        },
      }),
    ).toBe(true);
  });

  it("fails closed for ready null, malformed required report, and unknown state", () => {
    const { rerender } = renderScreen({
      report: null,
      state: "ready",
    });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          report: {
            ...defaultReport,
            profile: {
              ...defaultReport.profile,
              profileId: " ",
            },
          },
        })}
      />,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          state: "unexpected" as ProgressTrackingScreenProps["state"],
        })}
      />,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.errorHeading,
      }),
    ).toBeVisible();
  });
});

describe("ProgressTrackingScreen core states", () => {
  it("renders loading copy with polite static-only status semantics", () => {
    renderScreen({ state: "loading" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.loadingHeading,
      }),
    ).toBeVisible();
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(copy.loadingSupporting);
    expect(within(status).queryByRole("button")).not.toBeInTheDocument();
    expect(getButton(copy.back)).toBeVisible();
  });

  it("renders ready heading and exactly one h1", () => {
    renderScreen();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.heading,
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("keeps the mobile reading order aligned with progress review", () => {
    renderScreen({ isOffline: true });

    expectTextOrder(
      copy.heading,
      copy.offline,
      copy.profileTitle,
      "Amara",
      copy.chooseTitle,
      copy.historyTitle,
      "June snapshot",
      "July snapshot",
      "August snapshot",
      copy.comparisonTitle,
      "June to July host comparison",
      "Review your routine rhythm",
      copy.startNewScan,
    );
  });

  it("renders error with Retry outside the alert only when supplied", () => {
    const { rerender } = renderScreen({
      onRetryLoad: vi.fn(),
      state: "error",
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(copy.errorSupporting);
    expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
    expect(getButton(copy.retry)).toBeVisible();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          onRetryLoad: undefined,
          state: "error",
        })}
      />,
    );
    expect(screen.queryByRole("button", { name: copy.retry }))
      .not.toBeInTheDocument();
  });

  it("renders explicit and ready-empty states as neutral non-alert cards", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        scans: [],
      },
      state: "empty",
    });

    const emptyCard = screen.getByTestId("progress-empty-card");
    expect(emptyCard).toHaveClass("border-[var(--dl-parchment)]");
    expect(emptyCard).toHaveClass("bg-[var(--dl-surface-soft)]");
    expect(emptyCard).not.toHaveAttribute("role", "alert");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getButton(copy.startNewScan)).toBeVisible();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          report: {
            ...defaultReport,
            scans: [],
          },
          state: "ready",
        })}
      />,
    );
    expect(screen.getByTestId("progress-empty-card")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps empty fallback readable when usable profile context is absent", () => {
    renderScreen({
      report: null,
      state: "empty",
    });

    expect(screen.getByText(copy.emptyHeading)).toBeVisible();
    expect(screen.getByText(copy.emptySupporting)).toBeVisible();
    expect(getButton(copy.startBlocked)).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders offline status as informational while content remains readable", () => {
    renderScreen({ isOffline: true });

    expect(screen.getByText(copy.offline)).toBeVisible();
    expect(screen.getByText("June snapshot")).toBeVisible();
    expect(screen.getByText("Review your routine rhythm")).toBeVisible();
  });
});

describe("ProgressTrackingScreen profile and snapshot rendering", () => {
  it("renders profile display fallback, context label, and fixed helper without the opaque ID", () => {
    const { container, rerender } = renderScreen();

    expect(screen.getByText("Amara")).toBeVisible();
    expect(screen.getByText("Host local profile context")).toBeVisible();
    expect(screen.getByText(copy.profileHelper)).toBeVisible();
    expectOpaqueIdsNotRendered(container);

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          report: {
            ...defaultReport,
            profile: {
              ...defaultReport.profile,
              displayName: "   ",
            },
          },
        })}
      />,
    );
    expect(screen.getByText(copy.unnamedProfile)).toBeVisible();
  });

  it("preserves host-supplied scan order and labels", () => {
    renderScreen();

    expectTextOrder("June snapshot", "July snapshot", "August snapshot");
    expect(screen.getByText("Host category before")).toBeVisible();
    expect(screen.getByText("Host summary comparison.")).toBeVisible();
    expect(screen.getByText("Host photo-quality note later")).toBeVisible();
  });

  it("renders supplied images, alt text, and unavailable placeholders", () => {
    const { rerender } = renderScreen();

    expect(
      screen.getByRole("img", { name: "June skincare snapshot" }),
    ).toHaveAttribute("src", "/progress-june.jpg");

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          report: {
            ...defaultReport,
            scans: [
              {
                ...defaultScans[0],
                imageAlt: " ",
                imageUrl: "/replacement-progress.jpg",
              },
              {
                ...defaultScans[1],
                imageUrl: " ",
              },
            ],
          },
        })}
      />,
    );
    expect(
      screen.getByRole("img", { name: copy.imageAltFallback }),
    ).toHaveAttribute("src", "/replacement-progress.jpg");
    expect(screen.getByText(copy.imageUnavailable)).toBeVisible();
  });

  it("keeps a scan card readable after image failure and retries replacement URLs", () => {
    const { rerender } = renderScreen();

    fireEvent.error(
      screen.getByRole("img", { name: "June skincare snapshot" }),
    );

    expect(screen.getByText(copy.imageUnavailable)).toBeVisible();
    expect(screen.getByText("June snapshot")).toBeVisible();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          report: {
            ...defaultReport,
            scans: [
              {
                ...defaultScans[0],
                imageUrl: "/progress-june-replacement.jpg",
              },
            ],
          },
        })}
      />,
    );

    expect(
      screen.getByRole("img", { name: "June skincare snapshot" }),
    ).toHaveAttribute("src", "/progress-june-replacement.jpg");
  });

  it("renders malformed scan entries in received order with neutral fallbacks", () => {
    const { container } = renderScreen({
      report: {
        ...defaultReport,
        scans: [
          {
            scanId: "valid-before",
            capturedAtLabel: "Valid before date",
            titleLabel: "Valid before",
          },
          null,
          undefined,
          "unexpected",
          42,
          {
            scanId: "valid-after",
            capturedAtLabel: "Valid after date",
            titleLabel: "Valid after",
          },
        ] as unknown as ProgressScanHistoryItem[],
      },
    });
    const cards = screen.getAllByTestId("progress-scan-card");

    expect(cards).toHaveLength(6);
    expect(within(cards[0]).getByText("Valid before")).toBeVisible();
    expect(within(cards[5]).getByText("Valid after")).toBeVisible();

    for (const fallbackCard of cards.slice(1, 5)) {
      expect(within(fallbackCard).getByText(copy.dateUnavailable)).toBeVisible();
      expect(within(fallbackCard).getByText(copy.untitledSnapshot)).toBeVisible();
      expect(within(fallbackCard).getByText(copy.imageUnavailable)).toBeVisible();
      expect(
        within(fallbackCard).getByRole("button", {
          name: `${copy.baselineBlocked}: ${copy.untitledSnapshot}`,
        }),
      ).toBeDisabled();
      expect(
        within(fallbackCard).getByRole("button", {
          name: `${copy.comparisonBlocked}: ${copy.untitledSnapshot}`,
        }),
      ).toBeDisabled();
      expect(
        within(fallbackCard).getByRole("button", {
          name: `${copy.reportBlocked}: ${copy.untitledSnapshot}`,
        }),
      ).toBeDisabled();
    }

    expectTextOrder(
      "Valid before",
      copy.untitledSnapshot,
      copy.untitledSnapshot,
      copy.untitledSnapshot,
      copy.untitledSnapshot,
      "Valid after",
    );
    expect(container.textContent).not.toContain("valid-before");
    expect(container.textContent).not.toContain("valid-after");
    expect(container.textContent).not.toContain("unexpected");
    expect(container.textContent).not.toContain("42");
  });

  it("omits malformed optional scan fields instead of rendering primitive values", () => {
    const { container } = renderScreen({
      report: {
        ...defaultReport,
        scans: [
          {
            scanId: opaqueScanIds[0],
            capturedAtLabel: "Safe date",
            titleLabel: "Safe snapshot",
            categoryLabel: 10 as unknown as string,
            summaryLabel: false as unknown as string,
            photoQualityLabel: {} as unknown as string,
          },
        ],
      },
    });

    expect(screen.getByText("Safe snapshot")).toBeVisible();
    expect(container.textContent).not.toContain("10");
    expect(container.textContent).not.toContain("false");
    expect(container.textContent).not.toContain("[object Object]");
  });

  it("renders selected baseline and selected comparison labels independently", () => {
    renderScreen({
      report: {
        ...defaultReport,
        scans: [
          {
            ...defaultScans[2],
            isBaselineSelected: true,
            isComparisonSelected: true,
          },
        ],
      },
    });

    expect(
      getButton(`${copy.selectedBaseline}: August snapshot`),
    ).toBeDisabled();
    expect(
      getButton(`${copy.selectedComparison}: August snapshot`),
    ).toBeDisabled();
  });
});

describe("ProgressTrackingScreen scan actions", () => {
  it("selects a baseline by callback-only scan ID with contextual pending copy", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onSelectBaseline = vi.fn(() => deferred.promise);

    renderScreen({ onSelectBaseline });

    await user.click(getButton(`${copy.useBaseline}: August snapshot`));
    await user.click(getButton(`${copy.selectingBaseline.replace("...", "")}: August snapshot`));

    expect(onSelectBaseline).toHaveBeenCalledTimes(1);
    expect(onSelectBaseline).toHaveBeenCalledWith(opaqueScanIds[2]);
    expect(
      getButton(`${copy.selectingBaseline.replace("...", "")}: August snapshot`),
    ).toBeDisabled();
    expect(getButton(`${copy.useComparison}: August snapshot`)).toBeDisabled();
    expect(getButton(copy.startNewScan)).toBeDisabled();

    deferred.resolve();
    await waitFor(() => {
      expect(getButton(`${copy.useBaseline}: August snapshot`)).toBeEnabled();
    });
  });

  it("selects a comparison and opens a report through explicit callbacks", async () => {
    const user = userEvent.setup();
    const onSelectComparison = vi.fn();
    const onOpenReport = vi.fn();

    renderScreen({ onOpenReport, onSelectComparison });

    await user.click(getButton(`${copy.useComparison}: August snapshot`));
    await user.click(getButton(`${copy.openReport}: August snapshot`));

    expect(onSelectComparison).toHaveBeenCalledWith(opaqueScanIds[2]);
    expect(onOpenReport).toHaveBeenCalledWith(opaqueScanIds[2]);
  });

  it("keeps host-blocked, callback-absent, per-scan blocked, and malformed scan actions guarded", () => {
    const onSelectBaseline = vi.fn();
    const onSelectComparison = vi.fn();
    const onOpenReport = vi.fn();
    const { rerender } = renderScreen({
      canOpenReport: false,
      canSelectBaseline: false,
      canSelectComparison: false,
      onOpenReport,
      onSelectBaseline,
      onSelectComparison,
    });

    expect(getButton(`${copy.baselineBlocked}: August snapshot`)).toBeDisabled();
    expect(getButton(`${copy.comparisonBlocked}: August snapshot`)).toBeDisabled();
    expect(getButton(`${copy.reportBlocked}: August snapshot`)).toBeDisabled();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          onOpenReport: undefined,
          onSelectBaseline: undefined,
          onSelectComparison: undefined,
        })}
      />,
    );
    expect(getButton(`${copy.baselineBlocked}: August snapshot`)).toBeDisabled();
    expect(getButton(`${copy.comparisonBlocked}: August snapshot`)).toBeDisabled();
    expect(getButton(`${copy.reportBlocked}: August snapshot`)).toBeDisabled();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          report: {
            ...defaultReport,
            scans: [
              {
                ...defaultScans[2],
                canOpenReport: false,
                canSelectAsBaseline: false,
                canSelectAsComparison: false,
              },
            ],
          },
          onOpenReport,
          onSelectBaseline,
          onSelectComparison,
        })}
      />,
    );
    expect(getButton(`${copy.baselineBlocked}: August snapshot`)).toBeDisabled();
    expect(getButton(`${copy.comparisonBlocked}: August snapshot`)).toBeDisabled();
    expect(getButton(`${copy.reportBlocked}: August snapshot`)).toBeDisabled();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          report: {
            ...defaultReport,
            scans: [
              {
                ...defaultScans[2],
                scanId: " ",
              },
            ],
          },
          onOpenReport,
          onSelectBaseline,
          onSelectComparison,
        })}
      />,
    );
    const baselineButton = getButton(`${copy.baselineBlocked}: August snapshot`);
    baselineButton.removeAttribute("disabled");
    fireEvent.click(baselineButton);
    expect(onSelectBaseline).not.toHaveBeenCalled();
  });

  it("converts scan-action rejections into action-specific toasts", async () => {
    const user = userEvent.setup();
    const cases: Array<{
      buttonName: string;
      failureText: string;
      props: Partial<ProgressTrackingScreenProps>;
    }> = [
      {
        buttonName: `${copy.useBaseline}: August snapshot`,
        failureText: copy.baselineError,
        props: {
          onSelectBaseline: vi.fn(() => Promise.reject(new Error("baseline"))),
        },
      },
      {
        buttonName: `${copy.useComparison}: August snapshot`,
        failureText: copy.comparisonError,
        props: {
          onSelectComparison: vi.fn(() => Promise.reject(new Error("comparison"))),
        },
      },
      {
        buttonName: `${copy.openReport}: August snapshot`,
        failureText: copy.reportError,
        props: {
          onOpenReport: vi.fn(() => Promise.reject(new Error("report"))),
        },
      },
    ];

    for (const scenario of cases) {
      cleanup();
      renderScreen(scenario.props);
      await user.click(getButton(scenario.buttonName));
      expect(await screen.findByText(scenario.failureText)).toBeVisible();
    }
  });
});

describe("ProgressTrackingScreen comparison summary", () => {
  it("renders comparison summary, metric order, tones, and omits metric IDs", () => {
    const { container } = renderScreen();

    expect(screen.getByText(copy.comparisonTitle)).toBeVisible();
    expect(screen.getByText("June to July host comparison")).toBeVisible();
    expectTextOrder("Texture note", "Comfort note", "Routine timing note");

    const metrics = screen.getAllByTestId("progress-metric-row");
    expect(metrics[0]).toHaveAttribute("data-tone", "neutral");
    expect(metrics[1]).toHaveAttribute("data-tone", "attention");
    expect(metrics[2]).toHaveAttribute("data-tone", "caution");
    expect(screen.getByText("Host supplied change note")).toBeVisible();
    expect(screen.getByText("Host supporting context.")).toBeVisible();
    expectOpaqueIdsNotRendered(container);
  });

  it("does not render the comparison section when host supplies no comparison", () => {
    renderScreen({
      report: {
        ...defaultReport,
        comparison: undefined,
      },
    });

    expect(screen.queryByText(copy.comparisonTitle)).not.toBeInTheDocument();
  });

  it("fails malformed comparison IDs into a readable summary without metric rows", () => {
    renderScreen({
      report: {
        ...defaultReport,
        comparison: {
          ...defaultReport.comparison!,
          baselineScanId: "",
        },
      },
    });

    expect(screen.getByText(copy.comparisonUnavailable)).toBeVisible();
    expect(screen.queryAllByTestId("progress-metric-row")).toHaveLength(0);
  });

  it("renders no-metric fallback when host supplies no usable metric list", () => {
    const { rerender } = renderScreen({
      report: {
        ...defaultReport,
        comparison: {
          ...defaultReport.comparison!,
          metrics: [],
        },
      },
    });

    expect(screen.getByText(copy.noMetrics)).toBeVisible();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          report: {
            ...defaultReport,
            comparison: {
              ...defaultReport.comparison!,
              metrics: undefined,
            },
          },
        })}
      />,
    );
    expect(screen.getByText(copy.noMetrics)).toBeVisible();
  });

  it("renders malformed metric entries as neutral fallback rows in received order", () => {
    const { container } = renderScreen({
      report: {
        ...defaultReport,
        comparison: {
          ...defaultReport.comparison!,
          metrics: [
            {
              metricId: "metric-valid-before",
              label: "Valid before metric",
              baselineValueLabel: "Before baseline",
              comparisonValueLabel: "Before comparison",
            },
            null,
            undefined,
            "unexpected",
            42,
            {
              metricId: "metric-valid-after",
              label: "Valid after metric",
              baselineValueLabel: "After baseline",
              comparisonValueLabel: "After comparison",
            },
          ] as unknown as NonNullable<
            ProgressTrackingReport["comparison"]
          >["metrics"],
        },
      },
    });
    const rows = screen.getAllByTestId("progress-metric-row");

    expect(rows).toHaveLength(6);
    expect(within(rows[0]).getByText("Valid before metric")).toBeVisible();
    expect(within(rows[5]).getByText("Valid after metric")).toBeVisible();

    for (const row of rows.slice(1, 5)) {
      expect(within(row).getByText(copy.metricLabelUnavailable)).toBeVisible();
      expect(within(row).getByText(copy.baselineValueUnavailable)).toBeVisible();
      expect(within(row).getByText(copy.comparisonValueUnavailable)).toBeVisible();
      expect(row).toHaveAttribute("data-tone", "neutral");
    }

    expectTextOrder(
      "Valid before metric",
      copy.metricLabelUnavailable,
      copy.metricLabelUnavailable,
      copy.metricLabelUnavailable,
      copy.metricLabelUnavailable,
      "Valid after metric",
    );
    expect(container.textContent).not.toContain("metric-valid-before");
    expect(container.textContent).not.toContain("metric-valid-after");
    expect(container.textContent).not.toContain("unexpected");
    expect(container.textContent).not.toContain("42");
  });
});

describe("ProgressTrackingScreen routine prompt", () => {
  it("renders routine prompt and passes routine ID through callback-only context", async () => {
    const user = userEvent.setup();
    const onOpenRoutine = vi.fn();
    const { container } = renderScreen({ onOpenRoutine });

    await user.click(getButton("Open host routine"));

    expect(onOpenRoutine).toHaveBeenCalledWith(opaqueRoutineId);
    expect(container.textContent).not.toContain(opaqueRoutineId);
  });

  it("uses safe routine fallbacks and default action label", () => {
    renderScreen({
      report: {
        ...defaultReport,
        routinePrompt: {
          routineId: opaqueRoutineId,
          titleLabel: " ",
          supportingLabel: "",
          actionLabel: undefined,
        },
      },
    });

    expect(screen.getByText(copy.routineTitleUnavailable)).toBeVisible();
    expect(screen.getByText(copy.routineSupportingUnavailable)).toBeVisible();
    expect(getButton(copy.routineAction)).toBeEnabled();
  });

  it("keeps malformed, callback-absent, and host-blocked routine prompt guarded", () => {
    const onOpenRoutine = vi.fn();
    const { rerender } = renderScreen({
      canOpenRoutine: false,
      onOpenRoutine,
    });

    expect(getButton(copy.routineBlocked)).toBeDisabled();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          onOpenRoutine: undefined,
        })}
      />,
    );
    expect(getButton(copy.routineBlocked)).toBeDisabled();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          onOpenRoutine,
          report: {
            ...defaultReport,
            routinePrompt: {
              ...defaultReport.routinePrompt!,
              routineId: " ",
            },
          },
        })}
      />,
    );
    const button = getButton(copy.routineBlocked);
    button.removeAttribute("disabled");
    fireEvent.click(button);
    expect(onOpenRoutine).not.toHaveBeenCalled();
  });

  it("protects routine pending state and converts rejection into a toast", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onOpenRoutine = vi
      .fn()
      .mockImplementationOnce(() => deferred.promise)
      .mockRejectedValueOnce(new Error("routine"));

    renderScreen({ onOpenRoutine });

    await user.click(getButton("Open host routine"));
    await user.click(getButton(copy.openingRoutine));
    expect(onOpenRoutine).toHaveBeenCalledTimes(1);
    expect(getButton(copy.openingRoutine)).toBeDisabled();

    deferred.resolve();
    await waitFor(() => expect(getButton("Open host routine")).toBeEnabled());

    await user.click(getButton("Open host routine"));
    expect(await screen.findByText(copy.routineError)).toBeVisible();
  });
});

describe("ProgressTrackingScreen top-level route actions", () => {
  it("runs Back only on explicit activation with duplicate protection", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onBack = vi.fn(() => deferred.promise);

    renderScreen({ onBack });

    await user.click(getButton(copy.back));
    await user.click(getButton(copy.goingBack));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(getButton(copy.goingBack)).toBeDisabled();

    deferred.resolve();
    await waitFor(() => expect(getButton(copy.back)).toBeEnabled());
  });

  it("keeps host-blocked Back guarded and reports rejection through toast", async () => {
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
      <ProgressTrackingScreen
        {...createProps({
          onBack: vi.fn(() => Promise.reject(new Error("back"))),
        })}
      />,
    );
    await user.click(getButton(copy.back));
    expect(await screen.findByText(copy.backError)).toBeVisible();
  });

  it("starts a new scan with profile ID and no local mutation", async () => {
    const user = userEvent.setup();
    const onStartNewScan = vi.fn();
    const { container } = renderScreen({ onStartNewScan });

    await user.click(getButton(copy.startNewScan));

    expect(onStartNewScan).toHaveBeenCalledWith(opaqueProfileId);
    expect(screen.getByText("June snapshot")).toBeVisible();
    expect(container.textContent).not.toContain(opaqueProfileId);
  });

  it("protects Start new scan pending, host-blocked, malformed-profile, and rejection states", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onStartNewScan = vi
      .fn()
      .mockImplementationOnce(() => deferred.promise)
      .mockRejectedValueOnce(new Error("start"));
    const { rerender } = renderScreen({ onStartNewScan });

    await user.click(getButton(copy.startNewScan));
    await user.click(getButton(copy.openingScanSetup));
    expect(onStartNewScan).toHaveBeenCalledTimes(1);
    expect(getButton(copy.openingScanSetup)).toBeDisabled();

    deferred.resolve();
    await waitFor(() => expect(getButton(copy.startNewScan)).toBeEnabled());

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          canStartNewScan: false,
          onStartNewScan,
        })}
      />,
    );
    expect(getButton(copy.startBlocked)).toBeDisabled();

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          onStartNewScan,
          report: {
            ...defaultReport,
            profile: {
              ...defaultReport.profile,
              profileId: " ",
            },
          },
        })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(copy.errorSupporting);

    rerender(
      <ProgressTrackingScreen
        {...createProps({
          onStartNewScan,
        })}
      />,
    );
    await user.click(getButton(copy.startNewScan));
    expect(await screen.findByText(copy.startError)).toBeVisible();
  });

  it("protects Retry with pending label, duplicate guard, and toast recovery", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onRetryLoad = vi.fn(() => deferred.promise);

    renderScreen({
      onRetryLoad,
      state: "error",
    });

    await user.click(getButton(copy.retry));
    await user.click(getButton(copy.tryingAgain));

    expect(onRetryLoad).toHaveBeenCalledTimes(1);
    expect(getButton(copy.tryingAgain)).toBeDisabled();

    deferred.reject(new Error("retry"));
    expect(await screen.findByText(copy.retryError)).toBeVisible();
  });
});

describe("ProgressTrackingScreen async safety and architecture boundaries", () => {
  it("does not call route callbacks on mount or rerender", () => {
    const props = createProps();
    const callbacks = [
      props.onBack,
      props.onStartNewScan,
      props.onSelectBaseline,
      props.onSelectComparison,
      props.onOpenReport,
      props.onOpenRoutine,
      props.onRetryLoad,
    ];
    const { rerender } = render(<ProgressTrackingScreen {...props} />);

    rerender(<ProgressTrackingScreen {...props} isOffline />);

    for (const callback of callbacks) {
      expect(callback).not.toHaveBeenCalled();
    }
  });

  it("keeps StrictMode duplicate activation stable", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    const onSelectBaseline = vi.fn(() => deferred.promise);

    renderStrictScreen({ onSelectBaseline });

    await user.click(getButton(`${copy.useBaseline}: August snapshot`));
    await user.click(getButton(`${copy.selectingBaseline.replace("...", "")}: August snapshot`));

    expect(onSelectBaseline).toHaveBeenCalledTimes(1);
    deferred.resolve();
  });

  it("recovers from StrictMode callback rejection with a toast", async () => {
    const user = userEvent.setup();

    renderStrictScreen({
      onOpenReport: vi.fn(() => Promise.reject(new Error("strict report"))),
    });

    await user.click(getButton(`${copy.openReport}: August snapshot`));
    expect(await screen.findByText(copy.reportError)).toBeVisible();
  });

  it("auto-dismisses callback rejection toasts", async () => {
    vi.useFakeTimers();

    renderScreen({
      onOpenReport: vi.fn(() => Promise.reject(new Error("report"))),
    });

    fireEvent.click(getButton(`${copy.openReport}: August snapshot`));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(copy.reportError)).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText(copy.reportError)).not.toBeInTheDocument();
  });

  it("does not call browser, storage, camera, picker, file, or location APIs", async () => {
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
      const { container } = renderScreen();
      await user.click(getButton(`${copy.useBaseline}: August snapshot`));
      await user.click(getButton(`${copy.openReport}: August snapshot`));
      await user.click(getButton("Open host routine"));
      await user.click(getButton(copy.startNewScan));

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageSet).not.toHaveBeenCalled();
      expect(storageGet).not.toHaveBeenCalled();
      expect(indexedDbOpen).not.toHaveBeenCalled();
      expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(fileReaderSpy).not.toHaveBeenCalled();
      expect(document.cookie).toBe(originalCookie);
      expect(container.querySelector('input[type="file"]')).toBeNull();
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
    expect(text).not.toContain("sign in");
    expect(text).not.toContain("create account");
    expect(text).not.toContain("affiliate");
    expect(text).not.toContain("marketplace");
    expect(text).not.toContain("external seller");
    expect(text).not.toContain("sponsored");
    expect(text).not.toContain("diagnosis");
    expect(text).not.toContain("treatment");
    expect(text).not.toContain("medical monitoring");
    expect(text).not.toContain("average");
    expect(text).not.toContain("improved");
    expect(text).not.toContain("worsened");
    expect(markup).not.toContain("sage");
    expect(markup).not.toContain("green");
    expect(markup).not.toContain("blue");
    expectOpaqueIdsNotRendered(container);
  });
});
