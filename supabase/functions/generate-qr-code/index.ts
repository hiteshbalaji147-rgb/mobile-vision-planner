import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HMAC signing for QR codes
async function signQRCode(data: string): Promise<string> {
  const secret = Deno.env.get("QR_SECRET") || "default-secret-change-in-production";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Extract and verify JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { registrationId } = await req.json();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!registrationId || !uuidRegex.test(registrationId)) {
      throw new Error("Invalid registration ID format");
    }

    // Use service role key for the ownership check and update
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user owns this registration
    const { data: registration, error: checkError } = await supabaseAdmin
      .from("event_registrations")
      .select("user_id")
      .eq("id", registrationId)
      .single();

    if (checkError || !registration || registration.user_id !== user.id) {
      throw new Error("Registration not found or unauthorized");
    }

    // Generate signed QR code
    const timestamp = Date.now();
    const expiresAt = timestamp + (24 * 60 * 60 * 1000); // 24 hours
    const qrPayload = `${registrationId}:${timestamp}:${expiresAt}`;
    const signature = await signQRCode(qrPayload);
    const qrData = btoa(`${qrPayload}:${signature}`);

    // Update registration with QR code
    const { error: updateError } = await supabaseAdmin
      .from("event_registrations")
      .update({ qr_code: qrData })
      .eq("id", registrationId);

    if (updateError) throw updateError;

    console.log(`QR code generated for registration ${registrationId}`);

    return new Response(
      JSON.stringify({ qrCode: qrData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating QR code:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
