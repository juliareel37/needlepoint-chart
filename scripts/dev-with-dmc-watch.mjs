import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const csvPath = path.join(repoRoot, "data", "thread-colors.csv");

let nextProcess = null;
let generateProcess = null;
let regenerateTimer = null;
let shuttingDown = false;

async function main() {
  await runGenerate();

  const watcher = fs.watch(csvPath, () => {
    scheduleGenerate();
  });

  watcher.on("error", (error) => {
    console.error("[dmc-watch] File watcher error:", error);
  });

  nextProcess = spawn("npm", ["run", "next-dev-raw"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
  });

  nextProcess.on("exit", (code, signal) => {
    watcher.close();

    if (shuttingDown) {
      process.exit(code ?? 0);
      return;
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      shuttingDown = true;
      watcher.close();

      if (regenerateTimer) {
        clearTimeout(regenerateTimer);
        regenerateTimer = null;
      }

      if (generateProcess) {
        generateProcess.kill(signal);
      }

      if (nextProcess) {
        nextProcess.kill(signal);
        return;
      }

      process.exit(0);
    });
  }
}

function scheduleGenerate() {
  if (regenerateTimer) {
    clearTimeout(regenerateTimer);
  }

  regenerateTimer = setTimeout(() => {
    regenerateTimer = null;
    void runGenerate();
  }, 120);
}

function runGenerate() {
  if (generateProcess) {
    return Promise.resolve();
  }

  generateProcess = spawn("node", ["scripts/generate-dmc-colors.mjs"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
  });

  return new Promise((resolve, reject) => {
    generateProcess.on("exit", (code, signal) => {
      generateProcess = null;

      if (signal) {
        reject(new Error(`dmc generator exited with signal ${signal}`));
        return;
      }

      if (code && code !== 0) {
        reject(new Error(`dmc generator exited with code ${code}`));
        return;
      }

      resolve();
    });

    generateProcess.on("error", (error) => {
      generateProcess = null;
      reject(error);
    });
  }).catch((error) => {
    console.error("[dmc-watch] Failed to regenerate DMC colors:", error);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
