# DermaLens Frontend

## Checkout Review Route Integration

The current demo controller routes the checkout sequence as:

```text
CheckoutContactAndShippingScreen
-> CheckoutReviewScreen
-> SecurePaymentGatewayHandoffScreen
-> host-owned external gateway
-> host-handled provider return and latest result retrieval
-> OrderConfirmationAndPaymentResultScreen
```

`app/page.tsx` uses demo fixtures only. Submitted delivery details are held in controller-owned in-memory demo state, and navigating back to edit details repopulates the last submitted draft. There is no persistence write to local storage, session storage, IndexedDB, cookies, or an API.

Checkout pricing remains host-supplied display data, and the screen never calculates subtotal, shipping, tax, or totals. Shipping selection is also controller-owned: `CheckoutReviewScreen` receives the selected shipping option through `report.selectedShippingOptionId`, calls `onSelectShippingOption`, and the demo controller refreshes the report state.

Opaque checkout IDs are passed into callbacks for host adapters but are not rendered manually by the route controller. Secure payment still requires an explicit user click on the payment-handoff screen. Opening the gateway does not infer successful payment, and order confirmation remains the host-owned provider-return destination after the latest payment result has been retrieved.

## Product Detail Route Integration

The current demo controller routes product detail entry points as:

```text
RoutineRecommendationsScreen
-> ProductDetailScreen

DermaLensStoreRoutineCollectionScreen
-> ProductDetailScreen

CartScreen
-> ProductDetailScreen
```

Back returns to the source route that opened the product, and View cart routes to `CartScreen`. The current product-detail payloads are demo fixtures only; pricing, availability, variants, cart lines, cart totals, and product matching remain host-owned.

Product-detail callbacks currently log future host-adapter actions only. No direct API call or persistence write was introduced, and no affiliate, marketplace, external seller, or sponsored product route was added. Unknown product IDs fail closed into the existing ProductDetailScreen error view.

## Testing Foundation

This repository uses Vitest with React Testing Library for focused route-controller tests. The setup lives in `vitest.config.ts` and `vitest.setup.ts`, uses the `jsdom` environment, loads `@testing-library/jest-dom/vitest`, and resolves the existing `@/` alias to the repository root.

Commands:

```text
pnpm test
pnpm test:watch
pnpm test:route
```

The route-controller tests in `app/page.test.tsx` intentionally mock presentation components so they validate `app/page.tsx` routing and controller-owned state without duplicating screen-level coverage. No production UI behavior changed in this checkpoint.

## Screen-Level Regression Suites

Approved screen-level Vitest suites now live beside their corresponding production components in `components/`. `pnpm test` runs both the route-controller suite and all component-level regression suites, while `pnpm test:route` runs only the focused `app/page.test.tsx` route suite.

This was a test-import-only checkpoint. Production components and `app/page.tsx` were not changed during the import. All supplied approved source test files were available and imported.

## HomeDashboardScreen Integration

`HomeDashboardScreen` is Screen 18, a returning-user home base after a local profile exists. In the demo route controller, closing a completed scan result now routes into the dashboard:

```text
ResultsSummaryScreen
-> Close
-> HomeDashboardScreen
```

First-time profile setup still routes directly to `ImageSourceSelectionScreen`, so the first scan flow remains unchanged. Production launch routing and returning-user detection remain host-owned; the demo does not infer returning-user state from local storage, session storage, IndexedDB, cookies, or any other persistence.

The intended route map is host-owned entry into dashboard after a profile exists, with user-activated routes out to new scan, latest report, active routine, ingredient scanner, progress, orders, store, and recent-order details. The dashboard renders profile, snapshot, routine, order, scanner, progress, store, sync, UV, and AQI values only as host-supplied display data and callback availability.

Current demo dashboard routes:

