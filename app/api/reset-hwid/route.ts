import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { editUser } from "@/lib/vonalia";

const SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const userId = token.sub as string;

    // Get user's license info from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { licenseKey: true, licensePassword: true },
    });

    if (!user?.licenseKey) {
      return NextResponse.json(
        { error: "No license found for your account" },
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

    // Reset HWID by setting Hardware to empty string
    // Use stored password (or key as fallback for old redemptions)
    const password = user.licensePassword || user.licenseKey;
    const result = await editUser(vonaliaApiKey, password, {
      Hardware: "",
    });

    if (result.Error) {
      console.log("HWID reset Vonalia error:", result.Error);
      return NextResponse.json(
        { error: `Failed to reset HWID: ${result.Error}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "HWID reset successfully",
    });
  } catch (error) {
    console.error("HWID reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
