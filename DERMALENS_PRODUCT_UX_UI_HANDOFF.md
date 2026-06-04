# DermaLens Product, UX, UI, and Frontend Continuation Handoff

**Document purpose:** This markdown file is the design and product-intent handoff for the approved DermaLens core experience. Give this file together with the current frontend repository or ZIP to any AI coding assistant before asking it to create new screens, refactor shared components, or wire integrations.

**Audience:** frontend engineers, product designers, UX researchers, design-system maintainers, and AI coding agents.

**Status:** the approved production-design sequence currently contains **17 screens**. The next phase is full-repository integration, shared-component extraction, host-adapter wiring, end-to-end testing, and creation of future routes using the principles below.

---

# 1. Product Summary

DermaLens is a **mobile-first skincare-guidance product**. Its core journey is:

```text
Consent-aware onboarding
→ local-first profile
→ facial-image capture or selection
→ image review and quality validation
→ host-owned analysis
→ calm results summary
→ detailed report
→ personalised routine
→ optional first-party store
→ cart
→ checkout
→ explicit secure-payment handoff
→ payment and order result
```

The product should feel:

- personal, calm, private, and trustworthy
- helpful without being clinical
- visually warm rather than medical
- conversion-aware without pressuring users to buy
- technically defensive around sensitive images, payment status, and host-supplied data

DermaLens is positioned as:

```text
Skincare guidance, not a medical diagnosis.
```

This boundary is not a footer-only disclaimer. It should shape the language, hierarchy, and interaction choices across every facial-analysis, report, routine, and product screen.

---

# 2. Fixed Product Decisions

Treat these as locked unless the product owner explicitly changes them.

## 2.1 Local-first profile with optional cloud sync

- Profiles are local-first.
- Optional cloud-account sync may be introduced or offered by the host.
- Do not claim that all data is always device-only.
- Do not enable cloud sync by default.
- Do not force sign-in to complete the core journey.
- Core onboarding and guest checkout must work without account creation.

## 2.2 First-party store only

- DermaLens sells products itself.
- No affiliate links.
- No marketplace listings.
- No external sellers.
- No sponsored-product framing.
- Store recommendations are optional.
- A skincare routine must remain useful even when the user buys nothing.

## 2.3 UV and AQI integration behind a feature flag

- Environmental UV/AQI functionality is not part of the current screen sequence.
- Do not surface UV-index or AQI UI in new screens unless the feature flag and host contract are intentionally introduced.
- Do not request geolocation simply because environmental features may exist later.

## 2.4 Mobile-first responsive React implementation

- Primary design reference viewport: `390 × 844px`.
- Support narrow mobile from `320px`.
- Scale naturally for tablet and desktop.
- Mobile app behaviour takes priority.
- Desktop layouts should be purposeful adaptations, not stretched mobile canvases.

## 2.5 Guidance, not diagnosis

Across all facial-analysis and report screens:

- Prefer:
  - `visible concerns`
  - `visible patterns`
  - `estimated from this photo`
  - `skincare guidance`
  - `photo-quality context`
- Avoid:
  - `diagnosed conditions`
  - `confirmed acne`
  - `disease detection`
  - `treatment plan`
  - `prescription`
  - definitive identity or medical claims

---

# 3. Brand and Design Mindset

## 3.1 Core brand personality

DermaLens should feel like a thoughtful skincare companion, not a hospital dashboard and not a loud beauty marketplace.

The interface should communicate:

- **Warm expertise:** informed and structured, but not sterile
- **Calm reassurance:** especially around facial data, analysis progress, and payment
- **Respectful restraint:** no exaggerated certainty, aggressive sales tactics, or feature clutter
- **Personal clarity:** explain what is happening, why it matters, and what the user can do next
- **Trust through boundaries:** clearly separate what the frontend displays from what the host adapter owns

## 3.2 Emotional tone by journey stage

| Journey stage | Emotional goal | UI approach |
| --- | --- | --- |
| Welcome | Interest and reassurance | Warm hero, simple CTA, trust statements |
| Consent | Informed control | Clear disclosure, unchecked consent, visible decline path |
| Profile | Low-friction personalisation | One required nickname, optional details collapsed |
| Image source | Confident choice | Recommended guided camera route, visible upload alternative |
| Camera | Focus without overload | One guidance message at a time, dark preview shell only when needed |
| Image review | Control before analysis | Preview, quality checks, clear replace or continue paths |
| Analysis | Patience and trust | Host-driven progress, no fake numbers, no premature findings |
| Results | Calm comprehension | Prioritised summary before deeper detail |
| Routine | Useful guidance | Morning/evening clarity, routine remains useful without purchase |
| Store | Optional conversion | First-party trust, transparent product fit, no pressure |
| Checkout | Confidence and correction | Guest-friendly, clear host-owned totals, internal correction routes |
| Payment | Deliberate trust handoff | Explicit activation, no surprise redirect |
| Result | Certainty without assumptions | Four real outcomes, duplicate-payment warning for pending |

## 3.3 Visual direction

Use a warm skincare editorial system:

- cream and parchment for page and soft surfaces
- blush and peach for warmth and emphasis
- brown for primary actions and text
- warning amber and muted error terracotta only when needed
- no sage green
- no clinical blue
- no bright green success styling

### Approved colour tokens

```ts
export const colors = {
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
```

### Typography

```ts
export const fonts = {
  display: '"DM Serif Display", Georgia, serif',
  ui: '"DM Sans", system-ui, sans-serif',
  metadata: '"Space Mono", monospace',
} as const;
```

Usage:

