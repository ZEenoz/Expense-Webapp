import { NextResponse } from "next/server";
import { getCategories, addCategory } from "@/lib/googleSheets";
import { verifyLineToken } from "@/lib/auth";
import { CategoryPostSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId, error } = await verifyLineToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
    }

    const categories = await getCategories(userId);
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await verifyLineToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CategoryPostSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 });
    }

    await addCategory(userId, validated.data.categoryName);
    return NextResponse.json({ success: true, message: "Category added" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
