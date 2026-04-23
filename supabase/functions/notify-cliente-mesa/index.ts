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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let payload: any = {};
  try {
    payload = await req.json();
  } catch (e) {
    console.log("No JSON body provided");
  }
  
  const { cliente_id, tipo, numero_mesa } = payload;
  
  if (!cliente_id || !numero_mesa) {
      return new Response(JSON.stringify({ error: "Missing cliente_id or numero_mesa" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  let token = null;

  // Si es anonimo buscamos en 'anonimos', en otro caso (e.g. cliente_reg) en 'usuarios'
  if (tipo === 'anonimo') {
    const { data } = await supabaseClient.from('anonimos').select('push_token').eq('id', cliente_id).single();
    token = data?.push_token;
  } else {
    // Para tipo registrado
    const { data } = await supabaseClient.from('usuarios').select('push_token').eq('id', cliente_id).single();
    token = data?.push_token;
  }

  if (!token) {
    return new Response(JSON.stringify({ message: "No push_token found for cliente_id" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  const message = {
    notification: {
      title: '¡Mesa asignada!',
      body: `Tu mesa asignada es la número ${numero_mesa}. ¡Acércate y disfruta!`
    },
    token: token
  };

  try {
    const response = await getMessaging().send(message);
    return new Response(JSON.stringify({ success: true, response }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
})
