# Development-store setup and checkout verification

## Catalogue setup

The six CDC products and USD prices are recorded in scripts/data/catalogue.json. Run node scripts/seed-products.mjs --dry-run --definitions to inspect the complete plan without credentials or network calls. The script uses Node's built-in fetch and Shopify GraphQL Admin API 2026-10; no new SDK dependency is needed.

To create missing records in a development store, provide SHOPIFY_STORE and SHOPIFY_ADMIN_ACCESS_TOKEN through your process environment, then run node scripts/seed-products.mjs --apply --definitions. Required app scopes: read_products, write_products; write_metaobject_definitions/read_metaobject_definitions for the optional definitions. Token values must stay outside files and shell history. The script never logs credentials, skips existing products/collections, checks GraphQL user errors and never automatically retries a mutation. An interrupted run can be rerun after checking Admin; handle lookups preserve completed records. Existing metafield definitions must have matching types.

Created products are drafts with tracked inventory and real SKUs/options/prices. Add coherent merchant product photos, set inventory at your shipping location, create a sold-out variant for testing, activate products and publish them to the Online Store. Collections use deterministic demo tags; Sale derives its seed tag from the supplied compare-at prices. Shopify's native all-products collection is used instead of creating a duplicate. The script preserves existing merchant metafield values and never invents composition/care/sustainability facts. Populate verified content in Admin using DATA-MODEL.md.

1. Confirm store currency USD for the CDC demo prices. Configure a development market/address.
2. Create New Arrivals, Sale, Accessories and Clothing if not using the script. Apply the matching tags to published products. Maintain Sale tags when prices change.
3. Create main/footer menus with real destinations and select them in Theme Editor.
4. Upload a hero image, select homepage collections/featured collection, populate legal policies and shipping/returns text. Empty selections intentionally render no fake catalogue.
5. Enable desired Search & Discovery filters (availability, price, type, vendor and options), and verify the collection's default sort.
6. Create published lookbook/campaign entries and select them in content blocks as needed.

## Checkout configuration (Shopify Admin)

All checkout behavior remains Shopify-owned. The cart POST uses the checkout submit button; accelerated product checkout is an optional native Shopify payment button.

Use a development store's test gateway or Shopify Payments test mode. Configure a shipping profile with a test destination, one standard rate, one free-shipping threshold, product weights and stock location. Configure taxes for the test market in Admin. Create a test discount code and an automatic discount if desired; record eligibility/exclusions and thresholds. Keep all real payments out of the test evidence.

## Acceptance matrix

| Scenario | Expected | Recorded result |
| --- | --- | --- |
| Available variant, quantity 1 | Exact variant enters cart; prices match Shopify | Pending store |
| Sold-out variant | Add button disabled; server rejects direct invalid request | Pending store |
| Quantity above stock/invalid quantity | Useful error; cart is reread; no duplicate add | Pending store |
| Change/remove line with discount | Totals and header count follow server response | Pending store |
| Last line removed | Empty state in page and drawer | Pending store |
| Save order note | Note persists into Shopify checkout | Pending store |
| Valid/invalid/expired discount | Shopify applies/rejects with correct totals | Pending store |
| Below/at shipping threshold | Correct rate and total | Pending store |
| Unsupported shipping destination | Shopify displays unavailable rate | Pending store |
| Test gateway success/failure | Correct Shopify order/result; no custom payment code | Pending store |
| Back to cart after checkout | Cart state remains authoritative | Pending store |
| JavaScript disabled | Product, cart update/remove and checkout remain usable | Pending store |

Record date, preview URL, browser, product/variant IDs, discount setup, shipping destination, expected/actual totals and test order IDs. Do not include customer details, tokens or payment data in screenshots/repository evidence.

No store address, authenticated Admin session or API token was available during implementation. The seed script was checked offline; store mutations, shipping/tax/payment configuration and test orders have not been executed.

References: [Shopify Cart API](https://shopify.dev/docs/api/ajax/reference/cart), [productSet](https://shopify.dev/docs/api/admin-graphql/2026-10/mutations/productSet), [testing Shopify Payments](https://help.shopify.com/en/manual/payments/shopify-payments/testing-shopify-payments).
