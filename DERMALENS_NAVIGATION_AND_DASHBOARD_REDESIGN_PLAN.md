# DermaLens Navigation and Dashboard Redesign Plan

This document is a planning artifact for simplifying the DermaLens presentation-layer information architecture before implementation. It does not introduce a navigation bar, route-controller changes, adapters, APIs, persistence, browser history, or a routing library.

The current repository, `DERMALENS_PRODUCT_UX_UI_HANDOFF.md`, `DERMALENS_FRONTEND_COMPLETION_AUDIT.md`, `app/page.tsx`, `app/page.test.tsx`, `README.md`, production components, component-level suites, and the current source-aware Back state were reviewed as the implementation and planning context. The product owner has requested an intentional UX revision: the returning-user Dashboard should become calmer, and a functional bottom navigation system should be introduced selectively.

The approved primary direction remains:

```text
Home
Routine
Scan
Progress
More
```

Scan remains an explicit action that opens a sheet. It is not a passive root tab. Stable returning-user roots receive navigation; focused and interrupt-sensitive flows keep navigation hidden.

## 1. Current Navigation Overload Audit

### Returning-User Route Surface

The current `HomeDashboardScreen` acts as the returning-user hub and exposes the following route surface:

```text
HomeDashboardScreen
-> Start new scan
-> Change profile
-> Latest report
-> Active routine
-> Ingredient scanner
-> Progress
-> Orders
-> Recent-order details
-> Store
```

The route controller currently wires those destinations with source-aware state for image-source returns, profile-management returns, routine returns, result-summary closes, store returns, and order-details returns.

### Dashboard Information Groups

The Dashboard also renders or coordinates these information groups:

```text
active profile
latest snapshot
routine summary
recent order
scanner availability
progress availability
orders availability
store availability
optional environmental module
sync/profile context
```

### Information-Architecture Problem

The current screen combines two jobs:

1. A navigation menu for nearly every returning-user route.
2. A summary dashboard that should highlight the next useful skincare action.

On mobile, this creates too many competing decisions above the fold. Primary skincare actions, commerce links, order status, routine continuation, progress history, ingredient scanning, and profile management all compete for the same visual priority. The result is weak hierarchy: the customer has to decide whether they are looking at a summary, a launchpad, a store entry, an account/profile surface, or an order hub.

This is an information-architecture issue, not an implementation-quality issue. The existing components have strong defensive runtime handling, accessibility protections, host-owned boundaries, callback guards, malformed-context fallbacks, and source-aware routing. The redesign should preserve those qualities while redistributing the navigation burden.

## 2. Primary Bottom Navigation Model

### Recommended Returning-User Navigation

Use a maximum five-item returning-user navigation model:

```text
Home
Routine
Scan
Progress
More
```

Recommended destination semantics:

| Item | Role |
| --- | --- |
| `Home` | Simplified Dashboard root with one primary facial-scan CTA and a small set of personalized summaries. |
| `Routine` | Opens the existing `RoutineRecommendationsScreen` as a root destination when routine context is available. |
| `Scan` | Prominent center action. It opens a scan action sheet instead of behaving like a passive tab. |
| `Progress` | Opens the existing `ProgressTrackingScreen` as the progress root. |
| `More` | Opens a new `MoreHubScreen` for secondary tools, commerce, orders, profiles, and optional account/sync entry. |

Store, Orders, Profiles, and Optional account/sync should move under More. Ingredient scanner remains available through the central Scan action sheet and may also appear under More as a secondary tool shortcut for discoverability.

Dashboard Recent-order details should remain a conditional Home summary action when the host supplies a relevant recent order. This keeps urgent or timely order context visible without turning the Dashboard back into a full order-navigation menu.

### Why Five Items Maximum

Five items is the upper bound for a mobile bottom navigation bar because it preserves label readability, touch-target size, and quick recognition. DermaLens has more destinations than five, so the bar should express the primary returning-user mental model rather than every route.

### Why Commerce Remains Secondary

DermaLens is positioned around skincare guidance, routine understanding, and first-party care context. Commerce is important, but it should support the routine and order experience instead of competing with scan, routine, and progress as a primary daily action. Store and Orders belong in More, with contextual commerce links still available from Routine, Product detail, Cart, Checkout, and order surfaces.

### Why Profiles and Sync Belong Under More

Profiles and optional sync are important control surfaces, but they are not daily primary actions for most returning users. Moving them under More reduces Dashboard density while preserving access to profile switching, profile management, account state, privacy controls, and optional sync. Corrective profile routes inside scan and review flows should keep their focused Back behavior.

## ReturningUserNavigationShell Ownership

Introduce a future composition owner:

```text
ReturningUserNavigationShell
├── current root or eligible section content
├── AppBottomNavigation
└── ScanActionsSheet when open
```

The shell owns the navigation composition. Individual screens should remain content surfaces and should not embed their own bottom-navigation markup.

### Shell Responsibilities

