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
  initialScreenOverride: null as string | null,
  selectedShippingOptionOverride: null as string | null,
  useStateCall: 0,
}))

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>()

  return {
    ...actual,
    useState: ((initial: unknown) => {
      mockData.useStateCall += 1

      if (
        mockData.useStateCall === 1 &&
        mockData.initialScreenOverride !== null
      ) {
        return actual.useState(
          mockData.initialScreenOverride,
        )
      }

      if (
        initial === "shipopt-001" &&
        mockData.selectedShippingOptionOverride !== null
      ) {
        return actual.useState(
          mockData.selectedShippingOptionOverride,
        )
      }

      return actual.useState(initial)
    }) as typeof actual.useState,
  }
})

type MockProps = Record<string, any>
type User = ReturnType<typeof userEvent.setup>

vi.mock("@/components/welcome-screen", () => ({
  default: ({ onOpenGuestScanner, onStartAnalysis }: MockProps) => (
    <section data-testid="welcome-screen">
      <button onClick={onStartAnalysis} type="button">
        Start analysis
      </button>
      <button onClick={onOpenGuestScanner} type="button">
        Open guest ingredient scanner
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
  default: ({ onBack, onSaveProfile }: MockProps) => (
    <section data-testid="profile-screen">
      <button onClick={onBack} type="button">
        Profile back
      </button>
      <button onClick={() => onSaveProfile({ profileName: "Route Tester" })} type="button">
        Save profile
      </button>
    </section>
  ),
}))

vi.mock("@/components/image-source-selection-screen", () => ({
  default: ({ onBack, onChangeProfile, onChooseUpload, profileName }: MockProps) => (
    <section data-testid="image-source-screen">
      <div data-testid="image-source-profile-name">{profileName}</div>
      <button onClick={onBack} type="button">
        Image source back
      </button>
      <button onClick={onChooseUpload} type="button">
        Choose upload
      </button>
      <button onClick={onChangeProfile} type="button">
        Change profile from image source
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
  default: ({ imageUrl, onChangeProfile, onUsePhoto, profileName }: MockProps) => (
    <section data-testid="image-review-screen">
      <div data-testid="image-review-profile-name">{profileName}</div>
      <div data-testid="image-review-image-url">{imageUrl}</div>
      <button onClick={onUsePhoto} type="button">
        Use photo
      </button>
      <button onClick={onChangeProfile} type="button">
        Change profile from image review
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
  default: ({ onClose, onOpenDetailedReport, onOpenRoutine }: MockProps) => (
    <section data-testid="results-screen">
      <button onClick={onClose} type="button">
        Close results
      </button>
      <button onClick={onOpenDetailedReport} type="button">
        Open detailed report
      </button>
      <button onClick={onOpenRoutine} type="button">
        Open routine from results
      </button>
    </section>
  ),
}))

vi.mock("@/components/home-dashboard-screen", () => ({
  default: ({
    canOpenGuestScanner,
    canOpenOrders,
    canOpenProgress,
    canOpenRecentOrder,
    isGuestScannerAvailableOffline,
    onChangeProfile,
    onOpenGuestScanner,
    onOpenLatestReport,
    onOpenOrders,
    onOpenProgress,
    onOpenRecentOrder,
    onOpenRoutine,
    onOpenStore,
    onStartAnalysis,
    report,
    showEnvironmentalModule,
  }: MockProps) => (
    <section data-testid="dashboard-screen">
      <div data-testid="dashboard-report">{JSON.stringify(report)}</div>
      <div data-testid="dashboard-props">
        {JSON.stringify({
          canOpenGuestScanner,
          canOpenOrders,
          canOpenProgress,
          canOpenRecentOrder,
          isGuestScannerAvailableOffline,
          showEnvironmentalModule,
        })}
      </div>
      <button
        onClick={() => onStartAnalysis(report.profile.profileId)}
        type="button"
      >
        Dashboard start new scan
      </button>
      <button onClick={onChangeProfile} type="button">
        Dashboard change profile
      </button>
      <button
        onClick={() => onOpenLatestReport(report.latestSnapshot.reportId)}
        type="button"
      >
        Dashboard open latest report
      </button>
      <button
        onClick={() => onOpenRoutine(report.routine.routineId)}
        type="button"
      >
        Dashboard open routine
      </button>
      <button
        disabled={!canOpenGuestScanner}
        onClick={onOpenGuestScanner}
        type="button"
      >
        Open dashboard ingredient scanner
      </button>
      <button
        disabled={!canOpenProgress}
        onClick={onOpenProgress}
        type="button"
      >
        Dashboard open progress
      </button>
      <button
        disabled={!canOpenOrders}
        onClick={onOpenOrders}
        type="button"
      >
        Dashboard open orders
      </button>
      <button onClick={onOpenStore} type="button">
        Dashboard open store
      </button>
      <button
        disabled={!canOpenRecentOrder}
        onClick={() => onOpenRecentOrder(report.recentOrder.orderId)}
        type="button"
      >
        Dashboard open recent order
      </button>
      <button
        disabled={!canOpenRecentOrder}
        onClick={() => onOpenRecentOrder("unknown-order-id")}
        type="button"
      >
        Dashboard open unknown recent order
      </button>
    </section>
  ),
}))

vi.mock("@/components/progress-tracking-screen", () => ({
  default: ({
    onBack,
    onOpenReport,
    onOpenRoutine,
    onRetryLoad,
    onSelectBaseline,
    onSelectComparison,
    onStartNewScan,
    report,
  }: MockProps) => {
    const scans = report?.scans ?? []
    const selectedBaseline = scans.find(
      (scan: MockProps) => scan.isBaselineSelected,
    )
    const selectedComparison = scans.find(
      (scan: MockProps) => scan.isComparisonSelected,
    )

    return (
      <section data-testid="progress-tracking-screen">
        <div data-testid="progress-profile-id">
          {report?.profile?.profileId ?? ""}
        </div>
        <div data-testid="progress-display-name">
          {report?.profile?.displayName ?? ""}
        </div>
        <div data-testid="progress-scan-ids">
          {JSON.stringify(scans.map((scan: MockProps) => scan.scanId))}
        </div>
        <div data-testid="progress-selected-baseline-id">
          {selectedBaseline?.scanId ?? ""}
        </div>
        <div data-testid="progress-selected-comparison-id">
          {selectedComparison?.scanId ?? ""}
        </div>
        <div data-testid="progress-comparison-baseline-id">
          {report?.comparison?.baselineScanId ?? ""}
        </div>
        <div data-testid="progress-comparison-comparison-id">
          {report?.comparison?.comparisonScanId ?? ""}
        </div>
        <div data-testid="progress-comparison-heading">
          {report?.comparison?.headingLabel ?? ""}
        </div>
        <div data-testid="progress-metric-labels">
          {JSON.stringify(
            report?.comparison?.metrics?.map(
              (metric: MockProps) => metric.label,
            ) ?? [],
          )}
        </div>
        <div data-testid="progress-routine-id">
          {report?.routinePrompt?.routineId ?? ""}
        </div>
        <button onClick={onBack} type="button">
          Progress back
        </button>
        <button
          onClick={() => onStartNewScan(report?.profile?.profileId ?? "")}
          type="button"
        >
          Progress start new scan
        </button>
        <button
          onClick={() => onStartNewScan("stale-profile-id")}
          type="button"
        >
          Progress start new scan with stale profile
        </button>
        <button
          onClick={() => onSelectBaseline?.("progress-scan-001")}
          type="button"
        >
          Progress select June baseline
        </button>
        <button
          onClick={() => onSelectBaseline?.("progress-scan-003")}
          type="button"
        >
          Progress select August baseline
        </button>
        <button
          onClick={() => onSelectComparison?.("progress-scan-002")}
          type="button"
        >
          Progress select July comparison
        </button>
        <button
          onClick={() => onSelectComparison?.("progress-scan-003")}
          type="button"
        >
          Progress select August comparison
        </button>
        <button
          onClick={() => onOpenReport?.("progress-scan-003")}
          type="button"
        >
          Progress open August report
        </button>
        <button
          onClick={() => onOpenReport?.("progress-scan-unknown")}
          type="button"
        >
          Progress open unknown report
        </button>
        <button
          onClick={() => onOpenRoutine?.(report?.routinePrompt?.routineId ?? "")}
          type="button"
        >
          Progress open routine
        </button>
        <button
          onClick={() => onOpenRoutine?.("routine-unknown")}
          type="button"
        >
          Progress open unknown routine
        </button>
        <button onClick={onRetryLoad} type="button">
          Progress retry
        </button>
      </section>
    )
  },
}))

vi.mock("@/components/profile-switcher-and-management-screen", () => ({
  default: ({
    canAddProfile,
    canDeleteProfiles,
    canEditProfiles,
    canGoBack,
    canOpenSyncSettings,
    canSelectProfiles,
    isOffline,
    onAddProfile,
    onBack,
    onDeleteProfile,
    onEditProfile,
    onOpenSyncSettings,
    onRetryLoad,
    onSelectProfile,
    report,
    state,
  }: MockProps) => {
    const profiles = report?.profiles ?? []
    const activeProfile = profiles.find((profile: MockProps) => profile.isActive)
    const summary = {
      state,
      isOffline,
      canGoBack,
      canAddProfile,
      canOpenSyncSettings,
      canSelectProfiles,
      canEditProfiles,
      canDeleteProfiles,
      profileIds: profiles.map((profile: MockProps) => profile.profileId),
      activeProfileId: activeProfile?.profileId ?? null,
      activeDisplayName: activeProfile?.displayName ?? null,
      displayNames: profiles.map((profile: MockProps) => profile.displayName),
    }

    return (
      <section data-testid="profile-management-screen">
        <div data-testid="profile-management-report-summary">
          {JSON.stringify(summary)}
        </div>
        <button onClick={onBack} type="button">
          Profile management back
        </button>
        <button onClick={() => onSelectProfile("profile-002")} type="button">
          Profile management select Maya
        </button>
        <button onClick={() => onSelectProfile("profile-001")} type="button">
          Profile management select primary
        </button>
        <button onClick={onAddProfile} type="button">
          Profile management add profile
        </button>
        <button onClick={() => onEditProfile("profile-002")} type="button">
          Profile management edit Maya
        </button>
        <button onClick={onOpenSyncSettings} type="button">
          Profile management open sync
        </button>
        <button onClick={() => onDeleteProfile("profile-002")} type="button">
          Profile management delete Maya
        </button>
        <button onClick={onRetryLoad} type="button">
          Profile management retry
        </button>
      </section>
    )
  },
}))

vi.mock("@/components/guest-ingredient-scanner-entry-screen", () => ({
  default: ({
    onBack,
    onChangeProfile,
    onChoosePhoto,
    onContinueWithoutProfile,
    onEnterIngredientsManually,
    onRetryLoad,
    onTakePhoto,
    report,
  }: MockProps) => {
    const selectedProfile = report?.selectedProfile ?? null

    return (
      <section data-testid="scanner-entry-screen">
        <div data-testid="scanner-entry-report">
          {JSON.stringify({
            displayName: selectedProfile?.displayName ?? null,
            mode: selectedProfile ? "profiled" : "guest",
            profileId: selectedProfile?.profileId ?? null,
          })}
        </div>
        <button onClick={onBack} type="button">
          Scanner entry back
        </button>
        <button onClick={() => onTakePhoto(selectedProfile ? { profileId: selectedProfile.profileId } : {})} type="button">
          Scanner entry take photo
        </button>
        <button onClick={() => onChoosePhoto(selectedProfile ? { profileId: selectedProfile.profileId } : {})} type="button">
          Scanner entry choose photo
        </button>
        <button onClick={() => onEnterIngredientsManually(selectedProfile ? { profileId: selectedProfile.profileId } : {})} type="button">
          Scanner entry manual entry
        </button>
        <button onClick={onChangeProfile} type="button">
          Scanner entry change profile
        </button>
        <button onClick={onContinueWithoutProfile} type="button">
          Scanner entry continue as guest
        </button>
        <button onClick={onRetryLoad} type="button">
          Scanner entry retry
        </button>
      </section>
    )
  },
}))

vi.mock("@/components/ingredient-input-review-screen", () => ({
  default: ({
    onBack,
    onChangeMethod,
    onChangeProfile,
    onContinue,
    onIngredientTextChange,
    onRetryLoad,
    report,
    state,
  }: MockProps) => (
    <section data-testid="ingredient-review-screen">
      <div data-testid="review-state">{state}</div>
      <div data-testid="review-draft-id">{report?.draftId ?? ""}</div>
      <div data-testid="review-source">{report?.source ?? ""}</div>
      <div data-testid="review-source-label">{report?.sourceLabel ?? ""}</div>
      <div data-testid="review-ingredient-text">{report?.ingredientText ?? ""}</div>
      <div data-testid="review-selected-profile-id">{report?.selectedProfile?.profileId ?? ""}</div>
      <div data-testid="review-selected-profile-display-name">{report?.selectedProfile?.displayName ?? ""}</div>
      <div data-testid="review-mode">{report?.selectedProfile ? "profiled" : "guest"}</div>
      <button onClick={onBack} type="button">
        Ingredient review back
      </button>
      <button onClick={onChangeMethod} type="button">
        Ingredient review change method
      </button>
      <button
        onClick={() =>
          onIngredientTextChange("  Water,\nNiacinamide, Fragrance  ")
        }
        type="button"
      >
        Ingredient review edit text
      </button>
      <button
        onClick={() =>
          onIngredientTextChange(
            "  Completely arbitrary label text,\nUnknown entry  ",
          )
        }
        type="button"
      >
        Ingredient review edit arbitrary text
      </button>
      <button onClick={onChangeProfile} type="button">
        Ingredient review change profile
      </button>
      <button
        onClick={() =>
          onContinue({
            draftId: report.draftId,
            ingredientText: report.ingredientText,
            ...(report.selectedProfile
              ? {
                  profileId: report.selectedProfile.profileId,
                }
              : {}),
          })
        }
        type="button"
      >
        Ingredient review continue
      </button>
      <button
        onClick={() =>
          onContinue({
            draftId: "stale-draft-id",
            ingredientText: report.ingredientText,
          })
        }
        type="button"
      >
        Ingredient review continue with stale draft
      </button>
      <button onClick={onRetryLoad} type="button">
        Ingredient review retry
      </button>
    </section>
  ),
}))

vi.mock("@/components/ingredient-scanner-results-screen", () => ({
  default: ({
    onBackToReview,
    onRetryLoad,
    onSaveResult,
    onScanAnotherProduct,
    report,
    state,
  }: MockProps) => {
    const saveSubmission = report
      ? {
          resultId: report.resultId,
          draftId: report.draftId,
          ...(report.selectedProfile
            ? { profileId: report.selectedProfile.profileId }
            : {}),
        }
      : null

    return (
      <section data-testid="ingredient-results-screen">
        <div data-testid="results-state">{state}</div>
        <div data-testid="results-result-id">{report?.resultId ?? ""}</div>
        <div data-testid="results-draft-id">{report?.draftId ?? ""}</div>
        <div data-testid="results-source-label">{report?.sourceLabel ?? ""}</div>
        <div data-testid="results-summary-label">{report?.summaryLabel ?? ""}</div>
        <div data-testid="results-count-label">{report?.ingredientCountLabel ?? ""}</div>
        <div data-testid="results-guidance-item-names">
          {JSON.stringify(
            report?.guidanceItems?.map((item: MockProps) => item.name) ?? [],
          )}
        </div>
        <div data-testid="results-selected-profile-id">
          {report?.selectedProfile?.profileId ?? ""}
        </div>
        <div data-testid="results-selected-profile-display-name">
          {report?.selectedProfile?.displayName ?? ""}
        </div>
        <div data-testid="results-mode">
          {report?.selectedProfile ? "profiled" : "guest"}
        </div>
        <div data-testid="results-saved-label">{report?.savedLabel ?? ""}</div>
        <button
          onClick={() => onBackToReview(report?.draftId ?? "")}
          type="button"
        >
          Ingredient results back to review
        </button>
        <button onClick={onScanAnotherProduct} type="button">
          Ingredient results scan another
        </button>
        <button
          onClick={() => {
            if (saveSubmission) {
              onSaveResult(saveSubmission)
            }
          }}
          type="button"
        >
          Ingredient results save
        </button>
        <button onClick={onRetryLoad} type="button">
          Ingredient results retry
        </button>
      </section>
    )
  },
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
  default: ({ onBack, onOpenProduct, onOpenStore }: MockProps) => (
    <section data-testid="routine-screen">
      <button onClick={onBack} type="button">
        Routine back
      </button>
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
  default: ({ onBack, onOpenCart, onOpenProduct }: MockProps) => (
    <section data-testid="store-screen">
      <button onClick={onBack} type="button">
        Store back
      </button>
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
  default: ({
    canViewOrder,
    onBackToReview,
    onContinueShopping,
    onRefreshStatus,
    onRetryPayment,
    onViewOrder,
    report,
    state,
  }: MockProps) => (
    <section data-testid="order-result-screen">
      <div data-testid="order-result-state">{state}</div>
      <div data-testid="order-result-report">{JSON.stringify(report)}</div>
      <div data-testid="order-result-props">
        {JSON.stringify({ canViewOrder })}
      </div>
      <button
        disabled={!canViewOrder}
        onClick={() => onViewOrder(report.orderId)}
        type="button"
      >
        Order result view order
      </button>
      <button
        disabled={!canViewOrder}
        onClick={() => onViewOrder("unknown-order-id")}
        type="button"
      >
        Order result view unknown order
      </button>
      <button onClick={onContinueShopping} type="button">
        Order result continue shopping
      </button>
      <button onClick={onBackToReview} type="button">
        Order result back to review
      </button>
      <button onClick={onRefreshStatus} type="button">
        Order result refresh
      </button>
      <button onClick={onRetryPayment} type="button">
        Order result retry payment
      </button>
    </section>
  ),
}))

vi.mock("@/components/order-details-screen", () => ({
  default: ({
    canDownloadReceipt,
    canGoBack,
    canOpenSupport,
    isOffline,
    isReceiptDownloadAvailableOffline,
    onBack,
    onDownloadReceipt,
    onOpenSupport,
    onRetryLoad,
    report,
    state,
  }: MockProps) => (
    <section data-testid="order-details-screen">
      <div data-testid="order-details-report">
        {JSON.stringify(report)}
      </div>
      <div data-testid="order-details-order-id">
        {report?.orderId ?? ""}
      </div>
      <div data-testid="order-details-reference-label">
        {report?.orderReferenceLabel ?? ""}
      </div>
      <div data-testid="order-details-status-label">
        {report?.statusLabel ?? ""}
      </div>
      <div data-testid="order-details-item-names">
        {JSON.stringify(
          report?.items?.map((item: MockProps) => item.productName) ?? [],
        )}
      </div>
      <div data-testid="order-details-shipping-update-labels">
        {JSON.stringify(
          report?.shippingUpdates?.map(
            (update: MockProps) => update.statusLabel,
          ) ?? [],
        )}
      </div>
      <div data-testid="order-details-total-label">
        {report?.receipt?.totalLabel ?? ""}
      </div>
      <div data-testid="order-details-props">
        {JSON.stringify({
          canDownloadReceipt,
          canGoBack,
          canOpenSupport,
          isOffline,
          isReceiptDownloadAvailableOffline,
          state,
        })}
      </div>
      <button onClick={onBack} type="button">
        Order details back
      </button>
      <button
        onClick={() => onOpenSupport(report?.orderId ?? "")}
        type="button"
      >
        Order details open support
      </button>
      <button
        onClick={() => onOpenSupport("unknown-order-id")}
        type="button"
      >
        Order details open support with stale order
      </button>
      <button
        onClick={() => onDownloadReceipt(report?.orderId ?? "")}
        type="button"
      >
        Order details download receipt
      </button>
      <button
        onClick={() => onDownloadReceipt("unknown-order-id")}
        type="button"
      >
        Order details download receipt with stale order
      </button>
      <button onClick={onRetryLoad} type="button">
        Order details retry
      </button>
    </section>
  ),
}))

vi.mock("@/components/order-history-screen", () => ({
  default: ({
    canGoBack,
    canLoadMore,
    canOpenOrders,
    isLoadMoreAvailableOffline,
    isOffline,
    onBack,
    onLoadMore,
    onOpenOrder,
    onRetryLoad,
    report,
    state,
  }: MockProps) => {
    const orders = report?.orders ?? []

    return (
      <section data-testid="order-history-screen">
        <div data-testid="order-history-report">
          {JSON.stringify(report)}
        </div>
        <div data-testid="order-history-order-ids">
          {JSON.stringify(
            orders.map((order: MockProps) => order.orderId),
          )}
        </div>
        <div data-testid="order-history-reference-labels">
          {JSON.stringify(
            orders.map(
              (order: MockProps) => order.orderReferenceLabel,
            ),
          )}
        </div>
        <div data-testid="order-history-status-labels">
          {JSON.stringify(
            orders.map((order: MockProps) => order.statusLabel),
          )}
        </div>
        <div data-testid="order-history-total-labels">
          {JSON.stringify(
            orders.map((order: MockProps) => order.totalLabel),
          )}
        </div>
        <div data-testid="order-history-open-availability">
          {JSON.stringify(
            orders.map((order: MockProps) => order.canOpenOrder),
          )}
        </div>
        <div data-testid="order-history-props">
          {JSON.stringify({
            canGoBack,
            canLoadMore,
            canOpenOrders,
            isLoadMoreAvailableOffline,
            isOffline,
            state,
          })}
        </div>
        <button onClick={onBack} type="button">
          Order history back
        </button>
        <button
          disabled={
            !canOpenOrders ||
            orders[0]?.canOpenOrder === false
          }
          onClick={() => onOpenOrder(orders[0]?.orderId ?? "")}
          type="button"
        >
          Order history open first order
        </button>
        <button
          onClick={() => onOpenOrder("unknown-order-id")}
          type="button"
        >
          Order history open unknown order
        </button>
        <button onClick={onLoadMore} type="button">
          Order history load more
        </button>
        <button onClick={onRetryLoad} type="button">
          Order history retry
        </button>
      </section>
    )
  },
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
  mockData.initialScreenOverride = null
  mockData.selectedShippingOptionOverride = null
  mockData.useStateCall = 0
  vi.restoreAllMocks()
})

function renderPage() {
  const user = userEvent.setup()
  mockData.initialScreenOverride = null
  mockData.selectedShippingOptionOverride = null
  mockData.useStateCall = 0
  render(<Page />)
  return user
}

function renderPageWithInitialScreen(initialScreen: string) {
  const user = userEvent.setup()
  mockData.initialScreenOverride = initialScreen
  mockData.selectedShippingOptionOverride = null
  mockData.useStateCall = 0
  render(<Page />)
  return user
}

function renderPageWithInitialShippingOption(
  selectedShippingOptionId: string,
) {
  const user = userEvent.setup()
  mockData.initialScreenOverride = null
  mockData.selectedShippingOptionOverride = selectedShippingOptionId
  mockData.useStateCall = 0
  render(<Page />)
  return user
}

function renderPageWithInitialScreenAndShippingOption(
  initialScreen: string,
  selectedShippingOptionId: string,
) {
  const user = userEvent.setup()
  mockData.initialScreenOverride = initialScreen
  mockData.selectedShippingOptionOverride = selectedShippingOptionId
  mockData.useStateCall = 0
  render(<Page />)
  return user
}

async function goToRoutine(user: User) {
  await goToResultsSummary(user)
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

async function goToDashboard(user: User) {
  await goToResultsSummary(user)
  await user.click(screen.getByRole("button", { name: "Close results" }))
  expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
}

async function goToResultsSummary(user: User) {
  await goToImageReview(user)
  await user.click(screen.getByRole("button", { name: "Use photo" }))
  await user.click(screen.getByRole("button", { name: "View results" }))
  expect(screen.getByTestId("results-screen")).toBeInTheDocument()
}

async function goToImageReview(user: User) {
  await user.click(screen.getByRole("button", { name: "Start analysis" }))
  await user.click(screen.getByRole("button", { name: "Accept consent" }))
  await user.click(screen.getByRole("button", { name: "Save profile" }))
  await user.click(screen.getByRole("button", { name: "Choose upload" }))
  expect(screen.getByTestId("image-review-screen")).toBeInTheDocument()
}

function getJson(testId: string) {
  return JSON.parse(screen.getByTestId(testId).textContent ?? "null")
}

function getProfileManagementSummary() {
  return getJson("profile-management-report-summary")
}

function getScannerEntryReport() {
  return getJson("scanner-entry-report")
}

function getIngredientReviewReport() {
  return {
    draftId: screen.getByTestId("review-draft-id").textContent ?? "",
    ingredientText:
      screen.getByTestId("review-ingredient-text").textContent ?? "",
    mode: screen.getByTestId("review-mode").textContent ?? "",
    selectedProfileDisplayName:
      screen.getByTestId("review-selected-profile-display-name").textContent ??
      "",
    selectedProfileId:
      screen.getByTestId("review-selected-profile-id").textContent ?? "",
    source: screen.getByTestId("review-source").textContent ?? "",
    sourceLabel: screen.getByTestId("review-source-label").textContent ?? "",
    state: screen.getByTestId("review-state").textContent ?? "",
  }
}

function getIngredientResultsReport() {
  return {
    countLabel: screen.getByTestId("results-count-label").textContent ?? "",
    draftId: screen.getByTestId("results-draft-id").textContent ?? "",
    guidanceItemNames: getJson("results-guidance-item-names"),
    mode: screen.getByTestId("results-mode").textContent ?? "",
    resultId: screen.getByTestId("results-result-id").textContent ?? "",
    savedLabel: screen.getByTestId("results-saved-label").textContent ?? "",
    selectedProfileDisplayName:
      screen.getByTestId("results-selected-profile-display-name").textContent ??
      "",
    selectedProfileId:
      screen.getByTestId("results-selected-profile-id").textContent ?? "",
    sourceLabel: screen.getByTestId("results-source-label").textContent ?? "",
    state: screen.getByTestId("results-state").textContent ?? "",
    summaryLabel: screen.getByTestId("results-summary-label").textContent ?? "",
  }
}

function getProgressReport() {
  return {
    comparisonBaselineId:
      screen.getByTestId("progress-comparison-baseline-id").textContent ?? "",
    comparisonComparisonId:
      screen.getByTestId("progress-comparison-comparison-id").textContent ?? "",
    comparisonHeading:
      screen.getByTestId("progress-comparison-heading").textContent ?? "",
    displayName: screen.getByTestId("progress-display-name").textContent ?? "",
    metricLabels: getJson("progress-metric-labels"),
    profileId: screen.getByTestId("progress-profile-id").textContent ?? "",
    routineId: screen.getByTestId("progress-routine-id").textContent ?? "",
    scanIds: getJson("progress-scan-ids"),
    selectedBaselineId:
      screen.getByTestId("progress-selected-baseline-id").textContent ?? "",
    selectedComparisonId:
      screen.getByTestId("progress-selected-comparison-id").textContent ?? "",
  }
}

function getOrderDetailsReport() {
  return {
    itemNames: getJson("order-details-item-names"),
    orderId: screen.getByTestId("order-details-order-id").textContent ?? "",
    props: getJson("order-details-props"),
    referenceLabel:
      screen.getByTestId("order-details-reference-label").textContent ?? "",
    report: getJson("order-details-report"),
    shippingUpdateLabels: getJson("order-details-shipping-update-labels"),
    statusLabel:
      screen.getByTestId("order-details-status-label").textContent ?? "",
    totalLabel:
      screen.getByTestId("order-details-total-label").textContent ?? "",
  }
}

function getOrderHistoryReport() {
  return {
    orderIds: getJson("order-history-order-ids"),
    openAvailability: getJson("order-history-open-availability"),
    props: getJson("order-history-props"),
    referenceLabels: getJson("order-history-reference-labels"),
    report: getJson("order-history-report"),
    statusLabels: getJson("order-history-status-labels"),
    totalLabels: getJson("order-history-total-labels"),
  }
}

function getBodyTextOutsideProfileManagementReport() {
  const renderedOutsideReport = document.body.cloneNode(true) as HTMLElement
  renderedOutsideReport
    .querySelector('[data-testid="profile-management-report-summary"]')
    ?.remove()
  return renderedOutsideReport.textContent ?? ""
}

async function goToWelcomeScannerEntry(user: User) {
  await user.click(screen.getByRole("button", { name: "Open guest ingredient scanner" }))
  expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
}

async function goToWelcomeManualReview(user: User) {
  await goToWelcomeScannerEntry(user)
  await user.click(screen.getByRole("button", { name: "Scanner entry manual entry" }))
  expect(screen.getByTestId("ingredient-review-screen")).toBeInTheDocument()
}

async function goToWelcomeManualResults(user: User) {
  await goToWelcomeManualReview(user)
  await user.click(screen.getByRole("button", { name: "Ingredient review edit text" }))
  await user.click(screen.getByRole("button", { name: "Ingredient review continue" }))
  expect(screen.getByTestId("ingredient-results-screen")).toBeInTheDocument()
}

async function goToDashboardScannerEntry(user: User) {
  await goToDashboard(user)
  await user.click(screen.getByRole("button", { name: "Open dashboard ingredient scanner" }))
  expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
}

async function goToDashboardPhotoReview(user: User) {
  await goToDashboardScannerEntry(user)
  await user.click(screen.getByRole("button", { name: "Scanner entry take photo" }))
  expect(screen.getByTestId("ingredient-review-screen")).toBeInTheDocument()
}

async function goToDashboardPhotoResults(user: User) {
  await goToDashboardPhotoReview(user)
  await user.click(screen.getByRole("button", { name: "Ingredient review continue" }))
  expect(screen.getByTestId("ingredient-results-screen")).toBeInTheDocument()
}

async function goToProgress(user: User) {
  await goToDashboard(user)
  await user.click(screen.getByRole("button", { name: "Dashboard open progress" }))
  expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
}

async function goToDashboardOrderDetails(user: User) {
  await goToDashboard(user)
  await user.click(screen.getByRole("button", { name: "Dashboard open recent order" }))
  expect(screen.getByTestId("order-details-screen")).toBeInTheDocument()
}

async function goToDashboardOrderHistory(user: User) {
  await goToDashboard(user)
  await user.click(screen.getByRole("button", { name: "Dashboard open orders" }))
  expect(screen.getByTestId("order-history-screen")).toBeInTheDocument()
}

function goToOrderConfirmation() {
  const user = renderPageWithInitialScreen("order-confirmation")
  expect(screen.getByTestId("order-result-screen")).toBeInTheDocument()
  return user
}

describe("Page route controller", () => {
  it("routes completed scan results Close to the dashboard", async () => {
    const user = renderPage()

    await goToDashboard(user)

    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("keeps first-time profile setup routing directly to image source", async () => {
    const user = renderPage()

    await user.click(screen.getByRole("button", { name: "Start analysis" }))
    await user.click(screen.getByRole("button", { name: "Accept consent" }))
    await user.click(screen.getByRole("button", { name: "Save profile" }))

    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-screen")).not.toBeInTheDocument()
    expect(screen.queryByTestId("profile-management-screen")).not.toBeInTheDocument()
  })

  it("routes Welcome guest scanner to scanner entry in guest mode", async () => {
    const user = renderPage()

    await user.click(screen.getByRole("button", { name: "Open guest ingredient scanner" }))

    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
    expect(getScannerEntryReport()).toMatchObject({
      displayName: null,
      mode: "guest",
      profileId: null,
    })
  })

  it("returns from Welcome scanner entry Back to Welcome", async () => {
    const user = renderPage()

    await user.click(screen.getByRole("button", { name: "Open guest ingredient scanner" }))
    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Scanner entry back" }))

    expect(screen.getByTestId("welcome-screen")).toBeInTheDocument()
  })

  it("routes dashboard Start new scan to image source and clears the previous image review path", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard start new scan" }))

    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("image-review-screen")).not.toBeInTheDocument()
  })

  it("routes dashboard Ingredient scanner to scanner entry with active profile context", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Open dashboard ingredient scanner" }))

    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
    expect(getScannerEntryReport()).toMatchObject({
      displayName: "Route Tester",
      mode: "profiled",
      profileId: "profile-001",
    })
  })

  it("returns from dashboard scanner entry Back to the dashboard", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Open dashboard ingredient scanner" }))
    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Scanner entry back" }))

    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("routes dashboard Change profile to profile management", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))

    expect(screen.getByTestId("profile-management-screen")).toBeInTheDocument()
    expect(getProfileManagementSummary()).toMatchObject({
      profileIds: ["profile-001", "profile-002"],
      activeProfileId: "profile-001",
      activeDisplayName: "Route Tester",
    })
  })

  it("routes dashboard Latest report to results summary", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard open latest report" }))

    expect(screen.getByTestId("results-screen")).toBeInTheDocument()
  })

  it("routes dashboard Active routine to routine recommendations", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard open routine" }))

    expect(screen.getByTestId("routine-screen")).toBeInTheDocument()
  })

  it("routes dashboard Store to the store collection", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard open store" }))

    expect(screen.getByTestId("store-screen")).toBeInTheDocument()
  })

  it("enables Dashboard Progress, Orders, and Recent-order details", async () => {
    const user = renderPage()
    await goToDashboard(user)

    expect(screen.getByRole("button", { name: "Dashboard open progress" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Dashboard open orders" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Dashboard open recent order" })).toBeEnabled()
  })

  it("routes Dashboard Orders to static host-shaped Order history", async () => {
    const user = renderPage()
    await goToDashboardOrderHistory(user)

    expect(getOrderHistoryReport()).toMatchObject({
      orderIds: ["order-001", "order-002"],
      referenceLabels: [
        "DL-2024-001234",
        "DL-2024-001233",
      ],
      statusLabels: [
        "Host status: preparing order items",
        "Host status: historical order summary",
      ],
      totalLabels: ["$93.50", "$18.00"],
      openAvailability: [true, false],
      props: {
        canGoBack: true,
        canLoadMore: true,
        canOpenOrders: true,
        isLoadMoreAvailableOffline: false,
        isOffline: false,
        state: "ready",
      },
    })
  })

  it("keeps Express order-history totals coherent with Screen 24 details", async () => {
    const user = renderPageWithInitialShippingOption(
      "shipopt-002",
    )

    await goToDashboardOrderHistory(user)

    expect(getOrderHistoryReport().totalLabels).toEqual([
      "$102.50",
      "$18.00",
    ])

    await user.click(screen.getByRole("button", { name: "Order history open first order" }))

    expect(getOrderDetailsReport().report.receipt).toMatchObject({
      subtotalLabel: "$85.00",
      shippingLabel: "$9.00",
      taxLabel: "$8.50",
      totalLabel: "$102.50",
    })
  })

  it("returns from Order history Back to the dashboard", async () => {
    const user = renderPage()
    await goToDashboardOrderHistory(user)

    await user.click(screen.getByRole("button", { name: "Order history back" }))

    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("returns from Order details Back to Order history after history View details", async () => {
    const user = renderPage()
    await goToDashboardOrderHistory(user)
    const historyReport = getOrderHistoryReport()

    await user.click(screen.getByRole("button", { name: "Order history open first order" }))

    expect(screen.getByTestId("order-details-screen")).toBeInTheDocument()
    expect(getOrderDetailsReport().orderId).toBe("order-001")

    await user.click(screen.getByRole("button", { name: "Order details back" }))

    expect(screen.getByTestId("order-history-screen")).toBeInTheDocument()
    expect(getOrderHistoryReport()).toMatchObject(historyReport)
  })

  it("blocks unknown Order-history order IDs without leaving history", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardOrderHistory(user)
    const historyReport = getOrderHistoryReport()

    await user.click(screen.getByRole("button", { name: "Order history open unknown order" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Order details route failed closed:",
      "unknown-order-id",
    )
    expect(screen.getByTestId("order-history-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("order-details-screen")).not.toBeInTheDocument()
    expect(getOrderHistoryReport()).toMatchObject(historyReport)
  })

  it("keeps the historical order readable while its detail route stays unavailable", async () => {
    const user = renderPage()
    await goToDashboardOrderHistory(user)

    expect(getOrderHistoryReport()).toMatchObject({
      orderIds: ["order-001", "order-002"],
      referenceLabels: [
        "DL-2024-001234",
        "DL-2024-001233",
      ],
      openAvailability: [true, false],
    })
  })

  it("keeps Order-history Load more as a future-adapter log only", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardOrderHistory(user)
    const historyReport = getOrderHistoryReport()

    await user.click(screen.getByRole("button", { name: "Order history load more" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Loading more order-history entries through future adapter.",
    )
    expect(screen.getByTestId("order-history-screen")).toBeInTheDocument()
    expect(getOrderHistoryReport()).toMatchObject(historyReport)
  })

  it("keeps Order-history Retry as a future-adapter log only", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardOrderHistory(user)

    await user.click(screen.getByRole("button", { name: "Order history retry" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Retrying order-history load through future adapter.",
    )
    expect(screen.getByTestId("order-history-screen")).toBeInTheDocument()
  })

  it("routes Dashboard recent order to static host-shaped Order details", async () => {
    const user = renderPage()
    await goToDashboardOrderDetails(user)

    expect(getOrderDetailsReport()).toMatchObject({
      orderId: "order-001",
      referenceLabel: "DL-2024-001234",
      statusLabel: "Host status: preparing order items",
      itemNames: [
        "Gentle Foaming Cleanser",
        "Invisible Shield SPF 50",
        "Hyaluronic Boost Serum",
      ],
      shippingUpdateLabels: [
        "Order received by DermaLens",
        "Preparing order items",
      ],
      totalLabel: "$93.50",
      props: {
        canDownloadReceipt: true,
        canGoBack: true,
        canOpenSupport: true,
        isOffline: false,
        isReceiptDownloadAvailableOffline: false,
        state: "ready",
      },
    })
  })

  it("keeps Dashboard recent Order details coherent with the selected Express receipt snapshot", async () => {
    const user = renderPageWithInitialShippingOption(
      "shipopt-002",
    )

    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard open recent order" }))

    expect(getOrderDetailsReport().report.receipt).toMatchObject({
      subtotalLabel: "$85.00",
      shippingLabel: "$9.00",
      taxLabel: "$8.50",
      totalLabel: "$102.50",
    })
  })

  it("returns from Dashboard Order details Back to the dashboard", async () => {
    const user = renderPage()
    await goToDashboardOrderDetails(user)

    await user.click(screen.getByRole("button", { name: "Order details back" }))

    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("blocks unknown Dashboard recent-order IDs without leaving the dashboard", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard open unknown recent order" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Order details route failed closed:",
      "unknown-order-id",
    )
    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("order-details-screen")).not.toBeInTheDocument()
  })

  it("routes confirmed payment-result View order to Order details and Back to confirmation", async () => {
    const user = goToOrderConfirmation()

    await user.click(screen.getByRole("button", { name: "Order result view order" }))

    expect(getOrderDetailsReport()).toMatchObject({
      orderId: "order-001",
      referenceLabel: "DL-2024-001234",
      statusLabel: "Host status: preparing order items",
      itemNames: [
        "Gentle Foaming Cleanser",
        "Invisible Shield SPF 50",
        "Hyaluronic Boost Serum",
      ],
      shippingUpdateLabels: [
        "Order received by DermaLens",
        "Preparing order items",
      ],
      totalLabel: "$93.50",
    })

    await user.click(screen.getByRole("button", { name: "Order details back" }))

    expect(screen.getByTestId("order-result-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("order-details-screen")).not.toBeInTheDocument()
  })

  it("blocks unknown confirmed-result order IDs without leaving confirmation", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = goToOrderConfirmation()

    await user.click(screen.getByRole("button", { name: "Order result view unknown order" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Order details route failed closed:",
      "unknown-order-id",
    )
    expect(screen.getByTestId("order-result-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("order-details-screen")).not.toBeInTheDocument()
  })

  it("keeps Order-details Support as a future-adapter log only", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardOrderDetails(user)

    await user.click(screen.getByRole("button", { name: "Order details open support" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Opening order support through future adapter:",
      "order-001",
    )
    expect(screen.getByTestId("order-details-screen")).toBeInTheDocument()
  })

  it("guards stale Order-details Support context", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardOrderDetails(user)
    const initialReport = getOrderDetailsReport()

    await user.click(screen.getByRole("button", { name: "Order details open support with stale order" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Order support route failed closed:",
      "unknown-order-id",
    )
    expect(screen.getByTestId("order-details-screen")).toBeInTheDocument()
    expect(getOrderDetailsReport()).toMatchObject(initialReport)
  })

  it("keeps Order-details receipt download as a future-adapter log only", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardOrderDetails(user)

    await user.click(screen.getByRole("button", { name: "Order details download receipt" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Requesting receipt download through future adapter:",
      "order-001",
    )
    expect(screen.getByTestId("order-details-screen")).toBeInTheDocument()
  })

  it("guards stale Order-details receipt-download context", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardOrderDetails(user)
    const initialReport = getOrderDetailsReport()

    await user.click(screen.getByRole("button", { name: "Order details download receipt with stale order" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Receipt-download route failed closed:",
      "unknown-order-id",
    )
    expect(screen.getByTestId("order-details-screen")).toBeInTheDocument()
    expect(getOrderDetailsReport()).toMatchObject(initialReport)
  })

  it("keeps Order-details Retry as a future-adapter log only", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardOrderDetails(user)

    await user.click(screen.getByRole("button", { name: "Order details retry" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Retrying order-details load through future adapter.",
    )
    expect(screen.getByTestId("order-details-screen")).toBeInTheDocument()
  })

  it("keeps Order-details fixtures static across Dashboard and confirmed-result entry", async () => {
    const dashboardUser = renderPage()
    await goToDashboardOrderDetails(dashboardUser)
    const dashboardReport = getOrderDetailsReport()

    cleanup()

    const confirmationUser = goToOrderConfirmation()
    await confirmationUser.click(screen.getByRole("button", { name: "Order result view order" }))
    const confirmationReport = getOrderDetailsReport()

    expect(confirmationReport).toMatchObject({
      itemNames: dashboardReport.itemNames,
      shippingUpdateLabels: dashboardReport.shippingUpdateLabels,
      totalLabel: dashboardReport.totalLabel,
    })
    expect(confirmationReport.report.items.map((item: MockProps) => item.quantityLabel)).toEqual([
      "Host quantity: 1",
      "Host quantity: 1",
      "Host quantity: 1",
    ])
    expect(confirmationReport.report.receipt).toMatchObject({
      subtotalLabel: "$85.00",
      shippingLabel: "Free",
      taxLabel: "$8.50",
      totalLabel: "$93.50",
    })
  })

  it("keeps the default confirmed order coherent with Screen 24 details", async () => {
    const user = goToOrderConfirmation()
    const orderResultReport = getJson("order-result-report")

    expect(orderResultReport).toMatchObject({
      orderId: "order-001",
      orderReferenceLabel: "DL-2024-001234",
      itemCount: 3,
      totalLabel: "$93.50",
    })

    await user.click(screen.getByRole("button", { name: "Order result view order" }))

    const orderDetailsReport = getOrderDetailsReport()

    expect(orderDetailsReport.report).toMatchObject({
      orderId: "order-001",
      orderReferenceLabel: "DL-2024-001234",
      receipt: {
        totalLabel: "$93.50",
      },
    })
    expect(orderDetailsReport.report.items).toHaveLength(3)
    expect(orderDetailsReport.itemNames).toEqual([
      "Gentle Foaming Cleanser",
      "Invisible Shield SPF 50",
      "Hyaluronic Boost Serum",
    ])
  })

  it("keeps Express confirmed order coherent with Screen 24 details", async () => {
    const user = renderPageWithInitialScreenAndShippingOption(
      "order-confirmation",
      "shipopt-002",
    )

    const orderResultReport = getJson("order-result-report")

    expect(orderResultReport).toMatchObject({
      orderId: "order-001",
      orderReferenceLabel: "DL-2024-001234",
      itemCount: 3,
      totalLabel: "$102.50",
      deliverySummaryLabel: "Express delivery to your address",
      estimatedDeliveryLabel: "Estimated delivery: 2-3 business days",
    })

    await user.click(screen.getByRole("button", { name: "Order result view order" }))

    const orderDetailsReport = getOrderDetailsReport()

    expect(orderDetailsReport.report).toMatchObject({
      orderId: "order-001",
      orderReferenceLabel: "DL-2024-001234",
      receipt: {
        subtotalLabel: "$85.00",
        shippingLabel: "$9.00",
        taxLabel: "$8.50",
        totalLabel: "$102.50",
      },
    })
    expect(orderDetailsReport.itemNames).toEqual([
      "Gentle Foaming Cleanser",
      "Invisible Shield SPF 50",
      "Hyaluronic Boost Serum",
    ])
  })

  it("keeps Order-details integration inside host-owned architecture boundaries", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const fetchSpy = vi.fn()
    const storageSet = vi.spyOn(Storage.prototype, "setItem")
    const storageGet = vi.spyOn(Storage.prototype, "getItem")
    const indexedDbOpen = vi.fn()
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null)
    const setIntervalSpy = vi.spyOn(window, "setInterval")
    const originalCookie = document.cookie
    const originalFetch = globalThis.fetch
    const originalGeolocation = Object.getOwnPropertyDescriptor(
      window.navigator,
      "geolocation",
    )
    const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB")
    const originalMediaDevices = Object.getOwnPropertyDescriptor(
      window.navigator,
      "mediaDevices",
    )
    const originalFileReader = Object.getOwnPropertyDescriptor(
      globalThis,
      "FileReader",
    )
    const geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
    }
    const mediaDevices = {
      getUserMedia: vi.fn(),
    }
    const FileReaderSpy = vi.fn()

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchSpy,
    })
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: indexedDbOpen },
    })
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: geolocation,
    })
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: mediaDevices,
    })
    Object.defineProperty(globalThis, "FileReader", {
      configurable: true,
      value: FileReaderSpy,
    })

    try {
      const dashboardUser = renderPage()
      await goToDashboard(dashboardUser)
      setIntervalSpy.mockClear()
      await dashboardUser.click(screen.getByRole("button", { name: "Dashboard open orders" }))
      const initialHistoryReport = getOrderHistoryReport()
      const orderHistoryText =
        screen.getByTestId("order-history-screen").textContent ?? ""
      expect(orderHistoryText).not.toContain("trackingUrl")
      expect(orderHistoryText).not.toContain("receiptUrl")
      expect(orderHistoryText).not.toContain("payment-001")
      expect(orderHistoryText).not.toContain("gatewaySessionId")
      expect(orderHistoryText).not.toContain("transactionId")
      expect(orderHistoryText).not.toContain("Screen 26")
      await dashboardUser.click(screen.getByRole("button", { name: "Order history load more" }))
      await dashboardUser.click(screen.getByRole("button", { name: "Order history retry" }))
      await dashboardUser.click(screen.getByRole("button", { name: "Order history open unknown order" }))
      expect(getOrderHistoryReport()).toMatchObject(initialHistoryReport)
      await dashboardUser.click(screen.getByRole("button", { name: "Order history open first order" }))
      expect(screen.getByTestId("order-details-screen")).toBeInTheDocument()
      await dashboardUser.click(screen.getByRole("button", { name: "Order details back" }))
      expect(screen.getByTestId("order-history-screen")).toBeInTheDocument()
      expect(getOrderHistoryReport()).toMatchObject(initialHistoryReport)
      await dashboardUser.click(screen.getByRole("button", { name: "Order history back" }))
      expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
      await dashboardUser.click(screen.getByRole("button", { name: "Dashboard open recent order" }))
      expect(screen.getByTestId("order-details-screen")).toBeInTheDocument()
      await dashboardUser.click(screen.getByRole("button", { name: "Order details open support" }))
      await dashboardUser.click(screen.getByRole("button", { name: "Order details download receipt" }))
      await dashboardUser.click(screen.getByRole("button", { name: "Order details retry" }))
      await dashboardUser.click(screen.getByRole("button", { name: "Order details back" }))
      await dashboardUser.click(screen.getByRole("button", { name: "Dashboard open unknown recent order" }))

      cleanup()

      const confirmationUser = goToOrderConfirmation()
      await confirmationUser.click(screen.getByRole("button", { name: "Order result view order" }))
      await confirmationUser.click(screen.getByRole("button", { name: "Order details open support with stale order" }))
      await confirmationUser.click(screen.getByRole("button", { name: "Order details download receipt with stale order" }))
      await confirmationUser.click(screen.getByRole("button", { name: "Order details back" }))

      const bodyText = document.body.textContent ?? ""
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(storageSet).not.toHaveBeenCalled()
      expect(storageGet).not.toHaveBeenCalled()
      expect(indexedDbOpen).not.toHaveBeenCalled()
      expect(document.cookie).toBe(originalCookie)
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled()
      expect(geolocation.watchPosition).not.toHaveBeenCalled()
      expect(mediaDevices.getUserMedia).not.toHaveBeenCalled()
      expect(FileReaderSpy).not.toHaveBeenCalled()
      expect(openSpy).not.toHaveBeenCalled()
      expect(setIntervalSpy).not.toHaveBeenCalled()
      expect(document.querySelector('input[type="file"]')).toBeNull()
      expect(bodyText).not.toContain("trackingUrl")
      expect(bodyText).not.toContain("receiptUrl")
      expect(bodyText).not.toContain("payment-001")
      expect(bodyText).not.toContain("gatewaySessionId")
      expect(bodyText).not.toContain("transactionId")
      expect(bodyText).not.toContain("Screen 26")
      expect(logSpy).toHaveBeenCalledWith(
        "Opening order support through future adapter:",
        "order-001",
      )
      expect(logSpy).toHaveBeenCalledWith(
        "Requesting receipt download through future adapter:",
        "order-001",
      )
      expect(logSpy).toHaveBeenCalledWith(
        "Loading more order-history entries through future adapter.",
      )
      expect(logSpy).toHaveBeenCalledWith(
        "Retrying order-history load through future adapter.",
      )
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, "fetch", {
          configurable: true,
          value: originalFetch,
        })
      } else {
        delete (globalThis as { fetch?: unknown }).fetch
      }

      if (originalIndexedDb) {
        Object.defineProperty(window, "indexedDB", originalIndexedDb)
      } else {
        delete (window as unknown as { indexedDB?: unknown }).indexedDB
      }

      if (originalGeolocation) {
        Object.defineProperty(window.navigator, "geolocation", originalGeolocation)
      } else {
        delete (window.navigator as unknown as { geolocation?: unknown }).geolocation
      }

      if (originalMediaDevices) {
        Object.defineProperty(window.navigator, "mediaDevices", originalMediaDevices)
      } else {
        delete (window.navigator as unknown as { mediaDevices?: unknown }).mediaDevices
      }

      if (originalFileReader) {
        Object.defineProperty(globalThis, "FileReader", originalFileReader)
      } else {
        delete (globalThis as { FileReader?: unknown }).FileReader
      }
    }
  })

  it("routes Dashboard Progress to progress tracking and Back to dashboard", async () => {
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress back" }))

    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("passes the active managed profile context into Progress", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))
    await user.click(screen.getByRole("button", { name: "Dashboard open progress" }))

    expect(getProgressReport()).toMatchObject({
      profileId: "profile-002",
      displayName: "Maya",
    })
  })

  it("refreshes the selected Progress baseline in memory without reordering scans", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress select August baseline" }))

    expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
    expect(getProgressReport()).toMatchObject({
      selectedBaselineId: "progress-scan-003",
      comparisonBaselineId: "progress-scan-003",
      scanIds: [
        "progress-scan-001",
        "progress-scan-002",
        "progress-scan-003",
      ],
    })
    expect(logSpy).toHaveBeenCalledWith(
      "Selecting progress baseline snapshot:",
      "progress-scan-003",
    )
  })

  it("refreshes the selected Progress comparison in memory and allows matching selections", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress select August baseline" }))
    await user.click(screen.getByRole("button", { name: "Progress select August comparison" }))

    expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
    expect(getProgressReport()).toMatchObject({
      selectedBaselineId: "progress-scan-003",
      selectedComparisonId: "progress-scan-003",
      comparisonComparisonId: "progress-scan-003",
    })
    expect(logSpy).toHaveBeenCalledWith(
      "Selecting progress comparison snapshot:",
      "progress-scan-003",
    )
  })

  it("keeps Progress comparison metrics static after selection refreshes", async () => {
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress select August baseline" }))
    await user.click(screen.getByRole("button", { name: "Progress select August comparison" }))

    expect(getProgressReport()).toMatchObject({
      metricLabels: ["Texture note", "Comfort note"],
      comparisonHeading:
        "Host-supplied comparison for explicitly selected snapshots",
    })
    expect(document.body).not.toHaveTextContent(/calculated trend/i)
    expect(document.body).not.toHaveTextContent(/score/i)
    expect(document.body).not.toHaveTextContent(/delta/i)
    expect(document.body).not.toHaveTextContent(/adherence/i)
    expect(document.body).not.toHaveTextContent(/improvement/i)
    expect(document.body).not.toHaveTextContent(/deterioration/i)
  })

  it("returns from Progress Start new scan image source Back to Progress", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress start new scan" }))
    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()
    expect(logSpy).toHaveBeenCalledWith(
      "Opening progress scan setup for profile:",
      "profile-001",
    )

    await user.click(screen.getByRole("button", { name: "Image source back" }))
    expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
  })

  it("blocks Progress Start new scan when profile context is stale", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToProgress(user)

    await user.click(
      screen.getByRole("button", {
        name: "Progress start new scan with stale profile",
      }),
    )

    expect(logSpy).toHaveBeenCalledWith(
      "Progress scan setup blocked because the active profile context is unavailable.",
    )
    expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("image-source-screen")).not.toBeInTheDocument()
  })

  it("returns from Progress Open report results Close to Progress", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress open August report" }))
    expect(screen.getByTestId("results-screen")).toBeInTheDocument()
    expect(logSpy).toHaveBeenCalledWith(
      "Opening progress snapshot report:",
      "progress-scan-003",
    )

    await user.click(screen.getByRole("button", { name: "Close results" }))
    expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
  })

  it("keeps Dashboard latest-report results Close returning to Dashboard", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard open latest report" }))
    expect(screen.getByTestId("results-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close results" }))
    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("blocks unknown Progress report IDs without replacing the route", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress open unknown report" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Progress report route failed closed:",
      "progress-scan-unknown",
    )
    expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("results-screen")).not.toBeInTheDocument()
  })

  it("returns from Progress routine Back to Progress", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress open routine" }))
    expect(screen.getByTestId("routine-screen")).toBeInTheDocument()
    expect(logSpy).toHaveBeenCalledWith("Opening progress routine:", "routine-001")

    await user.click(screen.getByRole("button", { name: "Routine back" }))
    expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
  })

  it("blocks unknown Progress routine IDs without replacing the route", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress open unknown routine" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Progress routine route failed closed:",
      "routine-unknown",
    )
    expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("routine-screen")).not.toBeInTheDocument()
  })

  it("keeps Progress Retry as a future-adapter log only", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToProgress(user)

    await user.click(screen.getByRole("button", { name: "Progress retry" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Retrying progress tracking load through future adapter.",
    )
    expect(screen.getByTestId("progress-tracking-screen")).toBeInTheDocument()
  })

  it("keeps Progress integration inside adapter and future-route boundaries", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const fetchSpy = vi.fn()
    const storageSet = vi.spyOn(Storage.prototype, "setItem")
    const indexedDbOpen = vi.fn()
    const originalCookie = document.cookie
    const originalFetch = globalThis.fetch
    const originalGeolocation = Object.getOwnPropertyDescriptor(
      window.navigator,
      "geolocation",
    )
    const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB")
    const originalMediaDevices = Object.getOwnPropertyDescriptor(
      window.navigator,
      "mediaDevices",
    )
    const originalFileReader = Object.getOwnPropertyDescriptor(
      globalThis,
      "FileReader",
    )
    const geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
    }
    const mediaDevices = {
      getUserMedia: vi.fn(),
    }
    const FileReaderSpy = vi.fn()

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchSpy,
    })
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: indexedDbOpen },
    })
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: geolocation,
    })
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: mediaDevices,
    })
    Object.defineProperty(globalThis, "FileReader", {
      configurable: true,
      value: FileReaderSpy,
    })

    try {
      const user = renderPage()
      await goToProgress(user)
      logSpy.mockClear()

      await user.click(screen.getByRole("button", { name: "Progress select August baseline" }))
      await user.click(screen.getByRole("button", { name: "Progress select August comparison" }))
      await user.click(screen.getByRole("button", { name: "Progress open August report" }))
      await user.click(screen.getByRole("button", { name: "Close results" }))
      await user.click(screen.getByRole("button", { name: "Progress open routine" }))
      await user.click(screen.getByRole("button", { name: "Routine back" }))
      await user.click(screen.getByRole("button", { name: "Progress start new scan" }))

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(storageSet).not.toHaveBeenCalled()
      expect(indexedDbOpen).not.toHaveBeenCalled()
      expect(document.cookie).toBe(originalCookie)
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled()
      expect(geolocation.watchPosition).not.toHaveBeenCalled()
      expect(mediaDevices.getUserMedia).not.toHaveBeenCalled()
      expect(FileReaderSpy).not.toHaveBeenCalled()
      expect(document.querySelector('input[type="file"]')).toBeNull()
      expect(screen.queryByTestId("store-screen")).not.toBeInTheDocument()
      expect(screen.queryByTestId("screen-24")).not.toBeInTheDocument()
      expect(
        logSpy.mock.calls.some(([message]) => message === "Opening photo picker..."),
      ).toBe(false)
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, "fetch", {
          configurable: true,
          value: originalFetch,
        })
      } else {
        delete (globalThis as { fetch?: unknown }).fetch
      }

      if (originalIndexedDb) {
        Object.defineProperty(window, "indexedDB", originalIndexedDb)
      } else {
        delete (window as unknown as { indexedDB?: unknown }).indexedDB
      }

      if (originalGeolocation) {
        Object.defineProperty(window.navigator, "geolocation", originalGeolocation)
      } else {
        delete (window.navigator as unknown as { geolocation?: unknown }).geolocation
      }

      if (originalMediaDevices) {
        Object.defineProperty(window.navigator, "mediaDevices", originalMediaDevices)
      } else {
        delete (window.navigator as unknown as { mediaDevices?: unknown }).mediaDevices
      }

      if (originalFileReader) {
        Object.defineProperty(globalThis, "FileReader", originalFileReader)
      } else {
        delete (globalThis as { FileReader?: unknown }).FileReader
      }
    }
  })

  it("returns from dashboard Start new scan image source Back to the dashboard", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard start new scan" }))
    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Image source back" }))
    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("returns from dashboard Change profile Back to the dashboard", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    expect(screen.getByTestId("profile-management-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Profile management back" }))
    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("returns from dashboard profile selection to the dashboard with the selected name", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))

    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
    expect(getJson("dashboard-report").profile.displayName).toBe("Maya")
    expect(logSpy).toHaveBeenCalledWith("Selecting profile:", "profile-002")
  })

  it("refreshes the dashboard opaque profile ID after selecting Maya", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))

    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
    expect(getJson("dashboard-report").profile.profileId).toBe("profile-002")
  })

  it("uses the selected dashboard profile ID for the next scan action", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))
    await user.click(screen.getByRole("button", { name: "Dashboard start new scan" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Starting dashboard scan for profile:",
      "profile-002",
    )
    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()
  })

  it("keeps known managed-profile labels stable across profile switches", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))
    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))

    expect(getProfileManagementSummary().displayNames).toEqual([
      "Route Tester",
      "Maya",
    ])

    await user.click(screen.getByRole("button", { name: "Profile management select primary" }))

    const dashboardReport = getJson("dashboard-report")
    expect(dashboardReport.profile.displayName).toBe("Route Tester")
    expect(dashboardReport.profile.profileId).toBe("profile-001")
  })

  it("routes image source Change profile to profile management", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard start new scan" }))
    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Change profile from image source" }))

    expect(screen.getByTestId("profile-management-screen")).toBeInTheDocument()
    expect(getProfileManagementSummary().profileIds).toEqual([
      "profile-001",
      "profile-002",
    ])
  })

  it("returns from image-source profile management Back to image source", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard start new scan" }))
    await user.click(screen.getByRole("button", { name: "Change profile from image source" }))
    expect(screen.getByTestId("profile-management-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Profile management back" }))

    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()
  })

  it("returns from image-source profile selection with the selected profile name", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard start new scan" }))
    await user.click(screen.getByRole("button", { name: "Change profile from image source" }))
    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))

    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()
    expect(screen.getByTestId("image-source-profile-name")).toHaveTextContent("Maya")
  })

  it("routes selected-image review Change profile to profile management", async () => {
    const user = renderPage()
    await goToImageReview(user)

    await user.click(screen.getByRole("button", { name: "Change profile from image review" }))

    expect(screen.getByTestId("profile-management-screen")).toBeInTheDocument()
  })

  it("returns from selected-image review profile management Back with the image retained", async () => {
    const user = renderPage()
    await goToImageReview(user)
    const imageUrl = screen.getByTestId("image-review-image-url").textContent

    await user.click(screen.getByRole("button", { name: "Change profile from image review" }))
    await user.click(screen.getByRole("button", { name: "Profile management back" }))

    expect(screen.getByTestId("image-review-screen")).toBeInTheDocument()
    expect(screen.getByTestId("image-review-image-url")).toHaveTextContent(imageUrl ?? "")
    expect(screen.queryByTestId("image-source-screen")).not.toBeInTheDocument()
    expect(screen.queryByTestId("camera-screen")).not.toBeInTheDocument()
  })

  it("returns from selected-image review profile selection with the selected profile name", async () => {
    const user = renderPage()
    await goToImageReview(user)

    await user.click(screen.getByRole("button", { name: "Change profile from image review" }))
    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))

    expect(screen.getByTestId("image-review-screen")).toBeInTheDocument()
    expect(screen.getByTestId("image-review-profile-name")).toHaveTextContent("Maya")
  })

  it("returns from scanner entry profile management Back to scanner entry", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Open dashboard ingredient scanner" }))
    await user.click(screen.getByRole("button", { name: "Scanner entry change profile" }))
    expect(screen.getByTestId("profile-management-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Profile management back" }))

    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
    expect(getScannerEntryReport()).toMatchObject({
      profileId: "profile-001",
      displayName: "Route Tester",
    })
  })

  it("returns from scanner entry profile selection with refreshed optional profile context", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Open dashboard ingredient scanner" }))
    await user.click(screen.getByRole("button", { name: "Scanner entry change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))

    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
    expect(getScannerEntryReport()).toMatchObject({
      displayName: "Maya",
      mode: "profiled",
      profileId: "profile-002",
    })
  })

  it("clears only scanner optional profile context when continuing as guest", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Open dashboard ingredient scanner" }))
    expect(getScannerEntryReport()).toMatchObject({
      profileId: "profile-001",
    })

    await user.click(screen.getByRole("button", { name: "Scanner entry continue as guest" }))

    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
    expect(getScannerEntryReport()).toMatchObject({
      displayName: null,
      mode: "guest",
      profileId: null,
    })

    await user.click(screen.getByRole("button", { name: "Scanner entry back" }))
    expect(getJson("dashboard-report").profile.profileId).toBe("profile-001")

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    expect(getProfileManagementSummary()).toMatchObject({
      activeProfileId: "profile-001",
      activeDisplayName: "Route Tester",
    })
  })

  it("routes Welcome guest manual entry into ingredient review", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()

    await goToWelcomeManualReview(user)

    expect(logSpy).toHaveBeenCalledWith(
      "Opening ingredient scanner manual-entry route:",
      {},
    )
    expect(getIngredientReviewReport()).toMatchObject({
      draftId: "ingredient-draft-manual-001",
      ingredientText: "",
      mode: "guest",
      selectedProfileId: "",
      source: "manual-entry",
      sourceLabel: "Manual ingredient-text draft",
      state: "ready",
    })
    expect(screen.queryByTestId("camera-screen")).not.toBeInTheDocument()
    expect(screen.queryByTestId("image-source-screen")).not.toBeInTheDocument()
  })

  it("routes Dashboard scanner photo into profiled ingredient review", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()

    await goToDashboardPhotoReview(user)

    const submission = { profileId: "profile-001" }
    expect(logSpy).toHaveBeenCalledWith(
      "Opening ingredient scanner camera route:",
      submission,
    )
    expect(getIngredientReviewReport()).toMatchObject({
      ingredientText: "Aqua, Glycerin, Niacinamide",
      mode: "profiled",
      selectedProfileDisplayName: "Route Tester",
      selectedProfileId: "profile-001",
      source: "camera-photo",
    })
    expect(screen.queryByTestId("analysis-screen")).not.toBeInTheDocument()
  })

  it("routes chosen-photo scanner entry into ingredient review", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()

    await goToWelcomeScannerEntry(user)
    await user.click(screen.getByRole("button", { name: "Scanner entry choose photo" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Opening ingredient scanner picker route:",
      {},
    )
    expect(getIngredientReviewReport()).toMatchObject({
      draftId: "ingredient-draft-picker-001",
      source: "chosen-photo",
    })
  })

  it("returns from ingredient review Back to scanner entry with optional profile restored", async () => {
    const user = renderPage()
    await goToDashboardPhotoReview(user)

    await user.click(screen.getByRole("button", { name: "Ingredient review back" }))

    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
    expect(getScannerEntryReport()).toMatchObject({
      displayName: "Route Tester",
      mode: "profiled",
      profileId: "profile-001",
    })
  })

  it("returns from ingredient review Change method to scanner entry with optional profile restored", async () => {
    const user = renderPage()
    await goToDashboardPhotoReview(user)

    await user.click(screen.getByRole("button", { name: "Ingredient review change method" }))

    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
    expect(getScannerEntryReport()).toMatchObject({
      displayName: "Route Tester",
      mode: "profiled",
      profileId: "profile-001",
    })
  })

  it("keeps ingredient review text controlled by exact raw controller draft updates", async () => {
    const user = renderPage()
    await goToWelcomeManualReview(user)

    await user.click(screen.getByRole("button", { name: "Ingredient review edit text" }))

    expect(screen.getByTestId("ingredient-review-screen")).toBeInTheDocument()
    expect(getIngredientReviewReport()).toMatchObject({
      ingredientText: "  Water,\nNiacinamide, Fragrance  ",
      source: "manual-entry",
    })
  })

  it("returns from ingredient-review profile management Back with draft intact", async () => {
    const user = renderPage()
    await goToDashboardPhotoReview(user)
    const initialReport = getIngredientReviewReport()

    await user.click(screen.getByRole("button", { name: "Ingredient review change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management back" }))

    expect(screen.getByTestId("ingredient-review-screen")).toBeInTheDocument()
    expect(getIngredientReviewReport()).toMatchObject({
      draftId: initialReport.draftId,
      ingredientText: initialReport.ingredientText,
      source: initialReport.source,
    })
  })

  it("returns from ingredient-review profile selection with refreshed selected profile", async () => {
    const user = renderPage()
    await goToDashboardPhotoReview(user)
    const initialReport = getIngredientReviewReport()

    await user.click(screen.getByRole("button", { name: "Ingredient review change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))

    expect(screen.getByTestId("ingredient-review-screen")).toBeInTheDocument()
    expect(getIngredientReviewReport()).toMatchObject({
      draftId: initialReport.draftId,
      ingredientText: initialReport.ingredientText,
      selectedProfileDisplayName: "Maya",
      selectedProfileId: "profile-002",
      source: initialReport.source,
    })
  })

  it("routes guest manual ingredient review Continue to static ingredient results", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToWelcomeManualReview(user)

    await user.click(screen.getByRole("button", { name: "Ingredient review edit text" }))
    await user.click(screen.getByRole("button", { name: "Ingredient review continue" }))

    expect(screen.getByTestId("ingredient-results-screen")).toBeInTheDocument()
    expect(logSpy).toHaveBeenCalledWith(
      "Submitting reviewed ingredient draft for future guidance route:",
      {
        draftId: "ingredient-draft-manual-001",
        ingredientText: "  Water,\nNiacinamide, Fragrance  ",
      },
    )
    expect(getIngredientResultsReport()).toMatchObject({
      countLabel: "3 host-supplied notes",
      draftId: "ingredient-draft-manual-001",
      guidanceItemNames: ["Niacinamide", "Fragrance", "Retinol"],
      mode: "guest",
      resultId: "ingredient-result-manual-001",
      selectedProfileId: "",
      summaryLabel: "Demo host-supplied ingredient notes for the reviewed draft.",
    })
  })

  it("routes profiled camera ingredient review Continue to ingredient results", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardPhotoReview(user)

    await user.click(screen.getByRole("button", { name: "Ingredient review continue" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Submitting reviewed ingredient draft for future guidance route:",
      {
        draftId: "ingredient-draft-camera-001",
        ingredientText: "Aqua, Glycerin, Niacinamide",
        profileId: "profile-001",
      },
    )
    expect(screen.getByTestId("ingredient-results-screen")).toBeInTheDocument()
    expect(getIngredientResultsReport()).toMatchObject({
      mode: "profiled",
      resultId: "ingredient-result-camera-001",
      selectedProfileDisplayName: "Route Tester",
      selectedProfileId: "profile-001",
    })
  })

  it("routes chosen-photo ingredient review Continue to picker result fixtures", async () => {
    const user = renderPage()
    await goToWelcomeScannerEntry(user)

    await user.click(screen.getByRole("button", { name: "Scanner entry choose photo" }))
    await user.click(screen.getByRole("button", { name: "Ingredient review continue" }))

    expect(screen.getByTestId("ingredient-results-screen")).toBeInTheDocument()
    expect(getIngredientResultsReport()).toMatchObject({
      resultId: "ingredient-result-picker-001",
      sourceLabel: "Demo host selected-label review draft",
    })
  })

  it("returns from ingredient results Back to review with draft context intact", async () => {
    const user = renderPage()
    await goToDashboardPhotoReview(user)
    const initialReport = getIngredientReviewReport()

    await user.click(screen.getByRole("button", { name: "Ingredient review continue" }))
    await user.click(screen.getByRole("button", { name: "Ingredient results back to review" }))

    expect(screen.getByTestId("ingredient-review-screen")).toBeInTheDocument()
    expect(getIngredientReviewReport()).toMatchObject({
      draftId: initialReport.draftId,
      ingredientText: initialReport.ingredientText,
      selectedProfileDisplayName: initialReport.selectedProfileDisplayName,
      selectedProfileId: initialReport.selectedProfileId,
      source: initialReport.source,
      sourceLabel: initialReport.sourceLabel,
    })
  })

  it("scans another product from profiled results while preserving managed profile state", async () => {
    const user = renderPage()
    await goToDashboardPhotoResults(user)

    await user.click(screen.getByRole("button", { name: "Ingredient results scan another" }))

    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("ingredient-results-screen")).not.toBeInTheDocument()
    expect(screen.queryByTestId("ingredient-review-screen")).not.toBeInTheDocument()
    expect(getScannerEntryReport()).toMatchObject({
      displayName: "Route Tester",
      mode: "profiled",
      profileId: "profile-001",
    })

    await user.click(screen.getByRole("button", { name: "Scanner entry change profile" }))
    expect(getProfileManagementSummary()).toMatchObject({
      activeProfileId: "profile-001",
      activeDisplayName: "Route Tester",
    })

    await user.click(screen.getByRole("button", { name: "Profile management back" }))
    await user.click(screen.getByRole("button", { name: "Scanner entry manual entry" }))

    expect(getIngredientReviewReport()).toMatchObject({
      draftId: "ingredient-draft-manual-001",
      ingredientText: "",
      selectedProfileId: "profile-001",
      source: "manual-entry",
    })
  })

  it("keeps guest ingredient results Save as a future-adapter log only", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToWelcomeManualResults(user)
    const initialReport = getIngredientResultsReport()

    await user.click(screen.getByRole("button", { name: "Ingredient results save" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Saving ingredient guidance result through future adapter:",
      {
        resultId: "ingredient-result-manual-001",
        draftId: "ingredient-draft-manual-001",
      },
    )
    expect(screen.getByTestId("ingredient-results-screen")).toBeInTheDocument()
    expect(getIngredientResultsReport()).toMatchObject({
      ...initialReport,
      savedLabel: "",
    })
  })

  it("keeps profiled ingredient results Save as a future-adapter log only", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboardPhotoResults(user)

    await user.click(screen.getByRole("button", { name: "Ingredient results save" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Saving ingredient guidance result through future adapter:",
      {
        resultId: "ingredient-result-camera-001",
        draftId: "ingredient-draft-camera-001",
        profileId: "profile-001",
      },
    )
    expect(screen.getByTestId("ingredient-results-screen")).toBeInTheDocument()
    expect(getIngredientResultsReport().savedLabel).toBe("")
  })

  it("keeps ingredient results Retry as a future-adapter log only", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToWelcomeManualResults(user)

    await user.click(screen.getByRole("button", { name: "Ingredient results retry" }))

    expect(logSpy).toHaveBeenCalledWith(
      "Retrying ingredient guidance result load through future adapter.",
    )
    expect(screen.getByTestId("ingredient-results-screen")).toBeInTheDocument()
  })

  it("blocks stale ingredient review Continue without replacing result context", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToWelcomeManualReview(user)

    await user.click(screen.getByRole("button", { name: "Ingredient review edit text" }))
    await user.click(
      screen.getByRole("button", {
        name: "Ingredient review continue with stale draft",
      }),
    )

    expect(logSpy).toHaveBeenCalledWith(
      "Ingredient result route blocked because the reviewed draft context is unavailable.",
    )
    expect(screen.getByTestId("ingredient-review-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("ingredient-results-screen")).not.toBeInTheDocument()
  })

  it("keeps ingredient results guidance static for arbitrary reviewed text", async () => {
    const user = renderPage()
    await goToWelcomeManualReview(user)

    await user.click(
      screen.getByRole("button", {
        name: "Ingredient review edit arbitrary text",
      }),
    )
    expect(getIngredientReviewReport().ingredientText).toBe(
      "  Completely arbitrary label text,\nUnknown entry  ",
    )

    await user.click(screen.getByRole("button", { name: "Ingredient review continue" }))

    expect(getIngredientResultsReport()).toMatchObject({
      countLabel: "3 host-supplied notes",
      guidanceItemNames: ["Niacinamide", "Fragrance", "Retinol"],
      resultId: "ingredient-result-manual-001",
    })
  })

  it("keeps ingredient review Retry as a future-adapter log", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToWelcomeManualReview(user)

    await user.click(screen.getByRole("button", { name: "Ingredient review retry" }))

    expect(logSpy).toHaveBeenCalledWith("Retrying ingredient input review load...")
    expect(screen.getByTestId("ingredient-review-screen")).toBeInTheDocument()
  })

  it("keeps scanner method activation inside adapter boundaries", async () => {
    const originalMediaDevices = Object.getOwnPropertyDescriptor(
      window.navigator,
      "mediaDevices",
    )
    const originalFileReader = Object.getOwnPropertyDescriptor(
      globalThis,
      "FileReader",
    )
    const mediaDevices = {
      getUserMedia: vi.fn(),
    }
    const FileReaderSpy = vi.fn()

    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: mediaDevices,
    })
    Object.defineProperty(globalThis, "FileReader", {
      configurable: true,
      value: FileReaderSpy,
    })

    try {
      const user = renderPage()
      await goToWelcomeScannerEntry(user)
      await user.click(screen.getByRole("button", { name: "Scanner entry take photo" }))

      expect(mediaDevices.getUserMedia).not.toHaveBeenCalled()
      expect(FileReaderSpy).not.toHaveBeenCalled()
      expect(document.querySelector('input[type="file"]')).toBeNull()
      expect(screen.getByTestId("ingredient-review-screen")).toBeInTheDocument()
      expect(screen.queryByTestId("screen-22")).not.toBeInTheDocument()
    } finally {
      if (originalMediaDevices) {
        Object.defineProperty(window.navigator, "mediaDevices", originalMediaDevices)
      } else {
        delete (window.navigator as unknown as { mediaDevices?: unknown }).mediaDevices
      }

      if (originalFileReader) {
        Object.defineProperty(globalThis, "FileReader", originalFileReader)
      } else {
        delete (globalThis as { FileReader?: unknown }).FileReader
      }
    }
  })

  it("keeps ingredient results integration inside adapter boundaries", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const fetchSpy = vi.fn()
    const storageSet = vi.spyOn(Storage.prototype, "setItem")
    const storageGet = vi.spyOn(Storage.prototype, "getItem")
    const indexedDbOpen = vi.fn()
    const originalFetch = globalThis.fetch
    const originalIndexedDb = Object.getOwnPropertyDescriptor(window, "indexedDB")
    const originalMediaDevices = Object.getOwnPropertyDescriptor(
      window.navigator,
      "mediaDevices",
    )
    const originalFileReader = Object.getOwnPropertyDescriptor(
      globalThis,
      "FileReader",
    )
    const mediaDevices = {
      getUserMedia: vi.fn(),
    }
    const FileReaderSpy = vi.fn()

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchSpy,
    })
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: { open: indexedDbOpen },
    })
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: mediaDevices,
    })
    Object.defineProperty(globalThis, "FileReader", {
      configurable: true,
      value: FileReaderSpy,
    })

    try {
      const user = renderPage()
      await goToWelcomeManualResults(user)
      await user.click(screen.getByRole("button", { name: "Ingredient results save" }))
      await user.click(screen.getByRole("button", { name: "Ingredient results retry" }))
      await user.click(screen.getByRole("button", { name: "Ingredient results scan another" }))

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(storageSet).not.toHaveBeenCalled()
      expect(storageGet).not.toHaveBeenCalled()
      expect(indexedDbOpen).not.toHaveBeenCalled()
      expect(mediaDevices.getUserMedia).not.toHaveBeenCalled()
      expect(FileReaderSpy).not.toHaveBeenCalled()
      expect(document.querySelector('input[type="file"]')).toBeNull()
      expect(screen.queryByTestId("screen-23")).not.toBeInTheDocument()
      expect(
        logSpy.mock.calls.some(([message]) => message === "Opening photo picker..."),
      ).toBe(false)
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, "fetch", {
          configurable: true,
          value: originalFetch,
        })
      } else {
        delete (globalThis as { fetch?: unknown }).fetch
      }

      if (originalIndexedDb) {
        Object.defineProperty(window, "indexedDB", originalIndexedDb)
      } else {
        delete (window as unknown as { indexedDB?: unknown }).indexedDB
      }

      if (originalMediaDevices) {
        Object.defineProperty(window.navigator, "mediaDevices", originalMediaDevices)
      } else {
        delete (window.navigator as unknown as { mediaDevices?: unknown }).mediaDevices
      }

      if (originalFileReader) {
        Object.defineProperty(globalThis, "FileReader", originalFileReader)
      } else {
        delete (globalThis as { FileReader?: unknown }).FileReader
      }
    }
  })

  it("keeps scanner Retry as a future-adapter log", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()

    await user.click(screen.getByRole("button", { name: "Open guest ingredient scanner" }))
    await user.click(screen.getByRole("button", { name: "Scanner entry retry" }))

    expect(logSpy).toHaveBeenCalledWith("Retrying ingredient scanner entry load...")
    expect(screen.getByTestId("scanner-entry-screen")).toBeInTheDocument()
  })

  it("returns from add-profile setup Back to profile management", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management add profile" }))
    expect(screen.getByTestId("profile-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Profile back" }))

    expect(screen.getByTestId("profile-management-screen")).toBeInTheDocument()
  })

  it("preserves profile-management source after Add profile Save and image source Back", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    await user.click(screen.getByRole("button", { name: "Profile management add profile" }))
    await user.click(screen.getByRole("button", { name: "Save profile" }))
    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Image source back" }))
    expect(screen.getByTestId("profile-management-screen")).toBeInTheDocument()
  })

  it("returns from dashboard Active routine Back to the dashboard", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard open routine" }))
    expect(screen.getByTestId("routine-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Routine back" }))
    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("returns from dashboard Store Back to the dashboard", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard open store" }))
    expect(screen.getByTestId("store-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Store back" }))
    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()
  })

  it("resets first-time profile save image source Back to profile setup", async () => {
    const user = renderPage()

    await user.click(screen.getByRole("button", { name: "Start analysis" }))
    await user.click(screen.getByRole("button", { name: "Accept consent" }))
    expect(screen.getByTestId("profile-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Save profile" }))
    expect(screen.getByTestId("image-source-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Image source back" }))
    expect(screen.getByTestId("profile-screen")).toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-screen")).not.toBeInTheDocument()
    expect(screen.queryByTestId("profile-management-screen")).not.toBeInTheDocument()
  })

  it("keeps future-adapter profile management actions as logs without route or fixture mutation", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    const initialSummary = getProfileManagementSummary()

    await user.click(screen.getByRole("button", { name: "Profile management edit Maya" }))
    await user.click(screen.getByRole("button", { name: "Profile management open sync" }))
    await user.click(screen.getByRole("button", { name: "Profile management delete Maya" }))
    await user.click(screen.getByRole("button", { name: "Profile management retry" }))

    expect(screen.getByTestId("profile-management-screen")).toBeInTheDocument()
    expect(getProfileManagementSummary()).toMatchObject(initialSummary)
    expect(logSpy).toHaveBeenCalledWith("Editing profile:", "profile-002")
    expect(logSpy).toHaveBeenCalledWith("Opening profile sync settings...")
    expect(logSpy).toHaveBeenCalledWith("Deleting profile:", "profile-002")
    expect(logSpy).toHaveBeenCalledWith("Retrying profile management load...")
  })

  it("returns from results summary routine Back to results summary", async () => {
    const user = renderPage()
    await goToResultsSummary(user)

    await user.click(screen.getByRole("button", { name: "Open routine from results" }))
    expect(screen.getByTestId("routine-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Routine back" }))
    expect(screen.getByTestId("results-screen")).toBeInTheDocument()
  })

  it("returns from full report routine Back to full report", async () => {
    const user = renderPage()
    await goToResultsSummary(user)

    await user.click(screen.getByRole("button", { name: "Open detailed report" }))
    expect(screen.getByTestId("full-report-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Build routine" }))
    expect(screen.getByTestId("routine-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Routine back" }))
    expect(screen.getByTestId("full-report-screen")).toBeInTheDocument()
  })

  it("returns from routine Store Back to routine", async () => {
    const user = renderPage()
    await goToRoutine(user)

    await user.click(screen.getByRole("button", { name: "Open store" }))
    expect(screen.getByTestId("store-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Store back" }))
    expect(screen.getByTestId("routine-screen")).toBeInTheDocument()
  })

  it("passes host-owned dashboard fixture data and enables Orders route", async () => {
    const user = renderPage()
    await goToDashboard(user)

    const props = getJson("dashboard-props")
    expect(props).toMatchObject({
      canOpenGuestScanner: true,
      canOpenOrders: true,
      canOpenProgress: true,
      canOpenRecentOrder: true,
      isGuestScannerAvailableOffline: false,
      showEnvironmentalModule: false,
    })

    expect(screen.getByRole("button", { name: "Open dashboard ingredient scanner" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Dashboard open progress" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Dashboard open orders" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Dashboard open recent order" })).toBeEnabled()

    const report = getJson("dashboard-report")
    expect(report.profile.profileId).toBe("profile-001")
    expect(report.latestSnapshot.reportId).toBe("report-001")
    expect(report.routine.routineId).toBe("routine-001")
    expect(report.recentOrder.orderId).toBe("order-001")
    expect(report.recentOrder.statusLabel).toBe("Host status: preparing order items")

    const renderedOutsideReport = document.body.cloneNode(true) as HTMLElement
    renderedOutsideReport.querySelector('[data-testid="dashboard-report"]')?.remove()
    expect(renderedOutsideReport.textContent).not.toContain("profile-001")
    expect(renderedOutsideReport.textContent).not.toContain("report-001")
    expect(renderedOutsideReport.textContent).not.toContain("routine-001")
    expect(renderedOutsideReport.textContent).not.toContain("order-001")
  })

  it("keeps profile-management opaque IDs inside report inspection and refreshes active designation", async () => {
    const user = renderPage()
    await goToDashboard(user)

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    expect(getProfileManagementSummary()).toMatchObject({
      profileIds: ["profile-001", "profile-002"],
      activeProfileId: "profile-001",
      activeDisplayName: "Route Tester",
    })

    const bodyTextOutsideReport = getBodyTextOutsideProfileManagementReport()
    expect(bodyTextOutsideReport).not.toContain("profile-001")
    expect(bodyTextOutsideReport).not.toContain("profile-002")

    await user.click(screen.getByRole("button", { name: "Profile management select Maya" }))
    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Dashboard change profile" }))
    expect(getProfileManagementSummary()).toMatchObject({
      activeProfileId: "profile-002",
      activeDisplayName: "Maya",
    })
  })

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
    expect(screen.queryByTestId("order-details-screen")).not.toBeInTheDocument()
    expect(screen.queryByTestId("order-history-screen")).not.toBeInTheDocument()
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
