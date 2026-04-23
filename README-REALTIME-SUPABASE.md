# Guía: Notificaciones In-App usando Supabase Realtime en Angular / Ionic

Este documento explica cómo armar un sistema de notificaciones "In-App" (dentro de la aplicación) utilizando los canales de **Supabase Realtime**. Este enfoque es extremadamente útil para cualquier proyecto donde necesites que los usuarios reciban alertas al instante (chats, nuevos pedidos, cambios de estado) sin depender de sistemas externos y complejos como Firebase Cloud Messaging o Apple Push Notifications (APNs).

---

## 1. El Concepto: ¿Por qué no usar notificaciones Push tradicionales?

Las notificaciones Push (las que te llegan al celular aunque la app esté cerrada) requieren:
- Generar certificados de Apple y Google.
- Crear funciones backend (Edge Functions) para dispararlas.
- Pedir permisos explícitos al usuario en el teléfono.
- Lidiar con reglas de ahorro de batería de cada marca de celular.

**La alternativa In-App (Realtime)** funciona solamente cuando la aplicación está abierta (o en segundo plano temporal), pero a cambio es **inmediata, muy barata y fácil de implementar**. 

Consiste en usar la capacidad de Supabase de enviar un "evento" a través de WebSockets (una conexión constante y rápida de internet) exactamente en el mismo milisegundo en que ocurre un cambio en la base de datos (un `INSERT`, `UPDATE` o `DELETE`).

---

## 2. Configuración en la Base de Datos (Supabase)

Para que una tabla pueda emitir estas "señales de radio", primero debe estar habilitada en la configuración de Supabase.

1. Ve al panel de Supabase.
2. Entra a **Database** -> **Replication** (o "Realtime").
3. Activa la tabla que quieres escuchar (en tu caso fue la tabla `consultas`).

*Si la tabla no tiene activado el Realtime, tu app intentará conectarse pero Supabase no le enviará las señales.*

---

## 3. El Flujo de Código Paso a Paso

### Paso A: Encender la Antena (Suscribirse)

Normalmente esto se hace en la pantalla principal del rol que va a recibir las notificaciones (ej: `home-mozo`, o un `Dashboard`).

Usamos el cliente de Supabase (`this.supabase`) para crear un `channel` (canal) y suscribirnos al evento `postgres_changes`.

```typescript
// Declaramos una variable global en la clase para guardar la conexión
private miSuscripcion: any;

encenderAntena() {
  // 1. Elegimos un nombre para el canal (puede ser cualquiera)
  this.miSuscripcion = this.supabase
    .channel('mi-canal-de-alertas')
    
    // 2. Definimos qué tabla y qué evento queremos escuchar.
    // En este caso: evento INSERT en la tabla 'pedidos'
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
      
      // 3. ACA RECIBIMOS LA SEÑAL. 'payload.new' trae los datos recién insertados.
      const nuevoDato = payload.new;
      
      // Filtramos para asegurarnos que la notificación es para nosotros
      // (Ejemplo: Solo mostrar si el pedido NO lo hice yo mismo)
      if (nuevoDato['creado_por'] !== miIdUsuario) {
         
         // 4. Mostramos la notificación visual en pantalla
         this.mostrarToast(`Nuevo pedido de la mesa ${nuevoDato['mesa_id']}`);
         
         // 5. Reproducimos un sonido (opcional pero muy útil)
         this.reproducirSonido();
      }
    })
    
    // 6. Activamos la escucha
    .subscribe();
}
```

### Paso B: El Efecto Visual (Toast In-App)

Para que el usuario se entere, no basta con recibir la señal. Hay que mostrar algo en pantalla. En Ionic, el componente `Toast` es perfecto para esto porque baja/sube suavemente en la pantalla, dura unos segundos y desaparece sin interrumpir lo que el usuario está tocando.

```typescript
import { ToastController } from '@ionic/angular';

async mostrarToast(mensaje: string) {
  const toast = await this.toastController.create({
    message: mensaje,
    duration: 4000,           // Desaparece en 4 segundos
    position: 'top',          // Arriba para simular una notificación de celular
    color: 'warning',         // Un color llamativo
    icon: 'notifications'
  });
  await toast.present();
}
```

### Paso C: Apagar la Antena (Desuscribirse)

Este paso es **crítico**. Si un usuario cambia de pantalla o cierra sesión y la antena sigue prendida, la app seguirá escuchando eventos invisibles, gastando memoria, red y batería (lo que se conoce como un *Memory Leak* o fuga de memoria).

Siempre debemos usar el evento `ngOnDestroy` de Angular para desconectarnos.

```typescript
ngOnDestroy() {
  if (this.miSuscripcion) {
    this.miSuscripcion.unsubscribe(); // Apaga la antena
    console.log("Antena desconectada.");
  }
}
```

---

## 4. Casos de Uso Interesantes para otros Proyectos

Con esta lógica estructurada, puedes agregar features en tiempo real a casi cualquier sistema:

- **Delivery / Logística:** Una tabla de `entregas` donde el conductor dispara un UPDATE a "En camino", y la app del cliente tiene un `.on('UPDATE')` que al detectar el cambio le hace aparecer un cartelito verde que dice "¡Tu pedido está en camino!".
- **Sistema de Tickets (IT):** Cuando un técnico comenta en un ticket (`INSERT` en `comentarios_ticket`), el usuario que reportó el problema ve cómo el comentario aparece mágicamente en su pantalla con un sonido.
- **Gráficos en Vivo (Dashboards):** Si tenés un panel de administrador viendo las ganancias del día, puedes hacer un `.on('INSERT', {table: 'ventas'})` que cada vez que alguien compra algo, actualice el gráfico sin que tengas que apretar F5.

## 5. Resumen del Flujo
1. **Cliente:** Inserta un dato en BD (vía POST o cliente Supabase).
2. **Supabase:** Recibe el dato, detecta que la tabla tiene *Realtime* activado, y dispara una señal por WebSocket a todas las apps abiertas.
3. **App (Receptor):** Captura la señal con `.on(...)`.
4. **Lógica Local:** Filtra si el evento le interesa y dispara un sonido / animación en pantalla para alertar al usuario actual.
