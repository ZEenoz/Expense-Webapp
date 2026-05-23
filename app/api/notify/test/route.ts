import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/googleSheets";
import { sendPushMessage, createUnpaidExpensesFlex } from "@/lib/line";
import { getCurrentMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Admin verification
    const adminIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(",") || [];
    if (!adminIds.includes(userId)) {
      return NextResponse.json({ success: false, error: "Unauthorized (Admin only)" }, { status: 403 });
    }

    const expenses = await getSheetData(userId);
    const currentMonth = getCurrentMonth();
    
    // Find unpaid items for current month
    const unpaidItems = expenses.filter(e => 
      e.dueMonth === currentMonth && !e.paidStatus
    );

    if (unpaidItems.length > 0) {
      const flexMessage = createUnpaidExpensesFlex(unpaidItems);
      await sendPushMessage(userId, [
        { type: "text", text: `(TEST ADMIN) 🔔 แจ้งเตือนรายการค้างชำระประจำเดือนนี้ครับ` },
        flexMessage
      ]);
      return NextResponse.json({ success: true, message: "Test notification sent successfully (Unpaid summary)" });
    } else {
      await sendPushMessage(userId, [
        { type: "text", text: `(TEST ADMIN) 🔔 ไม่มีรายการค้างชำระในเดือนนี้ครับ ยอดเยี่ยมมาก!` }
      ]);
      return NextResponse.json({ success: true, message: "Test notification sent successfully (No unpaid items)" });
    }

  } catch (error: any) {
    console.error("Test Notify Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
