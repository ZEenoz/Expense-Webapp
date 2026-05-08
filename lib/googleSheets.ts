import { google } from "googleapis";
import { Expense } from "@/types/expense";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/**
 * Create an authenticated Google Sheets client using Service Account credentials
 */
function getAuthClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error(
      "Missing Google Service Account credentials in environment variables"
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return auth;
}

/**
 * Get the Google Sheets API client
 */
function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: "v4", auth });
}

/**
 * Get the Sheet ID and Sheet Name from environment
 */
function getSheetConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Raw_Data";

  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SHEET_ID in environment variables");
  }

  return { spreadsheetId, sheetName };
}

/**
 * Fetch all rows from the Google Sheet (A through I, including UserId)
 * Returns raw 2D array of string values
 * @param userId - Optional ID to filter results
 */
export async function getSheetData(userId?: string): Promise<Expense[]> {
  const sheets = getSheetsClient();
  const { spreadsheetId, sheetName } = getSheetConfig();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:I`, // Columns A through I (includes UserId)
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return [];
  }

  const dataRows = rows.slice(1); // Skip header

  // We map first to include the absolute rowIndex, then filter by userId
  const expenses = dataRows
    .map((row, idx) => parseSheetRow(row, idx))
    .filter((e): e is NonNullable<typeof e> => e !== null);

  if (!userId) {
    return expenses;
  }

  return expenses.filter(e => e.userId === userId);
}

/**
 * Append rows to the Google Sheet
 * @param rows - Array of row arrays to append
 * @param userId - ID of the user owning these rows
 */
export async function appendRows(rows: string[][], userId: string): Promise<number> {
  const sheets = getSheetsClient();
  const { spreadsheetId, sheetName } = getSheetConfig();

  // Add userId to each row (Column I)
  const rowsWithUser = rows.map(row => {
    const newRow = [...row];
    // Ensure the row has exactly 9 elements (A-I)
    while (newRow.length < 8) newRow.push(""); 
    newRow[8] = userId;
    return newRow;
  });

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:I`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rowsWithUser,
    },
  });

  return response.data.updates?.updatedRows || 0;
}

/**
 * Update a single cell in the Google Sheet
 * Used for marking installments as paid
 * @param rowIndex - 0-based row index (data rows, excluding header)
 * @param column - Column letter (e.g. "H" for Paid_Status)
 * @param value - Value to write
 */
export async function updateCell(
  rowIndex: number,
  column: string,
  value: string
): Promise<void> {
  const sheets = getSheetsClient();
  const { spreadsheetId, sheetName } = getSheetConfig();

  // +2 because: +1 for header row, +1 for 1-based indexing
  const sheetRow = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${column}${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[value]],
    },
  });
}

/**
 * Parse a raw sheet row into a structured object
 * Row format: [Timestamp, Item_Name, Total_Price, Installment_Status, Monthly_Payment, Due_Month, Category, Paid_Status, UserId]
 */
export function parseSheetRow(
  row: string[],
  index: number
): {
  timestamp: string;
  itemName: string;
  totalPrice: number;
  currentInstallment: number;
  totalInstallments: number;
  monthlyPayment: number;
  dueMonth: string;
  category: string;
  paidStatus: boolean;
  userId: string;
  rowIndex: number;
} | null {
  // Skip empty rows
  if (!row[0] || !row[1]) return null;

  const installmentParts = (row[3] || "1/1").replace(/\s/g, "").split("/");
  const paidValue = (row[7] || "").toLowerCase().trim();

  return {
    timestamp: row[0] || "",
    itemName: row[1] || "",
    totalPrice: parseFloat(row[2]) || 0,
    currentInstallment: parseInt(installmentParts[0], 10) || 1,
    totalInstallments: parseInt(installmentParts[1], 10) || 1,
    monthlyPayment: parseFloat(row[4]) || 0,
    dueMonth: row[5] || "",
    category: row[6] || "",
    paidStatus: paidValue === "paid" || paidValue === "true" || paidValue === "yes",
    userId: row[8] || "",
    rowIndex: index,
  };
}