- **DM Serif Display:** hero headings and important page headings
- **DM Sans:** body copy, labels, buttons, cards, helper text
- **Space Mono:** context labels, compact metadata, eyebrow text

### Spacing

Use a predictable 4px-based system:

```ts
export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;
```

### Radius

```ts
export const radius = {
  sm: "8px",
  md: "12px",
  lg: "20px",
  xl: "28px",
  pill: "999px",
} as const;
```

### Buttons

Primary buttons:

- bark-brown background
- white text
- pill radius
- minimum `52px` height for primary mobile CTAs
- visible brown focus ring
- disabled styles must remain readable
- spinner only on the action actually activated

Secondary actions:

- text or soft-surface buttons
- minimum `44px` target
- underline-on-hover acceptable for compact text actions
- never hide corrective routes merely because the primary action is unavailable

### Cards

Prefer:

- white or parchment background
- subtle borders
- `16px–20px` radius
- clear section headings
- one dominant purpose per card
- warm warning surfaces with readable text rather than colour-only signals

---

# 4. System-Wide UX Rules

## 4.1 Host-owned logic boundary

Screens are presentation components. The host application owns business logic and integrations.

The frontend screen layer should generally **not**:

- call APIs directly
- call `fetch`
- persist sensitive data directly
- calculate pricing
- infer availability
- start camera access automatically
- open file pickers automatically
- perform facial analysis
- simulate analysis progress
- generate skincare routines
- match products
- open payment gateways directly
- infer payment success from a redirect return
- poll payment status automatically

The frontend may:

- render host-supplied data
- perform lightweight local validation
- manage view-only state such as an expanded accordion, local tab, image thumbnail, sheet, or acknowledgement checkbox
- invoke host callbacks after explicit user activation
- show non-blocking toast recovery
- prevent duplicate activation
- fail closed on malformed runtime payloads

## 4.2 Async safety pattern

All callback-driven screens should use:

- mounted ref reset on setup and teardown
- single in-flight operation ref
- local active-operation state
- native `disabled`
- programmatic guards
- non-throwing recovery
- action-scoped pending copy
- five-second toast dismissal where used
- React `StrictMode`-safe effect setup

Recommended baseline:

```tsx
useEffect(() => {
  mountedRef.current = true;

  return () => {
    mountedRef.current = false;
  };
}, []);
```

## 4.3 Accessibility baseline

Every new screen should include:

- one semantic `<h1>`
- semantic buttons and form controls
- visible focus rings
- touch targets at least `44 × 44px`
- readable disabled states
- `role="status"` for non-critical live updates
- `role="alert"` for blocking errors
- narrow live regions that do not wrap interactive controls
- `aria-hidden="true"` on decorative SVGs
- labels that include context for repeated controls
- no meaning communicated through colour alone
- reduced-motion support
- browser zoom preserved
- no autofocus on initial mount unless a specific recovery flow needs it

## 4.4 Mobile-first responsiveness

Baseline:

| Breakpoint | Design approach |
| --- | --- |
| `320–374px` | Narrow mobile; tighter horizontal padding, preserve touch targets |
| `375–767px` | Standard stacked mobile layout |
| `768–1023px` | Centred column or carefully introduced two-column sub-layout |
| `1024px+` | Purposeful two-column layout where useful; no unnecessary desktop navigation |

## 4.5 Offline behaviour

Offline status alone should not automatically disable a screen.

The host decides whether an action can continue offline. Typical pattern:

- cached content remains readable
- unavailable actions show reconnect-specific labels only when the host says they are blocked
- do not conflate offline display with offline capability

## 4.6 Data minimisation and privacy

- Ask only for data needed for the current action.
- Keep facial-data consent explicit and versioned.
- Do not request camera access before explaining why.
- Do not perform identity verification in the frontend.
- Do not persist raw images or opaque payment IDs inside presentation components.
- Use safe display text for host-supplied labels.
- Never render raw payment URLs.

---

# 5. Core Route Map

```text
1. WelcomeScreen
   ↓ Start my skin analysis

2. PrivacyAndFacialDataConsentScreen
   ↓ Agree and continue

3. ProfileSetupScreen
   ↓ Save profile and continue

4. ImageSourceSelectionScreen
   ├── Take a new photo → 5. CameraCaptureScreen
   └── Choose from your device → host-native picker → 6. SelectedImageReviewScreen

5. CameraCaptureScreen
   ↓ Capture photo

6. SelectedImageReviewScreen
   ↓ Use this photo

7. AnalysisProcessingScreen
   ↓ View my results

8. ResultsSummaryScreen
   ↓ View detailed report

9. FullReportDetailScreen
   ↓ Build my routine

10. RoutineRecommendationsScreen
    ├── Product → 13. ProductDetailScreen
    └── Shop routine products → 11. DermaLensStoreRoutineCollectionScreen

11. DermaLensStoreRoutineCollectionScreen
    ├── View cart → 12. CartScreen
    └── Product → 13. ProductDetailScreen

12. CartScreen
    ├── Product → 13. ProductDetailScreen
    └── Continue to checkout → 14. CheckoutContactAndShippingScreen

13. ProductDetailScreen
    ├── Back → host-defined source route
    ├── View cart → 12. CartScreen
    └── Add or update cart → host adapter

14. CheckoutContactAndShippingScreen
    ↓ Continue to review

15. CheckoutReviewScreen
    ↓ Continue to secure payment

16. SecurePaymentGatewayHandoffScreen
    ↓ Explicit user click opens host-owned external gateway

17. OrderConfirmationAndPaymentResultScreen
    ├── View order details → host-owned future OrderDetailsScreen
    ├── Continue shopping → first-party store route
    ├── Check payment status → host refresh adapter
    ├── Try payment again → host prepares replacement session → 16
    └── Back to order review → 15
```

