import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

const mockData = vi.hoisted(() => ({
  checkoutDraft: {
    fullName: "Route Test Customer",
    email: "route-test@example.com",
    phone: "+971 50 555 0101",
    addressLine1: "42 Test Street",
    addressLine2: "Unit 7",
    city: "Dubai",
    region: "Dubai",
    postalCode: "00000",
    countryCode: "US",
    saveOnDevice: true,
  },
}))

type MockProps = Record<string, any>
type User = ReturnType<typeof userEvent.setup>

vi.mock("@/components/welcome-screen", () => ({
  default: ({ onStartAnalysis }: MockProps) => (
    <section data-testid="welcome-screen">
      <button onClick={onStartAnalysis} type="button">
        Start analysis
      </button>
    </section>
  ),
}))

vi.mock("@/components/privacy-consent-screen", () => ({
  default: ({ onAcceptConsent }: MockProps) => (
    <section data-testid="privacy-screen">
      <button onClick={() => onAcceptConsent({ consentVersion: "test" })} type="button">
        Accept consent
      </button>
    </section>
  ),
}))

vi.mock("@/components/profile-setup-screen", () => ({
  default: ({ onSaveProfile }: MockProps) => (
    <section data-testid="profile-screen">
      <button onClick={() => onSaveProfile({ profileName: "Route Tester" })} type="button">
        Save profile
      </button>
    </section>
  ),
}))

vi.mock("@/components/image-source-selection-screen", () => ({
  default: ({ onChooseUpload }: MockProps) => (
    <section data-testid="image-source-screen">
      <button onClick={onChooseUpload} type="button">
        Choose upload
      </button>
    </section>
  ),
}))

vi.mock("@/components/camera-capture-screen", () => ({
  default: ({ onCapturePhoto }: MockProps) => (
    <section data-testid="camera-screen">
      <button onClick={onCapturePhoto} type="button">
        Capture photo
      </button>
    </section>
  ),
}))

vi.mock("@/components/selected-image-review-screen", () => ({
  default: ({ onUsePhoto }: MockProps) => (
    <section data-testid="image-review-screen">
      <button onClick={onUsePhoto} type="button">
        Use photo
      </button>
    </section>
  ),
}))

vi.mock("@/components/analysis-processing-screen", () => ({
  analysisStageOrder: [
    "preparing-photo",
    "reading-features",
    "mapping-concerns",
    "building-guidance",
    "finalising-report",
  ],
  default: ({ onViewResults }: MockProps) => (
    <section data-testid="analysis-screen">
      <button onClick={onViewResults} type="button">
        View results
      </button>
    </section>
  ),
}))

vi.mock("@/components/results-summary-screen", () => ({
  default: ({ onOpenDetailedReport, onOpenRoutine }: MockProps) => (
    <section data-testid="results-screen">
      <button onClick={onOpenDetailedReport} type="button">
        Open detailed report
      </button>
      <button onClick={onOpenRoutine} type="button">
        Open routine from results
      </button>
    </section>
  ),
}))

vi.mock("@/components/full-report-detail-screen", () => ({
  default: ({ onOpenRoutine }: MockProps) => (
    <section data-testid="full-report-screen">
      <button onClick={onOpenRoutine} type="button">
        Build routine
      </button>
    </section>
  ),
}))

vi.mock("@/components/routine-recommendations-screen", () => ({
  default: ({ onOpenProduct, onOpenStore }: MockProps) => (
    <section data-testid="routine-screen">
      <button onClick={onOpenStore} type="button">
        Open store
      </button>
      <button onClick={() => onOpenProduct("prod-001")} type="button">
        Open routine product
      </button>
      <button onClick={() => onOpenProduct("prod-unknown")} type="button">
        Open unknown routine product
      </button>
    </section>
  ),
}))

vi.mock("@/components/dermalens-store-routine-collection-screen", () => ({
  default: ({ onOpenCart, onOpenProduct }: MockProps) => (
    <section data-testid="store-screen">
      <button onClick={onOpenCart} type="button">
        Open cart
      </button>
      <button onClick={() => onOpenProduct("prod-004")} type="button">
        Open store product
      </button>
      <button onClick={() => onOpenProduct("prod-unknown")} type="button">
        Open unknown store product
      </button>
    </section>
  ),
}))

vi.mock("@/components/cart-screen", () => ({
  default: ({ onOpenProduct, onProceedToCheckout }: MockProps) => (
    <section data-testid="cart-screen">
      <button onClick={onProceedToCheckout} type="button">
        Proceed to checkout
      </button>
      <button onClick={() => onOpenProduct("prod-006")} type="button">
        Open cart product
      </button>
    </section>
  ),
}))

vi.mock("@/components/checkout-contact-and-shipping-screen", () => ({
  default: ({ onContinue, report }: MockProps) => (
    <section data-testid="checkout-details-screen">
      <div data-testid="checkout-default-draft">{JSON.stringify(report.defaultDraft)}</div>
      <button
        onClick={() =>
          onContinue({
            checkoutSessionId: report.checkoutSessionId,
            draft: mockData.checkoutDraft,
          })
        }
        type="button"
      >
        Continue checkout details
      </button>
    </section>
  ),
}))

