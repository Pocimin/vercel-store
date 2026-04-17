import { NextRequest, NextResponse } from "next/server";
import { findUser, formatExpiration } from "@/lib/vonalia";

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    const vonaliaApiKey = process.env.VONALIA_API_KEY;

    if (!vonaliaApiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Find user by password (which is the key in Vonalia)
    const result = await findUser(vonaliaApiKey, key);

    if (result.Error) {
      return NextResponse.json(
        { error: "Invalid key", valid: false },
        { status: 404 }
      );
    }

    if (!result.Info) {
      return NextResponse.json(
        { error: "Invalid key", valid: false },
        { status: 404 }
      );
    }

    // Check if blacklisted
    if (result.Info.Blacklist === "true") {
      return NextResponse.json(
        { error: "This key has been blacklisted", valid: false, reason: result.Info.Reason },
        { status: 403 }
      );
    }

    // Check if frozen
    if (result.Info.Frozen === "true") {
      return NextResponse.json(
        { error: "This key has been frozen", valid: false },
        { status: 403 }
      );
    }

    // Check if whitelist has expired
    const whitelistTimestamp = parseInt(result.Info.Whitelist || "0");
    const now = Math.floor(Date.now() / 1000);
    if (whitelistTimestamp < now && whitelistTimestamp !== 0) {
      return NextResponse.json(
        { error: "This key has expired", valid: false },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      userData: {
        key: key,
        plan: result.Info.Type || "Unknown",
        expiresAt: formatExpiration(result.Info.Whitelist),
        hwid: result.Info.Hardware || "Not set",
        robloxUsername: result.Info.Roblox || "Not set",
      },
    });
  } catch (error) {
    console.error("Key validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
