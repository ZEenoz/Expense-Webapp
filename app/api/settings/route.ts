import { NextResponse } from "next/server";
import { getUserConfig, saveUserConfig, UserConfig } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const config = await getUserConfig(userId);
    
    // Return default if not found
    if (!config) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          userId, 
          reminderDay: 1, 
          isNotifyEnabled: false 
        } 
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const config: UserConfig = {
      userId,
      reminderDay: parseInt(body.reminderDay, 10) || 1,
      isNotifyEnabled: body.isNotifyEnabled === true,
    };

    await saveUserConfig(config);
    return NextResponse.json({ success: true, message: "Settings saved" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
