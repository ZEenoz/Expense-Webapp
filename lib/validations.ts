import { z } from "zod";

export const ExpensePostSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  totalPrice: z.number().positive("Total price must be positive"),
  totalInstallments: z.number().int().positive("Installments must be a positive integer"),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format (YYYY-MM)"),
  category: z.string().optional(),
});

export const ExpensePatchSchema = z.object({
  rowIndex: z.number().int().nonnegative().optional(),
  rowIndices: z.array(z.number().int().nonnegative()).optional(),
  paid: z.boolean(),
}).refine(data => data.rowIndex !== undefined || (data.rowIndices && data.rowIndices.length > 0), {
  message: "Either rowIndex or rowIndices must be provided",
});

export const TransactionPostSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const SettingsPostSchema = z.object({
  reminderDays: z.array(z.number().int().min(1).max(31)).default([1]),
  isNotifyEnabled: z.boolean().default(false),
});

export const CategoryPostSchema = z.object({
  categoryName: z.string().min(1, "Category name is required").max(50, "Name too long"),
});
