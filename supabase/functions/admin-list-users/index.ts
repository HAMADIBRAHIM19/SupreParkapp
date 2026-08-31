// Admin-only: list all users with profile data.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const user = userData.user;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verify admin role
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    if (!roles || roles.length === 0) {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("user_id, full_name, username, account_type, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return json({ error: profilesError.message }, 500);
    }

    const { data: authData, error: authError2 } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authError2) {
      return json({ error: authError2.message }, 500);
    }

    const authMap = new Map(authData?.users.map((u) => [u.id, u]) || []);

    const users = (profiles || []).map((row) => {
      const u = authMap.get(row.user_id);
      return {
        id: row.user_id,
        email: u?.email || "",
        created_at: u?.created_at || row.created_at,
        full_name: row.full_name,
        username: row.username,
        account_type: row.account_type,
      };
    });

    return json({ users, count: users.length }, 200);
  } catch (error) {
    console.error("admin-list-users error:", error instanceof Error ? error.message : error);
    return json({ error: "Internal server error" }, 500);
  }
});
