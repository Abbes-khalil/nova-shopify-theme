import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFile(join(root, path), 'utf8');
const parse = (text) => JSON.parse(text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/,\s*([}\]])/g, '$1'));
const lookup = (object, key) => key.split('.').reduce((value, part) => value?.[part], object);
const locales = JSON.parse(await read('locales/en.default.json'));
const editor = JSON.parse(await read('locales/en.default.schema.json'));
const schemas = new Map();
let references = 0;
const checkSettings = (settings, context) => {
  const ids = new Set();
  for (const item of settings || []) {
    if (item.id) { assert(!ids.has(item.id), context + ': duplicate setting ' + item.id); ids.add(item.id); }
    if (item.type === 'range') {
      assert((item.max - item.min) / (item.step || 1) >= 2, context + ': range requires at least three selectable values');
      assert(item.default >= item.min && item.default <= item.max, context + ': range default out of bounds');
      assert(Math.abs((item.default - item.min) / (item.step || 1) - Math.round((item.default - item.min) / (item.step || 1))) < 1e-7, context + ': range default not on a step');
    }
    if (item.type === 'select') assert(item.options.some((option) => option.value === item.default), context + ': missing select default');
  }
};
for (const directory of ['sections', 'blocks', 'snippets', 'layout']) {
  for (const file of await readdir(join(root, directory))) {
    if (!file.endsWith('.liquid')) continue;
    const source = await read(directory + '/' + file);
    const match = source.match(/{%[-\s]*schema\s*%}([\s\S]*?){%[-\s]*endschema\s*%}/);
    if (match) {
      const schema = parse(match[1]);
      schemas.set(directory + '/' + file, schema);
      checkSettings(schema.settings, file);
      for (const block of schema.blocks || []) checkSettings(block.settings, file + '/' + block.type);
      for (const ref of JSON.stringify(schema).matchAll(/t:([^"\\]+)/g)) {
        assert(lookup(editor, ref[1]) !== undefined, file + ': missing editor translation ' + ref[1]); references++;
      }
    }
    for (const ref of source.matchAll(/'([^']+)'\s*\|\s*t(?:\s|:|})/g)) assert(lookup(locales, ref[1]) !== undefined, file + ': missing storefront translation ' + ref[1]);
    for (const ref of source.matchAll(/{%[-\s]*render\s+'([^']+)'/g)) await stat(join(root, 'snippets', ref[1] + '.liquid'));
    for (const ref of source.matchAll(/'([^']+\.(?:js|css|svg))'\s*\|\s*(?:asset_url|inline_asset_content)/g)) await stat(join(root, 'assets', ref[1]));
    assert(!/shp(?:at|ss|ca)_[A-Za-z0-9]{20,}/.test(source), file + ': potential credential');
  }
}
for (const group of parse(await read('config/settings_schema.json'))) checkSettings(group.settings, 'global/' + group.name);
const validateBlocks = (blocks, sectionSchema, context) => {
  for (const block of Object.values(blocks || {})) {
    const local = sectionSchema.blocks?.find((item) => item.type === block.type);
    const blockSchema = (local?.settings ? local : null) || schemas.get('blocks/' + block.type + '.liquid');
    assert(blockSchema, context + ': missing block ' + block.type);
    validateValues(block.settings, blockSchema, context + '/' + block.type);
    validateBlocks(block.blocks, blockSchema, context + '/' + block.type);
  }
};
const validateValues = (values, schema, context) => {
  for (const [id, value] of Object.entries(values || {})) {
    const setting = schema.settings?.find((item) => item.id === id);
    assert(setting, context + ': unknown setting ' + id);
    if (setting.type === 'select') assert(setting.options.some((option) => option.value === value), context + ': invalid select ' + id);
    if (setting.type === 'range') assert(value >= setting.min && value <= setting.max && (value - setting.min) % (setting.step || 1) === 0, context + ': invalid range ' + id);
  }
};
let templates = 0;
for (const directory of ['templates', 'sections']) {
  for (const file of await readdir(join(root, directory))) {
    if (!file.endsWith('.json')) continue;
    const template = parse(await read(directory + '/' + file));
    for (const id of template.order || []) assert(template.sections[id], file + ': missing ordered section');
    for (const [id, section] of Object.entries(template.sections || {})) {
      const schema = schemas.get('sections/' + section.type + '.liquid');
      assert(schema, file + ': missing section ' + section.type);
      validateValues(section.settings, schema, file + '/' + id);
      validateBlocks(section.blocks, schema, file + '/' + id);
    }
    templates++;
  }
}
const index = parse(await read('templates/index.json'));
assert.equal(Object.values(index.sections).filter((section) => (section.settings?.heading_level || section.settings?.heading_tag) === 'h1').length, 1, 'Homepage must configure exactly one H1');
for (const layout of ['theme', 'password']) { const source = await read('layout/' + layout + '.liquid'); assert(source.includes('id="MainContent"') && source.includes('href="#MainContent"'), layout + ': missing skip target'); }
let assetBytes = 0;
for (const file of await readdir(join(root, 'assets'))) {
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', join(root, 'assets', file)], { stdio: 'pipe' });
  if (/\.(?:js|css)$/.test(file)) assetBytes += (await stat(join(root, 'assets', file))).size;
}
assert(assetBytes < 100 * 1024, 'Local CSS/JS exceeds 100KiB raw budget');
console.log(JSON.stringify({ sectionAndBlockSchemas: schemas.size, schemaTranslations: references, templatesAndGroups: templates, rawCssJsBytes: assetBytes, passed: true }, null, 2));
