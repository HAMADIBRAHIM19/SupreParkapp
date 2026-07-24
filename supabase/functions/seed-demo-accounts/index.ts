// One-shot seeder for Apple App Review demo accounts.
// Call: POST /functions/v1/seed-demo-accounts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const accounts = [
    {
      email: "demo.seeker@superparkapp.com",
      password: "DemoSeeker2026!",
      full_name: "Demo Seeker",
      username: "demo_seeker",
      account_type: "seeker" as const,
    },
    {
      email: "demo.crew@superparkapp.com",
      password: "DemoCrew2026!",
      full_name: "Demo Crew",
      username: "demo_crew",
      account_type: "crew" as const,
    },
  ];

  const ids: Record<string, string> = {};
  const log: string[] = [];

  for (const a of accounts) {
    // Try to find existing user
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let existing = list?.users.find((u) => u.email === a.email);
    if (!existing) {
      const { data, error } = await admin.auth.admin.createUser({
        email: a.email,
        password: a.password,
        email_confirm: true,
        user_metadata: {
          username: a.username,
          full_name: a.full_name,
          account_type: a.account_type,
        },
      });
      if (error) {
        log.push(`create ${a.email}: ${error.message}`);
        continue;
      }
      existing = data.user!;
      log.push(`created ${a.email}`);
    } else {
      // Reset password to known value
      await admin.auth.admin.updateUserById(existing.id, {
        password: a.password,
        email_confirm: true,
      });
      log.push(`reset ${a.email}`);
    }
    ids[a.account_type] = existing.id;

    // Ensure profile exists with correct account_type
    await admin.from("profiles").upsert(
      {
        user_id: existing.id,
        username: a.username,
        full_name: a.full_name,
        account_type: a.account_type,
      },
      { onConflict: "user_id" }
    );
  }

  const seekerId = ids["seeker"];
  const crewId = ids["crew"];

  if (seekerId && crewId) {
    // Ensure crew wallet
    await admin.from("crew_wallets").upsert({ user_id: crewId }, { onConflict: "user_id" });

    // Seed bookings if seeker has none
    const { data: existingBookings } = await admin
      .from("bookings")
      .select("id")
      .eq("seeker_id", seekerId);

    if (!existingBookings || existingBookings.length === 0) {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const bookings = [
        {
          seeker_id: seekerId,
          location: "King Fahd Road, Riyadh",
          vehicle_plate: "ABC 1234",
          vehicle_name: "Toyota Camry",
          scheduled_at: inOneHour,
          status: "pending",
          payment_status: "paid",
          notes: "Demo pending booking",
        },
        {
          seeker_id: seekerId,
          crew_id: crewId,
          location: "Olaya Street, Riyadh",
          vehicle_plate: "XYZ 5678",
          vehicle_name: "Honda Accord",
          scheduled_at: inTwoHours,
          status: "approved",
          payment_status: "paid",
          crew_vehicle_name: "Hyundai Sonata",
          crew_vehicle_plate: "CREW 001",
          notes: "Demo active booking - crew on the way",
        },
        {
          seeker_id: seekerId,
          crew_id: crewId,
          location: "Tahlia Street, Riyadh",
          vehicle_plate: "DEF 9012",
          vehicle_name: "Nissan Altima",
          scheduled_at: yesterday,
          status: "completed",
          payment_status: "paid",
          crew_vehicle_name: "Hyundai Sonata",
          crew_vehicle_plate: "CREW 001",
          notes: "Demo completed booking",
        },
      ];

      const { error: bErr } = await admin.from("bookings").insert(bookings);
      if (bErr) log.push(`bookings: ${bErr.message}`);
      else log.push("seeded 3 bookings");
    } else {
      log.push(`bookings already exist (${existingBookings.length})`);
    }

    // Welcome notifications
    await admin.from("notifications").insert([
      {
        user_id: seekerId,
        title: "Welcome to SuperParking",
        message: "This is a demo Seeker account for App Review.",
      },
      {
        user_id: crewId,
        title: "Welcome to SuperParking",
        message: "This is a demo Crew account for App Review.",
      },
    ]);
  }

  return new Response(
    JSON.stringify({ ok: true, ids, log, credentials: accounts.map((a) => ({ email: a.email, password: a.password })) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