```text
Start new scan -> ImageSourceSelectionScreen
Change profile -> ProfileSwitcherAndManagementScreen
Latest report -> ResultsSummaryScreen
Active routine -> RoutineRecommendationsScreen
Ingredient scanner -> GuestIngredientScannerEntryScreen
Store -> DermaLensStoreRoutineCollectionScreen
```

The demo route controller owns source-aware Back context for routes that can now be opened from more than one place. Dashboard-origin actions set Back to the dashboard for Start new scan, Change profile, Active routine, and Store. Non-dashboard entries reset their local sources: consent keeps profile Back on Privacy consent, first-time profile save keeps image-source Back on Profile setup, profile-management Add profile keeps image-source Back on Profile management after Save, results-summary routine entry returns to Results summary, full-report routine entry returns to Full report, routine store entry returns to Routine, and Continue shopping resets Store Back to Routine.

Dashboard active-profile context now follows the controller-owned managed-profile selection. Selecting a known managed profile updates the in-memory active opaque profile ID used by the dashboard report, and Dashboard Start new scan passes that currently active profile ID into its callback. Known demo managed-profile labels are also held in controller-owned in-memory fixture state, so switching away from the primary profile and back does not silently reset its saved demo name.

Progress, Orders, and Recent-order details remain visible but disabled because those future routes are not integrated into the demo route controller yet. `ProgressTrackingScreen` now exists as a standalone Screen 23 component, but `app/page.tsx` still keeps the Dashboard Progress action disabled. The Dashboard ingredient scanner route is enabled and opens `GuestIngredientScannerEntryScreen` with the active managed profile supplied as optional local-profile context.

The screen preserves the local-first helper copy, `Your profile stays local unless you choose to sync it.`, and positions sync as optional. UV/AQI content remains behind `showEnvironmentalModule`; when the flag is false, environmental payloads are not rendered, and the screen never requests location data or fetches environmental values directly.

Offline status is informational: locally supplied profile, snapshot, routine, and order content remains readable. Blocked actions stay visible with disabled labels, callback rejections become non-blocking toast messages, and opaque IDs remain callback-only context.

Dashboard profile context fails closed when the host supplies a blank or whitespace-only profile ID or display name, and Start scan is not activated without usable profile context. Latest-report, routine, and recent-order cards remain readable when their required route IDs are blank, but their actions stay visible and disabled.

Environmental availability requires at least one usable UV or AQI measurement. Guidance and timestamp metadata may supplement a UV/AQI value, but they do not independently make the environmental card available. Whitespace-only snapshot image URLs render the local `Snapshot image unavailable` placeholder instead of an image element.

No API calls, persistence writes, geolocation requests, direct environmental fetches, affiliate routes, marketplace routes, or host-adapter modules were introduced. The dashboard regression suite lives at `components/home-dashboard-screen.test.tsx`, and route-controller coverage for the demo integration lives in `app/page.test.tsx`.

## ProfileSwitcherAndManagementScreen Integration

`ProfileSwitcherAndManagementScreen` is Screen 19, a returning-user profile-management route now integrated into `app/page.tsx`. It opens from:

```text
HomeDashboardScreen
-> Change profile
-> ProfileSwitcherAndManagementScreen

ImageSourceSelectionScreen
-> Change profile
-> ProfileSwitcherAndManagementScreen

SelectedImageReviewScreen
-> Change profile
-> ProfileSwitcherAndManagementScreen

GuestIngredientScannerEntryScreen
-> Change profile
-> ProfileSwitcherAndManagementScreen

IngredientInputReviewScreen
-> Change profile
-> ProfileSwitcherAndManagementScreen
```

Profile-management Back is source-aware and returns to Dashboard, Image source, Image review, Scanner entry, or Ingredient input review. Selecting a profile uses controller-owned in-memory demo activation, updates the demo profile name from the selected host-supplied display name, and returns to the source route without persistence:

