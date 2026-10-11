# NOVA — Custom Shopify Fashion Store Development

A personal fashion storefront demonstration built on the existing Shopify Skeleton theme, Liquid, CSS and vanilla JavaScript. Version 0.3.0 adds premium neutral design tokens, merchant-editable homepage content, native collection filtering/pagination, real variant selection, AJAX cart, predictive search, recommendations and structured product content.

[Unpublished preview](https://nova-store-zg7nnalu.myshopify.com/?preview_theme_id=189049897091) · [Theme Editor](https://nova-store-zg7nnalu.myshopify.com/admin/themes/189049897091/editor)

The storefront is password-protected. Source and upload validation pass; rendered visual/accessibility/performance checks and test orders remain pending. This is a personal demonstration, not a paying-client project or a measured conversion result.

## Quick start

Git root and theme root are separate:

~~~powershell
cd 'Nova Store'
npm ci --ignore-scripts
npm run verify
npm run seed:preview
npm run dev -- --store nova-store-zg7nnalu.myshopify.com
npm run package
~~~

Node.js 24 recommended; Shopify CLI 4.9.3 is pinned. Native product/cart/search forms remain as progressive fallbacks. No frontend build step or third-party storefront runtime is required. Never commit credentials.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) and [features](docs/FEATURES.md)
- [Installation](docs/INSTALLATION.md) and [Theme Editor guide](docs/THEME-EDITOR.md)
- [Metafields/metaobjects](docs/DATA-MODEL.md) and [commerce setup](docs/COMMERCE-SETUP.md)
- [QA results and manual acceptance](docs/QA.md)
- [Screenshot checklist](docs/SCREENSHOTS.md), [video storyboard](docs/DEMO-VIDEO.md), [case study](docs/CASE-STUDY.md)
- [Phase delivery and rollback](docs/HANDOFF.md)

## Source and review

Repository: [Abbes-khalil/nova-shopify-theme](https://github.com/Abbes-khalil/nova-shopify-theme). Review branch: feature/premium-storefront. Main is unchanged. The isolated local checkout is C:/Users/khalil/nova/nova-shopify-theme; the original Desktop checkout is preserved.

The Skeleton architecture, existing NOVA components, merchant setting IDs and upstream MIT license are retained. Catalogue, inventory, account configuration, policies, payment, shipping and tax belong to Shopify Admin. Homepage imagery and collection selections require merchant configuration.
