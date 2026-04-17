import { NextRequest, NextResponse } from "next/server";
import { editUser } from "@/lib/vonalia";

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

    // Reset HWID by setting Hardware to empty string
    const result = await editUser(vonaliaApiKey, key, {
      Hardware: "",
    });

    if (result.Error) {
      return NextResponse.json(
        { error: result.Error },
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