```text
Dashboard Change profile -> Profile management
Image-source Change profile -> Profile management
Image-review Change profile -> Profile management
Scanner-entry Change profile -> Profile management
Ingredient-input review Change profile -> Profile management
Profile management Back -> source-aware Dashboard, Image source, Image review, Scanner entry, or Ingredient input review
Select profile -> controller-owned demo activation -> return to source
```

Dashboard scan activation receives the currently active managed-profile ID. Selected-image review retains its chosen image while the user switches profiles, does not rerun the picker or capture route, and selecting a profile from image review returns to the same review route with the refreshed display name. Selecting a profile from Scanner entry updates the scanner-only optional profile context and returns to Scanner entry. Selecting a profile from Ingredient input review updates only the current in-memory ingredient draft profile context, preserving draft ID, source, preview, and raw ingredient text before returning to Ingredient input review.

Adding a profile intentionally routes to the existing create-only setup flow without appending a fake profile entry or generating a frontend opaque ID. Add-profile Save still does not create a fake managed record or overwrite the two known demo managed-profile names. A future host adapter must persist and refresh the profile list before a real newly created profile can become a known managed-profile record:

```text
Profile management
-> Add profile
-> Profile setup
-> Save
-> Image source
-> Back
-> Profile management
```

The profile list remains host-owned. The host supplies the ordered list, active-profile designation, sync labels, optional helper labels, profile-limit copy, per-profile availability flags, and malformed or blocked route state. Opaque profile IDs are callback-only context and are never rendered directly; blank or whitespace-only IDs keep cards readable but disable Select, Edit, and Delete. Malformed ready-state profile arrays fail closed into the existing error recovery experience before any profile list rendering runs.

Repeated profile-card controls keep concise visible labels while using contextual accessible names such as `Select profile: Amara`, `Edit profile: Amara`, and `Delete profile: Amara`. Non-string, blank, and whitespace-only display names render the local safe fallback `Unnamed profile` without mutating the host payload.

Selection, editing, add-profile, deletion, and sync settings remain callback-driven. In the current demo controller, selection state and stable demo labels are kept in memory only so the route can demonstrate active-profile switching. Edit, deletion, sync settings, and Retry are future-adapter logs only. The screen does not persist profile data, edit profile data, add profiles, delete profile data, toggle sync, create an account, or infer profile limits internally.

The screen preserves the local-first copy, `Profiles stay local on this device unless you choose to sync them.`, and positions cloud sync as optional. The optional-sync card explains that local profiles remain usable without an account, keeps Manage sync settings visible, and disables it when the host withholds the route.

Deletion uses an explicit confirmation dialog before invoking the host callback. Opening the dialog does not delete anything, the dialog displays the safe profile display name rather than an opaque ID, and successful callback resolution closes the dialog without removing the card locally. Before confirming, deletion is revalidated against the latest host-owned profile list and availability so removed, duplicated, newly blocked, or callback-withheld candidates fail closed. The demo route controller does not perform a fake deletion refresh or remove a card locally. The host owns actual deletion execution, refreshed reports, and any synced-data handling.

While the deletion dialog is open, the background application shell is marked `aria-hidden` and `inert`, and the dialog remains outside that inert wrapper. Escape and Cancel close the dialog only while idle; dismissal is blocked synchronously while delete confirmation is pending.

Offline status is informational: locally supplied profiles remain readable, and action availability is governed by host props rather than automatically disabled. Loading, empty, error, blocked-action, pending, malformed-ID, callback-rejection, focus-trap, and Escape/cancel deletion states are covered by the regression suite.

No browser history API, routing library, persistence writes, local storage, session storage, IndexedDB, cookies, API calls, geolocation requests, camera access, picker rerun, capture rerun, analysis inference, account requirement, fake profile editor, frontend-generated opaque profile ID, affiliate routes, marketplace routes, external seller routes, sponsored content, or host-adapter modules were introduced. The regression suite lives at `components/profile-switcher-and-management-screen.test.tsx`, with route-controller coverage in `app/page.test.tsx`.

