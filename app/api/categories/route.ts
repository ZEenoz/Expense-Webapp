import { NextResponse } from "next/server";
import { getCategories, addCategory } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const categories = await getCategories(userId);
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { categoryName } = await request.json();
    if (!categoryName) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    await addCategory(userId, categoryName);
    return NextResponse.json({ success: true, message: "Category added" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
