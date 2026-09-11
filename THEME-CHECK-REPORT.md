# Shopify Theme Check report

Date: 2026-09-11
Theme: `Nova Store`
Shopify CLI: 4.8.0
Configuration: `Nova Store/.theme-check.yml`, extending `theme-check:recommended`.

## Results

| Check | Before | After |
| --- | ---: | ---: |
| Errors | 1 | 0 |
| Warnings | 0 | 0 |
| Informational findings | 0 | 0 |

Final run inspected 45 files with no offenses. No checks were disabled or suppressed.

## Error and fix

- File: `Nova Store/sections/nova-hero.liquid`.
- Rule: `LiquidHTMLSyntaxError`.
- Original location: line 24 (the JSON output uses zero-based row 23).
- Message: `Attempting to close LiquidTag 'comment' before LiquidTag 'if' was closed`.
- Cause: 11 unresolved Git merge conflict blocks mixed two hero implementations across Liquid markup, CSS, and the section JSON schema. The initial parser error prevented reliable analysis of the rest of this section.
- Resolution: removed the conflict markers and retained the `feature/homepage` implementation. Its heading tag, content position, text alignment, and overlay settings match both hero instances in the current homepage template. This also retains desktop/mobile image selection and CTA settings.
- Preserved HTML escaping for the plain-text heading and CTA label; the rich-text description continues to render HTML.

## Verification

- `shopify theme check --path "Nova Store" --output json`: returned `[]` after the fix, exit code 0.
- `shopify theme check --path "Nova Store" --fail-level info`: 45 files inspected with no offenses.
- Parsed the resolved section schema as JSON and verified all configured setting IDs for both homepage hero instances exist in the schema.
- Scanned the theme for merge conflict markers: none remain.
- `git diff --check`: passed. Git emitted line-ending notices for existing user-modified JSON files.

## Scope and restore

Only `Nova Store/sections/nova-hero.liquid` was changed by this fix. This report was added at the repository root. Existing edits to the locale schema, announcement bar, header group, and homepage template were preserved.

The original hero file is backed up at `.git/theme-check-backups/2026-09-11/nova-hero.liquid`. To undo only this fix, copy that backup over `Nova Store/sections/nova-hero.liquid`; this restores the original merge conflicts as well.

These results cover static Theme Check validation and local schema consistency. A live storefront/browser preview was not performed, and nothing was deployed.
