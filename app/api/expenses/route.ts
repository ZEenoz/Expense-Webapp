import { NextResponse } from "next/server";
import { getSheetData, appendRows, updateCell, updateCellById, deleteRowById } from "@/lib/googleSheets";
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
 * Body: { rowId: string, paid: boolean }  ← UUID-based (preferred)
 *        { rowIndex: number, paid: boolean }  ← legacy fallback
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

    const { rowIndex, rowIndices, rowId, rowIds, paid } = validated.data as any;

    // ── UUID path (preferred, drift-safe) ──────────────────────────
    const uuids: string[] = rowIds || (rowId ? [rowId] : []);
    if (uuids.length > 0) {
      // Security: verify every UUID belongs to the calling user
      const expenses = await getSheetData(userId);
      const userUUIDs = new Set(expenses.map(e => e.rowId).filter(Boolean));
      if (!uuids.every(id => userUUIDs.has(id))) {
        return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
      }
      const statusValue = paid ? "paid" : "";
      await Promise.all(uuids.map(id => updateCellById(id, "H", statusValue)));
      return NextResponse.json({ success: true, message: `Updated ${uuids.length} records` });
    }

    // ── Legacy rowIndex path (backward compat) ──────────────────────
    const targetIndices = rowIndices || (rowIndex !== undefined ? [rowIndex] : []);
    if (targetIndices.length === 0) {
      return NextResponse.json({ success: false, error: "rowId or rowIndex required" }, { status: 400 });
    }

    const expenses = await getSheetData(userId);
    const userRowIndices = new Set(expenses.map(e => e.rowIndex));
    if (!targetIndices.every((idx: number) => userRowIndices.has(idx))) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const statusValue = paid ? "paid" : "";
    await Promise.all(targetIndices.map((idx: number) => updateCell(idx, "H", statusValue)));
    return NextResponse.json({ success: true, message: `Updated ${targetIndices.length} records` });

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
    const rowId    = searchParams.get("rowId");    // UUID — preferred
    const rowIndex = searchParams.get("rowIndex"); // legacy fallback

    // ── UUID path (preferred, drift-safe) ──────────────────────────
    if (rowId) {
      // Security: verify the UUID belongs to the calling user
      const expenses = await getSheetData(userId);
      const target = expenses.find(e => e.rowId === rowId);
      if (!target) {
        return NextResponse.json({ success: false, error: "Expense not found or unauthorized" }, { status: 404 });
      }
      await deleteRowById(rowId);
      return NextResponse.json({ success: true, message: "Expense deleted successfully" });
    }

    // ── Legacy rowIndex path (backward compat for old rows without UUID) ──
    if (!rowIndex) {
      return NextResponse.json({ success: false, error: "Missing rowId or rowIndex" }, { status: 400 });
    }

    const { getSheetsClient, getSheetConfig } = await import("@/lib/googleSheets");
    const sheets = getSheetsClient();
    const { spreadsheetId, sheetName } = getSheetConfig();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:I`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    const targetRow = rows[parseInt(rowIndex) + 1]; // +1 for header
    if (!targetRow || targetRow[8] !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Clear row content (preserves row positions, safe for legacy data)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A${parseInt(rowIndex) + 2}:J${parseInt(rowIndex) + 2}`,
    });

    return NextResponse.json({ success: true, message: "Expense deleted successfully" });

  } catch (error) {
    console.error("DELETE /api/expenses error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete expense";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
