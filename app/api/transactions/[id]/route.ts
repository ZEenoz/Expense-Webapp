import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { TransactionFormData } from "@/types/transaction";

export const dynamic = "force-dynamic";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

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
 * PUT - Update a transaction
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const rowIndex = parseInt(id);
    if (isNaN(rowIndex)) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction ID" },
        { status: 400 }
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

    const targetRow = rows[rowIndex + 1]; // +1 for header
    if (!targetRow || targetRow[1] !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Keep original timestamp
    const originalTimestamp = targetRow[0];

    // Build updated row
    const updatedRow = [
      originalTimestamp,
      userId,
      body.type,
      String(body.amount),
      body.category,
      body.description || "",
      body.date,
      body.paymentMethod || "",
      body.tags?.join(", ") || "",
    ];

    // Update the row
    const sheetRow = rowIndex + 2; // +1 for header, +1 for 1-based indexing
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${transactionSheetName}!A${sheetRow}:I${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [updatedRow],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/transactions/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update transaction";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