| Responsibility | Rule |
| --- | --- |
| Single navigation instance | The shell renders `AppBottomNavigation` once. |
| Content slot | The shell wraps the current root or eligible section content. |
| Safe area | The shell owns layout padding for the fixed navigation bar and mobile safe-area inset. |
| Scan sheet state | The shell owns Scan-sheet open and close state. |
| Modal isolation | While the Scan sheet is open, the shell applies `inert` and `aria-hidden` to the background content. |
| Focus return | The shell preserves focus return to the Scan trigger after the sheet closes. |
| Presentation boundary | The shell does not call APIs, persist state, use browser history, or add a routing library. |
| Toast boundaries | Screen-specific toasts remain screen-owned. Navigation callback-rejection toasts remain navigation-owned. Scan-sheet callback-rejection toasts remain sheet-owned. The shell does not duplicate toast regions. |

Likely future files:

```text
components/returning-user-navigation-shell.tsx
components/returning-user-navigation-shell.test.tsx
```

## 3. Scan Action Sheet

Introduce a non-route presentation primitive:

```text
ScanActionsSheet
```

The sheet opens only after explicit activation of the center Scan action. It is not a route and must not request permissions or open native capabilities by itself.

### Actions

```text
Start facial scan
Scan ingredient label
Cancel
```

Expected routes:

```text
Start facial scan
-> ImageSourceSelectionScreen

Scan ingredient label
-> GuestIngredientScannerEntryScreen
```

### Required Behavior

| Requirement | Planning rule |
| --- | --- |
| Explicit activation | Opening the sheet requires a user action on Scan. |
| Accessible semantics | Use dialog or sheet semantics with an accessible name. |
| Focus entry | Focus moves into the sheet after it opens. |
| Focus trap | Tab and Shift+Tab remain inside the sheet while open. |
| Escape dismissal | Escape closes the idle sheet. |
| Focus return | Closing returns focus to the Scan trigger when available. |
| Background isolation | The app shell behind the sheet is inert and `aria-hidden` while open. |
| No premature camera request | Opening the sheet does not activate camera permission. |
| No premature picker access | Opening the sheet does not open a native picker or file input. |
| No automatic route | The sheet never routes until a sheet action is explicitly activated. |
| Duplicate protection | Repeated activation while an action is pending is guarded. |
| Reduced motion | Entrance and dismissal motion respects reduced-motion preferences. |
| Safe area | Mobile layout accounts for bottom safe-area inset. |

## ScanActionsSheet Root-Source Semantics

Add an explicit future root-source type:

```ts
type ScanSheetSourceDestination =
  | "home"
  | "routine"
  | "progress"
  | "more";
```

Route source rules:

```text
Root destination
-> open Scan sheet
-> choose facial scan
-> ImageSourceSelectionScreen
-> Back
-> originating root destination

Root destination
-> open Scan sheet
-> choose ingredient scanner
-> GuestIngredientScannerEntryScreen
-> Back
-> originating root destination
```

The controller must not hard-code Dashboard as the Back destination. The root source that opened the sheet should be preserved until the chosen scan flow returns or is intentionally reset. The Scan sheet never opens from focused flows because the bottom bar is hidden there.

Facial scan and ingredient scanner do not open until their respective sheet actions are explicitly activated. Opening the sheet never requests camera permission or picker access. Tab switching while the sheet is open is blocked until the sheet closes.

## 4. Future ScanActionsSheet Contract

Recommended TypeScript contract:

```ts
interface ScanActionsSheetProps {
  isOpen:
    boolean;
  canStartFacialScan?: boolean;
  canOpenIngredientScanner?: boolean;
  onClose:
    () => void;
  onStartFacialScan:
    () => void | Promise<void>;
  onOpenIngredientScanner:
    () => void | Promise<void>;
}
```

Recommended visible states:

```text
Facial scan unavailable
Ingredient scanner unavailable
Opening facial scan...
Opening ingredient scanner...
```

### Sheet Contract Requirements

| Requirement | Rule |
| --- | --- |
| Independent actions | Facial scan and ingredient scanner remain independently visible and independently blocked. |
| Host availability | The host controls availability. Facial scan may be blocked while guest ingredient scan remains available. |
| Duplicate protection | Pending sheet actions block duplicate activation. |
| Pending state | Each action has scoped pending copy. |
| Rejection toast | Sheet-action callback rejection becomes a local polite toast owned by the sheet. |
| Focus trap | Focus remains inside the sheet while open. |
| Dismissal | Escape and Cancel dismiss only while idle. |
| Synchronous guard | In-flight dismissal protection does not rely only on disabled buttons. |
| Focus return | Closing returns focus to the Scan trigger through shell coordination. |
| Background isolation | The shell supplies inert and `aria-hidden` background isolation. |
| Boundaries | No API calls, persistence, native capability access, or route until explicit sheet action. |

## 5. Screen 27: MoreHubScreen

Proposed new screen:

```text
Screen 27:
MoreHubScreen
```

Purpose:

```text
Provide a calm grouped destination for secondary tools, commerce, orders, profiles, and optional sync entry without overloading Home.
```

### Initial More-Hub Structure

```text
Top heading
Short supporting copy

Shopping
  Store
  Orders

Tools
  Ingredient scanner

Profiles and privacy
  Profiles and optional sync
```

