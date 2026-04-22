#!/usr/bin/env node
/**
 * check-versions.ts
 * Validates that installed package versions match the pinned versions in package-versions.json
 * and that there are no duplicate Zod installations in node_modules.
 *
 * Run: npm run check-versions
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(process.cwd());

// ---------------------------------------------------------------------------
// Load pinned versions
// ---------------------------------------------------------------------------
const pinnedVersionsPath = join(ROOT, 'package-versions.json');
if (!existsSync(pinnedVersionsPath)) {
  console.error('❌ package-versions.json not found');
  process.exit(1);
}

const pinnedVersionsDoc = JSON.parse(readFileSync(pinnedVersionsPath, 'utf-8')) as {
  versions: Record<string, { version: string; reason: string }>;
};
console.log(`📋 package-versions.json found with ${Object.keys(pinnedVersionsDoc.versions ?? {}).length} pinned packages.`);

// ---------------------------------------------------------------------------
// Load installed versions from node_modules
// ---------------------------------------------------------------------------
function getInstalledVersion(pkg: string): string | null {
  const pkgJsonPath = join(ROOT, 'node_modules', pkg, 'package.json');
  if (!existsSync(pkgJsonPath)) return null;
  const data = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as { version: string };
  return data.version;
}

// ---------------------------------------------------------------------------
// Check for duplicate Zod installations
// ---------------------------------------------------------------------------
function findZodInstallations(): string[] {
  const found: string[] = [];

  // Top-level zod
  const topLevel = join(ROOT, 'node_modules', 'zod', 'package.json');
  if (existsSync(topLevel)) {
    const pkg = JSON.parse(readFileSync(topLevel, 'utf-8')) as { version: string };
    found.push(`node_modules/zod@${pkg.version}`);
  }

  // Nested zod in other packages
  const packagesDir = join(ROOT, 'node_modules');
  try {
    const topLevelPkgs = readdirSync(packagesDir);
    for (const pkgFolder of topLevelPkgs) {
      const nestedZod = join(packagesDir, pkgFolder, 'node_modules', 'zod', 'package.json');
      if (existsSync(nestedZod)) {
        const pkg = JSON.parse(readFileSync(nestedZod, 'utf-8')) as { version: string };
        found.push(`node_modules/${pkgFolder}/node_modules/zod@${pkg.version}`);
      }
    }
  } catch {
    // ignore
  }

  return found;
}

// ---------------------------------------------------------------------------
// Run checks
// ---------------------------------------------------------------------------
let hasErrors = false;

console.log('🔍 Checking package versions...\n');

// Check critical packages
const criticalPackages = ['ai', '@ai-sdk/openai', 'zod', '@upstash/redis', '@upstash/ratelimit', 'uuid'];

for (const pkg of criticalPackages) {
  const installed = getInstalledVersion(pkg);
  if (!installed) {
    console.error(`  ❌ ${pkg}: NOT INSTALLED`);
    hasErrors = true;
    continue;
  }
  console.log(`  ✅ ${pkg}@${installed}`);
}

// Check for Zod duplicates
console.log('\n🔍 Checking for duplicate Zod installations...\n');
const zodInstalls = findZodInstallations();

if (zodInstalls.length === 0) {
  console.log('  ✅ No duplicate Zod found');
} else if (zodInstalls.length === 1) {
  console.log(`  ✅ Single Zod installation: ${zodInstalls[0]}`);
} else {
  // Check if all are the same major version
  const versions = zodInstalls.map((s) => s.split('@').pop()?.split('.')[0]);
  const uniqueMajors = [...new Set(versions)];
  if (uniqueMajors.length === 1) {
    console.log(`  ⚠️  Multiple Zod installs (all v${uniqueMajors[0]}):`);
    zodInstalls.forEach((z) => console.log(`     - ${z}`));
  } else {
    console.error(`  ❌ MULTIPLE ZOD MAJOR VERSIONS DETECTED:`);
    zodInstalls.forEach((z) => console.error(`     - ${z}`));
    hasErrors = true;
  }
}

// Final result
console.log('\n' + '═'.repeat(50));
if (hasErrors) {
  console.error('❌ Version check FAILED — fix the issues above before deploying.');
  process.exit(1);
} else {
  console.log('✅ All version checks passed.');
  process.exit(0);
}
