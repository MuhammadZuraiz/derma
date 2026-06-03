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

The route-controller tests in `app/page.test.tsx` intentionally mock presentation components so they validate `app/page.tsx` routing and controller-owned state without duplicating approved screen-level suites. Component-level approved suites remain separate unless they are copied into this repository. No production UI behavior changed in this checkpoint.
