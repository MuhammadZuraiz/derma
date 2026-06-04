"use client"

import { useState, useEffect } from "react"
import WelcomeScreen from "@/components/welcome-screen"
import PrivacyAndFacialDataConsentScreen from "@/components/privacy-consent-screen"
import ProfileSetupScreen from "@/components/profile-setup-screen"
import ImageSourceSelectionScreen from "@/components/image-source-selection-screen"
import CameraCaptureScreen from "@/components/camera-capture-screen"
import SelectedImageReviewScreen from "@/components/selected-image-review-screen"
import AnalysisProcessingScreen, { type AnalysisStage, analysisStageOrder } from "@/components/analysis-processing-screen"
import ResultsSummaryScreen, { type ResultsSummaryReport } from "@/components/results-summary-screen"
import FullReportDetailScreen, { type FullReportDetailReport } from "@/components/full-report-detail-screen"
import RoutineRecommendationsScreen, { type RoutineRecommendationsReport } from "@/components/routine-recommendations-screen"
import DermaLensStoreRoutineCollectionScreen, { type RoutineStoreCollectionReport } from "@/components/dermalens-store-routine-collection-screen"
import CartScreen, { type CartReport } from "@/components/cart-screen"
import ProductDetailScreen, { type ProductDetailReport } from "@/components/product-detail-screen"
import CheckoutContactAndShippingScreen, { type CheckoutContactAndShippingReport, type CheckoutContactAndShippingSubmission } from "@/components/checkout-contact-and-shipping-screen"
import CheckoutReviewScreen, { type CheckoutReviewReport } from "@/components/checkout-review-screen"
import SecurePaymentGatewayHandoffScreen, { type SecurePaymentGatewayHandoffReport } from "@/components/secure-payment-gateway-handoff-screen"
import OrderConfirmationAndPaymentResultScreen, { type OrderPaymentResultReport } from "@/components/order-confirmation-and-payment-result-screen"
import HomeDashboardScreen, { type HomeDashboardReport } from "@/components/home-dashboard-screen"
import ProgressTrackingScreen, {
  type ProgressComparisonMetric,
  type ProgressScanHistoryItem,
  type ProgressTrackingReport,
} from "@/components/progress-tracking-screen"
import ProfileSwitcherAndManagementScreen, { type ManagedProfileSummary, type ProfileSwitcherAndManagementReport } from "@/components/profile-switcher-and-management-screen"
import GuestIngredientScannerEntryScreen, { type GuestIngredientScannerEntryReport } from "@/components/guest-ingredient-scanner-entry-screen"
import IngredientInputReviewScreen, {
  type IngredientInputReviewReport,
  type IngredientInputReviewSubmission,
  type IngredientInputSource,
} from "@/components/ingredient-input-review-screen"
import IngredientScannerResultsScreen, {
  type IngredientScannerGuidanceItem,
  type IngredientScannerResultSaveSubmission,
  type IngredientScannerResultsReport,
} from "@/components/ingredient-scanner-results-screen"

type Screen = "welcome" | "privacy-consent" | "profile-setup" | "image-source" | "camera" | "image-review" | "analysis" | "results-summary" | "full-report" | "routine" | "store" | "cart" | "product-detail" | "checkout-details" | "checkout-review" | "payment-gateway" | "order-confirmation" | "dashboard" | "progress-tracking" | "profile-management" | "ingredient-scanner-entry" | "ingredient-input-review" | "ingredient-scanner-results"
type ProductDetailSourceScreen = "routine" | "store" | "cart"
type ManagedProfileId = "profile-001" | "profile-002"
type DemoProgressScanId =
  | "progress-scan-001"
  | "progress-scan-002"
  | "progress-scan-003"
type IngredientScannerEntryBackScreen = "welcome" | "dashboard"
type ProfileManagementBackScreen = "dashboard" | "image-source" | "image-review" | "ingredient-scanner-entry" | "ingredient-input-review"
type ProfileSetupBackScreen = "privacy-consent" | "dashboard" | "profile-management"
type ImageSourceBackScreen = "profile-setup" | "dashboard" | "profile-management" | "progress-tracking"
type RoutineBackScreen = "full-report" | "results-summary" | "dashboard" | "progress-tracking"
type ResultsSummaryCloseScreen = "dashboard" | "progress-tracking"
type StoreBackScreen = "routine" | "dashboard"

interface DemoIngredientInputDraft {
  draftId: string
  source: IngredientInputSource
  sourceLabel: string
  ingredientText: string
  selectedProfileId: ManagedProfileId | null
  image?: {
    imageUrl?: string
    imageAlt?: string
    sourceLabel?: string
  }
  extractionNoticeLabel?: string
}

interface DemoIngredientScannerResultContext {
  resultId: string
  draftId: string
  sourceLabel: string
  selectedProfileId: ManagedProfileId | null
}

const sampleCountries = [
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "NZ", name: "New Zealand" },
  { code: "SG", name: "Singapore" },
  { code: "US", name: "United States" },
]

const sampleIngredientDraftIds = {
  "camera-photo": "ingredient-draft-camera-001",
  "chosen-photo": "ingredient-draft-picker-001",
  "manual-entry": "ingredient-draft-manual-001",
} satisfies Record<IngredientInputSource, string>

const sampleIngredientSourceLabels = {
  "camera-photo": "Demo host camera-label review draft",
  "chosen-photo": "Demo host selected-label review draft",
  "manual-entry": "Manual ingredient-text draft",
} satisfies Record<IngredientInputSource, string>

const sampleIngredientResultIds = {
  "camera-photo": "ingredient-result-camera-001",
  "chosen-photo": "ingredient-result-picker-001",
  "manual-entry": "ingredient-result-manual-001",
} satisfies Record<IngredientInputSource, string>

const sampleIngredientGuidanceItems: IngredientScannerGuidanceItem[] = [
  {
    itemId: "ingredient-guidance-item-001",
    name: "Niacinamide",
    flagLabel: "Host note: commonly used in skincare",
    summary:
      "This demo note is supplied by the controller fixture. Review the product label and your own routine context.",
    categoryLabel: "Host-supplied note",
    tone: "neutral",
  },
  {
    itemId: "ingredient-guidance-item-002",
    name: "Fragrance",
    flagLabel: "Host note: review if you prefer fragrance-free products",
    summary:
      "This demo note is supplied by the controller fixture. It is not an allergy assessment or medical-safety determination.",
    categoryLabel: "Host-supplied note",
    tone: "attention",
  },
  {
    itemId: "ingredient-guidance-item-003",
    name: "Retinol",
    flagLabel: "Host note: review routine timing",
    summary:
      "This demo note is supplied by the controller fixture. It does not diagnose suitability or provide treatment advice.",
    categoryLabel: "Host-supplied note",
    tone: "caution",
  },
]

const sampleProgressScanIds = {
  first: "progress-scan-001",
  second: "progress-scan-002",
  third: "progress-scan-003",
} satisfies Record<"first" | "second" | "third", DemoProgressScanId>

const sampleProgressMetrics: ProgressComparisonMetric[] = [
  {
    metricId: "progress-metric-001",
    label: "Texture note",
    baselineValueLabel: "Host baseline note",
    comparisonValueLabel: "Host comparison note",
    deltaLabel: "Host-supplied context only",
    supporting:
      "This demo label is supplied by the controller fixture. No trend calculation is performed.",
    tone: "neutral",
  },
  {
    metricId: "progress-metric-002",
    label: "Comfort note",
    baselineValueLabel: "Host baseline comfort label",
    comparisonValueLabel: "Host comparison comfort label",
    supporting: "The host owns interpretation and any future processing.",
    tone: "attention",
  },
]

function resolveDemoProgressScanId(
  scanId: string,
): DemoProgressScanId | null {
  if (
    scanId === sampleProgressScanIds.first ||
    scanId === sampleProgressScanIds.second ||
    scanId === sampleProgressScanIds.third
  ) {
    return scanId
  }

  return null
}

