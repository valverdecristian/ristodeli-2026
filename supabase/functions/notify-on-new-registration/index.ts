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

const sendBrevoEmail = async (toEmail: string, toName: string, subject: string, htmlContent: string) => {
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  if (!BREVO_API_KEY) {
      console.log("No BREVO_API_KEY found, saltando envío de correo.");
      return;
  }
  
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'Ristodeli App', email: 'ristodeliapp@gmail.com' },
            to: [{ email: toEmail, name: toName }],
            subject: subject,
            htmlContent: htmlContent
        })
    });
    const result = await response.json();
    console.log("Respuesta de Brevo:", JSON.stringify(result));
    return result;
  } catch (err) {
    console.error("Error al enviar email Brevo:", err);
  }
}

serve(async (req) => {
  console.log("Notificación de Nuevo Registro disparada");
  const payload = await req.json();
  console.log("Payload recibido:", JSON.stringify(payload));
  
  // 1. AJUSTE: Estandarizamos el estado inicial a 'cliente_pendiente'
  const isNuevoCliente = payload.record?.perfil === 'cliente_pendiente' || payload.record?.perfil === 'cliente_registrado';

  if (payload.record?.email && isNuevoCliente) {
    const htmlAvisoPendiente = `
    <div style="font-family: Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8EECB; border-radius: 12px; overflow: hidden; border: 1px solid #31603D;">
      <div style="background-color: #31603D; padding: 25px; text-align: center;">
        <!-- LOGO CIRCULAR -->
        <img src="https://wtjylfdfdwowzzvunlpa.supabase.co/storage/v1/object/public/avatares/icon.png" alt="Ristodeli" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid #F5C065; object-fit: cover; margin-bottom: 15px; background-color: #F8EECB;" />
        <h1 style="color: #F5C065; margin: 0; letter-spacing: 2px;">RISTODELI</h1>
      </div>
      <div style="padding: 30px; color: #6E433D; line-height: 1.6;">
        <h2 style="color: #31603D;">¡Hola ${payload.record.nombres}!</h2>
        <p>Tu registro en Ristodeli ha sido recibido con éxito. En este momento tu cuenta se encuentra en estado <span style="background-color:#F5C065; padding: 4px 8px; border-radius: 4px; color:#31603D; font-weight:bold;">Pendiente</span>.</p>
        <p>Nuestro equipo de supervisores ya ha sido notificado y está revisando tu solicitud. Te enviaremos un correo electrónico en cuanto tu cuenta sea aprobada para que puedas acceder a la aplicación y disfrutar de todas nuestras funcionalidades.</p>
        <br/>
        <p>¡Gracias por elegirnos!<br><strong>El equipo de Ristodeli</strong></p>
      </div>
      <div style="background-color: #6E433D; padding: 15px; text-align: center; color: #F8EECB; font-size: 12px;">
        © 2026 Ristodeli. Todos los derechos reservados.
      </div>
    </div>
    `;
    console.log("Enviando correo de aviso al cliente: " + payload.record.email);
    // [cite: 188] Se enviará automáticamente un correo informando la situación.
    await sendBrevoEmail(payload.record.email, payload.record.nombres, "Tu registro en Ristodeli está en revisión", htmlAvisoPendiente);
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // 2. AJUSTE: Agregamos 'dueño' a la consulta de notificaciones push
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

  // 3. AJUSTE: Filtramos por los roles válidos de la nueva app
  const perfilesValidos = ['cliente_pendiente', 'cliente_registrado', 'cliente_rechazado'];
  if (!perfilesValidos.includes(payload.record?.perfil)) {
    return new Response(JSON.stringify({ message: "El perfil no requiere aprobación ni notificación push." }), { headers: { "Content-Type": "application/json" } });
  }

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