## GuestIngredientScannerEntryScreen Integration

`GuestIngredientScannerEntryScreen` is Screen 20, a low-friction scanner-entry route for ingredient guidance now integrated into `app/page.tsx`. It opens from:

```text
WelcomeScreen
-> Guest ingredient scanner
-> GuestIngredientScannerEntryScreen

HomeDashboardScreen
-> Ingredient scanner
-> GuestIngredientScannerEntryScreen
```

The screen has a standalone regression suite at `components/guest-ingredient-scanner-entry-screen.test.tsx`, and route-controller coverage lives in `app/page.test.tsx`.

Screen 20 does not require account creation, sign-in, a facial scan, profile setup, or a purchase flow. It offers three host-routed scanner methods:

```text
Take ingredient photo
Choose a label photo
Enter ingredients manually
```

An optional local-profile context can be supplied by the host. When a usable profile ID exists, scanner-method callbacks receive that opaque ID as callback-only context. Guest submissions and malformed profile IDs fall back to an empty callback payload, so the screen never invents or renders an opaque profile ID.

Current demo route behavior:

```text
Welcome -> Scanner entry in guest mode
Dashboard -> Scanner entry with active optional local-profile context
Scanner entry Back -> source-aware Welcome or Dashboard
Scanner entry Change profile -> Profile management -> source-aware return to Scanner entry
Scanner entry Scan without a profile -> clears scanner-only optional context -> remains on Scanner entry
Scanner entry Take ingredient photo -> IngredientInputReviewScreen with a fixed camera-photo draft fixture
Scanner entry Choose a label photo -> IngredientInputReviewScreen with a fixed chosen-photo draft fixture
Scanner entry Enter ingredients manually -> IngredientInputReviewScreen with a blank manual-entry draft fixture
```

Guest-mode clearing does not clear the globally active managed profile. Profile selection from Scanner entry updates only the optional scanner context plus the existing demo active managed-profile state.

Malformed optional profile IDs fall back to guest `{}` submissions across Take ingredient photo, Choose a label photo, and Enter ingredients manually.

Offline status is informational and appears immediately after the introductory explanation, before the scanner trust cards and methods. Each scanner method uses its own host-supplied offline availability flag, so one route may remain available while another asks the user to reconnect. General host method blocks take priority over reconnect labels; reconnect labels are used only when offline capability is the remaining blocker.

Back follows the same async-safe callback pattern as scanner-method actions, including duplicate-activation protection, pending copy, conflicting-action disabling, and toast recovery on rejection.

The host still owns native camera and picker adapters, manual-entry routing, ingredient extraction, processing, storage policy, selected-profile refresh, profile switching, offline capability, and all onward routing. In the current demo, camera, picker, and manual-entry activations route into `IngredientInputReviewScreen` through controller-owned demo fixtures. Camera and picker adapters remain unimplemented; photo-method text is static host-shaped fixture copy only, not OCR output, and manual entry begins with a blank host-controlled draft.

No persistence, API call, OCR, extraction adapter, camera API call, file input, direct picker access, browser history, routing library, external navigation, affiliate route, marketplace route, account requirement, direct scanner-entry-to-results skip route, or host-adapter module was introduced. Scanner entry still routes through `IngredientInputReviewScreen` before Screen 22 can open.

## IngredientInputReviewScreen Integration

`IngredientInputReviewScreen` is Screen 21, the mandatory review checkpoint after the three Screen 20 scanner-entry methods and before ingredient guidance or results. It is now integrated into `app/page.tsx` through controller-owned demo fixtures.

Current demo route shape:

```text
Scanner entry -> method selection -> Ingredient input review
Ingredient input review Back -> Scanner entry
Ingredient input review Change method -> Scanner entry
Ingredient input review Change profile -> Profile management -> source-aware return to Ingredient input review
Ingredient input review text change -> controller-owned in-memory raw draft refresh
Ingredient input review Continue -> validate controlled in-memory draft context -> IngredientScannerResultsScreen
```

