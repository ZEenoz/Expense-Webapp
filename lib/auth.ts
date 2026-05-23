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

  const idToken = authHeader.split(" ")[1];
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "2009678810-bt80GDIl";
  // LINE token verify endpoint requires the Channel ID (client_id), not the full LIFF ID
  const channelId = liffId.split("-")[0];

  try {
    const params = new URLSearchParams();
    params.append('id_token', idToken);
    params.append('client_id', channelId);

    const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("LINE Token Verification Failed:", errorData);
      return { userId: null, error: "Invalid LINE ID Token" };
    }

    const data = await response.json();
    return { userId: data.sub };
  } catch (error) {
    console.error("LINE Token Verification Error:", error);
    return { userId: null, error: "Token verification network error" };
  }
}
