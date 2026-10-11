# Feature review

Homepage merchandising, merchant navigation, 4:5 product cards, native filters/sorting/pagination, product gallery/options, authoritative AJAX cart, native checkout handoff, full/predictive search, recommendations, optional data model, newsletter and SEO are implemented in source. Existing hero/category/featured/header/footer setting IDs are preserved.

Supported variant inputs include one-option radios and multiple option selectors resolved against actual Shopify variants. Nonexistent combinations disable purchase; unavailable real variants render their own state. This implementation reads Liquid's variant list and requires separate work for products beyond its 250-variant limit or combined listings.

Native product/cart/search/filter forms remain available without JavaScript. Empty collections/cart/search and missing media/fields have explicit fallbacks. Shopify Admin is the authority for stock, discounts, shipping, tax and payment.

Review ARCHITECTURE.md for component responsibilities and QA.md for actual validation scope.
