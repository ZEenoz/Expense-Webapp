import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Transaction, TransactionFormData } from "@/types/transaction";

export const dynamic = "force-dynamic";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/**
 * Get authenticated Google Sheets client
 */
function getAuthClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error("Missing Google Service Account credentials");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return auth;
}

function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: "v4", auth });
}

function getSheetConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const transactionSheetName = process.env.GOOGLE_TRANSACTION_SHEET_NAME || "Transactions";

  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SHEET_ID");
  }

  return { spreadsheetId, transactionSheetName };
}

/**
 * Parse sheet row to Transaction object
 * Row format: [Timestamp, UserId, Type, Amount, Category, Description, Date, PaymentMethod, Tags]
 */
function parseTransactionRow(row: string[], index: number): Transaction | null {
  if (!row[0] || !row[1]) return null;

  return {
    id: `${row[1]}-${index}`, // userId-rowIndex
    userId: row[1] || "",
    type: (row[2] || "expense") as "income" | "expense",
    amount: parseFloat(row[3]) || 0,
    category: row[4] || "",
    description: row[5] || "",
    date: row[6] || "",
    paymentMethod: row[7] as any,
    timestamp: row[0] || "",
    tags: row[8] ? row[8].split(",").map(t => t.trim()) : [],
    rowIndex: index,
  };
}

/**
 * GET - Fetch all transactions for a user
 */
export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const sheets = getSheetsClient();
    const { spreadsheetId, transactionSheetName } = getSheetConfig();

    // Fetch all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${transactionSheetName}!A:I`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Parse and filter by userId
    const transactions = rows
      .slice(1) // Skip header
      .map((row, idx) => parseTransactionRow(row, idx))
      .filter((t): t is Transaction => t !== null && t.userId === userId);

    return NextResponse.json({
      success: true,
      data: transactions,
      total: transactions.length,
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch transactions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST - Add a new transaction
 */
export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: TransactionFormData = await request.json();

    // Validate required fields
    if (!body.type || !body.amount || !body.category || !body.date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();
    const { spreadsheetId, transactionSheetName } = getSheetConfig();
    const now = new Date().toISOString();

    // Build row: [Timestamp, UserId, Type, Amount, Category, Description, Date, PaymentMethod, Tags]
    const row = [
      now,
      userId,
      body.type,
      String(body.amount),
      body.category,
      body.description || "",
      body.date,
      body.paymentMethod || "",
      body.tags?.join(", ") || "",
    ];

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${transactionSheetName}!A:I`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaction added successfully",
    });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    const message = error instanceof Error ? error.message : "Failed to add transaction";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE - Delete a transaction
 */
export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get("rowIndex");

    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: "Missing rowIndex" },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();
    const { spreadsheetId, transactionSheetName } = getSheetConfig();

    // Verify ownership
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${transactionSheetName}!A:I`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const targetRow = rows[parseInt(rowIndex) + 1]; // +1 for header
    if (!targetRow || targetRow[1] !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get sheet ID
    const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMetadata.data.sheets?.find(
      s => s.properties?.title === transactionSheetName
    );
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) {
      throw new Error("Sheet not found");
    }

    // Delete row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: parseInt(rowIndex) + 1, // +1 for header
                endIndex: parseInt(rowIndex) + 2,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/transactions error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete transaction";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
