import { NextResponse } from "next/server";
import { getSheetData, appendRows, parseSheetRow, updateCell } from "@/lib/googleSheets";
import { Expense, ExpenseFormData } from "@/types/expense";
import { verifyLineToken } from "@/lib/auth";
import { ExpensePostSchema, ExpensePatchSchema } from "@/lib/validations";

export const dynamic = "force-dynamic"; // Always fetch fresh data

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    const { userId, error } = await verifyLineToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
    }

    // Fetch from Google Sheets
    let expenses = await getSheetData(userId || undefined);

    // Optional month filter
    if (month) {
      expenses = expenses.filter((e) => e.dueMonth === month);
    }

    return NextResponse.json({
      success: true,
      data: expenses,
      total: expenses.length,
    });
  } catch (error) {
    console.error("GET /api/expenses error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch expenses";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await verifyLineToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = ExpensePostSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 });
    }
    const safeBody = validated.data;

    const monthlyPayment = Math.round((safeBody.totalPrice / safeBody.totalInstallments) * 100) / 100;
    const [startYear, startMonth] = safeBody.startMonth.split("-").map(Number);
    const now = new Date().toISOString();

    const rows: string[][] = [];
    for (let i = 0; i < safeBody.totalInstallments; i++) {
      const dueDate = new Date(startYear, startMonth - 1 + i);
      const dueMonth = `${dueDate.getFullYear()}-${String(
        dueDate.getMonth() + 1
      ).padStart(2, "0")}`;

      rows.push([
        now,                                              // A: Timestamp
        safeBody.itemName,                                // B: Item_Name
        String(safeBody.totalPrice),                      // C: Total_Price
        `${i + 1}/ ${safeBody.totalInstallments}`,       // D: Installment_Status
        String(monthlyPayment),                           // E: Monthly_Payment
        dueMonth,                                         // F: Due_Month
        safeBody.category || "",                          // G: Category
        "",                                               // H: Paid_Status (empty = unpaid)
      ]);
    }

    const updatedRows = await appendRows(rows, userId);

    return NextResponse.json({
      success: true,
      message: `Added ${updatedRows} installment entries for "${safeBody.itemName}"`,
      rowsAdded: updatedRows,
    });
  } catch (error) {
    console.error("POST /api/expenses error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to add expense";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH — Mark an installment as paid or unpaid
 * Body: { rowIndex: number, paid: boolean }
 */
export async function PATCH(request: Request) {
  try {
    const { userId, error } = await verifyLineToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = ExpensePatchSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 });
    }

    const { rowIndex, rowIndices, paid } = validated.data;

    const targetIndices = rowIndices || (rowIndex !== undefined ? [rowIndex] : []);

    // Security check: Verify all rows belong to the user
    const expenses = await getSheetData(userId);
    const userRowIndices = new Set(expenses.map(e => e.rowIndex));
    const allBelongToUser = targetIndices.every(idx => userRowIndices.has(idx));
    
    if (!allBelongToUser) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    // Parallel Update for speed
    const statusValue = paid ? "paid" : "";
    await Promise.all(targetIndices.map(idx => updateCell(idx, "H", statusValue)));

    return NextResponse.json({
      success: true,
      message: `Updated ${targetIndices.length} records`,
    });
  } catch (error: any) {
    console.error("PATCH /api/expenses error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, error } = await verifyLineToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get("rowIndex");

    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: "Missing rowIndex" },
        { status: 400 }
      );
    }

    const { getSheetsClient, getSheetConfig } = await import("@/lib/googleSheets");
    const sheets = getSheetsClient();
    const { spreadsheetId, sheetName } = getSheetConfig();

    // Verify ownership
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:I`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    const targetRow = rows[parseInt(rowIndex) + 1]; // +1 for header
    if (!targetRow || targetRow[8] !== userId) { // UserId is in column I (index 8)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Clear row instead of deleting to prevent rowIndex shifting
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A${parseInt(rowIndex) + 2}:I${parseInt(rowIndex) + 2}`,
    });

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/expenses error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete expense";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
