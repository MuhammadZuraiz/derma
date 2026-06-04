import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RoutineRecommendationsScreen, {
  copy,
  type RoutineRecommendationsReport,
  type RoutineRecommendationsScreenProps,
} from "./routine-recommendations-screen";

const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
const originalGeolocationDescriptor = Object.getOwnPropertyDescriptor(navigator, "geolocation");
const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");

function restoreDescriptor(target: object, property: PropertyKey, descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(target, property, descriptor);
  else Reflect.deleteProperty(target, property);
}

afterEach(() => {
  cleanup();
  restoreDescriptor(navigator, "mediaDevices", originalMediaDevicesDescriptor);
  restoreDescriptor(navigator, "geolocation", originalGeolocationDescriptor);
  restoreDescriptor(globalThis, "fetch", originalFetchDescriptor);
  vi.restoreAllMocks();
});

const cleanser = {
  productId: "p-cleanser",
  name: "Soft Balance Cleanser",
  brand: "DermaLens",
  imageUrl: "/products/cleanser.png",
  priceLabel: "AED 54",
  availabilityLabel: "Available",
  description: "A gentle first-party cleanser recommendation.",
  isAvailable: true,
};

const moisturiser = {
  productId: "p-moisturiser",
  name: "Barrier Comfort Cream",
  brand: "DermaLens",
  imageUrl: "/products/moisturiser.png",
  priceLabel: "AED 72",
  availabilityLabel: "Available",
  isAvailable: true,
};

const unavailableProduct = {
  productId: "p-unavailable",
  name: "Daily Comfort SPF",
  brand: "DermaLens",
  availabilityLabel: "Unavailable in your region",
  description: "A first-party recommendation that is not currently available.",
  isAvailable: false,
};

const baseReport: RoutineRecommendationsReport = {
  routineId: "routine-1",
  profileName: " Amara ",
  generatedAtLabel: "2 June 2026 · 13:30",
  saveLabel: "Saved locally on this device",
  morning: {
    title: "Morning routine",
    summary: "A simple routine for a calm start to the day.",
    completionTimeLabel: "About 4 minutes",
    steps: [
      {
        id: "m-cleanse",
        orderLabel: "01",
        title: "Cleanse gently",
        categoryLabel: "Cleanser",
        purpose: "Remove overnight buildup without stripping the skin.",
        usage: "Massage onto damp skin, then rinse with lukewarm water.",
        frequencyLabel: "Every morning",
        rationale: "A gentle cleanse prepares the skin for the rest of the routine.",
        recommendedProducts: [cleanser],
      },
      {
        id: "m-moisturise",
        orderLabel: "02",
        title: "Support your barrier",
        categoryLabel: "Moisturiser",
        purpose: "Help maintain comfortable hydration.",
        usage: "Apply a small amount after cleansing.",
        frequencyLabel: "Every morning",
        caution: "Introduce gradually if your skin is sensitive.",
        recommendedProducts: [moisturiser, unavailableProduct],
      },
    ],
  },
  evening: {
    title: "Evening routine",
    summary: "A short evening routine focused on cleansing and comfort.",
    steps: [
      {
        id: "e-cleanse",
        orderLabel: "01",
        title: "Remove the day gently",
        categoryLabel: "Cleanser",
        purpose: "Clear away daily buildup.",
        usage: "Cleanse with lukewarm water and pat dry.",
        frequencyLabel: "Every evening",
        recommendedProducts: [],
      },
    ],
  },
  weeklyGuidance: [
    {
      id: "w-1",
      title: "Gentle exfoliation",
      frequencyLabel: "Once weekly",
      description: "Use only if your skin feels comfortable.",
      caution: "Skip this step if irritation appears.",
    },
    {
      id: "w-2",
      title: "Barrier reset evening",
      frequencyLabel: "As needed",
      description: "Keep the routine simple when your skin feels stressed.",
    },
  ],
};

