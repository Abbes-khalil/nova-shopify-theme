# NOVA / Move different

## Design audit
Code inspection found two visually similar banners, a uniform category grid, restrained hero sizing and no expressive brand moment. No campaign imagery or collection picks were configured in the checked-in homepage. Rendered design cannot be assessed from that evidence alone.

## Art direction
Photography-led editorial streetwear: oversized condensed Oswald (merchant font picker), clean existing body typography, ink and bone, warm grey image fields and selective acid-green CTA treatment. No external animation library. The direction takes editorial restraint and streetwear confidence from the brief, without copying reference brand assets or layouts.

## Homepage implementation
1. MOVE DIFFERENT campaign: 100svh, separate mobile media, existing overlay controls and eager responsive image.
2. Asymmetric clothing/accessories discovery, with actual merchant-selected collection URLs and optional titles.
3. New Season four-product grid, shared product cards and optional secondary hover imagery.
4. NOT MADE TO FIT IN: full-width ink typography statement.
5. Editorial split campaign: image left, narrative right, stacked on mobile.
6. Selected Essentials: horizontally scrollable product rail with optional existing native/Ajax quick add.
7. Shopify customer newsletter, followed by oversized configurable NOVA footer wordmark.

Header sticks and becomes transparent only over an image-backed first campaign. It returns to bone after the campaign. Mobile navigation remains the existing native dialog. CSS and header scroll enhancement load only on homepage. Other page redesigns are deferred.

## Configure before visual approval
- Theme settings > Editorial homepage: display font and five palette colors. Existing global settings remain intact.
- Hero: assign an original wide campaign photograph and a distinct portrait crop for mobile. Keep the subject in the upper/right region and leave lower-left negative space for type. Adjust overlay to maintain readable text. Use Shopify image focal points.
- Categories: assign Clothing and Accessories collections plus original editorial custom imagery. Labels and collection destinations remain editable. Unconfigured categories are omitted rather than fabricated.
- Assign real collections to New Season and Selected Essentials. Add second product images where suitable. Optional quick add keeps the existing single-variant eligibility rules.
- Split campaign: assign a lifestyle photograph. The layout falls back to text when media is missing.
- Newsletter uses the existing Shopify customer form. Footer wordmark is editable; menus remain merchant-driven.

## Acceptance / verification
Automated structural checks, JavaScript syntax, Shopify Theme Check and existing commerce behavior tests are run for this branch. They do not establish rendered visual quality.
No browser surface is available in this session. Desktop/mobile screenshots, crop review, horizontal overflow, real fonts, overlay transition and keyboard/touch interactions remain unverified. Store password and missing configured media also prevent photographic acceptance.

Review at 320, 390, 768, 1024 and 1440px. Check the hero headline and CTA without overlap; portraits and collection crops; desktop hover and keyboard focus; rail touch scroll and tab navigation; mobile menu Escape/focus return; native newsletter validation; cart opening after Quick Add; and reduced-motion preference. Compare other page types for regressions before approving shared section changes.

## Files changed
- layout/theme.liquid
- assets/editorial-home.css and assets/editorial-home.js
- config/settings_schema.json and locales/en.default.schema.json
- templates/index.json
- sections/nova-hero.liquid, nova-shop-by-category (reused unchanged), nova-featured-collection.liquid and nova-brand-story.liquid
- sections/header.liquid and footer.liquid
- blocks/category-card.liquid and snippets/product-card.liquid

Source implementation is ready for review. Visual approval remains pending configured imagery and rendered QA. Product, collection, cart and search page redesigns have not begun.

Platform references: [responsive images and focal points](https://shopify.dev/docs/api/liquid/filters/image_tag), [merchant input settings](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings).