`ReturningUserNavigationShell` composes `AppBottomNavigation` outside the `MoreHubScreen` content surface. `MoreHubScreen` must not embed its own navigation markup, duplicate safe-area padding, or add screen-owned navigation toast regions.

### Initial More-Hub Outbound Routes

Initial route model:

```text
MoreHubScreen
-> Store
-> DermaLensStoreRoutineCollectionScreen
-> Back
-> MoreHubScreen

MoreHubScreen
-> Orders
-> OrderHistoryScreen
-> Back
-> MoreHubScreen

MoreHubScreen
-> Ingredient scanner
-> GuestIngredientScannerEntryScreen
-> Back
-> MoreHubScreen

MoreHubScreen
-> Profiles and optional sync
-> ProfileSwitcherAndManagementScreen
-> Back
-> MoreHubScreen

ProfileSwitcherAndManagementScreen
-> Manage sync settings
-> AccountAndOptionalSyncScreen
-> Back
-> ProfileSwitcherAndManagementScreen
```

Do not add a direct `MoreHubScreen -> AccountAndOptionalSyncScreen` route in the first rollout. More may render helper copy explaining optional sync, but Profile management remains the entry point to Account sync. Existing Account-sync Back to Profile management stays intact, and Profile-management source-aware Back remains preserved.

Do not invent Privacy Notice or privacy-controls routes. A privacy entry appears later only when intentionally implemented.

More-origin Store, Orders, and Profile management remain shell-free during UX-R5. UX-R6 may later evaluate a visible More-selected shell for selected More-origin sections. Explicit Back destinations remain preserved regardless of visible-shell decision.

### Host-Owned Availability

More hub should render host-owned route availability and blocked labels without creating new behavior locally. Store, Orders, Ingredient scanner, and Profiles/optional sync remain explicit host-owned routes or callbacks. Blocked actions stay visible and readable. Unknown or unavailable route context fails closed.

The More hub must not invent support, device-management, tracking, marketplace, privacy notice, or privacy-control routes.

## 6. Simplified HomeDashboardScreen

The redesigned Screen 18 should become a focused Home root rather than a dense navigation grid.

### Locked Home Module Hierarchy

Use exactly this module hierarchy:

```text
Active-profile greeting and profile-switch shortcut

Primary Start facial scan card
  Start facial scan
  -> ImageSourceSelectionScreen

Today's routine card
  Open routine

Skin journey card
  Latest report summary when supplied
  Open latest report when available
  View progress when available

One conditional attention card
  active order update when relevant
  otherwise environmental UV/AQI guidance when enabled and supplied
  otherwise omit

Toast region
```

The bottom navigation is supplied by `ReturningUserNavigationShell`, not embedded directly inside `HomeDashboardScreen`.

The Home primary CTA starts the facial-scan flow directly after explicit activation. It does not open `ScanActionsSheet`. The centre bottom-navigation Scan action remains the global entry point for choosing between facial scan and ingredient scanner.

Home does not trigger camera permission, open a native picker, or begin analysis automatically. It routes only into `ImageSourceSelectionScreen`:

```text
Home
-> Start facial scan
-> ImageSourceSelectionScreen
-> Back
-> Home
```

### Home Summary Route Semantics

```text
Home Today's routine
-> root Routine destination
-> shell visible
-> Routine selected

Home Skin journey View progress
-> root Progress destination
-> shell visible
-> Progress selected

Home Skin journey Open latest report
-> ResultsSummaryScreen
-> shell hidden
-> Close
-> Home

Home conditional active-order update
-> OrderDetailsScreen
-> shell hidden
-> Back
-> Home
```

Root Routine must not pretend to be a deep Results-summary route. Root Progress must not pretend to be a deep route. Latest report remains a focused result-review route. Order details remains a focused source-aware detail route. Do not add automatic navigation or remove source-aware Back handling.

### Move Out of Home

```text
Persistent Orders menu shortcut
Persistent Store menu shortcut
Persistent Ingredient scanner menu shortcut
Large multi-card route grid
Optional sync navigation
Secondary profile-management explanations
```

These destinations remain reachable through the bottom navigation system, the Scan action sheet, and the More hub.

### Home Redesign Requirements

| Requirement | Planning rule |
| --- | --- |
| Fewer decisions | Reduce above-the-fold choices to one dominant primary CTA and a small number of summaries. |
| Primary CTA | Keep one dominant Start facial scan CTA. |
| CTA target | Home routes directly to `ImageSourceSelectionScreen`; it does not open `ScanActionsSheet`. |
| No shortcut grid | Do not render a large persistent route grid. |
| No persistent commerce cards | Do not add separate persistent Store or Orders cards. |
| No persistent ingredient card | Do not add a separate persistent Ingredient-scanner card. |
| Progressive disclosure | Secondary destinations move to More or contextual summary cards. |
| Palette | Preserve the warm peach-blush-brown DermaLens palette. |
| Mobile first | DOM order follows mobile reading order. |
| Offline | Keep readable offline state and host-controlled blocked actions. |
| Profile switching | Preserve the profile-switch shortcut. |
| Route availability | Do not remove host-owned availability; relocate it. |
| Navigation | No automatic navigation. |
| Backend | No new backend assumptions. |

