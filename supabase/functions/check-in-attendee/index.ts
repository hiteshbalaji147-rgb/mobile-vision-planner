import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { qrCode } = await req.json();

    if (!qrCode) {
      throw new Error("QR code is required");
    }

    // Decode QR data
    const decoded = atob(qrCode);
    const registrationId = decoded.split(":")[1];

    if (!registrationId) {
      throw new Error("Invalid QR code");
    }

    // Check in the attendee
    const { data, error } = await supabase
      .from("event_registrations")
      .update({ checked_in_at: new Date().toISOString() })
      .eq("id", registrationId)
      .eq("qr_code", qrCode)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, registration: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking in attendee:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
