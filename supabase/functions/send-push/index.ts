import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Sends a real push message (APNs for iOS / FCM for Android) for a notification row.
// Invoked by a database trigger with a shared internal secret.

const PUSH_HOOK_SECRET = Deno.env.get("PUSH_HOOK_SECRET");
const SERVICE_ACCOUNT_RAW = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const pemToArrayBuffer = (pem: string) => {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

const b64url = (input: string | Uint8Array) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

let cachedToken: { value: string; exp: number } | null = null;

const getAccessToken = async (sa: { client_email: string; private_key: string }) => {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(`${header}.${payload}`),
    ),
  );
  const assertion = `${header}.${payload}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Google token request failed [${res.status}]: ${body}`);
  const parsed = JSON.parse(body) as { access_token: string; expires_in: number };
  cachedToken = { value: parsed.access_token, exp: Date.now() + parsed.expires_in * 1000 };
  return parsed.access_token;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!PUSH_HOOK_SECRET || req.headers.get("x-push-hook-secret") !== PUSH_HOOK_SECRET) {
      return json({ error: "Unauthorized" }, 401);
    }

    const payload = await req.json().catch(() => null);
    const userId = payload?.user_id;
    const title = typeof payload?.title === "string" ? payload.title.slice(0, 200) : "";
    const bodyText = typeof payload?.body === "string" ? payload.body.slice(0, 500) : "";
    if (typeof userId !== "string" || !title) {
      return json({ error: "Invalid payload: user_id and title are required" }, 400);
    }

    if (!SERVICE_ACCOUNT_RAW) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
      return json({ error: "Push credentials not configured" }, 503);
    }

    let sa: { client_email: string; private_key: string; project_id: string };
    try {
      sa = JSON.parse(SERVICE_ACCOUNT_RAW);
    } catch {
      return json({ error: "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON" }, 500);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: tokens, error } = await admin
      .from("push_tokens")
      .select("token, platform")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to load push tokens:", error.message);
      return json({ error: "Failed to load push tokens", details: error.message }, 500);
    }
    if (!tokens?.length) return json({ sent: 0, reason: "no devices" });

    const accessToken = await getAccessToken(sa);
    const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

    let sent = 0;
    const stale: string[] = [];

    for (const row of tokens) {
      const message = {
        message: {
          token: row.token,
          notification: { title, body: bodyText },
          data: {
            url: "/dashboard",
            booking_id: payload?.booking_id ? String(payload.booking_id) : "",
            notification_id: payload?.notification_id ? String(payload.notification_id) : "",
          },
          android: {
            priority: "HIGH",
            notification: { sound: "default", default_vibrate_timings: true },
          },
          apns: {
            headers: { "apns-priority": "10" },
            payload: { aps: { sound: "default", badge: 1, "content-available": 1 } },
          },
        },
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (res.ok) {
        sent++;
      } else {
        const errBody = await res.text();
        console.error(`FCM send failed [${res.status}]: ${errBody}`);
        if (res.status === 404 || res.status === 400) stale.push(row.token);
      }
    }

    if (stale.length) {
      await admin.from("push_tokens").delete().in("token", stale);
    }

    return json({ sent, removed: stale.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-push error:", msg);
    return json({ error: msg }, 500);
  }
});