## 7. Navigation Visibility for Existing and Planned Screens

### UX-R5 Initial Shell Visibility

For UX-R5, `ReturningUserNavigationShell` is visible only on:

```text
HomeDashboardScreen
RoutineRecommendationsScreen when opened as the root Routine tab
ProgressTrackingScreen
MoreHubScreen
```

For UX-R5, the shell remains hidden on every other existing screen.

UX-R6 may later evaluate shell expansion after visual and usability QA for:

```text
DermaLensStoreRoutineCollectionScreen
when opened from More

OrderHistoryScreen
when opened from More

ProfileSwitcherAndManagementScreen
when opened from More
```

Corrective Profile-management entries keep the shell hidden.

### Visibility Table

| Screen | Bottom navigation visible? | Selected item when visible | Reason | Classification | Back behavior impact |
| --- | --- | --- | --- | --- | --- |
| 1. `WelcomeScreen` | No | None | First-run entry should stay focused. | Focused onboarding | No change. |
| 2. `PrivacyAndFacialDataConsentScreen` | No | None | Consent requires uninterrupted reading and explicit decisions. | Focused consent | No change. |
| 3. `ProfileSetupScreen` | No | None | Profile creation is a focused setup flow. | Focused setup | Preserve setup/source Back. |
| 4. `ImageSourceSelectionScreen` | No | None | Beginning image acquisition is task-focused and permission-sensitive. | Focused scan flow | Back returns to the preserved root or source that opened scanning. |
| 5. `CameraCaptureScreen` | No | None | Camera capture is interrupt-sensitive. | Focused capture | No bottom-tab escape during capture. |
| 6. `SelectedImageReviewScreen` | No | None | Review and validation should keep corrective actions clear. | Focused scan flow | Preserve image-source return. |
| 7. `AnalysisProcessingScreen` | No | None | Processing should not invite unrelated navigation. | Focused processing | No change. |
| 8. `ResultsSummaryScreen` | No | None | Result review is a focused post-analysis flow. | Focused result flow | Preserve close source, routine, full-report routes. |
| 9. `FullReportDetailScreen` | No | None | Detailed report reading should not compete with root tabs. | Focused result flow | Preserve routine/report Back behavior. |
| 10. `RoutineRecommendationsScreen` | Yes only when opened as the root Routine tab. Hidden when opened from Results summary, Full report, Progress, or another deep source. | `Routine` for root-tab routine | Routine can be a stable returning-user root, but deep routine routes need source-aware Back clarity. | Root surface or deep guidance flow | Root tab uses root navigation; deep openings preserve explicit Back to source. |
| 11. `DermaLensStoreRoutineCollectionScreen` | No in UX-R5. Optional UX-R6 expansion only when opened from More. | None in UX-R5; `More` only if UX-R6 adds shell. | Store is a secondary commerce surface under More, and commerce remains secondary to skincare guidance. | Section-level browse or focused commerce flow | Preserve explicit source-aware Back: More-origin Store returns to More; Routine-origin Store returns to Routine. The legacy Home Store shortcut is removed during Home simplification. Visible-shell expansion is an independent UX-R6 decision. |
| 12. `CartScreen` | No | None | Cart is a focused commerce step. | Focused commerce flow | Preserve checkout/cart Back behavior. |
| 13. `ProductDetailScreen` | No | None | Product detail is a focused commerce detail route. | Focused commerce flow | Preserve source-specific Back. |
| 14. `CheckoutContactAndShippingScreen` | No | None | Checkout data entry should not show unrelated primary nav. | Focused checkout flow | No change. |
| 15. `CheckoutReviewScreen` | No | None | Payment review requires a focused path to payment handoff. | Focused checkout flow | No change. |
| 16. `SecurePaymentGatewayHandoffScreen` | No | None | External-provider handoff must remain isolated. | Focused payment flow | No automatic root-tab route. |
| 17. `OrderConfirmationAndPaymentResultScreen` | No | None | Payment result is a focused provider-return state. | Focused payment flow | Preserve explicit View order route and Back/Retry semantics. |
| 18. `HomeDashboardScreen` | Yes in UX-R5. | `Home` | Simplified Home is the returning-user root. | Root surface | Bottom nav provides root movement; existing focused Back flows remain separate. |
| 19. `ProfileSwitcherAndManagementScreen` | No in UX-R5. Optional UX-R6 expansion only when opened from More. Hidden for corrective entries. | None in UX-R5; `More` only if UX-R6 adds More-origin shell. | Profiles are a More section but also a corrective flow during scans. | Section-level or corrective route | Must preserve existing `profileManagementBackScreen` source awareness. |
| 20. `GuestIngredientScannerEntryScreen` | No | None | Ingredient scanner entry and its following review/results are focused tool flows. | Focused ingredient flow | Preserve root-source Back from the Scan sheet or More. |
| 21. `IngredientInputReviewScreen` | No | None | Text review should not compete with nav. | Focused ingredient flow | Preserve Back/change method/change profile behavior. |
| 22. `IngredientScannerResultsScreen` | No | None | Guidance results are focused and callback-sensitive. | Focused ingredient flow | Preserve Back to review and Scan another. |
| 23. `ProgressTrackingScreen` | Yes in UX-R5. | `Progress` | Progress is a stable returning-user root. | Root surface | Start scan/open report/open routine remain explicit actions. |
| 24. `OrderDetailsScreen` | No | None | Order detail is a source-aware detail route. | Focused order detail | Preserve Back to Home, Order confirmation, or Order history. |
| 25. `OrderHistoryScreen` | No in UX-R5. Optional UX-R6 expansion only when opened from More. | None in UX-R5; `More` only if UX-R6 adds shell. | Order history is a section-level list under More, not an initial root. | Section-level browse | More-origin Order history returns explicitly to More during UX-R5 and UX-R6 regardless of shell visibility. Order-details Back returns to Order history. |
| 26. `AccountAndOptionalSyncScreen` | No | None | Account/sync contains privacy-sensitive confirmation flows. | Focused account/privacy flow | Preserve Back to Profile management. |
| 27. `MoreHubScreen` | Yes in UX-R5. | `More` | More is a stable returning-user root for secondary destinations. | Root surface | More-origin section routes keep explicit source-aware Back. |

