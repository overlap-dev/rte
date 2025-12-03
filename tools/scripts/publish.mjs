import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fail(message) {
    console.error(`\x1b[1m\x1b[31m${message}\x1b[0m`);
    process.exit(1);
}

// Args: node tools/scripts/publish.mjs <version> [tag]
const [, , inputVersion, inputTag = "latest"] = process.argv;
if (!inputVersion) fail("Missing <version> argument.");

const cleanVersion = inputVersion.replace(/^v/, "");
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?$/;
if (!validVersion.test(cleanVersion)) {
    fail(
        `Version did not match expected SemVer: #.#.#-tag.# or #.#.#, got "${inputVersion}"`
    );
}

// Paths
const projectRoot = join(__dirname, "../..");
const distPath = join(projectRoot, "dist");
const pkgPath = join(projectRoot, "package.json");
process.chdir(projectRoot);

// Check dist exists & required files
function checkFileExists(path, errMsg) {
    if (!existsSync(path)) fail(errMsg);
}
checkFileExists(
    distPath,
    'Build output directory "dist" not found. Run "npm run build" first.'
);
checkFileExists(
    join(distPath, "index.js"),
    'Build output "dist/index.js" not found.'
);
checkFileExists(
    join(distPath, "index.esm.js"),
    'Build output "dist/index.esm.js" not found.'
);
checkFileExists(
    join(distPath, "index.d.ts"),
    'Build output "dist/index.d.ts" not found.'
);
checkFileExists(pkgPath, "Could not find package.json in project root.");

// Optionally update the package.json version
try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    if (pkg.version !== cleanVersion) {
        pkg.version = cleanVersion;
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
        console.log(
            `\x1b[33mUpdated package.json version to ${cleanVersion}\x1b[0m`
        );
    }
} catch (err) {
    fail(`Could not read/write package.json: ${err}`);
}

// npm publish
try {
    console.log(
        `\x1b[36mPublishing ${pkgPath}@${cleanVersion} with tag "${inputTag}"...\x1b[0m`
    );
    execSync(`npm publish --access public --tag ${inputTag}`, {
        stdio: "inherit",
    });
    console.log(
        `\x1b[32m✓\x1b[0m Successfully published version ${cleanVersion} with tag "${inputTag}"`
    );
} catch (e) {
    fail(`Error publishing: ${e.message}`);
}
