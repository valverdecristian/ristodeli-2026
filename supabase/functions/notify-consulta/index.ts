import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  const payload = await req.json();
  const record = payload.record;
  if (!record) return new Response("No record", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("perfil, nombres, apellidos")
    .eq("id", record.id_usuario)
    .single();

  if (!usuario) return new Response("User not found", { status: 404 });

  const esCliente = usuario.perfil.startsWith("cliente_");

  const { data: mesa } = await supabase
    .from("mesas")
    .select("numero")
    .eq("id", record.mesa_id)
    .single();

  const nroMesa = mesa?.numero || "--";

  let tokens: string[] = [];
  let titulo = "";
  let cuerpo = "";

  if (esCliente) {
    titulo = `Mesa N° ${nroMesa}`;
    cuerpo = record.mensaje;

    const { data: mozos } = await supabase
      .from("usuarios")
      .select("push_token")
      .eq("perfil", "mozo")
      .not("push_token", "is", null);

    tokens = (mozos ?? [])
      .map((m) => m.push_token)
      .filter((t) => t && t.startsWith("ExponentPushToken"));
  } else {
    const nombreMozo =
      `${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim();
    titulo = `${nombreMozo} te respondió`;
    cuerpo = record.mensaje;

    const { data: asignacionList, error: asignErr } = await supabase
      .from("lista_espera")
      .select("cliente_id")
      .eq("mesa_asignada", record.mesa_id)
      .eq("estado", "asignado")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!asignErr && asignacionList && asignacionList.length > 0) {
      const asignacion = asignacionList[0];

      if (asignacion?.cliente_id) {
        const { data: cliente, error: clienteErr } = await supabase
          .from("usuarios")
          .select("push_token")
          .eq("id", asignacion.cliente_id)
          .single();

        if (
          !clienteErr &&
          cliente?.push_token &&
          cliente.push_token.startsWith("ExponentPushToken")
        ) {
          tokens = [cliente.push_token];
        } else {
          console.warn(
            `[notify-consulta] No se pudo obtener token válido para cliente ${asignacion.cliente_id}`,
            clienteErr?.message || "Token inválido",
          );
        }
      }
    }
  }

  if (tokens.length === 0) return new Response("No tokens", { status: 200 });

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      tokens.map((t) => ({
        to: t,
        sound: "default",
        title: titulo,
        body: cuerpo,
      })),
    ),
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
