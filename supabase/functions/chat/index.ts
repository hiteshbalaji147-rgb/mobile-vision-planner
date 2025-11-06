import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation schema for messages
interface Message {
  role: string;
  content: string;
}

function validateMessages(messages: any): Message[] {
  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array");
  }
  
  if (messages.length === 0 || messages.length > 10) {
    throw new Error("Messages array must contain 1-10 messages");
  }
  
  return messages.map((msg, index) => {
    if (!msg.role || !msg.content) {
      throw new Error(`Message at index ${index} missing role or content`);
    }
    
    if (typeof msg.role !== "string" || typeof msg.content !== "string") {
      throw new Error(`Message at index ${index} has invalid types`);
    }
    
    if (msg.content.length > 2000) {
      throw new Error(`Message at index ${index} exceeds 2000 character limit`);
    }
    
    if (!["user", "assistant", "system"].includes(msg.role)) {
      throw new Error(`Message at index ${index} has invalid role`);
    }
    
    return { role: msg.role, content: msg.content };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    
    // Validate messages
    const validatedMessages = validateMessages(messages);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant for ClubTuner, a college club management app. Help users find clubs, discover events, and navigate the platform. Be friendly and concise." 
          },
          ...validatedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Log detailed error server-side only
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      
      // Return generic error to client
      return new Response(JSON.stringify({ error: "Operation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    // Log detailed error server-side only
    console.error("chat error:", e);
    
    // Return generic error to client
    return new Response(JSON.stringify({ error: "Operation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
