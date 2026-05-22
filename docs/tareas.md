## 📋 Tareas Asignadas

1. Agregar un empleado (cocinero) desde admin. ✅
* Mostrar que funciona el lector de QR del DNI y que los campos del formulario se completan automáticamente. ✅
---
2. Agregar un nuevo plato desde el cocinero. ✅
* Una vez credo el plato verificar la existencia en el catálogo. ✅
---
3. Agregar una nueva bebida desde el cantinero. ✅
* Una vez credo la bebida verificar su existencia en el catálogo. ✅
---
4. Agregar una nueva mesa desde supervisor. ✅
* Una vez que se crea la mesa mostrar el QR correspondiente. ✅
* Verificar la existencia de la nueva mesa. ✅
---
**PUNTOS 5-6-7-8 SE MUESTRAN JUNTOS** <br>

5. Crear un cliente registrado desde el cliente. ✅
* Mostrar nuevamente que el lector del QR del DNI funcine. ✅
* Validamos que si algun campo falta por completar no se envia el formulario. ✅
* Aclarar que una vez que se crea el cliente se redirige al login a la espera de la aprobación del administrador. ✅
* Mostrar que nos llega un correo indicando el estado "pendiente". ✅
* Mostrar que queremos ingresar a la app y nos indica que no podemos ingresar aun. ✅
---
6. Verificar ingreso del cliente registrado desde supervisor. ✅
* Mostramos que nos llego una push notificación de que un cliente solicita acceso. ✅
* luego mostramos que dicho clientes aparece en la lista de "aprobar clientes" y que podemos aprobarlo o rechazarlo. ✅
---
7. Rechazar a un cliente registrado desde admin. ✅
* Al realizar esta acción, al usuario le llega un correo electronico indicando que su solicitud ha sido rechazada. ✅
* Mostramos el correo recibido y que se visualiza claramente su rechazo y el logo de la empresa. ✅
* Mostramos que el cliente intente ingresar a la app y se le indique que no puede ingresar debido al rechazo. ✅
---
8. Aceptar a un cliente registrado desde admin. ✅
* Para agilizar este punto se cambia el estado del cliente rechazado anteriormente a "cliente_pendiente" en la base de datos. ✅
* Desde el panel del admin vemos nuevamente al cliente y lo aceptamos. ✅
* El cliente recibe un correo electrónico de aceptación mostramos el mensaje personalizado y el logo de la app. ✅
* Ingresamos a la app como cliente registrado. ✅
* Continua en el punto 10
---
9. Ingresar al local como cliente anonimo. ✅
* Ingresamos nombre y foto y nos registramos. ✅
* Mostramos que no necesitamos aprobación para ingresar. ✅
* Antes de escanear el QR de entrada, procedemos a escanear el QR de cualquier mesa y vemos que la app nos indica que "debemos colocarnos en la lista de espera" ✅
* Procedemos a escanear el QR de entrada y posteriormente visualizamos las encuestas de satisfacción previas. ✅
* Luego, volvemos atras y nos colocamos en la "Lista de espera". ✅
* Desde el Metre vemos que nos llego una notificación indicando que hay un nuevo cliente en la lista de espera. ✅
* Desde el Metre verificamos que aparecemos en la lista de espera. ✅
---
10. Asignar una mesa a un cliente registrado desde el Metre. ✅
* Continuando desde el punto 8. ✅
* Escaneamos el QR de entrada y rapidamente nos colocamos en la lista de espera. ✅
* Desde el Metre verificamos nuevamente que este cliente aparece en la lista de espera y le asignamos una mesa. ✅
* El cliente recibe una notificación que indica cual mesa fue asignada. ✅
* Procedemos a escanear el QR de otra mesa, para mostrar que no nos podemos vincular a esa mesa (nos indica cual es). ⏳
* Procedemos a escanear el QR de nuestra mesa y nos vinculamos correctamente. El cliente procede a ver el menú. ⏳
* Mostramos que la mesa asignada no esta disponible para otro cliente. ✅
---
11. Continuando con el punto 10 mostramos que como cliente podemos ver el menú de los productos disponibles. ⏳
* Volvemos para atras y mostramos que podemos hacer una consulta al mozo. ⏳
* Realizamos una consulta y al mozo le llega una push notificación. ⏳
* Desde el panel del mozo vemos la consulta y respondemos. ⏳
* Al cliente le llega una push notification de que el mozo le respondio la consulta y mostramos el mensaje recibido. ⏳
---
12. Realizar el pedido para todos los comensales de la mesa. ⏳
* **En este punto participamos LOS TRES: cliente, mozo y cocinero. Realizamos los puntos 12, 13 y 14 juntos.**
* Realizamos un pedido con varias cantidades y mostramos luego el listado con el precio grande (en el carrito). Agregar dos postres al pedido ya que luego lo vamos a necesitar. ⏳
* Indicamos que podemos ver el tiempo estimado de elaboracion. ⏳
* Terminamos de realizar el pedido (y nos redirige al menú) y al mozo le llega una push notification. ⏳
* Desde el panel del cocinero vemos que no nos llego ningun pedido, porque primero lo tiene que confirmar el mozo. ⏳
* El cliente vuelve a escanear el QR de la mesa y ve que su pedido esta pendiente de confirmacion. ⏳
---
13. Luego de que el mozo recibio la notificación del pedido, procede a rechazarlo, para que el cliente lo modifique. ⏳
* El cliente modifica el pedido, elimina uno de los postres y agrega una bebida. Y lo envia nuevamente. ⏳
* Le llega una notificación al mozo del pedido. ⏳
---
14. El mozo confirma el pedido, y esto es derivado al sector correspondiente. ⏳
* Estando logueado como cocinero mostramos que nos llego una notificación de un nuevo pedido de preparación. ⏳
* Mostramos que el pedido se encuentra en la cola de preparacion. ⏳
* El cliente escanea el QR de mesa nuevamente y ve que su pedido esta en preparación. ⏳
* Vuelve atras para acceder a los juegos. ⏳
---
15. Acceder a los juegos
* El cliente visualiza los tres juegos disponibles. ⏳
* Cada juego indicara que porcentaje de descuento le corresponde en caso de ganar SOLO EN EL PRIMER INTENTO DEL PRIMER JUEGO QUE SELECCIONE. ⏳
* Jugar un juego y obtener el descuento, que se podra visualizar en el "estado del pedido". ⏳
* Jugar a otro juego y verificar que no se obtuvo otro descuento, ya que no es acumulativo. ⏳
---
16. Recepción de los productos correspondientes
---
17. Recepción de los productos correspondientes
---
18. Realizar las tareas correspondientes
---
19. Entrega del pedido completo
---
20. Acceder a la encuesta de satisfacción
---
21. Solicitar cuenta al mozo
---
22. Confirmar el pago y liberar mesa
---