import { createHmac } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getLineClient, createUnpaidExpensesFlex, createMonthlySummaryFlex, createRecordSuccessFlex } from "@/lib/line";
import { getSheetData, parseSheetRow, updateCell, appendRows } from "@/lib/googleSheets";
import { getCurrentMonth, getNextMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Handle POST request from LINE Messaging API Webhook
 */
export async function POST(request: Request) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelSecret || !channelAccessToken) {
    console.error("Missing LINE credentials");
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  // 1. Verify Signature
  const signature = (await headers()).get("x-line-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const body = await request.text();
  const hmac = createHmac("sha256", channelSecret);
  const digest = hmac.update(body).digest("base64");

  if (signature !== digest) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Parse Events
  const { events } = JSON.parse(body);
  const client = getLineClient();

  for (const event of events) {
    try {
      const userId = event.source.userId;
      if (!userId) continue;

      // ─── Text Message Handling ───
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim();

        // A. Command: "ชำระเสร็จสิ้น"
        if (text === "ชำระเสร็จสิ้น") {
          const expenses = await getSheetData(userId);

          const flexMessage = createUnpaidExpensesFlex(expenses);
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [flexMessage as any],
          });
          continue;
        }

        // B. Command: "สรุป"
        if (text === "สรุป" || text === "สรุปรายเดือน") {
          const expenses = await getSheetData(userId);

          const flexMessage = createMonthlySummaryFlex(expenses);
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [flexMessage as any],
          });
          continue;
        }

        // C. Command: "บันทึกรายจ่าย" (Natural Language Parser)
        // Format: [Item Name] [Price] [Installments]
        // Example: "iPad 25000 10" or "KFC 300"
        const recordRegex = /^(.+?)\s+(\d+(?:\.\d+)?)(?:\s+(\d+))?$/;
        const match = text.match(recordRegex);

        if (match) {
          const itemName = match[1].trim();
          const totalPrice = parseFloat(match[2]);
          const totalInstallments = match[3] ? parseInt(match[3], 10) : 1;
          const monthlyPayment = totalPrice / totalInstallments;
          const timestamp = new Date().toISOString();
          const startMonth = getCurrentMonth();
          const category = "Uncategorized"; // Default

          // Generate installment rows
          const rowsToAppend: string[][] = [];
          let currentDueMonth = startMonth;

          for (let i = 1; i <= totalInstallments; i++) {
            // Row Format: [Timestamp, Item, TotalPrice, Status(1/N), Monthly, DueMonth, Category, PaidStatus]
            rowsToAppend.push([
              timestamp,
              itemName,
              totalPrice.toString(),
              `${i} / ${totalInstallments}`,
              monthlyPayment.toString(),
              currentDueMonth,
              category,
              "", // Empty PaidStatus
            ]);
            currentDueMonth = getNextMonth(currentDueMonth);
          }

          await appendRows(rowsToAppend, userId);
          
          const flexMessage = createRecordSuccessFlex(itemName, totalPrice, totalInstallments);
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [flexMessage as any],
          });
          continue;
        }
      }

      // ─── Postback Event Handling (Button Clicks) ───
      if (event.type === "postback") {
        const data = new URLSearchParams(event.postback.data);
        const action = data.get("action");
        const rowIndexStr = data.get("rowIndex");
        const itemName = data.get("itemName");

        if (action === "mark_paid" && rowIndexStr) {
          const rowIndex = parseInt(rowIndexStr, 10);
          
          // Security check: Verify the row belongs to the user before updating
          const expenses = await getSheetData(userId);
          const belongsToUser = expenses.some(e => e.rowIndex === rowIndex);
          
          if (!belongsToUser) {
            console.warn(`User ${userId} tried to update row ${rowIndex} which doesn't belong to them.`);
            continue;
          }

          await updateCell(rowIndex, "H", "paid");

          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: `✅ บันทึกชำระเงิน "${itemName}" แล้วครับ!`,
              },
            ],
          });
        }
      }
    } catch (err) {
      console.error("Error processing LINE event:", err);
    }
  }

  return NextResponse.json({ success: true });
}
