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
  console.log("Notificación de Aprobación disparada");
  const payload = await req.json();
  console.log("Payload recibido:", JSON.stringify(payload));
  
  // Verify it's an update marking the user as 'cliente_reg' from 'pendiente'
  if (payload.type === 'UPDATE' && payload.old_record?.perfil === 'pendiente' && payload.record?.perfil === 'cliente_reg') {
    const token = payload.record.push_token;
    
    if (!token) {
        return new Response(JSON.stringify({ message: "User has no push token" }), { headers: { "Content-Type": "application/json" } });
    }
    
    const message = {
      notification: {
        title: '¡Cuenta aprobada!',
        body: `Hola ${payload.record.nombres}, ya puedes acceder a Ristodeli.`
      },
      token: token
    };

    try {
      console.log("Enviando push notification a FCM...");
      const response = await getMessaging().send(message);
      console.log("Respuesta de FCM:", JSON.stringify(response));
      return new Response(JSON.stringify({ success: true, response }), { headers: { "Content-Type": "application/json" } });
    } catch (error: any) {
      console.error("Error en FCM:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  return new Response(JSON.stringify({ message: "No action taken" }), { headers: { "Content-Type": "application/json" } });
})
