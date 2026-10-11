# NOVA validation and acceptance

October 11, 2026. Source: isolated feature/premium-storefront checkout based on a929988. CLI 4.9.3, Node.js 24.16.0.

## Executed checks

- Theme Check: 66 files, zero offenses.
- Structural validation: 29 section/block schemas, 13 JSON templates/groups, editor/translation references, configured values, one homepage H1, skip targets, assets and JS syntax.
- Regression suite: 15 passing tests against production JS with DOM/network stubs. Covers localized routes, authoritative cart totals, missing sections, ambiguous mutation failures without replay, stock rejection, concurrent requests, line-key removal, stale variant/search responses, fallback search/variant URLs, selling plans, stock increments and nonexistent multi-option combinations.
- CSS/JS source cost: 48134 raw bytes / 13555 individually gzipped bytes; not a network transfer or measured CWV score.
- Native Shopify upload: new unpublished theme 189049897091. A recommendations range rejected by upload validation was corrected; affected files subsequently uploaded without errors. The structural validator now checks minimum range choices.
- Store theme list and existing development configuration inspected. Horizon remains live. Development settings had no imagery and were preserved in a separate local snapshot.
- Public HTTP inspection reached the password gate; collection/search requests also encountered network failures. It did not validate the storefront UI.
- Admin query failed because no stored app authentication is configured. No definitions, products, inventory, checkout configuration or orders were changed.

## Manual acceptance still required

| Area | Required test |
| --- | --- |
| Homepage | Select real images/collections; inspect order, CTA destinations, crops, readable overlay and merchant edits |
| Collection | Boolean/list/price filters, sort retention, active removal, reset, pagination, empty collection and browser back |
| Product | One/multiple options, different prices, unavailable/nonexistent combinations, stock min/step/max, selected image, video/model if used, no-JS purchase |
| Cart | Add/update/remove, discounts, subtotal, note, error recovery, Escape/focus, drawer/page synchronization, no-JS checkout |
| Search | Products/articles/pages, empty query/results, predictive keyboard paths, failed request, native Enter fallback |
| Admin | Inspect existing definitions; configure shared guide, filters, collection selections, media, menus and policies |
| Checkout | Test-only gateway, shipping/tax/discount calculations, successful and rejected test orders; no real payment |
| Responsive | 320, 390, 768, 1024 and 1440px; overflow, tap targets, gallery, drawer and filter composition |
| Accessibility | Keyboard/zoom/screen reader, focus restoration, labels, meaningful alt text and contrast over actual imagery |
| Performance | Measure LCP <=2.5s, INP <=200ms, CLS <=0.1 with documented viewport/network and real content |
| Theme Editor | Section add/reorder/reload, menu drawer, filters and content settings |

Browser inventory returned no available surfaces. No screenshots, axe, Lighthouse, screen-reader or test-order results are claimed. Source is ready for review; the portfolio-ready visual/store acceptance remains pending.