Do not add the bottom bar for visual consistency alone. The shell should appear only where persistent root navigation improves orientation without weakening focused task completion.

## 8. Root-Tab and Deep-Link Source Semantics

### Home Facial Scan

| Entry | Recommended Back and navigation rule |
| --- | --- |
| Home primary facial-scan CTA -> Image source | Route directly to `ImageSourceSelectionScreen` after explicit activation. Back returns to Home. Do not open `ScanActionsSheet`, request camera permission, open a native picker, or begin analysis automatically. |

### Bottom-Nav Scan

| Entry | Recommended Back and navigation rule |
| --- | --- |
| Home -> Scan -> facial scan | Open `ScanActionsSheet`, then route to `ImageSourceSelectionScreen` only after explicit sheet action. Back returns to Home. |
| Routine -> Scan -> facial scan | Open `ScanActionsSheet`, then route to `ImageSourceSelectionScreen` only after explicit sheet action. Back returns to root Routine. |
| Progress -> Scan -> facial scan | Open `ScanActionsSheet`, then route to `ImageSourceSelectionScreen` only after explicit sheet action. Back returns to Progress. |
| More -> Scan -> facial scan | Open `ScanActionsSheet`, then route to `ImageSourceSelectionScreen` only after explicit sheet action. Back returns to More. |
| Root destination -> Scan -> ingredient scanner | Open `ScanActionsSheet`, then route to `GuestIngredientScannerEntryScreen` only after explicit sheet action. Back returns to the originating root destination. |

The bottom-nav centre Scan action preserves the root source that opened the sheet. It is never available from focused flows because the shell is hidden there.

### Routine

| Entry | Recommended Back and navigation rule |
| --- | --- |
| Bottom bar `Routine` | Treat as root tab. Back should not pretend the user came from Results summary or Full report. |
| Results summary -> Routine | Preserve explicit Back to Results summary. Hide the shell in UX-R5. |
| Full report -> Routine | Preserve explicit Back to Full report. Hide the shell in UX-R5. |
| Progress -> Routine | Preserve explicit Back to Progress. Hide the shell in UX-R5 unless later source-aware UX explicitly changes this. |
| Home Today's routine -> Routine | Route to root Routine with the shell visible and Routine selected. Do not treat it as a deep Results-summary route. |

### Progress

| Entry | Recommended Back and navigation rule |
| --- | --- |
| Bottom bar `Progress` | Treat as root tab with `Progress` selected. |
| Home Skin journey View progress -> Progress | Route to root Progress with the shell visible and Progress selected. Do not treat it as a deep route. |

### Store

| Entry | Recommended Back and navigation rule |
| --- | --- |
| More -> Store | UX-R5 keeps the shell hidden. Back returns explicitly to More. UX-R6 may add the shell with `More` selected after visual and usability QA. |
| Routine -> Store | Preserve explicit Back to Routine and keep shell hidden. |

### Orders

| Entry | Recommended Back and navigation rule |
| --- | --- |
| More -> Order history | UX-R5 keeps the shell hidden. Back returns explicitly to More. UX-R6 may add the shell with `More` selected after visual and usability QA. |
| Order history -> Order details | Preserve Back to Order history. |
| Home recent order -> Order details | Preserve Back to Home. |
| Payment confirmation -> Order details | Preserve Back to Order confirmation. |

### Profiles and Account Sync

| Entry | Recommended Back and navigation rule |
| --- | --- |
| More -> Profile management | UX-R5 keeps the shell hidden. Back returns explicitly to More. UX-R6 may add the shell with `More` selected only for More-origin entry. |
| Image or scanner corrective flow -> Profile management | Hide shell and preserve corrective Back to the originating flow. |
| Profile management -> Account sync | Preserve Back to Profile management. Account sync stays focused because it includes privacy confirmations. |

### State Semantics

Root tabs should not pretend to be deep-flow steps. Deep routes must preserve explicit Back destinations. The bottom bar must not replace corrective Back controls. Switching tabs should clear or preserve task-local state only according to an explicit controller rule, such as:

