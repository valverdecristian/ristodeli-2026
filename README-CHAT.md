# Cambios Realizados: Chat Realtime Mozo-Cliente

Se implementó la funcionalidad del chat en tiempo real adaptando el código sugerido a la estructura de la aplicación y base de datos de Ristodeli. A continuación se detallan los cambios y el por qué de cada uno:

## 1. Interfaz de Mensaje (`src/app/core/models/mensaje.ts`)
**Qué se hizo**: Se creó la interfaz `Mensaje` que mapea la estructura de la base de datos de la tabla `consultas`.
**Por qué**: Esto nos permite tipar correctamente los datos que recibimos de Supabase, incluyendo si el remitente es un cliente anónimo o uno registrado (ej. el mozo respondiendo o un cliente logueado), trayendo la relación con la tabla `anonimos` o `usuarios`.

## 2. Servicio Realtime (`src/app/core/services/realtime.service.ts`)
**Qué se hizo**: Se reescribió el servicio para conectarse a Supabase y utilizar sus canales (`channels`) para el realtime de la tabla `consultas`.
**Por qué**: Este servicio provee `traerTodosLosMensajes(mesaId)` para cargar el historial de la conversación al entrar, y `crearMensaje(mesaId, texto)` para insertar un nuevo mensaje en base de datos de forma segura (detectando automáticamente si el que manda es el mozo (usuario registrado) o un cliente anónimo a través de `AuthService` y `localStorage`).

## 3. Interfaz del Chat (`src/app/features/chat/chat/chat.page.*`)
**Qué se hizo**:
- **TS**: Se adaptó el componente usando Signals como en el ejemplo proporcionado, inyectando `RealtimeService` y el `ActivatedRoute` para capturar el `:mesaId`. Se configuró la suscripción al realtime y un método para scrollear automáticamente abajo con cada mensaje nuevo.
- **HTML**: Se integró a la vista de Ionic (`<ion-header>`, `<ion-content>`) y se mantuvo la lógica del `@for` de Angular 17+ y el cálculo de la burbuja propia o ajena.
- **SCSS**: Se aplicaron los estilos estilo "WhatsApp" usando una imagen de fondo sutil y usando el color primary de Ionic (verde/violeta según configures en tu tema) para las burbujas propias.

## 4. Botón de Consultar al Mozo (`src/app/shared/components/boton-consulta-mozo/boton-consulta-mozo.component.ts`)
**Qué se hizo**: Se actualizó para que navegue directamente al chat en vez de la página de la lista de consultas (`/consultas`), pasándole un `@Input() mesaId: string = '1'` (por defecto mesa 1, puedes inyectarlo de forma dinámica cuando integres el escaneo QR de la mesa).

## 5. Bandeja de Entrada del Mozo (`src/app/features/staff/consultas/consultas.page.*`)
**Qué se hizo**: Se cambió la vista de las consultas. En lugar de mostrar un historial lineal de mensajes mezclados, agrupa los mensajes por `mesa_id` para mostrar una "bandeja de entrada" de salas de chat. Al hacer click en una mesa, el mozo navega al chat correspondiente (`/chat/:mesaId`) y puede responder allí.
**Por qué**: Esta es la forma correcta para un chat grupal por mesas para que el mozo vea qué mesa tiene un mensaje y atienda el hilo directamente en una pantalla aparte.

## 6. Notificaciones en Tiempo Real para el Mozo (`src/app/features/staff/home-mozo/home-mozo.page.ts`)
**Qué se hizo**: Se agregó una suscripción directa al canal de consultas de Supabase cuando el mozo está en su pantalla principal (`home-mozo`). 
**Por qué**: De esta manera, si un cliente manda un mensaje y el mozo tiene la app abierta, recibe un `Toast` (una notificación en la parte superior) que dice "Mesa X: [mensaje del cliente]" y reproduce el sonido de la app. El código detecta que el mensaje *no* lo mandó el mozo actual, evitando que le lleguen notificaciones de sus propios mensajes.

Con estos cambios, tienes todo el flujo de chat listo. Ahora el cliente puede presionar el botón de "Consultar", escribir algo, y el mozo en su sección de "Consultas" verá esa mesa listada, entrará, y podrá contestar en tiempo real.
