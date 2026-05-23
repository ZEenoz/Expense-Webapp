import { NextResponse } from "next/server";

export async function verifyLineToken(request: Request): Promise<{ userId: string | null; error?: string }> {
  // Mock mode for local development
  if (process.env.NEXT_PUBLIC_SKIP_LIFF === "true") {
    const mockUserId = process.env.NEXT_PUBLIC_MOCK_USER_ID || "dev-user-mock";
    // Optional: allow passing a different x-user-id in mock mode for testing
    const headerUserId = request.headers.get("x-user-id");
    return { userId: headerUserId || mockUserId };
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { userId: null, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.split(" ")[1];

  try {
    // We use /v2/profile with Access Token instead of /oauth2/v2.1/verify with ID Token
    // because it doesn't require the openid scope to be enabled and doesn't depend on client_id.
    const response = await fetch("https://api.line.me/v2/profile", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("LINE Token Verification Failed:", errorData);
      return { userId: null, error: "Invalid LINE Access Token" };
    }

    const data = await response.json();
    return { userId: data.userId };
  } catch (error) {
    console.error("LINE Token Verification Error:", error);
    return { userId: null, error: "Token verification network error" };
  }
}