| Task-local context | Suggested tab-switch rule |
| --- | --- |
| Scan sheet open | Block tab switching until the sheet closes. |
| In-progress camera capture or image review | Require explicit cancellation before root-tab switch. |
| Ingredient input draft | Preserve only within the ingredient flow unless the host intentionally supports draft recovery. |
| Checkout draft | Preserve according to future checkout persistence policy, not bottom-nav behavior. |
| Order details source context | Preserve while on the detail route; reset only when opening a new order. |
| Profile-management source context | Preserve corrective source when opened from a focused flow. |

Do not use browser history APIs or add a routing library during this redesign checkpoint.

## 9. Future AppBottomNavigation Contract

Proposed reusable component:

```text
AppBottomNavigation
```

Recommended TypeScript contract:

```ts
type AppPrimaryDestination =
  | "home"
  | "routine"
  | "progress"
  | "more";

interface AppBottomNavigationProps {
  activeDestination:
    AppPrimaryDestination;
  isScanSheetOpen?: boolean;
  canOpenHome?: boolean;
  canOpenRoutine?: boolean;
  canOpenScan?: boolean;
  canOpenProgress?: boolean;
  canOpenMore?: boolean;
  onOpenHome:
    () => void | Promise<void>;
  onOpenRoutine:
    () => void | Promise<void>;
  onOpenScan:
    () => void | Promise<void>;
  onOpenProgress:
    () => void | Promise<void>;
  onOpenMore:
    () => void | Promise<void>;
}
```

### Component Requirements

| Requirement | Planning rule |
| --- | --- |
| Semantics | Render semantic `<nav aria-label="Primary">`. |
| Visible actions | Exactly five visible actions including Scan. |
| Current page | Home, Routine, Progress, and More expose `aria-current="page"` when selected. |
| Scan action | Scan is an action, not a current-page destination, and is never marked as the current page. |
| Scan popup semantics | The Scan button exposes `aria-haspopup="dialog"` and `aria-expanded`. |
| Touch targets | Minimum 44px touch targets. |
| Safe area | Account for mobile bottom safe-area inset supplied by the shell. |
| Focus | Visible focus rings on all actions. |
| Keyboard | Native button or link semantics with keyboard support. |
| Reduced motion | Respect reduced-motion preferences. |
| Blocked actions | Blocked navigation actions remain visible with contextual labels. |
| Duplicate guards | `AppBottomNavigation` owns active navigation operation state and duplicate-activation protection. |
| Navigation toast | `AppBottomNavigation` owns a local polite callback-rejection toast and renders it above the bar. |
| Sheet ownership | `ScanActionsSheet` owns sheet-operation pending state and sheet-action callback-rejection toast. |
| Shell ownership | `ReturningUserNavigationShell` owns composition and modal isolation and does not duplicate toast handling. |
| Decorative-only risk | The bar must be functional navigation, not decorative chrome. |
| Data boundaries | No opaque IDs, API calls, persistence, or routing library. |

## 10. Desktop Adaptation

Locked initial responsive strategy:

```text
UX-R1 through UX-R6
-> use one responsive bottom-navigation implementation
-> fixed to the viewport bottom
-> width-constrained and centred on wide layouts

UX-R7 visual QA
-> evaluate whether a left-rail variant improves wide desktop usability
```

Do not build a rail during UX-R1 through UX-R6. Keep mobile-first DOM semantics and one information architecture. Any future rail must expose the same destinations and the same Scan action model.

The initial bottom-navigation implementation should remain visually restrained on wide layouts by constraining width and centering the bar rather than stretching labels across the full viewport.

## 11. Regression-Suite Impact

### Existing Approved Files That Will Eventually Need Intentional Revisions

```text
components/home-dashboard-screen.tsx
components/home-dashboard-screen.test.tsx
app/page.tsx
app/page.test.tsx
README.md
DERMALENS_PRODUCT_UX_UI_HANDOFF.md
DERMALENS_FRONTEND_COMPLETION_AUDIT.md
```

### Likely New Files

```text
components/app-bottom-navigation.tsx
components/app-bottom-navigation.test.tsx
components/scan-actions-sheet.tsx
components/scan-actions-sheet.test.tsx
components/more-hub-screen.tsx
components/more-hub-screen.test.tsx
components/returning-user-navigation-shell.tsx
components/returning-user-navigation-shell.test.tsx
DERMALENS_NAVIGATION_AND_DASHBOARD_REDESIGN_PLAN.md
```

### Focused Revisions by Screen

| Screen or suite | Expected revision type |
| --- | --- |
| `HomeDashboardScreen` and suite | Intentional IA simplification, fewer route cards, no embedded nav markup, revised module priority tests. |
| `RoutineRecommendationsScreen` and suite | Only if root-tab routine needs route-shell contract assertions. Deep routine behavior should remain separately covered. |
| `ProgressTrackingScreen` and suite | Only if route-shell integration requires prop or layout changes. Preserve duplicate-ID, malformed-entry, and image-recovery tests. |
| `DermaLensStoreRoutineCollectionScreen` and suite | No UX-R5 change. Focused UX-R6 revision only if Store from More receives the shell. |
| `OrderHistoryScreen` and suite | No UX-R5 change. Focused UX-R6 revision only if Order history from More receives the shell. |
| `ProfileSwitcherAndManagementScreen` and suite | No UX-R5 change. Focused UX-R6 revision only if More-origin Profile management receives the shell. Corrective route behavior must remain separately tested. |
| `app/page.tsx` and suite | Route-controller integration for root tabs, More hub, Scan sheet, shell ownership, and source-aware Back revisions. |

