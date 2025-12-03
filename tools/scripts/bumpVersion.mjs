/**
 * This is a minimal script to bump the version in package.json.
 * This is meant to be used as-is or customize as you see fit.
 *
 * Usage: node tools/scripts/bumpVersion.mjs <version>
 * Example: node tools/scripts/bumpVersion.mjs 1.2.3
 * Example: node tools/scripts/bumpVersion.mjs v1.2.3
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function invariant(condition, message) {
    if (!condition) {
        console.error(`\x1b[1m\x1b[31m${message}\x1b[0m`);
        process.exit(1);
    }
}

// Executing bump script: node tools/scripts/bumpVersion.mjs <version>
const [, , version] = process.argv;

// clean up version input to use gitHub tags with v prefix.
const cleanVersion = version && version.replace(/^v/, '');

// A simple SemVer validation to validate the version
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;
invariant(
    cleanVersion && validVersion.test(cleanVersion),
    `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${version}.`,
);

// Get the project root (two levels up from tools/scripts)
const projectRoot = join(__dirname, '../..');

// Updating the version in "package.json"
try {
    const packageJsonPath = join(projectRoot, 'package.json');
    const json = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const oldVersion = json.version;
    json.version = cleanVersion;
    writeFileSync(packageJsonPath, JSON.stringify(json, null, 2) + '\n');
    console.log(`\x1b[32m✓\x1b[0m Version updated from ${oldVersion} to ${cleanVersion}`);
} catch (e) {
    console.error(
        `\x1b[1m\x1b[31mError reading or writing package.json file: ${e.message}\x1b[0m`,
    );
    process.exit(1);
}

