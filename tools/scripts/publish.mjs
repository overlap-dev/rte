/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed from the project root.
 *
 * You might need to authenticate with NPM before running this script.
 *
 * Usage: node tools/scripts/publish.mjs <version> [tag]
 * Example: node tools/scripts/publish.mjs 1.2.3 latest
 * Example: node tools/scripts/publish.mjs v1.2.3 next
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function invariant(condition, message) {
    if (!condition) {
        console.error(`\x1b[1m\x1b[31m${message}\x1b[0m`);
        process.exit(1);
    }
}

// Executing publish script: node tools/scripts/publish.mjs <version> [tag]
// Default "tag" to "latest" for production releases
const [, , version, tag = "latest"] = process.argv;

// clean up version input to use gitHub tags with v prefix.
const cleanVersion = version && version.replace(/^v/, "");

// A simple SemVer validation to validate the version
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;
invariant(
    cleanVersion && validVersion.test(cleanVersion),
    `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${version}.`
);

// Get the project root (two levels up from tools/scripts)
const projectRoot = join(__dirname, "../..");

// Verify that dist directory exists and contains required files
const distPath = join(projectRoot, "dist");

invariant(
    existsSync(distPath),
    `Build output directory "dist" not found. Please run "npm run build" first.`
);

invariant(
    existsSync(join(distPath, "index.js")),
    `Build output "dist/index.js" not found. Please run "npm run build" first.`
);

invariant(
    existsSync(join(distPath, "index.esm.js")),
    `Build output "dist/index.esm.js" not found. Please run "npm run build" first.`
);

invariant(
    existsSync(join(distPath, "index.d.ts")),
    `Build output "dist/index.d.ts" not found. Please run "npm run build" first.`
);

// Change to project root directory
process.chdir(projectRoot);

// Execute "npm publish" to publish
try {
    console.log(
        `\x1b[36mPublishing @overlap/rte@${cleanVersion} with tag "${tag}"...\x1b[0m`
    );
    execSync(`npm publish --access public --tag ${tag}`);
    console.log(
        `\x1b[32m✓\x1b[0m Successfully published @overlap/rte@${cleanVersion} with tag "${tag}"`
    );
} catch (e) {
    console.error(
        `\x1b[1m\x1b[31mError publishing package: ${e.message}\x1b[0m`
    );
    process.exit(1);
}