Existing defensive-runtime tests should not be weakened merely to introduce navigation. New navigation tests should prove that the shell does not bypass callback guards, malformed-context fail-closed behavior, source-aware Back state, privacy dialogs, checkout boundaries, payment boundaries, or focused flow isolation.

## 12. Incremental Redesign Sequence

### UX-R0: Document-Only Plan

| Field | Plan |
| --- | --- |
| Goal | Capture the IA decision, route semantics, visibility rules, component contracts, and rollout sequence without changing production code. |
| Allowed files | `DERMALENS_NAVIGATION_AND_DASHBOARD_REDESIGN_PLAN.md`. |
| Protected files | All production files, existing tests, configs, package files, handoff, audit, README. |
| Verification commands | TypeScript, route-only Vitest, full Vitest, production build when available, `git diff --check`, focused static scan. |
| Rollback boundary | Revert this planning document revision. |

### UX-R1: Standalone AppBottomNavigation Component and Regression Suite

| Field | Plan |
| --- | --- |
| Goal | Build a presentation-only primary navigation component with blocked states, duplicate guards, accessibility, safe-area assumptions, local navigation toast, and no route coupling. |
| Allowed files | `components/app-bottom-navigation.tsx`, `components/app-bottom-navigation.test.tsx`, README documentation if requested. |
| Protected files | Route controller, existing screens, existing suites, host-boundary docs unless explicitly updated. |
| Verification commands | TypeScript, focused nav suite, full Vitest, build, static scan for APIs and persistence. |
| Rollback boundary | Remove the standalone component and suite. |

### UX-R2: Standalone ScanActionsSheet Component and Regression Suite

| Field | Plan |
| --- | --- |
| Goal | Build the explicit Scan sheet with independent blocked actions, pending states, focus trap, Escape/Cancel idle dismissal, inert background contract, rejection toast, duplicate protection, and no permission access. |
| Allowed files | `components/scan-actions-sheet.tsx`, `components/scan-actions-sheet.test.tsx`, README documentation if requested. |
| Protected files | Route controller, image source, camera, picker, ingredient scanner, existing suites. |
| Verification commands | TypeScript, focused sheet suite, full Vitest, build, static scan for camera, picker, file input, and automatic route behavior. |
| Rollback boundary | Remove the standalone sheet and suite. |

### UX-R3: Standalone MoreHubScreen Component and Regression Suite

| Field | Plan |
| --- | --- |
| Goal | Build Screen 27 as a grouped More destination with Shopping, Tools, and Profiles/privacy groups, host-owned route availability, blocked states, and no direct Account-sync route. |
| Allowed files | `components/more-hub-screen.tsx`, `components/more-hub-screen.test.tsx`, README documentation if requested. |
| Protected files | Route controller, existing production components, existing suites. |
| Verification commands | TypeScript, focused More hub suite, full Vitest, build, static scan for APIs, persistence, external URLs, marketplace wording, and invented privacy routes. |
| Rollback boundary | Remove Screen 27 component and suite. |

### UX-R4: Focused HomeDashboardScreen Simplification

| Field | Plan |
| --- | --- |
| Goal | Simplify Home to the locked module hierarchy: active profile greeting, primary facial-scan card, today's routine card, skin journey card, one conditional attention card, and toast. |
| Allowed files | `components/home-dashboard-screen.tsx`, `components/home-dashboard-screen.test.tsx`, README or plan updates if requested. |
| Protected files | Route controller until shell integration, unrelated screens, unrelated suites. |
| Verification commands | TypeScript, focused Home suite, full Vitest, build, visual QA across mobile and desktop. |
| Rollback boundary | Revert only the Home component and suite changes. |

### UX-R5: ReturningUserNavigationShell and Root-Surface Route Integration

| Field | Plan |
| --- | --- |
| Goal | Add standalone `ReturningUserNavigationShell`, regression suite, and route-controller integration for Home, root Routine, Progress, More, Scan sheet root-source semantics, Home direct facial-scan source-aware Back, Home root Routine shortcut, Home root Progress shortcut, Home focused latest-report route, Home focused conditional-order route, More outbound callbacks, and More-origin explicit Back destinations without visible section-level shell expansion. |
| Allowed files | `components/returning-user-navigation-shell.tsx`, `components/returning-user-navigation-shell.test.tsx`, `app/page.tsx`, `app/page.test.tsx`, README documentation, possibly integration-specific fixture docs. |
| Protected files | Approved component-level suites unless their public contract intentionally changes. Section-level shell expansion is out of scope. |
| Verification commands | TypeScript, shell suite, route-only Vitest, full Vitest, build, static scan for browser history, routing library, APIs, persistence, automatic camera/picker access. |
| Rollback boundary | Revert shell component, shell suite, route-controller changes, and route-suite changes while UX-R1 through UX-R4 standalone components remain intact if desired. |