The host owns the draft ID, source, source label, optional image preview data, ingredient text, optional local-profile context, extraction status, processing, storage policy, selected-profile refresh, and onward routing. The demo route controller uses fixed opaque draft fixture IDs as callback-only context and keeps the controlled ingredient text in memory only. The screen renders host-supplied ingredient text as a controlled textarea and calls `onIngredientTextChange` with the exact raw textarea value when editing is permitted; it does not keep an independent text draft.

Required draft context fails closed when the draft ID, source, source label, or ingredient text shape is malformed. Blank ingredient text remains readable but blocks Continue until the host supplies non-blank text. Optional profile context is display-only; malformed profile IDs are omitted from Continue submissions so guest-mode guidance can still proceed.

Photo-based sources render the host-supplied label preview when a usable image URL is present, otherwise a local unavailable placeholder is shown. Failed image loads stay local to the current draft/image pair, and replacing the image URL allows the preview to try again. Manual-entry sources do not render a photo preview card.

The mobile reading order keeps input review before route actions: source summary, optional image preview, ingredient editor, optional profile context, privacy and host-processing helper, Change input method, and then Continue. The Change input method action is positioned after the review context and before Continue so assistive-technology reading order matches the mandatory review-before-guidance flow.

Offline status is informational. The host controls whether Back, input-method change, profile change, editing, Retry, and Continue are available. All actions are user-activated callbacks with pending labels, duplicate-activation protection, conflicting-action disabling, and toast recovery on callback rejection.

Textarea editing is paused while a discrete route action is pending. During that pause the host-controlled text remains readable, no local textarea draft is introduced, and blocked or pending edit events are protected by an independent programmatic guard. Permitted edits still send the exact raw textarea value unchanged, with no trimming, parsing, normalisation, debounce, or persistence.

Profile-management return preserves the current draft ID, source, optional preview, and raw ingredient text. Continue now preserves the existing submit log, validates that the submitted draft ID and raw ingredient text still match the current controlled in-memory draft, and then opens `IngredientScannerResultsScreen` when the context is usable.

No guidance generation, OCR work, extraction adapter, camera access, picker access, file input, persistence, API, browser history, routing library, external navigation, adapter module, shared component extraction, ingredient parsing, ingredient normalization, product ranking, safety determination, account requirement, store routing, affiliate route, marketplace route, external seller route, sponsored content, iframe, anchor navigation, Screen 23, or future route was introduced. The regression suite lives at `components/ingredient-input-review-screen.test.tsx`, with route-controller coverage in `app/page.test.tsx`.

## IngredientScannerResultsScreen Integration

`IngredientScannerResultsScreen` is Screen 22, the readable ingredient-guidance destination after the customer explicitly submits reviewed ingredient text from `IngredientInputReviewScreen`. It is now integrated into `app/page.tsx` through controller-owned in-memory demo fixtures.

Current demo route shape:

```text
GuestIngredientScannerEntryScreen
-> IngredientInputReviewScreen
-> explicit Continue
-> IngredientScannerResultsScreen

IngredientScannerResultsScreen
-> Back to review
-> IngredientInputReviewScreen

IngredientScannerResultsScreen
-> Scan another product
-> GuestIngredientScannerEntryScreen with optional profile context restored

IngredientScannerResultsScreen
-> Save
-> future-adapter log only

IngredientScannerResultsScreen
-> Retry
-> future-adapter log only
```

The screen is guidance-oriented, educational, and not a medical assessment, allergy test, or compatibility guarantee.

The host owns result ID, draft ID, source labels, summary labels, guidance preparation, guidance-item ordering, flag labels, optional profile context, save availability, offline save capability, processing, storage policy, and routing. The demo uses fixed opaque result IDs as callback-only context and never generates random or timestamp IDs.

