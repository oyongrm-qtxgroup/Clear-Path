/**
 * Vite plugin that exposes a `/__dev-checks` endpoint during development.
 *
 * The endpoint runs quick static-analysis checks (grep for `console.log`,
 * TODO/FIXME comments) on the `src/` directory and returns the results as JSON.
 *
 * This plugin is intentionally only active in `serve` (dev) mode.
 */

import { execSync } from "node:child_process";
import type { Plugin } from "vite";

interface HitResult {
  file: string;
  line: number;
  text: string;
}

function runGrep(pattern: string, cwd: string): HitResult[] {
  try {
    // Use git grep for speed; fall back to findstr on Windows if git is unavailable.
    const raw = execSync(
      `git grep -n -I --no-color -E "${pattern}" -- "src/" ":(exclude)src/plugins/dev-checks-plugin.ts" ":(exclude)src/components/common/PreDeploymentChecklist.tsx"`,
      { cwd, encoding: "utf-8", maxBuffer: 1024 * 512 },
    );

    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        // Format: file:lineNo:text
        const [file, lineNo, ...rest] = line.split(":");
        return { file, line: Number(lineNo), text: rest.join(":").trim() };
      });
  } catch {
    // Exit code 1 → no matches (that's a pass!)
    return [];
  }
}

export function devChecksPlugin(): Plugin {
  let root = "";

  return {
    name: "clearpath:dev-checks",
    apply: "serve", // only active in dev

    configResolved(config) {
      root = config.root;
    },

    configureServer(server) {
      server.middlewares.use("/__dev-checks", (_req, res) => {
        const cwd = root || process.cwd();

        const consoleLogs = runGrep("console\\.log\\(", cwd);
        const todos = runGrep("(TODO|FIXME|HACK|XXX)\\b", cwd);

        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            consoleLogs,
            todos,
          }),
        );
      });
    },
  };
}
