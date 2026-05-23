import { messagingApi } from "@line/bot-sdk";
import { Expense } from "@/types/expense";
import { formatCurrency, getCurrentMonth, getMonthSummary, getPaidUnpaidSummary, formatMonthThai } from "./utils";

const { MessagingApiClient } = messagingApi;

/**
 * Get the LINE Messaging API client
 */
export function getLineClient() {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN in environment variables");
  }
  return new MessagingApiClient({
    channelAccessToken,
  });
}

/**
 * Generate a Flex Message for listing unpaid expenses
 */
export function createUnpaidExpensesFlex(expenses: Expense[]) {
  const currentMonth = getCurrentMonth();
  const unpaidThisMonth = expenses.filter(e => e.dueMonth === currentMonth && !e.paidStatus);
  
  if (unpaidThisMonth.length === 0) {
    return {
      type: "text",
      text: "ยินดีด้วย! คุณไม่มีรายการค้างชำระในเดือนนี้แล้วครับ 🎉",
    };
  }

  const totalAmount = unpaidThisMonth.reduce((sum, e) => sum + e.monthlyPayment, 0);

  const itemContents = unpaidThisMonth.map((e) => ({
    type: "box",
    layout: "vertical",
    margin: "md",
    spacing: "sm",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: e.itemName, size: "sm", color: "#555555", flex: 4, wrap: true },
          { type: "text", text: formatCurrency(e.monthlyPayment), size: "sm", color: "#111111", align: "end", weight: "bold", flex: 3 }
        ]
      },
      {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: `งวดที่ ${e.currentInstallment}/${e.totalInstallments}`, size: "xs", color: "#999999", flex: 1, align: "start", gravity: "center" },
          {
            type: "button",
            action: {
              type: "postback",
              label: "จ่ายแล้ว",
              data: `action=mark_paid&rowIndex=${e.rowIndex}&itemName=${encodeURIComponent(e.itemName)}`,
              displayText: `จ่ายรายการ ${e.itemName} แล้ว`,
            },
            style: "primary",
            color: "#10b981",
            height: "sm",
            flex: 1,
          }
        ]
      }
    ]
  }));

  return {
    type: "flex",
    altText: "สรุปยอดรายจ่าย",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#273132",
        contents: [
          { type: "text", text: "สรุปยอดเดือนปัจจุบัน", weight: "bold", size: "lg", color: "#FFFFFF" },
          { type: "text", text: "ประจำเดือน " + formatMonthThai(currentMonth), size: "xs", color: "#AFAFAF" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "รายการค้างชำระ", size: "xs", color: "#AAAAAA", weight: "bold" },
          ...(itemContents as any),
          { type: "separator", margin: "xl" },
          {
            type: "box",
            layout: "horizontal",
            margin: "xl",
            contents: [
              { type: "text", text: "ยอดรวมสุทธิ", size: "md", color: "#111111", weight: "bold" },
              { type: "text", text: formatCurrency(totalAmount), size: "md", color: "#E63946", align: "end", weight: "bold" }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#1DB954",
            action: {
              type: "uri",
              label: "เปิด Dashboard",
              uri: `https://liff.line.me/${process.env.LIFF_ID || ''}`,
            }
          }
        ]
      }
    }
  };
}

/**
 * Generate a Flex Message for Monthly Summary
 */
export function createMonthlySummaryFlex(expenses: Expense[]) {
  const currentMonth = getCurrentMonth();
  const summary = getMonthSummary(expenses, currentMonth);
  const paidInfo = getPaidUnpaidSummary(expenses, currentMonth);
  
  const recentItems = summary.items.slice(-5).reverse().map(e => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: e.itemName,
        size: "sm",
        color: "#cbd5e1",
        flex: 3,
      },
      {
        type: "text",
        text: formatCurrency(e.monthlyPayment),
        size: "sm",
        color: e.paidStatus ? "#10b981" : "#ffffff",
        align: "end",
        flex: 2,
        weight: "bold",
      },
    ],
    margin: "sm",
  }));

  return {
    type: "flex",
    altText: `สรุปรายจ่ายเดือน${formatMonthThai(currentMonth)}`,
    contents: {
      type: "bubble",
      styles: {
        header: { backgroundColor: "#0f172a" },
        body: { backgroundColor: "#1e293b" },
      },
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `สรุปเดือน${formatMonthThai(currentMonth)}`,
            weight: "bold",
            size: "lg",
            color: "#ffffff",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "ยอดรวมทั้งหมด",
                size: "sm",
                color: "#94a3b8",
              },
              {
                type: "text",
                text: formatCurrency(summary.totalAmount),
                size: "xxl",
                weight: "bold",
                color: "#60a5fa",
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            spacing: "md",
            contents: [
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "จ่ายแล้ว",
                    size: "xs",
                    color: "#10b981",
                  },
                  {
                    type: "text",
                    text: formatCurrency(paidInfo.paidAmount),
                    size: "sm",
                    weight: "bold",
                    color: "#ffffff",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "คงเหลือ",
                    size: "xs",
                    color: "#f87171",
                  },
                  {
                    type: "text",
                    text: formatCurrency(paidInfo.unpaidAmount),
                    size: "sm",
                    weight: "bold",
                    color: "#ffffff",
                  },
                ],
              },
            ],
          },
          {
            type: "separator",
            margin: "xl",
            color: "#334155",
          },
          {
            type: "text",
            text: "รายการล่าสุด",
            size: "xs",
            color: "#94a3b8",
            margin: "md",
            weight: "bold",
          },
          ...recentItems,
        ],
      },
    },
  };
}

/**
 * Generate a Flex Message for Recording Success
 */
export function createRecordSuccessFlex(itemName: string, totalPrice: number, installments: number) {
  const monthly = totalPrice / installments;
  
  return {
    type: "flex",
    altText: "บันทึกรายการสำเร็จ!",
    contents: {
      type: "bubble",
      styles: {
        header: { backgroundColor: "#1e293b" },
        body: { backgroundColor: "#0f172a" },
      },
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "บันทึกสำเร็จ! ✅",
            weight: "bold",
            size: "lg",
            color: "#10b981",
            align: "center",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: itemName,
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ราคารวม",
                    size: "sm",
                    color: "#94a3b8",
                  },
                  {
                    type: "text",
                    text: formatCurrency(totalPrice),
                    size: "sm",
                    color: "#ffffff",
                    align: "end",
                    weight: "bold",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "จำนวนงวด",
                    size: "sm",
                    color: "#94a3b8",
                  },
                  {
                    type: "text",
                    text: `${installments} งวด`,
                    size: "sm",
                    color: "#ffffff",
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ผ่อนต่อเดือน",
                    size: "sm",
                    color: "#94a3b8",
                  },
                  {
                    type: "text",
                    text: formatCurrency(monthly),
                    size: "sm",
                    color: "#60a5fa",
                    align: "end",
                    weight: "bold",
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  };
}

/**
 * Send a Push Message to a specific user
 */
export async function sendPushMessage(userId: string, messages: any | any[]) {
  const client = getLineClient();
  const messageArray = Array.isArray(messages) ? messages : [messages];
  
  try {
    await client.pushMessage({
      to: userId,
      messages: messageArray,
    });
    console.log(`Successfully sent push message to ${userId}`);
  } catch (error) {
    console.error(`Failed to send push message to ${userId}:`, error);
    throw error;
  }
}
