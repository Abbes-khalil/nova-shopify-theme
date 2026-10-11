# NOVA phase delivery

Version 0.3.0, October 11, 2026.

| Phase | Delivery | Acceptance |
| --- | --- | --- |
| 0 | Existing repository audit | Complete source audit |
| 1 | Tokens, scoped styles, controls, main/skip landmarks | Source checks pass; browser pending |
| 2 | Existing homepage refinements, story and native newsletter | Media/collection setup and visual review pending |
| 3 | Native filters/sorting/pagination, mobile filter dialog | Real catalogue/browser matrix pending |
| 4 | Gallery, options, quantity, availability, product forms | Regression coverage passes; live purchases pending |
| 5 | AJAX cart/drawer, real totals/count, native checkout | Regression coverage passes; checkout integration pending |
| 6 | Full/predictive search and recommendations | Regression coverage passes; live results pending |
| 7 | Optional metafields/metaobjects/shared size-guide model | Exact setup documented; Admin authentication required |
| 8 | SEO, focus/labels, media priorities, source budgets | Source checks pass; measured/browser checks pending |
| 9 | Automated suite, CI, upload validation, acceptance matrix | Automated source checks pass; live QA pending |
| 10 | README, architecture, setup, feature docs, screenshot/video plans, case study | Documents complete; visual evidence pending |

## Review

[Preview](https://nova-store-zg7nnalu.myshopify.com/?preview_theme_id=189049897091), theme NOVA Premium Review 0.3.0. The store is password-protected. [Editor](https://nova-store-zg7nnalu.myshopify.com/admin/themes/189049897091/editor). Main and the live Horizon theme are unchanged.

GitHub review branch: feature/premium-storefront in Abbes-khalil/nova-shopify-theme. Local work: C:/Users/khalil/nova/nova-shopify-theme, theme subfolder Nova Store. The original Desktop checkout remains untouched.

## Rollback

Baseline commit a929988 and focused commits preserve the previous implementation. Revert selected feature commits or open the baseline in another checkout after preserving user edits. Do not use force push or reset main. The previous development theme and published Horizon theme remain separate from this new preview.

## Remaining access

Unlock the preview for storefront checks. Configure Admin app authentication with only the necessary scopes before inspecting or modifying data. See DATA-MODEL.md and COMMERCE-SETUP.md; existing definitions/records must be inspected first. Read QA.md before calling the project complete or publishing portfolio claims.