vi.mock("@/components/checkout-review-screen", () => ({
  default: ({
    onBack,
    onContinueToSecurePayment,
    onEditCart,
    onEditDetails,
    onSelectShippingOption,
    report,
  }: MockProps) => (
    <section data-testid="checkout-review-screen">
      <div data-testid="checkout-review-report">{JSON.stringify(report)}</div>
      <button onClick={onBack} type="button">
        Review back
      </button>
      <button onClick={onEditDetails} type="button">
        Edit details
      </button>
      <button onClick={onEditCart} type="button">
        Edit cart
      </button>
      <button onClick={() => onSelectShippingOption("shipopt-002")} type="button">
        Select express shipping
      </button>
      <button
        onClick={() =>
          onContinueToSecurePayment({
            checkoutSessionId: report.checkoutSessionId,
            reviewId: report.reviewId,
            selectedShippingOptionId: report.selectedShippingOptionId,
            acknowledgementAccepted: false,
          })
        }
        type="button"
      >
        Continue to secure payment
      </button>
    </section>
  ),
}))

vi.mock("@/components/secure-payment-gateway-handoff-screen", () => ({
  default: ({ onBack, onOpenPaymentGateway, report }: MockProps) => (
    <section data-testid="payment-gateway-screen">
      <div data-testid="payment-gateway-report">{JSON.stringify(report)}</div>
      <button onClick={onBack} type="button">
        Payment back
      </button>
      <button
        onClick={() =>
          onOpenPaymentGateway({
            checkoutSessionId: report.checkoutSessionId,
            reviewId: report.reviewId,
            paymentSessionId: report.paymentSessionId,
          })
        }
        type="button"
      >
        Open payment gateway
      </button>
    </section>
  ),
}))

vi.mock("@/components/order-confirmation-and-payment-result-screen", () => ({
  default: () => <section data-testid="order-result-screen">Order result</section>,
}))

vi.mock("@/components/product-detail-screen", () => ({
  default: ({ onBack, onOpenCart, report, state }: MockProps) => (
    <section data-testid="product-detail-screen">
      <div data-testid="product-detail-state">{state}</div>
      <div data-testid="product-detail-report">{JSON.stringify(report)}</div>
      <button onClick={onBack} type="button">
        Product back
      </button>
      <button onClick={onOpenCart} type="button">
        Product view cart
      </button>
    </section>
  ),
}))

import Page from "./page"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderPage() {
  const user = userEvent.setup()
  render(<Page />)
  return user
}

async function goToRoutine(user: User) {
  await user.click(screen.getByRole("button", { name: "Start analysis" }))
  await user.click(screen.getByRole("button", { name: "Accept consent" }))
  await user.click(screen.getByRole("button", { name: "Save profile" }))
  await user.click(screen.getByRole("button", { name: "Choose upload" }))
  await user.click(screen.getByRole("button", { name: "Use photo" }))
  await user.click(screen.getByRole("button", { name: "View results" }))
  await user.click(screen.getByRole("button", { name: "Open detailed report" }))
  await user.click(screen.getByRole("button", { name: "Build routine" }))
  expect(screen.getByTestId("routine-screen")).toBeInTheDocument()
}

async function goToStore(user: User) {
  await goToRoutine(user)
  await user.click(screen.getByRole("button", { name: "Open store" }))
  expect(screen.getByTestId("store-screen")).toBeInTheDocument()
}

async function goToCart(user: User) {
  await goToStore(user)
  await user.click(screen.getByRole("button", { name: "Open cart" }))
  expect(screen.getByTestId("cart-screen")).toBeInTheDocument()
}

