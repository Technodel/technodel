/**
 * POST /admin/sync-report/run
 *
 * Triggers the sync-engine.js script in a child process.
 * Timeout: 60 seconds (sync completes in ~21s with the index fix).
 */

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execPromise = promisify(exec);

export const dynamic = "force-dynamic";

export async function POST() {
  const scriptPath = path.join(process.cwd(), "scripts", "sync-engine.js");

  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json(
      { error: `Sync script not found at ${scriptPath}` },
      { status: 500 }
    );
  }

  try {
    const { stdout, stderr } = await execPromise(`node "${scriptPath}"`, {
      cwd: process.cwd(),
      timeout: 300000, // 5 min safety margin
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "production" },
    });

    const output = stdout + stderr;
    const completed = output.includes("SYNC") && output.includes("COMPLETED");

    return NextResponse.json({
      status: completed ? "completed" : "unknown",
      output: output.substring(0, 5000),
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err as Error & { stdout?: string; stderr?: string };
    const message = error.message || "Unknown error";
    const isTimeout = message.toLowerCase().includes("timeout");
    const output = (error.stdout || error.stderr || "").substring(0, 3000);

    return NextResponse.json(
      {
        status: isTimeout ? "timeout" : "error",
        error: message.substring(0, 500),
        output,
        timestamp: new Date().toISOString(),
      },
      { status: isTimeout ? 200 : 500 }
    );
  }
}