Guidance items render in the received order. The route controller supplies a static host-shaped guidance fixture only: Niacinamide, Fragrance, and Retinol. The fixed count label is the literal host-shaped text `3 host-supplied notes`, not a value derived from `guidanceItems.length`. Malformed guidance-list entries degrade into neutral fallback cards without being filtered or reordered. The screen and route controller do not locally parse ingredient text, split ingredient text, sort, group, rank, filter, calculate ingredient counts, infer safety, infer allergies, infer compatibility, generate recommendations, add processing timers, or route into the store.

Optional profile context remains guest-compatible. Missing profile context keeps results readable, malformed optional profile IDs are omitted from Save submissions, and no sign-in or account creation is required.

Empty guidance is a readable state rather than an error and uses a neutral informational card rather than error styling. Back to review, Scan another product, optional Save, Retry, offline notice, pending labels, duplicate-activation protection, and callback-rejection toasts are covered by the standalone regression suite.

Save behavior is host-owned. Save remains visible, uses a distinct offline capability flag, never persists locally, only submits usable result/draft context plus an optional usable profile ID, and does not synthesize `savedLabel`. Retry is also a future-adapter log only and does not fetch.

No API calls, persistence, camera access, picker access, file input, external navigation, account requirement, affiliate route, marketplace route, external seller route, sponsored content, host-adapter module, or future route-controller route was introduced in the Screen 22 integration. Screen 23 now exists separately as the standalone `ProgressTrackingScreen` documented below. The Screen 22 regression suite lives at `components/ingredient-scanner-results-screen.test.tsx`, with route-controller coverage in `app/page.test.tsx`.

## ProgressTrackingScreen Integration

`ProgressTrackingScreen` is Screen 23, the future progress-review destination for returning customers who want to review host-supplied scan history and explicitly compare two chosen snapshots. It now exists as a standalone component with its own regression suite:

```text
HomeDashboardScreen
-> Progress
-> ProgressTrackingScreen
```

The route above is product intent only in this checkpoint. Screen 23 is not integrated into `app/page.tsx`, and the demo Dashboard Progress action remains disabled until a future route-controller integration wires it deliberately.

The screen renders host-owned scan history, optional comparison notes, optional routine prompt copy, image labels, date labels, photo-quality labels, per-action availability, and optional offline status exactly as supplied. The host owns profile identity, scan-history order, comparison selection, snapshot images, comparison metrics, routine prompt/adherence context, storage, processing, persistence, routing, and all callbacks.

Scan entries and comparison metric entries render in the received order. Malformed scan-history entries degrade into neutral fallback snapshot cards without being filtered, reordered, ranked, or hidden. Malformed metric entries degrade into neutral fallback metric rows in place. Missing, whitespace-only, or failed snapshot images render the local `Snapshot image unavailable` placeholder, and replacement image URLs are allowed to retry.

The empty state is readable and informational:

```text
No progress snapshots yet
Start a new scan to create a snapshot for future comparisons.
```

Loading uses polite status semantics, error uses `role="alert"` with Retry outside the alert when supplied, and offline copy is informational only:

```text
You appear to be offline. Supplied progress snapshots remain readable. The host controls which actions remain available.
```

Back, Start a new scan, Select baseline, Select comparison, Open report, Open routine, and Retry are all explicit user-activated callbacks. The component uses StrictMode-safe mounted tracking, duplicate-activation protection, action-scoped pending labels, contextual repeated-control accessible names, and callback-rejection toasts. Opaque profile IDs, scan IDs, metric IDs, and routine IDs remain callback-only context and are not rendered manually.

No `app/page.tsx` route integration, host-adapter module, shared component extraction, Screen 24, persistence, API call, camera access, picker access, file input, external navigation, progress inference, comparison calculation, adherence calculation, scan ranking, scan grouping, recommendation generation, affiliate route, marketplace route, external seller route, sponsored content, or medical-monitoring claim was introduced. The standalone regression suite lives at `components/progress-tracking-screen.test.tsx`.
