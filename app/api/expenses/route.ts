import { NextResponse } from "next/server";
import { getSheetData, appendRows, parseSheetRow, updateCell } from "@/lib/googleSheets";
import { Expense, ExpenseFormData } from "@/types/expense";

export const dynamic = "force-dynamic"; // Always fetch fresh data

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    // Fetch from Google Sheets
    const rawRows = await getSheetData();

    // Parse rows into Expense objects (pass index for row tracking)
    let expenses: Expense[] = rawRows
      .map((row, index) => parseSheetRow(row, index))
      .filter((e): e is NonNullable<typeof e> => e !== null);

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

    // Append to Google Sheets
    const updatedRows = await appendRows(rows);

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
    const { rowIndex, paid } = body as { rowIndex: number; paid: boolean };

    if (typeof rowIndex !== "number" || typeof paid !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid request. Required: rowIndex (number), paid (boolean)" },
        { status: 400 }
      );
    }

    // Update column H (Paid_Status) in Google Sheets
    await updateCell(rowIndex, "H", paid ? "paid" : "");

    return NextResponse.json({
      success: true,
      message: paid
        ? `Installment marked as paid (row ${rowIndex + 2})`
        : `Installment marked as unpaid (row ${rowIndex + 2})`,
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
