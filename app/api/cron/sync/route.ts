/**
 * GET /api/cron/sync?key=your-cron-secret
 *
 * Cron-friendly endpoint for external services (cron-job.org, crontab, etc.)
 *
 * Security: Protected by CRON_SECRET env var.
 * Usage: curl -X GET "https://technodel.net/api/cron/sync?key=your-secret"
 */

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const expectedKey = process.env.CRON_SECRET;

  if (expectedKey && key !== expectedKey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scriptPath = path.join(process.cwd(), "scripts", "sync-engine.js");
  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json({ error: "Script not found" }, { status: 500 });
  }

  try {
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      cwd: process.cwd(),
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, NODE_ENV: "production" },
    });

    const output = stdout || stderr;
    const completed = output.includes("SYNC") && output.includes("COMPLETED");

    return NextResponse.json({
      status: completed ? "completed" : "unknown",
      exitCode: 0,
      timestamp: new Date().toISOString(),
      output: output.substring(0, 2000),
    });
  } catch (err: unknown) {
    const error = err as Error & { stdout?: string; stderr?: string; code?: number };
    return NextResponse.json({
      status: error.message?.includes("timeout") ? "timeout" : "failed",
      exitCode: error.code || 1,
      error: error.message?.substring(0, 500),
      output: (error.stdout || error.stderr || "").substring(0, 2000),
      timestamp: new Date().toISOString(),
    });
  }
}
