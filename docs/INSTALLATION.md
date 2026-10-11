# Install and preview NOVA

The isolated working copy is C:/Users/khalil/nova/nova-shopify-theme. Its Shopify root is Nova Store. The original Desktop checkout remains unchanged.

~~~powershell
cd 'C:/Users/khalil/nova/nova-shopify-theme/Nova Store'
npm ci --ignore-scripts
npm run verify
npm run seed:preview
npm run dev -- --store nova-store-zg7nnalu.myshopify.com
npm run package
~~~

Node.js 24 is recommended. CLI 4.9.3 is pinned. Authentication is interactive when needed. Never commit tokens or CLI session files. A local shopify.theme.toml is ignored.

NOVA-0.3.0.zip can be uploaded through Online Store > Themes > Add theme > Upload zip. Inspect an unpublished preview before publishing. Theme files occupy Nova Store; repository docs/CI sit at Git root.

For the original Desktop checkout, fetch origin and check out the GitHub feature/premium-storefront branch after preserving any user changes. Do not force push or reset main. Baseline a929988 remains the rollback point.