---

# 6. Screen-by-Screen Handoff

---

## Screen 1 — `WelcomeScreen`

### Purpose

Introduce DermaLens, establish trust, and route users into either the primary facial-analysis journey, optional sign-in, or guest ingredient scanning.

### UI structure

1. Brand header
2. Warm hero illustration
3. Eyebrow: `PERSONALISED SKINCARE GUIDANCE`
4. Heading: `Your skin, finally understood.`
5. Supporting copy
6. Trust list:
   - `Private by design`
   - `Skincare guidance, not a medical diagnosis`
7. Optional offline banner
8. Primary CTA: `Start my skin analysis`
9. Optional sign-in prompt
10. Guest scanner card: `Checking a product? Scan ingredients without creating a profile.`
11. Privacy link
12. Disclaimer
13. Privacy sheet
14. Toast region

### UX decisions and rationale

- The screen prioritises one clear primary action while keeping account sign-in optional.
- The guest ingredient scanner is visible because it is a useful low-friction acquisition route.
- Trust messaging appears before the main CTA to reduce anxiety around facial analysis.
- Offline status is informative, not automatically blocking.
- The privacy explanation opens in an accessible sheet to avoid navigating away before the user starts.

### Important states

- default
- preparing route
- offline
- sign-in failure
- guest scanner unavailable offline
- privacy sheet open

### Host boundary

The screen does not create a profile, request a camera, or analyse an image. It only invokes routing callbacks.

### Next routes

- Start analysis → `PrivacyAndFacialDataConsentScreen`
- Sign in → host account flow
- Guest scanner → future guest ingredient-scanner route

---

## Screen 2 — `PrivacyAndFacialDataConsentScreen`

### Purpose

Obtain explicit, informed consent before facial images are captured or stored.

### UI structure

1. Back action
2. Context label
3. Privacy-focused illustration
4. Heading explaining protection
5. Supporting explanation
6. Privacy summary card
7. Guidance-not-diagnosis note
8. Expandable protection details
9. Full Privacy Notice route
10. Native unchecked consent checkbox
11. Sticky footer:
    - `Agree and continue`
    - `Not now`

### UX decisions and rationale

- Consent is specific, affirmative, and unchecked by default.
- The user can decline without being trapped.
- Cloud sync is described as optional and later-enabled, not default.
- The screen avoids unsupported claims such as fixed retention windows or guaranteed end-to-end encryption.
- Consent is versioned so the host can maintain an auditable record.

### Important states

- unchecked default
- consent selected
- submitting
- submission error
- offline local-save message
- privacy details expanded
- Privacy Notice route failure

### Host boundary

The host persists consent version, Privacy Notice version, canonical server timestamp, and revocation status.

### Next routes

- Back → `WelcomeScreen`
- Agree and continue → `ProfileSetupScreen`
- Not now → `WelcomeScreen`
- Privacy Notice → host notice route or modal

---

## Screen 3 — `ProfileSetupScreen`

### Purpose

Create the minimum profile needed to keep scans, routines, and recommendations separate for each person.

### UI structure

1. Back action
2. Context: `CREATE YOUR PROFILE`
3. Warm profile illustration
4. Heading and trust copy
5. Required nickname field
6. Collapsed optional-details accordion:
   - age range
   - primary skincare focus
   - country or region
7. Minor-profile safeguard when applicable
8. Offline note
9. Sticky CTA: `Save profile and continue`

### UX decisions and rationale

- Only nickname is required to reduce friction before a first scan.
- Optional details are collapsed by default.
- Do not ask for skin type or skin tone before analysis.
- Do not request email, password, city, exact date of birth, or GPS.
- Multiple profiles are supported because shared devices and family use are legitimate use cases.
- Minor profiles require a deliberate host policy; the UI blocks unsupported flows when needed.

### Important states

- blank nickname
- validation error
- optional details expanded
- under-18 safeguard
- offline local-save
- saving
- save rejection

### Host boundary

The host persists profile data locally first and may sync later.

### Next routes

- Back → `PrivacyAndFacialDataConsentScreen`
- Save → `ImageSourceSelectionScreen`

---

## Screen 4 — `ImageSourceSelectionScreen`

### Purpose

Let the user choose between guided camera capture and selecting an existing image.

### UI structure

1. Back action
2. Active-profile card
3. Heading
4. Supporting copy
5. Offline note when needed
6. Source cards:
   - `Take a new photo` with Recommended badge
   - `Choose from your device`
7. Photo tips
8. Review-before-analysis note
9. Optional Change Profile action
10. Toast region

### UX decisions and rationale

- Camera capture is recommended because guided capture generally improves consistency.
- Upload remains clearly visible and easy to use.
- No permission prompt or picker opens on mount.
- Unavailable source cards remain visible with readable explanations instead of disappearing.
- Showing the active profile prevents accidental scan-history mixing.

### Important states

- both sources available
- camera unavailable
- upload unavailable
- both unavailable
- offline
- route opening
- callback rejection

### Host boundary

- Camera card routes to `CameraCaptureScreen`.
- Upload invokes a host-native picker only after user activation.
- The component renders no file input.

### Next routes

- Camera → `CameraCaptureScreen`
- Upload → host picker → `SelectedImageReviewScreen`
- Change profile → host profile switcher

---

## Screen 5 — `CameraCaptureScreen`

### Purpose

Explain camera access, show a live host-provided preview, and capture a still image only after explicit user activation.

