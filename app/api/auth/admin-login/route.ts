import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "galaxy";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    // Check admin credentials
    if (username !== ADMIN_USERNAME) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Get admin password hash from settings
    const setting = await prisma.setting.findUnique({ where: { key: "admin_password_hash" } }).catch(() => null);

    if (!setting) {
      // First-time setup: if password is "301088" and no hash stored, create it
      if (password === "301088") {
        const hash = await bcrypt.hash(password, 12);
        await prisma.setting.create({ data: { key: "admin_password_hash", value: hash } }).catch(() => {});
      } else {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
    } else {
      const valid = await bcrypt.compare(password, setting.value);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
    }

    const token = await createSession({ userId: "admin", role: "admin", name: "Galaxy Admin" });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