// Sample image for demo purposes
const SAMPLE_IMAGE_URL = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=800&fit=crop&crop=face"

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome")
  const [profileName, setProfileName] = useState("Alex")
  const [activeManagedProfileId, setActiveManagedProfileId] =
    useState<ManagedProfileId>("profile-001")
  const [managedProfileDisplayNames, setManagedProfileDisplayNames] = useState<
    Record<ManagedProfileId, string>
  >({
    "profile-001": "Alex",
    "profile-002": "Maya",
  })
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)
  const [imageSource, setImageSource] = useState<"camera" | "upload">("camera")
  const [selectedCheckoutShippingOptionId, setSelectedCheckoutShippingOptionId] = useState("shipopt-001")
  const [checkoutDetailsSubmission, setCheckoutDetailsSubmission] = useState<CheckoutContactAndShippingSubmission | null>(null)
  const [profileSetupBackScreen, setProfileSetupBackScreen] =
    useState<ProfileSetupBackScreen>("privacy-consent")
  const [imageSourceBackScreen, setImageSourceBackScreen] =
    useState<ImageSourceBackScreen>("profile-setup")
  const [resultsSummaryCloseScreen, setResultsSummaryCloseScreen] =
    useState<ResultsSummaryCloseScreen>("dashboard")
  const [profileManagementBackScreen, setProfileManagementBackScreen] =
    useState<ProfileManagementBackScreen>("dashboard")
  const [ingredientScannerEntryBackScreen, setIngredientScannerEntryBackScreen] =
    useState<IngredientScannerEntryBackScreen>("welcome")
  const [ingredientScannerSelectedProfileId, setIngredientScannerSelectedProfileId] =
    useState<ManagedProfileId | null>(null)
  const [ingredientInputDraft, setIngredientInputDraft] =
    useState<DemoIngredientInputDraft | null>(null)
  const [ingredientScannerResultContext, setIngredientScannerResultContext] =
    useState<DemoIngredientScannerResultContext | null>(null)
  const [progressBaselineScanId, setProgressBaselineScanId] =
    useState<DemoProgressScanId>(sampleProgressScanIds.first)
  const [progressComparisonScanId, setProgressComparisonScanId] =
    useState<DemoProgressScanId>(sampleProgressScanIds.second)
  const [routineBackScreen, setRoutineBackScreen] =
    useState<RoutineBackScreen>("full-report")
  const [storeBackScreen, setStoreBackScreen] =
    useState<StoreBackScreen>("routine")
  const [productDetailContext, setProductDetailContext] = useState<{
    productId: string
    sourceScreen: ProductDetailSourceScreen
  } | null>(null)

  function openProductDetail(
    productId: string,
    sourceScreen: ProductDetailSourceScreen,
  ) {
    setProductDetailContext({
      productId,
      sourceScreen,
    })
    setCurrentScreen("product-detail")
  }

  function openIngredientInputReview(
    source: IngredientInputSource,
    submission: {
      profileId?: string
    },
  ) {
    setIngredientScannerResultContext(null)

    const selectedProfileId =
      submission.profileId === "profile-001" ||
      submission.profileId === "profile-002"
        ? submission.profileId
        : null

    setIngredientInputDraft({
      draftId: sampleIngredientDraftIds[source],
      source,
      sourceLabel: sampleIngredientSourceLabels[source],
      ingredientText:
        source === "manual-entry"
          ? ""
          : "Aqua, Glycerin, Niacinamide",
      selectedProfileId,
      extractionNoticeLabel:
        source === "manual-entry"
          ? "Enter the ingredient text manually before continuing."
          : "Demo host-supplied review text only. No image-text or extraction adapter is connected.",
    })

    setCurrentScreen("ingredient-input-review")
  }

  function openIngredientScannerResults(
    submission: IngredientInputReviewSubmission,
  ) {
    const currentDraft = ingredientInputDraft

    if (
      currentDraft === null ||
      submission.draftId !== currentDraft.draftId ||
      submission.ingredientText !== currentDraft.ingredientText ||
      submission.ingredientText.trim().length === 0
    ) {
      console.log(
        "Ingredient result route blocked because the reviewed draft context is unavailable.",
      )
      return
    }

    const selectedProfileId =
      submission.profileId === "profile-001" ||
      submission.profileId === "profile-002"
        ? submission.profileId
        : null

    setIngredientScannerResultContext({
      resultId: sampleIngredientResultIds[currentDraft.source],
      draftId: currentDraft.draftId,
      sourceLabel: currentDraft.sourceLabel,
      selectedProfileId,
    })

    setCurrentScreen("ingredient-scanner-results")
  }

  function returnToIngredientScannerEntry() {
    setIngredientScannerSelectedProfileId(
      ingredientInputDraft?.selectedProfileId ?? null,
    )
    setCurrentScreen("ingredient-scanner-entry")
  }
  
  // Analysis state
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [activeStage, setActiveStage] = useState<AnalysisStage>("preparing-photo")
  const [completedStages, setCompletedStages] = useState<AnalysisStage[]>([])

  // Sample report data for results summary
  const sampleReport: ResultsSummaryReport = {
    reportId: "report-001",
    profileName: profileName,
    generatedAtLabel: new Date().toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }),
    score: 72,
    categoryLabel: "Good overall skin health",
    comparison: {
      kind: "first-scan",
      label: "First scan baseline",
    },
    priorityHighlights: [
      {
        id: "highlight-1",
        title: "Mild dryness",
        levelLabel: "Low priority",
        description: "Some areas around the cheeks show signs of dryness. Consider adding a hydrating serum to your routine.",
        tone: "neutral",
      },
      {
        id: "highlight-2",
        title: "Sun exposure",
        levelLabel: "Moderate",
        description: "Minor signs of sun exposure detected. Consistent SPF use is recommended.",
        tone: "attention",
      },
      {
        id: "highlight-3",
        title: "Fine lines",
        levelLabel: "Minimal",
        description: "Very early signs of expression lines. Preventative care can help maintain skin elasticity.",
        tone: "neutral",
      },
    ],
    positiveSignals: [
      {
        id: "signal-1",
        title: "Even skin tone",
        description: "Your skin tone appears balanced and uniform across most areas.",
      },
      {
        id: "signal-2",
        title: "Good hydration baseline",
        description: "Overall moisture levels are within a healthy range.",
      },
      {
        id: "signal-3",
        title: "Clear pores",
        description: "Minimal congestion detected in the T-zone area.",
      },
    ],
    saveLabel: "Saved locally on this device",
  }

  // Sample detailed report data for full report screen
  const sampleDetailedReport: FullReportDetailReport = {
    reportId: "report-001",
    profileName: profileName,
    generatedAtLabel: new Date().toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }),
    saveLabel: "Saved locally on this device",
    score: 72,
    categoryLabel: "Good overall skin health",
    classificationSummary: {
      skinType: {
        label: "Combination",
        supporting: "Oily T-zone with normal to dry cheeks",
        confidenceLabel: "High confidence",
      },
      skinTone: {
        label: "Fitzpatrick Type III",
        supporting: "Medium skin tone that tans gradually",
        confidenceLabel: "Moderate confidence",
      },
    },
    faceMap: {
      alt: "Annotated face map showing analyzed regions",
      legend: [
        { id: "legend-1", label: "Priority area", tone: "peach" },
        { id: "legend-2", label: "Moderate concern", tone: "sand" },
        { id: "legend-3", label: "Natural feature", tone: "stone" },
      ],
    },
    regions: [
      {
        id: "region-forehead",
        label: "Forehead",
        summary: "Minor shine detected in the T-zone area",
        findings: [
          {
            id: "finding-1",
            title: "Excess oil",
            levelLabel: "Mild",
            description: "Light oil buildup detected, typical for combination skin types.",
            stateLabel: "Active",
            tone: "neutral",
          },
        ],
      },
      {
        id: "region-cheeks",
        label: "Cheeks",
        summary: "Some dryness visible, especially on outer areas",
        findings: [
          {
            id: "finding-2",
            title: "Mild dryness",
            levelLabel: "Low priority",
            description: "Outer cheek areas show signs of dehydration. A hydrating serum could help.",
            stateLabel: "Persistent",
            tone: "neutral",
          },
          {
            id: "finding-3",
            title: "Sun exposure signs",
            levelLabel: "Moderate",
            description: "Minor pigmentation variation suggesting sun exposure history.",
            stateLabel: "Stable",
            tone: "attention",
          },
        ],
      },
      {
        id: "region-undereye",
        label: "Under-eye area",
        summary: "Fine lines beginning to appear",
        findings: [
          {
            id: "finding-4",
            title: "Fine lines",
            levelLabel: "Minimal",
            description: "Very early expression lines. Preventative care recommended.",
            stateLabel: "Early stage",
            tone: "neutral",
          },
        ],
      },
      {
        id: "region-nose",
        label: "Nose",
        summary: "Clear pores with minimal congestion",
        findings: [],
      },
    ],
    naturalFeatures: [
      {
        id: "natural-1",
        title: "Beauty mark",
        description: "Small natural mark on the left cheek area",
        regionLabel: "Cheeks",
      },
      {
        id: "natural-2",
        title: "Expression lines",
        description: "Natural smile lines around the mouth area",
        regionLabel: "Around mouth",
      },
    ],
    estimatedMetrics: [
      {
        id: "metric-1",
        label: "Hydration level",
        value: "68%",
        supporting: "Within healthy range",
      },
      {
        id: "metric-2",
        label: "Oil balance",
        value: "Combination",
        supporting: "T-zone oily, cheeks normal",
      },
      {
        id: "metric-3",
        label: "Pore visibility",
        value: "Low",
        supporting: "Minimal visible pores",
      },
    ],
    photoQuality: {
      outcomeLabel: "Good quality",
      supporting: "Photo quality is suitable for accurate analysis",
      items: [
        {
          id: "quality-1",
          label: "Lighting",
          valueLabel: "Good",
          supporting: "Even lighting across the face",
        },
        {
          id: "quality-2",
          label: "Focus",
          valueLabel: "Sharp",
          supporting: "Image is well-focused",
        },
        {
          id: "quality-3",
          label: "Angle",
          valueLabel: "Frontal",
          supporting: "Face is positioned correctly",
        },
      ],
    },
  }

  // Sample routine recommendations data
  const sampleRoutineReport: RoutineRecommendationsReport = {
    routineId: "routine-001",
    profileName: profileName,
    generatedAtLabel: new Date().toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }),
    saveLabel: "Saved locally on this device",
    morning: {
      title: "Morning routine",
      summary: "Start your day with gentle cleansing and sun protection to maintain healthy skin throughout the day.",
      completionTimeLabel: "Approx. 5-7 minutes",
      steps: [
        {
          id: "morning-step-1",
          orderLabel: "1",
          title: "Gentle cleanser",
          categoryLabel: "Cleansing",
          purpose: "Remove overnight buildup without stripping natural oils from your combination skin.",
          usage: "Apply a small amount to damp skin, massage gently for 30 seconds, then rinse with lukewarm water.",
          frequencyLabel: "Daily",
          rationale: "A gentle cleanser helps maintain your skin's natural barrier while effectively removing impurities that accumulate overnight.",
          recommendedProducts: [
            {
              productId: "prod-001",
              name: "Gentle Foaming Cleanser",
              brand: "DermaLens Essentials",
              priceLabel: "$18.00",
              availabilityLabel: "In stock",
              description: "pH-balanced formula suitable for combination skin",
              isAvailable: true,
            },
          ],
        },
        {
          id: "morning-step-2",
          orderLabel: "2",
          title: "Hydrating toner",
          categoryLabel: "Toning",
          purpose: "Balance pH levels and prepare skin to better absorb subsequent products.",
          usage: "Apply to a cotton pad or directly to palms and pat gently onto face and neck.",
          frequencyLabel: "Daily",
          recommendedProducts: [
            {
              productId: "prod-002",
              name: "Balancing Hydra Toner",
              brand: "DermaLens Essentials",
              priceLabel: "$22.00",
              availabilityLabel: "In stock",
              description: "Alcohol-free formula with hyaluronic acid",
              isAvailable: true,
            },
          ],
        },
        {
          id: "morning-step-3",
          orderLabel: "3",
          title: "Lightweight moisturiser",
          categoryLabel: "Moisturising",
          purpose: "Provide hydration to dry areas while not overwhelming oilier zones.",
          usage: "Apply a pea-sized amount to face and neck, focusing on drier areas like cheeks.",
          frequencyLabel: "Daily",
          recommendedProducts: [
            {
              productId: "prod-003",
              name: "Daily Balance Moisturiser",
              brand: "DermaLens Essentials",
              priceLabel: "$28.00",
              availabilityLabel: "In stock",
              description: "Oil-free gel-cream for combination skin",
              isAvailable: true,
            },
          ],
        },
        {
          id: "morning-step-4",
          orderLabel: "4",
          title: "Sunscreen SPF 30+",
          categoryLabel: "Sun Protection",
          purpose: "Protect against UV damage which can worsen pigmentation and accelerate signs of ageing.",
          usage: "Apply generously as the final step, 15 minutes before sun exposure. Reapply every 2 hours when outdoors.",
          frequencyLabel: "Daily",
          caution: "Essential for preventing further sun damage. Do not skip this step.",
          rationale: "Your analysis detected minor signs of sun exposure. Consistent SPF use is the most effective way to prevent further damage.",
          recommendedProducts: [
            {
              productId: "prod-004",
              name: "Invisible Shield SPF 50",
              brand: "DermaLens Essentials",
              priceLabel: "$32.00",
              availabilityLabel: "In stock",
              description: "Lightweight, non-greasy formula that works well under makeup",
              isAvailable: true,
            },
          ],
        },
      ],
    },
    evening: {
      title: "Evening routine",
      summary: "Wind down with deeper cleansing and targeted treatments to support overnight skin repair.",
      completionTimeLabel: "Approx. 7-10 minutes",
      steps: [
        {
          id: "evening-step-1",
          orderLabel: "1",
          title: "Oil cleanser",
          categoryLabel: "First Cleanse",
          purpose: "Dissolve sunscreen, makeup, and excess oil accumulated throughout the day.",
          usage: "Apply to dry skin, massage for 60 seconds, then emulsify with water and rinse.",
          frequencyLabel: "Daily",
          rationale: "Double cleansing helps ensure thorough removal of SPF and daily buildup without over-stripping the skin.",
          recommendedProducts: [
            {
              productId: "prod-005",
              name: "Nourishing Cleansing Oil",
              brand: "DermaLens Essentials",
              priceLabel: "$26.00",
              availabilityLabel: "In stock",
              description: "Gentle oil that emulsifies to a milky texture",
              isAvailable: true,
            },
          ],
        },
        {
          id: "evening-step-2",
          orderLabel: "2",
          title: "Gentle cleanser",
          categoryLabel: "Second Cleanse",
          purpose: "Complete the cleansing process by removing any remaining residue.",
          usage: "Apply to damp skin, massage gently, then rinse thoroughly.",
          frequencyLabel: "Daily",
          recommendedProducts: [
            {
              productId: "prod-001",
              name: "Gentle Foaming Cleanser",
              brand: "DermaLens Essentials",
              priceLabel: "$18.00",
              availabilityLabel: "In stock",
              description: "pH-balanced formula suitable for combination skin",
              isAvailable: true,
            },
          ],
        },
        {
          id: "evening-step-3",
          orderLabel: "3",
          title: "Hydrating serum",
          categoryLabel: "Treatment",
          purpose: "Address the mild dryness detected on your cheeks with concentrated hydration.",
          usage: "Apply 2-3 drops to slightly damp skin and press gently to absorb.",
          frequencyLabel: "Daily",
          rationale: "Your analysis showed signs of dryness around the cheeks. A hydrating serum can help restore moisture levels.",
          recommendedProducts: [
            {
              productId: "prod-006",
              name: "Hyaluronic Boost Serum",
              brand: "DermaLens Essentials",
              priceLabel: "$35.00",
              availabilityLabel: "In stock",
              description: "Multi-weight hyaluronic acid for deep hydration",
              isAvailable: true,
            },
          ],
        },
        {
          id: "evening-step-4",
          orderLabel: "4",
          title: "Night moisturiser",
          categoryLabel: "Moisturising",
          purpose: "Seal in hydration and support skin barrier repair overnight.",
          usage: "Apply a generous amount to face and neck as the final step.",
          frequencyLabel: "Daily",
          recommendedProducts: [
            {
              productId: "prod-007",
              name: "Overnight Repair Cream",
              brand: "DermaLens Essentials",
              priceLabel: "$38.00",
              availabilityLabel: "In stock",
              description: "Rich but non-comedogenic formula for overnight recovery",
              isAvailable: true,
            },
          ],
        },
      ],
    },
    weeklyGuidance: [
      {
        id: "weekly-1",
        title: "Gentle exfoliation",
        frequencyLabel: "1-2 times per week",
        description: "Use a gentle chemical exfoliant to remove dead skin cells and improve texture. Avoid physical scrubs which can irritate combination skin.",
        caution: "Do not use on the same day as retinol. Start with once weekly and increase as tolerated.",
      },
      {
        id: "weekly-2",
        title: "Hydrating mask",
        frequencyLabel: "1-2 times per week",
        description: "Apply a hydrating sheet mask or cream mask to boost moisture levels, especially helpful for the drier areas of your face.",
      },
    ],
  }

  const sampleManagedProfiles: Array<
    ManagedProfileSummary & { profileId: ManagedProfileId }
  > = [
    {
      profileId: "profile-001",
      displayName: managedProfileDisplayNames["profile-001"],
      isActive: activeManagedProfileId === "profile-001",
      syncState: "local-only",
      syncLabel: "Saved locally on this device",
      supporting: "Primary local skincare profile",
      latestSnapshotLabel: sampleReport.generatedAtLabel,
      canSelect: true,
      canEdit: true,
      canDelete: false,
      deleteBlockLabel: "Keep one active profile",
    },
    {
      profileId: "profile-002",
      displayName: managedProfileDisplayNames["profile-002"],
      isActive: activeManagedProfileId === "profile-002",
      syncState: "local-only",
      syncLabel: "Saved locally on this device",
      supporting: "Second local skincare profile",
      latestSnapshotLabel: "No snapshot saved yet",
      canSelect: true,
      canEdit: true,
      canDelete: true,
    },
  ]

  const sampleProfileManagementReport: ProfileSwitcherAndManagementReport = {
    profiles: sampleManagedProfiles,
    helperLabel: "Profiles stay local on this device unless you choose to sync them.",
    profileLimitLabel: "Demo host limit: 2 of 5 profiles used.",
    syncHelperLabel: "Optional sync settings route is not connected in this demo.",
  }

  const scannerProfileMatches = ingredientScannerSelectedProfileId
    ? sampleManagedProfiles.filter(
        (profile) => profile.profileId === ingredientScannerSelectedProfileId,
      )
    : []

  const scannerSelectedProfile =
    scannerProfileMatches.length === 1 ? scannerProfileMatches[0] : null

  const sampleIngredientScannerEntryReport: GuestIngredientScannerEntryReport = {
    selectedProfile: scannerSelectedProfile
      ? {
          profileId: scannerSelectedProfile.profileId,
          displayName: scannerSelectedProfile.displayName,
          contextLabel: "Optional local profile context supplied by the demo host.",
        }
      : undefined,
    helperLabel: "Choose how to provide the ingredient list. The next review step remains host-owned.",
    privacyLabel: "You will review the ingredient text before guidance is prepared.",
    photoTips: [
      "Keep the ingredient list fully visible.",
      "Use even lighting and avoid glare.",
    ],
  }

  const ingredientInputProfileMatches = ingredientInputDraft?.selectedProfileId
    ? sampleManagedProfiles.filter(
        (profile) => profile.profileId === ingredientInputDraft.selectedProfileId,
      )
    : []

  const ingredientInputSelectedProfile =
    ingredientInputProfileMatches.length === 1
      ? ingredientInputProfileMatches[0]
      : null

  const sampleIngredientInputReviewReport: IngredientInputReviewReport | null =
    ingredientInputDraft
      ? {
          draftId: ingredientInputDraft.draftId,
          source: ingredientInputDraft.source,
          sourceLabel: ingredientInputDraft.sourceLabel,
          ingredientText: ingredientInputDraft.ingredientText,
          selectedProfile: ingredientInputSelectedProfile
            ? {
                profileId: ingredientInputSelectedProfile.profileId,
                displayName: ingredientInputSelectedProfile.displayName,
                contextLabel:
                  "Optional local profile context supplied by the demo host.",
              }
            : undefined,
          image: ingredientInputDraft.image,
          helperLabel:
            "Review and correct the host-controlled draft before continuing.",
          privacyLabel:
            "Guidance is not prepared until you explicitly continue.",
          extractionNoticeLabel: ingredientInputDraft.extractionNoticeLabel,
        }
      : null

  const ingredientResultProfileMatches =
    ingredientScannerResultContext?.selectedProfileId
      ? sampleManagedProfiles.filter(
          (profile) =>
            profile.profileId ===
            ingredientScannerResultContext.selectedProfileId,
        )
      : []

  const ingredientResultSelectedProfile =
    ingredientResultProfileMatches.length === 1
      ? ingredientResultProfileMatches[0]
      : null

  const sampleIngredientScannerResultsReport:
    IngredientScannerResultsReport | null =
    ingredientScannerResultContext
      ? {
          resultId: ingredientScannerResultContext.resultId,
          draftId: ingredientScannerResultContext.draftId,
          sourceLabel: ingredientScannerResultContext.sourceLabel,
          summaryLabel:
            "Demo host-supplied ingredient notes for the reviewed draft.",
          ingredientCountLabel: "3 host-supplied notes",
          guidanceItems: sampleIngredientGuidanceItems,
          selectedProfile: ingredientResultSelectedProfile
            ? {
                profileId: ingredientResultSelectedProfile.profileId,
                displayName: ingredientResultSelectedProfile.displayName,
                contextLabel:
                  "Optional local profile context supplied by the demo host.",
              }
            : undefined,
          helperLabel:
            "This demo displays static host-shaped notes only. No persistence adapter is connected.",
          disclaimerLabel:
            "Use these notes as skincare guidance. They are not a medical assessment or allergy test.",
        }
      : null

  const activeManagedProfile =
    sampleManagedProfiles.find(
      (profile) => profile.profileId === activeManagedProfileId,
    ) ?? null

  const activeManagedProfileDisplayName =
    activeManagedProfile?.displayName ?? profileName

  const sampleProgressScans: ProgressScanHistoryItem[] = [
    {
      scanId: sampleProgressScanIds.first,
      capturedAtLabel: "June 2, 2026",
      titleLabel: "June snapshot",
      categoryLabel: "Host-supplied snapshot",
      summaryLabel: "Readable demo history supplied by the controller fixture.",
      imageUrl: SAMPLE_IMAGE_URL,
      imageAlt: `${activeManagedProfileDisplayName} June skincare snapshot`,
      photoQualityLabel: "Host photo-quality label: clear preview",
      isBaselineSelected: progressBaselineScanId === sampleProgressScanIds.first,
      isComparisonSelected:
        progressComparisonScanId === sampleProgressScanIds.first,
      canSelectAsBaseline: true,
      canSelectAsComparison: true,
      canOpenReport: true,
    },
    {
      scanId: sampleProgressScanIds.second,
      capturedAtLabel: "July 2, 2026",
      titleLabel: "July snapshot",
      categoryLabel: "Host-supplied snapshot",
      summaryLabel: "Readable demo history supplied by the controller fixture.",
      imageUrl: SAMPLE_IMAGE_URL,
      imageAlt: `${activeManagedProfileDisplayName} July skincare snapshot`,
      photoQualityLabel: "Host photo-quality label: readable preview",
      isBaselineSelected:
        progressBaselineScanId === sampleProgressScanIds.second,
      isComparisonSelected:
        progressComparisonScanId === sampleProgressScanIds.second,
      canSelectAsBaseline: true,
      canSelectAsComparison: true,
      canOpenReport: true,
    },
    {
      scanId: sampleProgressScanIds.third,
      capturedAtLabel: "August 2, 2026",
      titleLabel: "August snapshot",
      categoryLabel: "Host-supplied snapshot",
      summaryLabel: "Readable demo history supplied by the controller fixture.",
      imageUrl: undefined,
      imageAlt: `${activeManagedProfileDisplayName} August skincare snapshot`,
      photoQualityLabel: "Host photo-quality label: preview unavailable",
      isBaselineSelected: progressBaselineScanId === sampleProgressScanIds.third,
      isComparisonSelected:
        progressComparisonScanId === sampleProgressScanIds.third,
      canSelectAsBaseline: true,
      canSelectAsComparison: true,
      canOpenReport: true,
    },
  ]

  const sampleProgressTrackingReport: ProgressTrackingReport = {
    profile: {
      profileId: activeManagedProfileId,
      displayName: activeManagedProfileDisplayName,
      contextLabel: "Active local profile supplied by the demo host.",
    },
    scans: sampleProgressScans,
    comparison: {
      baselineScanId: progressBaselineScanId,
      comparisonScanId: progressComparisonScanId,
      headingLabel:
        "Host-supplied comparison for explicitly selected snapshots",
      summaryLabel:
        "The demo host supplies these notes after the customer explicitly chooses two snapshots.",
      helperLabel:
        "No automatic progress detection or trend calculation is performed.",
      metrics: sampleProgressMetrics,
    },
    routinePrompt: {
      routineId: sampleRoutineReport.routineId,
      titleLabel: "Review your current routine",
      supportingLabel:
        "Routine context is supplied by the demo host. No adherence calculation is performed.",
      actionLabel: "Open routine",
    },
    helperLabel:
      "Select a baseline and comparison snapshot explicitly when you want the host to refresh comparison notes.",
    privacyLabel:
      "The demo keeps progress context in memory only. Persistence and storage policy remain host-owned.",
  }

  // Demo-only host/controller fixture for returning-user dashboard routing.
  const sampleDashboardReport: HomeDashboardReport = {
    profile: {
      profileId: activeManagedProfileId,
      displayName: activeManagedProfileDisplayName,
      syncState: "local-only",
      syncLabel: "Saved locally on this device",
    },
    greetingLabel: "Good to see you again",
    latestSnapshot: {
      reportId: sampleReport.reportId,
      capturedAtLabel: sampleReport.generatedAtLabel,
      categoryLabel: sampleReport.categoryLabel,
      comparisonLabel: sampleReport.comparison.label,
      imageUrl: capturedImageUrl ?? SAMPLE_IMAGE_URL,
      imageAlt: `${activeManagedProfileDisplayName} skincare snapshot`,
      scoreLabel: `${sampleReport.score} / 100`,
      saveLabel: sampleReport.saveLabel,
    },
    routine: {
      routineId: sampleRoutineReport.routineId,
      title: "Your personalised routine",
      supporting:
        "A simple morning and evening plan based on your latest snapshot.",
      updatedAtLabel: sampleRoutineReport.generatedAtLabel,
      morningSummaryLabel: `${sampleRoutineReport.morning.steps.length} steps`,
      eveningSummaryLabel: `${sampleRoutineReport.evening.steps.length} steps`,
    },
    recentOrder: {
      orderId: "order-001",
      orderReferenceLabel: "DL-2024-001234",
      statusLabel: "Order details route not connected yet",
      supporting: "Your first-party DermaLens order summary remains readable.",
    },
    environment: {
      uvLabel: "UV details supplied when the host feature flag is enabled",
      aqiLabel: "AQI details supplied when the host feature flag is enabled",
    },
  }

  // Sample store collection data
  const sampleStoreReport: RoutineStoreCollectionReport = {
    collectionId: "collection-001",
    profileName: profileName,
    generatedAtLabel: new Date().toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }),
    saveLabel: "Saved locally on this device",
    summary: "Products matched to your personalised morning and evening skincare routine.",
    products: [
      {
        itemId: "item-001",
        productId: "prod-001",
        brand: "DermaLens Essentials",
        name: "Gentle Foaming Cleanser",
        categoryLabel: "Cleansing",
        description: "pH-balanced formula suitable for combination skin",
        priceLabel: "$18.00",
        availabilityLabel: "In stock",
        isAvailable: true,
        purchaseMode: "direct-add",
        periods: ["morning", "evening"],
        matchedStepLabels: ["Step 1: Gentle cleanser", "Step 2: Second cleanse"],
        cartQuantity: 1,
        canIncreaseQuantity: true,
        canDecreaseQuantity: true,
      },
      {
        itemId: "item-002",
        productId: "prod-002",
        brand: "DermaLens Essentials",
        name: "Balancing Hydra Toner",
        categoryLabel: "Toning",
        description: "Alcohol-free formula with hyaluronic acid",
        priceLabel: "$22.00",
        availabilityLabel: "In stock",
        isAvailable: true,
        purchaseMode: "direct-add",
        periods: ["morning"],
        matchedStepLabels: ["Step 2: Hydrating toner"],
        cartQuantity: 0,
        canIncreaseQuantity: true,
        canDecreaseQuantity: false,
      },
      {
        itemId: "item-003",
        productId: "prod-003",
        brand: "DermaLens Essentials",
        name: "Daily Balance Moisturiser",
        categoryLabel: "Moisturising",
        description: "Oil-free gel-cream for combination skin",
        priceLabel: "$28.00",
        availabilityLabel: "In stock",
        isAvailable: true,
        purchaseMode: "direct-add",
        periods: ["morning"],
        matchedStepLabels: ["Step 3: Lightweight moisturiser"],
        cartQuantity: 0,
        canIncreaseQuantity: true,
        canDecreaseQuantity: false,
      },
      {
        itemId: "item-004",
        productId: "prod-004",
        brand: "DermaLens Essentials",
        name: "Invisible Shield SPF 50",
        categoryLabel: "Sun Protection",
        description: "Lightweight, non-greasy formula that works well under makeup",
        priceLabel: "$32.00",
        availabilityLabel: "In stock",
        isAvailable: true,
        purchaseMode: "direct-add",
        periods: ["morning"],
        matchedStepLabels: ["Step 4: Sunscreen SPF 30+"],
        cartQuantity: 1,
        canIncreaseQuantity: true,
        canDecreaseQuantity: true,
      },
      {
        itemId: "item-005",
        productId: "prod-005",
        brand: "DermaLens Essentials",
        name: "Nourishing Cleansing Oil",
        categoryLabel: "First Cleanse",
        description: "Gentle oil that emulsifies to a milky texture",
        priceLabel: "$26.00",
        availabilityLabel: "In stock",
        isAvailable: true,
        purchaseMode: "direct-add",
        periods: ["evening"],
        matchedStepLabels: ["Step 1: Oil cleanser"],
        cartQuantity: 0,
        canIncreaseQuantity: true,
        canDecreaseQuantity: false,
      },
      {
        itemId: "item-006",
        productId: "prod-006",
        brand: "DermaLens Essentials",
        name: "Hyaluronic Boost Serum",
        categoryLabel: "Treatment",
        description: "Multi-weight hyaluronic acid for deep hydration",
        priceLabel: "$35.00",
        availabilityLabel: "In stock",
        isAvailable: true,
        purchaseMode: "direct-add",
        periods: ["evening"],
        matchedStepLabels: ["Step 3: Hydrating serum"],
        cartQuantity: 1,
        canIncreaseQuantity: true,
        canDecreaseQuantity: true,
      },
      {
        itemId: "item-007",
        productId: "prod-007",
        brand: "DermaLens Essentials",
        name: "Overnight Repair Cream",
        categoryLabel: "Moisturising",
        description: "Rich but non-comedogenic formula for overnight recovery",
        priceLabel: "$38.00",
        availabilityLabel: "In stock",
        isAvailable: true,
        purchaseMode: "direct-add",
        periods: ["evening"],
        matchedStepLabels: ["Step 4: Night moisturiser"],
        cartQuantity: 0,
        canIncreaseQuantity: true,
        canDecreaseQuantity: false,
      },
    ],
    cartSummary: {
      itemCount: 3,
      subtotalLabel: "$85.00",
    },
  }

  // Sample cart data
  const sampleCartReport: CartReport = {
    cartId: "cart-001",
    profileName: profileName,
    sourceLabel: "From your personalised routine",
    items: [
      {
        cartItemId: "cart-item-001",
        productId: "prod-001",
        brand: "DermaLens Essentials",
        name: "Gentle Foaming Cleanser",
        categoryLabel: "Cleansing",
        optionLabels: ["200ml"],
        unitPriceLabel: "$18.00",
        lineTotalLabel: "$18.00",
        availabilityState: "available",
        availabilityLabel: "In stock",
        quantity: 1,
        canIncreaseQuantity: true,
        canDecreaseQuantity: true,
        canRemove: true,
      },
      {
        cartItemId: "cart-item-002",
        productId: "prod-004",
        brand: "DermaLens Essentials",
        name: "Invisible Shield SPF 50",
        categoryLabel: "Sun Protection",
        optionLabels: ["50ml"],
        unitPriceLabel: "$32.00",
        lineTotalLabel: "$32.00",
        availabilityState: "available",
        availabilityLabel: "In stock",
        quantity: 1,
        canIncreaseQuantity: true,
        canDecreaseQuantity: true,
        canRemove: true,
      },
      {
        cartItemId: "cart-item-003",
        productId: "prod-006",
        brand: "DermaLens Essentials",
        name: "Hyaluronic Boost Serum",
        categoryLabel: "Treatment",
        optionLabels: ["30ml"],
        unitPriceLabel: "$35.00",
        lineTotalLabel: "$35.00",
        availabilityState: "available",
        availabilityLabel: "In stock",
        quantity: 1,
        canIncreaseQuantity: true,
        canDecreaseQuantity: true,
        canRemove: true,
      },
    ],
    summary: {
      itemCount: 3,
      subtotalLabel: "$85.00",
      shippingLabel: "Free",
      taxLabel: "$8.50",
      totalLabel: "$93.50",
    },
  }

  const sampleProductDetailReports: Record<string, ProductDetailReport> = {
    "prod-001": {
      productId: "prod-001",
      brand: "DermaLens Essentials",
      name: "Gentle Foaming Cleanser",
      categoryLabel: "Cleansing",
      description: "pH-balanced formula suitable for combination skin",
      priceLabel: "$18.00",
      availabilityState: "available",
      availabilityLabel: "In stock",
      firstPartyLabel: "Sold directly by DermaLens.",
      images: [],
      routineFit: "Supports both the morning cleanse and evening second cleanse without a stripped feeling.",
      matchedStepLabels: ["Step 1: Gentle cleanser", "Step 2: Second cleanse"],
      timingLabels: ["Morning", "Evening"],
      variantGroups: [
        {
          id: "size",
          label: "Size",
          required: true,
          selectedOptionId: "200ml",
          options: [
            {
              id: "200ml",
              label: "200ml",
              supporting: "Current routine size",
              availabilityLabel: "In stock",
              isAvailable: true,
            },
            {
              id: "100ml",
              label: "100ml travel size",
              availabilityLabel: "Temporarily unavailable",
              isAvailable: false,
            },
          ],
        },
      ],
      resolvedVariantId: "prod-001-200ml",
      canAddToCart: true,
      cartLine: {
        cartItemId: "cart-item-001",
        quantity: 1,
        canIncreaseQuantity: true,
        canDecreaseQuantity: true,
      },
      usageDirections: [
        {
          id: "cleanser-use-1",
          title: "Cleanse gently",
          description: "Massage a small amount onto damp skin for 30 seconds, then rinse with lukewarm water.",
        },
        {
          id: "cleanser-use-2",
          title: "Follow with hydration",
          description: "Pat skin dry and continue with toner or serum while skin is comfortable.",
        },
      ],
      usageFrequencyLabel: "Daily, morning and evening",
      layeringNote: "Use before toner, serum, moisturiser, and SPF.",
      ingredientHighlights: [
        {
          id: "cleanser-ingredient-1",
          name: "Glycerin",
          description: "Helps keep skin feeling comfortable after cleansing.",
          tone: "positive",
        },
        {
          id: "cleanser-ingredient-2",
          name: "Mild cleansing agents",
          description: "Lift daily buildup while respecting the skin barrier.",
          tone: "neutral",
        },
      ],
      fullIngredientList: ["Aqua", "Glycerin", "Coco-Glucoside", "Betaine", "Panthenol", "Citric Acid"],
      badges: [
        {
          id: "cleanser-badge-1",
          label: "pH-balanced",
          tone: "peach",
        },
        {
          id: "cleanser-badge-2",
          label: "Fragrance free",
          tone: "neutral",
        },
      ],
      cartSummary: {
        itemCount: 3,
        subtotalLabel: "$85.00",
      },
    },
    "prod-002": {
      productId: "prod-002",
      brand: "DermaLens Essentials",
      name: "Balancing Hydra Toner",
      categoryLabel: "Toning",
      description: "Alcohol-free formula with hyaluronic acid",
      priceLabel: "$22.00",
      availabilityState: "available",
      availabilityLabel: "In stock",
      firstPartyLabel: "Sold directly by DermaLens.",
      images: [],
      routineFit: "Prepares the morning routine with lightweight hydration before moisturiser and SPF.",
      matchedStepLabels: ["Step 2: Hydrating toner"],
      timingLabels: ["Morning"],
      variantGroups: [
        {
          id: "size",
          label: "Size",
          required: true,
          selectedOptionId: "150ml",
          options: [
            {
              id: "150ml",
              label: "150ml",
              availabilityLabel: "In stock",
              isAvailable: true,
            },
          ],
        },
      ],
      resolvedVariantId: "prod-002-150ml",
      canAddToCart: true,
      usageDirections: [
        {
          id: "toner-use-1",
          title: "Apply after cleansing",
          description: "Press into clean skin with palms or sweep on with a reusable cotton pad.",
        },
        {
          id: "toner-use-2",
          title: "Continue while skin is damp",
          description: "Follow with moisturiser to seal in the light hydration.",
        },
      ],
      usageFrequencyLabel: "Daily, morning",
      layeringNote: "Use after cleanser and before moisturiser.",
      ingredientHighlights: [
        {
          id: "toner-ingredient-1",
          name: "Hyaluronic acid",
          description: "Supports a hydrated feel without heaviness.",
          tone: "positive",
        },
        {
          id: "toner-ingredient-2",
          name: "Panthenol",
          description: "Helps skin feel calm and comfortable.",
          tone: "positive",
        },
      ],
      fullIngredientList: ["Aqua", "Glycerin", "Hyaluronic Acid", "Panthenol", "Betaine", "Sodium Citrate"],
      badges: [
        {
          id: "toner-badge-1",
          label: "Alcohol free",
          tone: "peach",
        },
        {
          id: "toner-badge-2",
          label: "Light hydration",
          tone: "neutral",
        },
      ],
      cartSummary: {
        itemCount: 3,
        subtotalLabel: "$85.00",
      },
    },
    "prod-003": {
      productId: "prod-003",
      brand: "DermaLens Essentials",
      name: "Daily Balance Moisturiser",
      categoryLabel: "Moisturising",
      description: "Oil-free gel-cream for combination skin",
      priceLabel: "$28.00",
      availabilityState: "available",
      availabilityLabel: "In stock",
      firstPartyLabel: "Sold directly by DermaLens.",
      images: [],
      routineFit: "Adds balanced moisture to drier areas without overwhelming the T-zone.",
      matchedStepLabels: ["Step 3: Lightweight moisturiser"],
      timingLabels: ["Morning"],
      variantGroups: [
        {
          id: "size",
          label: "Size",
          required: true,
          selectedOptionId: "50ml",
          options: [
            {
              id: "50ml",
              label: "50ml",
              availabilityLabel: "In stock",
              isAvailable: true,
            },
            {
              id: "75ml",
              label: "75ml value size",
              availabilityLabel: "Not available for this demo order",
              isAvailable: false,
            },
          ],
        },
      ],
      resolvedVariantId: "prod-003-50ml",
      canAddToCart: true,
      usageDirections: [
        {
          id: "moisturiser-use-1",
          title: "Apply a light layer",
          description: "Smooth a pea-sized amount over face and neck after toner or serum.",
        },
        {
          id: "moisturiser-use-2",
          title: "Adjust by area",
          description: "Use a little more on cheeks and a thinner layer on oilier zones.",
        },
      ],
      usageFrequencyLabel: "Daily, morning",
      layeringNote: "Use before SPF in the morning routine.",
      ingredientHighlights: [
        {
          id: "moisturiser-ingredient-1",
          name: "Niacinamide",
          description: "Supports a balanced-looking skin finish.",
          tone: "positive",
        },
        {
          id: "moisturiser-ingredient-2",
          name: "Squalane",
          description: "Adds a soft, lightweight moisturising feel.",
          tone: "neutral",
        },
      ],
      fullIngredientList: ["Aqua", "Glycerin", "Niacinamide", "Squalane", "Dimethicone", "Panthenol"],
      badges: [
        {
          id: "moisturiser-badge-1",
          label: "Oil free",
          tone: "peach",
        },
        {
          id: "moisturiser-badge-2",
          label: "Gel-cream texture",
          tone: "neutral",
        },
      ],
      cartSummary: {
        itemCount: 3,
        subtotalLabel: "$85.00",
      },
    },
    "prod-004": {
      productId: "prod-004",
      brand: "DermaLens Essentials",
      name: "Invisible Shield SPF 50",
      categoryLabel: "Sun Protection",
      description: "Lightweight, non-greasy formula that works well under makeup",
      priceLabel: "$32.00",
      availabilityState: "available",
      availabilityLabel: "In stock",
      firstPartyLabel: "Sold directly by DermaLens.",
      images: [],
      routineFit: "Completes the morning routine with daily broad-spectrum SPF coverage.",
      matchedStepLabels: ["Step 4: Sunscreen SPF 30+"],
      timingLabels: ["Morning"],
      variantGroups: [
        {
          id: "size",
          label: "Size",
          required: true,
          selectedOptionId: "50ml",
          options: [
            {
              id: "50ml",
              label: "50ml",
              availabilityLabel: "In stock",
              isAvailable: true,
            },
          ],
        },
      ],
      resolvedVariantId: "prod-004-50ml",
      canAddToCart: true,
      cartLine: {
        cartItemId: "cart-item-002",
        quantity: 1,
        canIncreaseQuantity: true,
        canDecreaseQuantity: true,
      },
      usageDirections: [
        {
          id: "spf-use-1",
          title: "Apply generously",
          description: "Use as the final morning step 15 minutes before sun exposure.",
        },
        {
          id: "spf-use-2",
          title: "Reapply when needed",
          description: "Reapply every 2 hours when outdoors, sweating, or after towel drying.",
        },
      ],
      usageFrequencyLabel: "Daily, morning",
      layeringNote: "Use after moisturiser as the final skincare step before makeup.",
      caution: "Avoid contact with eyes. For external use only.",
      ingredientHighlights: [
        {
          id: "spf-ingredient-1",
          name: "Modern UV filters",
          description: "Provide lightweight broad-spectrum sun protection.",
          tone: "positive",
        },
        {
          id: "spf-ingredient-2",
          name: "Vitamin E",
          description: "Adds antioxidant support for daily wear.",
          tone: "neutral",
        },
      ],
      fullIngredientList: ["Aqua", "Homosalate", "Avobenzone", "Glycerin", "Tocopherol", "Silica"],
      badges: [
        {
          id: "spf-badge-1",
          label: "SPF 50",
          tone: "peach",
        },
        {
          id: "spf-badge-2",
          label: "No greasy finish",
          tone: "neutral",
        },
      ],
      reviewSummary: {
        ratingLabel: "4.7 out of 5",
        countLabel: "128 reviews",
        supporting: "Demo review summary supplied by the host fixture.",
      },
      cartSummary: {
        itemCount: 3,
        subtotalLabel: "$85.00",
      },
    },
    "prod-005": {
      productId: "prod-005",
      brand: "DermaLens Essentials",
      name: "Nourishing Cleansing Oil",
      categoryLabel: "First Cleanse",
      description: "Gentle oil that emulsifies to a milky texture",
      priceLabel: "$26.00",
      availabilityState: "available",
      availabilityLabel: "In stock",
      firstPartyLabel: "Sold directly by DermaLens.",
      images: [],
      routineFit: "Starts the evening routine by dissolving sunscreen and daily buildup before second cleanse.",
      matchedStepLabels: ["Step 1: Oil cleanser"],
      timingLabels: ["Evening"],
      variantGroups: [
        {
          id: "size",
          label: "Size",
          required: true,
          selectedOptionId: "150ml",
          options: [
            {
              id: "150ml",
              label: "150ml",
              availabilityLabel: "In stock",
              isAvailable: true,
            },
          ],
        },
      ],
      resolvedVariantId: "prod-005-150ml",
      canAddToCart: true,
      usageDirections: [
        {
          id: "oil-use-1",
          title: "Massage onto dry skin",
          description: "Use one to two pumps and massage gently for about 60 seconds.",
        },
        {
          id: "oil-use-2",
          title: "Emulsify and rinse",
          description: "Add water to create a milky texture, then rinse before your second cleanse.",
        },
      ],
      usageFrequencyLabel: "Daily, evening",
      layeringNote: "Use before the Gentle Foaming Cleanser in the evening.",
      ingredientHighlights: [
        {
          id: "oil-ingredient-1",
          name: "Sunflower seed oil",
          description: "Gives the cleanser a cushiony slip.",
          tone: "neutral",
        },
        {
          id: "oil-ingredient-2",
          name: "Emulsifying agents",
          description: "Help the oil rinse cleanly with water.",
          tone: "positive",
        },
      ],
      fullIngredientList: ["Helianthus Annuus Seed Oil", "Caprylic Triglyceride", "Polyglyceryl-4 Oleate", "Tocopherol"],
      badges: [
        {
          id: "oil-badge-1",
          label: "Emulsifying oil",
          tone: "peach",
        },
        {
          id: "oil-badge-2",
          label: "Evening routine",
          tone: "neutral",
        },
      ],
      cartSummary: {
        itemCount: 3,
        subtotalLabel: "$85.00",
      },
    },
    "prod-006": {
      productId: "prod-006",
      brand: "DermaLens Essentials",
      name: "Hyaluronic Boost Serum",
      categoryLabel: "Treatment",
      description: "Multi-weight hyaluronic acid for deep hydration",
      priceLabel: "$35.00",
      availabilityState: "available",
      availabilityLabel: "In stock",
      firstPartyLabel: "Sold directly by DermaLens.",
      images: [],
      routineFit: "Adds concentrated hydration to the evening routine, especially for cheek dryness.",
      matchedStepLabels: ["Step 3: Hydrating serum"],
      timingLabels: ["Evening"],
      variantGroups: [
        {
          id: "size",
          label: "Size",
          required: true,
          selectedOptionId: "30ml",
          options: [
            {
              id: "30ml",
              label: "30ml",
              availabilityLabel: "In stock",
              isAvailable: true,
            },
          ],
        },
      ],
      resolvedVariantId: "prod-006-30ml",
      canAddToCart: true,
      cartLine: {
        cartItemId: "cart-item-003",
        quantity: 1,
        canIncreaseQuantity: true,
        canDecreaseQuantity: true,
      },
      usageDirections: [
        {
          id: "serum-use-1",
          title: "Apply to slightly damp skin",
          description: "Press two to three drops over face and neck after cleansing.",
        },
        {
          id: "serum-use-2",
          title: "Seal with moisturiser",
          description: "Follow with a night moisturiser to help maintain a comfortable hydrated feel.",
        },
      ],
      usageFrequencyLabel: "Daily, evening",
      layeringNote: "Use before Overnight Repair Cream.",
      ingredientHighlights: [
        {
          id: "serum-ingredient-1",
          name: "Multi-weight hyaluronic acid",
          description: "Gives layered hydration support with a lightweight finish.",
          tone: "positive",
        },
        {
          id: "serum-ingredient-2",
          name: "Betaine",
          description: "Helps skin feel soft and comfortable.",
          tone: "neutral",
        },
      ],
      fullIngredientList: ["Aqua", "Glycerin", "Sodium Hyaluronate", "Betaine", "Panthenol", "Phenoxyethanol"],
      badges: [
        {
          id: "serum-badge-1",
          label: "Hydration support",
          tone: "peach",
        },
        {
          id: "serum-badge-2",
          label: "Lightweight serum",
          tone: "neutral",
        },
      ],
      cartSummary: {
        itemCount: 3,
        subtotalLabel: "$85.00",
      },
    },
    "prod-007": {
      productId: "prod-007",
      brand: "DermaLens Essentials",
      name: "Overnight Repair Cream",
      categoryLabel: "Moisturising",
      description: "Rich but non-comedogenic formula for overnight recovery",
      priceLabel: "$38.00",
      availabilityState: "available",
      availabilityLabel: "In stock",
      firstPartyLabel: "Sold directly by DermaLens.",
      images: [],
      routineFit: "Finishes the evening routine by sealing in hydration overnight.",
      matchedStepLabels: ["Step 4: Night moisturiser"],
      timingLabels: ["Evening"],
      variantGroups: [
        {
          id: "size",
          label: "Size",
          required: true,
          selectedOptionId: "50ml",
          options: [
            {
              id: "50ml",
              label: "50ml",
              availabilityLabel: "In stock",
              isAvailable: true,
            },
          ],
        },
      ],
      resolvedVariantId: "prod-007-50ml",
      canAddToCart: true,
      usageDirections: [
        {
          id: "night-cream-use-1",
          title: "Apply as the final evening step",
          description: "Smooth a generous layer over face and neck after serum.",
        },
        {
          id: "night-cream-use-2",
          title: "Use a lighter layer where needed",
          description: "Apply less on areas that already feel comfortable.",
        },
      ],
      usageFrequencyLabel: "Daily, evening",
      layeringNote: "Use after hydrating serum as the last evening skincare step.",
      ingredientHighlights: [
        {
          id: "night-cream-ingredient-1",
          name: "Ceramide blend",
          description: "Supports a comfortable moisturised feel overnight.",
          tone: "positive",
        },
        {
          id: "night-cream-ingredient-2",
          name: "Shea butter",
          description: "Adds a richer cushion for drier areas.",
          tone: "neutral",
        },
      ],
      fullIngredientList: ["Aqua", "Glycerin", "Butyrospermum Parkii Butter", "Ceramide NP", "Squalane", "Panthenol"],
      badges: [
        {
          id: "night-cream-badge-1",
          label: "Rich texture",
          tone: "peach",
        },
        {
          id: "night-cream-badge-2",
          label: "Evening routine",
          tone: "neutral",
        },
      ],
      cartSummary: {
        itemCount: 3,
        subtotalLabel: "$85.00",
      },
    },
  }
  const selectedProductDetailReport = productDetailContext
    ? sampleProductDetailReports[productDetailContext.productId] ?? null
    : null

  const fallbackCheckoutDetailsDraft = {
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    postalCode: "",
    countryCode: "US",
    saveOnDevice: true,
  }
  const submittedCheckoutDraft = checkoutDetailsSubmission?.draft ?? null
  const checkoutReviewCountryLabel =
    sampleCountries.find(
      (country) => country.code === submittedCheckoutDraft?.countryCode,
    )?.name ?? "United States"
  const checkoutReviewCityRegionPostalLine = submittedCheckoutDraft
    ? [
        submittedCheckoutDraft.city,
        [
          submittedCheckoutDraft.region,
          submittedCheckoutDraft.postalCode,
        ].filter(Boolean).join(" "),
      ].filter(Boolean).join(", ")
    : "Los Angeles, CA 90001"
  const checkoutReviewAddressLines = submittedCheckoutDraft
    ? [
        submittedCheckoutDraft.addressLine1,
        submittedCheckoutDraft.addressLine2.trim()
          ? submittedCheckoutDraft.addressLine2
          : "",
        checkoutReviewCityRegionPostalLine,
      ].filter((line) => line.trim().length > 0)
    : ["123 Glow Lane", "Apt 4B", "Los Angeles, CA 90001"]

  // Sample checkout details data
  const sampleCheckoutDetailsReport: CheckoutContactAndShippingReport = {
    checkoutSessionId: "checkout-001",
    profileName: profileName,
    savedAddresses: [],
    defaultDraft: checkoutDetailsSubmission?.draft ?? fallbackCheckoutDetailsDraft,
    countryOptions: sampleCountries.map(c => ({ code: c.code, label: c.name })),
    postalCodeRequired: true,
    cartSummary: {
      itemCount: 3,
      subtotalLabel: "$85.00",
    },
  }

  const selectedCheckoutShippingFixture =
    selectedCheckoutShippingOptionId === "shipopt-002"
      ? {
          shippingLabel: "$9.00",
          totalLabel: "$102.50",
          deliverySummaryLabel: "Express delivery to your address",
          estimatedDeliveryLabel: "Estimated delivery: 2-3 business days",
        }
      : {
          shippingLabel: "Free",
          totalLabel: "$93.50",
          deliverySummaryLabel: "Standard delivery to your address",
          estimatedDeliveryLabel: "Estimated delivery: 5-7 business days",
        }

  // Demo-only host/controller fixture. Prices and shipping state stay host-owned.
  const sampleCheckoutReviewReport: CheckoutReviewReport = {
    checkoutSessionId: checkoutDetailsSubmission?.checkoutSessionId ?? "checkout-001",
    reviewId: "review-001",
    contact: submittedCheckoutDraft
      ? {
          fullName: submittedCheckoutDraft.fullName,
          email: submittedCheckoutDraft.email,
          phone: submittedCheckoutDraft.phone,
        }
      : {
          fullName: `${profileName} Taylor`,
          email: "alex@example.com",
          phone: "+1 555 014 7721",
        },
    address: {
      displayLines: checkoutReviewAddressLines,
      countryLabel: checkoutReviewCountryLabel,
    },
    items: [
      {
        cartItemId: "cart-item-001",
        productId: "prod-001",
        brand: "DermaLens Essentials",
        name: "Gentle Foaming Cleanser",
        optionLabels: ["200ml"],
        quantity: 1,
        unitPriceLabel: "$18.00",
        lineTotalLabel: "$18.00",
        availabilityState: "available",
        availabilityLabel: "In stock",
      },
      {
        cartItemId: "cart-item-002",
        productId: "prod-004",
        brand: "DermaLens Essentials",
        name: "Invisible Shield SPF 50",
        optionLabels: ["50ml"],
        quantity: 1,
        unitPriceLabel: "$32.00",
        lineTotalLabel: "$32.00",
        availabilityState: "available",
        availabilityLabel: "In stock",
      },
      {
        cartItemId: "cart-item-003",
        productId: "prod-006",
        brand: "DermaLens Essentials",
        name: "Hyaluronic Boost Serum",
        optionLabels: ["30ml"],
        quantity: 1,
        unitPriceLabel: "$35.00",
        lineTotalLabel: "$35.00",
        availabilityState: "available",
        availabilityLabel: "In stock",
      },
    ],
    shippingOptions: [
      {
        id: "shipopt-001",
        label: "Standard delivery",
        supporting: "Reliable delivery for your routine products.",
        priceLabel: "Free",
        estimatedDeliveryLabel: "Estimated delivery: 5-7 business days",
        isAvailable: true,
      },
      {
        id: "shipopt-002",
        label: "Express delivery",
        supporting: "Priority handling for this order.",
        priceLabel: "$9.00",
        estimatedDeliveryLabel: "Estimated delivery: 2-3 business days",
        isAvailable: true,
      },
    ],
    selectedShippingOptionId: selectedCheckoutShippingOptionId,
    pricing: {
      itemCount: 3,
      subtotalLabel: "$85.00",
      shippingLabel: selectedCheckoutShippingFixture.shippingLabel,
      taxLabel: "$8.50",
      totalLabel: selectedCheckoutShippingFixture.totalLabel,
      checkoutNotice: "Final charges are confirmed before payment.",
    },
    canProceedToSecurePayment: true,
    paymentBlockReason: null,
  }

  // Sample payment gateway data
  const samplePaymentGatewayReport: SecurePaymentGatewayHandoffReport = {
    checkoutSessionId: sampleCheckoutReviewReport.checkoutSessionId,
    reviewId: sampleCheckoutReviewReport.reviewId,
    paymentSessionId: "payment-001",
    sessionStatus: "ready",
    orderReferenceLabel: "DL-2024-001234",
    itemCount: sampleCheckoutReviewReport.pricing.itemCount,
    totalLabel: sampleCheckoutReviewReport.pricing.totalLabel,
    providerLabel: "Stripe",
    destinationDisplayLabel: "secure.stripe.com",
    sessionExpiryLabel: "Session expires in 15 minutes",
    hostSecurityHelperLabel: "Your payment information is encrypted and secure.",
  }

  // Sample order confirmation data
  const sampleOrderConfirmationReport: OrderPaymentResultReport = {
    checkoutSessionId: sampleCheckoutReviewReport.checkoutSessionId,
    reviewId: sampleCheckoutReviewReport.reviewId,
    paymentResultId: "result-001",
    paymentStatus: "confirmed",
    orderId: "order-001",
    orderReferenceLabel: "DL-2024-001234",
    itemCount: sampleCheckoutReviewReport.pricing.itemCount,
    totalLabel: sampleCheckoutReviewReport.pricing.totalLabel,
    providerLabel: "Visa ending in 4242",
    confirmedAtLabel: new Date().toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }),
    deliverySummaryLabel: selectedCheckoutShippingFixture.deliverySummaryLabel,
    estimatedDeliveryLabel: selectedCheckoutShippingFixture.estimatedDeliveryLabel,
  }

  // Simulate analysis progress
  useEffect(() => {
    if (currentScreen !== "analysis") {
      setAnalysisProgress(0)
      setActiveStage("preparing-photo")
      setCompletedStages([])
      return
    }

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 200)

    return () => clearInterval(progressInterval)
  }, [currentScreen])

  // Update stages based on progress
  useEffect(() => {
    if (currentScreen !== "analysis") return

    const stageThresholds = [0, 20, 40, 60, 80]
    const currentStageIndex = stageThresholds.findIndex((threshold, index) => {
      const nextThreshold = stageThresholds[index + 1] ?? 100
      return analysisProgress >= threshold && analysisProgress < nextThreshold
    })

    if (currentStageIndex >= 0 && currentStageIndex < analysisStageOrder.length) {
      setActiveStage(analysisStageOrder[currentStageIndex])
      setCompletedStages(analysisStageOrder.slice(0, currentStageIndex))
    }

    if (analysisProgress >= 100) {
      setCompletedStages([...analysisStageOrder])
    }
  }, [analysisProgress, currentScreen])

  // Order Confirmation Screen
  if (currentScreen === "order-confirmation") {
    return (
      <OrderConfirmationAndPaymentResultScreen
        state="ready"
        report={sampleOrderConfirmationReport}
        isOffline={false}
        canViewOrder={true}
        canRefreshStatus={false}
        canRetryPayment={false}
        onViewOrder={(orderId) => {
          console.log("Viewing order:", orderId)
        }}
        onContinueShopping={() => {
          setStoreBackScreen("routine")
          setCurrentScreen("store")
        }}
        onBackToReview={() => {
          setCurrentScreen("checkout-review")
        }}
      />
    )
  }

  // Secure Payment Gateway Handoff Screen
  if (currentScreen === "payment-gateway") {
    return (
      <SecurePaymentGatewayHandoffScreen
        state="ready"
        report={samplePaymentGatewayReport}
        isOffline={false}
        canOpenPaymentGateway={true}
        onBack={() => {
          setCurrentScreen("checkout-review")
        }}
        onOpenPaymentGateway={(submission) => {
          console.log("Opening payment gateway:", submission)
          // In production, the host routes to order-confirmation only after
          // provider return handling and latest payment-result retrieval.
        }}
        onRetryPrepare={() => {
          console.log("Retrying payment preparation...")
        }}
      />
    )
  }

  // Checkout Review Screen
  if (currentScreen === "checkout-review") {
    return (
      <CheckoutReviewScreen
        state="ready"
        report={sampleCheckoutReviewReport}
        isOffline={false}
        canOpenSecurePayment={true}
        onBack={() => {
          setCurrentScreen("checkout-details")
        }}
        onEditDetails={() => {
          setCurrentScreen("checkout-details")
        }}
        onEditCart={() => {
          setCurrentScreen("cart")
        }}
        onContinueToSecurePayment={(submission) => {
          console.log("Checkout review submitted:", submission)
          setCurrentScreen("payment-gateway")
        }}
        onSelectShippingOption={(optionId) => {
          console.log("Checkout shipping option selected:", {
            checkoutSessionId: sampleCheckoutReviewReport.checkoutSessionId,
            reviewId: sampleCheckoutReviewReport.reviewId,
            selectedShippingOptionId: optionId,
          })
          setSelectedCheckoutShippingOptionId(optionId)
        }}
        onRetryLoad={() => {
          console.log("Retrying checkout review load...")
        }}
      />
    )
  }

  // Checkout Contact and Shipping Screen
  if (currentScreen === "checkout-details") {
    return (
      <CheckoutContactAndShippingScreen
        state="ready"
        report={sampleCheckoutDetailsReport}
        isOffline={false}
        canContinue={true}
        onBack={() => {
          setCurrentScreen("cart")
        }}
        onContinue={(submission) => {
          console.log("Checkout details submitted:", submission)
          setCheckoutDetailsSubmission(submission)
          setCurrentScreen("checkout-review")
        }}
        onRetryLoad={() => {
          console.log("Retrying checkout load...")
        }}
      />
    )
  }

  // Product Detail Screen
  if (currentScreen === "product-detail") {
    return (
      <ProductDetailScreen
        state={selectedProductDetailReport ? "ready" : "error"}
        report={selectedProductDetailReport}
        isOffline={false}
        canModifyCart={true}
        canOpenCart={true}
        onBack={() => {
          setCurrentScreen(productDetailContext?.sourceScreen ?? "store")
        }}
        onOpenCart={() => {
          setCurrentScreen("cart")
        }}
        onSelectVariantOption={(groupId, optionId) => {
          console.log("Selecting product variant option:", {
            productId: productDetailContext?.productId,
            groupId,
            optionId,
          })
        }}
        onAddToCart={(productId, resolvedVariantId) => {
          console.log("Adding product to cart:", {
            productId,
            resolvedVariantId,
          })
        }}
        onIncreaseCartLineQuantity={(cartItemId) => {
          console.log("Increasing product detail cart line quantity:", cartItemId)
        }}
        onDecreaseCartLineQuantity={(cartItemId) => {
          console.log("Decreasing product detail cart line quantity:", cartItemId)
        }}
        onOpenReviews={() => {
          console.log("Opening product reviews:", productDetailContext?.productId)
        }}
        onRetryLoad={() => {
          console.log("Retrying product detail load:", productDetailContext?.productId)
        }}
      />
    )
  }

  // Cart Screen
  if (currentScreen === "cart") {
    return (
      <CartScreen
        state="ready"
        report={sampleCartReport}
        isOffline={false}
        canModifyCart={true}
        canProceedToCheckout={true}
        onBack={() => {
          setCurrentScreen("store")
        }}
        onProceedToCheckout={() => {
          setCurrentScreen("checkout-details")
        }}
        onOpenProduct={(productId) => {
          openProductDetail(productId, "cart")
        }}
        onIncreaseQuantity={(cartItemId) => {
          console.log("Increasing quantity for cart item:", cartItemId)
        }}
        onDecreaseQuantity={(cartItemId) => {
          console.log("Decreasing quantity for cart item:", cartItemId)
        }}
        onRemoveItem={(cartItemId) => {
          console.log("Removing cart item:", cartItemId)
        }}
        onRetryLoad={() => {
          console.log("Retrying cart load...")
        }}
      />
    )
  }

  // Ingredient Scanner Results Screen
  if (currentScreen === "ingredient-scanner-results") {
    return (
      <IngredientScannerResultsScreen
        state={sampleIngredientScannerResultsReport ? "ready" : "error"}
        report={sampleIngredientScannerResultsReport}
        isOffline={false}
        canGoBackToReview={true}
        canScanAnotherProduct={true}
        canSaveResult={true}
        isSaveAvailableOffline={false}
        onBackToReview={(draftId) => {
          if (
            ingredientInputDraft === null ||
            ingredientScannerResultContext === null ||
            draftId !== ingredientInputDraft.draftId ||
            draftId !== ingredientScannerResultContext.draftId
          ) {
            console.log(
              "Ingredient review return blocked because the draft context is unavailable.",
            )
            return
          }

          setCurrentScreen("ingredient-input-review")
        }}
        onScanAnotherProduct={() => {
          setIngredientScannerSelectedProfileId(
            ingredientScannerResultContext?.selectedProfileId ?? null,
          )
          setIngredientInputDraft(null)
          setIngredientScannerResultContext(null)
          setCurrentScreen("ingredient-scanner-entry")
        }}
        onSaveResult={(
          submission: IngredientScannerResultSaveSubmission,
        ) => {
          console.log(
            "Saving ingredient guidance result through future adapter:",
            submission,
          )
        }}
        onRetryLoad={() => {
          console.log(
            "Retrying ingredient guidance result load through future adapter.",
          )
        }}
      />
    )
  }

  // Ingredient Input Review Screen
  if (currentScreen === "ingredient-input-review") {
    return (
      <IngredientInputReviewScreen
        state={sampleIngredientInputReviewReport ? "ready" : "error"}
        report={sampleIngredientInputReviewReport}
        isOffline={false}
        canGoBack={true}
        canChangeMethod={true}
        canChangeProfile={true}
        canEditIngredientText={true}
        canContinue={true}
        onBack={returnToIngredientScannerEntry}
        onChangeMethod={returnToIngredientScannerEntry}
        onIngredientTextChange={(ingredientText) => {
          setIngredientInputDraft((current) =>
            current
              ? {
                  ...current,
                  ingredientText,
                }
              : current,
          )
        }}
        onChangeProfile={() => {
          setProfileManagementBackScreen("ingredient-input-review")
          setCurrentScreen("profile-management")
        }}
        onContinue={(submission: IngredientInputReviewSubmission) => {
          console.log(
            "Submitting reviewed ingredient draft for future guidance route:",
            submission,
          )
          openIngredientScannerResults(submission)
        }}
        onRetryLoad={() => {
          console.log("Retrying ingredient input review load...")
        }}
      />
    )
  }

  // Guest Ingredient Scanner Entry Screen
  if (currentScreen === "ingredient-scanner-entry") {
    return (
      <GuestIngredientScannerEntryScreen
        state="ready"
        report={sampleIngredientScannerEntryReport}
        isOffline={false}
        canGoBack={true}
        canTakePhoto={true}
        isTakePhotoAvailableOffline={false}
        canChoosePhoto={true}
        isChoosePhotoAvailableOffline={false}
        canEnterIngredientsManually={true}
        isManualEntryAvailableOffline={true}
        canChangeProfile={true}
        canContinueWithoutProfile={true}
        onBack={() => {
          setCurrentScreen(ingredientScannerEntryBackScreen)
        }}
        onTakePhoto={(submission) => {
          console.log("Opening ingredient scanner camera route:", submission)
          openIngredientInputReview("camera-photo", submission)
        }}
        onChoosePhoto={(submission) => {
          console.log("Opening ingredient scanner picker route:", submission)
          openIngredientInputReview("chosen-photo", submission)
        }}
        onEnterIngredientsManually={(submission) => {
          console.log("Opening ingredient scanner manual-entry route:", submission)
          openIngredientInputReview("manual-entry", submission)
        }}
        onChangeProfile={() => {
          setProfileManagementBackScreen("ingredient-scanner-entry")
          setCurrentScreen("profile-management")
        }}
        onContinueWithoutProfile={() => {
          console.log("Continuing ingredient scanner without profile...")
          setIngredientScannerSelectedProfileId(null)
        }}
        onRetryLoad={() => {
          console.log("Retrying ingredient scanner entry load...")
        }}
      />
    )
  }

  // Profile Switcher and Management Screen
  if (currentScreen === "profile-management") {
    return (
      <ProfileSwitcherAndManagementScreen
        state="ready"
        report={sampleProfileManagementReport}
        isOffline={false}
        canGoBack={true}
        canAddProfile={true}
        canOpenSyncSettings={true}
        canSelectProfiles={true}
        canEditProfiles={true}
        canDeleteProfiles={true}
        onBack={() => {
          setCurrentScreen(profileManagementBackScreen)
        }}
        onSelectProfile={(profileId) => {
          const matchingProfiles = sampleManagedProfiles.filter(
            (profile) => profile.profileId === profileId,
          )

          if (matchingProfiles.length !== 1) {
            console.log("Profile selection failed closed:", profileId)
            return
          }

          const selectedProfile = matchingProfiles[0]
          console.log("Selecting profile:", profileId)
          setActiveManagedProfileId(selectedProfile.profileId)
          setProfileName(selectedProfile.displayName)
          if (profileManagementBackScreen === "ingredient-scanner-entry") {
            setIngredientScannerSelectedProfileId(selectedProfile.profileId)
          }
          if (profileManagementBackScreen === "ingredient-input-review") {
            setIngredientInputDraft((current) =>
              current
                ? {
                    ...current,
                    selectedProfileId: selectedProfile.profileId,
                  }
                : current,
            )
          }
          setCurrentScreen(profileManagementBackScreen)
        }}
        onAddProfile={() => {
          setProfileSetupBackScreen("profile-management")
          setCurrentScreen("profile-setup")
        }}
        onEditProfile={(profileId) => {
          console.log("Editing profile:", profileId)
        }}
        onOpenSyncSettings={() => {
          console.log("Opening profile sync settings...")
        }}
        onDeleteProfile={(profileId) => {
          console.log("Deleting profile:", profileId)
        }}
        onRetryLoad={() => {
          console.log("Retrying profile management load...")
        }}
      />
    )
  }

  // Progress Tracking Screen
  if (currentScreen === "progress-tracking") {
    return (
      <ProgressTrackingScreen
        state="ready"
        report={sampleProgressTrackingReport}
        isOffline={false}
        canGoBack={true}
        canStartNewScan={true}
        canSelectBaseline={true}
        canSelectComparison={true}
        canOpenReports={true}
        canOpenRoutine={true}
        onBack={() => {
          setCurrentScreen("dashboard")
        }}
        onStartNewScan={(profileId) => {
          if (profileId !== activeManagedProfileId) {
            console.log(
              "Progress scan setup blocked because the active profile context is unavailable.",
            )
            return
          }

          console.log("Opening progress scan setup for profile:", profileId)
          setImageSourceBackScreen("progress-tracking")
          setCapturedImageUrl(null)
          setCurrentScreen("image-source")
        }}
        onSelectBaseline={(scanId) => {
          const resolvedScanId = resolveDemoProgressScanId(scanId)

          if (resolvedScanId === null) {
            console.log("Progress baseline selection failed closed:", scanId)
            return
          }

          console.log("Selecting progress baseline snapshot:", resolvedScanId)
          setProgressBaselineScanId(resolvedScanId)
        }}
        onSelectComparison={(scanId) => {
          const resolvedScanId = resolveDemoProgressScanId(scanId)

          if (resolvedScanId === null) {
            console.log("Progress comparison selection failed closed:", scanId)
            return
          }

          console.log("Selecting progress comparison snapshot:", resolvedScanId)
          setProgressComparisonScanId(resolvedScanId)
        }}
        onOpenReport={(scanId) => {
          const resolvedScanId = resolveDemoProgressScanId(scanId)

          if (resolvedScanId === null) {
            console.log("Progress report route failed closed:", scanId)
            return
          }

          console.log("Opening progress snapshot report:", resolvedScanId)
          setResultsSummaryCloseScreen("progress-tracking")
          setCurrentScreen("results-summary")
        }}
        onOpenRoutine={(routineId) => {
          if (routineId !== sampleRoutineReport.routineId) {
            console.log("Progress routine route failed closed:", routineId)
            return
          }

          console.log("Opening progress routine:", routineId)
          setRoutineBackScreen("progress-tracking")
          setCurrentScreen("routine")
        }}
        onRetryLoad={() => {
          console.log("Retrying progress tracking load through future adapter.")
        }}
      />
    )
  }

  // Home Dashboard Screen
  if (currentScreen === "dashboard") {
    return (
      <HomeDashboardScreen
        state="ready"
        report={sampleDashboardReport}
        isOffline={false}
        showEnvironmentalModule={false}
        canStartAnalysis={true}
        canChangeProfile={true}
        canOpenLatestReport={true}
        canOpenRoutine={true}
        canOpenGuestScanner={true}
        isGuestScannerAvailableOffline={false}
        canOpenProgress={true}
        canOpenOrders={false}
        canOpenStore={true}
        canOpenRecentOrder={false}
        onStartAnalysis={(profileId) => {
          console.log("Starting dashboard scan for profile:", profileId)
          setImageSourceBackScreen("dashboard")
          setCapturedImageUrl(null)
          setCurrentScreen("image-source")
        }}
        onChangeProfile={() => {
          setProfileManagementBackScreen("dashboard")
          setCurrentScreen("profile-management")
        }}
        onOpenLatestReport={(reportId) => {
          console.log("Opening dashboard latest report:", reportId)
          setResultsSummaryCloseScreen("dashboard")
          setCurrentScreen("results-summary")
        }}
        onOpenRoutine={(routineId) => {
          console.log("Opening dashboard routine:", routineId)
          setRoutineBackScreen("dashboard")
          setCurrentScreen("routine")
        }}
        onOpenGuestScanner={() => {
          setIngredientScannerEntryBackScreen("dashboard")
          setIngredientScannerSelectedProfileId(activeManagedProfileId)
          setCurrentScreen("ingredient-scanner-entry")
        }}
        onOpenProgress={() => {
          setCurrentScreen("progress-tracking")
        }}
        onOpenOrders={() => {
          console.log("Opening dashboard orders...")
        }}
        onOpenStore={() => {
          setStoreBackScreen("dashboard")
          setCurrentScreen("store")
        }}
        onOpenRecentOrder={(orderId) => {
          console.log("Opening dashboard recent order:", orderId)
        }}
        onRetryLoad={() => {
          console.log("Retrying dashboard load...")
        }}
      />
    )
  }

  // Store Routine Collection Screen
  if (currentScreen === "store") {
    return (
      <DermaLensStoreRoutineCollectionScreen
        state="ready"
        report={sampleStoreReport}
        initialFilter="all"
        isOffline={false}
        canModifyCart={true}
        canOpenCart={true}
        onBack={() => {
          setCurrentScreen(storeBackScreen)
        }}
        onOpenCart={() => {
          setCurrentScreen("cart")
        }}
        onOpenProduct={(productId) => {
          openProductDetail(productId, "store")
        }}
        onIncreaseCartQuantity={(productId) => {
          console.log("Increasing quantity for:", productId)
        }}
        onDecreaseCartQuantity={(productId) => {
          console.log("Decreasing quantity for:", productId)
        }}
      />
    )
  }

  // Routine Recommendations Screen
  if (currentScreen === "routine") {
    return (
      <RoutineRecommendationsScreen
        state="ready"
        report={sampleRoutineReport}
        initialPeriod="morning"
        isOffline={false}
        canOpenStore={true}
        onBack={() => {
          setCurrentScreen(routineBackScreen)
        }}
        onOpenStore={() => {
          setStoreBackScreen("routine")
          setCurrentScreen("store")
        }}
        onOpenProduct={(productId) => {
          openProductDetail(productId, "routine")
        }}
        onOpenAlternatives={(stepId) => {
          console.log("Opening alternatives for step:", stepId)
        }}
      />
    )
  }

  // Full Report Detail Screen
  if (currentScreen === "full-report") {
    return (
      <FullReportDetailScreen
        state="ready"
        report={sampleDetailedReport}
        isOffline={false}
        canBuildRoutine={true}
        onBack={() => {
          setCurrentScreen("results-summary")
        }}
        onOpenRoutine={() => {
          setRoutineBackScreen("full-report")
          setCurrentScreen("routine")
        }}
        onShareReport={() => {
          console.log("Sharing report...")
        }}
        onDownloadReport={() => {
          console.log("Downloading report...")
        }}
        onRetakePhoto={() => {
          setCapturedImageUrl(null)
          setCurrentScreen("image-source")
        }}
        onReviewClassifications={() => {
          console.log("Opening classification review...")
        }}
      />
    )
  }

  // Results Summary Screen
  if (currentScreen === "results-summary") {
    return (
      <ResultsSummaryScreen
        state="ready"
        report={sampleReport}
        isOffline={false}
        canBuildRoutine={true}
        onClose={() => {
          setCurrentScreen(resultsSummaryCloseScreen)
        }}
        onOpenRoutine={() => {
          setRoutineBackScreen("results-summary")
          setCurrentScreen("routine")
        }}
        onOpenDetailedReport={() => {
          setCurrentScreen("full-report")
        }}
        onShareReport={() => {
          console.log("Sharing report...")
        }}
        onDownloadReport={() => {
          console.log("Downloading report...")
        }}
        onRetakePhoto={() => {
          setCapturedImageUrl(null)
          setCurrentScreen("image-source")
        }}
      />
    )
  }

  if (currentScreen === "analysis") {
    return (
      <AnalysisProcessingScreen
        profileName={profileName}
        processingState={analysisProgress >= 100 ? "complete" : "processing"}
        activeStage={activeStage}
        completedStages={completedStages}
        measuredProgressPercent={analysisProgress}
        onCancelAnalysis={() => {
          setCurrentScreen("image-review")
        }}
        onRetryAnalysis={() => {
          setAnalysisProgress(0)
          setActiveStage("preparing-photo")
          setCompletedStages([])
        }}
        onReturnToPhotoReview={() => {
          setCurrentScreen("image-review")
        }}
        onViewResults={() => {
          setResultsSummaryCloseScreen("dashboard")
          setCurrentScreen("results-summary")
        }}
      />
    )
  }

  if (currentScreen === "image-review" && capturedImageUrl) {
    return (
      <SelectedImageReviewScreen
        profileName={profileName}
        imageUrl={capturedImageUrl}
        imageSource={imageSource}
        validationState="passed"
        qualityChecks={{
          "face-visible": "passed",
          "single-face": "passed",
          "frontal-angle": "passed",
          "lighting": "passed",
          "focus": "passed",
          "resolution": "passed",
        }}
        profileConsistencyState="not-required"
        canStartAnalysis={true}
        onBack={() => setCurrentScreen(imageSource === "camera" ? "camera" : "image-source")}
        onUsePhoto={() => {
          setCurrentScreen("analysis")
        }}
        onReplacePhoto={() => {
          setCapturedImageUrl(null)
          setCurrentScreen(imageSource === "camera" ? "camera" : "image-source")
        }}
        onChooseDifferentSource={() => {
          setCapturedImageUrl(null)
          setCurrentScreen("image-source")
        }}
        onChangeProfile={() => {
          setProfileManagementBackScreen("image-review")
          setCurrentScreen("profile-management")
        }}
      />
    )
  }

  if (currentScreen === "camera") {
    return (
      <CameraCaptureScreen
        profileName={profileName}
        permissionState="idle"
        captureReadiness="checking"
        onBack={() => setCurrentScreen("image-source")}
        onRequestCameraAccess={() => {
          console.log("Requesting camera access...")
        }}
        onCapturePhoto={() => {
          console.log("Capturing photo...")
          setCapturedImageUrl(SAMPLE_IMAGE_URL)
          setImageSource("camera")
          setCurrentScreen("image-review")
        }}
        onChooseDifferentSource={() => {
          setCurrentScreen("image-source")
        }}
      />
    )
  }

  if (currentScreen === "image-source") {
    return (
      <ImageSourceSelectionScreen
        profileName={profileName}
        onBack={() => setCurrentScreen(imageSourceBackScreen)}
        onChooseCamera={() => {
          setCurrentScreen("camera")
        }}
        onChooseUpload={() => {
          console.log("Opening photo picker...")
          setCapturedImageUrl(SAMPLE_IMAGE_URL)
          setImageSource("upload")
          setCurrentScreen("image-review")
        }}
        onChangeProfile={() => {
          setProfileManagementBackScreen("image-source")
          setCurrentScreen("profile-management")
        }}
      />
    )
  }

  if (currentScreen === "profile-setup") {
    return (
      <ProfileSetupScreen
        countries={sampleCountries}
        onBack={() => setCurrentScreen(profileSetupBackScreen)}
        onSaveProfile={(profile) => {
          console.log("Profile saved:", profile)
          setProfileName(profile.profileName)
          if (profileSetupBackScreen === "privacy-consent") {
            setManagedProfileDisplayNames((current) => ({
              ...current,
              "profile-001": profile.profileName,
            }))
            setActiveManagedProfileId("profile-001")
          }
          setImageSourceBackScreen(
            profileSetupBackScreen === "dashboard"
              ? "dashboard"
              : profileSetupBackScreen === "profile-management"
                ? "profile-management"
                : "profile-setup",
          )
          setCurrentScreen("image-source")
        }}
      />
    )
  }

  if (currentScreen === "privacy-consent") {
    return (
      <PrivacyAndFacialDataConsentScreen
        consentVersion="1.0.0"
        privacyNoticeVersion="1.0.0"
        onBack={() => setCurrentScreen("welcome")}
        onAcceptConsent={(record) => {
          console.log("Consent accepted:", record)
          setProfileSetupBackScreen("privacy-consent")
          setCurrentScreen("profile-setup")
        }}
        onDeclineConsent={() => {
          console.log("Consent declined")
          setCurrentScreen("welcome")
        }}
        onOpenPrivacyNotice={() => {
          console.log("Opening privacy notice...")
        }}
      />
    )
  }

  return (
    <WelcomeScreen
      onStartAnalysis={() => {
        setCurrentScreen("privacy-consent")
      }}
      onSignIn={() => {
        console.log("Opening sign in...")
      }}
      onOpenGuestScanner={() => {
        setIngredientScannerEntryBackScreen("welcome")
        setIngredientScannerSelectedProfileId(null)
        setCurrentScreen("ingredient-scanner-entry")
      }}
    />
  )
}