UX-R5 wires:

```text
Home direct facial-scan CTA source-aware Back
Home root Routine shortcut
Home root Progress shortcut
Home focused latest-report route
Home focused conditional-order route

MoreHubScreen outbound callbacks:
  Store
  Orders
  Ingredient scanner
  Profiles and optional sync

More-origin explicit Back destinations
without visible section-level shell expansion
```

Section-level visible shell expansion remains UX-R6 only.

### UX-R6: Optional Section-Level Shell Expansion After QA

| Field | Plan |
| --- | --- |
| Goal | After root navigation works and QA supports it, evaluate shell expansion only for Store from More, Order history from More, and Profile management from More. |
| Allowed files | Only screens receiving the shell and their focused suites, plus route controller if needed for More-origin semantics. |
| Protected files | Focused flows such as checkout, payment, analysis, ingredient review/results, account sync, order details, and corrective Profile-management entries. |
| Verification commands | TypeScript, affected focused suites, route-only suite, full Vitest, build, visual and keyboard QA. |
| Rollback boundary | Revert each screen-level shell integration independently. |

### UX-R7: Responsive, Visual, Keyboard, Screen-Reader, Reduced-Motion, Safe-Area, and Zoom QA

| Field | Plan |
| --- | --- |
| Goal | Verify the bottom bar across mobile, tablet, desktop, keyboard navigation, screen readers, reduced motion, high zoom, safe area, and dark browser chrome edge cases; evaluate whether a left rail should be introduced later. |
| Allowed files | Focused styling or accessibility fixes in navigation components, Home, More, shell, and route controller tests. |
| Protected files | Host-adapter boundaries, unrelated screens, existing defensive tests. |
| Verification commands | TypeScript, full Vitest, build, Playwright/browser visual checks if available, keyboard walkthrough, static scan. |
| Rollback boundary | Revert QA fixes by component or shell integration layer. |

### Phase 1A: Typed Host-Boundary Catalog

| Field | Plan |
| --- | --- |
| Goal | Create a typed catalog of host-owned values and callbacks after the navigation IA is settled, so adapter work starts from explicit contracts. |
| Allowed files | New host-boundary catalog files and tests, documentation updates. |
| Protected files | Production adapters are still not introduced during cataloging. |
| Verification commands | TypeScript, catalog tests if added, full Vitest, static scan. |
| Rollback boundary | Remove catalog files without touching presentation components. |

## 13. Verification

This checkpoint changes documentation only. Verification should run against the current repository without modifying production code, existing tests, config, package files, lockfiles, generated files, the handoff, or the completion audit.

Expected baseline:

```text
Route-only Vitest:
116 passing

Full Vitest:
27 files
2145 passing

TypeScript:
passed

Production build:
passed when Google Fonts network access is available
```

### Verification Results

| Check | Result |
| --- | --- |
| Changed files | Intentional documentation refinement only: `DERMALENS_NAVIGATION_AND_DASHBOARD_REDESIGN_PLAN.md`. Pre-existing dirty or untracked files were observed and left untouched: `README.md`, `app/page.tsx`, `app/page.test.tsx`, `DERMALENS_FRONTEND_COMPLETION_AUDIT.md`, `components/account-and-optional-sync-screen.tsx`, and `components/account-and-optional-sync-screen.test.tsx`. |
| New files | None in this refinement; `DERMALENS_NAVIGATION_AND_DASHBOARD_REDESIGN_PLAN.md` already existed as the planning document in the working tree. |
| Total discovered test files | 27. |
| Total tests | 2145. |
| Passing tests | 2145. |
| Failing tests | 0. |
| Skipped tests | 0. |
| Route-suite count | 116 passing. |
| TypeScript result | Passed with `node_modules/typescript/bin/tsc --noEmit --incremental false` using the bundled Node runtime. |
| Build result | Passed after retry with network access for Google Fonts. The first sandboxed attempt failed only because Next.js could not fetch `DM Sans`, `DM Serif Display`, and `Space Mono` from Google Fonts. |
| Lint result or unavailable reason | Lint unavailable; `node_modules/eslint/bin/eslint.js` is not installed. |
| `git diff --check` result | Passed. Git reported line-ending warnings for pre-existing dirty tracked files. |
| Focused static scan result | Documentation-only matches for terms such as `API`, `persistence`, `browser history`, `routing library`, `adapter`, `group`, `inert`, `aria-hidden`, `aria-current`, `aria-haspopup`, `aria-expanded`, `camera permission`, `native picker`, `analysis automatically`, `More-origin Store`, `More-origin Order history`, `Home Store shortcut`, `ScanActionsSheet`, and `AccountAndOptionalSyncScreen`; no production behavior, API call, persistence, browser history, routing library, native capability access, automatic analysis, direct More-to-Account-sync route, or embedded MoreHub navigation was introduced. |
| SHA-256 | Reported after the file is stable. |
