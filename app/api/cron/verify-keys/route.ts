import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findUser } from "@/lib/vonalia";

const VONALIA_API_KEY = process.env.VONALIA_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cron job to verify all license keys every 30 minutes
 * This route should be called by a scheduler (Vercel Cron, GitHub Actions, etc.)
 * 
 * To verify keys manually: POST /api/cron/verify-keys with header X-Cron-Secret
 */
export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = request.headers.get("x-cron-secret");
  
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!VONALIA_API_KEY) {
    return NextResponse.json(
      { error: "Vonalia API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Get all users with licenses
    const users = await prisma.user.findMany({
      where: {
        licenseKey: { not: null },
      },
      select: {
        id: true,
        licenseKey: true,
        licensePassword: true,
        lastKeyVerified: true,
      },
    });

    const results = {
      total: users.length,
      verified: 0,
      expired: 0,
      invalid: 0,
      errors: 0,
      updated: [] as string[],
    };

    // Verify each key
    for (const user of users) {
      try {
        // Skip if verified in the last 25 minutes (to avoid rate limits)
        if (user.lastKeyVerified) {
          const lastVerified = new Date(user.lastKeyVerified).getTime();
          const twentyFiveMinsAgo = Date.now() - 25 * 60 * 1000;
          if (lastVerified > twentyFiveMinsAgo) {
            continue;
          }
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        const password = user.licensePassword || user.licenseKey!;
        const userKey = user.licenseKey || "";
        const result = await findUser(VONALIA_API_KEY, password, userKey);

        let keyStatus = "unknown";
        let needsUpdate = false;

        if (result.Error) {
          if (result.Error.includes("not found") || result.Error.includes("invalid")) {
            keyStatus = "invalid";
            results.invalid++;
            needsUpdate = true;
          } else {
            keyStatus = "error";
            results.errors++;
          }
        } else if (result.Info) {
          const whitelist = result.Info.Whitelist;
          if (whitelist) {
            const whitelistTime = parseInt(whitelist);
            const now = Math.floor(Date.now() / 1000);
            if (whitelistTime < now) {
              keyStatus = "expired";
              results.expired++;
            } else {
              keyStatus = "active";
              results.verified++;
            }
          } else {
            keyStatus = "active";
            results.verified++;
          }
          needsUpdate = true;
        }

        // Update user record
        if (needsUpdate) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastKeyVerified: new Date(),
              keyStatus: keyStatus,
            },
          });
          results.updated.push(user.id);
        }

      } catch (error) {
        console.error(`Failed to verify key for user ${user.id}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for simple health checks
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
