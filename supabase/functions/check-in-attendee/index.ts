import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify HMAC signature
async function verifyQRCode(qrData: string): Promise<{ registrationId: string; expiresAt: number } | null> {
  try {
    const decoded = atob(qrData);
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;

    const [registrationId, expiresAt, providedSignature] = parts;

    // Check expiration
    if (Date.now() > parseInt(expiresAt)) {
      throw new Error("QR code has expired");
    }

    // Verify signature
    const secret = Deno.env.get("QR_SECRET") || "default-secret-change-me";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const payload = `${registrationId}:${expiresAt}`;
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

    if (expectedSignature !== providedSignature) {
      throw new Error("Invalid QR code signature");
    }

    return { registrationId, expiresAt: parseInt(expiresAt) };
  } catch (error) {
    console.error("QR verification error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body = await req.json();
    const { qrCode } = body;

    if (!qrCode || typeof qrCode !== "string") {
      throw new Error("Invalid QR code");
    }

    // Verify and decode QR code
    const verified = await verifyQRCode(qrCode);
    if (!verified) {
      throw new Error("Invalid or expired QR code");
    }

    const { registrationId } = verified;

    // Verify user is a club leader for this event
    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .select(`
        id,
        user_id,
        checked_in_at,
        event_id,
        events!inner (
          club_id,
          clubs!inner (
            created_by
          )
        )
      `)
      .eq("id", registrationId)
      .eq("qr_code", qrCode)
      .single();

    if (regError || !registration) {
      throw new Error("Registration not found");
    }

    // Check if already checked in
    if (registration.checked_in_at) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Already checked in",
          registration 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is club leader (using service role for the update)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user is club leader
    const clubCreator = (registration.events as any).clubs.created_by;
    if (clubCreator !== user.id) {
      // Also check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        throw new Error("Unauthorized: Only club leaders can check in attendees");
      }
    }

    // Check in the attendee
    const { data, error } = await supabaseAdmin
      .from("event_registrations")
      .update({ checked_in_at: new Date().toISOString() })
      .eq("id", registrationId)
      .select()
      .single();

    if (error) throw error;

    console.log(`Attendee checked in: ${registrationId} by ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, registration: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking in attendee:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
