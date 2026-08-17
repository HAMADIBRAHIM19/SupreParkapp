// Temporary utility: export all users with account type as CSV.
// Call: GET /functions/v1/export-users with header x-export-token: <token>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-export-token",
};

const ESCAPE_TOKEN = Deno.env.get("EXPORT_USERS_TOKEN") || "superpark-dev-export-2026";

function csvEscape(value: string | null | undefined): string {
  const str = String(value ?? "").replace(/"/g, '""');
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const token = req.headers.get("x-export-token");
  if (token !== ESCAPE_TOKEN) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, full_name, username, account_type, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authMap = new Map(authData?.users.map((u) => [u.id, u]) || []);

  const headers = ["id", "email", "created_at", "full_name", "username", "account_type"];
  const rows = (profiles || []).map((row) => {
    const u = authMap.get(row.user_id);
    return [
      row.user_id,
      u?.email || "",
      u?.created_at || row.created_at,
      row.full_name,
      row.username,
      row.account_type,
    ].map(csvEscape);
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new Response(csv, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=users.csv",
    },
  });
});
