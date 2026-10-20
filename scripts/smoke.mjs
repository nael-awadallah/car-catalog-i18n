// Packs the package, checks every documented export exists in the tarball,
// installs it into a throwaway consumer and runs the ESM, CJS and TS examples.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROOT } from "./lib/data.mjs";

const isWin = process.platform === "win32";
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], shell: isWin });

const work = mkdtempSync(join(tmpdir(), "car-catalog-smoke-"));
let failed = false;
try {
  if (!existsSync(join(ROOT, "dist"))) throw new Error("dist/ missing: run `npm run build` first");
  const [packed] = JSON.parse(
    run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", work], ROOT),
  );
  const files = new Set(packed.files.map((f) => f.path));

  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const targets = [];
  const walk = (value) => {
    if (typeof value === "string") targets.push(value);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(pkg.exports);
  walk([pkg.main, pkg.module, pkg.types]);
  for (const target of targets) {
    const path = target.replace(/^\.\//, "");
    if (!files.has(path)) {
      failed = true;
      console.error(`Missing from packed artifact: ${path}`);
    }
  }
  if (failed) process.exit(1);
  console.log(`Packed artifact contains all ${targets.length} export targets`);

  const consumer = join(work, "consumer");
  cpSync(join(ROOT, "examples"), consumer, { recursive: true });
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "consumer", private: true }));
  run("npm", ["install", "--no-audit", "--no-fund", join(work, packed.filename)], consumer);

  run("node", ["esm.mjs"], consumer);
  run("node", ["cjs.cjs"], consumer);
  run(
    "node",
    [
      join(ROOT, "node_modules", "typescript", "bin", "tsc"),
      "--noEmit", "--strict", "--module", "nodenext", "--moduleResolution", "nodenext",
      "--target", "es2020", "--resolveJsonModule", "typescript.mts",
    ],
    consumer,
  );
  console.log("ESM, CJS and TypeScript consumers passed");
} finally {
  rmSync(work, { recursive: true, force: true });
}
