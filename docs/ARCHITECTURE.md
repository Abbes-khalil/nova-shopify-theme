# NOVA technical architecture

Git root and theme root are separate. Shopify CLI commands run in Nova Store or pass --path explicitly. The existing Skeleton theme is retained; no Dawn or app framework is introduced.

## Rendering
layout/theme.liquid contains the document head, translated skip link, main landmark, header/footer groups, cart dialog and deferred cart script. Configurable CSS tokens come from the original global settings plus additive color/spacing settings. Existing setting IDs and homepage section names are retained.

## Components
- nova-hero serves main and promotional hero; only the primary image is prioritized.
- nova-shop-by-category/category-card select merchant collections.
- nova-featured-collection uses a collection setting and a product-count limit.
- product-card is shared by homepage, catalogue, search and recommendations. Varying prices use a From label; compare-at is shown only for uniform matching variant prices.
- product/product-purchase/product-media render native forms and media. product.js enhances options, quantity and gallery. Server section rendering resolves variant price, stock and selling-plan details. Stale reads cannot overwrite newer choices.
- cart-content is shared by page and drawer. cart.js serializes mutations, uses real line keys and Shopify-rendered totals, and never retries an uncertain mutation.
- filters renders Shopify filter objects. A single form moves into a native modal on mobile; native GET submission preserves Shopify behavior without JavaScript.
- search-form/predictive-search use the native API with debounce, cancellation and stale-response guards. Enter submits a normal search on failure.
- product-tabs supports optional product metafields and a shared size-guide reference. Lookbook and campaign theme blocks provide reusable metaobject content.

## Data and boundaries
Products, availability, collections, menu links, policies, payment icons and checkout come from Shopify. Missing fields do not generate claims. scripts/seed-products.mjs defaults to an offline preview; explicit apply requires Admin access and creates missing demo drafts only. Nothing in the storefront runs that script.

## Verification
Theme Check plus structural/translation/template validation and Node regression tests run through npm run verify. These tests use DOM/network stubs and do not replace browser or test-order acceptance. UI uses native dialog/details elements; keyboard/focus behavior still requires browser verification.
