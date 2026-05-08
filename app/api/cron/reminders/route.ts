import { NextResponse } from "next/server";
import { getSheetsClient, getSheetConfig, getSheetData } from "@/lib/googleSheets";
import { sendPushMessage, createUnpaidExpensesFlex } from "@/lib/line";
import { getCurrentMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Security: Check for Vercel Cron Secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const sheets = getSheetsClient();
    const { spreadsheetId } = getSheetConfig();
    const today = new Date().getDate();
    const currentMonth = getCurrentMonth();

    // 1. Fetch users who want to be reminded today
    const configRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "User_Configs!A:C",
    });
    const configRows = configRes.data.values || [];
    
    // Filter with validation
    const usersToRemind = configRows.slice(1).filter(row => {
      if (!row || row.length < 3) return false; // ข้ามแถวที่ข้อมูลไม่ครบ
      
      const userId = row[0];
      const setDay = parseInt(row[1], 10);
      const isEnabled = String(row[2]).toLowerCase() === "true"; // เช็คได้ทั้ง TRUE, true, True
      
      return userId && setDay === today && isEnabled;
    });

    let sentCount = 0;

    // 2. For each user, check unpaid items and send push notification
    for (const userRow of usersToRemind) {
      const userId = userRow[0];
      const expenses = await getSheetData(userId);
      
      // Find unpaid items for current month
      const unpaidItems = expenses.filter(e => 
        e.dueMonth === currentMonth && !e.paidStatus
      );

      if (unpaidItems.length > 0) {
        const flexMessage = createUnpaidExpensesFlex(unpaidItems);
        await sendPushMessage(userId, [
          { type: "text", text: `🔔 แจ้งเตือนรายการค้างชำระประจำเดือนนี้ครับ` },
          flexMessage
        ]);
        sentCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Checked ${usersToRemind.length} users, sent ${sentCount} reminders.`,
      today 
    });
  } catch (error: any) {
    console.error("Cron Reminder Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
