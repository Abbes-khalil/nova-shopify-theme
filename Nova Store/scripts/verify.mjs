import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const args of [ ['node_modules/@shopify/cli/bin/run.js', 'theme', 'check'], ['scripts/validate-theme.mjs'], ['--test', 'tests/storefront.test.mjs'] ]) {
  execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true });
}
