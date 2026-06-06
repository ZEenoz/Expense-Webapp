import { google } from "googleapis";
import { Expense } from "@/types/expense";
import { randomUUID } from "crypto";

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
export function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: "v4", auth });
}

/**
 * Get the Sheet ID and Sheet Name from environment
 */
export function getSheetConfig() {
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

  // Add userId (Column I, index 8) and a stable UUID (Column J, index 9) to each row
  const rowsWithUser = rows.map(row => {
    const newRow = [...row];
    // Ensure the row has at least 8 elements (A-H)
    while (newRow.length < 8) newRow.push("");
    newRow[8] = userId;       // Column I: UserId
    newRow[9] = randomUUID(); // Column J: Row_ID (stable UUID)
    return newRow;
  });

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:J`,
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
  rowId: string; // UUID from Column J — stable across row shifts
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
    rowId: row[9] || "", // Column J: UUID — empty string for legacy rows without UUID
  };
}

/**
 * Fetch categories for a specific user from the 'Settings' sheet
 */
export async function getCategories(userId: string): Promise<string[]> {
  const sheets = getSheetsClient();
  const { spreadsheetId } = getSheetConfig();
  const settingsSheetName = "Settings";

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${settingsSheetName}!A:B`, // UserId, CategoryName
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Filter by userId and return only the category names
    return rows
      .slice(1) // Skip header
      .filter(row => row[0] === userId)
      .map(row => row[1]);
  } catch (error) {
    console.warn("Settings sheet might not exist yet:", error);
    return [];
  }
}

/**
 * Add a new category for a user.
 * If the Settings sheet is brand-new and empty, this will also write the header row first.
 */
export async function addCategory(userId: string, categoryName: string): Promise<void> {
  const sheets = getSheetsClient();
  const { spreadsheetId } = getSheetConfig();
  const settingsSheetName = "Settings";

  try {
    let hasHeader = false;

    try {
      // Check whether the sheet has data yet (i.e. has a header row)
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${settingsSheetName}!A1:B1`,
      });
      hasHeader = !!(existing.data.values && existing.data.values.length > 0);
    } catch (error: any) {
      // If the sheet doesn't exist, Google API throws "Unable to parse range"
      if (error.message && error.message.includes("Unable to parse range")) {
        // Create the sheet automatically
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: settingsSheetName } } }],
          },
        });
        hasHeader = false; // Brand new sheet, definitely no header
      } else {
        throw error; // Rethrow if it's a different error
      }
    }

    // If the sheet is completely empty, write the header row first
    if (!hasHeader) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${settingsSheetName}!A1:B1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["UserId", "CategoryName"]],
        },
      });
    }

    // Append the new category row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${settingsSheetName}!A:B`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[userId, categoryName]],
      },
    });
  } catch (error: any) {
    // Re-throw with a clear message so the API route can surface it properly
    throw new Error(`ไม่สามารถเพิ่มหมวดหมู่ได้: ${error.message}`);
  }
}

/**
 * User Config Management
 * Sheet: 'User_Configs' (Columns: UserId, ReminderDay, IsNotifyEnabled)
 */

export interface UserConfig {
  userId: string;
  reminderDays: number[];
  isNotifyEnabled: boolean;
}

export async function getUserConfig(userId: string): Promise<UserConfig | null> {
  const sheets = getSheetsClient();
  const { spreadsheetId } = getSheetConfig();
  const configSheetName = "User_Configs";

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${configSheetName}!A:C`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return null;

    const userRow = rows.slice(1).find(row => row[0] === userId);
    if (!userRow) return null;

    return {
      userId: userRow[0],
      reminderDays: String(userRow[1]).split(",").map(d => parseInt(d.trim(), 10)).filter(n => !isNaN(n)),
      isNotifyEnabled: String(userRow[2]).toLowerCase() === "true",
    };
  } catch (error) {
    console.warn("User_Configs sheet might not exist yet:", error);
    return null;
  }
}

export async function saveUserConfig(config: UserConfig): Promise<void> {
  const sheets = getSheetsClient();
  const { spreadsheetId } = getSheetConfig();
  const configSheetName = "User_Configs";

  // Check if user already has a config
  const existingConfig = await getUserConfig(config.userId);

  if (existingConfig) {
    // Find the row index to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${configSheetName}!A:A`,
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === config.userId);

    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${configSheetName}!B${rowIndex + 1}:C${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[config.reminderDays.join(","), config.isNotifyEnabled]],
        },
      });
      return;
    }
  }

  // If not found, append new row
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${configSheetName}!A:C`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[config.userId, config.reminderDays.join(","), config.isNotifyEnabled]],
    },
  });
}

/**
 * Find the 0-based data rowIndex of a row by its UUID in Column J.
 * Returns -1 if not found.
 */
async function findRowIndexByUUID(uuid: string): Promise<number> {
  const sheets = getSheetsClient();
  const { spreadsheetId, sheetName } = getSheetConfig();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!J:J`, // Only fetch UUID column for speed
  });

  const rows = response.data.values || [];
  // rows[0] is the header, data starts at rows[1]
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === uuid) {
      return i - 1; // 0-based data index (excluding header)
    }
  }
  return -1;
}

/**
 * Delete a row by its stable UUID (Column J).
 * Safe against row-index drift caused by prior deletions.
 */
export async function deleteRowById(uuid: string): Promise<void> {
  const sheets = getSheetsClient();
  const { spreadsheetId, sheetName } = getSheetConfig();

  const rowIndex = await findRowIndexByUUID(uuid);
  if (rowIndex === -1) {
    throw new Error(`ไม่พบรายการที่ต้องการลบ (UUID: ${uuid})`);
  }

  // Get sheet metadata to find numeric sheetId
  const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = sheetMetadata.data.sheets?.find(
    s => s.properties?.title === sheetName
  );
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  // Delete the actual row (safe because we just looked up the real position)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex + 1, // +1 for header
              endIndex: rowIndex + 2,
            },
          },
        },
      ],
    },
  });
}

/**
 * Update a cell in the row identified by its stable UUID.
 * Safe against row-index drift.
 */
export async function updateCellById(
  uuid: string,
  column: string,
  value: string
): Promise<void> {
  const sheets = getSheetsClient();
  const { spreadsheetId, sheetName } = getSheetConfig();

  const rowIndex = await findRowIndexByUUID(uuid);
  if (rowIndex === -1) {
    throw new Error(`ไม่พบรายการที่ต้องการอัปเดต (UUID: ${uuid})`);
  }

  const sheetRow = rowIndex + 2; // +1 header +1 for 1-based
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${column}${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}
