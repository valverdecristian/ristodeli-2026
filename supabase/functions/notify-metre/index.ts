import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { initializeApp, cert } from "npm:firebase-admin/app";
import { getMessaging } from "npm:firebase-admin/messaging";

const getServiceAccount = () => {
    try {
        return JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
    } catch (e) {
        return {};
    }
}

try {
  initializeApp({
    credential: cert(getServiceAccount())
  });
} catch (e) {
  // It might already be initialized if function is warm
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("Notificación al Metre disparada");
  let payload: any = {};
  
  try {
    payload = await req.json();
  } catch (e) {
    console.log("No JSON body provided");
  }
  
  const nombreCliente = payload.nombreCliente || 'Un cliente';

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Fetch metres
  const { data: metres, error: dbError } = await supabaseClient
    .from('usuarios')
    .select('perfil, push_token')
    .eq('perfil', 'metre');

  if (dbError) {
      console.error("Error consultando metres:", dbError);
  }

  if (!metres || metres.length === 0) {
    return new Response(JSON.stringify({ message: "No metres to notify" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  // extract tokens and filter nulls or empties
  const tokens = metres.map(m => m.push_token).filter(t => t && t.trim().length > 0);
  console.log("Tokens de metre encontrados para enviar:", tokens);
  
  if (tokens.length === 0) {
     return new Response(JSON.stringify({ message: "Metres have no tokens" }), { 
       headers: { ...corsHeaders, "Content-Type": "application/json" } 
     });
  }

  const message = {
    notification: {
      title: '¡Nueva solicitud de mesa!',
      body: `${nombreCliente} ha solicitado una mesa y está en lista de espera.`
    },
    tokens: tokens
  };

  try {
    console.log("Enviando push notification a FCM para metres...");
    const response = await getMessaging().sendEachForMulticast(message);
    console.log("Respuesta de FCM:", JSON.stringify(response));
    return new Response(JSON.stringify({ success: true, response }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    console.error("Error en FCM:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
})
