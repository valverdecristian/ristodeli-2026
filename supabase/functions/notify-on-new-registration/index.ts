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

serve(async (req) => {
  console.log("Notificación de Nuevo Registro disparada");
  const payload = await req.json();
  console.log("Payload recibido:", JSON.stringify(payload));
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Fetch admins and supervisors
  const { data: admins, error: dbError } = await supabaseClient
    .from('usuarios')
    .select('perfil, push_token')
    .in('perfil', ['admin', 'supervisor']);

  if (dbError) {
      console.error("Error consultando admins:", dbError);
  }

  if (!admins || admins.length === 0) {
    return new Response(JSON.stringify({ message: "No admins to notify" }), { headers: { "Content-Type": "application/json" } });
  }

  // extract tokens and filter nulls or empties
  const tokens = admins.map(a => a.push_token).filter(t => t && t.trim().length > 0);
  console.log("Tokens encontrados para enviar:", tokens);
  
  if (tokens.length === 0) {
     return new Response(JSON.stringify({ message: "Admins have no tokens" }), { headers: { "Content-Type": "application/json" } });
  }

  const message = {
    notification: {
      title: 'Nuevo cliente registrado',
      body: `Un usuario nuevo (${payload.record?.nombres || 'Cliente'}) ha solicitado aprobación.`
    },
    tokens: tokens
  };

  try {
    console.log("Enviando push notification a FCM...");
    const response = await getMessaging().sendEachForMulticast(message);
    console.log("Respuesta de FCM:", JSON.stringify(response));
    return new Response(JSON.stringify({ success: true, response }), { headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error en FCM:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
})
