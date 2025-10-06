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

    const { registrationId } = await req.json();

    if (!registrationId) {
      throw new Error("Registration ID is required");
    }

    // Generate QR code data (encrypted registration ID)
    const qrData = btoa(`EVENT_CHECKIN:${registrationId}:${Date.now()}`);

    // Update registration with QR code
    const { error } = await supabase
      .from("event_registrations")
      .update({ qr_code: qrData })
      .eq("id", registrationId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ qrCode: qrData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating QR code:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