### UI structure

Two major modes:

#### Permission and recovery mode

1. Back action
2. Context and heading
3. Explanation of why camera access is needed
4. Trust list
5. Offline banner when applicable
6. Primary: `Allow camera access`
7. Secondary: `Choose another method`
8. Denied, unavailable, and error recovery options

#### Live-preview mode

1. Dark neutral preview shell
2. Host-provided `<video>` stream
3. Safe-area top bar
4. Active-profile pill
5. Face-guide overlay
6. One concise readiness message at a time
7. Shutter
8. Optional switch-camera control
9. Compact offline note

### UX decisions and rationale

- Permission is contextual and user-triggered.
- The screen may attach `previewStream` to `video.srcObject`, but it must not call `getUserMedia()` itself.
- The default front-facing preview may be mirrored visually, but text overlays must not be mirrored.
- The shutter remains disabled until the host says the preview is ready.
- Avoid flash controls, technical confidence scores, facial-analysis results, and excessive live guidance.

### Important states

- idle permission
- requesting
- granted without stream
- live preview
- denied
- unavailable
- error
- capture pending
- switch-camera pending
- offline

### Host boundary

The host owns permission request, `MediaStream`, track cleanup, still-image capture, persistence, and routing.

### Next routes

- Back or different source → `ImageSourceSelectionScreen`
- Capture → `SelectedImageReviewScreen`
- Device settings → host-native settings route

---

## Screen 6 — `SelectedImageReviewScreen`

### Purpose

Let users review the chosen photo, understand quality checks, resolve profile-consistency issues, and explicitly approve analysis.

### UI structure

1. Back action
2. Active-profile row
3. Image preview card
4. Photo-quality card
5. Profile-consistency card
6. Offline note
7. Sticky footer:
   - camera source: `Retake photo`
   - upload source: `Choose another photo`
   - `Choose another method`
   - primary: `Use this photo`

### UX decisions and rationale

- Review happens before analysis.
- Image suitability, profile consistency, and skin analysis are clearly separated.
- Quality checks may run before the user proceeds.
- The component avoids definitive identity language.
- A first scan can proceed without requiring an existing reference image.
- Failed validation remains actionable.
- The user always has a replace-photo path.

### Important states

- image loading
- image failure
- validation checking
- validation passed
- validation failed
- validation error
- profile match not required
- careful matched state
- profile mismatch
- offline
- proceed pending

### Host boundary

The host owns image URL lifecycle, object-URL revocation, validation, profile-consistency safeguard, image persistence policy, and routing.

### Next routes

- Use this photo → `AnalysisProcessingScreen`
- Retake → `CameraCaptureScreen`
- Replace upload → host picker
- Different source → `ImageSourceSelectionScreen`
- Change or create profile → host route

---

## Screen 7 — `AnalysisProcessingScreen`

### Purpose

Reassure users while the host analyses the selected image and prepares a report.

### UI structure

1. Context label: `ANALYSING PHOTO`
2. Profile label
3. Heading: `Analysing your skin…`
4. Supporting copy
5. Host-driven stage list:
   - Preparing your photo
   - Mapping facial regions
   - Reviewing visible concerns
   - Preparing personalised guidance
   - Finalising your report
6. Optional measured progress
7. Privacy note
8. Guidance-not-diagnosis note
9. Longer-than-expected note when applicable
10. Cancel action with accessible confirmation sheet
11. Complete-state fallback: `View my results`

### UX decisions and rationale

- Do not fabricate percentages.
- Do not derive progress from time or stage index.
- Do not show findings before completion.
- The host may provide measured progress if real.
- Stage changes come only from the host.
- Cancellation requires confirmation because it stops active work.
- Offline local processing and offline waiting are distinct states.

### Important states

- preparing
- processing
- waiting for connection
- processing locally
- complete
- error
- longer than expected
- cancel sheet open
- retry pending

### Host boundary

The host owns orchestration, progress, retries, cancellation, persistence, and results routing.

### Next routes

- Complete → `ResultsSummaryScreen`
- Return to review → `SelectedImageReviewScreen`
- Cancel confirmed → host-defined route

---

## Screen 8 — `ResultsSummaryScreen`

### Purpose

Provide a calm, understandable first view of the completed analysis before exposing deeper detail.

### UI structure

1. Back or route context as needed
2. Summary heading and profile context
3. Guidance boundary
4. Optional limited-confidence banner with retake path
5. Snapshot card
6. Priority highlights card showing a maximum of the first three host-prioritised highlights
7. Summary highlight rows:
   - title
   - host-supplied level label
   - short explanation
8. Positive, attention, and neutral chip tones
9. Primary CTA: `View detailed report`
10. Optional rebuild or retake path where host supports it

### UX decisions and rationale

- The summary should reduce anxiety and cognitive load.
- Show only the most relevant first-layer content.
- Preserve host order rather than re-ranking in the component.
- Use blush for positive states, warning tone for attention, and parchment for neutral.
- Avoid green success styling.
- If confidence is limited, explain it and offer a practical recovery route.
- Do not overwhelm users with maps, metrics, or full facial-region detail yet.

### Important states

- loading
- ready
- limited confidence
- empty highlights
- error
- offline cached result
- route pending

### Host boundary

The host owns findings, priority order, level labels, confidence state, and routing.

### Next routes

- Detailed report → `FullReportDetailScreen`
- Retake photo → host image-source flow

---

## Screen 9 — `FullReportDetailScreen`

### Purpose

Expand the completed report into a rich but non-diagnostic exploration of the user’s skin snapshot.

### UI structure

