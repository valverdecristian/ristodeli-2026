import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
  console.log("Notificación de Aprobación disparada");
  const payload = await req.json();
  console.log("Payload recibido:", JSON.stringify(payload));
  
  // AJUSTE 1: Escuchamos cuando el perfil viejo era 'cliente_pendiente'
  if (payload.type === 'UPDATE' && payload.old_record?.perfil === 'cliente_pendiente') {
    
    const nuevoPerfil = payload.record?.perfil;

    // AJUSTE 2: Si el nuevo perfil es 'cliente_registrado'
    if (nuevoPerfil === 'cliente_registrado') {
      // --- LOGICA DEL APROBADO ---

      // 1. Enviar correo de Bienvenida
      if (payload.record?.email) {
        const htmlAprobado = `
        <div style="font-family: Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8EECB; border-radius: 12px; overflow: hidden; border: 1px solid #31603D;">
          <div style="background-color: #31603D; padding: 25px; text-align: center;">
            <img src="https://wtjylfdfdwowzzvunlpa.supabase.co/storage/v1/object/public/avatares/icon.png" alt="Ristodeli" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid #F5C065; object-fit: cover; margin-bottom: 15px; background-color: #F8EECB;" />
            <h1 style="color: #F5C065; margin: 0; letter-spacing: 2px;">RISTODELI</h1>
          </div>
          <div style="padding: 30px; color: #6E433D; line-height: 1.6;">
            <h2 style="color: #31603D;">¡Felicitaciones ${payload.record.nombres}!</h2>
            <p>Tu cuenta ha sido formalmente <span style="background-color:#31603D; padding: 4px 8px; border-radius: 4px; color:#F8EECB; font-weight:bold;">Aprobada</span>. Ya puedes ingresar a la aplicación oficial de Ristodeli y disfrutar de la mejor comida.</p>
            <p>Esperamos verte pronto en el local. Recuerda que puedes consultar al mozo o pedir tu menú directamente escaneando el código QR de tu mesa.</p>
            <br/>
            <p>¡Buen provecho!<br><strong>El equipo de Ristodeli</strong></p>
          </div>
          <div style="background-color: #6E433D; padding: 15px; text-align: center; color: #F8EECB; font-size: 12px;">
            © 2026 Ristodeli. Todos los derechos reservados.
          </div>
        </div>
        `;
        console.log("Enviando correo de bienvenida al cliente: " + payload.record.email);
        await sendBrevoEmail(payload.record.email, payload.record.nombres, "¡Bienvenido a Ristodeli! Tu cuenta ha sido aprobada", htmlAprobado);
      }

      // 2. Enviar notificacion push
      const token = payload.record.push_token;
      if (token) {
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
        } catch (error: any) {
          console.error("Error en FCM:", error);
        }
      }

    // AJUSTE 3: Si el nuevo perfil es 'cliente_rechazado'
    } else if (nuevoPerfil === 'cliente_rechazado') {
      // --- LOGICA DEL RECHAZO ---

      // 1. Enviar correo de Rechazo
      if (payload.record?.email) {
        const htmlRechazado = `
        <div style="font-family: Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8EECB; border-radius: 12px; overflow: hidden; border: 1px solid #D23D2D;">
          <div style="background-color: #D23D2D; padding: 25px; text-align: center;">
            <img src="https://wtjylfdfdwowzzvunlpa.supabase.co/storage/v1/object/public/avatares/icon.png" alt="Ristodeli" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid #F8EECB; object-fit: cover; margin-bottom: 15px; background-color: #F8EECB;" />
            <h1 style="color: #F8EECB; margin: 0; letter-spacing: 2px;">RISTODELI</h1>
          </div>
          <div style="padding: 30px; color: #6E433D; line-height: 1.6;">
            <h2 style="color: #D23D2D;">Hola ${payload.record.nombres},</h2>
            <p>Lamentamos informarte que tu solicitud de cuenta en Ristodeli ha sido <span style="background-color:#D23D2D; padding: 4px 8px; border-radius: 4px; color:#F8EECB; font-weight:bold;">Rechazada</span> por nuestro equipo.</p>
            <p>Esto puede deberse a que no pudimos validar correctamente tu identidad mediante la fotografía provista. Te invitamos a comunicarte con el local en caso de considerarlo un error.</p>
            <br/>
            <p>Gracias por tu interés,<br><strong>El equipo de Ristodeli</strong></p>
          </div>
          <div style="background-color: #6E433D; padding: 15px; text-align: center; color: #F8EECB; font-size: 12px;">
            © 2026 Ristodeli. Todos los derechos reservados.
          </div>
        </div>
        `;
        console.log("Enviando correo de rechazo al cliente: " + payload.record.email);
        await sendBrevoEmail(payload.record.email, payload.record.nombres, "Aviso importante sobre tu cuenta en Ristodeli", htmlRechazado);
      }

      // 2. Notificacion Push para el rechazado si llegó a guardar token
      const token = payload.record.push_token;
      if (token) {
        const message = {
          notification: {
            title: 'Cuenta denegada',
            body: `Lo sentimos ${payload.record.nombres}, tu cuenta no fue aprobada.`
          },
          token: token
        };
        try {
          const response = await getMessaging().send(message);
        } catch (error: any) {
          console.error("Error en FCM:", error);
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ message: "No action taken" }), { headers: { "Content-Type": "application/json" } });
})