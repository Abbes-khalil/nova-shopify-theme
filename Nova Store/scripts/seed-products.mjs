import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const args = new Set(process.argv.slice(2));
const allowed = new Set(['--apply', '--dry-run', '--definitions']);
for (const arg of args) if (!allowed.has(arg)) throw new Error('Unknown argument: ' + arg);
const products = JSON.parse(await readFile(new URL('./data/catalogue.json', import.meta.url), 'utf8'));
const metafields = [
  { name: 'Care instructions', key: 'care_instructions', type: 'multi_line_text_field' },
  { name: 'Materials', key: 'materials', type: 'multi_line_text_field' },
  { name: 'Size guide', key: 'size_guide', type: 'json' },
  { name: 'Product information', key: 'sustainability', type: 'rich_text_field' }
];
const definitions = [
  { name: 'Lookbook', type: 'lookbook', displayNameKey: 'title', access: { storefront: 'PUBLIC_READ' }, capabilities: { publishable: { enabled: true } }, fieldDefinitions: [
    { name: 'Title', key: 'title', type: 'single_line_text_field', required: true },
    { name: 'Description', key: 'description', type: 'rich_text_field' },
    { name: 'Image', key: 'image', type: 'file_reference', validations: [{ name: 'file_type_options', value: '["Image"]' }] },
    { name: 'Collection', key: 'collection_reference', type: 'collection_reference' },
    { name: 'Products', key: 'products', type: 'list.product_reference' }
  ] },
  { name: 'Campaign', type: 'campaign', displayNameKey: 'title', access: { storefront: 'PUBLIC_READ' }, capabilities: { publishable: { enabled: true } }, fieldDefinitions: [
    { name: 'Title', key: 'title', type: 'single_line_text_field', required: true },
    { name: 'Description', key: 'description', type: 'rich_text_field' },
    { name: 'Background image', key: 'background_image', type: 'file_reference', validations: [{ name: 'file_type_options', value: '["Image"]' }] },
    { name: 'Button text', key: 'cta_text', type: 'single_line_text_field' },
    { name: 'Button URL', key: 'cta_link', type: 'url' },
    { name: 'Start date', key: 'start_date', type: 'date' },
    { name: 'End date', key: 'end_date', type: 'date' }
  ] }
];
const collections = [
  { title: 'New Arrivals', handle: 'new-arrivals', tag: 'new-arrivals' },
  { title: 'Sale', handle: 'sale', tag: 'sale' },
  { title: 'Accessories', handle: 'accessories', tag: 'accessories' },
  { title: 'Clothing', handle: 'clothing', tag: 'clothing' }
];
if (!args.has('--apply') || args.has('--dry-run')) {
  console.log(JSON.stringify({ mode: 'dry-run', products, collections, metafields, metaobjects: args.has('--definitions') ? definitions : [], note: 'Creates missing draft products/collections; preserves existing records. Add imagery, stock and publish in Admin. No requests sent.' }, null, 2));
} else {
  const store = process.env.SHOPIFY_STORE;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const version = process.env.SHOPIFY_API_VERSION || '2026-10';
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(store || '')) throw new Error('Set SHOPIFY_STORE to a development store hostname.');
  if (!token) throw new Error('Set SHOPIFY_ADMIN_ACCESS_TOKEN in this process environment.');
  if (!/^20\d{2}-(01|04|07|10)$/.test(version)) throw new Error('Invalid API version.');
  const graphql = async (query, variables = {}) => {
    const response = await fetch('https://' + store + '/admin/api/' + version + '/graphql.json', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Admin API HTTP ' + response.status + '. No mutation is automatically retried.');
    const json = await response.json();
    if (json.errors?.length) throw new Error(json.errors.map((error) => error.message).join('; '));
    for (const payload of Object.values(json.data || {})) if (payload?.userErrors?.length) throw new Error(payload.userErrors.map((error) => error.message).join('; '));
    return json.data;
  };
  for (const field of metafields) {
    const found = await graphql('query($key:String!){metafieldDefinitions(first:1,ownerType:PRODUCT,namespace:"nova",key:$key){nodes{id type{name}}}}', { key: field.key });
    if (found.metafieldDefinitions.nodes.length) { if (found.metafieldDefinitions.nodes[0].type.name !== field.type) throw new Error('Existing metafield type mismatch: nova.' + field.key); continue; }
    await graphql('mutation($definition:MetafieldDefinitionInput!){metafieldDefinitionCreate(definition:$definition){createdDefinition{id} userErrors{message}}}', { definition: { ...field, namespace: 'nova', ownerType: 'PRODUCT', access: { storefront: 'PUBLIC_READ' } } });
  }
  if (args.has('--definitions')) for (const definition of definitions) {
    const found = await graphql('query($type:String!){metaobjectDefinitionByType(type:$type){id}}', { type: definition.type });
    if (found.metaobjectDefinitionByType) continue;
    await graphql('mutation($definition:MetaobjectDefinitionCreateInput!){metaobjectDefinitionCreate(definition:$definition){metaobjectDefinition{id} userErrors{message}}}', { definition });
  }
  for (const item of products) {
    const found = await graphql('query($handle:String!){productByIdentifier(identifier:{handle:$handle}){id}}', { handle: item.handle });
    if (found.productByIdentifier) { console.log('Preserved existing product: ' + item.handle); continue; }
    const input = { title: item.title, handle: item.handle, vendor: 'NOVA', productType: item.type, descriptionHtml: item.description, status: 'DRAFT', tags: item.tags,
      productOptions: [{ name: 'Size', position: 1, values: item.sizes.map((size) => ({ name: size })) }],
      variants: item.sizes.map((size) => ({ optionValues: [{ optionName: 'Size', name: size }], price: item.price, compareAtPrice: item.compare || null, sku: 'NOVA-' + item.handle.toUpperCase() + '-' + size.toUpperCase().replaceAll(' ', '-'), inventoryPolicy: 'DENY', inventoryItem: { tracked: true } }))
    };
    // Create only after the existence check. Avoid destructive productSet list replacement on merchant records.
    const data = await graphql('mutation($input:ProductSetInput!){productSet(input:$input,synchronous:true){product{id handle} userErrors{message}}}', { input });
    if (!data.productSet.product) throw new Error('Product creation returned no product.');
    console.log('Created draft product: ' + item.handle);
  }
  for (const collection of collections) {
    const found = await graphql('query($query:String!){collections(first:10,query:$query){nodes{id handle}}}', { query: 'handle:' + collection.handle });
    if (found.collections.nodes.some((node) => node.handle === collection.handle)) { console.log('Preserved existing collection: ' + collection.handle); continue; }
    await graphql('mutation($input:CollectionInput!){collectionCreate(input:$input){collection{id} userErrors{message}}}', { input: { title: collection.title, handle: collection.handle, ruleSet: { appliedDisjunctively: false, rules: [{ column: 'TAG', relation: 'EQUALS', condition: collection.tag }] } } });
    console.log('Created collection: ' + collection.handle);
  }
  console.log('Done. Add merchant imagery, configure stock, publish to Online Store and select collections/menus in Theme Editor. Existing records were preserved.');
}
