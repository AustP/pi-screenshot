import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const SCREENSHOT_DIRECTORY_PATH = join(tmpdir(), "pi-screenshot");
const LATEST_SCREENSHOT_PATH = join(SCREENSHOT_DIRECTORY_PATH, "latest.png");
const EXTENSION_DIRECTORY_PATH = dirname(fileURLToPath(import.meta.url));
const CAPTURE_SCRIPT_PATH = join(EXTENSION_DIRECTORY_PATH, "capture-active-display.swift");

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderrOutput = "";

    childProcess.stderr.on("data", (chunk: Buffer) => {
      stderrOutput += chunk.toString();
    });

    childProcess.on("error", (error) => {
      reject(error);
    });

    childProcess.on("close", (exitCode) => {
      if (exitCode === 0) {
        resolve();
        return;
      }
      reject(new Error(stderrOutput.trim() || `${command} exited with code ${String(exitCode)}`));
    });
  });
}

function removeLegacyScreenshots(): void {
  for (const fileName of readdirSync(SCREENSHOT_DIRECTORY_PATH)) {
    if (!fileName.endsWith(".png") || fileName === "latest.png") {
      continue;
    }

    unlinkSync(join(SCREENSHOT_DIRECTORY_PATH, fileName));
  }
}

async function captureScreenshotForDisplayUnderMouse(): Promise<string> {
  mkdirSync(SCREENSHOT_DIRECTORY_PATH, { recursive: true });
  removeLegacyScreenshots();

  await runCommand("swift", [CAPTURE_SCRIPT_PATH, LATEST_SCREENSHOT_PATH]);

  return LATEST_SCREENSHOT_PATH;
}

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    let latestScreenshotPath = "";

    try {
      latestScreenshotPath = await captureScreenshotForDisplayUnderMouse();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.ui.notify(`pi-screenshot: ${message}`, "error");
    }

    const screenshotContextBlock = [
      "",
      "[pi-screenshot extension]",
      latestScreenshotPath ? `Screenshot path: ${latestScreenshotPath}` : `Screenshot path: ${LATEST_SCREENSHOT_PATH} (unavailable: capture failed).`,
      "When the user asks about or references what is on their screen, use the read tool on the screenshot path to inspect it.",
      "",
    ].join("\n");

    return {
      systemPrompt: `${event.systemPrompt}${screenshotContextBlock}`,
    };
  });

}
