import { NextResponse } from "next/server";
import { getUserConfig, saveUserConfig, UserConfig } from "@/lib/googleSheets";
import { verifyLineToken } from "@/lib/auth";
import { SettingsPostSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId, error } = await verifyLineToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
    }

    const config = await getUserConfig(userId);
    
    // Return default if not found
    if (!config) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          userId, 
          reminderDays: [1], 
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
    const { userId, error } = await verifyLineToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = SettingsPostSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 });
    }

    const config: UserConfig = {
      userId,
      reminderDays: validated.data.reminderDays,
      isNotifyEnabled: validated.data.isNotifyEnabled,
    };

    await saveUserConfig(config);
    return NextResponse.json({ success: true, message: "Settings saved" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
