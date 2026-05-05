import { Expense } from "@/types/expense";

// Mock data based on the real Google Sheet "Expense Record"
// This will be replaced by the Google Sheets API integration later
export const mockExpenses: Expense[] = [
  // Notebook — 11 installments (2026-04 to 2027-02)
  { timestamp: "2026-04-02T06:03:53.615Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 1, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2026-04", category: "Electronics", paidStatus: false, rowIndex: 0 },
  { timestamp: "2026-04-02T06:03:53.868Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 2, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2026-05", category: "Electronics", paidStatus: false, rowIndex: 1 },
  { timestamp: "2026-04-02T06:03:54.042Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 3, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2026-06", category: "Electronics", paidStatus: false, rowIndex: 2 },
  { timestamp: "2026-04-02T06:03:54.240Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 4, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2026-07", category: "Electronics", paidStatus: false, rowIndex: 3 },
  { timestamp: "2026-04-02T06:03:54.584Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 5, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2026-08", category: "Electronics", paidStatus: false, rowIndex: 4 },
  { timestamp: "2026-04-02T06:03:54.806Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 6, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2026-09", category: "Electronics", paidStatus: false, rowIndex: 5 },
  { timestamp: "2026-04-02T06:03:55.069Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 7, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2026-10", category: "Electronics", paidStatus: false, rowIndex: 6 },
  { timestamp: "2026-04-02T06:03:55.531Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 8, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2026-11", category: "Electronics", paidStatus: false, rowIndex: 7 },
  { timestamp: "2026-04-02T06:03:56.155Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 9, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2026-12", category: "Electronics", paidStatus: false, rowIndex: 8 },
  { timestamp: "2026-04-02T06:03:56.394Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 10, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2027-01", category: "Electronics", paidStatus: false, rowIndex: 9 },
  { timestamp: "2026-04-02T06:03:56.659Z", itemName: "Notebook", totalPrice: 21110.65, currentInstallment: 11, totalInstallments: 11, monthlyPayment: 1919.15, dueMonth: "2027-02", category: "Electronics", paidStatus: false, rowIndex: 10 },

  // Keyboard — 5 installments (2026-04 to 2026-08)
  { timestamp: "2026-04-02T06:04:20.656Z", itemName: "Keyboard", totalPrice: 1096, currentInstallment: 1, totalInstallments: 5, monthlyPayment: 219.2, dueMonth: "2026-04", category: "Accessories", paidStatus: false, rowIndex: 11 },
  { timestamp: "2026-04-02T06:04:20.842Z", itemName: "Keyboard", totalPrice: 1096, currentInstallment: 2, totalInstallments: 5, monthlyPayment: 219.2, dueMonth: "2026-05", category: "Accessories", paidStatus: false, rowIndex: 12 },
  { timestamp: "2026-04-02T06:04:21.023Z", itemName: "Keyboard", totalPrice: 1096, currentInstallment: 3, totalInstallments: 5, monthlyPayment: 219.2, dueMonth: "2026-06", category: "Accessories", paidStatus: false, rowIndex: 13 },
  { timestamp: "2026-04-02T06:04:21.229Z", itemName: "Keyboard", totalPrice: 1096, currentInstallment: 4, totalInstallments: 5, monthlyPayment: 219.2, dueMonth: "2026-07", category: "Accessories", paidStatus: false, rowIndex: 14 },
  { timestamp: "2026-04-02T06:04:21.413Z", itemName: "Keyboard", totalPrice: 1096, currentInstallment: 5, totalInstallments: 5, monthlyPayment: 219.2, dueMonth: "2026-08", category: "Accessories", paidStatus: false, rowIndex: 15 },

  // USB Hub — 4 installments (2026-04 to 2026-07)
  { timestamp: "2026-04-02T06:29:17.619Z", itemName: "USB Hub", totalPrice: 599.2, currentInstallment: 1, totalInstallments: 4, monthlyPayment: 149.8, dueMonth: "2026-04", category: "Accessories", paidStatus: false, rowIndex: 16 },
  { timestamp: "2026-04-02T06:29:18.071Z", itemName: "USB Hub", totalPrice: 599.2, currentInstallment: 2, totalInstallments: 4, monthlyPayment: 149.8, dueMonth: "2026-05", category: "Accessories", paidStatus: false, rowIndex: 17 },
  { timestamp: "2026-04-02T06:29:18.246Z", itemName: "USB Hub", totalPrice: 599.2, currentInstallment: 3, totalInstallments: 4, monthlyPayment: 149.8, dueMonth: "2026-06", category: "Accessories", paidStatus: false, rowIndex: 18 },
  { timestamp: "2026-04-02T06:29:18.423Z", itemName: "USB Hub", totalPrice: 599.2, currentInstallment: 4, totalInstallments: 4, monthlyPayment: 149.8, dueMonth: "2026-07", category: "Accessories", paidStatus: false, rowIndex: 19 },

  // หัวชาร์จ Ugreen — 4 installments (2026-04 to 2026-07)
  { timestamp: "2026-04-02T06:35:29.073Z", itemName: "หัวชาร์จ Ugreen", totalPrice: 359.2, currentInstallment: 1, totalInstallments: 4, monthlyPayment: 89.8, dueMonth: "2026-04", category: "Accessories", paidStatus: false, rowIndex: 20 },
  { timestamp: "2026-04-02T06:35:29.551Z", itemName: "หัวชาร์จ Ugreen", totalPrice: 359.2, currentInstallment: 2, totalInstallments: 4, monthlyPayment: 89.8, dueMonth: "2026-05", category: "Accessories", paidStatus: false, rowIndex: 21 },
  { timestamp: "2026-04-02T06:35:29.804Z", itemName: "หัวชาร์จ Ugreen", totalPrice: 359.2, currentInstallment: 3, totalInstallments: 4, monthlyPayment: 89.8, dueMonth: "2026-06", category: "Accessories", paidStatus: false, rowIndex: 22 },
  { timestamp: "2026-04-02T06:35:30.255Z", itemName: "หัวชาร์จ Ugreen", totalPrice: 359.2, currentInstallment: 4, totalInstallments: 4, monthlyPayment: 89.8, dueMonth: "2026-07", category: "Accessories", paidStatus: false, rowIndex: 23 },

  // เมาส์ Goojodoq — 4 installments (2026-04 to 2026-07)
  { timestamp: "2026-04-02T06:36:25.540Z", itemName: "เมาส์ Goojodoq", totalPrice: 177.8, currentInstallment: 1, totalInstallments: 4, monthlyPayment: 44.45, dueMonth: "2026-04", category: "Accessories", paidStatus: false, rowIndex: 24 },
  { timestamp: "2026-04-02T06:36:25.739Z", itemName: "เมาส์ Goojodoq", totalPrice: 177.8, currentInstallment: 2, totalInstallments: 4, monthlyPayment: 44.45, dueMonth: "2026-05", category: "Accessories", paidStatus: false, rowIndex: 25 },
  { timestamp: "2026-04-02T06:36:25.917Z", itemName: "เมาส์ Goojodoq", totalPrice: 177.8, currentInstallment: 3, totalInstallments: 4, monthlyPayment: 44.45, dueMonth: "2026-06", category: "Accessories", paidStatus: false, rowIndex: 26 },
  { timestamp: "2026-04-02T06:36:26.089Z", itemName: "เมาส์ Goojodoq", totalPrice: 177.8, currentInstallment: 4, totalInstallments: 4, monthlyPayment: 44.45, dueMonth: "2026-07", category: "Accessories", paidStatus: false, rowIndex: 27 },
];