const baseProps: RoutineRecommendationsScreenProps = {
  state: "ready",
  report: baseReport,
  onBack: vi.fn(),
  onOpenStore: vi.fn(),
};

function reportWith(overrides: Partial<RoutineRecommendationsReport> = {}): RoutineRecommendationsReport {
  return { ...baseReport, ...overrides };
}

function renderScreen(overrides: Partial<RoutineRecommendationsScreenProps> = {}) {
  const props: RoutineRecommendationsScreenProps = {
    ...baseProps,
    onBack: vi.fn(),
    onOpenStore: vi.fn(),
    ...overrides,
  };
  const result = render(<RoutineRecommendationsScreen {...props} />);
  return { ...result, props };
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function getMorningButton() {
  return screen.getByRole("button", { name: copy.morning });
}

function getEveningButton() {
  return screen.getByRole("button", { name: copy.evening });
}

describe("RoutineRecommendationsScreen", () => {
  it("renders the loading heading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByRole("heading", { name: copy.loadingHeading })).toBeInTheDocument();
  });

  it("uses polite status semantics while loading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByText(copy.loadingHeading).closest('[role="status"]')).toHaveAttribute("aria-live", "polite");
  });

  it("keeps interactive buttons outside the loading status region", () => {
    renderScreen({ state: "loading", report: null });
    const status = screen.getByText(copy.loadingHeading).closest('[role="status"]');
    expect(status).not.toBeNull();
    expect(within(status as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a disabled Shop routine products button while loading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.getByRole("button", { name: copy.shopRoutine })).toBeDisabled();
  });

  it("does not render unavailable-store wording while loading", () => {
    renderScreen({ state: "loading", report: null });
    expect(screen.queryByRole("button", { name: copy.storeUnavailable })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.reconnectToShop })).not.toBeInTheDocument();
  });

  it("renders the ready heading", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
  });

  it("falls back to error when a usable state has no report", () => {
    renderScreen({ state: "ready", report: null });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("renders the limited-availability banner", () => {
    renderScreen({ state: "limited-availability" });
    expect(screen.getByText(copy.limitedAvailability)).toBeInTheDocument();
  });

  it("marks limited availability as a status", () => {
    renderScreen({ state: "limited-availability" });
    expect(screen.getByText(copy.limitedAvailability).closest('[role="status"]')).toBeInTheDocument();
  });

  it("renders the empty heading", () => {
    renderScreen({ state: "empty", report: null });
    expect(screen.getByRole("heading", { name: copy.emptyHeading })).toBeInTheDocument();
  });

  it("does not render fake steps in the empty state", () => {
    renderScreen({ state: "empty", report: null });
    expect(screen.queryByTestId("daily-step-list")).not.toBeInTheDocument();
  });

  it("renders the error heading", () => {
    renderScreen({ state: "error", report: null });
    expect(screen.getByRole("heading", { name: copy.errorHeading })).toBeInTheDocument();
  });

  it("marks error state as alert", () => {
    renderScreen({ state: "error", report: null });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("keeps interactive buttons outside the error alert region", () => {
    renderScreen({ state: "error", report: null, onRetryLoad: vi.fn() });
    expect(within(screen.getByRole("alert")).queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows Retry only when callback exists", () => {
    const { rerender, props } = renderScreen({ state: "error", report: null });
    expect(screen.queryByRole("button", { name: copy.retry })).not.toBeInTheDocument();
    rerender(<RoutineRecommendationsScreen {...props} onRetryLoad={vi.fn()} />);
    expect(screen.getByRole("button", { name: copy.retry })).toBeInTheDocument();
  });

  it("invokes Retry callback", () => {
    const onRetryLoad = vi.fn();
    renderScreen({ state: "error", report: null, onRetryLoad });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(onRetryLoad).toHaveBeenCalledTimes(1);
  });

  it("shows toast after Retry rejection", async () => {
    renderScreen({ state: "error", report: null, onRetryLoad: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
  });

  it("shows pending Retry feedback", () => {
    const pending = deferred();
    renderScreen({ state: "error", report: null, onRetryLoad: () => pending.promise });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(screen.getByRole("button", { name: copy.retrying })).toBeDisabled();
  });

  it("prevents duplicate Retry activation", () => {
    const pending = deferred();
    const onRetryLoad = vi.fn(() => pending.promise);
    renderScreen({ state: "error", report: null, onRetryLoad });
    const button = screen.getByRole("button", { name: copy.retry });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onRetryLoad).toHaveBeenCalledTimes(1);
  });

  it("renders trimmed profile name", () => {
    renderScreen();
    expect(screen.getByText("Amara")).toBeInTheDocument();
  });

  it("uses question mark when profile name is blank", () => {
    renderScreen({ report: reportWith({ profileName: "  " }) });
    expect(screen.getAllByText("?").length).toBeGreaterThan(0);
  });

  it("renders generated label", () => {
    renderScreen();
    expect(screen.getByText(baseReport.generatedAtLabel)).toBeInTheDocument();
  });

  it("renders save label", () => {
    renderScreen();
    expect(screen.getByText(baseReport.saveLabel)).toBeInTheDocument();
  });

  it("falls back to local save copy when save label is blank", () => {
    renderScreen({ report: reportWith({ saveLabel: " " }) });
    expect(screen.getByText(copy.savedOnDevice)).toBeInTheDocument();
  });

  it("selects Morning by default", () => {
    renderScreen();
    expect(getMorningButton()).toHaveAttribute("aria-pressed", "true");
    expect(getEveningButton()).toHaveAttribute("aria-pressed", "false");
  });

  it("can select Evening initially", () => {
    renderScreen({ initialPeriod: "evening" });
    expect(getEveningButton()).toHaveAttribute("aria-pressed", "true");
  });

  it("uses aria-pressed for period buttons", () => {
    renderScreen();
    expect(getMorningButton()).toHaveAttribute("aria-pressed");
    expect(getEveningButton()).toHaveAttribute("aria-pressed");
  });

  it("switching to Evening changes summary", () => {
    renderScreen();
    fireEvent.click(getEveningButton());
    expect(screen.getByText(baseReport.evening.summary)).toBeInTheDocument();
  });

  it("switching to Evening changes visible steps", () => {
    renderScreen();
    fireEvent.click(getEveningButton());
    expect(screen.getByText("Remove the day gently")).toBeInTheDocument();
    expect(screen.queryByText("Cleanse gently")).not.toBeInTheDocument();
  });

  it("period switch does not call host callbacks", () => {
    const onBack = vi.fn();
    const onOpenStore = vi.fn();
    renderScreen({ onBack, onOpenStore });
    fireEvent.click(getEveningButton());
    expect(onBack).not.toHaveBeenCalled();
    expect(onOpenStore).not.toHaveBeenCalled();
  });

  it("disables period switcher while operation is pending", () => {
    const pending = deferred();
    renderScreen({ onOpenStore: () => pending.promise });
    fireEvent.click(screen.getByRole("button", { name: copy.shopRoutine }));
    expect(getMorningButton()).toBeDisabled();
    expect(getEveningButton()).toBeDisabled();
  });

  it("updates selection when initialPeriod changes", () => {
    const { props, rerender } = renderScreen();
    rerender(<RoutineRecommendationsScreen {...props} initialPeriod="evening" />);
    expect(getEveningButton()).toHaveAttribute("aria-pressed", "true");
  });

  it("renders selected routine title", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: baseReport.morning.title })).toBeInTheDocument();
  });

  it("renders selected routine summary", () => {
    renderScreen();
    expect(screen.getByText(baseReport.morning.summary)).toBeInTheDocument();
  });

  it("renders host completion time only when supplied", () => {
    renderScreen();
    expect(screen.getByText("About 4 minutes")).toBeInTheDocument();
    fireEvent.click(getEveningButton());
    expect(screen.queryByText("About 4 minutes")).not.toBeInTheDocument();
  });

  it("renders step count", () => {
    renderScreen();
    expect(screen.getByText("2 steps")).toBeInTheDocument();
  });

  it("preserves daily step host order", () => {
    renderScreen();
    const list = screen.getByTestId("daily-step-list");
    const steps = within(list).getAllByTestId(/routine-step-/);
    expect(steps[0]).toHaveTextContent("Cleanse gently");
    expect(steps[1]).toHaveTextContent("Support your barrier");
  });

  it("renders empty selected-period copy", () => {
    renderScreen({ report: reportWith({ evening: { ...baseReport.evening, steps: [] } }), initialPeriod: "evening" });
    expect(screen.getByText(copy.noSteps)).toBeInTheDocument();
  });

  it("renders step category", () => {
    renderScreen();
    expect(screen.getAllByText("Cleanser").length).toBeGreaterThan(0);
  });

  it("renders step purpose", () => {
    renderScreen();
    expect(screen.getByText(baseReport.morning.steps[0].purpose)).toBeInTheDocument();
  });

  it("renders step usage", () => {
    renderScreen();
    expect(screen.getByText(baseReport.morning.steps[0].usage)).toBeInTheDocument();
  });

  it("renders frequency label", () => {
    renderScreen();
    expect(screen.getAllByText("Every morning").length).toBeGreaterThan(0);
  });

  it("renders optional caution only when supplied", () => {
    renderScreen();
    expect(screen.getByText(baseReport.morning.steps[1].caution!)).toBeInTheDocument();
    expect(screen.getByTestId("routine-step-m-cleanse")).not.toHaveTextContent("Introduce gradually if your skin is sensitive.");
  });

  it("keeps rationale collapsed by default", () => {
    renderScreen();
    const details = screen.getByText(copy.whyThisStep).closest("details");
    expect(details).not.toHaveAttribute("open");
  });

  it("expands rationale disclosure", () => {
    renderScreen();
    const summary = screen.getByText(copy.whyThisStep);
    const details = summary.closest("details")!;
    fireEvent.click(summary);
    expect(details).toHaveAttribute("open");
  });

  it("omits rationale disclosure when absent", () => {
    renderScreen({ initialPeriod: "evening" });
    expect(screen.queryByText(copy.whyThisStep)).not.toBeInTheDocument();
  });

  it("uses singular recommendation heading", () => {
    renderScreen();
    expect(screen.getByText(copy.recommendedProduct)).toBeInTheDocument();
  });

  it("uses plural recommendation heading", () => {
    renderScreen();
    expect(screen.getByText(copy.recommendedProducts)).toBeInTheDocument();
  });

  it("preserves product host order", () => {
    renderScreen();
    const list = screen.getByTestId("product-list-m-moisturise");
    expect(list.children[0]).toHaveTextContent(moisturiser.name);
    expect(list.children[1]).toHaveTextContent(unavailableProduct.name);
  });

  it("renders product brand", () => {
    renderScreen();
    expect(screen.getAllByText("DermaLens").length).toBeGreaterThan(0);
  });

  it("renders product name", () => {
    renderScreen();
    expect(screen.getByText(cleanser.name)).toBeInTheDocument();
  });

  it("renders price only when supplied", () => {
    renderScreen();
    expect(screen.getByText(cleanser.priceLabel)).toBeInTheDocument();
    expect(screen.getByText(unavailableProduct.name).closest("li")).not.toHaveTextContent("AED");
  });

  it("renders availability label for available products", () => {
    renderScreen();
    expect(screen.getAllByText(cleanser.availabilityLabel).length).toBeGreaterThan(0);
  });

  it("preserves host availability copy for unavailable products", () => {
    renderScreen();
    expect(screen.getByText(unavailableProduct.availabilityLabel)).toBeInTheDocument();
  });

  it("falls back to generic unavailable copy only when unavailable label is blank", () => {
    const blankUnavailable = { ...unavailableProduct, availabilityLabel: "   " };
    renderScreen({
      report: reportWith({
        morning: {
          ...baseReport.morning,
          steps: [
            baseReport.morning.steps[0],
            { ...baseReport.morning.steps[1], recommendedProducts: [blankUnavailable] },
          ],
        },
      }),
    });
    expect(screen.getByText(copy.productUnavailable)).toBeInTheDocument();
  });

  it("falls back to Available when an available product label is blank", () => {
    const blankAvailable = { ...cleanser, availabilityLabel: "   " };
    renderScreen({
      report: reportWith({
        morning: {
          ...baseReport.morning,
          steps: [
            { ...baseReport.morning.steps[0], recommendedProducts: [blankAvailable] },
            baseReport.morning.steps[1],
          ],
        },
      }),
    });
    expect(screen.getAllByText(copy.productAvailable).length).toBeGreaterThan(0);
  });

  it("renders description only when supplied", () => {
    renderScreen();
    expect(screen.getByText(cleanser.description)).toBeInTheDocument();
  });

  it("labels products as optional recommendations", () => {
    renderScreen();
    expect(screen.getAllByText(copy.optionalProduct).length).toBeGreaterThan(0);
  });

  it("renders empty matching-product guidance", () => {
    renderScreen({ initialPeriod: "evening" });
    expect(screen.getByText(copy.noMatchedProduct)).toBeInTheDocument();
  });

  it("renders host product image URL", () => {
    renderScreen();
    expect(screen.getByRole("img", { name: `${cleanser.brand} ${cleanser.name}` })).toHaveAttribute("src", cleanser.imageUrl);
  });

  it("uses meaningful product alt", () => {
    renderScreen();
    expect(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`)).toBeInTheDocument();
  });

  it("renders placeholder after product image failure", () => {
    renderScreen();
    fireEvent.error(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`));
    expect(screen.getByTestId(`product-image-placeholder-${cleanser.productId}`)).toHaveTextContent(copy.productImageUnavailable);
  });

  it("keeps product action after image failure", () => {
    renderScreen({ onOpenProduct: vi.fn() });
    fireEvent.error(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`));
    expect(screen.getAllByRole("button", { name: copy.viewProduct }).length).toBeGreaterThan(0);
  });

  it("resets product image error when URL changes", () => {
    const { props, rerender } = renderScreen();
    fireEvent.error(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`));
    expect(screen.getByTestId(`product-image-placeholder-${cleanser.productId}`)).toBeInTheDocument();
    const updated = { ...cleanser, imageUrl: "/products/new-cleanser.png" };
    const nextReport = reportWith({ morning: { ...baseReport.morning, steps: [{ ...baseReport.morning.steps[0], recommendedProducts: [updated] }, baseReport.morning.steps[1]] } });
    rerender(<RoutineRecommendationsScreen {...props} report={nextReport} />);
    expect(screen.getByAltText(`${cleanser.brand} ${cleanser.name}`)).toHaveAttribute("src", updated.imageUrl);
  });

  it("shows View Product only when callback exists", () => {
    const { props, rerender } = renderScreen();
    expect(screen.queryByRole("button", { name: copy.viewProduct })).not.toBeInTheDocument();
    rerender(<RoutineRecommendationsScreen {...props} onOpenProduct={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: copy.viewProduct }).length).toBeGreaterThan(0);
  });

  it("disables View Product when unavailable", () => {
    renderScreen({ onOpenProduct: vi.fn() });
    const card = screen.getByText(unavailableProduct.name).closest("li")!;
    expect(within(card).getByRole("button", { name: copy.viewProduct })).toBeDisabled();
    expect(card).toHaveTextContent(unavailableProduct.availabilityLabel);
  });

  it("invokes View Product with product ID", () => {
    const onOpenProduct = vi.fn();
    renderScreen({ onOpenProduct });
    fireEvent.click(screen.getAllByRole("button", { name: copy.viewProduct })[0]);
    expect(onOpenProduct).toHaveBeenCalledWith(cleanser.productId);
  });

  it("shows product pending label only on selected product", () => {
    const pending = deferred();
    renderScreen({ onOpenProduct: () => pending.promise });
    fireEvent.click(screen.getAllByRole("button", { name: copy.viewProduct })[0]);
    expect(screen.getByRole("button", { name: copy.openingProduct })).toBeInTheDocument();
    expect(screen.getAllByRole("button").filter((button) => button.textContent === copy.openingProduct)).toHaveLength(1);
  });

  it("scopes reused product pending feedback to the exact activated step card", () => {
    const pending = deferred();
    const reusedProduct = { ...cleanser, productId: "shared-product" };
    const reusedReport = reportWith({
      morning: {
        ...baseReport.morning,
        steps: [
          { ...baseReport.morning.steps[0], recommendedProducts: [reusedProduct] },
          { ...baseReport.morning.steps[1], recommendedProducts: [reusedProduct] },
        ],
      },
    });

    renderScreen({ report: reusedReport, onOpenProduct: () => pending.promise });

    const firstStep = screen.getByTestId("routine-step-m-cleanse");
    const secondStep = screen.getByTestId("routine-step-m-moisturise");

    fireEvent.click(within(firstStep).getByRole("button", { name: copy.viewProduct }));

    expect(within(firstStep).getByRole("button", { name: copy.openingProduct })).toBeInTheDocument();
    expect(within(secondStep).getByRole("button", { name: copy.viewProduct })).toBeInTheDocument();
    expect(within(secondStep).queryByRole("button", { name: copy.openingProduct })).not.toBeInTheDocument();
  });

  it("shows toast after product rejection", async () => {
    renderScreen({ onOpenProduct: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getAllByRole("button", { name: copy.viewProduct })[0]);
    expect(await screen.findByText(copy.productError)).toBeInTheDocument();
  });

  it("prevents duplicate product activation", () => {
    const pending = deferred();
    const onOpenProduct = vi.fn(() => pending.promise);
    renderScreen({ onOpenProduct });
    const button = screen.getAllByRole("button", { name: copy.viewProduct })[0];
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onOpenProduct).toHaveBeenCalledTimes(1);
  });

  it("shows alternatives only when callback exists", () => {
    const { props, rerender } = renderScreen();
    expect(screen.queryByRole("button", { name: copy.alternatives })).not.toBeInTheDocument();
    rerender(<RoutineRecommendationsScreen {...props} onOpenAlternatives={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: copy.alternatives }).length).toBeGreaterThan(0);
  });

  it("invokes alternatives with step ID", () => {
    const onOpenAlternatives = vi.fn();
    renderScreen({ onOpenAlternatives });
    fireEvent.click(screen.getAllByRole("button", { name: copy.alternatives })[0]);
    expect(onOpenAlternatives).toHaveBeenCalledWith("m-cleanse");
  });

  it("shows alternatives pending label only on selected step", () => {
    const pending = deferred();
    renderScreen({ onOpenAlternatives: () => pending.promise });
    fireEvent.click(screen.getAllByRole("button", { name: copy.alternatives })[0]);
    expect(screen.getByRole("button", { name: copy.openingAlternatives })).toBeInTheDocument();
    expect(screen.getAllByRole("button").filter((button) => button.textContent === copy.openingAlternatives)).toHaveLength(1);
  });

  it("shows toast after alternatives rejection", async () => {
    renderScreen({ onOpenAlternatives: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getAllByRole("button", { name: copy.alternatives })[0]);
    expect(await screen.findByText(copy.alternativesError)).toBeInTheDocument();
  });

  it("prevents duplicate alternatives activation", () => {
    const pending = deferred();
    const onOpenAlternatives = vi.fn(() => pending.promise);
    renderScreen({ onOpenAlternatives });
    const button = screen.getAllByRole("button", { name: copy.alternatives })[0];
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onOpenAlternatives).toHaveBeenCalledTimes(1);
  });

  it("renders weekly guidance only when supplied", () => {
    const { props, rerender } = renderScreen();
    expect(screen.getByRole("heading", { name: copy.weeklyHeading })).toBeInTheDocument();
    rerender(<RoutineRecommendationsScreen {...props} report={reportWith({ weeklyGuidance: [] })} />);
    expect(screen.queryByRole("heading", { name: copy.weeklyHeading })).not.toBeInTheDocument();
  });

  it("preserves weekly guidance order", () => {
    renderScreen();
    const list = screen.getByTestId("weekly-guidance-list");
    expect(list.children[0]).toHaveTextContent("Gentle exfoliation");
    expect(list.children[1]).toHaveTextContent("Barrier reset evening");
  });

  it("renders weekly frequency", () => {
    renderScreen();
    expect(screen.getByText("Once weekly")).toBeInTheDocument();
  });

  it("renders weekly caution", () => {
    renderScreen();
    expect(screen.getByText("Skip this step if irritation appears.")).toBeInTheDocument();
  });

  it("renders safety heading", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: copy.safetyHeading })).toBeInTheDocument();
  });

  it("renders patch-test copy", () => {
    renderScreen();
    expect(screen.getByText(copy.safetyPatchTest)).toBeInTheDocument();
  });

  it("renders escalation copy", () => {
    renderScreen();
    expect(screen.getByText(copy.safetyEscalation)).toBeInTheDocument();
  });

  it("renders optional-store note", () => {
    renderScreen();
    expect(screen.getByText(copy.storeNote)).toBeInTheDocument();
  });

  it("invokes Shop Routine callback", () => {
    const onOpenStore = vi.fn();
    renderScreen({ onOpenStore });
    fireEvent.click(screen.getByRole("button", { name: copy.shopRoutine }));
    expect(onOpenStore).toHaveBeenCalledTimes(1);
  });

  it("shows toast after Store rejection", async () => {
    renderScreen({ onOpenStore: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.shopRoutine }));
    expect(await screen.findByText(copy.storeError)).toBeInTheDocument();
  });


  it("positions ready-state Store rejection toast above the sticky footer", async () => {
    renderScreen({ onOpenStore: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.shopRoutine }));
    expect(await screen.findByText(copy.storeError)).toBeInTheDocument();
    expect(screen.getByTestId("toast-region")).toHaveClass(
      "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_144px)]",
    );
  });

  it("positions ready-state Product rejection toast above the sticky footer", async () => {
    renderScreen({ onOpenProduct: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getAllByRole("button", { name: copy.viewProduct })[0]);
    expect(await screen.findByText(copy.productError)).toBeInTheDocument();
    expect(screen.getByTestId("toast-region")).toHaveClass(
      "bottom-[calc(max(24px,env(safe-area-inset-bottom))_+_144px)]",
    );
  });

  it("does not block store for offline state alone", () => {
    renderScreen({ isOffline: true, canOpenStore: true });
    expect(screen.getByRole("button", { name: copy.shopRoutine })).toBeEnabled();
  });

  it("shows reconnect label for offline blocked store", () => {
    renderScreen({ isOffline: true, canOpenStore: false });
    expect(screen.getByRole("button", { name: copy.reconnectToShop })).toBeDisabled();
  });

  it("shows unavailable label for online blocked store", () => {
    renderScreen({ isOffline: false, canOpenStore: false });
    expect(screen.getByRole("button", { name: copy.storeUnavailable })).toBeDisabled();
  });

  it("invokes Back to Report callback", () => {
    const onBack = vi.fn();
    renderScreen({ onBack });
    fireEvent.click(screen.getByRole("button", { name: copy.backToReport }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows toast after Back rejection", async () => {
    renderScreen({ onBack: () => Promise.reject(new Error("no")) });
    fireEvent.click(screen.getByRole("button", { name: copy.backToReport }));
    expect(await screen.findByText(copy.backError)).toBeInTheDocument();
  });


  it("positions error-state Retry rejection toast at the normal bottom safe area", async () => {
    renderScreen({
      state: "error",
      report: null,
      onRetryLoad: () => Promise.reject(new Error("no")),
    });
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(await screen.findByText(copy.retryError)).toBeInTheDocument();
    expect(screen.getByTestId("toast-region")).toHaveClass(
      "bottom-[max(24px,env(safe-area-inset-bottom))]",
    );
  });

  it("positions empty-state Back rejection toast at the normal bottom safe area", async () => {
    renderScreen({
      state: "empty",
      report: null,
      onBack: () => Promise.reject(new Error("no")),
    });
    fireEvent.click(screen.getByRole("button", { name: copy.backToReport }));
    expect(await screen.findByText(copy.backError)).toBeInTheDocument();
    expect(screen.getByTestId("toast-region")).toHaveClass(
      "bottom-[max(24px,env(safe-area-inset-bottom))]",
    );
  });

  it("disables conflicting actions while Store is pending", () => {
    const pending = deferred();
    renderScreen({ onOpenStore: () => pending.promise, onOpenProduct: vi.fn(), onOpenAlternatives: vi.fn() });
    fireEvent.click(screen.getByRole("button", { name: copy.shopRoutine }));
    expect(screen.getByRole("button", { name: copy.backToReport })).toBeDisabled();
    expect(getMorningButton()).toBeDisabled();
    expect(screen.getAllByRole("button", { name: copy.viewProduct })[0]).toBeDisabled();
    expect(screen.getAllByRole("button", { name: copy.alternatives })[0]).toBeDisabled();
  });

  it("prevents duplicate Store activation", () => {
    const pending = deferred();
    const onOpenStore = vi.fn(() => pending.promise);
    renderScreen({ onOpenStore });
    const button = screen.getByRole("button", { name: copy.shopRoutine });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onOpenStore).toHaveBeenCalledTimes(1);
  });

  it("renders no external anchor", () => {
    const { container } = renderScreen({ onOpenProduct: vi.fn() });
    expect(container.querySelector("a")).toBeNull();
  });

  it("does not include prohibited commerce wording", () => {
    const allCopy = Object.values(copy).join(" ").toLowerCase();
    expect(allCopy).not.toContain("affiliate");
    expect(allCopy).not.toContain("external seller");
    expect(allCopy).not.toContain("marketplace");
  });

  it("renders no file input", () => {
    const { container } = renderScreen();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  it("renders no live video", () => {
    const { container } = renderScreen();
    expect(container.querySelector("video")).toBeNull();
  });

  it("does not call camera API", () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    renderScreen();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("does not request geolocation", () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
    renderScreen();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("does not call ecommerce APIs or fetch", () => {
    const fetchMock = vi.fn();
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock });
    renderScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not mutate a cart", () => {
    const { container } = renderScreen();
    expect(container.textContent?.toLowerCase()).not.toContain("add to cart");
  });

  it("does not provide prescription guidance", () => {
    expect(Object.values(copy).join(" ").toLowerCase()).not.toContain("prescription");
  });

  it("renders no bottom navigation", () => {
    const { container } = renderScreen();
    expect(container.querySelector("nav")).toBeNull();
  });

  it("restores mocked browser descriptors after relevant tests", () => {
    expect(Object.getOwnPropertyDescriptor(navigator, "mediaDevices")).toEqual(originalMediaDevicesDescriptor);
    expect(Object.getOwnPropertyDescriptor(navigator, "geolocation")).toEqual(originalGeolocationDescriptor);
    expect(Object.getOwnPropertyDescriptor(globalThis, "fetch")).toEqual(originalFetchDescriptor);
  });
});