1. Top bar
2. Heading: `Explore your skin snapshot`
3. Guidance note: `This report provides skincare guidance, not a medical diagnosis.`
4. Snapshot overview
5. Skin-type estimate
6. Skin-tone estimate
7. Optional estimate-review action
8. Annotated face-map card with hide/reveal privacy control
9. Region chips
10. Region-specific findings
11. Natural features shown separately from visible concerns
12. Estimated measurements accordion, collapsed by default
13. Photo-quality context accordion, collapsed by default
14. Report actions sheet:
    - Share
    - Download
    - Use another photo
15. Sticky CTA: `Build my routine`

### UX decisions and rationale

- The detailed route is intentionally separate from the summary route.
- Maps remain optional and privacy-aware.
- A map failure must not make the text report unusable.
- Natural features are not warning states.
- Host ordering is preserved.
- Metrics and quality context remain collapsed by default to prevent overload.
- Share and download are deliberate actions in an accessible sheet.

### Important states

- loading
- ready
- error
- offline cached report
- map hidden
- map revealed
- map failed
- selected region changed
- actions sheet open
- routine route blocked

### Host boundary

The host owns all classifications, findings, map assets, object-URL lifecycle, save status, share/download adapters, and routine routing.

### Next routes

- Back → `ResultsSummaryScreen`
- Build routine → `RoutineRecommendationsScreen`
- Retake → image-source flow
- Review estimates → host route or sheet

---

## Screen 10 — `RoutineRecommendationsScreen`

### Purpose

Present a host-generated morning and evening skincare routine with optional first-party product suggestions.

### UI structure

1. Top bar
2. Heading: `Your personalised routine`
3. Guidance disclaimer
4. Optional-purchase message: `You can follow this routine with suitable products you already own. Store recommendations are optional.`
5. Morning and evening tabs or segmented control
6. Ordered routine-step cards
7. Step label, timing, frequency, usage instructions
8. Collapsed rationale details
9. Optional product recommendation preview
10. Unavailable-product messaging when relevant
11. Product alternatives route
12. Primary: `Shop routine products`

### UX decisions and rationale

- Routine value must not depend on conversion.
- Morning and evening separation mirrors user behaviour.
- Preserve host ordering; skincare layering order matters.
- Avoid ranking or matching in the UI layer.
- Keep rationale collapsed by default to maintain scanability.
- Product alternatives remain host-owned.

### Important states

- loading
- ready
- empty period
- offline cached routine
- store unavailable
- product unavailable
- route pending
- retry

### Host boundary

The host owns routine generation, ordering, product matching, pricing, availability, alternatives, persistence, and navigation.

### Next routes

- Back → `FullReportDetailScreen`
- Shop routine products → `DermaLensStoreRoutineCollectionScreen`
- Product → `ProductDetailScreen`
- Alternatives → host route or sheet

---

## Screen 11 — `DermaLensStoreRoutineCollectionScreen`

### Purpose

Show a focused first-party product collection matched to routine steps while keeping purchases optional.

### UI structure

1. Top bar with cart count when valid
2. Heading: `Products matched to your routine`
3. Optional-purchase explanation
4. First-party store trust card: `All products shown here are sold directly by DermaLens.`
5. Local filters:
   - All products
   - Morning
   - Evening
6. Product cards in host order
7. Product metadata
8. Matched-step labels
9. Availability state
10. Direct add or choose-options action
11. Quantity stepper where applicable
12. View details
13. Sticky cart footer where applicable

### UX decisions and rationale

- The screen narrows the store to routine-relevant products.
- Local filtering improves scanability without changing host ordering.
- Unavailable products stay visible.
- Product-card controls use product-specific accessible labels.
- Cart quantities, subtotal strings, and product matching remain host-owned.
- Product IDs may repeat; pending feedback must be scoped to the exact collection item.

### Important states

- loading
- ready
- empty filter
- unavailable product
- invalid cart count
- direct add pending
- product route pending
- quantity pending
- offline restrictions
- error

### Host boundary

The host owns matching, order, availability, pricing, cart quantities, cart persistence, and routes.

### Next routes

- Back → `RoutineRecommendationsScreen`
- Product details → `ProductDetailScreen`
- View cart → `CartScreen`

---

## Screen 12 — `CartScreen`

### Purpose

Let the user review, correct, and confirm first-party cart lines before checkout.

### UI structure

1. Top bar with count
2. Heading: `Review your cart`
3. Supporting copy
4. First-party boundary note
5. Optional availability banner
6. Cart-line cards
7. Each line:
   - image
   - brand and product
   - selected options
   - availability
   - quantity stepper
   - View details
   - Remove item
8. Order summary card
9. Optional-purchase note
10. Sticky footer:
    - host total or subtotal
    - `Continue to checkout`
    - `Continue shopping`

### UX decisions and rationale

- Use `cartItemId` for line mutations because variants may share a product ID.
- Use `productId` only for product-detail routing.
- Keep unavailable items visible for recovery.
- Do not silently remove zero-quantity or malformed lines.
- Monetary strings render exactly as supplied.
- No promo-code UI in this screen.

### Important states

- loading
- ready
- limited availability
- empty
- error
- offline readable cart
- mutation blocked
- checkout blocked
- quantity pending
- remove pending
- image failure

### Host boundary

The host owns cart persistence, line mutation, variants, totals, eligibility, and APIs.

### Next routes

- Back or continue shopping → collection
- Product detail → `ProductDetailScreen`
- Checkout → `CheckoutContactAndShippingScreen`

---

## Screen 13 — `ProductDetailScreen`

### Purpose

