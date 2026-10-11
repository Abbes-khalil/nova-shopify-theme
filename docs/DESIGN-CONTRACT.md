# NOVA implementation contract

## Current system
Existing Skeleton Liquid theme in Nova Store; Git root is its parent. Preserve existing nova-hero, category-card, featured collection, header/footer configuration and merchant setting IDs. Changes target tokens, component scopes, purchase/cart/search sections, shared snippets and small vanilla modules. Baseline: a929988.

## Business truth
Personal fashion storefront demonstration. No client, reviews, revenue or performance claims. Shopify owns catalogue, accounts and checkout.

## Page scope
Announcement, navigation, main hero, categories, featured collection, promotional hero, story, newsletter, footer. Catalogue/PDP/cart/search remain separate routes.

## Reference contract
Use the user's supplied fashion brief as the design reference: photography first, restrained navigation, consistent media ratios, clear prices and purchase states. Avoid decorative widgets, fabricated proof, repeated promotional clutter and dependence on animation. Official Shopify platform documentation is authoritative.

## Visual lane
White #FFFFFF, surface #F5F5F5, text/accent #171717, muted #737373, border #E5E5E5, success #166534, error #B91C1C. Merchant colors remain configurable. Work Sans via existing font setting; fluid headings; 4:5 cards; 1440px default page width; 16–20px phone margins and 40–64px desktop margins. Reuse named spacing and button tokens.

## Motion storyboard
Navigation/filter/cart use native dialogs with immediate focus changes. Cards and buttons use 160ms color/opacity transitions; no scroll effects, parallax or hidden content awaiting animation. Reduced motion removes transitions.

## Implementation stack
Liquid, CSS and vanilla JavaScript; Shopify native APIs; no frontend runtime dependencies. CLI is development tooling only. Adapt previously tested NOVA behavior where compatible, preserving this repository's components and settings.

## Acceptance gates
Theme Check, template/schema/translation references, JS syntax, cart/variant/search failure regressions. Live tests: 320/390/768/1024/1440px, keyboard dialogs, real catalogue/filters, variant purchases/cart totals, test checkout, Theme Editor reloads and measured performance. No browser evidence will be claimed without execution.
