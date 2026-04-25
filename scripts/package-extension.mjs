import { readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(rootDir, "extension", "public", "manifest.json");
const packagePath = join(rootDir, "extension", "package.json");
const distDir = join(rootDir, "extension", "dist");
const distManifestPath = join(distDir, "manifest.json");
const artifactsDir = join(rootDir, "artifacts");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const extensionPackage = JSON.parse(readFileSync(packagePath, "utf8"));

if (manifest.version !== extensionPackage.version) {
  throw new Error(
    `Version mismatch: manifest=${manifest.version} package.json=${extensionPackage.version}.`,
  );
}

if (!existsSync(distDir) || !existsSync(distManifestPath)) {
  throw new Error("Missing extension/dist output. Run `pnpm build:ext` before packaging.");
}

const distManifest = JSON.parse(readFileSync(distManifestPath, "utf8"));
if (distManifest.version !== manifest.version) {
  throw new Error(
    `Built manifest version ${distManifest.version} does not match source manifest ${manifest.version}.`,
  );
}

mkdirSync(artifactsDir, { recursive: true });

const zipName = `pablo-extension-v${manifest.version}.zip`;
const zipPath = join(artifactsDir, zipName);
rmSync(zipPath, { force: true });

const zipCheck = spawnSync("zip", ["-v"], { stdio: "ignore" });
if (zipCheck.status !== 0) {
  throw new Error("The `zip` command is required to package the extension.");
}

const result = spawnSync("zip", ["-qr", zipPath, "."], {
  cwd: distDir,
  stdio: "inherit",
});

if (result.status !== 0) {
  throw new Error("Failed to create the extension zip package.");
}

console.log(`Created ${zipPath}`);