Help users evaluate one first-party product, choose variants, understand routine fit, and update the host-owned cart.

### UI structure

1. Top bar with cart count
2. Image gallery
3. Product identity:
   - brand
   - name
   - category
   - price
   - availability
4. One first-party trust boundary: `Sold directly by DermaLens.`
5. Optional routine-fit card
6. Variant fieldsets with native radios
7. Usage directions
8. Key ingredients
9. Full ingredient list accordion
10. Product badges
11. Optional review summary
12. Optional-purchase note
13. Sticky purchase footer:
   - price
   - Add to cart or quantity controls
   - View cart

### UX decisions and rationale

- The product route works from routine, collection, or cart.
- Back destination is host-defined.
- Variant selection is controlled by the host; the component does not infer valid combinations.
- Missing adapters render disabled controls rather than silent no-op controls.
- Unavailable options remain visible but disabled.
- Thumbnail errors are keyed by product ID, image ID, and URL so replacement assets can recover.
- Toast offset changes for compact vs expanded footer layouts.
- The first-party trust statement renders once.

### Important states

- loading
- ready
- error
- image missing or failed
- option pending
- unavailable variant
- product unavailable
- add blocked
- add pending
- existing cart line
- quantity pending
- cart route blocked
- offline

### Host boundary

The host owns variant resolution, pricing, compatibility copy, images, cart mutation, reviews, and navigation.

### Next routes

- Back → host-defined
- View cart → `CartScreen`
- Read reviews → host route or sheet
- Add/update → host cart adapter

---

## Screen 14 — `CheckoutContactAndShippingScreen`

### Purpose

Collect contact and delivery details before order review, while preserving guest checkout and keeping payment separate.

### UI structure

1. Top bar
2. Heading: `Where should we deliver your order?`
3. Review-before-payment explanation
4. Guest-checkout note
5. Compact cart summary
6. Saved delivery details fieldset when available
7. `Use a different address`
8. Contact form:
   - full name
   - email
   - phone
9. Delivery form:
   - address line 1
   - address line 2 optional
   - city
   - region
   - postal code
   - country
10. Save-on-device checkbox
11. Optional account-sync helper text
12. Privacy and payment note
13. Sticky footer:
   - subtotal if supplied
   - `Continue to review`
   - `Back to cart`

### UX decisions and rationale

- Guest checkout is mandatory.
- The screen may manage an in-memory draft but not persistence.
- Saved addresses populate an editable draft locally.
- Country membership is checked against host-supplied options.
- A removed selected saved address clears the stale association but preserves typed values.
- Editing a field dismisses only the currently displayed host error value; a new host message can reappear.
- The sticky CTA is semantically associated with the form so keyboard submission works.
- Payment fields are intentionally absent.

### Important states

- loading
- ready
- error
- saved address selected
- new address
- validation errors
- host field errors
- host form error
- offline
- continuation blocked
- submission pending

### Host boundary

The host owns persistence, serviceability checks, deep validation, pricing, and routing.

### Next routes

- Back or Edit cart → `CartScreen`
- Continue → `CheckoutReviewScreen`

---

## Screen 15 — `CheckoutReviewScreen`

### Purpose

Provide the final in-app checkpoint before secure payment.

### UI structure

1. Top bar
2. Heading: `Review your order`
3. Guest-checkout note
4. Payment-next explanation
5. Optional attention banner
6. Delivery-details card with Edit details
7. Order-items card with Edit cart
8. Shipping-options fieldset
9. Pricing-summary card
10. Optional acknowledgement checkbox
11. Payment-handoff note
12. Sticky footer:
   - host total
   - `Continue to secure payment`
   - `Back to details`

### UX decisions and rationale

- Payment data is not collected here.
- Pricing is host-owned.
- Shipping radios remain controlled by the host.
- An existing but unavailable selected shipping option is treated as invalid.
- Any payment block reason is authoritative.
- Corrective Back navigation remains enabled when payment is blocked.
- Acknowledgement acceptance resets when the review ID or acknowledgement wording changes.
- Item quantities include product context for assistive technology.

### Important states

- loading
- ready
- attention
- empty cart
- error
- shipping missing
- shipping unavailable
- acknowledgement required
- payment blocked
- offline
- shipping update pending
- handoff route pending

### Host boundary

The host owns contact details, delivery details, shipping options, prices, eligibility, payment-route availability, and routing.

### Next routes

- Back or Edit details → `CheckoutContactAndShippingScreen`
- Edit cart → `CartScreen`
- Continue → `SecurePaymentGatewayHandoffScreen`

---

## Screen 16 — `SecurePaymentGatewayHandoffScreen`

### Purpose

Act as a short, explicit trust checkpoint before the host opens an external payment page.

### UI structure

1. Top bar: `SECURE PAYMENT`
2. Lock or shield illustration
3. Heading: `Continue to secure payment`
4. Supporting explanation
5. Security note: `DermaLens will never ask you to enter card details on this screen.`
6. Return-after-payment note
7. Compact summary:
   - order reference
   - items
   - total
8. Gateway card:
   - provider label
   - optional safe destination label
   - optional expiry label
   - optional helper copy
9. External-handoff note
10. Sticky footer:
    - `Continue to secure payment`
    - `Back to order review`

### UX decisions and rationale

- No automatic redirect.
- Gateway opening requires an intentional click.
- The component accepts no raw URL prop.
- Raw or unsafe destination labels are omitted.
- Safe plain-domain labels may render as plain text, never as anchors.
- Required metadata is validated defensively.
- Zero or invalid item counts block gateway opening.
- Unknown runtime block reasons and session statuses fail closed.
- Loading-state Back remains available normally but locks during a local request.
- Session expiry is host-supplied; no countdown timer.