async function goToCheckoutReview(user: User) {
  await goToCart(user)
  await user.click(screen.getByRole("button", { name: "Proceed to checkout" }))
  expect(screen.getByTestId("checkout-details-screen")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Continue checkout details" }))
  expect(screen.getByTestId("checkout-review-screen")).toBeInTheDocument()
}

function getJson(testId: string) {
  return JSON.parse(screen.getByTestId(testId).textContent ?? "null")
}

describe("Page route controller", () => {
  it("routes through checkout review and payment back paths", async () => {
    const user = renderPage()

    await goToCart(user)
    await user.click(screen.getByRole("button", { name: "Proceed to checkout" }))
    expect(screen.getByTestId("checkout-details-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Continue checkout details" }))
    expect(screen.getByTestId("checkout-review-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Review back" }))
    expect(screen.getByTestId("checkout-details-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Continue checkout details" }))
    await user.click(screen.getByRole("button", { name: "Edit details" }))
    expect(screen.getByTestId("checkout-details-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Continue checkout details" }))
    await user.click(screen.getByRole("button", { name: "Edit cart" }))
    expect(screen.getByTestId("cart-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Proceed to checkout" }))
    await user.click(screen.getByRole("button", { name: "Continue checkout details" }))
    await user.click(screen.getByRole("button", { name: "Continue to secure payment" }))
    expect(screen.getByTestId("payment-gateway-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Payment back" }))
    expect(screen.getByTestId("checkout-review-screen")).toBeInTheDocument()
  })

  it("preserves submitted checkout details in review and when editing details", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem")
    const indexedDbOpen = vi.fn()
    const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB")
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: indexedDbOpen },
    })

    try {
      const user = renderPage()
      await goToCheckoutReview(user)

      const report = getJson("checkout-review-report")
      expect(report.contact).toMatchObject({
        fullName: mockData.checkoutDraft.fullName,
        email: mockData.checkoutDraft.email,
        phone: mockData.checkoutDraft.phone,
      })
      expect(report.address.displayLines).toEqual([
        "42 Test Street",
        "Unit 7",
        "Dubai, Dubai 00000",
      ])
      expect(report.address.countryLabel).toBe("United States")

      await user.click(screen.getByRole("button", { name: "Review back" }))
      expect(getJson("checkout-default-draft")).toMatchObject(mockData.checkoutDraft)

      await user.click(screen.getByRole("button", { name: "Continue checkout details" }))
      await user.click(screen.getByRole("button", { name: "Edit details" }))
      expect(getJson("checkout-default-draft")).toMatchObject(mockData.checkoutDraft)

      expect(localStorageSpy).not.toHaveBeenCalled()
      expect(indexedDbOpen).not.toHaveBeenCalled()
    } finally {
      if (originalIndexedDb) {
        Object.defineProperty(window, "indexedDB", originalIndexedDb)
      } else {
        delete (window as unknown as { indexedDB?: unknown }).indexedDB
      }
    }
  })

  it("keeps shipping selection and totals controller-owned across review and payment", async () => {
    const user = renderPage()
    await goToCheckoutReview(user)

    await user.click(screen.getByRole("button", { name: "Select express shipping" }))
    const reviewReport = getJson("checkout-review-report")
    expect(reviewReport.selectedShippingOptionId).toBe("shipopt-002")
    expect(reviewReport.pricing.shippingLabel).toBe("$9.00")
    expect(reviewReport.pricing.totalLabel).toBe("$102.50")

    await user.click(screen.getByRole("button", { name: "Continue to secure payment" }))
    const paymentReport = getJson("payment-gateway-report")
    expect(paymentReport.totalLabel).toBe("$102.50")
  })

  it("does not infer payment success when opening the payment gateway", async () => {
    const user = renderPage()
    await goToCheckoutReview(user)

    await user.click(screen.getByRole("button", { name: "Continue to secure payment" }))
    expect(screen.getByTestId("payment-gateway-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Open payment gateway" }))
    expect(screen.getByTestId("payment-gateway-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("order-result-screen")).not.toBeInTheDocument()
  })

  it("opens product detail from routine and returns back to routine", async () => {
    const user = renderPage()
    await goToRoutine(user)

    await user.click(screen.getByRole("button", { name: "Open routine product" }))
    expect(screen.getByTestId("product-detail-screen")).toBeInTheDocument()
    expect(getJson("product-detail-report").productId).toBe("prod-001")

    await user.click(screen.getByRole("button", { name: "Product back" }))
    expect(screen.getByTestId("routine-screen")).toBeInTheDocument()
  })

  it("opens product detail from store and returns back to store", async () => {
    const user = renderPage()
    await goToStore(user)

    await user.click(screen.getByRole("button", { name: "Open store product" }))
    expect(screen.getByTestId("product-detail-screen")).toBeInTheDocument()
    expect(getJson("product-detail-report").productId).toBe("prod-004")

    await user.click(screen.getByRole("button", { name: "Product back" }))
    expect(screen.getByTestId("store-screen")).toBeInTheDocument()
  })

  it("opens product detail from cart and returns back to cart", async () => {
    const user = renderPage()
    await goToCart(user)

    await user.click(screen.getByRole("button", { name: "Open cart product" }))
    expect(screen.getByTestId("product-detail-screen")).toBeInTheDocument()
    expect(getJson("product-detail-report").productId).toBe("prod-006")

    await user.click(screen.getByRole("button", { name: "Product back" }))
    expect(screen.getByTestId("cart-screen")).toBeInTheDocument()
  })

  it("routes product detail View cart to cart", async () => {
    const user = renderPage()
    await goToRoutine(user)

    await user.click(screen.getByRole("button", { name: "Open routine product" }))
    await user.click(screen.getByRole("button", { name: "Product view cart" }))
    expect(screen.getByTestId("cart-screen")).toBeInTheDocument()
  })

  it("fails closed for unknown product IDs", async () => {
    const user = renderPage()
    await goToRoutine(user)

    await user.click(screen.getByRole("button", { name: "Open unknown routine product" }))
    expect(screen.getByTestId("product-detail-state")).toHaveTextContent("error")
    expect(screen.getByTestId("product-detail-report")).toHaveTextContent("null")
  })
})
