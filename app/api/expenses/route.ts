import { NextResponse } from "next/server";
import { getSheetData, appendRows, parseSheetRow, updateCell } from "@/lib/googleSheets";
import { Expense, ExpenseFormData } from "@/types/expense";

export const dynamic = "force-dynamic"; // Always fetch fresh data

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    // Extract userId from headers (will be sent by LIFF later)
    const userId = request.headers.get("x-user-id");

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
    const body: ExpenseFormData = await request.json();

    // Validate required fields
    if (
      !body.itemName ||
      !body.totalPrice ||
      !body.totalInstallments ||
      !body.startMonth
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const monthlyPayment = Math.round((body.totalPrice / body.totalInstallments) * 100) / 100;
    const [startYear, startMonth] = body.startMonth.split("-").map(Number);
    const now = new Date().toISOString();

    // Build rows for each installment (including empty Paid_Status column H)
    const rows: string[][] = [];
    for (let i = 0; i < body.totalInstallments; i++) {
      const dueDate = new Date(startYear, startMonth - 1 + i);
      const dueMonth = `${dueDate.getFullYear()}-${String(
        dueDate.getMonth() + 1
      ).padStart(2, "0")}`;

      rows.push([
        now,                                              // A: Timestamp
        body.itemName,                                     // B: Item_Name
        String(body.totalPrice),                           // C: Total_Price
        `${i + 1}/ ${body.totalInstallments}`,            // D: Installment_Status
        String(monthlyPayment),                            // E: Monthly_Payment
        dueMonth,                                          // F: Due_Month
        body.category || "",                               // G: Category
        "",                                                // H: Paid_Status (empty = unpaid)
      ]);
    }

    // Extract userId from headers
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Append to Google Sheets
    const updatedRows = await appendRows(rows, userId);

    return NextResponse.json({
      success: true,
      message: `Added ${updatedRows} installment entries for "${body.itemName}"`,
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
    const body = await request.json();
    const { rowIndex, rowIndices, paid } = body as { 
      rowIndex?: number; 
      rowIndices?: number[]; 
      paid: boolean 
    };

    const targetIndices = rowIndices || (rowIndex !== undefined ? [rowIndex] : []);

    if (targetIndices.length === 0 || typeof paid !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid request. Required: rowIndex or rowIndices, and paid" },
        { status: 400 }
      );
    }

    // Extract userId from headers
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Security check: Verify all rows belong to the user
    const expenses = await getSheetData(userId);
    const userRowIndices = new Set(expenses.map(e => e.rowIndex));
    
    const allBelongToUser = targetIndices.every(idx => userRowIndices.has(idx));
    
    if (!allBelongToUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to one or more records" },
        { status: 403 }
      );
    }

    // Update each cell (in a real app, we might use a batch update API, but this works for small batches)
    for (const idx of targetIndices) {
      await updateCell(idx, "H", paid ? "paid" : "");
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${targetIndices.length} records successfully`,
    });
  } catch (error) {
    console.error("PATCH /api/expenses error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update payment status";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
