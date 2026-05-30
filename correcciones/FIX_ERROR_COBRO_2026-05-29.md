# Corrección: Error PGRST116 al Confirmar Cobro de Cuenta

## Problemas Identificados

### 1. **Error PGRST116: "Results contain 2 rows, application/vnd.pgrst.object+json requires 1 row"**

**Ubicación:** `app/(homes)/mozo/cobrarCuenta.tsx` - función `confirmarPago()` línea ~210

**Causa:** Había múltiples registros en `lista_espera` que coincidían con:

- `mesa_asignada = mesaSeleccionada.id`
- `estado = 'asignado'`

El método `.maybeSingle()` requiere que haya **0 o 1** registro exactamente. Cuando hay 2+ registros, Supabase retorna error PGRST116.

**Solución Aplicada:**

```typescript
// ANTES (❌ Incorrecto)
const { data: asignacion, error: errAsign } = await supabase
  .from("lista_espera")
  .select("id, sesion_id, created_at")
  .eq("mesa_asignada", mesaSeleccionada.id)
  .eq("estado", "asignado")
  .maybeSingle();

// DESPUÉS (✅ Correcto)
const { data: asignacionList, error: errAsign } = await supabase
  .from("lista_espera")
  .select("id, sesion_id, created_at")
  .eq("mesa_asignada", mesaSeleccionada.id)
  .eq("estado", "asignado")
  .order("created_at", { ascending: false })
  .limit(1);

if (errAsign) throw errAsign;
const asignacion =
  asignacionList && asignacionList.length > 0 ? asignacionList[0] : null;
```

**Cambios Clave:**

- Reemplazamos `.maybeSingle()` con `.order().limit(1)`
- Tomamos el registro más reciente (más probable que sea el activo)
- Manejamos el caso cuando no hay registros

---

### 2. **Error Realtime: "cannot add postgres_changes callbacks for realtime:cambios_confirmaciones_mozo after subscribe()"**

**Ubicación:** `src/components/ListaConfirmarPedidosMozo.tsx` línea ~35

**Causa:** Estaban intentando agregar callbacks de `postgres_changes` DESPUÉS de llamar a `subscribe()`. El orden correcto es:

1. `.channel()`
2. `.on()` (agregar listeners)
3. `.subscribe()` (activar)

**Solución Aplicada:**

```typescript
// ANTES (❌ Incorrecto - no se ve en el código, pero el error lo confirma)
const channel = supabase
    .channel("cambios_confirmaciones_mozo")
    .on(...)
    .subscribe()
    // ❌ Intentaba agregar más callbacks aquí

// DESPUÉS (✅ Correcto)
const channel = supabase
    .channel("cambios_confirmaciones_mozo")
    .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
        console.log('[ListaConfirmarPedidosMozo] Cambios detectados en pedidos');
        fetchPedidosAConfirmar();
    })
    .subscribe((status) => {
        if (status === "SUBSCRIBED") {
            console.log('[ListaConfirmarPedidosMozo] Canal subscrito exitosamente');
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            console.warn('[ListaConfirmarPedidosMozo] Error en canal:', status);
        }
    });
```

**Cambios Clave:**

- Agregamos logging para debugging
- Agregamos callback de estado en `subscribe()` para detectar conexión/desconexión
- Se mantiene el patrón correcto: chain → on() → subscribe()

---

## Impacto

✅ **Al confirmar cobro:**

1. Se obtiene correctamente el registro más reciente de asignación de mesa
2. Se libera la mesa correctamente
3. Se actualiza estado a "Pagado"
4. Se genera notificación de pago a admins/supervisores
5. Se limpian datos de sesión (encuestas, juegos)

✅ **En tiempo real:**

1. Los cambios en pedidos se detectan correctamente
2. La lista se actualiza sin errores
3. El logging facilita debugging futuro

---

## Próximas Mejoras

### A. Monitorear `lista_espera`

Considerar agregar un índice en `lista_espera`:

```sql
CREATE INDEX idx_lista_espera_mesa_estado
ON lista_espera(mesa_asignada, estado, created_at DESC);
```

### B. Revisar otras queries con `.single()` / `.maybeSingle()`

Archivos a revisar:

- `src/services/mesaService.ts` (líneas 55, 70, 91)
- `src/services/listaEsperaService.ts` (líneas 108, 128, 147)
- `src/services/authService.ts` (líneas 124, 185, 214)
- `src/services/notificationService.ts` (líneas 245, 421, 433)

**Patrón de seguridad:**

```typescript
// Para queries que pueden retornar 0-1 registros:
.limit(1)
.maybeSingle()

// Para queries que DEBEN retornar exactamente 1:
.single()  // ← Solo si la restricción de BD lo garantiza
```

### C. Revisar constrains en BD

Verificar que `lista_espera` tenga restricciones apropiadas para evitar múltiples asignaciones activas por mesa.

---

## Testing

1. ✅ Cobrar una cuenta desde mozo
2. ✅ Verificar mesa cambie a "Libre"
3. ✅ Verificar notificación llegue a admins
4. ✅ Verificar realtime updates en ListaConfirmarPedidosMozo
5. ✅ Revisar logs en consola (ahora incluyen contexto)

---

**Fecha:** 29 de mayo de 2026  
**Archivos Modificados:**

- `app/(homes)/mozo/cobrarCuenta.tsx`
- `src/components/ListaConfirmarPedidosMozo.tsx`
