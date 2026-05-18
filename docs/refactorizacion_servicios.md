# Refactorización: Eliminación de Queries Inline en Pantallas

## ¿Cuál era el problema?

Antes de esta refactorización, muchas pantallas de la app importaban directamente el cliente de Supabase y hacían queries a la base de datos dentro del mismo archivo de UI:

```ts
// ❌ ANTES — en asignarMesa.tsx (pantalla de UI)
import { supabase } from '@/src/services/SupabaseClient';

const fetchListaEspera = async () => {
    const { data, error } = await supabase
        .from('lista_espera')
        .select('id, cliente_id, nombre, tipo, estado')
        .eq('estado', 'pendiente');

    // ... más queries anidadas a usuarios, mesas, etc.
};
```

Esto estaba ocurriendo en aproximadamente **13 archivos** de pantallas y componentes.

---

## ¿Qué hicimos?

Creamos una **capa de servicios de datos** que centraliza todas las queries de Supabase:

| Service creado | Responsabilidad |
|:---|:---|
| `mesaService.ts` | Todo lo relacionado a la tabla `mesas` |
| `listaEsperaService.ts` | Todo lo relacionado a la tabla `lista_espera` |
| `productoService.ts` | Todo lo relacionado a la tabla `productos` |
| `pedidoService.ts` | Todo lo relacionado a la tabla `pedidos` |
| `encuestaService.ts` | Todo lo relacionado a la tabla `encuestas` |
| `authService.ts` *(extendido)* | Se agregaron: `registrarAnonimo()`, `obtenerClientesPendientes()`, `procesarAprobacion()` |

Ahora las pantallas delegan el acceso a datos al service correspondiente:

```ts
// ✅ DESPUÉS — en asignarMesa.tsx
import { ListaEsperaService } from '@/src/services/listaEsperaService';
import { MesaService } from '@/src/services/mesaService';

const fetchListaEspera = async () => {
    const lista = await ListaEsperaService.obtenerPendientes();
    const mesas = await MesaService.obtenerLibres();
    // ...
};
```

---

## ¿Por qué esto es mejor? Los 5 beneficios concretos

### 1. 🧩 Separación de responsabilidades (SRP)
**Antes:** Una pantalla hacía dos cosas a la vez — renderizar UI y buscar datos en la base de datos.  
**Después:** Cada archivo tiene una sola razón para cambiar:
- Si cambia la lógica de negocio → tocás el service.
- Si cambia el diseño de la pantalla → tocás el componente.

### 2. ♻️ Reutilización de código
**Antes:** Si dos pantallas necesitaban la misma query (ej: `obtenerPendientes()`), el código se copiaba y pegaba en cada una.  
**Después:** Existe una sola fuente de verdad. Si la query cambia (ej: se agrega un filtro), se modifica en un único lugar y todas las pantallas que la usan se actualizan automáticamente.

```ts
// Una sola función, usada desde home.tsx, homeAnonimo.tsx, asignarMesa.tsx...
await ListaEsperaService.agregarClienteRegistrado({ nombre, foto, clienteId });
```

### 3. 🔒 Encapsulamiento de detalles técnicos
Las pantallas ya no necesitan saber:
- Cuál es el nombre exacto de la tabla en Supabase
- Qué campos seleccionar con `.select()`
- Cómo construir los filtros `.eq()`, `.in()`, `.order()`
- Cómo manejar los errores de Supabase

Esos detalles viven en el service. La pantalla solo llama a una función con un nombre claro.

### 4. 🐛 Mantenimiento y debugging más sencillo
**Escenario real:** La tabla `lista_espera` en Supabase cambia el nombre de la columna `estado` a `estado_actual`.  
- **Antes:** Había que buscar y corregir ese string en 5 pantallas distintas. Fácil olvidarse de una.  
- **Después:** Se corrige en un solo archivo (`listaEsperaService.ts`) y se resuelve para toda la app.

### 5. 🧪 Testabilidad (preparación para el futuro)
Si en algún momento quieren agregar tests unitarios:
- **Antes:** Para testear la lógica de "agregar a lista de espera" necesitaban renderizar la pantalla entera, mockear la navegación, los permisos de cámara, etc.
- **Después:** Hacen `ListaEsperaService.agregarClienteRegistrado({...})` en un test simple y verifican el resultado, sin UI de por medio.

---

## Lo que se mantuvo igual (y por qué)

No todo `supabase` fue eliminado de las pantallas:

| Caso | Motivo |
|:---|:---|
| `supabase.channel(...)` en `estadoMesas`, `asignarMesa`, `ListaPedidosPendientes` | Las suscripciones Realtime son **estado de UI** — reaccionan a eventos y actualizan el estado local del componente. Abstraerlas en un service no agrega valor real. |
| `supabase.auth.getSession()` en `escanearMesa` | Es una consulta de sesión activa del usuario autenticado, no una query de negocio. |
| `supabase` en `AuthContext.tsx` | El listener `onAuthStateChange` es infraestructura del contexto de autenticación global. |

---

## El principio detrás de todo esto

> **"Las pantallas son tontas, los servicios son inteligentes."**

Una pantalla debería solo preocuparse de: *¿cómo muestro esto?*  
Un service se preocupa de: *¿cómo obtengo/guardo esto?*

Esta separación es la base de arquitecturas escalables como **Clean Architecture**, **MVVM** y **Repository Pattern**, muy comunes en apps móviles profesionales.
