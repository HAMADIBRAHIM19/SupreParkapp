import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ISO country → ISO 4217 currency
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  SA: "SAR", AE: "AED", KW: "KWD", BH: "BHD", QA: "QAR", OM: "OMR", YE: "YER",
  JO: "JOD", LB: "LBP", SY: "SYP", IQ: "IQD", PS: "ILS", IL: "ILS",
  EG: "EGP", MA: "MAD", DZ: "DZD", TN: "TND", LY: "LYD", SD: "SDG", SO: "SOS", MR: "MRU",
  US: "USD", CA: "CAD", MX: "MXN", BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", VE: "VES", UY: "UYU", PY: "PYG", BO: "BOB", EC: "USD", PA: "USD", CR: "CRC", DO: "DOP", GT: "GTQ", HN: "HNL", NI: "NIO", SV: "USD", JM: "JMD", HT: "HTG", CU: "CUP", TT: "TTD",
  GB: "GBP", IE: "EUR", FR: "EUR", DE: "EUR", IT: "EUR", ES: "EUR", PT: "EUR", NL: "EUR", BE: "EUR", LU: "EUR", AT: "EUR", FI: "EUR", GR: "EUR", CY: "EUR", MT: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", HR: "EUR",
  CH: "CHF", NO: "NOK", SE: "SEK", DK: "DKK", IS: "ISK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN", RS: "RSD", UA: "UAH", RU: "RUB", BY: "BYN", MD: "MDL", AL: "ALL", MK: "MKD", BA: "BAM", GE: "GEL", AM: "AMD", AZ: "AZN", TR: "TRY",
  CN: "CNY", JP: "JPY", KR: "KRW", IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", AF: "AFN", IR: "IRR", KZ: "KZT", UZ: "UZS", TJ: "TJS", KG: "KGS", TM: "TMT", MN: "MNT",
  TH: "THB", VN: "VND", ID: "IDR", MY: "MYR", SG: "SGD", PH: "PHP", MM: "MMK", KH: "KHR", LA: "LAK", BN: "BND", TW: "TWD", HK: "HKD", MO: "MOP", MV: "MVR",
  AU: "AUD", NZ: "NZD", FJ: "FJD", PG: "PGK", WS: "WST", TO: "TOP", VU: "VUV",
  ZA: "ZAR", NG: "NGN", KE: "KES", GH: "GHS", ET: "ETB", TZ: "TZS", UG: "UGX", RW: "RWF", ZM: "ZMW", ZW: "ZWL", BW: "BWP", NA: "NAD", MU: "MUR", MG: "MGA", AO: "AOA", MZ: "MZN", CM: "XAF", CI: "XOF", SN: "XOF", ML: "XOF", BF: "XOF", NE: "XOF", BJ: "XOF", TG: "XOF", GA: "XAF", CG: "XAF", CD: "CDF", TD: "XAF", CF: "XAF",
};

// Stripe zero-decimal currencies
const ZERO_DECIMAL = new Set([
  "BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG","RWF","UGX","VND","VUV","XAF","XOF","XPF",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: userData, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const baseAmount = Number(body.amount ?? 29);
    const baseCurrency = String(body.baseCurrency ?? "SAR").toUpperCase();

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(baseAmount)) {
      return new Response(JSON.stringify({ error: "Invalid lat/lng/amount" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1) Reverse geocode → country code
    const mapsKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!mapsKey) throw new Error("Maps key missing");
    const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=country&key=${mapsKey}`);
    const geo = await geoRes.json();
    const country = geo.results?.[0]?.address_components?.find((c: { types: string[] }) => c.types.includes("country"))?.short_name;

    const targetCurrency = (country && COUNTRY_TO_CURRENCY[country]) || baseCurrency;

    // 2) If same currency, no conversion needed
    if (targetCurrency === baseCurrency) {
      return new Response(JSON.stringify({
        currency: baseCurrency,
        amount: baseAmount,
        amountMinor: ZERO_DECIMAL.has(baseCurrency) ? Math.round(baseAmount) : Math.round(baseAmount * 100),
        country: country ?? null,
        rate: 1,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3) Exchange rate (free, no key)
    const fxRes = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    const fx = await fxRes.json();
    const rate = fx?.rates?.[targetCurrency];
    if (typeof rate !== "number" || rate <= 0) {
      // fallback to base
      return new Response(JSON.stringify({
        currency: baseCurrency, amount: baseAmount,
        amountMinor: ZERO_DECIMAL.has(baseCurrency) ? Math.round(baseAmount) : Math.round(baseAmount * 100),
        country: country ?? null, rate: 1,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let converted = baseAmount * rate;
    // Pleasant rounding: zero-decimal → whole, else 2 decimals; for big values round to nearest 10
    if (ZERO_DECIMAL.has(targetCurrency)) {
      converted = Math.round(converted);
    } else if (converted >= 1000) {
      converted = Math.round(converted / 10) * 10;
    } else {
      converted = Math.round(converted * 100) / 100;
    }

    const amountMinor = ZERO_DECIMAL.has(targetCurrency) ? Math.round(converted) : Math.round(converted * 100);

    return new Response(JSON.stringify({
      currency: targetCurrency,
      amount: converted,
      amountMinor,
      country: country ?? null,
      rate,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("convert-price error", e);
    return new Response(JSON.stringify({ error: "Conversion failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