### Important states

- loading
- ready
- blocked
- expired
- error
- offline
- gateway opening pending
- retry prepare pending

### Host boundary

The host owns session creation, URL, provider configuration, external navigation, return URL, expiry state, persistence, and payment-result routing.

### Next routes

- Back → `CheckoutReviewScreen`
- Open gateway → host external navigation
- Retry expired session → host prepare
- Provider return → `OrderConfirmationAndPaymentResultScreen`

---

## Screen 17 — `OrderConfirmationAndPaymentResultScreen`

### Purpose

Display the latest host-supplied payment and order result after the user returns from the external provider.

### Supported outcomes

| Status | Heading | Primary action |
| --- | --- | --- |
| Confirmed | `Order confirmed` | `View order details` or Continue shopping fallback |
| Pending | `Payment confirmation pending` | `Check payment status` |
| Failed | `Payment was not completed` | `Try payment again` |
| Cancelled | `Payment was cancelled` | `Try payment again` |

### UI structure

1. Top bar: `ORDER STATUS`
2. Warm status illustration
3. Status heading and supporting copy
4. Pending duplicate-payment warning when applicable
5. Payment-status card
6. Compact order summary
7. Optional delivery card
8. Optional host status note
9. Payment-boundary note
10. Sticky footer with status-specific actions

### UX decisions and rationale

- Returning from the payment provider does not prove success.
- Pending status must warn: `Avoid submitting another payment while this result is pending.`
- No automatic status refresh.
- No polling.
- No auto-retry.
- No redirect.
- Refresh and retry actions are user-activated host callbacks.
- Opaque identifiers are submitted to adapters but never rendered.
- Safe-label filtering rejects embedded schemes and scheme-less domain paths, queries, fragments, and backslash paths.
- Plain domain text such as `payments.example.com` may render safely.
- Required total labels and confirmed order-reference labels must be display-safe.
- Footer pending feedback is scoped to the action the user activated.
- Missing refresh or retry adapters fail closed with readable unavailable labels.

### Important states

- loading
- confirmed
- pending
- failed
- cancelled
- error
- offline readable result
- route blocked
- retry pending
- refresh pending
- view order pending
- continue-shopping pending

### Host boundary

The host owns result retrieval, persistence, order creation, status refresh, retry-session preparation, routing, and APIs.

### Next routes

- View order → future host-owned `OrderDetailsScreen`
- Continue shopping → first-party store
- Back to review → `CheckoutReviewScreen`
- Check status → host refresh adapter
- Try payment again → host replacement session → `SecurePaymentGatewayHandoffScreen`

---

# 7. Shared Components to Extract During Integration

Do not refactor blindly. Preserve existing behaviour and tests while extracting shared primitives.

Recommended shared layer:

```text
design-system/
├── tokens.ts
├── typography.ts
├── focusRing.ts
├── AppShell.tsx
├── TopBar.tsx
├── StickyFooter.tsx
├── ToastRegion.tsx
├── PrimaryButton.tsx
├── SecondaryButton.tsx
├── Card.tsx
├── Banner.tsx
├── SkeletonBlock.tsx
├── EmptyState.tsx
├── ErrorState.tsx
├── AccessibleSheet.tsx
├── QuantityStepper.tsx
├── ProductImage.tsx
└── safeDisplayText.ts
```

Potential feature modules:

```text
features/
├── onboarding/
├── facial-data/
├── capture/
├── analysis/
├── reports/
├── routine/
├── store/
├── cart/
├── checkout/
└── payment/
```

---

# 8. Host Adapter Contract Direction

New work should introduce a clean host integration layer rather than adding direct calls inside screens.

Recommended domains:

```text
host-adapters/
├── profileAdapter.ts
├── consentAdapter.ts
├── imageSourceAdapter.ts
├── cameraAdapter.ts
├── imageReviewAdapter.ts
├── analysisAdapter.ts
├── reportAdapter.ts
├── routineAdapter.ts
├── catalogueAdapter.ts
├── cartAdapter.ts
├── checkoutAdapter.ts
├── paymentAdapter.ts
└── orderAdapter.ts
```

Rules:

- Screens receive props and callbacks.
- Adapters call APIs or platform features.
- Route controllers own navigation.
- Presentation components remain deterministic and testable.
- All host data should be validated before enabling trust-critical actions.
- Preserve host ordering unless a screen explicitly documents local filtering.

---

# 9. Future Screens and Roadmap Routes

The 17 approved screens cover the core onboarding, analysis, routine, first-party store, checkout, payment-handoff, and result sequence.

Likely future routes include:

## 9.1 Guest Ingredient Scanner

Entry points:

- Welcome guest scanner card
- Future signed-in tool navigation

Design principles:

- works without account creation
- manual ingredient input and host-native scan route can be supported
- no medical claims
- explain flags carefully
- profile-aware results only when a usable profile exists
- do not force facial analysis

## 9.2 Home or Dashboard

Possible content:

- active profile
- start new scan
- latest snapshot
- morning/evening routine shortcut
- saved routine
- order shortcut
- guest scanner shortcut
- environmental module only behind feature flag

Avoid:

- cluttered all-in-one dashboard
- fake metrics
- clinical monitoring tone
- forced upsell panels

## 9.3 Progress Tracking

Possible content:

- host-owned scan history
- comparison between explicitly selected scans
- date labels
- photo-quality context
- routine adherence prompts if available

Avoid:

