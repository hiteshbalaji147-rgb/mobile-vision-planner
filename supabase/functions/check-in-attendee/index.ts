import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify HMAC signature
async function verifyQRCode(qrData: string): Promise<{ registrationId: string; timestamp: number; expiresAt: number } | null> {
  try {
    const decoded = atob(qrData);
    const parts = decoded.split(":");
    
    if (parts.length !== 4) return null;
    
    const [registrationId, timestamp, expiresAt, providedSignature] = parts;
    const payload = `${registrationId}:${timestamp}:${expiresAt}`;
    
    // Verify signature
    const secret = Deno.env.get("QR_SECRET") || "default-secret-change-in-production";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signatureBytes = Uint8Array.from(atob(providedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(payload)
    );
    
    if (!isValid) return null;
    
    // Check expiration
    const now = Date.now();
    const expiresAtNum = parseInt(expiresAt);
    if (now > expiresAtNum) {
      throw new Error("QR code has expired");
    }
    
    return {
      registrationId,
      timestamp: parseInt(timestamp),
      expiresAt: expiresAtNum
    };
  } catch (error) {
    console.error("QR verification error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify authentication
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

    const { qrCode } = await req.json();

    if (!qrCode || typeof qrCode !== "string") {
      throw new Error("Invalid QR code format");
    }

    // Verify and decode QR code
    const qrData = await verifyQRCode(qrCode);
    if (!qrData) {
      throw new Error("Invalid or tampered QR code");
    }

    const { registrationId } = qrData;

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user is a club leader for this event
    const { data: registration, error: regError } = await supabaseAdmin
      .from("event_registrations")
      .select("event_id, user_id, checked_in_at, events(club_id)")
      .eq("id", registrationId)
      .eq("qr_code", qrCode)
      .single();

    if (regError || !registration) {
      throw new Error("Registration not found");
    }

    // Check if already checked in
    if (registration.checked_in_at) {
      return new Response(
        JSON.stringify({ success: false, error: "Already checked in", registration }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is club leader (RLS will also check this)
    const { data: isLeader } = await supabaseAdmin
      .rpc("is_club_leader", { 
        _user_id: user.id, 
        _club_id: (registration.events as any).club_id 
      });

    if (!isLeader) {
      throw new Error("Only club leaders can check in attendees");
    }

    // Check in the attendee
    const { data, error } = await supabaseAdmin
      .from("event_registrations")
      .update({ checked_in_at: new Date().toISOString() })
      .eq("id", registrationId)
      .eq("qr_code", qrCode)
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
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 
                   error instanceof Error && error.message.includes("QR code has expired") ? 410 : 500;
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