- ungrounded trend claims
- medical improvement claims
- calculated metrics not supplied by the host
- automatic face-image persistence inside presentation components

## 9.4 Order Details

Entry:

- Screen 17 confirmed result

Possible content:

- order reference
- host-owned status
- items
- delivery address summary
- shipping updates
- receipt
- support route

Avoid:

- calculating totals
- direct logistics API calls
- exposing opaque payment IDs

## 9.5 Account and Optional Sync

Possible content:

- sign in
- optional sync explanation
- profile list
- revoke consent
- delete saved facial data request
- device-local vs synced state labels

Avoid:

- forcing sync
- claiming universal device-only storage
- enabling sync without explicit user action

---

# 10. Prompt Template for Creating a New Screen

Copy this template when asking an AI coding assistant to create the next screen.

```text
You are extending the DermaLens frontend.

Read:
1. The complete current frontend repository
2. DERMALENS_PRODUCT_UX_UI_HANDOFF.md
3. Existing tests and README integration notes for adjacent screens

Build:
<NewScreenName>.tsx

Also return:
1. <NewScreenName>.test.tsx
2. A concise README integration section

Use React + TypeScript + Tailwind CSS.
Do not use external component libraries unless the repository already standardises one.

Before writing code:
- identify the previous route
- identify the next routes
- identify host-owned data and callbacks
- identify presentation-only local state
- preserve the approved warm peach/blush/cream/parchment/brown system
- avoid sage green and clinical blue
- preserve guidance-not-diagnosis language
- keep sign-in optional unless the product owner explicitly changes that rule
- do not add affiliate links, external sellers, or marketplace UI
- keep UV/AQI behind a feature flag
- do not add direct API calls inside the screen
- use StrictMode-safe mounted tracking
- prevent duplicate activation
- keep offline readability separate from host action availability
- use narrow live regions
- keep repeated-control accessible names contextual
- add empty, loading, error, blocked, offline, and callback-rejection states
- write regression tests for architecture boundaries

When host data is trust-critical:
- validate required values defensively
- fail closed on malformed runtime values
- render only safe display labels
- never expose opaque IDs
- never infer business success from route entry alone

Return complete files, not partial snippets.
```

---

# 11. New-Screen Review Checklist

Use this before approving any new route.

## Product

- Does the screen serve one clear user goal?
- Does it preserve guidance-not-diagnosis positioning?
- Does it avoid unnecessary data collection?
- Does it keep account creation optional where possible?
- Does it preserve first-party store boundaries?
- Does it avoid UV/AQI unless feature-flagged?

## UX

- Is the primary action obvious?
- Is a recovery path visible?
- Are unavailable items visible with explanations?
- Are empty, loading, error, blocked, and offline states included?
- Does corrective navigation remain enabled when the primary action is blocked?
- Is pending feedback shown on the activated action only?

## UI

- Uses approved warm palette
- No sage green
- No clinical blue
- No loud marketplace styling
- Appropriate typography hierarchy
- Primary CTA at least `52px`
- Other touch targets at least `44px`
- Sticky footer does not obscure content

## Accessibility

- One `<h1>`
- Semantic controls
- Visible focus rings
- Repeated controls include context
- Static error regions contain no buttons
- Live regions are narrow
- Reduced motion supported
- No autofocus on initial mount
- No colour-only communication

## Architecture

- No direct `fetch`
- No direct persistence writes
- No frontend pricing calculations
- No frontend analysis inference
- No direct camera or picker calls unless owned by a host adapter
- No direct external gateway opening in presentation screens
- No raw URL props where a host callback should be used
- No opaque IDs rendered
- Runtime payloads validated defensively
- StrictMode-safe mounted ref
- Duplicate activation prevented
- Browser API test mocks restored

---

# 12. AI Handoff Instruction

When continuing the product with an AI coding assistant, provide:

1. the frontend ZIP
2. this markdown file
3. the exact next screen or integration task
4. the instruction:
   ```text
   Treat the repository code and tests as the implementation source of truth.
   Treat DERMALENS_PRODUCT_UX_UI_HANDOFF.md as the product, UX, UI, and architecture intent source of truth.
   Do not redesign approved screens unless integration exposes a real defect.
   Return complete updated files and preserve all existing tests.
   ```

---

# 13. Current Recommended Next Phase

The approved screen-by-screen design sequence is complete.

Proceed in this order:

1. Full-repository strict TypeScript compilation
2. Run all Vitest suites
3. Production build
4. Lint and unused-helper scan
5. Wire the route map
6. Introduce host adapters
7. Extract shared design-system primitives without behaviour changes
8. Add end-to-end tests
9. Run responsive visual QA
10. Run keyboard, screen-reader, reduced-motion, and zoom QA
11. Begin future routes using the prompt template above

---

# 14. Final Non-Negotiables

Do not introduce any of the following unless the product owner explicitly changes direction:

```text
sage-green palette
clinical-blue styling
green success styling
medical-diagnosis positioning
affiliate links
external seller routes
marketplace UI
sponsored products
forced account creation
required sign-in for the core funnel
default-enabled cloud sync
raw payment URLs
external payment anchors inside presentation screens
automatic gateway redirects
automatic payment retries
payment polling
frontend pricing calculations
frontend facial-analysis calculations
frontend routine generation
frontend product matching
unflagged UV/AQI UI
unnecessary geolocation
fake progress
fake checkout steps
bottom navigation added merely for decoration
```

The product should continue to feel:

```text
Warm.
Private by design.
Guidance-first.
Optional-commerce.
Explicitly user-activated.
Host-integrated.
Defensive at trust-critical boundaries.
```
